"""Weather entity for MeteoSwiss Complete For HA."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

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
from homeassistant.util import dt as dt_util

from .api import ForecastStep
from .const import (
    ATTR_METEOSWISS_SYMBOL,
    CONF_ICON_PACK,
    CONF_POINT_NAME,
    CONF_STATION,
    CONF_STATION_NAME,
    DEFAULT_ICON_PACK,
    ICON_PACKS,
    ICONS_URL,
    DAILY_PRECIPITATION,
    DAILY_PRECIPITATION_P10,
    DAILY_PRECIPITATION_P90,
    DAILY_SYMBOL,
    DAILY_TEMP_MAX,
    DAILY_TEMP_MIN,
    HOURLY_PRECIPITATION,
    HOURLY_CLOUDS_HIGH,
    HOURLY_CLOUDS_LOW,
    HOURLY_CLOUDS_MID,
    HOURLY_FREEZING_LEVEL,
    HOURLY_PRECIPITATION_PROBABILITY,
    HOURLY_RADIATION,
    HOURLY_SUNSHINE,
    HOURLY_TEMP_P10,
    HOURLY_TEMP_P90,
    HOURLY_SYMBOL,
    HOURLY_TEMPERATURE,
    HOURLY_WIND_BEARING,
    HOURLY_WIND_GUST,
    HOURLY_WIND_SPEED,
    SWISS_TZ,
)
from .coordinator import CurrentCoordinator, ForecastCoordinator, MeteoSwissConfigEntry
from .entity import MeteoSwissEntity
from .symbols import is_night_code, symbol_to_condition


async def async_setup_entry(
    hass: HomeAssistant,
    entry: MeteoSwissConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the MeteoSwiss weather entity."""
    data = entry.runtime_data
    async_add_entities([MeteoSwissWeather(data.forecast, data.current, entry)])


# Station measurements exposed in the "measurements" attribute.
MEASUREMENTS = {
    "temperature": "tre200s0",
    "humidity": "ure200s0",
    "dew_point": "tde200s0",
    "precipitation": "rre150z0",
    "sunshine": "sre000z0",
    "global_radiation": "gre000z0",
    "wind_speed": "fu3010z0",
    "wind_gust": "fu3010z1",
    "wind_bearing": "dkl010z0",
    "pressure_qff": "pp0qffs0",
    "pressure_qnh": "pp0qnhs0",
    "pressure_qfe": "prestas0",
}


def _int(value: float | None) -> int | None:
    return None if value is None else int(value)


def _percent(value: float | None) -> int | None:
    """Cloud cover: the files give a fraction (0-1); percent for the forecast."""
    if value is None:
        return None
    return round(value * 100) if value <= 1 else round(value)


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
        self._entry_options = entry.options
        self._entry_data = entry.data
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

    @property
    def condition(self) -> str | None:
        """Return the current Home Assistant condition."""
        code, night = self.coordinator.current_symbol()
        return symbol_to_condition(code, night)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Expose the native MeteoSwiss symbol and data sources."""
        code, _ = self.coordinator.current_symbol()
        pack = self._entry_options.get(CONF_ICON_PACK, DEFAULT_ICON_PACK)
        attrs: dict[str, Any] = {
            ATTR_METEOSWISS_SYMBOL: code,
            # Base URL of the chosen pictogram pack: <icons_url>/<symbol>.svg
            "icons_url": f"{ICONS_URL}/{pack if pack in ICON_PACKS else DEFAULT_ICON_PACK}",
            "location": self._entry_data.get(CONF_POINT_NAME),
            "altitude": self.coordinator.altitude,
            "station": self._entry_data.get(CONF_STATION),
            "station_name": self._entry_data.get(CONF_STATION_NAME),
        }
        current = self._current.data
        if current is not None:
            # Every station measurement, for cards that show them all.
            attrs["measured_at"] = current.measured_at.isoformat()
            attrs["measurements"] = {
                name: current.values.get(key)
                for name, key in MEASUREMENTS.items()
                if current.values.get(key) is not None
            }
        step = self._current_hour()
        if step is not None:
            attrs["precipitation_probability"] = step.values.get(
                HOURLY_PRECIPITATION_PROBABILITY
            )
            attrs["freezing_level"] = step.values.get(HOURLY_FREEZING_LEVEL)
        if self.coordinator.data:
            attrs["forecast_reference_time"] = (
                self.coordinator.data.reference_time.isoformat()
            )
        return attrs

    def _current_hour(self) -> ForecastStep | None:
        """Hourly forecast step of the hour in progress."""
        data = self.coordinator.data
        if data is None:
            return None
        now = dt_util.utcnow()
        # Hourly steps are stamped at the end of their hour.
        return next((s for s in data.hourly if s.time > now), None)

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
        # Uncertainty range of the precipitation (10 % / 90 % quantiles, mm).
        forecast["precipitation_p10"] = values.get(DAILY_PRECIPITATION_P10)  # type: ignore[typeddict-unknown-key]
        forecast["precipitation_p90"] = values.get(DAILY_PRECIPITATION_P90)  # type: ignore[typeddict-unknown-key]
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
        # Uncertainty band of the temperature (10 % / 90 % quantiles, °C) and
        # freezing level (m).
        forecast["temperature_p10"] = values.get(HOURLY_TEMP_P10)  # type: ignore[typeddict-unknown-key]
        forecast["temperature_p90"] = values.get(HOURLY_TEMP_P90)  # type: ignore[typeddict-unknown-key]
        forecast["freezing_level"] = values.get(HOURLY_FREEZING_LEVEL)  # type: ignore[typeddict-unknown-key]
        # Sunshine (min), global radiation (W/m²) and cloud layers (%).
        forecast["sunshine"] = values.get(HOURLY_SUNSHINE)  # type: ignore[typeddict-unknown-key]
        forecast["global_radiation"] = values.get(HOURLY_RADIATION)  # type: ignore[typeddict-unknown-key]
        layers = [_percent(values.get(p)) for p in (HOURLY_CLOUDS_LOW, HOURLY_CLOUDS_MID, HOURLY_CLOUDS_HIGH)]
        forecast["cloud_low"], forecast["cloud_mid"], forecast["cloud_high"] = layers  # type: ignore[typeddict-unknown-key]
        if any(v is not None for v in layers):
            forecast["cloud_coverage"] = max(v or 0 for v in layers)
        return forecast

    async def async_forecast_daily(self) -> list[Forecast] | None:
        """Return the daily forecast (up to 9 days)."""
        data = self.coordinator.data
        if data is None:
            return None
        today = dt_util.utcnow().astimezone(SWISS_TZ).date()
        # Daily precipitation probability: highest hourly probability of the day.
        probability: dict[Any, float] = {}
        for step in data.hourly:
            value = step.values.get(HOURLY_PRECIPITATION_PROBABILITY)
            if value is None:
                continue
            day = (step.time - timedelta(hours=1)).astimezone(SWISS_TZ).date()
            probability[day] = max(probability.get(day, 0), value)
        forecasts = []
        for step in data.daily:
            if step.time.date() < today:
                continue
            forecast = self._daily_forecast(step)
            if step.time.date() in probability:
                forecast["precipitation_probability"] = _int(probability[step.time.date()])
            forecasts.append(forecast)
        return forecasts

    async def async_forecast_hourly(self) -> list[Forecast] | None:
        """Return the hourly forecast."""
        data = self.coordinator.data
        if data is None or not self.coordinator.hourly_enabled:
            return None
        return [self._hourly_forecast(step) for step in data.hourly]
