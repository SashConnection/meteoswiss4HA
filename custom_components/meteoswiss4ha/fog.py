"""Fog and low stratus by region, detected with reference stations.

Each region has a "ladder" of SwissMetNet stations from the plain up to the
hills and summits around it (Neuchâtel 485 m, Chaumont 1136 m, Chasseral
1594 m, ...). A station is in the fog or under the stratus when it gets no
sun and the air is saturated; a station above the sea of fog gets sun (by
day) or dry air (by night). The top of the fog lies between the highest
covered station and the lowest clear one above it.

Now: 10-minute measurements (sunshine, humidity, dew point, precipitation).
Forecast: the local forecast of the same stations (symbol 27 stratus /
28 fog, low cloud cover, sunshine duration), hour by hour.

The top altitude is an estimate: it can only be given between two stations.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import logging
import math
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import (
    POINT_TYPE_STATION,
    CurrentConditions,
    MeteoSwissClient,
    MeteoSwissError,
    distance_km,
)
from .const import (
    DOMAIN,
    FOG_FORECAST_INTERVAL,
    FOG_UPDATE_INTERVAL,
    HOURLY_SYMBOL,
    SWISS_TZ,
)

_LOGGER = logging.getLogger(__name__)

HOURLY_LOW_CLOUDS = "nprolohs"
HOURLY_SUNSHINE = "sre000h0"
FOG_PARAMS = (HOURLY_SYMBOL, HOURLY_LOW_CLOUDS, HOURLY_SUNSHINE)
FOG_HOURS = 72

# (key, names de/fr/it/rm/en, station ladder from the plain to the summits)
REGIONS: tuple[tuple[str, dict[str, str], tuple[str, ...]], ...] = (
    (
        "three_lakes",
        {"de": "Drei-Seen-Land", "fr": "Trois-Lacs", "it": "Regione dei Tre Laghi",
         "rm": "Regiun dals Trais Lais", "en": "Three Lakes"},
        ("NEU", "PAY", "CHM", "FRE", "CHA"),
    ),
    (
        "leman",
        {"de": "Genferseeregion", "fr": "Bassin lémanique", "it": "Bacino del Lemano",
         "rm": "Bassin dal Leman", "en": "Lake Geneva"},
        ("GVE", "CGI", "PUY", "BIE", "DOL"),
    ),
    (
        "fribourg",
        {"de": "Freiburger Mittelland", "fr": "Plateau fribourgeois",
         "it": "Altopiano friburghese", "rm": "Plaun friburgais", "en": "Fribourg plateau"},
        ("PAY", "GRA", "PLF", "MLS"),
    ),
    (
        "bern",
        {"de": "Bern / Mittelland", "fr": "Berne / Plateau central",
         "it": "Berna / Altopiano centrale", "rm": "Berna / Plaun central",
         "en": "Bern / Central Plateau"},
        ("WYN", "BER", "BAN", "NAP"),
    ),
    (
        "zurich",
        {"de": "Zürich / Ostschweiz", "fr": "Zurich / Nord-est", "it": "Zurigo / Nord-est",
         "rm": "Turitg / Ost", "en": "Zurich / North-east"},
        ("KLO", "TAE", "SMA", "LAE", "UEB", "HOE", "SAE"),
    ),
    (
        "central",
        {"de": "Zentralschweiz", "fr": "Suisse centrale", "it": "Svizzera centrale",
         "rm": "Svizra centrala", "en": "Central Switzerland"},
        ("LUZ", "MOA", "EGO", "EIN", "PIL"),
    ),
    (
        "basel",
        {"de": "Basel / Nordjura", "fr": "Bâle / Jura nord", "it": "Basilea / Giura nord",
         "rm": "Basilea / Jura dal nord", "en": "Basel / North Jura"},
        ("BAS", "DEM", "FAH", "RUE"),
    ),
    (
        "ticino",
        {"de": "Tessin", "fr": "Tessin", "it": "Ticino", "rm": "Tessin", "en": "Ticino"},
        ("MAG", "LUG", "OTL", "GEN", "CIM"),
    ),
)
STATIONS = tuple(dict.fromkeys(a for _, _, ladder in REGIONS for a in ladder))

# Station states.
FOG = "fog"  # in the fog / inside the stratus (saturated, no sun)
GREY = "grey"  # under a grey sky (stratus above, no sun)
SUN = "sun"  # sunshine (by day)
DRY = "dry"  # clear, dry air (by night)
WET = "wet"  # precipitation: not a fog situation
CLOUD = "cloud"  # other clouds (forecast): unknown
COVERED = (FOG, GREY)
CLEAR = (SUN, DRY)

# Region states (sensor options).
REGION_STATES = ("clear", "fog", "stratus", "overcast", "precipitation")

# MeteoSwiss symbols (day codes; night = day + 100).
SYMBOL_FOG = 28
SYMBOL_STRATUS = 27
SYMBOLS_FAIR = (1, 2, 3, 4, 26)
SYMBOLS_WET = (
    6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
    29, 30, 31, 32, 33, 34, 36, 37, 38, 39, 40, 41, 42,
)


def sun_elevation(lat: float, lon: float, when: datetime) -> float:
    """Approximate elevation of the sun (degrees) at a place and UTC time."""
    when = when.astimezone(UTC)
    day = when.timetuple().tm_yday
    decl = math.radians(23.44) * math.sin(math.radians(360 / 365 * (day - 81)))
    hours = when.hour + when.minute / 60 + lon / 15
    # Equation of time is ignored (a few minutes: irrelevant here).
    angle = math.radians(15 * (hours - 12))
    lat_r = math.radians(lat)
    sin_el = math.sin(lat_r) * math.sin(decl) + math.cos(lat_r) * math.cos(decl) * math.cos(angle)
    return math.degrees(math.asin(max(-1.0, min(1.0, sin_el))))


def station_now(values: dict[str, float | None], day: bool) -> str | None:
    """State of a station from its latest 10-minute measurement."""
    hum = values.get("ure200s0")
    sun = values.get("sre000z0")
    rain = values.get("rre150z0")
    temp, dew = values.get("tre200s0"), values.get("tde200s0")
    if hum is None and sun is None:
        return None
    if rain is not None and rain > 0:
        return WET
    saturated = (hum is not None and hum >= 96) or (
        temp is not None and dew is not None and temp - dew <= 0.6
    )
    if day:
        if sun is not None and sun >= 3:
            return SUN
        return FOG if saturated else GREY
    if saturated:
        return FOG
    # By night only clearly dry air tells that the station is above the fog.
    return DRY if hum is not None and hum <= 85 else CLOUD


def station_forecast(
    symbol: float | None, low_clouds: float | None, sunshine: float | None, day: bool
) -> str | None:
    """State of a station for one forecast hour."""
    if symbol is None:
        return None
    code = int(symbol) % 100
    if code == SYMBOL_FOG:
        return FOG
    if code in SYMBOLS_WET:
        return WET
    if code == SYMBOL_STRATUS:
        return GREY
    if low_clouds is not None and low_clouds >= 80 and (not day or (sunshine or 0) <= 10):
        return GREY
    if day and sunshine is not None and sunshine >= 20:
        return SUN
    if code in SYMBOLS_FAIR:
        return SUN if day else DRY
    return CLOUD


def region_state(ladder: list[tuple[float, str | None]]) -> dict[str, Any]:
    """Region state from (altitude, station state) sorted by altitude.

    Returns {"state", "top_min", "top_max"}: the fog top lies between
    top_min (highest covered station) and top_max (lowest clear station
    above it); either can be None when unknown.
    """
    known = [(alt, st) for alt, st in ladder if st is not None]
    if not known:
        return {"state": None, "top_min": None, "top_max": None}
    low = known[0][0]
    plain = [st for alt, st in known if alt <= low + 200]
    if WET in plain:
        return {"state": "precipitation", "top_min": None, "top_max": None}
    if not any(st in COVERED for st in plain):
        return {"state": "clear", "top_min": None, "top_max": None}
    # Walk up from the plain: the fog layer ends at the first clear station.
    # Higher covered stations (a summit in the clouds) are another layer.
    highest = None
    for alt, st in known:
        if st in COVERED:
            highest = alt
        elif st in CLEAR and highest is not None:
            state = "fog" if FOG in plain else "stratus"
            return {"state": state, "top_min": highest, "top_max": alt}
    state = "fog" if FOG in plain else "stratus"
    # Nothing clear above: grey up to the highest station (or general clouds).
    return {"state": "overcast" if len(known) > 1 else state, "top_min": highest, "top_max": None}


def summarize_days(hours: list[dict[str, Any]], tz=SWISS_TZ) -> list[dict[str, Any]]:
    """Per local day: fog/stratus hours, first and last hour, typical top."""
    days: dict[str, list[dict[str, Any]]] = {}
    for hour in hours:
        local = datetime.fromisoformat(hour["time"]).astimezone(tz)
        days.setdefault(local.date().isoformat(), []).append(hour)
    result = []
    for date, items in days.items():
        foggy = [h for h in items if h["state"] in ("fog", "stratus", "overcast")]
        tops = [h for h in foggy if h["top_max"] is not None]
        entry: dict[str, Any] = {"date": date, "hours": len(foggy), "state": "clear"}
        if foggy:
            kinds = [h["state"] for h in foggy]
            entry["state"] = max(set(kinds), key=kinds.count)
            entry["start"] = foggy[0]["time"]
            entry["end"] = foggy[-1]["time"]
            if tops:
                entry["top_min"] = sorted(h["top_min"] for h in tops)[len(tops) // 2]
                entry["top_max"] = sorted(h["top_max"] for h in tops)[len(tops) // 2]
                entry["sun_above"] = True
            else:
                entry["top_min"] = max((h["top_min"] or 0) for h in foggy) or None
        elif any(h["state"] == "precipitation" for h in items):
            entry["state"] = "precipitation"
        result.append(entry)
    return result


@dataclass(frozen=True, slots=True)
class FogStation:
    """A reference station with its local forecast point."""

    abbr: str
    name: str
    altitude: float
    latitude: float
    longitude: float
    point: tuple[int, int]


class FogCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Fog by region: measurements every 10 minutes, forecast every 6 hours."""

    def __init__(self, hass: HomeAssistant, entry, client: MeteoSwissClient) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} fog",
            update_interval=FOG_UPDATE_INTERVAL,
        )
        self._client = client
        self.stations: dict[str, FogStation] = {}
        self._forecast: dict[str, list[tuple[datetime, str | None]]] = {}
        self._forecast_at: datetime | None = None
        self._fetched_at: datetime | None = None
        self.home_region: str | None = None

    async def _load_stations(self) -> None:
        points = await self._client.async_get_points()
        for p in points:
            if p.point_type_id == POINT_TYPE_STATION and p.station_abbr in STATIONS:
                self.stations[p.station_abbr] = FogStation(
                    p.station_abbr, p.name, p.altitude or 0, p.latitude, p.longitude,
                    (p.point_id, p.point_type_id),
                )
        lat, lon = self.hass.config.latitude, self.hass.config.longitude
        best = None
        for key, _, ladder in REGIONS:
            plain = [self.stations[a] for a in ladder[:2] if a in self.stations]
            for st in plain:
                dist = distance_km(lat, lon, st.latitude, st.longitude)
                if best is None or dist < best[0]:
                    best = (dist, key)
        self.home_region = best[1] if best else None

    async def _load_forecast(self, now: datetime) -> None:
        run = await self._client.async_get_latest_run(FOG_PARAMS, now)
        points = [s.point for s in self.stations.values()]
        until = now + timedelta(hours=FOG_HOURS)
        series = {}
        for param in FOG_PARAMS:
            series[param] = await self._client.async_get_points_series(
                run.urls[param], points, until
            )
        forecast: dict[str, list[tuple[datetime, str | None]]] = {}
        for abbr, st in self.stations.items():
            sym = dict(series[HOURLY_SYMBOL][st.point])
            low = dict(series[HOURLY_LOW_CLOUDS][st.point])
            sun = dict(series[HOURLY_SUNSHINE][st.point])
            # Low cloud cover is a fraction (0-1) in the files: use percent.
            scale = 100 if low and max((v or 0) for v in low.values()) <= 1.0 else 1
            hours = []
            for time in sorted(sun.keys() | sym.keys()):
                if time <= now - timedelta(hours=1):
                    continue
                # Steps are stamped at the end of the hour: the sun at mid-hour.
                day = sun_elevation(st.latitude, st.longitude, time - timedelta(minutes=30)) > 2
                lc = low.get(time)
                hours.append((time, station_forecast(
                    sym.get(time) if sym.get(time) is not None else _symbol_before(sym, time),
                    lc * scale if lc is not None else None, sun.get(time), day,
                )))
            forecast[abbr] = hours
        self._forecast = forecast
        self._forecast_at = run.reference_time

    async def _async_update_data(self) -> dict[str, Any]:
        now = dt_util.utcnow()
        try:
            if not self.stations:
                await self._load_stations()
            current = await self._client.async_get_current()
        except MeteoSwissError as err:
            raise UpdateFailed(f"Fog data unavailable: {err}") from err
        if self._fetched_at is None or now - self._fetched_at >= FOG_FORECAST_INTERVAL:
            try:
                await self._load_forecast(now)
                self._fetched_at = now
            except MeteoSwissError as err:
                _LOGGER.debug("Fog forecast unavailable: %s", err)
        data = build(self.stations, current, self._forecast, now)
        data["forecast_time"] = self._forecast_at.isoformat() if self._forecast_at else None
        data["home_region"] = self.home_region
        return data


def _symbol_before(sym: dict[datetime, float | None], time: datetime) -> float | None:
    """The 3-hourly symbol covering an hour (symbols are every 3 hours)."""
    for delta in (1, 2):
        value = sym.get(time + timedelta(hours=delta))
        if value is not None:
            return value
    return None


def build(
    stations: dict[str, FogStation],
    current: dict[str, CurrentConditions],
    forecast: dict[str, list[tuple[datetime, str | None]]],
    now: datetime,
) -> dict[str, Any]:
    """JSON-ready fog data of every region (API, card and sensors)."""
    regions = []
    for key, names, ladder in REGIONS:
        members = sorted((stations[a] for a in ladder if a in stations), key=lambda s: s.altitude)
        rows = []
        for st in members:
            cur = current.get(st.abbr)
            day = sun_elevation(st.latitude, st.longitude, now) > 2
            values = cur.values if cur else {}
            rows.append(
                {
                    "abbr": st.abbr,
                    "name": st.name,
                    "altitude": st.altitude,
                    "lat": st.latitude,
                    "lon": st.longitude,
                    "state": station_now(values, day) if cur else None,
                    "temperature": values.get("tre200s0"),
                    "humidity": values.get("ure200s0"),
                    "sunshine": values.get("sre000z0"),
                }
            )
        now_state = region_state([(r["altitude"], r["state"]) for r in rows])
        # Forecast: one entry per hour present for every station of the ladder.
        times = sorted({t for st in members for t, _ in forecast.get(st.abbr, [])})
        by_station = {st.abbr: dict(forecast.get(st.abbr, [])) for st in members}
        hours = []
        grid = {st.abbr: "" for st in members}
        for time in times:
            ladder_states = [(st.altitude, by_station[st.abbr].get(time)) for st in members]
            hours.append({"time": time.isoformat(), **region_state(ladder_states)})
            for st in members:
                grid[st.abbr] += _CODE.get(by_station[st.abbr].get(time), "-")
        regions.append(
            {
                "key": key,
                "names": names,
                "stations": rows,
                "now": now_state,
                "hours": hours,
                "grid": grid,
                "days": summarize_days(hours),
            }
        )
    add_escapes(regions)
    return {"updated": now.isoformat(), "regions": regions}


def add_escapes(regions: list[dict[str, Any]], max_km: float = 70) -> None:
    """Escape the fog: the nearest station in the sun above the fog of each region.

    "escape" (now): a sunny station above the top, nearest to the plain of the
    region. "escape_forecast": the first coming hour when one of the region's
    own upper stations gets sunshine (from the forecast grid).
    """
    sunny = {s["abbr"]: s for r in regions for s in r["stations"] if s["state"] == SUN}
    for region in regions:
        now = region["now"]
        region["escape"] = None
        region["escape_forecast"] = None
        if now["state"] not in ("fog", "stratus", "overcast"):
            continue
        plain = region["stations"][0]
        top = now["top_min"] or plain["altitude"]
        best = None
        for st in sunny.values():
            if st["altitude"] <= top:
                continue
            dist = distance_km(plain["lat"], plain["lon"], st["lat"], st["lon"])
            if dist <= max_km and (best is None or dist < best[0]):
                best = (dist, st)
        if best:
            region["escape"] = {"name": best[1]["name"], "altitude": best[1]["altitude"], "distance_km": round(best[0])}
        hours = region["hours"]
        for st in region["stations"][1:]:
            grid = region["grid"].get(st["abbr"], "")
            for i, code in enumerate(grid[:24]):
                if code == "s" and i < len(hours):
                    cand = (hours[i]["time"], st)
                    if region["escape_forecast"] is None or cand[0] < region["escape_forecast"]["time"]:
                        region["escape_forecast"] = {"time": cand[0], "name": st["name"], "altitude": st["altitude"]}
                    break


# One letter per station state in the hourly grid (compact JSON).
_CODE = {FOG: "f", GREY: "g", SUN: "s", DRY: "d", WET: "w", CLOUD: "c"}
