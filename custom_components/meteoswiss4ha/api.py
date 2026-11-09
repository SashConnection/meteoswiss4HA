"""Async client for MeteoSwiss Open Government Data (OGD).

Data is published on the Swiss Federal Spatial Data Infrastructure (FSDI):
https://opendatadocs.meteoswiss.ch/

This module has no dependency on Home Assistant so it can be tested alone.
"""

from __future__ import annotations

import csv
import io
import math
from dataclasses import dataclass, field
from datetime import UTC, datetime

import aiohttp

BASE_URL = "https://data.geo.admin.ch"

CURRENT_URL = f"{BASE_URL}/ch.meteoschweiz.messwerte-aktuell/VQHA80.csv"
STATIONS_META_URL = f"{BASE_URL}/ch.meteoschweiz.ogd-smn/ogd-smn_meta_stations.csv"
POINTS_META_URL = (
    f"{BASE_URL}/ch.meteoschweiz.ogd-local-forecasting/"
    "ogd-local-forecasting_meta_point.csv"
)

# Point types used by the local forecast collection.
POINT_TYPE_STATION = 1
POINT_TYPE_POSTAL_CODE = 2
POINT_TYPE_MOUNTAIN = 3

DEFAULT_TIMEOUT = aiohttp.ClientTimeout(total=60)


class MeteoSwissError(Exception):
    """Base error for the MeteoSwiss client."""


class MeteoSwissConnectionError(MeteoSwissError):
    """Raised when MeteoSwiss data cannot be downloaded."""


class MeteoSwissDataError(MeteoSwissError):
    """Raised when downloaded data cannot be parsed."""


@dataclass(frozen=True, slots=True)
class Station:
    """A SwissMetNet automatic weather station."""

    abbr: str
    name: str
    canton: str
    altitude: float | None
    latitude: float
    longitude: float


@dataclass(frozen=True, slots=True)
class ForecastPoint:
    """A local forecast point (station, postal code or mountain point)."""

    point_id: int
    point_type_id: int
    name: str
    postal_code: str | None
    station_abbr: str | None
    altitude: float | None
    latitude: float
    longitude: float


@dataclass(slots=True)
class CurrentConditions:
    """Latest 10-minute measurement of one station."""

    station_abbr: str
    measured_at: datetime
    values: dict[str, float | None] = field(default_factory=dict)


def parse_timestamp(value: str) -> datetime:
    """Parse a MeteoSwiss timestamp (YYYYMMDDHHMM, UTC)."""
    try:
        return datetime.strptime(value, "%Y%m%d%H%M").replace(tzinfo=UTC)
    except ValueError as err:
        raise MeteoSwissDataError(f"Invalid timestamp: {value!r}") from err


def parse_float(value: str | None) -> float | None:
    """Parse a numeric value; MeteoSwiss uses '-' or '' for missing data."""
    if value is None:
        return None
    value = value.strip()
    if value in ("", "-"):
        return None
    try:
        return float(value)
    except ValueError:
        return None


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two WGS84 coordinates, in km."""
    lat1, lon1, lat2, lon2 = map(math.radians, (lat1, lon1, lat2, lon2))
    a = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    )
    return 6371.0 * 2 * math.asin(math.sqrt(a))


def parse_current_csv(text: str) -> dict[str, CurrentConditions]:
    """Parse the all-stations current values file (VQHA80.csv)."""
    reader = csv.reader(io.StringIO(text), delimiter=";")
    try:
        header = next(reader)
    except StopIteration as err:
        raise MeteoSwissDataError("Empty current conditions file") from err
    if len(header) < 3 or header[1] != "Date":
        raise MeteoSwissDataError(f"Unexpected header: {header[:3]}")

    params = header[2:]
    result: dict[str, CurrentConditions] = {}
    for row in reader:
        if len(row) < 2 or not row[0]:
            continue
        abbr = row[0].strip()
        result[abbr] = CurrentConditions(
            station_abbr=abbr,
            measured_at=parse_timestamp(row[1].strip()),
            values={
                param: parse_float(row[i + 2] if i + 2 < len(row) else None)
                for i, param in enumerate(params)
            },
        )
    return result


def parse_stations_csv(text: str) -> list[Station]:
    """Parse the SwissMetNet station metadata file."""
    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    stations: list[Station] = []
    for row in reader:
        lat = parse_float(row.get("station_coordinates_wgs84_lat"))
        lon = parse_float(row.get("station_coordinates_wgs84_lon"))
        if not row.get("station_abbr") or lat is None or lon is None:
            continue
        stations.append(
            Station(
                abbr=row["station_abbr"].strip(),
                name=(row.get("station_name") or "").strip(),
                canton=(row.get("station_canton") or "").strip(),
                altitude=parse_float(row.get("station_height_masl")),
                latitude=lat,
                longitude=lon,
            )
        )
    return stations


def parse_points_csv(text: str) -> list[ForecastPoint]:
    """Parse the local forecast point metadata file."""
    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    points: list[ForecastPoint] = []
    for row in reader:
        lat = parse_float(row.get("point_coordinates_wgs84_lat"))
        lon = parse_float(row.get("point_coordinates_wgs84_lon"))
        try:
            point_id = int(row["point_id"])
            point_type_id = int(row["point_type_id"])
        except (KeyError, TypeError, ValueError):
            continue
        if lat is None or lon is None:
            continue
        points.append(
            ForecastPoint(
                point_id=point_id,
                point_type_id=point_type_id,
                name=(row.get("point_name") or "").strip(),
                postal_code=(row.get("postal_code") or "").strip() or None,
                station_abbr=(row.get("station_abbr") or "").strip() or None,
                altitude=parse_float(row.get("point_height_masl")),
                latitude=lat,
                longitude=lon,
            )
        )
    return points


class MeteoSwissClient:
    """Client for the MeteoSwiss open data files."""

    def __init__(self, session: aiohttp.ClientSession) -> None:
        """Initialize the client with a shared aiohttp session."""
        self._session = session

    async def _get_text(self, url: str, encoding: str) -> str:
        try:
            async with self._session.get(url, timeout=DEFAULT_TIMEOUT) as resp:
                resp.raise_for_status()
                raw = await resp.read()
        except (aiohttp.ClientError, TimeoutError) as err:
            raise MeteoSwissConnectionError(f"Error fetching {url}: {err}") from err
        return raw.decode(encoding, errors="replace")

    async def async_get_current(self) -> dict[str, CurrentConditions]:
        """Return the latest measurements of all stations, keyed by abbr."""
        # ASCII in practice; latin-1 is a safe superset for decoding.
        return parse_current_csv(await self._get_text(CURRENT_URL, "latin-1"))

    async def async_get_stations(self) -> list[Station]:
        """Return SwissMetNet station metadata."""
        # Ground-based measurement files are Windows-1252 encoded.
        return parse_stations_csv(await self._get_text(STATIONS_META_URL, "cp1252"))

    async def async_get_points(self) -> list[ForecastPoint]:
        """Return local forecast point metadata."""
        return parse_points_csv(await self._get_text(POINTS_META_URL, "latin-1"))
