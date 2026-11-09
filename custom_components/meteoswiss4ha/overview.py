"""HTTP API used by the Switzerland map (sidebar panel and card).

GET /api/meteoswiss4ha/overview          cities forecast, pollen, avalanches
GET /api/meteoswiss4ha/avalanche_regions  avalanche region polygons (GeoJSON)

Both require a logged-in Home Assistant user.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.util import dt as dt_util

from .api import MeteoSwissClient, MeteoSwissError
from .cities import CITIES
from .const import (
    CONF_ICON_PACK,
    CONF_POINT_ID,
    CONF_POINT_TYPE_ID,
    DAILY_PRECIPITATION,
    DAILY_SYMBOL,
    DAILY_TEMP_MAX,
    DAILY_TEMP_MIN,
    DEFAULT_ICON_PACK,
    DOMAIN,
    ICONS_URL,
)
from .hazards import HazardClient, flood_to_wgs84
from .pollen import SPECIES, level_index, summarize

_LOGGER = logging.getLogger(__name__)

AVALANCHE_TTL = 30 * 60
POLLEN_TTL = 60 * 60
REGIONS_TTL = 24 * 60 * 60
FLOOD_TTL = 30 * 60


class _Cache:
    """Tiny time-based cache shared by the views."""

    def __init__(self) -> None:
        self._values: dict[str, tuple[float, Any]] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    async def get(self, key: str, ttl: float, factory) -> Any:
        lock = self._locks.setdefault(key, asyncio.Lock())
        async with lock:
            cached = self._values.get(key)
            if cached and time.monotonic() - cached[0] < ttl:
                return cached[1]
            try:
                value = await factory()
            except MeteoSwissError as err:
                _LOGGER.debug("Map data %s unavailable: %s", key, err)
                return cached[1] if cached else None
            self._values[key] = (time.monotonic(), value)
            return value


def _days(steps) -> list[dict[str, Any]]:
    today = dt_util.now().date()
    days = []
    for step in steps:
        if step.time.date() < today:
            continue
        v = step.values
        days.append(
            {
                "date": step.time.date().isoformat(),
                "symbol": int(v[DAILY_SYMBOL]) if v.get(DAILY_SYMBOL) is not None else None,
                "tmax": v.get(DAILY_TEMP_MAX),
                "tmin": v.get(DAILY_TEMP_MIN),
                "precip": v.get(DAILY_PRECIPITATION),
            }
        )
    return days


class _BaseView(HomeAssistantView):
    requires_auth = True

    def __init__(self, hass: HomeAssistant, cache: _Cache) -> None:
        self.hass = hass
        self.cache = cache

    def _entry(self, request: web.Request):
        entries = [
            e
            for e in self.hass.config_entries.async_entries(DOMAIN)
            if e.state is ConfigEntryState.LOADED
        ]
        wanted = request.query.get("entry_id")
        for entry in entries:
            if wanted is None or entry.entry_id == wanted:
                return entry
        return None


class AvalancheRegionsView(_BaseView):
    """Avalanche micro-region polygons."""

    url = f"/api/{DOMAIN}/avalanche_regions"
    name = f"api:{DOMAIN}:avalanche_regions"

    async def get(self, request: web.Request) -> web.Response:
        """Return the GeoJSON of the Swiss avalanche regions."""
        client = HazardClient(async_get_clientsession(self.hass), "en")
        regions = await self.cache.get("regions", REGIONS_TTL, client.async_get_regions)
        if regions is None:
            return self.json_message("Avalanche regions unavailable", 503)
        return self.json(regions)


class FloodRegionsView(_BaseView):
    """FOEN flood warning regions with their current level (WGS84)."""

    url = f"/api/{DOMAIN}/flood_regions"
    name = f"api:{DOMAIN}:flood_regions"

    async def get(self, request: web.Request) -> web.Response:
        """Return the flood warning map as WGS84 GeoJSON."""
        language = (self.hass.config.language or "en").split("-")[0].lower()
        client = HazardClient(async_get_clientsession(self.hass), language)

        async def load():
            return flood_to_wgs84(await client.async_get_flood_map())

        regions = await self.cache.get(f"flood_{language}", FLOOD_TTL, load)
        if regions is None:
            return self.json_message("Flood warnings unavailable", 503)
        return self.json(regions)


class OverviewView(_BaseView):
    """Everything the map needs, in one call."""

    url = f"/api/{DOMAIN}/overview"
    name = f"api:{DOMAIN}:overview"

    async def get(self, request: web.Request) -> web.Response:
        """Return cities, home, pollen and avalanche data."""
        entry = self._entry(request)
        if entry is None:
            return self.json_message("No MeteoSwiss entry loaded", 404)
        data = entry.runtime_data
        forecast = data.forecast.data
        language = (self.hass.config.language or "en").split("-")[0].lower()

        cities = []
        if forecast is not None:
            for point_id, name, lat, lon, zoom in CITIES:
                steps = forecast.others.get((point_id, 2))
                if steps:
                    cities.append(
                        {"name": name, "lat": lat, "lon": lon, "min_zoom": zoom, "days": _days(steps)}
                    )

        pollen, avalanche = await asyncio.gather(
            self.cache.get("pollen", POLLEN_TTL, self._pollen),
            self.cache.get(f"avalanche_{language}", AVALANCHE_TTL, lambda: self._avalanche(language)),
        )

        hazards = data.hazards.data if data.hazards else None
        return self.json(
            {
                "updated": dt_util.utcnow().isoformat(),
                "reference_time": forecast.reference_time.isoformat() if forecast else None,
                "icons_url": f"{ICONS_URL}/{entry.options.get(CONF_ICON_PACK, DEFAULT_ICON_PACK)}",
                "home": {
                    "name": entry.title,
                    "lat": self.hass.config.latitude,
                    "lon": self.hass.config.longitude,
                    "days": _days(forecast.daily) if forecast else [],
                    "forest_fire": hazards.forest_fire.level if hazards and hazards.forest_fire else None,
                    "drought": hazards.drought.level if hazards and hazards.drought else None,
                    "flood": hazards.flood.level if hazards and hazards.flood else None,
                },
                "cities": cities,
                "pollen": pollen or [],
                "avalanche": avalanche or {},
            }
        )

    async def _pollen(self) -> list[dict[str, Any]]:
        client = MeteoSwissClient(async_get_clientsession(self.hass))
        stations = await client.async_get_pollen_stations()
        now = dt_util.utcnow()

        async def one(station):
            try:
                rows = await client.async_get_pollen(station.abbr)
            except MeteoSwissError:
                return None
            summary = summarize(station.abbr, rows, now)
            level, dominant = summary.overall()
            return {
                "abbr": station.abbr,
                "name": station.name,
                "lat": station.latitude,
                "lon": station.longitude,
                "level": level,
                "dominant": dominant,
                "species": {
                    s.key: level_index(s, summary.mean_24h.get(s.key)) for s in SPECIES
                },
            }

        results = await asyncio.gather(*(one(s) for s in stations))
        return [r for r in results if r is not None]

    async def _avalanche(self, language: str) -> dict[str, Any]:
        client = HazardClient(async_get_clientsession(self.hass), language)
        raw = await client._get_json(  # noqa: SLF001 - same package
            f"https://aws.slf.ch/api/bulletin/caaml/{client._lang}/json"  # noqa: SLF001
        )
        levels = {"low": 1, "moderate": 2, "considerable": 3, "high": 4, "very_high": 5}
        result: dict[str, Any] = {}
        for bulletin in raw.get("bulletins") or []:
            level = max(
                (levels.get(r.get("mainValue"), 0) for r in bulletin.get("dangerRatings") or []),
                default=0,
            )
            for region in bulletin.get("regions") or []:
                result[region.get("regionID")] = {
                    "level": level or None,
                    "name": region.get("name"),
                }
        return result


def async_register_views(hass: HomeAssistant) -> None:
    """Register the map API views (once)."""
    cache = _Cache()
    hass.http.register_view(OverviewView(hass, cache))
    hass.http.register_view(AvalancheRegionsView(hass, cache))
    hass.http.register_view(FloodRegionsView(hass, cache))
