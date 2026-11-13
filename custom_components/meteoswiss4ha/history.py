"""Daily history of the measuring station (MeteoSwiss SwissMetNet daily values).

- ``d_recent`` (current year up to yesterday, ~50 kB): yesterday, records of
  the year, first frost and first snow of the season, rain and evaporation of
  the last days (watering).
- ``d_historical`` (since the station opened, ~6 MB, read once a week): the
  1991-2020 normal of the day (mean maximum and minimum over ±7 days).
"""

from __future__ import annotations

import csv
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
import io
import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import DEFAULT_TIMEOUT, STREAM_TIMEOUT, MeteoSwissConnectionError, parse_float
from .const import DOMAIN, HISTORY_UPDATE_INTERVAL, NORMALS_UPDATE_INTERVAL

_LOGGER = logging.getLogger(__name__)

BASE = "https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn"
FIELDS = {
    "tmax": "tre200dx", "tmin": "tre200dn", "tmean": "tre200d0", "ground_min": "tre005dn",
    "rain": "rre150d0", "gust": "fkl010d1", "sunshine": "sre000d0", "snow": "htoautd0",
    "evaporation": "erefaod0",
}
NORMAL_YEARS = (1991, 2020)


@dataclass
class DayValues:
    """Daily values of one day."""

    day: date
    values: dict[str, float | None]


@dataclass
class HistoryData:
    """What the sensors and cards need from the history."""

    days: list[DayValues] = field(default_factory=list)  # oldest first, up to yesterday
    normals: dict[int, tuple[float, float]] = field(default_factory=dict)  # day of year -> (tmax, tmin)


def parse_daily(text: str) -> list[DayValues]:
    """Parse a SwissMetNet daily file (timestamps "DD.MM.YYYY 00:00")."""
    rows = []
    for row in csv.DictReader(io.StringIO(text), delimiter=";"):
        try:
            day = datetime.strptime((row.get("reference_timestamp") or "")[:10], "%d.%m.%Y").date()
        except ValueError:
            continue
        rows.append(DayValues(day, {k: parse_float(row.get(p)) for k, p in FIELDS.items()}))
    return rows


def compute_normals(days: list[DayValues]) -> dict[int, tuple[float, float]]:
    """Mean max / min of each day of the year over 1991-2020, smoothed over ±7 days."""
    sums: dict[int, list[float]] = {d: [0.0, 0, 0.0, 0] for d in range(1, 367)}
    for d in days:
        if not NORMAL_YEARS[0] <= d.day.year <= NORMAL_YEARS[1]:
            continue
        doy = min(366, d.day.timetuple().tm_yday)
        s = sums[doy]
        if d.values["tmax"] is not None:
            s[0] += d.values["tmax"]; s[1] += 1
        if d.values["tmin"] is not None:
            s[2] += d.values["tmin"]; s[3] += 1
    normals = {}
    for doy in range(1, 367):
        window = [sums[(doy - 1 + k) % 366 + 1] for k in range(-7, 8)]
        n_max, n_min = sum(w[1] for w in window), sum(w[3] for w in window)
        if n_max >= 100 and n_min >= 100:  # at least ~7 years of data
            normals[doy] = (sum(w[0] for w in window) / n_max, sum(w[2] for w in window) / n_min)
    return normals


def season_start(today: date) -> date:
    """Frost and snow seasons start on 1 August."""
    return date(today.year if today.month >= 8 else today.year - 1, 8, 1)


def summarize(data: HistoryData, today: date, forecast_max: float | None,
              current: dict[str, float | None] | None) -> dict[str, Any]:
    """Everything derived from the history, as plain values (sensors and API)."""
    days = [d for d in data.days if d.day < today]
    by_day = {d.day: d.values for d in days}
    out: dict[str, Any] = {}
    y = by_day.get(today - timedelta(days=1))
    if y:
        out["yesterday"] = {k: y[k] for k in ("tmax", "tmin", "rain", "sunshine", "gust")}
        if forecast_max is not None and y["tmax"] is not None:
            out["vs_yesterday"] = round(forecast_max - y["tmax"], 1)
    # "Warmest (or coldest) since N days" for today's forecast maximum.
    if forecast_max is not None:
        out["warmest_since_days"] = _streak(days, forecast_max, True)
        out["coldest_since_days"] = _streak(days, forecast_max, False)
    # Records of the year (measured days + today so far).
    year = [d for d in days if d.day.year == today.year]
    def extreme(key, fn):
        vals = [(d.values[key], d.day) for d in year if d.values[key] is not None]
        return fn(vals, key=lambda v: v[0]) if vals else (None, None)
    tmax, tmax_day = extreme("tmax", max)
    tmin, tmin_day = extreme("tmin", min)
    gust, gust_day = extreme("gust", max)
    rain, rain_day = extreme("rain", max)
    now_t = (current or {}).get("tre200s0")
    if now_t is not None:
        if tmax is None or now_t > tmax:
            tmax, tmax_day = now_t, today
        if tmin is None or now_t < tmin:
            tmin, tmin_day = now_t, today
    out["records"] = {
        "max_temperature": tmax, "max_temperature_date": tmax_day.isoformat() if tmax_day else None,
        "min_temperature": tmin, "min_temperature_date": tmin_day.isoformat() if tmin_day else None,
        "max_gust": round(gust * 3.6) if gust is not None else None,  # m/s -> km/h
        "max_gust_date": gust_day.isoformat() if gust_day else None,
        "max_rain": rain, "max_rain_date": rain_day.isoformat() if rain_day else None,
    }
    # First frost (air and ground) and first snow of the season.
    start = season_start(today)
    season = [d for d in days if d.day >= start]
    first = lambda pred: next((d.day.isoformat() for d in season if pred(d.values)), None)  # noqa: E731
    out["first_frost"] = first(lambda v: v["tmin"] is not None and v["tmin"] < 0)
    out["first_ground_frost"] = first(lambda v: v["ground_min"] is not None and v["ground_min"] < 0)
    out["first_snow"] = first(lambda v: (v["snow"] or 0) >= 1)
    if out["first_frost"] is None and now_t is not None and now_t < 0:
        out["first_frost"] = today.isoformat()
    # Watering: last 5 days.
    last5 = [by_day.get(today - timedelta(days=k)) for k in range(1, 6)]
    out["rain_5_days"] = [v["rain"] if v else None for v in last5]
    out["evaporation_5_days"] = [v["evaporation"] if v else None for v in last5]
    # Normal of the day.
    normal = data.normals.get(min(366, today.timetuple().tm_yday))
    if normal:
        out["normal_max"], out["normal_min"] = round(normal[0], 1), round(normal[1], 1)
        if forecast_max is not None:
            out["anomaly"] = round(forecast_max - normal[0], 1)
    return out


def _streak(days: list[DayValues], value: float, warmest: bool) -> int:
    """Number of days back until a day at least as warm (or as cold)."""
    count = 0
    for d in reversed(days):
        t = d.values["tmax"]
        if t is None:
            continue
        if (warmest and t >= value) or (not warmest and t <= value):
            return count
        count += 1
    return count


class HistoryCoordinator(DataUpdateCoordinator[HistoryData]):
    """Daily values of the station, refreshed every 3 hours (normals weekly)."""

    def __init__(self, hass: HomeAssistant, entry, station: str) -> None:
        """Initialize the coordinator."""
        super().__init__(hass, _LOGGER, config_entry=entry, name=f"{DOMAIN} history {station}",
                         update_interval=HISTORY_UPDATE_INTERVAL)
        self.station = station.lower()
        self._normals_at: datetime | None = None
        self._normals: dict[int, tuple[float, float]] = {}

    async def _get(self, url: str, timeout) -> str:
        session = async_get_clientsession(self.hass)
        try:
            async with session.get(url, timeout=timeout) as resp:
                resp.raise_for_status()
                return (await resp.read()).decode("cp1252", errors="replace")
        except Exception as err:  # noqa: BLE001 - aiohttp and timeouts
            raise MeteoSwissConnectionError(f"{url}: {err}") from err

    async def _async_update_data(self) -> HistoryData:
        base = f"{BASE}/{self.station}/ogd-smn_{self.station}"
        try:
            days = parse_daily(await self._get(f"{base}_d_recent.csv", DEFAULT_TIMEOUT))
        except MeteoSwissConnectionError as err:
            raise UpdateFailed(f"Station history unavailable: {err}") from err
        now = dt_util.utcnow()
        if self._normals_at is None or now - self._normals_at >= NORMALS_UPDATE_INTERVAL:
            try:
                self._normals = compute_normals(parse_daily(await self._get(f"{base}_d_historical.csv", STREAM_TIMEOUT)))
                self._normals_at = now
            except MeteoSwissConnectionError as err:
                _LOGGER.debug("Station normals unavailable: %s", err)
        return HistoryData(days=days, normals=self._normals)
