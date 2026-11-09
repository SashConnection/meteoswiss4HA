"""Weather entity for MeteoSwiss Open Data."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from homeassistant.components.weather import (
    Forecast,
    WeatherEntity,
    WeatherEntityFeature,
)
from homeassistant.const import (
    UnitOfPrecipitationDepth,
    UnitOfPressure,
    UnitOfSpeed,
    UnitOfTemperature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.sun import is_up
from homeassistant.util import dt as dt_util

from .api import ForecastStep
from .const import (
    DAILY_PRECIPITATION,
    DAILY_SYMBOL,
    DAILY_TEMP_MAX,
    DAILY_TEMP_MIN,
    HOURLY_PRECIPITATION,
    HOURLY_PRECIPITATION_PROBABILITY,
    HOURLY_SYMBOL,
    HOURLY_TEMPERATURE,
    HOURLY_WIND_BEARING,
    HOURLY_WIND_GUST,
    HOURLY_WIND_SPEED,
)
from .coordinator import CurrentCoordinator, ForecastCoordinator, MeteoSwissConfigEntry
from .entity import MeteoSwissEntity
from .symbols import is_night_code, symbol_to_condition

SWISS_TZ = ZoneInfo("Europe/Zurich")

# Extra forecast key carrying the native MeteoSwiss symbol code.
ATTR_METEOSWISS_SYMBOL = "meteoswiss_symbol"


async def async_setup_entry(
    hass: HomeAssistant,
    entry: MeteoSwissConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the MeteoSwiss weather entity."""
    data = entry.runtime_data
    async_add_entities([MeteoSwissWeather(data.forecast, data.current, entry)])


def _int(value: float | None) -> int | None:
    return None if value is None else int(value)


class MeteoSwissWeather(MeteoSwissEntity[ForecastCoordinator], WeatherEntity):
    """Current conditions from a SwissMetNet station + local forecast."""

    _attr_name = None  # use the device name
    _attr_native_temperature_unit = UnitOfTemperature.CELSIUS
    _attr_native_pressure_unit = UnitOfPressure.HPA
    _attr_native_wind_speed_unit = UnitOfSpeed.KILOMETERS_PER_HOUR
    _attr_native_precipitation_unit = UnitOfPrecipitationDepth.MILLIMETERS

    def __init__(
        self,
        forecast: ForecastCoordinator,
        current: CurrentCoordinator,
        entry: MeteoSwissConfigEntry,
    ) -> None:
        """Initialize the weather entity."""
        super().__init__(forecast, entry)
        self._current = current
        self._attr_unique_id = f"{entry.entry_id}_weather"
        features = WeatherEntityFeature.FORECAST_DAILY
        if forecast.hourly_enabled:
            features |= WeatherEntityFeature.FORECAST_HOURLY
        self._attr_supported_features = features

    async def async_added_to_hass(self) -> None:
        """Also refresh the state when new measurements arrive."""
        await super().async_added_to_hass()
        self.async_on_remove(
            self._current.async_add_listener(self._handle_current_update)
        )

    @callback
    def _handle_current_update(self) -> None:
        self.async_write_ha_state()

    @callback
    def _handle_coordinator_update(self) -> None:
        """Push new forecasts to subscribers (e.g. weather cards)."""
        super()._handle_coordinator_update()
        self.hass.async_create_task(
            self.async_update_listeners(("daily", "hourly"))
        )

    @property
    def available(self) -> bool:
        """Available when either measurements or forecast are."""
        return self.coordinator.last_update_success or self._current.last_update_success

    # ---------------------------------------------------------------- current

    def _measurement(self, key: str) -> float | None:
        data = self._current.data
        return data.values.get(key) if data else None

    @property
    def native_temperature(self) -> float | None:
        """Return the measured temperature."""
        return self._measurement("tre200s0")

    @property
    def humidity(self) -> float | None:
        """Return the measured relative humidity."""
        return self._measurement("ure200s0")

    @property
    def native_dew_point(self) -> float | None:
        """Return the measured dew point."""
        return self._measurement("tde200s0")

    @property
    def native_pressure(self) -> float | None:
        """Return the pressure reduced to sea level (QFF)."""
        return self._measurement("pp0qffs0")

    @property
    def native_wind_speed(self) -> float | None:
        """Return the 10-minute mean wind speed."""
        return self._measurement("fu3010z0")

    @property
    def native_wind_gust_speed(self) -> float | None:
        """Return the gust peak."""
        return self._measurement("fu3010z1")

    @property
    def wind_bearing(self) -> float | None:
        """Return the wind direction."""
        return self._measurement("dkl010z0")

    def current_symbol(self) -> tuple[int | None, bool]:
        """Return the symbol code describing now, and whether it is night."""
        data = self.coordinator.data
        if data is None:
            return None, False
        now = dt_util.utcnow()
        # Hourly steps are stamped at the end of their interval.
        for step in data.hourly:
            if step.time > now and step.values.get(HOURLY_SYMBOL) is not None:
                code = int(step.values[HOURLY_SYMBOL])
                return code, is_night_code(code)
        today = now.astimezone(SWISS_TZ).date()
        for step in data.daily:
            if step.time.date() == today and step.values.get(DAILY_SYMBOL) is not None:
                return int(step.values[DAILY_SYMBOL]), not is_up(self.hass)
        return None, False

    @property
    def condition(self) -> str | None:
        """Return the current Home Assistant condition."""
        code, night = self.current_symbol()
        return symbol_to_condition(code, night)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Expose the native MeteoSwiss symbol and data sources."""
        code, _ = self.current_symbol()
        attrs: dict[str, Any] = {ATTR_METEOSWISS_SYMBOL: code}
        if self.coordinator.data:
            attrs["forecast_reference_time"] = (
                self.coordinator.data.reference_time.isoformat()
            )
        return attrs

    # --------------------------------------------------------------- forecast

    @staticmethod
    def _daily_forecast(step: ForecastStep) -> Forecast:
        values = step.values
        code = _int(values.get(DAILY_SYMBOL))
        # Daily steps are stamped 00:00 of their (Swiss local) calendar day.
        day = datetime.combine(step.time.date(), datetime.min.time(), SWISS_TZ)
        forecast = Forecast(
            datetime=day.isoformat(),
            condition=symbol_to_condition(code, night=False),
            native_temperature=values.get(DAILY_TEMP_MAX),
            native_templow=values.get(DAILY_TEMP_MIN),
            native_precipitation=values.get(DAILY_PRECIPITATION),
        )
        forecast[ATTR_METEOSWISS_SYMBOL] = code  # type: ignore[literal-required]
        return forecast

    @staticmethod
    def _hourly_forecast(step: ForecastStep) -> Forecast:
        values = step.values
        code = _int(values.get(HOURLY_SYMBOL))
        forecast = Forecast(
            # Report the start of the hour the values aggregate.
            datetime=(step.time - timedelta(hours=1)).isoformat(),
            condition=symbol_to_condition(code),
            is_daytime=None if code is None else not is_night_code(code),
            native_temperature=values.get(HOURLY_TEMPERATURE),
            native_precipitation=values.get(HOURLY_PRECIPITATION),
            precipitation_probability=_int(values.get(HOURLY_PRECIPITATION_PROBABILITY)),
            native_wind_speed=values.get(HOURLY_WIND_SPEED),
            native_wind_gust_speed=values.get(HOURLY_WIND_GUST),
            wind_bearing=values.get(HOURLY_WIND_BEARING),
        )
        forecast[ATTR_METEOSWISS_SYMBOL] = code  # type: ignore[literal-required]
        return forecast

    async def async_forecast_daily(self) -> list[Forecast] | None:
        """Return the daily forecast (up to 9 days)."""
        data = self.coordinator.data
        if data is None:
            return None
        today = dt_util.utcnow().astimezone(SWISS_TZ).date()
        return [
            self._daily_forecast(step)
            for step in data.daily
            if step.time.date() >= today
        ]

    async def async_forecast_hourly(self) -> list[Forecast] | None:
        """Return the hourly forecast."""
        data = self.coordinator.data
        if data is None or not self.coordinator.hourly_enabled:
            return None
        return [self._hourly_forecast(step) for step in data.hourly]
