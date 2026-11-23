"""Solar production forecast for the Energy dashboard (when solar panels are set)."""

from __future__ import annotations

from datetime import timedelta

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from . import indicators as ind
from .const import CONF_SOLAR_AZIMUTH, CONF_SOLAR_KWP, CONF_SOLAR_TILT, DOMAIN
from .sensor_extra import _local_day, forecast_hours


async def async_get_solar_forecast(hass: HomeAssistant, config_entry_id: str) -> dict[str, dict[str, float]] | None:
    """Estimated production (Wh) of each hour of today and the next days."""
    entry = hass.config_entries.async_get_entry(config_entry_id)
    if entry is None or entry.domain != DOMAIN or not hasattr(entry, "runtime_data"):
        return None
    kwp = float(entry.options.get(CONF_SOLAR_KWP) or 0)
    if kwp <= 0:
        return None
    hours = forecast_hours(entry)
    today = dt_util.now().date()
    wh: dict[str, float] = {}
    for offset in range(3):
        day_hours = _local_day(hours, today + timedelta(days=offset))
        for end, kwh in ind.solar_estimate(day_hours, hass.config.latitude, hass.config.longitude, kwp,
                                           float(entry.options.get(CONF_SOLAR_TILT, 30)),
                                           float(entry.options.get(CONF_SOLAR_AZIMUTH, 180))):
            wh[(end - timedelta(hours=1)).isoformat()] = round(kwh * 1000)
    return {"wh_hours": wh} if wh else None
