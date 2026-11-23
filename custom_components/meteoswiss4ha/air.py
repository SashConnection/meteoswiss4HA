"""Air quality of the national monitoring network NABEL (FOEN): ozone, NO2, PM10, PM2.5.

The FOEN publishes the current situation of its 16 sites as a table, every hour.
Ozone: hourly mean now and the highest of the day; NO2, PM10, PM2.5: mean of the
last 24 hours, in µg/m³. Source: NABEL (FOEN / Empa), provisional data.
"""

from __future__ import annotations

from dataclasses import dataclass
import html
import logging
import re
from typing import Any

import aiohttp

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import distance_km
from .const import AIR_UPDATE_INTERVAL, DOMAIN

_LOGGER = logging.getLogger(__name__)

TABLE_URL = "https://bafu.meteotest.ch/nabel/tables/show/english"
TIMEOUT = aiohttp.ClientTimeout(total=30)

# Swiss ambient air quality standards (µg/m³) used by the FOEN table.
LIMITS = {"o3": 120, "o3_max": 120, "no2": 80, "pm10": 50}
LEVELS = ("good", "elevated", "high", "very_high")  # <= limit, > limit, > 1.5x, > 2x

# key: (table name, latitude, longitude, altitude, type)
SITES: dict[str, tuple[str, float, float, int, str]] = {
    "bern": ("Bern-Bollwerk", 46.9510, 7.4406, 536, "urban_traffic"),
    "lausanne": ("Lausanne-César-Roux", 46.5220, 6.6400, 530, "urban_traffic"),
    "lugano": ("Lugano-Università", 46.0110, 8.9570, 280, "urban"),
    "zurich": ("Zürich-Kaserne", 47.3775, 8.5305, 409, "urban"),
    "basel": ("Basel-Binningen", 47.5413, 7.5836, 316, "suburban"),
    "dubendorf": ("Dübendorf-Empa", 47.4031, 8.6131, 432, "suburban"),
    "harkingen": ("Härkingen-A1", 47.3119, 7.8206, 431, "rural_motorway"),
    "sion": ("Sion-Aéroport-A9", 46.2207, 7.3418, 483, "rural_motorway"),
    "magadino": ("Magadino-Cadenazzo", 46.1600, 8.9336, 203, "rural"),
    "payerne": ("Payerne", 46.8131, 6.9446, 489, "rural"),
    "tanikon": ("Tänikon", 47.4797, 8.9047, 538, "rural"),
    "beromunster": ("Beromünster", 47.1897, 8.1755, 797, "rural"),
    "chaumont": ("Chaumont", 47.0496, 6.9792, 1136, "rural_high"),
    "rigi": ("Rigi-Seebodenalp", 47.0675, 8.4633, 1031, "rural_high"),
    "davos": ("Davos-Seehornwald", 46.8155, 9.8558, 1637, "rural_high"),
    "jungfraujoch": ("Jungfraujoch", 46.5475, 7.9850, 3578, "high_alpine"),
}
_BY_NAME = {v[0]: k for k, v in SITES.items()}
VALUES = ("o3", "o3_max", "no2", "pm10", "pm25")


@dataclass
class AirData:
    """Values of every site and the time of the table."""

    time: str | None
    sites: dict[str, dict[str, float | None]]


def _cells(row: str) -> list[str]:
    cells = re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", row, re.S)
    return [html.unescape(re.sub(r"<[^>]+>", " ", c)).strip() for c in cells]


def _value(text: str) -> float | None:
    try:
        return float(text.replace("’", "").replace("'", ""))
    except ValueError:
        return None  # "—" no data, "*" not measured


def parse_table(text: str) -> AirData:
    """Parse the FOEN table (one row per site: type, name, O3, O3max, NO2, PM10, PM2.5)."""
    match = re.search(r"Data from:\s*(?:<[^>]+>\s*)*([\d.]+\s+[\d:]+)", text)
    sites: dict[str, dict[str, float | None]] = {}
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", text, re.S):
        cells = _cells(row)
        if len(cells) < 7:
            continue
        key = _BY_NAME.get(cells[1])
        if key is None:
            continue
        sites[key] = {k: _value(v) for k, v in zip(VALUES, cells[2:7], strict=False)}
    return AirData(time=match.group(1) if match else None, sites=sites)


def level(values: dict[str, float | None]) -> str | None:
    """Overall level: the worst ratio of a value to its air quality standard."""
    ratios = [values[k] / limit for k, limit in LIMITS.items() if values.get(k) is not None and k != "o3_max"]
    if not ratios:
        return None
    worst = max(ratios)
    return LEVELS[0 if worst <= 1 else 1 if worst <= 1.5 else 2 if worst <= 2 else 3]


def nearest_site(lat: float, lon: float) -> str:
    """The NABEL site nearest to home."""
    return min(SITES, key=lambda k: distance_km(lat, lon, SITES[k][1], SITES[k][2]))


def site_info(key: str) -> dict[str, Any]:
    """Name, position and type of a site."""
    name, lat, lon, alt, kind = SITES[key]
    return {"site": name, "latitude": lat, "longitude": lon, "altitude": alt, "site_type": kind}


class AirCoordinator(DataUpdateCoordinator[AirData]):
    """The FOEN air quality table, every hour."""

    def __init__(self, hass: HomeAssistant, entry, site: str) -> None:
        """Initialize the coordinator."""
        super().__init__(hass, _LOGGER, config_entry=entry, name=f"{DOMAIN} air", update_interval=AIR_UPDATE_INTERVAL)
        self.site = site

    async def _async_update_data(self) -> AirData:
        session = async_get_clientsession(self.hass)
        try:
            async with session.get(TABLE_URL, timeout=TIMEOUT) as resp:
                resp.raise_for_status()
                data = parse_table(await resp.text())
        except Exception as err:  # noqa: BLE001 - aiohttp, timeouts
            raise UpdateFailed(f"Air quality unavailable: {err}") from err
        if not data.sites:
            raise UpdateFailed("Air quality table could not be read")
        return data
