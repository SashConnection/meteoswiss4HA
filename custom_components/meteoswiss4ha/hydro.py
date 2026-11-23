"""Rivers and lakes of the FOEN hydrological network (water temperature, discharge, level).

All stations come in one small SPARQL query on LINDAS (the federal linked data
service), refreshed every 10 minutes by the FOEN. Source: FOEN (BAFU), provisional data.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
import io
import logging
import re
from typing import Any

import aiohttp

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import distance_km
from .const import DOMAIN, HYDRO_UPDATE_INTERVAL

_LOGGER = logging.getLogger(__name__)

SPARQL_URL = "https://ld.admin.ch/query"
TIMEOUT = aiohttp.ClientTimeout(total=30)
QUERY = """
PREFIX dim: <https://environment.ld.admin.ch/foen/hydro/dimension/>
PREFIX schema: <http://schema.org/>
PREFIX geo: <http://www.opengis.net/ont/geosparql#>
SELECT ?station ?name ?water ?wkt ?time ?temp ?q ?level ?danger WHERE {
  ?obs dim:station ?station ; dim:measurementTime ?time .
  ?station schema:name ?name .
  OPTIONAL { ?station schema:containedInPlace ?w . ?w schema:name ?water }
  OPTIONAL { ?station geo:hasGeometry/geo:asWKT ?wkt }
  OPTIONAL { ?obs dim:waterTemperature ?temp }
  OPTIONAL { ?obs dim:discharge ?q }
  OPTIONAL { ?obs dim:waterLevel ?level }
  OPTIONAL { ?obs dim:dangerLevel ?danger }
}
"""
_POINT = re.compile(r"POINT\(([-\d.]+) ([-\d.]+)\)")


@dataclass
class HydroStation:
    """One FOEN station and its latest values."""

    id: str
    name: str
    water: str | None
    latitude: float | None
    longitude: float | None
    time: str | None
    temperature: float | None
    discharge: float | None
    level: float | None
    danger: int | None

    @property
    def label(self) -> str:
        """"Aare – Bern, Schönau"."""
        return f"{self.water} – {self.name}" if self.water and self.water not in self.name else self.name

    def as_dict(self) -> dict[str, Any]:
        """Plain values for the API and attributes."""
        return {"id": self.id, "name": self.name, "water": self.water, "label": self.label,
                "latitude": self.latitude, "longitude": self.longitude, "time": self.time,
                "temperature": self.temperature, "discharge": self.discharge, "level": self.level,
                "danger": self.danger}


def _num(value: str | None) -> float | None:
    try:
        return float(value) if value not in (None, "") else None
    except ValueError:
        return None


def parse_stations(text: str) -> dict[str, HydroStation]:
    """Parse the SPARQL CSV answer."""
    out: dict[str, HydroStation] = {}
    for row in csv.DictReader(io.StringIO(text)):
        sid = (row.get("station") or "").rsplit("/", 1)[-1]
        if not sid:
            continue
        match = _POINT.match(row.get("wkt") or "")
        danger = _num(row.get("danger"))
        out[sid] = HydroStation(
            id=sid, name=row.get("name") or sid, water=row.get("water") or None,
            longitude=float(match.group(1)) if match else None, latitude=float(match.group(2)) if match else None,
            time=row.get("time") or None, temperature=_num(row.get("temp")), discharge=_num(row.get("q")),
            level=_num(row.get("level")), danger=int(danger) if danger is not None else None,
        )
    return out


async def async_get_stations(session: aiohttp.ClientSession) -> dict[str, HydroStation]:
    """All FOEN stations with their latest values."""
    async with session.get(SPARQL_URL, params={"query": QUERY}, headers={"Accept": "text/csv"}, timeout=TIMEOUT) as resp:
        resp.raise_for_status()
        return parse_stations(await resp.text())


def default_stations(stations: dict[str, HydroStation], lat: float, lon: float, km: float = 20) -> list[str]:
    """The nearest station that measures the water temperature, if close enough."""
    with_temp = [s for s in stations.values() if s.temperature is not None and s.latitude is not None]
    if not with_temp:
        return []
    best = min(with_temp, key=lambda s: distance_km(lat, lon, s.latitude, s.longitude))
    return [best.id] if distance_km(lat, lon, best.latitude, best.longitude) <= km else []


class HydroCoordinator(DataUpdateCoordinator[dict[str, HydroStation]]):
    """Latest values of every FOEN station, every 10 minutes."""

    def __init__(self, hass: HomeAssistant, entry, chosen: list[str]) -> None:
        """Initialize the coordinator."""
        super().__init__(hass, _LOGGER, config_entry=entry, name=f"{DOMAIN} rivers", update_interval=HYDRO_UPDATE_INTERVAL)
        self.chosen = chosen

    async def _async_update_data(self) -> dict[str, HydroStation]:
        try:
            return await async_get_stations(async_get_clientsession(self.hass))
        except Exception as err:  # noqa: BLE001 - aiohttp, timeouts, parsing
            raise UpdateFailed(f"FOEN hydrological data unavailable: {err}") from err
