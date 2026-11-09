"""Config flow for MeteoSwiss Open Data."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
)

from .api import (
    POINT_TYPE_POSTAL_CODE,
    ForecastPoint,
    MeteoSwissClient,
    MeteoSwissError,
    Station,
    distance_km,
)
from .const import (
    CONF_POINT_ID,
    CONF_POINT_NAME,
    CONF_POINT_TYPE_ID,
    CONF_POSTAL_CODE,
    CONF_STATION,
    CONF_STATION_NAME,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)


class MeteoSwissConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for MeteoSwiss Open Data."""

    VERSION = 1

    def __init__(self) -> None:
        """Initialize the flow."""
        self._stations: dict[str, Station] = {}
        self._points: list[ForecastPoint] = []

    async def _async_load_metadata(self) -> None:
        """Download station and forecast point metadata once per flow."""
        if self._stations and self._points:
            return
        client = MeteoSwissClient(async_get_clientsession(self.hass))
        stations = await client.async_get_stations()
        current = await client.async_get_current()
        # Only offer stations that actually publish current values.
        self._stations = {s.abbr: s for s in stations if s.abbr in current}
        self._points = await client.async_get_points()

    def _find_postal_code(self, postal_code: str) -> ForecastPoint | None:
        for point in self._points:
            if (
                point.point_type_id == POINT_TYPE_POSTAL_CODE
                and point.postal_code == postal_code
            ):
                return point
        return None

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Choose the measurement station and the forecast postal code."""
        errors: dict[str, str] = {}

        try:
            await self._async_load_metadata()
        except MeteoSwissError as err:
            _LOGGER.warning("Cannot load MeteoSwiss metadata: %s", err)
            return self.async_abort(reason="cannot_connect")

        if user_input is not None:
            station = self._stations.get(user_input[CONF_STATION])
            postal_code = user_input[CONF_POSTAL_CODE].strip()
            point = self._find_postal_code(postal_code)
            if station is None:
                errors[CONF_STATION] = "unknown_station"
            elif point is None:
                errors[CONF_POSTAL_CODE] = "unknown_postal_code"
            else:
                await self.async_set_unique_id(
                    f"{station.abbr}_{point.point_type_id}_{point.point_id}"
                )
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=f"{point.name} ({postal_code})",
                    data={
                        CONF_STATION: station.abbr,
                        CONF_STATION_NAME: station.name,
                        CONF_POINT_ID: point.point_id,
                        CONF_POINT_TYPE_ID: point.point_type_id,
                        CONF_POINT_NAME: point.name,
                        CONF_POSTAL_CODE: postal_code,
                    },
                )

        lat = self.hass.config.latitude
        lon = self.hass.config.longitude
        stations = sorted(
            self._stations.values(),
            key=lambda s: distance_km(lat, lon, s.latitude, s.longitude),
        )
        postal_points = [
            p for p in self._points if p.point_type_id == POINT_TYPE_POSTAL_CODE
        ]
        nearest_point = min(
            postal_points,
            key=lambda p: distance_km(lat, lon, p.latitude, p.longitude),
            default=None,
        )

        options = [
            SelectOptionDict(
                value=s.abbr,
                label=(
                    f"{s.name} ({s.abbr}, {s.canton}) – "
                    f"{distance_km(lat, lon, s.latitude, s.longitude):.0f} km"
                ),
            )
            for s in stations
        ]
        schema = vol.Schema(
            {
                vol.Required(
                    CONF_STATION, default=stations[0].abbr if stations else vol.UNDEFINED
                ): SelectSelector(
                    SelectSelectorConfig(options=options, mode=SelectSelectorMode.DROPDOWN)
                ),
                vol.Required(
                    CONF_POSTAL_CODE,
                    default=(
                        nearest_point.postal_code
                        if nearest_point and nearest_point.postal_code
                        else vol.UNDEFINED
                    ),
                ): TextSelector(),
            }
        )
        if user_input is not None:
            schema = self.add_suggested_values_to_schema(schema, user_input)

        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)
