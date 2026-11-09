"""Sensors for MeteoSwiss for HA."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.const import (
    DEGREE,
    PERCENTAGE,
    UnitOfIrradiance,
    UnitOfPrecipitationDepth,
    UnitOfPressure,
    UnitOfSpeed,
    UnitOfTemperature,
    UnitOfTime,
    EntityCategory,
)
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import CONF_STATION, CONF_STATION_NAME, ICONS_URL
from .coordinator import CurrentCoordinator, ForecastCoordinator, MeteoSwissConfigEntry
from .entity import MeteoSwissEntity
from .symbol_descriptions import SYMBOL_DESCRIPTIONS
from .symbols import symbol_to_condition

# Index of each language in SYMBOL_DESCRIPTIONS tuples.
LANGUAGE_INDEX: dict[str, int] = {"de": 0, "fr": 1, "it": 2, "en": 3}

# SwissMetNet parameter identifiers published in VQHA80.csv.
CURRENT_SENSORS: tuple[SensorEntityDescription, ...] = (
    SensorEntityDescription(
        key="tre200s0",
        translation_key="temperature",
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
    ),
    SensorEntityDescription(
        key="ure200s0",
        translation_key="humidity",
        device_class=SensorDeviceClass.HUMIDITY,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=PERCENTAGE,
    ),
    SensorEntityDescription(
        key="tde200s0",
        translation_key="dew_point",
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
    ),
    SensorEntityDescription(
        key="rre150z0",
        translation_key="precipitation",
        device_class=SensorDeviceClass.PRECIPITATION,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfPrecipitationDepth.MILLIMETERS,
    ),
    SensorEntityDescription(
        key="sre000z0",
        translation_key="sunshine",
        device_class=SensorDeviceClass.DURATION,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfTime.MINUTES,
    ),
    SensorEntityDescription(
        key="gre000z0",
        translation_key="global_radiation",
        device_class=SensorDeviceClass.IRRADIANCE,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfIrradiance.WATTS_PER_SQUARE_METER,
    ),
    SensorEntityDescription(
        key="fu3010z0",
        translation_key="wind_speed",
        device_class=SensorDeviceClass.WIND_SPEED,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfSpeed.KILOMETERS_PER_HOUR,
    ),
    SensorEntityDescription(
        key="fu3010z1",
        translation_key="wind_gust",
        device_class=SensorDeviceClass.WIND_SPEED,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfSpeed.KILOMETERS_PER_HOUR,
    ),
    SensorEntityDescription(
        key="dkl010z0",
        translation_key="wind_bearing",
        device_class=SensorDeviceClass.WIND_DIRECTION,
        state_class=SensorStateClass.MEASUREMENT_ANGLE,
        native_unit_of_measurement=DEGREE,
    ),
    SensorEntityDescription(
        key="pp0qffs0",
        translation_key="pressure_qff",
        device_class=SensorDeviceClass.ATMOSPHERIC_PRESSURE,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfPressure.HPA,
    ),
    SensorEntityDescription(
        key="pp0qnhs0",
        translation_key="pressure_qnh",
        device_class=SensorDeviceClass.ATMOSPHERIC_PRESSURE,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfPressure.HPA,
        entity_registry_enabled_default=False,
    ),
    SensorEntityDescription(
        key="prestas0",
        translation_key="pressure_qfe",
        device_class=SensorDeviceClass.ATMOSPHERIC_PRESSURE,
        state_class=SensorStateClass.MEASUREMENT,
        native_unit_of_measurement=UnitOfPressure.HPA,
        entity_registry_enabled_default=False,
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: MeteoSwissConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up MeteoSwiss sensors."""
    current = entry.runtime_data.current
    values = current.data.values

    entities: list[SensorEntity] = [
        CurrentSensor(current, entry, description)
        for description in CURRENT_SENSORS
        # Not every station measures every parameter; skip those it never reports.
        if values.get(description.key) is not None
    ]
    entities.append(MeasurementTimeSensor(current, entry))
    forecast = entry.runtime_data.forecast
    entities.append(SymbolSensor(forecast, entry))
    entities.append(DescriptionSensor(forecast, entry, hass.config.language))
    async_add_entities(entities)


class CurrentSensor(MeteoSwissEntity[CurrentCoordinator], SensorEntity):
    """A current measurement of the configured SwissMetNet station."""

    def __init__(
        self,
        coordinator: CurrentCoordinator,
        entry: MeteoSwissConfigEntry,
        description: SensorEntityDescription,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry)
        self.entity_description = description
        self._attr_unique_id = f"{entry.entry_id}_current_{description.key}"
        self._station = entry.data[CONF_STATION]
        self._station_name = entry.data.get(CONF_STATION_NAME, self._station)

    @property
    def native_value(self) -> float | None:
        """Return the measured value."""
        return self.coordinator.data.values.get(self.entity_description.key)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the station and measurement time."""
        return {
            "station": self._station,
            "station_name": self._station_name,
            "measured_at": self.coordinator.data.measured_at.isoformat(),
        }


class MeasurementTimeSensor(MeteoSwissEntity[CurrentCoordinator], SensorEntity):
    """Time of the latest station measurement."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_entity_category = EntityCategory.DIAGNOSTIC
    _attr_translation_key = "measured_at"

    def __init__(self, coordinator: CurrentCoordinator, entry: MeteoSwissConfigEntry) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_current_measured_at"

    @property
    def native_value(self) -> datetime:
        """Return the measurement time."""
        return self.coordinator.data.measured_at


class _SymbolBase(MeteoSwissEntity[ForecastCoordinator], SensorEntity):
    """Common logic of the sensors based on the current MeteoSwiss symbol."""

    def __init__(
        self, coordinator: ForecastCoordinator, entry: MeteoSwissConfigEntry, key: str
    ) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_{key}"

    @property
    def _code(self) -> int | None:
        return self.coordinator.current_symbol()[0]

    @property
    def entity_picture(self) -> str | None:
        """Return the pictogram of the current symbol."""
        code = self._code
        if code is None or code not in SYMBOL_DESCRIPTIONS:
            return None
        return f"{ICONS_URL}/{code}.svg"


class SymbolSensor(_SymbolBase):
    """Native MeteoSwiss weather symbol code (1-42 day, 101-142 night)."""

    _attr_translation_key = "symbol"

    def __init__(self, coordinator: ForecastCoordinator, entry: MeteoSwissConfigEntry) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry, "symbol")

    @property
    def native_value(self) -> int | None:
        """Return the symbol code."""
        return self._code

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return descriptions in all languages and the HA condition."""
        code, night = self.coordinator.current_symbol()
        texts = SYMBOL_DESCRIPTIONS.get(code) if code is not None else None
        attrs: dict[str, Any] = {
            "condition": symbol_to_condition(code, night),
            "is_night": night if code is not None else None,
        }
        for lang, index in LANGUAGE_INDEX.items():
            attrs[f"description_{lang}"] = texts[index] if texts else None
        return attrs


class DescriptionSensor(_SymbolBase):
    """Official MeteoSwiss description of the current weather."""

    _attr_translation_key = "description"

    def __init__(
        self,
        coordinator: ForecastCoordinator,
        entry: MeteoSwissConfigEntry,
        language: str,
    ) -> None:
        """Initialize the sensor in the Home Assistant language."""
        super().__init__(coordinator, entry, "description")
        self._index = LANGUAGE_INDEX.get(language.split("-")[0].lower(), LANGUAGE_INDEX["en"])

    @property
    def native_value(self) -> str | None:
        """Return the description."""
        code = self._code
        texts = SYMBOL_DESCRIPTIONS.get(code) if code is not None else None
        return texts[self._index] if texts else None
