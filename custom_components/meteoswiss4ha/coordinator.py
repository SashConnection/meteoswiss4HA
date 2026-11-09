"""Data update coordinators for MeteoSwiss Complete For HA."""

from __future__ import annotations

import logging
from dataclasses import dataclass, replace
from datetime import date, datetime, timedelta

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.sun import is_up
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import (
    CurrentConditions,
    LocalForecast,
    MeteoSwissClient,
    MeteoSwissError,
    PollenMeasurement,
    Station,
)
from .cities import CITY_POINTS
from .hazards import (
    DROUGHT_LAYER,
    FOREST_FIRE_LAYER,
    HazardClient,
    HazardData,
    HazardLevel,
    find_region,
)
from .pollen import PollenData, summarize
from .symbols import NIGHT_OFFSET, is_night_code
from .const import (
    DAILY_SYMBOL,
    HOURLY_SYMBOL,
    SWISS_TZ,
    CONF_HOURLY_FORECAST,
    CONF_HOURLY_HOURS,
    CONF_HOURLY_INTERVAL,
    CONF_POINT_ID,
    CONF_POINT_TYPE_ID,
    CONF_STATION,
    CURRENT_UPDATE_INTERVAL,
    DAILY_PARAMS,
    DEFAULT_HOURLY_FORECAST,
    DEFAULT_HOURLY_HOURS,
    DEFAULT_HOURLY_INTERVAL,
    DOMAIN,
    FORECAST_UPDATE_INTERVAL,
    POLLEN_UPDATE_INTERVAL,
    HAZARD_UPDATE_INTERVAL,
    CONF_AVALANCHE_REGION,
    HOURLY_PARAMS,
)

_LOGGER = logging.getLogger(__name__)


@dataclass
class MeteoSwissData:
    """Runtime data stored on the config entry."""

    client: MeteoSwissClient
    current: CurrentCoordinator
    forecast: ForecastCoordinator
    pollen: PollenCoordinator | None = None
    hazards: HazardCoordinator | None = None


class PollenCoordinator(DataUpdateCoordinator[PollenData]):
    """Fetch hourly pollen measurements of the nearest pollen station.

    Today's values come from a small file polled every hour; the end of
    yesterday (needed for the 24-hour mean) is read once a day.
    """

    config_entry: MeteoSwissConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: MeteoSwissConfigEntry,
        client: MeteoSwissClient,
        station: Station,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} pollen {station.abbr}",
            update_interval=POLLEN_UPDATE_INTERVAL,
        )
        self._client = client
        self.station = station
        self._recent: list[PollenMeasurement] = []
        self._recent_day: date | None = None

    async def _async_update_data(self) -> PollenData:
        now = dt_util.utcnow()
        try:
            if self._recent_day != now.date():
                recent = await self._client.async_get_pollen(self.station.abbr, recent=True)
                self._recent = [r for r in recent if r.time > now - timedelta(hours=48)]
                self._recent_day = now.date()
            today = await self._client.async_get_pollen(self.station.abbr)
        except MeteoSwissError as err:
            raise UpdateFailed(f"Error fetching pollen data: {err}") from err
        seen = {r.time for r in today}
        rows = today + [r for r in self._recent if r.time not in seen]
        return summarize(self.station.abbr, rows, now)


type MeteoSwissConfigEntry = ConfigEntry[MeteoSwissData]


class CurrentCoordinator(DataUpdateCoordinator[CurrentConditions]):
    """Fetch the latest 10-minute measurements of the configured station."""

    config_entry: MeteoSwissConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: MeteoSwissConfigEntry,
        client: MeteoSwissClient,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} current {entry.data[CONF_STATION]}",
            update_interval=CURRENT_UPDATE_INTERVAL,
        )
        self._client = client
        self.station = entry.data[CONF_STATION]

    async def _async_update_data(self) -> CurrentConditions:
        try:
            stations = await self._client.async_get_current()
        except MeteoSwissError as err:
            raise UpdateFailed(f"Error fetching current conditions: {err}") from err
        if self.station not in stations:
            raise UpdateFailed(f"Station {self.station} not found in current data")
        return stations[self.station]


class ForecastCoordinator(DataUpdateCoordinator[LocalForecast]):
    """Fetch the local forecast of the configured point.

    The daily forecast is refreshed every hour. The hourly forecast is much
    larger to download and is refreshed at its own (longer) interval; in
    between, the last hourly forecast is kept and its past steps dropped.
    """

    config_entry: MeteoSwissConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: MeteoSwissConfigEntry,
        client: MeteoSwissClient,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} forecast {entry.data[CONF_POINT_ID]}",
            update_interval=FORECAST_UPDATE_INTERVAL,
        )
        self._client = client
        self.point = (entry.data[CONF_POINT_ID], entry.data[CONF_POINT_TYPE_ID])
        self.hourly_enabled: bool = entry.options.get(
            CONF_HOURLY_FORECAST, DEFAULT_HOURLY_FORECAST
        )
        self._hourly_hours: int = int(
            entry.options.get(CONF_HOURLY_HOURS, DEFAULT_HOURLY_HOURS)
        )
        self._hourly_interval = timedelta(
            minutes=int(entry.options.get(CONF_HOURLY_INTERVAL, DEFAULT_HOURLY_INTERVAL))
        )
        self._hourly_fetched_at: datetime | None = None

    def _hourly_due(self, now: datetime) -> bool:
        if not self.hourly_enabled:
            return False
        if self.data is None or self._hourly_fetched_at is None:
            return True
        # Small margin so that "every 180 min" really happens every 3rd poll.
        return now - self._hourly_fetched_at >= self._hourly_interval - timedelta(
            minutes=5
        )

    async def _async_update_data(self) -> LocalForecast:
        now = dt_util.utcnow()
        fetch_hourly = self._hourly_due(now)
        try:
            forecast = await self._client.async_get_forecast(
                self.point,
                daily_params=DAILY_PARAMS,
                hourly_params=HOURLY_PARAMS if fetch_hourly else (),
                hourly_hours=self._hourly_hours,
                now=now,
                extra_points=CITY_POINTS,
            )
        except MeteoSwissError as err:
            raise UpdateFailed(f"Error fetching forecast: {err}") from err

        if not forecast.daily:
            raise UpdateFailed(f"No forecast data for point {self.point}")

        if fetch_hourly:
            self._hourly_fetched_at = now
        elif self.hourly_enabled and self.data is not None:
            # Reuse the previous hourly forecast, minus the hours already past.
            cutoff = now - timedelta(hours=1)
            forecast = replace(
                forecast,
                hourly=[step for step in self.data.hourly if step.time > cutoff],
            )
        return forecast

    def current_symbol(self) -> tuple[int | None, bool]:
        """Return the MeteoSwiss symbol code for now, and whether it is night.

        Uses the hourly forecast when available (its codes carry day/night),
        otherwise today's daily symbol with night taken from the sun.
        """
        if self.data is None:
            return None, False
        now = dt_util.utcnow()
        # Hourly steps are stamped at the end of their interval.
        for step in self.data.hourly:
            if step.time > now and step.values.get(HOURLY_SYMBOL) is not None:
                code = int(step.values[HOURLY_SYMBOL])
                return code, is_night_code(code)
        today = now.astimezone(SWISS_TZ).date()
        for step in self.data.daily:
            if step.time.date() == today and step.values.get(DAILY_SYMBOL) is not None:
                night = not is_up(self.hass)
                code = int(step.values[DAILY_SYMBOL])
                return (code + NIGHT_OFFSET if night else code), night
        return None, False


class HazardCoordinator(DataUpdateCoordinator[HazardData]):
    """Fetch avalanche, forest fire and drought warnings for the home location.

    Each source is fetched independently: if one fails, its previous value is
    kept and the others are still updated.
    """

    config_entry: MeteoSwissConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: MeteoSwissConfigEntry,
        client: HazardClient,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} hazards",
            update_interval=HAZARD_UPDATE_INTERVAL,
        )
        self._client = client
        self.latitude = hass.config.latitude
        self.longitude = hass.config.longitude
        self.region_id: str | None = entry.options.get(CONF_AVALANCHE_REGION)

    async def _async_update_data(self) -> HazardData:
        previous = self.data or HazardData(None, None, None, None)
        errors: list[str] = []

        avalanche = previous.avalanche
        try:
            if self.region_id is None:
                regions = await self._client.async_get_regions()
                self.region_id = find_region(regions, self.latitude, self.longitude)
            if self.region_id is not None:
                avalanche = await self._client.async_get_avalanche(self.region_id)
        except MeteoSwissError as err:
            errors.append(f"avalanche: {err}")

        levels: dict[str, HazardLevel | None] = {
            "fire": previous.forest_fire,
            "drought": previous.drought,
        }
        for key, layer in (("fire", FOREST_FIRE_LAYER), ("drought", DROUGHT_LAYER)):
            try:
                levels[key] = await self._client.async_get_level(
                    layer, self.latitude, self.longitude
                )
            except MeteoSwissError as err:
                errors.append(f"{key}: {err}")

        flood = previous.flood
        try:
            flood = await self._client.async_get_flood(self.latitude, self.longitude)
        except MeteoSwissError as err:
            errors.append(f"flood: {err}")

        if len(errors) == 4:
            raise UpdateFailed("; ".join(errors))
        for error in errors:
            _LOGGER.debug("Hazard source unavailable: %s", error)
        return HazardData(
            avalanche=avalanche,
            forest_fire=levels["fire"],
            drought=levels["drought"],
            flood=flood,
        )
