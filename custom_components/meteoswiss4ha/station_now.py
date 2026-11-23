"""Today's 10-minute values of SwissMetNet stations: pressure trend and snow depth.

- The home station's ``t_now`` file (today since midnight, ~8 kB) gives the
  pressure of the last hours; the values are kept across midnight.
- The snow depth (automatic measurement) of the stations nearest to home that
  measure it, read every hour.
"""

from __future__ import annotations

import csv
from datetime import datetime, timedelta, timezone
import io
import logging
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import DEFAULT_TIMEOUT, MeteoSwissClient, distance_km, parse_float
from .const import CURRENT_UPDATE_INTERVAL, DOMAIN

_LOGGER = logging.getLogger(__name__)

BASE = "https://data.geo.admin.ch/ch.meteoschweiz.ogd-smn"
INVENTORY_URL = f"{BASE}/ogd-smn_meta_datainventory.csv"
SNOW = "htoauts0"
PRESSURE = "pp0qffs0"
SNOW_STATIONS = 6
SNOW_EVERY = timedelta(hours=1)
PRESSURE_WINDOW = timedelta(hours=3)


def parse_now(text: str) -> list[tuple[datetime, dict[str, float | None]]]:
    """Rows of a t_now file: (UTC time, values)."""
    rows = []
    for row in csv.DictReader(io.StringIO(text), delimiter=";"):
        try:
            when = datetime.strptime(row.get("reference_timestamp") or "", "%d.%m.%Y %H:%M").replace(tzinfo=timezone.utc)
        except ValueError:
            continue
        rows.append((when, {PRESSURE: parse_float(row.get(PRESSURE)), SNOW: parse_float(row.get(SNOW))}))
    return rows


def pressure_trend(points: list[tuple[datetime, float]]) -> dict[str, Any]:
    """Change of the pressure over the last 3 hours and its trend name."""
    if len(points) < 2:
        return {"state": None}
    last_time, last = points[-1]
    window = [(t, p) for t, p in points if last_time - t <= PRESSURE_WINDOW]
    first_time, first = window[0]
    hours = (last_time - first_time).total_seconds() / 3600
    if hours < 1:
        return {"state": None}
    change = (last - first) * 3 / hours  # per 3 hours
    if change <= -3:
        trend = "falling_fast"
    elif change <= -1:
        trend = "falling"
    elif change < 1:
        trend = "steady"
    elif change < 3:
        trend = "rising"
    else:
        trend = "rising_fast"
    return {"state": round(change, 1), "trend": trend, "pressure": last, "hours": round(hours, 1)}


def snow_summary(rows: list[tuple[datetime, dict[str, float | None]]]) -> dict[str, Any] | None:
    """Snow depth now and its change since the first value of the file (today)."""
    values = [(t, v[SNOW]) for t, v in rows if v[SNOW] is not None]
    if not values:
        return None
    (t0, d0), (t1, d1) = values[0], values[-1]
    return {"depth": round(d1), "change": round(d1 - d0), "since": t0.isoformat(), "time": t1.isoformat()}


class StationNowCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Pressure trend at home (10 minutes) and snow depth around (hourly)."""

    def __init__(self, hass: HomeAssistant, entry, client: MeteoSwissClient, station: str) -> None:
        """Initialize the coordinator."""
        super().__init__(hass, _LOGGER, config_entry=entry, name=f"{DOMAIN} station now",
                         update_interval=CURRENT_UPDATE_INTERVAL)
        self._client = client
        self.station = station.lower()
        self._pressure: dict[datetime, float] = {}
        self._snow_stations: list[dict[str, Any]] | None = None
        self._snow: list[dict[str, Any]] = []
        self._snow_at: datetime | None = None

    async def _text(self, url: str) -> str:
        session = async_get_clientsession(self.hass)
        async with session.get(url, timeout=DEFAULT_TIMEOUT) as resp:
            resp.raise_for_status()
            return (await resp.read()).decode("cp1252", errors="replace")

    async def _now(self, abbr: str) -> list[tuple[datetime, dict[str, float | None]]]:
        a = abbr.lower()
        return parse_now(await self._text(f"{BASE}/{a}/ogd-smn_{a}_t_now.csv"))

    async def _find_snow_stations(self) -> list[dict[str, Any]]:
        """The stations nearest to home that measure the snow depth today."""
        inventory = await self._text(INVENTORY_URL)
        measured = {
            row["station_abbr"].upper()
            for row in csv.DictReader(io.StringIO(inventory), delimiter=";")
            if row.get("parameter_shortname") == SNOW and not (row.get("data_till") or "").strip()
        }
        lat, lon = self.hass.config.latitude, self.hass.config.longitude
        stations = [s for s in await self._client.async_get_stations() if s.abbr.upper() in measured]
        stations.sort(key=lambda s: distance_km(lat, lon, s.latitude, s.longitude))
        return [
            {"abbr": s.abbr, "name": s.name, "altitude": s.altitude,
             "distance": round(distance_km(lat, lon, s.latitude, s.longitude))}
            for s in stations[:SNOW_STATIONS]
        ]

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            rows = await self._now(self.station)
        except Exception as err:  # noqa: BLE001 - aiohttp and timeouts
            raise UpdateFailed(f"Station values unavailable: {err}") from err
        now = dt_util.utcnow()
        for when, values in rows:
            if values[PRESSURE] is not None:
                self._pressure[when] = values[PRESSURE]
        for when in [t for t in self._pressure if now - t > PRESSURE_WINDOW + timedelta(hours=1)]:
            del self._pressure[when]
        if self._snow_at is None or now - self._snow_at >= SNOW_EVERY:
            await self._update_snow()
            self._snow_at = now
        return {
            "pressure": pressure_trend(sorted(self._pressure.items())),
            "snow": self._snow,
        }

    async def _update_snow(self) -> None:
        try:
            if self._snow_stations is None:
                self._snow_stations = await self._find_snow_stations()
            snow = []
            for station in self._snow_stations:
                summary = snow_summary(await self._now(station["abbr"]))
                if summary is not None:
                    snow.append({**station, **summary})
            self._snow = snow
        except Exception as err:  # noqa: BLE001 - keep the last values
            _LOGGER.debug("Snow depth unavailable: %s", err)
