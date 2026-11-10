"""Swiss lakes: facts and water temperature from the Eawag Alplakes models.

Alplakes (https://www.alplakes.eawag.ch, CC BY 4.0) runs
- a 1D model (Simstrat) for every lake: temperature by depth, oxygen,
  thermocline, ice, with a 4-5 day forecast and its 10-90 % range;
- a 3D model (MITgcm or Delft3D) for some lakes: temperature and currents
  on a grid covering the whole lake (drawn as a map by the lake card).

Lake facts (altitude, area, depth, volume) are rounded reference values.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
import logging
from typing import Any

import aiohttp

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import MeteoSwissConnectionError, MeteoSwissError, distance_km
from .const import DOMAIN, LAKE_UPDATE_INTERVAL

_LOGGER = logging.getLogger(__name__)

ALPLAKES_URL = "https://alplakes-api.eawag.ch"
TIMEOUT = aiohttp.ClientTimeout(total=60)
# Alplakes limits the request rate and asks clients to identify themselves.
HEADERS = {"User-Agent": "MeteoSwissCompleteForHA (Home Assistant custom integration)"}
REQUEST_GAP = 1.0  # seconds between two requests of the coordinator


@dataclass(frozen=True, slots=True)
class Lake:
    """A lake with its reference facts and Alplakes model names."""

    key: str
    names: dict[str, str]
    altitude: float  # m a.s.l.
    area: float  # km²
    max_depth: float  # m
    volume: float  # km³
    latitude: float
    longitude: float
    simstrat: str  # 1D model id
    model3d: tuple[str, str] | None = None  # (model, lake) of the 3D model


def _n(de: str, fr: str, it: str, rm: str, en: str) -> dict[str, str]:
    return {"de": de, "fr": fr, "it": it, "rm": rm, "en": en}


LAKES: tuple[Lake, ...] = (
    Lake("geneva", _n("Genfersee", "Léman", "Lago Lemano", "Lai Leman", "Lake Geneva"),
         372, 580, 310, 89, 46.45, 6.55, "geneva", ("delft3d-flow", "geneva")),
    Lake("constance", _n("Bodensee", "Lac de Constance", "Lago di Costanza", "Lai da Constanza", "Lake Constance"),
         395, 536, 251, 48, 47.6, 9.4, "upperconstance"),
    Lake("neuchatel", _n("Neuenburgersee", "Lac de Neuchâtel", "Lago di Neuchâtel", "Lai da Neuchâtel", "Lake Neuchâtel"),
         429, 218, 152, 14, 46.9, 6.85, "neuchatel", ("mitgcm", "neuchatel")),
    Lake("maggiore", _n("Lago Maggiore", "Lac Majeur", "Lago Maggiore", "Lai Maggiore", "Lake Maggiore"),
         193, 212, 372, 37, 46.1, 8.72, "maggiore"),
    Lake("lucerne", _n("Vierwaldstättersee", "Lac des Quatre-Cantons", "Lago dei Quattro Cantoni",
                       "Lai dals Quatter Chantuns", "Lake Lucerne"),
         434, 114, 214, 11.8, 47.0, 8.45, "lucernekreuztrichterandvitznauerbecken", ("mitgcm", "lucerne")),
    Lake("zurich", _n("Zürichsee", "Lac de Zurich", "Lago di Zurigo", "Lai da Turitg", "Lake Zurich"),
         406, 88, 136, 3.9, 47.25, 8.65, "lowerzurich", ("mitgcm", "zurich")),
    Lake("lugano", _n("Luganersee", "Lac de Lugano", "Lago di Lugano", "Lai da Lugano", "Lake Lugano"),
         271, 49, 288, 6.5, 45.98, 8.97, "upperlugano", ("delft3d-flow", "lugano")),
    Lake("thun", _n("Thunersee", "Lac de Thoune", "Lago di Thun", "Lai da Thun", "Lake Thun"),
         558, 48, 217, 6.5, 46.69, 7.72, "thun"),
    Lake("biel", _n("Bielersee", "Lac de Bienne", "Lago di Bienne", "Lai da Biel", "Lake Biel"),
         429, 39, 74, 1.1, 47.08, 7.17, "biel", ("delft3d-flow", "biel")),
    Lake("zug", _n("Zugersee", "Lac de Zoug", "Lago di Zugo", "Lai da Zug", "Lake Zug"),
         413, 38, 198, 3.2, 47.13, 8.48, "zug", ("mitgcm", "zug")),
    Lake("brienz", _n("Brienzersee", "Lac de Brienz", "Lago di Brienz", "Lai da Brienz", "Lake Brienz"),
         564, 30, 260, 5.2, 46.72, 7.95, "brienz"),
    Lake("walensee", _n("Walensee", "Lac de Walenstadt", "Lago di Walenstadt", "Lai da Walenstadt", "Lake Walen"),
         419, 24, 150, 2.5, 47.12, 9.2, "walensee"),
    Lake("murten", _n("Murtensee", "Lac de Morat", "Lago di Morat", "Lai da Murten", "Lake Murten"),
         429, 23, 45, 0.55, 46.93, 7.08, "murten", ("delft3d-flow", "murten")),
    Lake("sempach", _n("Sempachersee", "Lac de Sempach", "Lago di Sempach", "Lai da Sempach", "Lake Sempach"),
         504, 14, 87, 0.66, 47.15, 8.15, "sempach"),
    Lake("hallwil", _n("Hallwilersee", "Lac de Hallwil", "Lago di Hallwil", "Lai da Hallwil", "Lake Hallwil"),
         449, 10, 47, 0.29, 47.28, 8.22, "hallwil", ("delft3d-flow", "hallwil")),
    Lake("gruyere", _n("Greyerzersee", "Lac de la Gruyère", "Lago della Gruyère", "Lai da la Gruyère", "Lake Gruyère"),
         677, 9.6, 75, 0.22, 46.68, 7.08, "gruyere"),
    Lake("joux", _n("Lac de Joux", "Lac de Joux", "Lago di Joux", "Lai da Joux", "Lac de Joux"),
         1004, 8.8, 34, 0.15, 46.63, 6.28, "joux", ("delft3d-flow", "joux")),
    Lake("greifensee", _n("Greifensee", "Lac de Greifen", "Lago di Greifen", "Lai da Greifen", "Lake Greifen"),
         435, 8.5, 32, 0.15, 47.35, 8.68, "greifensee", ("delft3d-flow", "greifensee")),
    Lake("sarnen", _n("Sarnersee", "Lac de Sarnen", "Lago di Sarnen", "Lai da Sarnen", "Lake Sarnen"),
         469, 7.5, 52, 0.24, 46.87, 8.22, "sarnen"),
    Lake("aegeri", _n("Ägerisee", "Lac d'Ägeri", "Lago di Ägeri", "Lai d'Ägeri", "Lake Ägeri"),
         724, 7.3, 82, 0.36, 47.12, 8.62, "aegeri", ("delft3d-flow", "ageri")),
    Lake("baldegg", _n("Baldeggersee", "Lac de Baldegg", "Lago di Baldegg", "Lai da Baldegg", "Lake Baldegg"),
         463, 5.2, 66, 0.17, 47.2, 8.26, "baldegg"),
    Lake("sils", _n("Silsersee", "Lac de Sils", "Lago di Sils", "Lej da Segl", "Lake Sils"),
         1797, 4.1, 71, 0.14, 46.42, 9.74, "sils"),
    Lake("pfaffikon", _n("Pfäffikersee", "Lac de Pfäffikon", "Lago di Pfäffikon", "Lai da Pfäffikon", "Lake Pfäffikon"),
         537, 3.3, 35, 0.06, 47.35, 8.78, "pfaffikon"),
    Lake("silvaplana", _n("Silvaplanersee", "Lac de Silvaplana", "Lago di Silvaplana", "Lej da Silvaplauna", "Lake Silvaplana"),
         1791, 2.7, 77, 0.14, 46.45, 9.79, "silvaplana"),
    Lake("lungern", _n("Lungerersee", "Lac de Lungern", "Lago di Lungern", "Lai da Lungern", "Lake Lungern"),
         689, 2.0, 68, 0.07, 46.79, 8.16, "lungern"),
    Lake("poschiavo", _n("Lago di Poschiavo", "Lac de Poschiavo", "Lago di Poschiavo", "Lai da Puschlav", "Lake Poschiavo"),
         962, 2.0, 85, 0.12, 46.28, 10.08, "poschiavo"),
    Lake("stmoritz", _n("St. Moritzersee", "Lac de Saint-Moritz", "Lago di St. Moritz", "Lej da San Murezzan", "Lake St. Moritz"),
         1768, 0.78, 44, 0.02, 46.495, 9.845, "stmoritz", ("delft3d-flow", "stmoritz")),
)
LAKES_BY_KEY = {lake.key: lake for lake in LAKES}


def default_lakes(lat: float, lon: float, radius_km: float = 15) -> list[str]:
    """The lake nearest to home, if one is close (used when nothing is chosen)."""
    near = sorted((distance_km(lat, lon, l.latitude, l.longitude), l.key) for l in LAKES)
    return [near[0][1]] if near and near[0][0] <= radius_km else []


def lake_facts(lake: Lake) -> dict[str, Any]:
    """Static facts of a lake (JSON-ready)."""
    return {
        "key": lake.key,
        "names": lake.names,
        "altitude": lake.altitude,
        "area": lake.area,
        "max_depth": lake.max_depth,
        "volume": lake.volume,
        "lat": lake.latitude,
        "lon": lake.longitude,
        "map": lake.model3d is not None,
    }


def _stamp(time: datetime) -> str:
    return time.astimezone(UTC).strftime("%Y%m%d%H%M")


class AlplakesClient:
    """Small client for the Alplakes API."""

    def __init__(self, session: aiohttp.ClientSession) -> None:
        """Initialize with a shared aiohttp session."""
        self._session = session

    async def _get(self, path: str, params: list[tuple[str, str]] | None = None) -> Any:
        url = f"{ALPLAKES_URL}{path}"
        try:
            async with self._session.get(
                url, params=params, timeout=TIMEOUT, headers=HEADERS
            ) as resp:
                resp.raise_for_status()
                return await resp.json(content_type=None)
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            raise MeteoSwissConnectionError(f"Alplakes {path}: {err}") from err

    async def async_get_series(self, lake: Lake, now: datetime, depth: float = 1) -> dict[str, Any]:
        """Temperature (with range) and oxygen at a depth, thermocline and ice.

        From yesterday to the end of the forecast, every 3 hours.
        """
        start, end = now - timedelta(days=1), now + timedelta(days=5)
        base = f"/simulations/1d/point/simstrat/{lake.simstrat}/{_stamp(start)}/{_stamp(end)}"
        depth_vars = [("variables", v) for v in ("T", "T_p10", "T_p90", "OxygenSat")]
        time_vars = [("variables", v) for v in ("Thermocline", "TotalIceH")]
        at_depth = await self._get(f"{base}/{depth:g}", depth_vars)
        try:
            column = await self._get(f"{base}/{depth:g}", time_vars)
        except MeteoSwissError as err:
            column = err
        series: dict[str, Any] = {"time": at_depth.get("time") or []}
        for key, var in (at_depth.get("variables") or {}).items():
            series[key] = [_round(v, 2) for v in var.get("data") or []]
        if not isinstance(column, BaseException):
            for key, var in (column.get("variables") or {}).items():
                series[key] = [_round(v, 2) for v in var.get("data") or []]
        return series

    async def async_get_profile(self, lake: Lake, time: datetime) -> dict[str, Any]:
        """Temperature and oxygen from the surface to the bottom."""
        data = await self._get(
            f"/simulations/1d/profile/simstrat/{lake.simstrat}/{_stamp(time)}",
            [("variables", "T"), ("variables", "OxygenSat")],
        )
        result: dict[str, Any] = {
            "time": data.get("time"),
            "depth": [_round(d, 1) for d in (data.get("depth") or {}).get("data") or []],
        }
        for key, var in (data.get("variables") or {}).items():
            result[key] = [_round(v, 2) for v in var.get("data") or []]
        return result

    async def async_get_layer(self, lake: Lake, time: datetime, depth: float = 1) -> dict[str, Any] | None:
        """Temperature and currents on the 3D model grid (None: no 3D model)."""
        if lake.model3d is None:
            return None
        model, name = lake.model3d
        # 3D results are stored every 3 hours.
        time = time.replace(minute=0, second=0, microsecond=0)
        time -= timedelta(hours=time.hour % 3)
        data = await self._get(f"/simulations/layer/{model}/{name}/{_stamp(time)}/{depth:g}")
        var = data.get("variables") or {}
        return {
            "time": data.get("time"),
            "lat": [[_round(v, 5) for v in row] for row in data.get("lat") or []],
            "lng": [[_round(v, 5) for v in row] for row in data.get("lng") or []],
            "t": [[_round(v, 2) for v in row] for row in (var.get("temperature") or {}).get("data") or []],
            "u": [[_round(v, 3) for v in row] for row in (var.get("u") or {}).get("data") or []],
            "v": [[_round(v, 3) for v in row] for row in (var.get("v") or {}).get("data") or []],
        }


def _round(value: Any, digits: int) -> float | None:
    return round(value, digits) if isinstance(value, (int, float)) else None


def value_at(series: dict[str, Any], key: str, when: datetime) -> float | None:
    """Value of a 3-hourly series at a time (nearest step)."""
    times = series.get("time") or []
    values = series.get(key) or []
    best = None
    for text, value in zip(times, values, strict=False):
        if value is None:
            continue
        delta = abs((datetime.fromisoformat(text) - when).total_seconds())
        if best is None or delta < best[0]:
            best = (delta, value)
    return best[1] if best and best[0] <= 6 * 3600 else None


class LakeCoordinator(DataUpdateCoordinator[dict[str, dict[str, Any]]]):
    """Surface temperature and forecast of the chosen lakes (hourly)."""

    def __init__(self, hass: HomeAssistant, entry, client: AlplakesClient, lakes: list[Lake]) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} lakes",
            update_interval=LAKE_UPDATE_INTERVAL,
        )
        self.client = client
        self.lakes = lakes

    async def _async_update_data(self) -> dict[str, dict[str, Any]]:
        now = dt_util.utcnow()
        data: dict[str, dict[str, Any]] = {}
        for index, lake in enumerate(self.lakes):
            if index:
                await asyncio.sleep(REQUEST_GAP)  # one lake after the other
            try:
                data[lake.key] = await self.client.async_get_series(lake, now)
            except MeteoSwissError as err:
                _LOGGER.debug("Lake %s unavailable: %s", lake.key, err)
                if self.data and lake.key in self.data:
                    data[lake.key] = self.data[lake.key]
        if not data:
            raise UpdateFailed("No lake data available")
        return data
