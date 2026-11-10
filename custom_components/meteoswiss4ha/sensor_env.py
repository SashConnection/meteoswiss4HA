"""Fog and lake sensors (environment)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)
from homeassistant.const import UnitOfLength, UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .coordinator import MeteoSwissConfigEntry
from .entity import MeteoSwissEntity
from .events import EVENT, FOG_ENDED, FOG_STARTED
from .fog import REGION_STATES, FogCoordinator
from .lakes import Lake, LakeCoordinator, value_at

COVERED_STATES = ("fog", "stratus")


def _lang(hass: HomeAssistant) -> str:
    lang = (hass.config.language or "en").split("-")[0].lower()
    return lang if lang in ("de", "fr", "it", "rm", "en") else "en"


def env_sensors(entry: MeteoSwissConfigEntry) -> list[SensorEntity]:
    """Fog sensors (home region) and one temperature sensor per chosen lake."""
    entities: list[SensorEntity] = []
    if (fog := entry.runtime_data.fog) is not None:
        entities += [FogSensor(fog, entry), FogTopSensor(fog, entry)]
    if (lakes := entry.runtime_data.lakes) is not None:
        entities += [LakeTemperatureSensor(lakes, entry, lake) for lake in lakes.lakes]
    return entities


class _FogBase(MeteoSwissEntity[FogCoordinator], SensorEntity):
    """Shared access to the home region of the fog data."""

    def _region(self) -> dict[str, Any] | None:
        data = self.coordinator.data
        if not data:
            return None
        return next((r for r in data["regions"] if r["key"] == data.get("home_region")), None)

    @property
    def available(self) -> bool:
        """Available when the home region is known."""
        return super().available and self._region() is not None


class FogSensor(_FogBase):
    """Fog / low stratus in the home region, from its reference stations.

    Fires "fog_started" and "fog_ended" events (device triggers).
    """

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(REGION_STATES)
    _attr_translation_key = "fog"
    _attr_icon = "mdi:weather-fog"

    def __init__(self, coordinator: FogCoordinator, entry: MeteoSwissConfigEntry) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_fog"
        self._covered: bool | None = None

    @property
    def native_value(self) -> str | None:
        """Return the fog state now."""
        region = self._region()
        return region["now"]["state"] if region else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Region, estimated top, stations and the forecast by day."""
        region = self._region()
        if region is None:
            return {}
        now = region["now"]
        return {
            "region": region["names"].get(_lang(self.hass)),
            "region_key": region["key"],
            "top_min": now["top_min"],
            "top_max": now["top_max"],
            "stations": [
                {"name": s["name"], "altitude": s["altitude"], "state": s["state"]}
                for s in region["stations"]
            ],
            "forecast": region["days"],
            "forecast_time": self.coordinator.data.get("forecast_time"),
            "estimated": True,
            "source": "MeteoSwiss (stations and local forecast)",
        }

    def _is_covered(self) -> bool | None:
        state = self.native_value
        return state in COVERED_STATES if state is not None else None

    async def async_added_to_hass(self) -> None:
        """Remember the state at start-up (no event)."""
        await super().async_added_to_hass()
        self._covered = self._is_covered()

    def _handle_coordinator_update(self) -> None:
        covered = self._is_covered()
        entry = self.registry_entry
        if (
            covered is not None
            and self._covered is not None
            and covered != self._covered
            and entry is not None
            and entry.device_id is not None
        ):
            self.hass.bus.async_fire(
                EVENT,
                {
                    "device_id": entry.device_id,
                    "entity_id": self.entity_id,
                    "type": FOG_STARTED if covered else FOG_ENDED,
                    "subtype": "fog",
                },
            )
        if covered is not None:
            self._covered = covered
        super()._handle_coordinator_update()


class FogTopSensor(_FogBase):
    """Estimated altitude of the top of the fog (middle of the station range)."""

    _attr_device_class = SensorDeviceClass.DISTANCE
    _attr_native_unit_of_measurement = UnitOfLength.METERS
    _attr_translation_key = "fog_top"
    _attr_icon = "mdi:arrow-collapse-up"

    def __init__(self, coordinator: FogCoordinator, entry: MeteoSwissConfigEntry) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_fog_top"

    @property
    def native_value(self) -> float | None:
        """Top of the fog, rounded to 50 m (None without fog)."""
        region = self._region()
        if region is None:
            return None
        now = region["now"]
        if now["state"] not in COVERED_STATES or now["top_min"] is None or now["top_max"] is None:
            return None
        return round((now["top_min"] + now["top_max"]) / 2 / 50) * 50

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """The station range the top lies in."""
        region = self._region()
        if region is None:
            return {}
        return {
            "top_min": region["now"]["top_min"],
            "top_max": region["now"]["top_max"],
            "region": region["names"].get(_lang(self.hass)),
            "estimated": True,
        }


class LakeTemperatureSensor(MeteoSwissEntity[LakeCoordinator], SensorEntity):
    """Water temperature of a lake (1 m deep), with its forecast (Eawag Alplakes)."""

    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_translation_key = "lake_temperature"
    _attr_icon = "mdi:waves"
    _attr_attribution = "Eawag Alplakes (CC BY 4.0)"

    def __init__(
        self, coordinator: LakeCoordinator, entry: MeteoSwissConfigEntry, lake: Lake
    ) -> None:
        """Initialize the sensor for one lake."""
        super().__init__(coordinator, entry)
        self._lake = lake
        self._attr_unique_id = f"{entry.entry_id}_lake_{lake.key}"
        self._attr_translation_placeholders = {
            "lake": lake.names.get(_lang(coordinator.hass), lake.names["en"])
        }

    def _series(self) -> dict[str, Any] | None:
        return (self.coordinator.data or {}).get(self._lake.key)

    @property
    def available(self) -> bool:
        """Available when the lake data was fetched."""
        return super().available and self._series() is not None

    @property
    def native_value(self) -> float | None:
        """Water temperature now (1 m deep)."""
        series = self._series()
        return value_at(series, "T", dt_util.utcnow()) if series else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Lake facts, oxygen, thermocline, ice and the forecast."""
        series = self._series()
        if series is None:
            return {}
        now = dt_util.utcnow()
        lake = self._lake
        times = series.get("time") or []
        none = [None] * len(times)
        forecast = [
            {"datetime": t, "temperature": v, "temperature_p10": lo, "temperature_p90": hi}
            for t, v, lo, hi in zip(
                times,
                series.get("T") or none,
                series.get("T_p10") or none,
                series.get("T_p90") or none,
                strict=False,
            )
            if datetime.fromisoformat(t) > now
        ]
        return {
            "lake": lake.names.get(_lang(self.hass), lake.names["en"]),
            "lake_key": lake.key,
            "depth": 1,
            "temperature_p10": value_at(series, "T_p10", now),
            "temperature_p90": value_at(series, "T_p90", now),
            "oxygen_saturation": value_at(series, "OxygenSat", now),
            "thermocline_depth": value_at(series, "Thermocline", now),
            "ice_thickness": value_at(series, "TotalIceH", now),
            "altitude": lake.altitude,
            "area": lake.area,
            "max_depth": lake.max_depth,
            "volume": lake.volume,
            "forecast": forecast,
            "source": "Eawag Alplakes (Simstrat)",
        }
