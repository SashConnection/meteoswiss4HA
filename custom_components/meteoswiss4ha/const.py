"""Constants for the MeteoSwiss Open Data integration."""

from __future__ import annotations

from datetime import timedelta
from typing import Final

DOMAIN: Final = "meteoswiss4ha"

ATTRIBUTION: Final = "Source: MeteoSwiss"
MANUFACTURER: Final = "MeteoSwiss"

# Config entry data keys
CONF_STATION: Final = "station"
CONF_STATION_NAME: Final = "station_name"
CONF_POINT_ID: Final = "point_id"
CONF_POINT_TYPE_ID: Final = "point_type_id"
CONF_POINT_NAME: Final = "point_name"
CONF_POSTAL_CODE: Final = "postal_code"

CURRENT_UPDATE_INTERVAL: Final = timedelta(minutes=10)
# Daily forecast files are small (~1.3 MB); a new run is published every hour.
FORECAST_UPDATE_INTERVAL: Final = timedelta(minutes=60)

# Options
CONF_HOURLY_FORECAST: Final = "hourly_forecast"
CONF_HOURLY_HOURS: Final = "hourly_hours"
CONF_HOURLY_INTERVAL: Final = "hourly_interval"

DEFAULT_HOURLY_FORECAST: Final = True
DEFAULT_HOURLY_HOURS: Final = 48
# Hourly files are large (~33 MB each, of which ~8 MB are read for 48 h),
# so they are refreshed less often than the daily forecast by default.
DEFAULT_HOURLY_INTERVAL: Final = 180  # minutes

# Local forecast parameters (see opendatadocs.meteoswiss.ch, local forecast)
DAILY_SYMBOL: Final = "jp2000d0"
DAILY_TEMP_MAX: Final = "tre200px"
DAILY_TEMP_MIN: Final = "tre200pn"
DAILY_PRECIPITATION: Final = "rka150p0"
DAILY_PARAMS: Final = (DAILY_SYMBOL, DAILY_TEMP_MAX, DAILY_TEMP_MIN, DAILY_PRECIPITATION)

HOURLY_SYMBOL: Final = "jww003i0"
HOURLY_TEMPERATURE: Final = "tre200h0"
HOURLY_PRECIPITATION: Final = "rre150h0"
HOURLY_PRECIPITATION_PROBABILITY: Final = "rp0003i0"
HOURLY_WIND_SPEED: Final = "fu3010h0"
HOURLY_WIND_GUST: Final = "fu3010h1"
HOURLY_WIND_BEARING: Final = "dkl010h0"
HOURLY_PARAMS: Final = (
    HOURLY_SYMBOL,
    HOURLY_TEMPERATURE,
    HOURLY_PRECIPITATION,
    HOURLY_PRECIPITATION_PROBABILITY,
    HOURLY_WIND_SPEED,
    HOURLY_WIND_GUST,
    HOURLY_WIND_BEARING,
)
