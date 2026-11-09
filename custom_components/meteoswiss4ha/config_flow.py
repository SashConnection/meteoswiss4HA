"""Config flow for MeteoSwiss Complete For HA."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlow,
)
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    BooleanSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .hazards import HazardClient
from .api import (
    POINT_TYPE_POSTAL_CODE,
    ForecastPoint,
    MeteoSwissClient,
    MeteoSwissError,
    normalize_radar_url,
    Station,
    distance_km,
)
from .const import (
    CONF_AVALANCHE_REGION,
    CONF_POLLEN_STATION,
    CONF_RADAR_URL,
    CONF_ICON_PACK,
    DEFAULT_ICON_PACK,
    ICON_PACKS,
    CONF_HOURLY_FORECAST,
    CONF_HOURLY_HOURS,
    CONF_HOURLY_INTERVAL,
    DEFAULT_HOURLY_FORECAST,
    DEFAULT_HOURLY_HOURS,
    DEFAULT_HOURLY_INTERVAL,
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
    """Handle a config flow for MeteoSwiss Complete For HA."""

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

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> MeteoSwissOptionsFlow:
        """Return the options flow."""
        return MeteoSwissOptionsFlow()


AUTO = "auto"
AUTO_LABELS = {
    "en": "Automatic (nearest)",
    "fr": "Automatique (le plus proche)",
    "de": "Automatisch (nächstgelegen)",
    "it": "Automatico (il più vicino)",
}

DISPLAY_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_ICON_PACK, default=DEFAULT_ICON_PACK): SelectSelector(
            SelectSelectorConfig(
                options=list(ICON_PACKS),
                translation_key=CONF_ICON_PACK,
                mode=SelectSelectorMode.LIST,
            )
        ),
        vol.Optional(CONF_RADAR_URL): TextSelector(
            TextSelectorConfig(type=TextSelectorType.URL)
        ),
    }
)

FORECAST_SCHEMA = vol.Schema(
    {
        vol.Required(
            CONF_HOURLY_FORECAST, default=DEFAULT_HOURLY_FORECAST
        ): BooleanSelector(),
        vol.Required(CONF_HOURLY_HOURS, default=DEFAULT_HOURLY_HOURS): NumberSelector(
            NumberSelectorConfig(
                min=6, max=120, step=6, unit_of_measurement="h",
                mode=NumberSelectorMode.SLIDER,
            )
        ),
        vol.Required(
            CONF_HOURLY_INTERVAL, default=DEFAULT_HOURLY_INTERVAL
        ): NumberSelector(
            NumberSelectorConfig(
                min=60, max=720, step=60, unit_of_measurement="min",
                mode=NumberSelectorMode.SLIDER,
            )
        ),
    }
)


class MeteoSwissOptionsFlow(OptionsFlow):
    """Options, organised as a menu: display, forecast, pollen and hazards."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show the options menu."""
        return self.async_show_menu(
            step_id="init", menu_options=["display", "forecast", "environment"]
        )

    def _save(self, values: dict[str, Any]) -> ConfigFlowResult:
        options = {**self.config_entry.options, **values}
        # "auto" means: let the integration choose (nearest), so drop the key.
        options = {k: v for k, v in options.items() if v != AUTO}
        return self.async_create_entry(data=options)

    async def async_step_display(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Pictogram pack."""
        if user_input is not None:
            return self._save(
                {
                    CONF_ICON_PACK: user_input[CONF_ICON_PACK],
                    # Empty means: no radar server.
                    CONF_RADAR_URL: normalize_radar_url(user_input.get(CONF_RADAR_URL))
                    or AUTO,
                }
            )
        return self.async_show_form(
            step_id="display",
            data_schema=self.add_suggested_values_to_schema(
                DISPLAY_SCHEMA, self.config_entry.options
            ),
        )

    async def async_step_forecast(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Hourly forecast download settings."""
        if user_input is not None:
            return self._save(
                {
                    CONF_HOURLY_FORECAST: user_input[CONF_HOURLY_FORECAST],
                    CONF_HOURLY_HOURS: int(user_input[CONF_HOURLY_HOURS]),
                    CONF_HOURLY_INTERVAL: int(user_input[CONF_HOURLY_INTERVAL]),
                }
            )
        return self.async_show_form(
            step_id="forecast",
            data_schema=self.add_suggested_values_to_schema(
                FORECAST_SCHEMA, self.config_entry.options
            ),
        )

    async def async_step_environment(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Pollen station and avalanche region (default: automatic)."""
        if user_input is not None:
            return self._save(
                {
                    CONF_POLLEN_STATION: user_input[CONF_POLLEN_STATION],
                    CONF_AVALANCHE_REGION: user_input[CONF_AVALANCHE_REGION],
                }
            )

        session = async_get_clientsession(self.hass)
        lang = (self.hass.config.language or "en").split("-")[0]
        auto = SelectOptionDict(value=AUTO, label=AUTO_LABELS.get(lang, AUTO_LABELS["en"]))
        pollen_options = [auto]
        region_options = [auto]
        try:
            stations = await MeteoSwissClient(session).async_get_pollen_stations()
            pollen_options += [
                SelectOptionDict(value=s.abbr, label=f"{s.name} ({s.abbr})")
                for s in sorted(stations, key=lambda s: s.name)
            ]
            regions = await HazardClient(session, "en").async_get_regions()
            region_options += [
                SelectOptionDict(value=rid, label=rid)
                for rid in sorted(f["properties"]["id"] for f in regions["features"])
            ]
        except (MeteoSwissError, KeyError, TypeError):
            _LOGGER.warning("Cannot load pollen stations or avalanche regions")

        schema = vol.Schema(
            {
                vol.Required(CONF_POLLEN_STATION, default=AUTO): SelectSelector(
                    SelectSelectorConfig(
                        options=pollen_options, mode=SelectSelectorMode.DROPDOWN
                    )
                ),
                vol.Required(CONF_AVALANCHE_REGION, default=AUTO): SelectSelector(
                    SelectSelectorConfig(
                        options=region_options, mode=SelectSelectorMode.DROPDOWN
                    )
                ),
            }
        )
        return self.async_show_form(
            step_id="environment",
            data_schema=self.add_suggested_values_to_schema(
                schema, self.config_entry.options
            ),
        )
