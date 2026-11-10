"""HTTP API used by the Switzerland map (sidebar panel and card).

GET /api/meteoswiss4ha/overview          cities forecast, pollen, avalanches
GET /api/meteoswiss4ha/avalanche_regions  avalanche region polygons (GeoJSON)
GET /api/meteoswiss4ha/fog                fog / low stratus by region
GET /api/meteoswiss4ha/lakes              lakes (facts, temperature of the chosen ones)
GET /api/meteoswiss4ha/lake/<key>         one lake: forecast, profile, 3D map layer
GET /api/meteoswiss4ha/places             home and watched places (compare card)

Both require a logged-in Home Assistant user.
"""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import timedelta
from typing import Any

from aiohttp import ClientError, ClientTimeout, web

from homeassistant.components.http import HomeAssistantView
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.util import dt as dt_util

from .api import (
    POINT_TYPE_MOUNTAIN,
    POINT_TYPE_POSTAL_CODE,
    MeteoSwissClient,
    MeteoSwissError,
)
from .cities import CITIES, MOUNTAINS
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
    RADAR_URL,
)
from .hazards import (
    DROUGHT_LAYER,
    FOREST_FIRE_LAYER,
    WARNING_KINDS,
    HazardClient,
    flood_to_wgs84,
    warnings_at,
)
from .lakes import LAKES, LAKES_BY_KEY, AlplakesClient, lake_facts, value_at
from .pollen import SPECIES, level_index, summarize

_LOGGER = logging.getLogger(__name__)

AVALANCHE_TTL = 30 * 60
POLLEN_TTL = 60 * 60
REGIONS_TTL = 24 * 60 * 60
HAZARD_TTL = 30 * 60
WARNINGS_TTL = 10 * 60
LAKE_TTL = 60 * 60
RADAR_TIMEOUT = ClientTimeout(total=20)


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
            now = time.monotonic()
            self._values[key] = (now, value)
            # Forget entries unused for a day (e.g. lake map layers of past hours).
            for old in [k for k, (t, _) in self._values.items() if now - t > 86400]:
                del self._values[old]
                self._locks.pop(old, None)
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


def _radar_url(entry) -> str | None:
    """The radar server is fixed (run by the project)."""
    return RADAR_URL


class RadarFramesView(_BaseView):
    """List of radar frames, relayed from the radar server (Node-RED)."""

    url = f"/api/{DOMAIN}/radar/frames"
    name = f"api:{DOMAIN}:radar_frames"

    async def get(self, request: web.Request) -> web.Response:
        """Return {bounds, frames: [ISO times]}."""
        base = _radar_url(self._entry(request))
        if not base:
            return self.json_message("No radar server configured", 404)
        try:
            async with async_get_clientsession(self.hass).get(
                f"{base}/frames", timeout=RADAR_TIMEOUT
            ) as resp:
                resp.raise_for_status()
                data = await resp.json(content_type=None)
        except (ClientError, TimeoutError, ValueError) as err:
            _LOGGER.debug("Radar server unavailable: %s", err)
            return self.json_message("Radar server unavailable", 502)
        return self.json(
            {
                "bounds": data.get("bounds"),
                "frames": data.get("frames") or [],
                "forecast": data.get("forecast") or [],
            }
        )


class RadarFrameView(_BaseView):
    """One radar frame (PNG), relayed from the radar server."""

    url = f"/api/{DOMAIN}/radar/frame/{{time}}"
    name = f"api:{DOMAIN}:radar_frame"

    async def get(self, request: web.Request, time: str) -> web.Response:
        """Return the PNG of one frame (time as in the frame list)."""
        base = _radar_url(self._entry(request))
        if not base:
            return web.Response(status=404)
        try:
            async with async_get_clientsession(self.hass).get(
                f"{base}/frame", params={"time": time}, timeout=RADAR_TIMEOUT
            ) as resp:
                if resp.status != 200:
                    return web.Response(status=resp.status)
                body = await resp.read()
        except (ClientError, TimeoutError) as err:
            _LOGGER.debug("Radar frame unavailable: %s", err)
            return web.Response(status=502)
        return web.Response(
            body=body,
            content_type="image/png",
            headers={"Cache-Control": "private, max-age=3600"},
        )


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


HAZARD_KINDS = ("fire", "drought", "flood")


async def hazard_regions(hass: HomeAssistant, cache: _Cache, kind: str) -> dict[str, Any] | None:
    """Warning regions of a FOEN hazard (WGS84 GeoJSON with a "level"), cached."""
    language = (hass.config.language or "en").split("-")[0].lower()
    client = HazardClient(async_get_clientsession(hass), language)

    async def load():
        if kind == "flood":
            return flood_to_wgs84(await client.async_get_flood_map())
        layer = FOREST_FIRE_LAYER if kind == "fire" else DROUGHT_LAYER
        return await client.async_get_layer_regions(layer)

    return await cache.get(f"{kind}_{language}", HAZARD_TTL, load)


class HazardRegionsView(_BaseView):
    """FOEN warning regions (fire, drought, flood) with their current level."""

    url = f"/api/{DOMAIN}/hazard_regions/{{kind}}"
    name = f"api:{DOMAIN}:hazard_regions"

    async def get(self, request: web.Request, kind: str) -> web.Response:
        """Return the regions of one hazard as WGS84 GeoJSON."""
        if kind not in HAZARD_KINDS:
            return self.json_message("Unknown hazard", 404)
        regions = await hazard_regions(self.hass, self.cache, kind)
        if regions is None:
            return self.json_message("Warnings unavailable", 503)
        return self.json(regions)


async def weather_warnings(hass: HomeAssistant, cache: _Cache) -> dict[str, Any] | None:
    """MeteoSwiss weather warnings (WGS84 GeoJSON with "kind" and "level"), cached."""
    language = (hass.config.language or "en").split("-")[0].lower()
    client = HazardClient(async_get_clientsession(hass), language)
    return await cache.get(
        f"warnings_{language}",
        WARNINGS_TTL,
        lambda: client.async_get_weather_warnings(dt_util.utcnow()),
    )


class WeatherWarningsView(_BaseView):
    """MeteoSwiss weather warning regions (rain, thunderstorm, wind, ...)."""

    url = f"/api/{DOMAIN}/weather_warnings"
    name = f"api:{DOMAIN}:weather_warnings"

    async def get(self, request: web.Request) -> web.Response:
        """Return the warning regions as WGS84 GeoJSON."""
        warnings = await weather_warnings(self.hass, self.cache)
        if warnings is None:
            return self.json_message("Warnings unavailable", 503)
        return self.json(warnings)


async def pollen_stations(hass: HomeAssistant, cache: _Cache) -> list[dict[str, Any]] | None:
    """Pollen of every SwissPollen station (levels, 24 h means, latest), cached."""

    async def load() -> list[dict[str, Any]]:
        client = MeteoSwissClient(async_get_clientsession(hass))
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
                "measured_at": summary.measured_at.isoformat() if summary.measured_at else None,
                "species": {
                    s.key: level_index(s, summary.mean_24h.get(s.key)) for s in SPECIES
                },
                # 24-hour mean and latest hourly value (grains/m³).
                "mean": {s.key: summary.mean_24h.get(s.key) for s in SPECIES},
                "latest": {s.key: summary.latest.get(s.key) for s in SPECIES},
            }

        results = await asyncio.gather(*(one(s) for s in stations))
        return [r for r in results if r is not None]

    return await cache.get("pollen", POLLEN_TTL, load)


class PollenView(_BaseView):
    """Pollen of every station, and the station used by the integration."""

    url = f"/api/{DOMAIN}/pollen"
    name = f"api:{DOMAIN}:pollen"

    async def get(self, request: web.Request) -> web.Response:
        """Return the pollen stations and the configured (home) station."""
        stations = await pollen_stations(self.hass, self.cache)
        if stations is None:
            return self.json_message("Pollen unavailable", 503)
        entry = self._entry(request)
        pollen = entry.runtime_data.pollen if entry is not None else None
        return self.json(
            {
                "home": pollen.station.abbr if pollen is not None else None,
                "stations": stations,
            }
        )


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
            main = (entry.data[CONF_POINT_ID], entry.data[CONF_POINT_TYPE_ID])
            places = [(c, POINT_TYPE_POSTAL_CODE, "city") for c in CITIES] + [
                (m, POINT_TYPE_MOUNTAIN, "mountain") for m in MOUNTAINS
            ]
            for (point_id, name, lat, lon, zoom), point_type, kind in places:
                point = (point_id, point_type)
                # The configured point is not repeated in "others".
                steps = forecast.daily if point == main else forecast.others.get(point)
                if steps:
                    cities.append(
                        {
                            "name": name,
                            "kind": kind,
                            "lat": lat,
                            "lon": lon,
                            "min_zoom": zoom,
                            "days": _days(steps),
                        }
                    )

        pollen, avalanche, warnings, *regions = await asyncio.gather(
            pollen_stations(self.hass, self.cache),
            self.cache.get(f"avalanche_{language}", AVALANCHE_TTL, lambda: self._avalanche(language)),
            weather_warnings(self.hass, self.cache),
            *(hazard_regions(self.hass, self.cache, kind) for kind in HAZARD_KINDS),
        )
        # Highest level of each hazard anywhere in Switzerland (icon bar).
        maxima: dict[str, int | None] = {
            kind: max(
                (f["properties"].get("level") or 0 for f in (geo or {}).get("features", [])),
                default=0,
            )
            or None
            for kind, geo in zip(HAZARD_KINDS, regions, strict=True)
        }
        maxima["avalanche"] = max(
            (r.get("level") or 0 for r in (avalanche or {}).values()), default=0
        ) or None
        # Weather warnings: highest level per kind and overall (None: unknown).
        kinds: dict[str, int] | None = None
        if warnings is not None:
            kinds = {kind: 1 for kind in WARNING_KINDS}
            for feature in warnings.get("features", []):
                props = feature["properties"]
                kinds[props["kind"]] = max(kinds.get(props["kind"], 1), props["level"])
            maxima["warnings"] = max(kinds.values())
        maxima["pollen"] = max((p.get("level") or 0 for p in pollen or []), default=0) or None

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
                "maxima": maxima,
                "warning_kinds": kinds,
                "radar": bool(_radar_url(entry)),
            }
        )

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


class FogView(_BaseView):
    """Fog and low stratus of every region (reference stations, forecast)."""

    url = f"/api/{DOMAIN}/fog"
    name = f"api:{DOMAIN}:fog"

    async def get(self, request: web.Request) -> web.Response:
        """Return the regions with their stations, state now and forecast."""
        entry = self._entry(request)
        fog = entry.runtime_data.fog if entry is not None else None
        if fog is None or not fog.data:
            return self.json_message("Fog is disabled or unavailable", 404)
        return self.json(fog.data)


_LAKE_LOCK = asyncio.Lock()


async def _lake_call(factory):
    """Alplakes limits the request rate: one request at a time, spaced."""
    async with _LAKE_LOCK:
        try:
            return await factory()
        finally:
            await asyncio.sleep(0.4)


class LakesView(_BaseView):
    """All lakes (facts) and the chosen ones with their temperature now."""

    url = f"/api/{DOMAIN}/lakes"
    name = f"api:{DOMAIN}:lakes"

    async def get(self, request: web.Request) -> web.Response:
        """Return the lake list."""
        entry = self._entry(request)
        coordinator = entry.runtime_data.lakes if entry is not None else None
        now = dt_util.utcnow()
        lakes = []
        for lake in LAKES:
            item = lake_facts(lake)
            series = (coordinator.data or {}).get(lake.key) if coordinator else None
            if series:
                item["temperature"] = value_at(series, "T", now)
            lakes.append(item)
        chosen = [lake.key for lake in coordinator.lakes] if coordinator else []
        return self.json({"lakes": lakes, "chosen": chosen})


class LakeView(_BaseView):
    """One lake: facts, series (forecast), profile and the 3D map layer."""

    url = f"/api/{DOMAIN}/lake/{{key}}"
    name = f"api:{DOMAIN}:lake"

    async def get(self, request: web.Request, key: str) -> web.Response:
        """Return the lake data; ?map=0 skips the 3D layer, ?time= and ?depth= pick it."""
        lake = LAKES_BY_KEY.get(key)
        if lake is None:
            return self.json_message("Unknown lake", 404)
        client = AlplakesClient(async_get_clientsession(self.hass))
        now = dt_util.utcnow()
        try:
            depth = max(0.0, min(float(request.query.get("depth", 1)), lake.max_depth))
        except ValueError:
            depth = 1.0
        time = now
        if "time" in request.query:
            parsed = dt_util.parse_datetime(request.query["time"])
            if parsed is not None:
                time = parsed
        series = await self.cache.get(
            f"lake_{key}", LAKE_TTL, lambda: _lake_call(lambda: client.async_get_series(lake, now))
        )
        hour = now.replace(minute=0, second=0, microsecond=0)
        profile = await self.cache.get(
            f"lake_profile_{key}", LAKE_TTL, lambda: _lake_call(lambda: client.async_get_profile(lake, hour))
        )
        layer = None
        if lake.model3d is not None and request.query.get("map") != "0":
            slot = time.replace(minute=0, second=0, microsecond=0)
            slot -= timedelta(hours=slot.hour % 3)
            layer = await self.cache.get(
                f"lake_layer_{key}_{slot:%Y%m%d%H}_{depth:g}",
                LAKE_TTL * 3,
                lambda: _lake_call(lambda: client.async_get_layer(lake, slot, depth)),
            )
        if series is None and profile is None:
            return self.json_message("Lake data unavailable", 503)
        return self.json(
            {
                **lake_facts(lake),
                "depth": depth,
                "series": series,
                "profile": profile,
                "layer": layer,
                "source": "Eawag Alplakes (CC BY 4.0)",
            }
        )


class PlacesView(_BaseView):
    """Home and watched places side by side (compare card)."""

    url = f"/api/{DOMAIN}/places"
    name = f"api:{DOMAIN}:places"

    async def get(self, request: web.Request) -> web.Response:
        """Return home and each watched place: days and warnings."""
        entry = self._entry(request)
        if entry is None:
            return self.json_message("No MeteoSwiss entry loaded", 404)
        data = entry.runtime_data
        forecast = data.forecast.data
        now = dt_util.utcnow()
        current = data.current.data
        home_warn = data.hazards.data.weather if data.hazards and data.hazards.data else None
        places = [
            {
                "key": "home",
                "name": entry.title,
                "lat": self.hass.config.latitude,
                "lon": self.hass.config.longitude,
                "altitude": data.forecast.altitude,
                "temperature": current.values.get("tre200s0") if current else None,
                "days": _days(forecast.daily) if forecast else [],
                "warnings": {k: w.level for k, w in (home_warn or {}).items()},
            }
        ]
        if data.places is not None:
            coordinator, items = data.places
            geo = coordinator.data
            for place in items:
                if place.entity_id is not None:
                    state = self.hass.states.get(place.entity_id)
                    lat = state.attributes.get("latitude") if state else None
                    lon = state.attributes.get("longitude") if state else None
                else:
                    lat, lon = place.latitude, place.longitude
                steps = forecast.others.get(place.point) if forecast and place.point else None
                warnings = (
                    {k: w.level for k, w in warnings_at(geo, lat, lon, now).items()}
                    if geo and lat is not None and lon is not None
                    else {}
                )
                places.append(
                    {
                        "key": place.key,
                        "name": place.name,
                        "lat": lat,
                        "lon": lon,
                        "person": place.entity_id is not None,
                        "days": _days(steps) if steps else [],
                        "warnings": warnings,
                    }
                )
        return self.json({"icons_url": f"{ICONS_URL}/{entry.options.get(CONF_ICON_PACK, DEFAULT_ICON_PACK)}", "places": places})


def async_register_views(hass: HomeAssistant) -> None:
    """Register the map API views (once)."""
    cache = _Cache()
    hass.http.register_view(OverviewView(hass, cache))
    hass.http.register_view(AvalancheRegionsView(hass, cache))
    hass.http.register_view(HazardRegionsView(hass, cache))
    hass.http.register_view(WeatherWarningsView(hass, cache))
    hass.http.register_view(PollenView(hass, cache))
    hass.http.register_view(RadarFramesView(hass, cache))
    hass.http.register_view(RadarFrameView(hass, cache))
    hass.http.register_view(FogView(hass, cache))
    hass.http.register_view(LakesView(hass, cache))
    hass.http.register_view(LakeView(hass, cache))
    hass.http.register_view(PlacesView(hass, cache))
