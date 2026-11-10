"""Async client for MeteoSwiss Open Government Data (OGD).

Data is published on the Swiss Federal Spatial Data Infrastructure (FSDI):
https://opendatadocs.meteoswiss.ch/

This module has no dependency on Home Assistant so it can be tested alone.
"""

from __future__ import annotations

import asyncio
import csv
import io
import math
import re
from collections.abc import Iterable
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

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

POLLEN_BASE_URL = f"{BASE_URL}/ch.meteoschweiz.ogd-pollen"
POLLEN_STATIONS_META_URL = f"{POLLEN_BASE_URL}/ogd-pollen_meta_stations.csv"

STAC_ITEMS_URL = (
    f"{BASE_URL}/api/stac/v1/collections/ch.meteoschweiz.ogd-local-forecasting/items"
)
# e.g. "vnut12.lssw.202611090700.tre200h0.csv"
ASSET_RE = re.compile(r"^vnut12\.lssw\.(?P<run>\d{12})\.(?P<param>\w+)\.csv$")

DEFAULT_TIMEOUT = aiohttp.ClientTimeout(total=60)
# Large forecast files: no total limit, but fail if the stream stalls.
STREAM_TIMEOUT = aiohttp.ClientTimeout(total=None, connect=30, sock_read=60)
MAX_PARALLEL_DOWNLOADS = 4


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


@dataclass(frozen=True, slots=True)
class PollenMeasurement:
    """Hourly pollen concentrations (grains/m³) keyed by parameter id."""

    time: datetime
    values: dict[str, float | None]


@dataclass(slots=True)
class CurrentConditions:
    """Latest 10-minute measurement of one station."""

    station_abbr: str
    measured_at: datetime
    values: dict[str, float | None] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class ForecastRun:
    """One local forecast run and the download URL of each parameter."""

    reference_time: datetime
    urls: dict[str, str]


@dataclass(slots=True)
class ForecastStep:
    """Values of all parameters for one forecast time step.

    Hourly steps are stamped at the END of the aggregation interval (UTC).
    Daily steps are stamped 00:00 of the calendar day they describe.
    """

    time: datetime
    values: dict[str, float | None]


@dataclass(slots=True)
class LocalForecast:
    """Daily and hourly local forecast for one point."""

    reference_time: datetime
    daily: list[ForecastStep]
    hourly: list[ForecastStep]
    # Daily forecast of other points (overview map), keyed by point.
    others: dict[tuple[int, int], list[ForecastStep]] = field(default_factory=dict)


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


def parse_pollen_csv(text: str) -> list[PollenMeasurement]:
    """Parse an hourly pollen file (timestamps "DD.MM.YYYY HH:MM", UTC)."""
    reader = csv.DictReader(io.StringIO(text), delimiter=";")
    result: list[PollenMeasurement] = []
    for row in reader:
        try:
            time = datetime.strptime(
                (row.get("reference_timestamp") or "").strip(), "%d.%m.%Y %H:%M"
            ).replace(tzinfo=UTC)
        except ValueError:
            continue
        values = {
            key: parse_float(value)
            for key, value in row.items()
            if key not in ("station_abbr", "reference_timestamp")
        }
        result.append(PollenMeasurement(time=time, values=values))
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

    # ------------------------------------------------------------------
    # Pollen
    # ------------------------------------------------------------------

    async def async_get_pollen_stations(self) -> list[Station]:
        """Return the pollen monitoring stations."""
        return parse_stations_csv(
            await self._get_text(POLLEN_STATIONS_META_URL, "cp1252")
        )

    async def async_get_pollen(
        self, station: str, recent: bool = False
    ) -> list[PollenMeasurement]:
        """Return hourly pollen concentrations of a station.

        ``recent=False`` returns today's values (small file, updated hourly);
        ``recent=True`` returns the current year up to yesterday (~300 kB).
        """
        period = "recent" if recent else "now"
        url = f"{POLLEN_BASE_URL}/{station.lower()}/ogd-pollen_{station.lower()}_h_{period}.csv"
        return parse_pollen_csv(await self._get_text(url, "cp1252"))

    # ------------------------------------------------------------------
    # Local forecast
    # ------------------------------------------------------------------

    async def async_get_latest_run(
        self, params: Iterable[str], now: datetime | None = None
    ) -> ForecastRun:
        """Find the most recent forecast run that has all requested parameters."""
        now = now or datetime.now(UTC)
        wanted = set(params)
        # Runs are grouped in one STAC item per UTC day; just after midnight
        # the new item may still be empty, so fall back to the previous day.
        for day in (now, now - timedelta(days=1)):
            item_id = f"{day:%Y%m%d}-ch"
            url = f"{STAC_ITEMS_URL}/{item_id}"
            try:
                async with self._session.get(url, timeout=DEFAULT_TIMEOUT) as resp:
                    if resp.status == 404:
                        continue
                    resp.raise_for_status()
                    item = await resp.json(content_type=None)
            except (aiohttp.ClientError, TimeoutError, ValueError) as err:
                raise MeteoSwissConnectionError(f"Error fetching {url}: {err}") from err

            runs: dict[str, dict[str, str]] = {}
            for name, asset in (item.get("assets") or {}).items():
                match = ASSET_RE.match(name)
                if match and "href" in asset:
                    runs.setdefault(match["run"], {})[match["param"]] = asset["href"]
            for run in sorted(runs, reverse=True):
                if wanted <= runs[run].keys():
                    return ForecastRun(
                        reference_time=parse_timestamp(run),
                        urls={p: runs[run][p] for p in wanted},
                    )
        raise MeteoSwissDataError("No complete local forecast run found")

    async def async_get_points_series(
        self,
        url: str,
        points: Iterable[tuple[int, int]],
        until: datetime | None = None,
    ) -> dict[tuple[int, int], list[tuple[datetime, float | None]]]:
        """Stream one parameter file and return the values of the given points.

        Files contain every forecast point (~30 MB for hourly parameters),
        grouped by point and sorted by time within a point. With ``until`` the
        download is stopped as soon as every requested point has passed the
        horizon.
        """
        points = list(points)
        prefixes = {f"{p[0]};{p[1]};".encode(): p for p in points}
        series: dict[tuple[int, int], list[tuple[datetime, float | None]]] = {
            p: [] for p in points
        }
        done: set[tuple[int, int]] = set()
        try:
            async with self._session.get(url, timeout=STREAM_TIMEOUT) as resp:
                resp.raise_for_status()
                async for raw_line in resp.content:
                    # "point_id;point_type_id;" is the line prefix.
                    cut = raw_line.find(b";", raw_line.find(b";") + 1)
                    point = prefixes.get(raw_line[: cut + 1]) if cut > 0 else None
                    if point is None:
                        continue
                    parts = raw_line.decode("latin-1").rstrip("\r\n").split(";")
                    if len(parts) < 4:
                        continue
                    timestamp = parse_timestamp(parts[2])
                    if until is not None and timestamp > until:
                        done.add(point)
                        if len(done) == len(prefixes):
                            # Closing early aborts the rest of the download.
                            resp.close()
                            break
                        continue
                    series[point].append((timestamp, parse_float(parts[3])))
        except (aiohttp.ClientError, TimeoutError) as err:
            raise MeteoSwissConnectionError(f"Error fetching {url}: {err}") from err
        return series

    async def async_get_forecast(
        self,
        point: tuple[int, int],
        daily_params: Iterable[str],
        hourly_params: Iterable[str] = (),
        hourly_hours: int = 48,
        now: datetime | None = None,
        extra_points: Iterable[tuple[int, int]] = (),
    ) -> LocalForecast:
        """Download daily (and optionally hourly) forecasts for one point.

        ``extra_points`` get the daily forecast too (read from the same files,
        so at no extra download cost), e.g. for an overview map.
        """
        now = now or datetime.now(UTC)
        daily_params = tuple(daily_params)
        hourly_params = tuple(hourly_params)
        extra = [p for p in dict.fromkeys(extra_points) if p != point]
        run = await self.async_get_latest_run((*daily_params, *hourly_params), now)
        until = now + timedelta(hours=hourly_hours)
        semaphore = asyncio.Semaphore(MAX_PARALLEL_DOWNLOADS)

        async def fetch(param: str, points: list[tuple[int, int]], limit: datetime | None):
            async with semaphore:
                return param, await self.async_get_points_series(
                    run.urls[param], points, limit
                )

        daily = dict(
            await asyncio.gather(*(fetch(p, [point, *extra], None) for p in daily_params))
        )
        hourly = dict(
            await asyncio.gather(*(fetch(p, [point], until) for p in hourly_params))
        )
        return LocalForecast(
            reference_time=run.reference_time,
            daily=_merge_series({p: daily[p][point] for p in daily_params}),
            hourly=_merge_series(
                {p: hourly[p][point] for p in hourly_params},
                # Keep the hour in progress (its timestamp is its end).
                not_before=now - timedelta(hours=1),
            ),
            others={
                other: _merge_series({p: daily[p][other] for p in daily_params})
                for other in extra
            },
        )


def _merge_series(
    series: dict[str, list[tuple[datetime, float | None]]],
    not_before: datetime | None = None,
) -> list[ForecastStep]:
    """Combine per-parameter series into one list of steps sorted by time."""
    steps: dict[datetime, dict[str, float | None]] = {}
    for param, values in series.items():
        for timestamp, value in values:
            if not_before is not None and timestamp <= not_before:
                continue
            steps.setdefault(timestamp, {})[param] = value
    return [ForecastStep(time=t, values=steps[t]) for t in sorted(steps)]
