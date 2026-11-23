"""Yes / no sensors, made for automations (close the awning, rain alert, frost...).

Each one is "on" when something needs doing or is happening, so an automation
only needs "when it turns on". They reuse the indicators of sensor_extra.py.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import timedelta
from typing import Any

from homeassistant.components.binary_sensor import BinarySensorDeviceClass, BinarySensorEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import air as air_mod
from .const import (
    SWISS_TZ,
    CONF_GUST_THRESHOLD,
    CONF_INDOOR_HUMIDITY,
    CONF_INDOOR_TEMPERATURE,
    CONF_RAIN_ALERT_MINUTES,
    CONF_WARNING_LEVEL,
    DEFAULT_GUST_THRESHOLD,
    DEFAULT_RAIN_ALERT_MINUTES,
    DEFAULT_WARNING_LEVEL,
)
from .coordinator import MeteoSwissConfigEntry
from .entity import MeteoSwissEntity
from .hazards import LEVELS
from .sensor_env import COVERED_STATES
from .sensor_extra import airing_result, drying_result, forecast_hours, frost_result, watering_result

GUST_HOURS = 3  # forecast hours watched for strong gusts


async def async_setup_entry(
    hass: HomeAssistant,
    entry: MeteoSwissConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the yes / no sensors."""
    data = entry.runtime_data
    cur = data.current
    entities: list[BinarySensorEntity] = [
        Flag(cur, entry, "raining", raining, BinarySensorDeviceClass.MOISTURE, "mdi:weather-pouring"),
        Flag(cur, entry, "strong_gusts", strong_gusts, BinarySensorDeviceClass.SAFETY, "mdi:weather-windy"),
        Flag(cur, entry, "frost_risk", frost, BinarySensorDeviceClass.COLD, "mdi:snowflake-thermometer"),
        Flag(cur, entry, "good_drying", drying, None, "mdi:tshirt-crew"),
        Flag(cur, entry, "windshield_frost", windshield, BinarySensorDeviceClass.COLD, "mdi:car-defrost-front"),
        Flag(cur, entry, "mowing_day", mowing, None, "mdi:mower"),
        Flag(cur, entry, "cool_night", cool_night, None, "mdi:weather-night"),
    ]
    if data.air is not None:
        entities.append(Flag(data.air, entry, "ozone_peak", ozone, BinarySensorDeviceClass.PROBLEM, "mdi:molecule"))
    if data.nowcast is not None:
        entities.append(Flag(data.nowcast, entry, "rain_soon", rain_soon, BinarySensorDeviceClass.MOISTURE, "mdi:weather-rainy"))
    if data.hazards is not None:
        entities.append(Flag(data.hazards, entry, "warning_active", warning, BinarySensorDeviceClass.SAFETY, "mdi:alert"))
    if data.fog is not None:
        entities.append(Flag(data.fog, entry, "fog_home", fog, None, "mdi:weather-fog"))
    if data.history is not None:
        entities.append(Flag(data.history, entry, "watering_needed", watering, None, "mdi:watering-can"))
    if entry.options.get(CONF_INDOOR_TEMPERATURE) and entry.options.get(CONF_INDOOR_HUMIDITY):
        entities.append(Flag(cur, entry, "airing_recommended", airing, BinarySensorDeviceClass.WINDOW, "mdi:window-open-variant"))
    async_add_entities(entities)


# Each check returns (on / off / None when unknown, attributes).
Result = tuple[bool | None, dict[str, Any]]


def raining(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Rain at the station in the last 10 minutes, or on the radar at home."""
    cur = entry.runtime_data.current.data
    rain = cur.values.get("rre150z0") if cur else None
    radar = (entry.runtime_data.nowcast.data or {}).get("state") if entry.runtime_data.nowcast else None
    if rain is None and radar is None:
        return None, {}
    return bool((rain or 0) > 0 or radar == "raining"), {"station_precipitation": rain, "radar": radar}


def rain_soon(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Rain reaches home within the alert time (radar), or it already rains."""
    d = entry.runtime_data.nowcast.data or {}
    state = d.get("state")
    if state is None:
        return None, {}
    limit = int(entry.options.get(CONF_RAIN_ALERT_MINUTES, DEFAULT_RAIN_ALERT_MINUTES))
    minutes = d.get("minutes")
    on = state == "raining" or (state == "approaching" and minutes is not None and minutes <= limit)
    return on, {"minutes": minutes, "arrival": d.get("arrival"), "alert_minutes": limit}


def strong_gusts(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Gusts at or above the threshold now (station) or in the next hours (forecast)."""
    limit = float(entry.options.get(CONF_GUST_THRESHOLD, DEFAULT_GUST_THRESHOLD))
    cur = entry.runtime_data.current.data
    now_gust = cur.values.get("fu3010z1") if cur else None
    now = dt_util.utcnow()
    soon = [h for h in forecast_hours(entry) if now < h["time"] <= now + timedelta(hours=GUST_HOURS + 1)][:GUST_HOURS]
    gusts = [h for h in soon if h["wind_gust"] is not None]
    peak = max(gusts, key=lambda h: h["wind_gust"]) if gusts else None
    if now_gust is None and peak is None:
        return None, {}
    values = [v for v in (now_gust, peak["wind_gust"] if peak else None) if v is not None]
    return max(values) >= limit, {
        "gust_now": now_gust,
        "gust_max_next_hours": peak["wind_gust"] if peak else None,
        "gust_max_time": (peak["time"] - timedelta(hours=1)).isoformat() if peak else None,
        "threshold": limit,
    }


def frost(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Frost possible or likely in the coming night."""
    r = frost_result(hass, entry)
    state = r.get("state")
    if state is None:
        return None, {}
    return state in ("possible", "likely"), {"risk": state, **{k: v for k, v in r.items() if k != "state"}}


def drying(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Good conditions to dry laundry outside for the rest of today."""
    r = drying_result(entry)
    state = r.get("state")
    if state is None:
        return None, {}
    return state == "good", {"quality": state, **{k: v for k, v in r.items() if k != "state"}}


def warning(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """A MeteoSwiss weather warning in force at home, at the chosen level or higher."""
    data = entry.runtime_data.hazards.data
    items = (data.weather or {}) if data is not None else {}
    if not items:
        return None, {}
    level = int(entry.options.get(CONF_WARNING_LEVEL, DEFAULT_WARNING_LEVEL))
    active = {k: w.level for k, w in items.items() if w.level >= level}
    upcoming = sorted({k for k, w in items.items() if w.upcoming})
    top = max(active.values(), default=1)
    return bool(active), {
        "warnings": sorted(active),
        "highest_level": top,
        "highest": LEVELS[top - 1] if 1 <= top <= len(LEVELS) else None,
        "upcoming": upcoming,
        "minimum_level": level,
    }


def fog(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Fog or low stratus in the home region now."""
    data = entry.runtime_data.fog.data
    region = next((r for r in data["regions"] if r["key"] == data.get("home_region")), None) if data else None
    if region is None:
        return None, {}
    now = region["now"]
    return now["state"] in COVERED_STATES, {"state": now["state"], "top_min": now["top_min"], "top_max": now["top_max"]}


def watering(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Watering the garden is recommended (water balance and forecast)."""
    r = watering_result(entry)
    state = r.get("state")
    if state is None:
        return None, {}
    return state == "recommended", {"advice": state, **{k: v for k, v in r.items() if k != "state"}}


def airing(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Opening the windows is recommended now."""
    r = airing_result(hass, entry)
    state = r.get("state")
    if state is None:
        return None, {}
    return state == "recommended", {"advice": state, **{k: v for k, v in r.items() if k != "state"}}


def _local_hours(entry: MeteoSwissConfigEntry, day_offset: int, start: int, end: int) -> list[dict[str, Any]]:
    """Forecast hours of a local day between two hours (start included, end excluded)."""
    day = dt_util.now().astimezone(SWISS_TZ).date() + timedelta(days=day_offset)
    out = []
    for h in forecast_hours(entry):
        local = (h["time"] - timedelta(hours=1)).astimezone(SWISS_TZ)
        if local.date() == day and start <= local.hour < end:
            out.append(h)
    return out


def windshield(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Frost on the windscreen tomorrow morning (5-8 h): cold and clear, or below zero."""
    now_local = dt_util.now().astimezone(SWISS_TZ)
    offset = 0 if now_local.hour < 8 else 1
    hours = [h for h in _local_hours(entry, offset, 4, 8) if h["temperature"] is not None]
    if not hours:
        return None, {}
    tmin = min(h["temperature"] for h in hours)
    clouds = [h["cloud_low"] for h in hours if h.get("cloud_low") is not None]
    clear = not clouds or sum(clouds) / len(clouds) < 60
    on = tmin <= -0.5 or (tmin <= 1.5 and clear)
    return on, {"minimum": round(tmin, 1), "clear_sky": clear, "morning": "today" if offset == 0 else "tomorrow"}


def mowing(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """A good day to mow the lawn: growing season, dry now and for the rest of the day."""
    now_local = dt_util.now().astimezone(SWISS_TZ)
    if not 3 <= now_local.month <= 10:
        return False, {"season": False}
    hours = _local_hours(entry, 0, max(now_local.hour, 9), 20)
    if len(hours) < 2:
        return False, {"reason": "late"}
    cur = entry.runtime_data.current.data
    wet_now = (cur.values.get("rre150z0") or 0) > 0 if cur else False
    rain = sum(h["precipitation"] or 0 for h in hours)
    prob = max((h["precipitation_probability"] or 0) for h in hours)
    tmax = max((h["temperature"] or -99) for h in hours)
    on = not wet_now and rain < 0.3 and prob < 40 and tmax >= 10
    return on, {"rain": round(rain, 1), "rain_probability": round(prob), "maximum": round(tmax, 1)}


def cool_night(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Warm day, cool night: open the windows tonight to cool the house."""
    today = _local_hours(entry, 0, 0, 24)
    night = _local_hours(entry, 0, 22, 24) + _local_hours(entry, 1, 0, 7)
    temps_day = [h["temperature"] for h in today if h["temperature"] is not None]
    temps_night = [h["temperature"] for h in night if h["temperature"] is not None]
    if not temps_day or not temps_night:
        return None, {}
    tmax, tmin = max(temps_day), min(temps_night)
    return tmax >= 25 and tmin <= 18, {"maximum_today": round(tmax, 1), "minimum_tonight": round(tmin, 1)}


def ozone(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> Result:
    """Ozone above the Swiss standard (120 µg/m³ hourly mean) at the NABEL site."""
    coordinator = entry.runtime_data.air
    values = (coordinator.data.sites.get(coordinator.site) if coordinator.data else None) or {}
    o3 = values.get("o3")
    if o3 is None:
        return None, {}
    return o3 > air_mod.LIMITS["o3"], {"ozone": o3, "max_today": values.get("o3_max"),
                                       "site": air_mod.SITES[coordinator.site][0], "limit": air_mod.LIMITS["o3"]}


class Flag(MeteoSwissEntity, BinarySensorEntity):
    """A yes / no sensor computed by a check function."""

    def __init__(
        self,
        coordinator,
        entry: MeteoSwissConfigEntry,
        key: str,
        check: Callable[[HomeAssistant, MeteoSwissConfigEntry], Result],
        device_class: BinarySensorDeviceClass | None,
        icon: str,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry)
        self._entry = entry
        self._check = check
        self._attr_translation_key = key
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_device_class = device_class
        self._attr_icon = icon

    def _result(self) -> Result:
        try:
            return self._check(self.hass, self._entry)
        except (KeyError, TypeError, ValueError, AttributeError):
            return None, {}

    @property
    def available(self) -> bool:
        """Available while the value is known."""
        return super().available and self._result()[0] is not None

    @property
    def is_on(self) -> bool | None:
        """Return true when the condition is met."""
        return self._result()[0]

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Details behind the yes / no."""
        return self._result()[1]
