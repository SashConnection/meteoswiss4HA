"""Forecast values as plain numbers, for thresholds in automations.

Maximum and minimum temperature, precipitation and rain probability of today
and tomorrow, and the strongest gust still expected today.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import PERCENTAGE, UnitOfPrecipitationDepth, UnitOfSpeed, UnitOfTemperature
from homeassistant.util import dt as dt_util

from .const import (
    DAILY_PRECIPITATION,
    DAILY_TEMP_MAX,
    DAILY_TEMP_MIN,
    HOURLY_PRECIPITATION_PROBABILITY,
    HOURLY_WIND_GUST,
    SWISS_TZ,
)
from .coordinator import ForecastCoordinator, MeteoSwissConfigEntry
from .entity import MeteoSwissEntity

# key: (kind, day offset, device class, unit, icon)
FORECAST_VALUES: dict[str, tuple[str, int, SensorDeviceClass | None, str, str]] = {
    "temperature_max_today": (DAILY_TEMP_MAX, 0, SensorDeviceClass.TEMPERATURE, UnitOfTemperature.CELSIUS, "mdi:thermometer-high"),
    "temperature_min_today": (DAILY_TEMP_MIN, 0, SensorDeviceClass.TEMPERATURE, UnitOfTemperature.CELSIUS, "mdi:thermometer-low"),
    "temperature_max_tomorrow": (DAILY_TEMP_MAX, 1, SensorDeviceClass.TEMPERATURE, UnitOfTemperature.CELSIUS, "mdi:thermometer-high"),
    "temperature_min_tomorrow": (DAILY_TEMP_MIN, 1, SensorDeviceClass.TEMPERATURE, UnitOfTemperature.CELSIUS, "mdi:thermometer-low"),
    "precipitation_today": (DAILY_PRECIPITATION, 0, SensorDeviceClass.PRECIPITATION, UnitOfPrecipitationDepth.MILLIMETERS, "mdi:weather-rainy"),
    "precipitation_tomorrow": (DAILY_PRECIPITATION, 1, SensorDeviceClass.PRECIPITATION, UnitOfPrecipitationDepth.MILLIMETERS, "mdi:weather-rainy"),
    "rain_probability_today": ("probability", 0, None, PERCENTAGE, "mdi:umbrella-outline"),
    "rain_probability_tomorrow": ("probability", 1, None, PERCENTAGE, "mdi:umbrella-outline"),
    "gust_max_today": ("gust", 0, SensorDeviceClass.WIND_SPEED, UnitOfSpeed.KILOMETERS_PER_HOUR, "mdi:weather-windy"),
}


def forecast_value_sensors(entry: MeteoSwissConfigEntry) -> list[SensorEntity]:
    """One sensor per forecast value."""
    return [ForecastValueSensor(entry.runtime_data.forecast, entry, key) for key in FORECAST_VALUES]


class ForecastValueSensor(MeteoSwissEntity[ForecastCoordinator], SensorEntity):
    """One number of the home forecast (today or tomorrow)."""

    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator: ForecastCoordinator, entry: MeteoSwissConfigEntry, key: str) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry)
        self._kind, self._offset, device_class, unit, icon = FORECAST_VALUES[key]
        self._attr_translation_key = key
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_device_class = device_class
        self._attr_native_unit_of_measurement = unit
        self._attr_icon = icon
        if self._kind in (DAILY_PRECIPITATION, "probability", "gust"):
            self._attr_suggested_display_precision = 0

    def _day(self) -> date:
        return dt_util.utcnow().astimezone(SWISS_TZ).date() + timedelta(days=self._offset)

    def _hourly(self, param: str) -> list[tuple[Any, float]]:
        """(time, value) of the hours of the day; for today only the hours still to come."""
        data = self.coordinator.data
        if data is None:
            return []
        day, now = self._day(), dt_util.utcnow()
        out = []
        for step in data.hourly:
            value = step.values.get(param)
            start = step.time - timedelta(hours=1)  # steps are stamped at the end of the hour
            if value is None or start.astimezone(SWISS_TZ).date() != day:
                continue
            if self._kind == "gust" and step.time <= now:
                continue
            out.append((start, value))
        return out

    @property
    def native_value(self) -> float | None:
        """Return the value of the day."""
        if self._kind == "probability":
            values = [v for _, v in self._hourly(HOURLY_PRECIPITATION_PROBABILITY)]
            return round(max(values)) if values else None
        if self._kind == "gust":
            values = [v for _, v in self._hourly(HOURLY_WIND_GUST)]
            return round(max(values)) if values else None
        data = self.coordinator.data
        if data is None:
            return None
        step = next((s for s in data.daily if s.time.date() == self._day()), None)
        value = step.values.get(self._kind) if step else None
        return round(value, 1) if value is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Day of the value and, for the gust, its time."""
        attrs: dict[str, Any] = {"date": self._day().isoformat()}
        if self._kind == "gust":
            hours = self._hourly(HOURLY_WIND_GUST)
            if hours:
                attrs["time"] = max(hours, key=lambda h: h[1])[0].isoformat()
        return attrs
