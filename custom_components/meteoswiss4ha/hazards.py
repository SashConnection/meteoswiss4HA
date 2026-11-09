"""Natural hazard warnings: avalanches (SLF), forest fire and drought (FOEN).

Sources (all public):
- SLF avalanche bulletin, CAAML v6 JSON: https://aws.slf.ch/api/bulletin/caaml
- EAWS micro-regions of Switzerland (polygons of the bulletin regions)
- FOEN forest fire and drought warning maps, queried at a point through the
  federal geoportal API (api3.geo.admin.ch, "identify").
"""

from __future__ import annotations

import json
from datetime import datetime
import re
from dataclasses import dataclass, field
from typing import Any

import aiohttp

from .api import DEFAULT_TIMEOUT, MeteoSwissConnectionError, MeteoSwissDataError

SLF_BULLETIN_URL = "https://aws.slf.ch/api/bulletin/caaml/{lang}/json"
REGIONS_URL = "https://regions.avalanches.org/micro-regions/CH_micro-regions.geojson.json"
IDENTIFY_URL = "https://api3.geo.admin.ch/rest/services/api/MapServer/identify"

FLOOD_URL = (
    "https://data.geo.admin.ch/ch.bafu.hydroweb-warnkarte_national/"
    "ch.bafu.hydroweb-warnkarte_national_{lang}.json"
)

FOREST_FIRE_LAYER = "ch.bafu.gefahren-waldbrand_warnung"
DROUGHT_LAYER = "ch.bafu.trockenheitswarnkarte"

# The 5-level European/Swiss natural hazard scale.
LEVELS = ("low", "moderate", "considerable", "high", "very_high")

# Forest fire layer only exposes a title; map its German text to a level.
_FIRE_TITLES = {
    "keine oder geringe gefahr": 1,
    "geringe gefahr": 1,
    "mässige gefahr": 2,
    "erhebliche gefahr": 3,
    "grosse gefahr": 4,
    "sehr grosse gefahr": 5,
}


@dataclass(slots=True)
class HazardLevel:
    """A hazard level (1-5) for one region."""

    level: int | None
    region: str | None = None
    title: str | None = None
    valid_from: str | None = None

    @property
    def state(self) -> str | None:
        """Level as a name of the 5-level scale."""
        if self.level is None or not 1 <= self.level <= 5:
            return None
        return LEVELS[self.level - 1]


@dataclass(slots=True)
class AvalancheBulletin:
    """Avalanche danger for one micro-region."""

    region_id: str
    region_name: str | None = None
    level: int | None = None  # None: no bulletin for the region (off-season)
    subdivision: str | None = None
    elevation: str | None = None
    problems: list[str] = field(default_factory=list)
    valid_from: str | None = None
    valid_until: str | None = None
    next_update: str | None = None
    published: str | None = None

    @property
    def state(self) -> str | None:
        """Level as a name of the 5-level scale, or 'no_rating'."""
        if self.level is None:
            return "no_rating"
        return LEVELS[self.level - 1]


@dataclass(slots=True)
class HazardData:
    """All hazard information for one location."""

    avalanche: AvalancheBulletin | None
    forest_fire: HazardLevel | None
    drought: HazardLevel | None
    flood: HazardLevel | None = None
    weather: dict[str, "WeatherWarning"] | None = None


# --------------------------------------------------------------- geometry


def wgs84_to_lv95(lat: float, lon: float) -> tuple[float, float]:
    """Approximate swisstopo conversion WGS84 -> LV95 (E, N), ~1 m accuracy."""
    p = (lat * 3600 - 169028.66) / 10000
    l = (lon * 3600 - 26782.5) / 10000
    east = 2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p**2 - 44.54 * l**3
    north = (
        1200147.07 + 308807.95 * p + 3745.25 * l**2 + 76.63 * p**2
        - 194.56 * l**2 * p + 119.79 * p**3
    )
    return east, north


def lv95_to_wgs84(east: float, north: float) -> tuple[float, float]:
    """Approximate swisstopo conversion LV95 -> WGS84 (lat, lon)."""
    y = (east - 2600000) / 1e6
    x = (north - 1200000) / 1e6
    lon = 2.6779094 + 4.728982 * y + 0.791484 * y * x + 0.1306 * y * x**2 - 0.0436 * y**3
    lat = (
        16.9023892 + 3.238272 * x - 0.270978 * y**2 - 0.002528 * x**2
        - 0.0447 * y**2 * x - 0.0140 * x**3
    )
    return lat * 100 / 36, lon * 100 / 36


def _point_in_ring(lon: float, lat: float, ring: list[list[float]]) -> bool:
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


def _point_in_geometry(lon: float, lat: float, geometry: dict[str, Any]) -> bool:
    kind = geometry.get("type")
    if kind not in ("Polygon", "MultiPolygon"):
        return False  # lines (rivers, lakes) have no inside
    polygons = geometry.get("coordinates") or []
    if kind == "Polygon":
        polygons = [polygons]
    for polygon in polygons:
        if polygon and _point_in_ring(lon, lat, polygon[0]) and not any(
            _point_in_ring(lon, lat, hole) for hole in polygon[1:]
        ):
            return True
    return False


def _centroid(geometry: dict[str, Any]) -> tuple[float, float]:
    points = [
        p
        for polygon in (
            [geometry["coordinates"]]
            if geometry.get("type") == "Polygon"
            else geometry["coordinates"]
        )
        for p in polygon[0]
    ]
    return (
        sum(p[0] for p in points) / len(points),
        sum(p[1] for p in points) / len(points),
    )


def find_region(regions: dict[str, Any], lat: float, lon: float) -> str | None:
    """Return the micro-region containing the point, else the nearest one."""
    features = regions.get("features") or []
    for feature in features:
        if _point_in_geometry(lon, lat, feature.get("geometry") or {}):
            return feature["properties"]["id"]
    best: tuple[float, str] | None = None
    for feature in features:
        try:
            cx, cy = _centroid(feature["geometry"])
        except (KeyError, IndexError, TypeError, ZeroDivisionError):
            continue
        dist = (cx - lon) ** 2 + (cy - lat) ** 2
        if best is None or dist < best[0]:
            best = (dist, feature["properties"]["id"])
    return best[1] if best else None


# ---------------------------------------------------------------- parsing

_SLF_VALUES = {
    "low": 1, "moderate": 2, "considerable": 3, "high": 4, "very_high": 5,
}


def _elevation_text(elevation: dict[str, Any] | None) -> str | None:
    if not elevation:
        return None
    lower, upper = elevation.get("lowerBound"), elevation.get("upperBound")
    if lower and upper:
        return f"{lower}-{upper} m"
    if lower:
        return f"> {lower} m"
    if upper:
        return f"< {upper} m"
    return None


def parse_bulletin(data: dict[str, Any], region_id: str) -> AvalancheBulletin:
    """Extract the danger for one region from a CAAML v6 JSON collection."""
    result = AvalancheBulletin(region_id=region_id)
    for bulletin in data.get("bulletins") or []:
        regions = {r.get("regionID"): r.get("name") for r in bulletin.get("regions") or []}
        if region_id not in regions:
            continue
        result.region_name = regions[region_id]
        best: dict[str, Any] | None = None
        for rating in bulletin.get("dangerRatings") or []:
            value = _SLF_VALUES.get(rating.get("mainValue"))
            if value and (best is None or value > _SLF_VALUES[best["mainValue"]]):
                best = rating
        if best is not None:
            result.level = _SLF_VALUES[best["mainValue"]]
            result.elevation = _elevation_text(best.get("elevation"))
            custom = (best.get("customData") or {}).get("CH") or {}
            result.subdivision = custom.get("subdivision")
        result.problems = [
            p["problemType"] for p in bulletin.get("avalancheProblems") or [] if p.get("problemType")
        ]
        valid = bulletin.get("validTime") or {}
        result.valid_from = valid.get("startTime")
        result.valid_until = valid.get("endTime")
        result.next_update = bulletin.get("nextUpdate")
        result.published = bulletin.get("publicationTime")
        break
    return result


def _flood_level(properties: dict[str, Any]) -> int | None:
    """Level from the "ws-class" property, e.g. "Region.3" -> 3."""
    try:
        return int(str(properties.get("ws-class", "")).rsplit(".", 1)[1])
    except (IndexError, ValueError):
        return None


def parse_flood(data: dict[str, Any], lat: float, lon: float) -> HazardLevel | None:
    """Flood danger of the FOEN warning region containing the point."""
    east, north = wgs84_to_lv95(lat, lon)
    for feature in data.get("features") or []:
        if _point_in_geometry(east, north, feature.get("geometry") or {}):
            props = feature.get("properties") or {}
            description = re.sub(r"<[^>]+>", "", props.get("description") or "")
            return HazardLevel(
                level=_flood_level(props),
                region=description.split(":", 1)[0].strip() or None,
                title=props.get("text"),
                valid_from=data.get("creation_time"),
            )
    return None


def flood_to_wgs84(data: dict[str, Any]) -> dict[str, Any]:
    """Convert the flood warning map to WGS84 GeoJSON with a "level" property."""

    def ring(points):
        return [
            [round(c, 5) for c in reversed(lv95_to_wgs84(p[0], p[1]))] for p in points
        ]

    features = []
    for feature in data.get("features") or []:
        geometry = feature.get("geometry") or {}
        kind = geometry.get("type")
        coords = geometry.get("coordinates") or []
        # Regions are polygons; rivers and lakes are lines.
        if kind == "Polygon":
            kind, coords = "MultiPolygon", [[ring(r) for r in coords]]
        elif kind == "MultiPolygon":
            coords = [[ring(r) for r in polygon] for polygon in coords]
        elif kind == "LineString":
            kind, coords = "MultiLineString", [ring(coords)]
        elif kind == "MultiLineString":
            coords = [ring(line) for line in coords]
        else:
            continue
        props = feature.get("properties") or {}
        features.append(
            {
                "type": "Feature",
                "geometry": {"type": kind, "coordinates": coords},
                "properties": {
                    "level": _flood_level(props),
                    "name": re.sub(r"<[^>]+>", "", props.get("description") or "")
                    .split(":", 1)[0]
                    .strip(),
                    "text": props.get("text"),
                },
            }
        )
    return {"type": "FeatureCollection", "features": features}


def parse_identify(data: dict[str, Any], layer: str, lang: str) -> HazardLevel | None:
    """Parse a geoportal 'identify' answer for a FOEN warning layer."""
    for result in data.get("results") or []:
        if result.get("layerBodId") != layer:
            continue
        attrs = result.get("attributes") or {}
        if layer == DROUGHT_LAYER:
            level = attrs.get("warnlevel")
            title = attrs.get(f"info_{lang}") or attrs.get("info_en")
        else:
            level = _FIRE_TITLES.get((attrs.get("title_de") or "").strip().lower())
            title = attrs.get(f"title_{lang}") or attrs.get("title_en")
        return HazardLevel(
            level=int(level) if isinstance(level, (int, float)) else None,
            region=attrs.get(f"name_{lang}") or attrs.get("name_en"),
            title=title,
            valid_from=attrs.get("valid_from"),
        )
    return None


# ----------------------------------------------------------------- client


class HazardClient:
    """Fetch hazard warnings for one location."""

    def __init__(self, session: aiohttp.ClientSession, lang: str) -> None:
        """Initialize with a shared session and a language (de/fr/it/en)."""
        self._session = session
        self._lang = lang if lang in ("de", "fr", "it", "en") else "en"

    async def _get_json(self, url: str, params: dict[str, str] | None = None) -> Any:
        try:
            async with self._session.get(url, params=params, timeout=DEFAULT_TIMEOUT) as resp:
                resp.raise_for_status()
                return json.loads(await resp.text())
        except (aiohttp.ClientError, TimeoutError) as err:
            raise MeteoSwissConnectionError(f"Error fetching {url}: {err}") from err
        except ValueError as err:
            raise MeteoSwissDataError(f"Invalid JSON from {url}") from err

    async def async_get_regions(self) -> dict[str, Any]:
        """Return the Swiss avalanche micro-regions (GeoJSON)."""
        return await self._get_json(REGIONS_URL)

    async def async_get_avalanche(self, region_id: str) -> AvalancheBulletin:
        """Return the current avalanche danger of a micro-region."""
        data = await self._get_json(SLF_BULLETIN_URL.format(lang=self._lang))
        return parse_bulletin(data, region_id)

    async def async_get_flood_map(self) -> dict[str, Any]:
        """Return the FOEN flood warning map (LV95 GeoJSON)."""
        return await self._get_json(FLOOD_URL.format(lang=self._lang))

    async def async_get_flood(self, lat: float, lon: float) -> HazardLevel | None:
        """Return the flood danger at a point."""
        return parse_flood(await self.async_get_flood_map(), lat, lon)

    async def async_get_layer_regions(self, layer: str) -> dict[str, Any]:
        """Return all regions of a FOEN warning layer (WGS84 GeoJSON).

        Each feature gets "level", "name", "text" and "valid_from" properties.
        """
        data = await self._get_json(
            IDENTIFY_URL,
            {
                "geometry": "5.9,45.8,10.6,47.9",
                "geometryType": "esriGeometryEnvelope",
                "sr": "4326",
                "layers": f"all:{layer}",
                "tolerance": "0",
                "returnGeometry": "true",
                "geometryFormat": "geojson",
                "limit": "500",
                "lang": self._lang,
            },
        )
        features = []
        for result in data.get("results") or []:
            props = result.get("properties") or result.get("attributes") or {}
            level = parse_identify(
                {"results": [{"layerBodId": layer, "attributes": props}]}, layer, self._lang
            )
            if result.get("geometry") is None or level is None:
                continue
            features.append(
                {
                    "type": "Feature",
                    "geometry": result["geometry"],
                    "properties": {
                        "level": level.level,
                        "name": level.region,
                        "text": level.title,
                        "valid_from": level.valid_from,
                    },
                }
            )
        return {"type": "FeatureCollection", "features": features}

    async def async_get_weather_warnings(self, now: datetime) -> dict[str, Any]:
        """Return the MeteoSwiss weather warnings (WGS84 GeoJSON, see parse_meteoalarm)."""
        return parse_meteoalarm(await self._get_json(METEOALARM_URL), self._lang, now)

    async def async_get_level(self, layer: str, lat: float, lon: float) -> HazardLevel | None:
        """Return the FOEN warning level of a layer at a point."""
        data = await self._get_json(
            IDENTIFY_URL,
            {
                "geometry": f"{lon},{lat}",
                "geometryType": "esriGeometryPoint",
                "sr": "4326",
                "layers": f"all:{layer}",
                "tolerance": "0",
                "returnGeometry": "false",
                "lang": self._lang,
            },
        )
        return parse_identify(data, layer, self._lang)


# ------------------------------------------------------- weather warnings
#
# MeteoSwiss publishes its official weather warnings (rain, thunderstorms,
# wind, snow, slippery roads, heat, frost) as CAP messages on MeteoAlarm, the
# EUMETNET warning service (CC BY 4.0), with the outline of each warning
# region. They are not part of the MeteoSwiss Open Data catalogue.

METEOALARM_URL = "https://feeds.meteoalarm.org/api/v1/warnings/feeds-switzerland"

WARNING_KINDS = (
    "rain", "thunderstorm", "wind", "snow", "slippery_roads", "heat", "frost",
)

# MeteoAlarm "awareness_type" codes.
_AWARENESS_TYPES = {
    1: "wind", 2: "snow", 3: "thunderstorm", 5: "heat", 6: "frost", 10: "rain", 13: "rain",
}


def _leading_int(value: Any) -> int | None:
    try:
        return int(str(value).split(";", 1)[0].strip())
    except ValueError:
        return None


def _parse_time(value: Any) -> datetime | None:
    try:
        return datetime.fromisoformat(str(value))
    except ValueError:
        return None


def _parse_polygon(text: str) -> list[list[float]]:
    """CAP polygon "lat,lon lat,lon ..." -> GeoJSON ring [[lon, lat], ...]."""
    ring = []
    for pair in text.split():
        try:
            lat, lon = (float(v) for v in pair.split(","))
        except ValueError:
            continue
        ring.append([round(lon, 4), round(lat, 4)])
    return ring


def _warning_kind(code: int | None, event_en: str) -> str | None:
    kind = _AWARENESS_TYPES.get(code or 0)
    if kind == "snow" and re.search(r"slip|ice|icy|glaze|black", event_en, re.I):
        return "slippery_roads"
    return kind


def parse_meteoalarm(data: dict[str, Any], lang: str, now: datetime) -> dict[str, Any]:
    """Convert the MeteoAlarm feed to WGS84 GeoJSON, one feature per region.

    Properties: kind, level (Swiss 5-level scale, 2-4; MeteoAlarm has no
    separate level 5), name, event, description, instruction, onset, expires.
    Expired and cancelled warnings are left out.
    """
    features = []
    for warning in data.get("warnings") or []:
        alert = warning.get("alert") or {}
        if alert.get("status", "Actual") != "Actual" or alert.get("msgType") == "Cancel":
            continue
        infos = alert.get("info") or []
        if not infos:
            continue
        by_lang = {str(i.get("language", ""))[:2].lower(): i for i in infos}
        info = by_lang.get(lang) or by_lang.get("en") or infos[0]
        english = by_lang.get("en") or info
        params = {
            p.get("valueName"): p.get("value") for p in info.get("parameter") or []
        }
        level = _leading_int(params.get("awareness_level"))
        kind = _warning_kind(
            _leading_int(params.get("awareness_type")), english.get("event") or ""
        )
        if kind is None or level is None or level < 2:
            continue
        expires = _parse_time(info.get("expires"))
        if expires is not None and expires <= now:
            continue
        for area in info.get("area") or []:
            rings = [r for r in (_parse_polygon(p) for p in area.get("polygon") or []) if len(r) > 3]
            if not rings:
                continue
            features.append(
                {
                    "type": "Feature",
                    "geometry": {"type": "MultiPolygon", "coordinates": [[r] for r in rings]},
                    "properties": {
                        "kind": kind,
                        "level": min(level, 5),
                        "name": area.get("areaDesc"),
                        "event": info.get("event") or info.get("headline"),
                        "description": info.get("description"),
                        "instruction": info.get("instruction"),
                        "onset": info.get("onset") or info.get("effective"),
                        "expires": info.get("expires"),
                    },
                }
            )
    return {"type": "FeatureCollection", "features": features}


@dataclass(slots=True)
class WeatherWarning:
    """Weather warning of one kind at the home location."""

    kind: str
    level: int = 1  # 1: no warning in force
    event: str | None = None
    region: str | None = None
    description: str | None = None
    instruction: str | None = None
    onset: str | None = None
    expires: str | None = None
    upcoming: list[dict[str, Any]] = field(default_factory=list)

    @property
    def state(self) -> str:
        """Level as a name of the 5-level scale ("low": no warning)."""
        return LEVELS[max(1, min(self.level, 5)) - 1]


def warnings_at(
    geo: dict[str, Any], lat: float, lon: float, now: datetime
) -> dict[str, WeatherWarning]:
    """Warnings in force (and upcoming) at a point, for every kind."""
    result = {kind: WeatherWarning(kind) for kind in WARNING_KINDS}
    for feature in geo.get("features") or []:
        props = feature["properties"]
        item = result.get(props["kind"])
        if item is None or not _point_in_geometry(lon, lat, feature["geometry"]):
            continue
        onset = _parse_time(props.get("onset"))
        if onset is not None and onset > now:
            item.upcoming.append(
                {k: props.get(k) for k in ("level", "event", "onset", "expires")}
            )
        elif props["level"] > item.level:
            item.level = props["level"]
            item.event = props.get("event")
            item.region = props.get("name")
            item.description = props.get("description")
            item.instruction = props.get("instruction")
            item.onset = props.get("onset")
            item.expires = props.get("expires")
    for item in result.values():
        item.upcoming.sort(key=lambda w: w.get("onset") or "")
    return result
