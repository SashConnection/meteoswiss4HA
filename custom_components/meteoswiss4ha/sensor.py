"""Sensors for MeteoSwiss Complete For HA."""

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

from .const import (
    CONF_ICON_PACK,
    CONF_STATION,
    CONF_STATION_NAME,
    DEFAULT_ICON_PACK,
    ICON_PACKS,
    ICONS_URL,
)
from .coordinator import (
    CurrentCoordinator,
    ForecastCoordinator,
    HazardCoordinator,
    MeteoSwissConfigEntry,
    PollenCoordinator,
)
from .hazards import LEVELS as HAZARD_LEVELS, WARNING_KINDS
from .pollen import LEVELS, SPECIES, PollenSpecies
from .entity import MeteoSwissEntity
from .events import LevelEventMixin
from .places import place_sensors
from .sensor_env import env_sensors
from .sensor_extra import extra_sensors
from .symbol_descriptions import SYMBOL_DESCRIPTIONS
from .symbols import symbol_to_condition

HAZARD_ICONS = {
    "avalanche": "mdi:snowflake-alert",
    "forest_fire": "mdi:pine-tree-fire",
    "drought": "mdi:weather-sunny-alert",
    "flood": "mdi:home-flood",
}

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
    if (pollen := entry.runtime_data.pollen) is not None:
        entities.extend(PollenSensor(pollen, entry, species) for species in SPECIES)
        entities.append(PollenLevelSensor(pollen, entry))
    if (hazards := entry.runtime_data.hazards) is not None:
        entities.extend(
            HazardSensor(hazards, entry, kind)
            for kind in ("avalanche", "flood", "forest_fire", "drought")
        )
        entities.extend(
            WeatherWarningSensor(hazards, entry, kind) for kind in WARNING_KINDS
        )
    if (places := entry.runtime_data.places) is not None:
        entities.extend(place_sensors(places[0], entry, places[1]))
    entities.extend(env_sensors(entry))
    entities.extend(extra_sensors(hass, entry))
    async_add_entities(entities)


class _EventsOnUpdate(LevelEventMixin):
    """Fire level events on every coordinator update (see events.py)."""

    async def async_added_to_hass(self) -> None:
        """Remember the current level (no event at start-up)."""
        await super().async_added_to_hass()  # type: ignore[misc]
        self._check_events()

    def _handle_coordinator_update(self) -> None:
        self._check_events()
        super()._handle_coordinator_update()  # type: ignore[misc]


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
        pack = entry.options.get(CONF_ICON_PACK, DEFAULT_ICON_PACK)
        self._icon_pack = pack if pack in ICON_PACKS else DEFAULT_ICON_PACK

    @property
    def _code(self) -> int | None:
        return self.coordinator.current_symbol()[0]

    @property
    def entity_picture(self) -> str | None:
        """Return the pictogram of the current symbol in the chosen pack."""
        code = self._code
        if code is None or code not in SYMBOL_DESCRIPTIONS:
            return None
        return f"{ICONS_URL}/{self._icon_pack}/{code}.svg"


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
        lang = language.split("-")[0].lower()
        # MeteoSwiss publishes no Romansh descriptions: use German.
        lang = "de" if lang == "rm" else lang
        self._index = LANGUAGE_INDEX.get(lang, LANGUAGE_INDEX["en"])

    @property
    def native_value(self) -> str | None:
        """Return the description."""
        code = self._code
        texts = SYMBOL_DESCRIPTIONS.get(code) if code is not None else None
        return texts[self._index] if texts else None


class PollenSensor(MeteoSwissEntity[PollenCoordinator], SensorEntity):
    """Latest hourly concentration of one pollen type."""

    _attr_native_unit_of_measurement = "grains/m³"
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(
        self,
        coordinator: PollenCoordinator,
        entry: MeteoSwissConfigEntry,
        species: PollenSpecies,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry)
        self._species = species
        self._attr_translation_key = f"pollen_{species.key}"
        self._attr_unique_id = f"{entry.entry_id}_pollen_{species.key}"
        self._attr_icon = species.icon

    @property
    def available(self) -> bool:
        """Available when data was received."""
        return super().available and self.coordinator.data is not None

    @property
    def native_value(self) -> float | None:
        """Return the latest hourly concentration."""
        if self.coordinator.data is None:
            return None
        return self.coordinator.data.latest.get(self._species.key)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the 24-hour mean, its level and the station."""
        data = self.coordinator.data
        if data is None:
            return {}
        level = data.level(self._species)
        return {
            "mean_24h": data.mean_24h.get(self._species.key),
            "level": LEVELS[level] if level is not None else None,
            "level_index": level,
            "station": self.coordinator.station.abbr,
            "station_name": self.coordinator.station.name,
            "measured_at": data.measured_at.isoformat() if data.measured_at else None,
        }


class PollenLevelSensor(_EventsOnUpdate, MeteoSwissEntity[PollenCoordinator], SensorEntity):
    """Highest pollen level among all species (none .. very strong)."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(LEVELS)
    _attr_translation_key = "pollen_level"
    _attr_icon = "mdi:flower-pollen"
    _event_type = "pollen"
    _event_subtype = "pollen"

    def _event_level(self) -> int | None:
        data = self.coordinator.data
        return data.overall()[0] if data is not None else None

    def __init__(self, coordinator: PollenCoordinator, entry: MeteoSwissConfigEntry) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_pollen_level"

    @property
    def available(self) -> bool:
        """Available when data was received."""
        return super().available and self.coordinator.data is not None

    @property
    def native_value(self) -> str | None:
        """Return the highest level."""
        if self.coordinator.data is None:
            return None
        level, _ = self.coordinator.data.overall()
        return LEVELS[level] if level is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the dominant species and every species level."""
        data = self.coordinator.data
        if data is None:
            return {}
        level, dominant = data.overall()
        attrs: dict[str, Any] = {
            "level_index": level,
            "dominant": dominant,
            "station": self.coordinator.station.abbr,
            "station_name": self.coordinator.station.name,
        }
        for species in SPECIES:
            index = data.level(species)
            attrs[species.key] = LEVELS[index] if index is not None else None
        return attrs


class HazardSensor(_EventsOnUpdate, MeteoSwissEntity[HazardCoordinator], SensorEntity):
    """A natural hazard level (5-level scale) for the home location."""

    _attr_device_class = SensorDeviceClass.ENUM

    def __init__(
        self, coordinator: HazardCoordinator, entry: MeteoSwissConfigEntry, kind: str
    ) -> None:
        """Initialize the sensor; kind is avalanche, forest_fire or drought."""
        super().__init__(coordinator, entry)
        self._kind = kind
        self._event_type = "hazard"
        self._event_subtype = kind
        self._attr_translation_key = f"{kind}_danger"
        self._attr_unique_id = f"{entry.entry_id}_{kind}_danger"
        self._attr_icon = HAZARD_ICONS[kind]
        self._attr_options = list(HAZARD_LEVELS) + (
            ["no_rating"] if kind == "avalanche" else []
        )

    def _event_level(self) -> int | None:
        item = self._item()
        return item.level if item is not None else None

    def _item(self) -> Any:
        data = self.coordinator.data
        return getattr(data, self._kind, None) if data is not None else None

    @property
    def available(self) -> bool:
        """Available when this source returned data."""
        return super().available and self._item() is not None

    @property
    def native_value(self) -> str | None:
        """Return the level name."""
        item = self._item()
        return item.state if item is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return level number, region and validity."""
        item = self._item()
        if item is None:
            return {}
        if self._kind == "avalanche":
            return {
                "level": item.level,
                "subdivision": item.subdivision,
                "elevation": item.elevation,
                "problems": item.problems,
                "region_id": item.region_id,
                "region": item.region_name,
                "valid_from": item.valid_from,
                "valid_until": item.valid_until,
                "next_update": item.next_update,
                "published": item.published,
                "source": "SLF",
            }
        return {
            "level": item.level,
            "region": item.region,
            "description": item.title,
            "valid_from": item.valid_from,
            "source": "FOEN",
        }


WARNING_ICONS = {
    "rain": "mdi:weather-pouring",
    "thunderstorm": "mdi:weather-lightning",
    "wind": "mdi:weather-windy",
    "snow": "mdi:weather-snowy-heavy",
    "slippery_roads": "mdi:snowflake-melt",
    "heat": "mdi:thermometer-high",
    "frost": "mdi:snowflake-thermometer",
}


class WeatherWarningSensor(_EventsOnUpdate, MeteoSwissEntity[HazardCoordinator], SensorEntity):
    """MeteoSwiss weather warning level of one kind at the home location.

    "low" (level 1) means no warning in force; upcoming warnings are listed in
    the "upcoming" attribute. Source: MeteoSwiss via MeteoAlarm.
    """

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(HAZARD_LEVELS)

    def __init__(
        self, coordinator: HazardCoordinator, entry: MeteoSwissConfigEntry, kind: str
    ) -> None:
        """Initialize the sensor for one warning kind (rain, wind, ...)."""
        super().__init__(coordinator, entry)
        self._kind = kind
        self._event_type = "warning"
        self._event_subtype = kind
        self._attr_translation_key = f"{kind}_warning"
        self._attr_unique_id = f"{entry.entry_id}_{kind}_warning"
        self._attr_icon = WARNING_ICONS[kind]

    def _event_level(self) -> int | None:
        item = self._item()
        return item.level if item is not None else None

    def _event_upcoming(self) -> int:
        item = self._item()
        return len(item.upcoming) if item is not None else 0

    def _item(self) -> Any:
        data = self.coordinator.data
        return (data.weather or {}).get(self._kind) if data is not None else None

    @property
    def available(self) -> bool:
        """Available once the warnings were fetched."""
        return super().available and self._item() is not None

    @property
    def native_value(self) -> str | None:
        """Return the level name of the warning in force."""
        item = self._item()
        return item.state if item is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the warning text, validity and upcoming warnings."""
        item = self._item()
        if item is None:
            return {}
        return {
            "level": item.level,
            "event": item.event,
            "region": item.region,
            "description": item.description,
            "instruction": item.instruction,
            "onset": item.onset,
            "expires": item.expires,
            "upcoming": item.upcoming,
            "source": "MeteoSwiss (MeteoAlarm)",
        }
