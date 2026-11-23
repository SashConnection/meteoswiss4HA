"""Feels-like temperature, pressure trend, snow depth, rivers and air quality (sensors)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import (
    CONCENTRATION_MICROGRAMS_PER_CUBIC_METER,
    UnitOfLength,
    UnitOfPressure,
    UnitOfTemperature,
    UnitOfVolumeFlowRate,
)

from . import air as air_mod
from .coordinator import MeteoSwissConfigEntry
from .entity import MeteoSwissEntity
from .indicators import swimming

FOEN = "FOEN (BAFU), provisional data"


def feels_like(t: float | None, wind_kmh: float | None, humidity: float | None) -> float | None:
    """Wind chill in the cold, heat index in the heat, else the air temperature."""
    if t is None:
        return None
    v = wind_kmh or 0
    if t <= 10 and v > 4.8:
        return round(13.12 + 0.6215 * t - 11.37 * v**0.16 + 0.3965 * t * v**0.16, 1)
    if t >= 27 and humidity is not None and humidity >= 40:
        f = t * 9 / 5 + 32
        hi = (-42.379 + 2.04901523 * f + 10.14333127 * humidity - 0.22475541 * f * humidity
              - 6.83783e-3 * f * f - 5.481717e-2 * humidity * humidity + 1.22874e-3 * f * f * humidity
              + 8.5282e-4 * f * humidity * humidity - 1.99e-6 * f * f * humidity * humidity)
        return round((hi - 32) * 5 / 9, 1)
    return round(t, 1)


def more_sensors(entry: MeteoSwissConfigEntry) -> list[SensorEntity]:
    """Sensors of this module that can be created for the entry."""
    data = entry.runtime_data
    out: list[SensorEntity] = [FeelsLikeSensor(data.current, entry)]
    if data.station_now is not None:
        out += [PressureTrendSensor(data.station_now, entry), SnowDepthSensor(data.station_now, entry)]
    if data.rivers is not None:
        for sid in data.rivers.chosen:
            station = (data.rivers.data or {}).get(sid)
            if station is None:
                continue
            if station.temperature is not None:
                out.append(RiverSensor(data.rivers, entry, sid, "temperature"))
            if station.discharge is not None:
                out.append(RiverSensor(data.rivers, entry, sid, "discharge"))
            elif station.level is not None:
                out.append(RiverSensor(data.rivers, entry, sid, "level"))
    if data.air is not None:
        out.append(AirQualitySensor(data.air, entry))
        out += [AirValueSensor(data.air, entry, key) for key in AirValueSensor.KINDS]
    return out


class _Base(MeteoSwissEntity, SensorEntity):
    def __init__(self, coordinator, entry: MeteoSwissConfigEntry, key: str) -> None:
        super().__init__(coordinator, entry)
        self._entry = entry
        self._attr_translation_key = key
        self._attr_unique_id = f"{entry.entry_id}_{key}"


class FeelsLikeSensor(_Base):
    """Feels-like temperature at the station (wind chill or heat index)."""

    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_icon = "mdi:thermometer-lines"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "feels_like")

    @property
    def native_value(self) -> float | None:
        v = self.coordinator.data.values if self.coordinator.data else {}
        return feels_like(v.get("tre200s0"), v.get("fu3010z0"), v.get("ure200s0"))


class PressureTrendSensor(_Base):
    """Change of the air pressure over 3 hours (hPa), with its trend."""

    _attr_native_unit_of_measurement = UnitOfPressure.HPA
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:gauge"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "pressure_trend")

    def _p(self) -> dict[str, Any]:
        return (self.coordinator.data or {}).get("pressure") or {}

    @property
    def available(self) -> bool:
        return super().available and self._p().get("state") is not None

    @property
    def native_value(self) -> float | None:
        return self._p().get("state")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {k: v for k, v in self._p().items() if k != "state"}


class SnowDepthSensor(_Base):
    """Snow depth at the nearest station that measures it, and the stations around."""

    _attr_device_class = SensorDeviceClass.DISTANCE
    _attr_native_unit_of_measurement = UnitOfLength.CENTIMETERS
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_icon = "mdi:snowflake"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "snow_depth")

    def _snow(self) -> list[dict[str, Any]]:
        return (self.coordinator.data or {}).get("snow") or []

    @property
    def available(self) -> bool:
        return super().available and bool(self._snow())

    @property
    def native_value(self) -> int | None:
        snow = self._snow()
        return snow[0]["depth"] if snow else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        snow = self._snow()
        first = snow[0] if snow else {}
        return {"station": first.get("name"), "altitude": first.get("altitude"), "change_today": first.get("change"),
                "stations": snow, "source": "MeteoSwiss (automatic snow depth)"}


class RiverSensor(MeteoSwissEntity, SensorEntity):
    """Water temperature, discharge or level of a FOEN station."""

    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator, entry: MeteoSwissConfigEntry, sid: str, kind: str) -> None:
        super().__init__(coordinator, entry)
        self._sid, self._kind = sid, kind
        station = coordinator.data[sid]
        self._attr_translation_key = f"river_{kind}"
        self._attr_translation_placeholders = {"station": station.label}
        self._attr_unique_id = f"{entry.entry_id}_river_{sid}_{kind}"
        if kind == "temperature":
            self._attr_device_class = SensorDeviceClass.TEMPERATURE
            self._attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
            self._attr_icon = "mdi:waves"
        elif kind == "discharge":
            self._attr_device_class = SensorDeviceClass.VOLUME_FLOW_RATE
            self._attr_native_unit_of_measurement = UnitOfVolumeFlowRate.CUBIC_METERS_PER_SECOND
            self._attr_icon = "mdi:waves-arrow-right"
        else:
            self._attr_native_unit_of_measurement = "m"
            self._attr_icon = "mdi:waves-arrow-up"

    def _station(self):
        return (self.coordinator.data or {}).get(self._sid)

    @property
    def available(self) -> bool:
        s = self._station()
        return super().available and s is not None and getattr(s, self._kind) is not None

    @property
    def native_value(self) -> float | None:
        s = self._station()
        return getattr(s, self._kind) if s else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        s = self._station()
        if s is None:
            return {}
        attrs = {k: v for k, v in s.as_dict().items() if k not in ("id",)}
        if self._kind == "temperature":
            cur = self._entry.runtime_data.current.data
            v = cur.values if cur else {}
            attrs["swimming"] = swimming(s.temperature, v.get("tre200s0"), None, v.get("fu3010z0"))
        attrs["source"] = FOEN
        return attrs


class AirQualitySensor(_Base):
    """Overall air quality at the nearest NABEL site: good, elevated, high, very high."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(air_mod.LEVELS)
    _attr_icon = "mdi:air-filter"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "air_quality")

    def _values(self) -> dict[str, float | None]:
        return (self.coordinator.data.sites.get(self.coordinator.site) if self.coordinator.data else None) or {}

    @property
    def available(self) -> bool:
        return super().available and air_mod.level(self._values()) is not None

    @property
    def native_value(self) -> str | None:
        return air_mod.level(self._values())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {**air_mod.site_info(self.coordinator.site), **self._values(),
                "time": self.coordinator.data.time if self.coordinator.data else None,
                "limits": air_mod.LIMITS, "source": "NABEL (FOEN / Empa), provisional data"}


class AirValueSensor(_Base):
    """One pollutant at the NABEL site (µg/m³)."""

    KINDS = {
        "o3": SensorDeviceClass.OZONE,
        "no2": SensorDeviceClass.NITROGEN_DIOXIDE,
        "pm10": SensorDeviceClass.PM10,
        "pm25": SensorDeviceClass.PM25,
    }
    _attr_native_unit_of_measurement = CONCENTRATION_MICROGRAMS_PER_CUBIC_METER
    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, c, e, kind: str) -> None:
        super().__init__(c, e, f"air_{kind}")
        self._kind = kind
        self._attr_device_class = self.KINDS[kind]

    def _values(self) -> dict[str, float | None]:
        return (self.coordinator.data.sites.get(self.coordinator.site) if self.coordinator.data else None) or {}

    @property
    def available(self) -> bool:
        return super().available and self._values().get(self._kind) is not None

    @property
    def native_value(self) -> float | None:
        return self._values().get(self._kind)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        attrs: dict[str, Any] = {"site": air_mod.SITES[self.coordinator.site][0]}
        if self._kind == "o3":
            attrs["max_today"] = self._values().get("o3_max")
        attrs["averaging"] = "1 h" if self._kind == "o3" else "24 h"
        return attrs

