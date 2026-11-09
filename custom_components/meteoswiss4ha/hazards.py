"""Natural hazard warnings: avalanches (SLF), forest fire and drought (FOEN).

Sources (all public):
- SLF avalanche bulletin, CAAML v6 JSON: https://aws.slf.ch/api/bulletin/caaml
- EAWS micro-regions of Switzerland (polygons of the bulletin regions)
- FOEN forest fire and drought warning maps, queried at a point through the
  federal geoportal API (api3.geo.admin.ch, "identify").
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

import aiohttp

from .api import DEFAULT_TIMEOUT, MeteoSwissConnectionError, MeteoSwissDataError

SLF_BULLETIN_URL = "https://aws.slf.ch/api/bulletin/caaml/{lang}/json"
REGIONS_URL = "https://regions.avalanches.org/micro-regions/CH_micro-regions.geojson.json"
IDENTIFY_URL = "https://api3.geo.admin.ch/rest/services/api/MapServer/identify"

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


# --------------------------------------------------------------- geometry


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
    polygons = geometry.get("coordinates") or []
    if geometry.get("type") == "Polygon":
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
