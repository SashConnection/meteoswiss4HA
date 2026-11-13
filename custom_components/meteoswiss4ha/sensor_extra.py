"""Sun and moon, ephemeris, station history and everyday indicators (sensors).

Events for the device triggers are fired when a sensor enters some states:
rain approaching, first frost / snow of the season, rainbow possible,
beautiful sunset, foehn and bise.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.const import UnitOfEnergy, UnitOfTemperature, UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util import dt as dt_util

from . import astro, indicators as ind
from .const import (
    CONF_INDOOR_HUMIDITY,
    CONF_INDOOR_TEMPERATURE,
    CONF_RAIN_ALERT_MINUTES,
    CONF_SOLAR_AZIMUTH,
    CONF_SOLAR_KWP,
    CONF_SOLAR_TILT,
    DAILY_PRECIPITATION,
    DAILY_TEMP_MAX,
    DEFAULT_RAIN_ALERT_MINUTES,
    HOURLY_CLOUDS_HIGH,
    HOURLY_CLOUDS_LOW,
    HOURLY_CLOUDS_MID,
    HOURLY_PRECIPITATION,
    HOURLY_PRECIPITATION_PROBABILITY,
    HOURLY_RADIATION,
    HOURLY_SUNSHINE,
    HOURLY_SYMBOL,
    HOURLY_TEMPERATURE,
    HOURLY_WIND_GUST,
    HOURLY_WIND_SPEED,
    SWISS_TZ,
)
from .coordinator import MeteoSwissConfigEntry
from .entity import MeteoSwissEntity
from .events import EVENT
from .history import summarize

# Event / trigger types fired by these sensors.
RAIN_APPROACHING = "rain_approaching"
FIRST_FROST = "first_frost"
FIRST_SNOW = "first_snow"
RAINBOW = "rainbow_possible"
BEAUTIFUL_SUNSET = "beautiful_sunset"
FOEHN = "foehn_started"
BISE = "bise_started"
EXTRA_TRIGGERS = (RAIN_APPROACHING, FIRST_FROST, FIRST_SNOW, RAINBOW, BEAUTIFUL_SUNSET, FOEHN, BISE)


def _lang(hass: HomeAssistant) -> str:
    lang = (hass.config.language or "en").split("-")[0].lower()
    return lang if lang in ("de", "fr", "it", "rm", "en") else "en"


def _frac(v: float | None) -> float | None:
    if v is None:
        return None
    return v * 100 if v <= 1 else v


def forecast_hours(entry: MeteoSwissConfigEntry) -> list[dict[str, Any]]:
    """Hourly forecast of home as plain dicts for indicators.py."""
    data = entry.runtime_data.forecast.data
    if data is None:
        return []
    out = []
    for step in data.hourly:
        v = step.values
        out.append({
            "time": step.time,
            "temperature": v.get(HOURLY_TEMPERATURE),
            "precipitation": v.get(HOURLY_PRECIPITATION),
            "precipitation_probability": v.get(HOURLY_PRECIPITATION_PROBABILITY),
            "wind_speed": v.get(HOURLY_WIND_SPEED),
            "wind_gust": v.get(HOURLY_WIND_GUST),
            "sunshine": v.get(HOURLY_SUNSHINE),
            "radiation": v.get(HOURLY_RADIATION),
            "cloud_low": _frac(v.get(HOURLY_CLOUDS_LOW)),
            "cloud_mid": _frac(v.get(HOURLY_CLOUDS_MID)),
            "cloud_high": _frac(v.get(HOURLY_CLOUDS_HIGH)),
            "symbol": int(v[HOURLY_SYMBOL]) if v.get(HOURLY_SYMBOL) is not None else None,
        })
    return out


def _local_day(hours: list[dict[str, Any]], day: date) -> list[dict[str, Any]]:
    return [h for h in hours if (h["time"] - timedelta(minutes=30)).astimezone(SWISS_TZ).date() == day]


def _night(hours: list[dict[str, Any]], hass: HomeAssistant) -> list[dict[str, Any]]:
    """Hours of the coming night (sunset to sunrise)."""
    lat, lon = hass.config.latitude, hass.config.longitude
    today = dt_util.now().date()
    sun_today = astro.sun_times(today, lat, lon)
    sun_tomorrow = astro.sun_times(today + timedelta(days=1), lat, lon)
    if not sun_today or not sun_tomorrow:
        return []
    start, end = sun_today[1], sun_tomorrow[0]
    now = dt_util.utcnow()
    if now > end:
        return []
    return [h for h in hours if start < h["time"] <= end + timedelta(hours=1)]


def extra_sensors(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> list[SensorEntity]:
    """All sensors of this module that can be created for the entry."""
    data = entry.runtime_data
    out: list[SensorEntity] = [MoonPhaseSensor(data.forecast, entry), DayLengthSensor(data.forecast, entry),
                               EphemerisSensor(data.forecast, entry)]
    fc = data.forecast
    out += [DryingSensor(fc, entry), FrostSensor(fc, entry), StargazingSensor(fc, entry), SunsetSensor(fc, entry),
            SummarySensor(fc, entry), AmbianceSensor(fc, entry)]
    if entry.options.get(CONF_SOLAR_KWP):
        out += [SolarSensor(fc, entry, 0), SolarSensor(fc, entry, 1)]
    cur = data.current
    out += [FoehnSensor(cur, entry), BiseSensor(cur, entry), RainbowSensor(cur, entry)]
    if entry.options.get(CONF_INDOOR_HUMIDITY) and entry.options.get(CONF_INDOOR_TEMPERATURE):
        out.append(AiringSensor(cur, entry))
    if data.history is not None:
        h = data.history
        out += [AnomalySensor(h, entry), YesterdaySensor(h, entry), WateringSensor(h, entry),
                RecordSensor(h, entry, "max_temperature"), RecordSensor(h, entry, "min_temperature"), RecordSensor(h, entry, "max_gust"),
                FirstSensor(h, entry, "first_frost"), FirstSensor(h, entry, "first_snow")]
    if data.nowcast is not None:
        out.append(RainArrivalSensor(data.nowcast, entry))
    return out


class _Extra(MeteoSwissEntity, SensorEntity):
    """Base: unique id from the key, events when entering some states."""

    _event_states: dict[str, str] = {}  # state -> event type

    def __init__(self, coordinator, entry: MeteoSwissConfigEntry, key: str) -> None:
        super().__init__(coordinator, entry)
        self._entry = entry
        self._attr_translation_key = key
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._last_state: Any = None
        self._started = False

    def _fire(self, kind: str, **extra: Any) -> None:
        reg = self.registry_entry
        if reg is None or reg.device_id is None:
            return
        self.hass.bus.async_fire(EVENT, {"device_id": reg.device_id, "entity_id": self.entity_id, "type": kind, "subtype": "weather", **extra})

    def _handle_coordinator_update(self) -> None:
        state = self.native_value
        if self._started and state != self._last_state and state in self._event_states:
            self._fire(self._event_states[state])
        self._last_state, self._started = state, True
        super()._handle_coordinator_update()


# ---------------------------------------------------------------- astro


class _Clock(_Extra):
    """Sensors computed from the clock: refreshed every 10 minutes."""

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        self.async_on_remove(
            async_track_time_interval(self.hass, lambda _now: self.async_write_ha_state(), timedelta(minutes=10))
        )


class MoonPhaseSensor(_Clock):
    """Moon phase (8 phases), illumination and next full / new moon."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(astro.PHASE_KEYS)
    _attr_icon = "mdi:moon-waxing-crescent"

    def __init__(self, coordinator, entry) -> None:
        super().__init__(coordinator, entry, "moon_phase")

    @property
    def native_value(self) -> str:
        k, waxing = astro.illumination(dt_util.utcnow())
        return astro.PHASE_KEYS[astro.phase_index(k, waxing)]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        now = dt_util.utcnow()
        k, waxing = astro.illumination(now)
        return {"illumination": round(k * 100), "waxing": waxing,
                "next_full_moon": astro.next_phase(now, True).isoformat(),
                "next_new_moon": astro.next_phase(now, False).isoformat()}


class DayLengthSensor(_Clock):
    """Day length (minutes), sunrise, sunset and the change since yesterday."""

    _attr_native_unit_of_measurement = UnitOfTime.MINUTES
    _attr_icon = "mdi:sun-clock"

    def __init__(self, coordinator, entry) -> None:
        super().__init__(coordinator, entry, "day_length")

    @property
    def native_value(self) -> int | None:
        length = astro.day_length(dt_util.now().date(), self.hass.config.latitude, self.hass.config.longitude)
        return round(length) if length is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        lat, lon = self.hass.config.latitude, self.hass.config.longitude
        today = dt_util.now().date()
        times = astro.sun_times(today, lat, lon)
        now_len, prev_len = astro.day_length(today, lat, lon), astro.day_length(today - timedelta(days=1), lat, lon)
        return {"sunrise": times[0].isoformat() if times else None, "sunset": times[1].isoformat() if times else None,
                "change_since_yesterday": round(now_len - prev_len, 1) if now_len and prev_len else None}


class EphemerisSensor(_Clock):
    """Saint or feast of the day (Home Assistant language), week and day number."""

    _attr_icon = "mdi:calendar-star"

    def __init__(self, coordinator, entry) -> None:
        super().__init__(coordinator, entry, "ephemeris")

    @property
    def native_value(self) -> str | None:
        return astro.saint_of(dt_util.now().date(), _lang(self.hass))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        today = dt_util.now().date()
        iso = today.isocalendar()
        return {"week": iso[1], "day_of_year": today.timetuple().tm_yday,
                "days_in_year": 366 if today.year % 4 == 0 and (today.year % 100 or today.year % 400 == 0) else 365}


# ------------------------------------------------------------- forecast


class _ForecastIndicator(_Extra):
    _attr_device_class = SensorDeviceClass.ENUM

    def _result(self) -> dict[str, Any]:
        raise NotImplementedError

    @property
    def available(self) -> bool:
        return super().available and self._result().get("state") is not None

    @property
    def native_value(self) -> str | None:
        return self._result().get("state")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {k: v for k, v in self._result().items() if k != "state"}


class DryingSensor(_ForecastIndicator):
    """Laundry drying outside today: good / fair / poor and the best window."""

    _attr_options = ["good", "fair", "poor"]
    _attr_icon = "mdi:tshirt-crew"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "drying")

    def _result(self) -> dict[str, Any]:
        hours = forecast_hours(self._entry)
        now = dt_util.utcnow()
        today = [h for h in _local_day(hours, dt_util.now().date()) if h["time"] > now]
        return ind.drying(today) if len(today) >= 3 else {"state": None}


class FrostSensor(_ForecastIndicator):
    """Frost tonight for plants and windscreens: none / possible / likely."""

    _attr_options = ["none", "possible", "likely"]
    _attr_icon = "mdi:snowflake-thermometer"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "frost_tonight")

    def _result(self) -> dict[str, Any]:
        return ind.frost(_night(forecast_hours(self._entry), self.hass))


class StargazingSensor(_ForecastIndicator):
    """Clear night for the stars (clouds and moon): excellent / good / poor."""

    _attr_options = ["excellent", "good", "poor"]
    _attr_icon = "mdi:telescope"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "stargazing")

    def _result(self) -> dict[str, Any]:
        k, _ = astro.illumination(dt_util.utcnow())
        return ind.stargazing(_night(forecast_hours(self._entry), self.hass), k)


class SunsetSensor(_ForecastIndicator):
    """Will today's sunset be colorful? beautiful / maybe / no."""

    _attr_options = ["beautiful", "maybe", "no"]
    _attr_icon = "mdi:weather-sunset"
    _event_states = {"beautiful": BEAUTIFUL_SUNSET}

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "sunset_quality")

    def _result(self) -> dict[str, Any]:
        lat, lon = self.hass.config.latitude, self.hass.config.longitude
        times = astro.sun_times(dt_util.now().date(), lat, lon)
        if not times:
            return {"state": None}
        hours = forecast_hours(self._entry)
        hour = next((h for h in hours if h["time"] >= times[1]), None)
        return {"state": ind.sunset_quality(hour), "sunset": times[1].isoformat()}


class SummarySensor(_Extra):
    """The day in one sentence, in the Home Assistant language."""

    _attr_icon = "mdi:text-short"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "summary")

    @property
    def native_value(self) -> str | None:
        hours = forecast_hours(self._entry)
        now = dt_util.utcnow()
        today = [h for h in _local_day(hours, dt_util.now().date()) if h["time"] > now - timedelta(hours=1)]
        if len(today) < 3:  # evening: tomorrow
            today = _local_day(hours, dt_util.now().date() + timedelta(days=1))
        return ind.summary(today, _lang(self.hass), SWISS_TZ)


class AmbianceSensor(_Extra):
    """A color for a smart light (hex), from the weather and the time of day."""

    _attr_icon = "mdi:palette"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "ambiance_color")

    def _rgb(self) -> tuple[int, int, int]:
        code, _ = self.coordinator.current_symbol()
        elev, _ = ind.sun_position(dt_util.utcnow(), self.hass.config.latitude, self.hass.config.longitude)
        return ind.ambiance_color(code, elev)

    @property
    def native_value(self) -> str:
        return "#%02x%02x%02x" % self._rgb()

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"rgb_color": list(self._rgb())}


class SolarSensor(_Extra):
    """Estimated solar production today (0) or tomorrow (1), kWh, hour by hour."""

    _attr_device_class = SensorDeviceClass.ENERGY
    _attr_native_unit_of_measurement = UnitOfEnergy.KILO_WATT_HOUR
    _attr_icon = "mdi:solar-power-variant"

    def __init__(self, c, e, day: int) -> None:
        super().__init__(c, e, "solar_today" if day == 0 else "solar_tomorrow")
        self._day = day

    def _hours(self) -> list[tuple[datetime, float]]:
        o = self._entry.options
        day = dt_util.now().date() + timedelta(days=self._day)
        hours = _local_day(forecast_hours(self._entry), day)
        return ind.solar_estimate(hours, self.hass.config.latitude, self.hass.config.longitude,
                                  float(o.get(CONF_SOLAR_KWP) or 0), float(o.get(CONF_SOLAR_TILT, 30)), float(o.get(CONF_SOLAR_AZIMUTH, 180)))

    @property
    def available(self) -> bool:
        return super().available and bool(self._hours())

    @property
    def native_value(self) -> float | None:
        hours = self._hours()
        return round(sum(v for _, v in hours), 1) if hours else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        hours = self._hours()
        best = max(hours, key=lambda x: x[1]) if hours else None
        return {"hourly": [{"datetime": (t - timedelta(hours=1)).isoformat(), "energy": round(v, 2)} for t, v in hours],
                "best_hour": (best[0] - timedelta(hours=1)).isoformat() if best and best[1] > 0 else None,
                "estimated": True}


# -------------------------------------------------------------- current


def _all(entry: MeteoSwissConfigEntry) -> dict[str, dict[str, float | None]]:
    return {k: v.values for k, v in entry.runtime_data.current.all_stations.items()}


class FoehnSensor(_ForecastIndicator):
    """South foehn from the pressure difference Lugano - Zurich (and Altdorf)."""

    _attr_options = ["none", "likely", "in_force", "north_foehn"]
    _attr_icon = "mdi:weather-windy-variant"
    _event_states = {"in_force": FOEHN}

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "foehn")

    def _result(self) -> dict[str, Any]:
        return ind.foehn(_all(self._entry))


class BiseSensor(_ForecastIndicator):
    """Bise on the Plateau and Lake Geneva."""

    _attr_options = ["none", "moderate", "strong"]
    _attr_icon = "mdi:weather-windy"
    _event_states = {"moderate": BISE, "strong": BISE}

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "bise")

    def _result(self) -> dict[str, Any]:
        return ind.bise(_all(self._entry))


class RainbowSensor(_ForecastIndicator):
    """Rainbow possible now: sun low, sunshine here, showers around."""

    _attr_options = ["yes", "no"]
    _attr_icon = "mdi:looks"
    _event_states = {"yes": RAINBOW}

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "rainbow")

    def _result(self) -> dict[str, Any]:
        cur = self.coordinator.data
        if cur is None:
            return {"state": None}
        elev, _ = ind.sun_position(dt_util.utcnow(), self.hass.config.latitude, self.hass.config.longitude)
        hours = forecast_hours(self._entry)[:2]
        nowcast = self._entry.runtime_data.nowcast
        near = nowcast is not None and (nowcast.data or {}).get("state") in ("approaching",)
        rain_soon = near or any((h.get("precipitation_probability") or 0) >= 40 for h in hours)
        return {"state": "yes" if ind.rainbow(elev, cur.values.get("sre000z0"), rain_soon) else "no", "sun_elevation": round(elev, 1)}


class AiringSensor(_ForecastIndicator):
    """Open the windows? From indoor and outdoor humidity and temperature."""

    _attr_options = ["recommended", "neutral", "not_recommended"]
    _attr_icon = "mdi:window-open-variant"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "airing")

    def _num(self, entity_id: str | None) -> float | None:
        state = self.hass.states.get(entity_id) if entity_id else None
        try:
            return float(state.state) if state is not None else None
        except ValueError:
            return None

    def _result(self) -> dict[str, Any]:
        cur = self.coordinator.data
        o = self._entry.options
        return ind.airing(self._num(o.get(CONF_INDOOR_TEMPERATURE)), self._num(o.get(CONF_INDOOR_HUMIDITY)),
                          cur.values.get("tre200s0") if cur else None, cur.values.get("ure200s0") if cur else None)


# -------------------------------------------------------------- history


class _HistoryBase(_Extra):
    def _summary(self) -> dict[str, Any]:
        if self.coordinator.data is None:
            return {}
        fc = self._entry.runtime_data.forecast.data
        tmax = None
        if fc is not None:
            today = dt_util.now().date()
            step = next((s for s in fc.daily if s.time.date() == today), None)
            tmax = step.values.get(DAILY_TEMP_MAX) if step else None
        cur = self._entry.runtime_data.current.data
        return summarize(self.coordinator.data, dt_util.now().date(), tmax, cur.values if cur else None)


class AnomalySensor(_HistoryBase):
    """Today's forecast maximum compared with the 1991-2020 normal (°C)."""

    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_icon = "mdi:thermometer-chevron-up"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "temperature_anomaly")

    @property
    def native_value(self) -> float | None:
        return self._summary().get("anomaly")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        s = self._summary()
        return {"normal_max": s.get("normal_max"), "normal_min": s.get("normal_min"), "period": "1991-2020"}


class YesterdaySensor(_HistoryBase):
    """Yesterday's maximum; today compared with yesterday and the last days."""

    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_icon = "mdi:calendar-arrow-left"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "yesterday")

    @property
    def native_value(self) -> float | None:
        return (self._summary().get("yesterday") or {}).get("tmax")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        s = self._summary()
        y = s.get("yesterday") or {}
        return {"min_temperature": y.get("tmin"), "precipitation": y.get("rain"), "sunshine": y.get("sunshine"),
                "today_vs_yesterday": s.get("vs_yesterday"), "warmest_since_days": s.get("warmest_since_days"),
                "coldest_since_days": s.get("coldest_since_days")}


class RecordSensor(_HistoryBase):
    """Record of the year at the station (temperature max / min, strongest gust)."""

    _attr_state_class = None

    def __init__(self, c, e, key: str) -> None:
        super().__init__(c, e, f"year_{key}")
        self._key = key
        if key == "max_gust":
            self._attr_native_unit_of_measurement = "km/h"
            self._attr_device_class = SensorDeviceClass.WIND_SPEED
            self._attr_icon = "mdi:weather-windy"
        else:
            self._attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
            self._attr_device_class = SensorDeviceClass.TEMPERATURE
            self._attr_icon = "mdi:thermometer-high" if key == "max_temperature" else "mdi:thermometer-low"

    @property
    def native_value(self) -> float | None:
        return (self._summary().get("records") or {}).get(self._key)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"date": (self._summary().get("records") or {}).get(f"{self._key}_date")}


class FirstSensor(_HistoryBase):
    """Date of the first frost / first snow of the season (since 1 August)."""

    _attr_device_class = SensorDeviceClass.DATE

    def __init__(self, c, e, key: str) -> None:
        super().__init__(c, e, key)
        self._key = key
        self._attr_icon = "mdi:snowflake" if key == "first_snow" else "mdi:snowflake-thermometer"
        self._event_states = {}

    @property
    def native_value(self) -> date | None:
        value = self._summary().get(self._key)
        return date.fromisoformat(value) if value else None

    def _handle_coordinator_update(self) -> None:
        value = self.native_value
        if self._started and self._last_state is None and value is not None:
            self._fire(FIRST_SNOW if self._key == "first_snow" else FIRST_FROST)
        self._last_state, self._started = value, True
        SensorEntity.async_write_ha_state(self)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        if self._key == "first_frost":
            return {"first_ground_frost": self._summary().get("first_ground_frost")}
        return {}


class WateringSensor(_HistoryBase):
    """Garden watering: not needed / optional / recommended (water balance)."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = ["not_needed", "optional", "recommended"]
    _attr_icon = "mdi:watering-can"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "watering")

    def _result(self) -> dict[str, Any]:
        s = self._summary()
        if not s:
            return {"state": None}
        fc = self._entry.runtime_data.forecast.data
        rain_next = tmax = None
        if fc is not None:
            today = dt_util.now().date()
            nxt = [st for st in fc.daily if today <= st.time.date() <= today + timedelta(days=1)]
            rain_next = sum(st.values.get(DAILY_PRECIPITATION) or 0 for st in nxt)
            tmax = max((st.values.get(DAILY_TEMP_MAX) or -99 for st in nxt), default=None)
        return ind.watering(s.get("rain_5_days") or [], s.get("evaporation_5_days") or [], rain_next, tmax)

    @property
    def native_value(self) -> str | None:
        return self._result().get("state")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {k: v for k, v in self._result().items() if k != "state"}


# -------------------------------------------------------------- nowcast


class RainArrivalSensor(_Extra):
    """Minutes before the rain reaches home (radar), 0 while raining."""

    _attr_native_unit_of_measurement = UnitOfTime.MINUTES
    _attr_icon = "mdi:weather-rainy"

    def __init__(self, c, e) -> None:
        super().__init__(c, e, "rain_arrival")
        self._alerted = False

    @property
    def native_value(self) -> int | None:
        return (self.coordinator.data or {}).get("minutes")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        d = self.coordinator.data or {}
        return {k: d.get(k) for k in ("state", "arrival", "speed", "from_bearing", "radar_time", "stale")}

    def _handle_coordinator_update(self) -> None:
        d = self.coordinator.data or {}
        limit = int(self._entry.options.get(CONF_RAIN_ALERT_MINUTES, DEFAULT_RAIN_ALERT_MINUTES))
        coming = d.get("state") == "approaching" and (d.get("minutes") or 99) <= limit
        if coming and not self._alerted:
            self._fire(RAIN_APPROACHING, minutes=d.get("minutes"))
        self._alerted = coming or d.get("state") == "raining"
        self.async_write_ha_state()
