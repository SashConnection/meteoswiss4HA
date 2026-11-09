"""Constants for the MeteoSwiss Complete For HA integration."""

from __future__ import annotations

from datetime import timedelta
from typing import Final
from zoneinfo import ZoneInfo

DOMAIN: Final = "meteoswiss4ha"

SWISS_TZ: Final = ZoneInfo("Europe/Zurich")

# URL where the integration serves its pictograms: icons/<pack>/<code>.svg
ICONS_URL: Final = f"/{DOMAIN}/icons"
ICON_PACKS: Final = ("animated", "vivid", "classic")

# Map: sidebar page and dashboard card (frontend/meteoswiss-map.js).
FRONTEND_URL: Final = f"/{DOMAIN}/frontend"
PANEL_URL_PATH: Final = "meteoswiss"
# Bumped with the manifest version; busts the browser cache of the map module.
VERSION: Final = "2026.01.6"

# Attribute / forecast key carrying the native MeteoSwiss symbol code.
ATTR_METEOSWISS_SYMBOL: Final = "meteoswiss_symbol"

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
POLLEN_UPDATE_INTERVAL: Final = timedelta(minutes=60)
HAZARD_UPDATE_INTERVAL: Final = timedelta(minutes=30)

# Options
CONF_HOURLY_FORECAST: Final = "hourly_forecast"
CONF_HOURLY_HOURS: Final = "hourly_hours"
CONF_HOURLY_INTERVAL: Final = "hourly_interval"
CONF_ICON_PACK: Final = "icon_pack"
CONF_POLLEN_STATION: Final = "pollen_station"
CONF_AVALANCHE_REGION: Final = "avalanche_region"
# Base URL of the radar frame server (Node-RED flow in nodered/), optional.
CONF_RADAR_URL: Final = "radar_url"
DEFAULT_ICON_PACK: Final = "animated"

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
