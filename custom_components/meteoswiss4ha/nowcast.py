"""Rain arriving soon: motion of the radar echoes around home ("rain in 20 minutes").

The two latest radar frames (5-minute composite, PNG on the project's radar
server) are compared around home to find how the rain moves (block matching),
then the latest frame is followed upstream to tell when rain reaches home.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
import io
import logging
import math
import struct
from typing import Any
import zlib

import aiohttp

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .const import DOMAIN, NOWCAST_UPDATE_INTERVAL, RADAR_URL

_LOGGER = logging.getLogger(__name__)

BLOCK = 4  # pixels per analysis cell (~2 km)
SEARCH = 10  # cells, maximum shift between two frames
WINDOW_KM = 120  # area around home used for the motion
HORIZON = 60  # minutes
MAX_AGE = timedelta(minutes=25)  # older radar: no nowcast
TIMEOUT = aiohttp.ClientTimeout(total=30)


def decode_alpha(png: bytes) -> tuple[int, int, bytes]:
    """Width, height and alpha channel of an RGBA PNG (Pillow if present)."""
    try:
        from PIL import Image  # noqa: PLC0415 - optional, shipped with Home Assistant

        img = Image.open(io.BytesIO(png)).convert("RGBA")
        return img.width, img.height, img.getchannel("A").tobytes()
    except ImportError:
        pass
    return _decode_alpha_pure(png)


def _decode_alpha_pure(png: bytes) -> tuple[int, int, bytes]:
    """Minimal PNG decoder (8-bit RGBA, not interlaced)."""
    pos, idat = 8, b""
    width = height = 0
    while pos < len(png):
        length, kind = struct.unpack(">I4s", png[pos : pos + 8])
        data = png[pos + 8 : pos + 8 + length]
        if kind == b"IHDR":
            width, height, depth, color = struct.unpack(">IIBB", data[:10])
            if depth != 8 or color != 6:
                raise ValueError("Unsupported PNG")
        elif kind == b"IDAT":
            idat += data
        pos += 12 + length
    raw = zlib.decompress(idat)
    stride, bpp = width * 4, 4
    out = bytearray(height * stride)
    prev = bytearray(stride)
    for y in range(height):
        f = raw[y * (stride + 1)]
        line = bytearray(raw[y * (stride + 1) + 1 : (y + 1) * (stride + 1)])
        if f == 1:
            for i in range(bpp, stride):
                line[i] = (line[i] + line[i - bpp]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                left = line[i - bpp] if i >= bpp else 0
                line[i] = (line[i] + ((left + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - bpp] if i >= bpp else 0
                b, c = prev[i], prev[i - bpp] if i >= bpp else 0
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                line[i] = (line[i] + (a if pa <= pb and pa <= pc else b if pb <= pc else c)) & 255
        out[y * stride : (y + 1) * stride] = line
        prev = line
    return width, height, bytes(out[3::4])


def cells(width: int, height: int, alpha: bytes) -> list[list[float]]:
    """Rain fraction of each BLOCK x BLOCK cell."""
    rows, cols = height // BLOCK, width // BLOCK
    grid = [[0.0] * cols for _ in range(rows)]
    for y in range(rows * BLOCK):
        base = y * width
        row = grid[y // BLOCK]
        for x in range(0, cols * BLOCK):
            if alpha[base + x] > 40:
                row[x // BLOCK] += 1
    n = BLOCK * BLOCK
    return [[v / n for v in row] for row in grid]


def _merc(lat: float) -> float:
    return math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))


@dataclass
class Geo:
    """Pixel position of a place on the radar image (Web Mercator)."""

    south: float
    west: float
    north: float
    east: float
    width: int
    height: int

    def cell(self, lat: float, lon: float) -> tuple[float, float]:
        x = (lon - self.west) / (self.east - self.west) * self.width
        y = (_merc(self.north) - _merc(lat)) / (_merc(self.north) - _merc(self.south)) * self.height
        return y / BLOCK, x / BLOCK

    def km_per_cell(self) -> float:
        return (self.east - self.west) * 111.32 * math.cos(math.radians((self.north + self.south) / 2)) / self.width * BLOCK


def motion(old: list[list[float]], new: list[list[float]], cy: float, cx: float, radius: int) -> tuple[int, int, float]:
    """Shift (dy, dx in cells) that best maps the old frame on the new one around home."""
    rows, cols = len(new), len(new[0])
    y0, y1 = max(SEARCH, int(cy) - radius), min(rows - SEARCH, int(cy) + radius)
    x0, x1 = max(SEARCH, int(cx) - radius), min(cols - SEARCH, int(cx) + radius)
    points = [(y, x) for y in range(y0, y1, 2) for x in range(x0, x1, 2) if new[y][x] > 0.2]
    if len(points) < 15:
        return 0, 0, 0.0
    best = (0, 0, -1.0)
    for dy in range(-SEARCH, SEARCH + 1):
        for dx in range(-SEARCH, SEARCH + 1):
            score = sum(1 for y, x in points if old[y - dy][x - dx] > 0.2) / len(points)
            if score > best[2] or (score == best[2] and abs(dy) + abs(dx) < abs(best[0]) + abs(best[1])):
                best = (dy, dx, score)
    return best


def nowcast(old: list[list[float]], new: list[list[float]], geo: Geo, lat: float, lon: float, minutes_between: float) -> dict[str, Any]:
    """When does the rain reach home (minutes), from where, how fast."""
    cy, cx = geo.cell(lat, lon)
    rows, cols = len(new), len(new[0])
    if not (0 <= cy < rows and 0 <= cx < cols):
        return {"state": None}
    def rain_at(y: float, x: float) -> float:
        yi, xi = int(round(y)), int(round(x))
        vals = [new[j][i] for j in range(yi - 1, yi + 2) for i in range(xi - 1, xi + 2) if 0 <= j < rows and 0 <= i < cols]
        return sum(vals) / len(vals) if vals else 0.0
    km = geo.km_per_cell()
    if rain_at(cy, cx) >= 0.3:
        return {"state": "raining", "minutes": 0}
    dy, dx, quality = motion(old, new, cy, cx, int(WINDOW_KM / km))
    speed = math.hypot(dy, dx) * km / minutes_between * 60  # km/h
    # Direction the rain comes from (0 = north).
    bearing = (math.degrees(math.atan2(-dx, dy)) + 360) % 360 if (dx or dy) else None
    result: dict[str, Any] = {"state": "none", "minutes": None, "speed": round(speed), "from_bearing": round(bearing) if bearing is not None else None,
                              "match": round(quality, 2)}
    if quality < 0.3 or not (dx or dy):
        return result
    for minutes in range(5, HORIZON + 1, 5):
        k = minutes / minutes_between
        if rain_at(cy - dy * k, cx - dx * k) >= 0.3:
            result.update(state="approaching", minutes=minutes)
            break
    return result


class NowcastCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Rain arriving at home in the next hour, every 5 minutes."""

    def __init__(self, hass: HomeAssistant, entry) -> None:
        """Initialize the coordinator."""
        super().__init__(hass, _LOGGER, config_entry=entry, name=f"{DOMAIN} nowcast", update_interval=NOWCAST_UPDATE_INTERVAL)

    async def _get(self, url: str, params=None) -> bytes:
        session = async_get_clientsession(self.hass)
        try:
            async with session.get(url, params=params, timeout=TIMEOUT) as resp:
                resp.raise_for_status()
                return await resp.read()
        except Exception as err:  # noqa: BLE001 - aiohttp and timeouts
            raise UpdateFailed(f"Radar unavailable: {err}") from err

    async def _async_update_data(self) -> dict[str, Any]:
        import json  # noqa: PLC0415

        info = json.loads(await self._get(f"{RADAR_URL}/frames"))
        frames = info.get("frames") or []
        (south, west), (north, east) = info.get("bounds") or ((45.6, 5.7), (48, 10.8))
        if len(frames) < 3:
            return {"state": None}
        latest = dt_util.parse_datetime(frames[-1])
        if latest is None or dt_util.utcnow() - latest > MAX_AGE:
            return {"state": None, "radar_time": frames[-1], "stale": True}
        old_time = frames[-3]  # 10 minutes earlier
        new_png = await self._get(f"{RADAR_URL}/frame", {"time": frames[-1]})
        old_png = await self._get(f"{RADAR_URL}/frame", {"time": old_time})
        lat, lon = self.hass.config.latitude, self.hass.config.longitude

        def compute() -> dict[str, Any]:
            w, h, a_new = decode_alpha(new_png)
            _, _, a_old = decode_alpha(old_png)
            geo = Geo(south, west, north, east, w, h)
            minutes = (latest - dt_util.parse_datetime(old_time)).total_seconds() / 60
            return nowcast(cells(w, h, a_old), cells(w, h, a_new), geo, lat, lon, minutes or 10)

        result = await self.hass.async_add_executor_job(compute)
        result["radar_time"] = frames[-1]
        if result.get("minutes") is not None:
            result["arrival"] = (latest + timedelta(minutes=result["minutes"])).isoformat()
        return result
