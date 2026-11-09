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
