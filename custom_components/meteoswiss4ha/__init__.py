"""The MeteoSwiss Complete For HA integration."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components import panel_custom
from homeassistant.components.frontend import DATA_PANELS, add_extra_js_url, async_remove_panel
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .api import MeteoSwissClient, MeteoSwissError, distance_km
from .const import (
    CONF_POLLEN_STATION,
    CONF_SIDEBAR_PANEL,
    DEFAULT_SIDEBAR_PANEL,
    DOMAIN,
    FRONTEND_URL,
    ICONS_URL,
    PANEL_URL_PATH,
    VERSION,
)
from .coordinator import (
    CurrentCoordinator,
    ForecastCoordinator,
    MeteoSwissConfigEntry,
    MeteoSwissData,
    HazardCoordinator,
    PollenCoordinator,
)
from .hazards import HazardClient
from .overview import async_register_views

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.WEATHER]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve pictograms and the map, and load the dashboard cards."""
    root = Path(__file__).parent
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(ICONS_URL, str(root / "icons"), cache_headers=True),
            StaticPathConfig(FRONTEND_URL, str(root / "frontend"), cache_headers=False),
        ]
    )
    async_register_views(hass)

    # Cards: load the module on every dashboard.
    add_extra_js_url(hass, MODULE_URL)
    return True


MODULE_URL = f"{FRONTEND_URL}/meteoswiss-map.js?v={VERSION}"


async def _async_update_panel(hass: HomeAssistant, entries: list[MeteoSwissConfigEntry]) -> None:
    """Show the map page in the sidebar if one of the entries asks for it."""
    wanted = any(e.options.get(CONF_SIDEBAR_PANEL, DEFAULT_SIDEBAR_PANEL) for e in entries)
    shown = PANEL_URL_PATH in hass.data.get(DATA_PANELS, {})
    if wanted and not shown:
        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name="meteoswiss-panel",
            sidebar_title="MeteoSwiss",
            sidebar_icon="mdi:weather-partly-snowy-rainy",
            module_url=MODULE_URL,
            embed_iframe=False,
            require_admin=False,
        )
    elif shown and not wanted:
        async_remove_panel(hass, PANEL_URL_PATH)


def _other_loaded_entries(
    hass: HomeAssistant, entry: MeteoSwissConfigEntry
) -> list[MeteoSwissConfigEntry]:
    return [
        e
        for e in hass.config_entries.async_entries(DOMAIN)
        if e.entry_id != entry.entry_id and e.state is ConfigEntryState.LOADED
    ]


async def async_setup_entry(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> bool:
    """Set up MeteoSwiss Complete For HA from a config entry."""
    client = MeteoSwissClient(async_get_clientsession(hass))

    current = CurrentCoordinator(hass, entry, client)
    forecast = ForecastCoordinator(hass, entry, client)
    await current.async_config_entry_first_refresh()
    await forecast.async_config_entry_first_refresh()

    entry.runtime_data = MeteoSwissData(
        client=client,
        current=current,
        forecast=forecast,
        pollen=await _async_setup_pollen(hass, entry, client),
        hazards=await _async_setup_hazards(hass, entry),
    )
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await _async_update_panel(hass, [*_other_loaded_entries(hass, entry), entry])
    return True


async def _async_setup_hazards(
    hass: HomeAssistant, entry: MeteoSwissConfigEntry
) -> HazardCoordinator:
    """Set up avalanche, forest fire and drought warnings (never blocking)."""
    language = (hass.config.language or "en").split("-")[0].lower()
    hazards = HazardCoordinator(
        hass, entry, HazardClient(async_get_clientsession(hass), language)
    )
    await hazards.async_refresh()
    return hazards


async def _async_setup_pollen(
    hass: HomeAssistant, entry: MeteoSwissConfigEntry, client: MeteoSwissClient
) -> PollenCoordinator | None:
    """Set up pollen for the chosen (default: nearest) pollen station.

    Pollen is optional: if its data cannot be loaded, the rest of the
    integration still starts.
    """
    try:
        stations = await client.async_get_pollen_stations()
    except MeteoSwissError as err:
        _LOGGER.warning("Pollen stations unavailable, pollen disabled: %s", err)
        return None
    if not stations:
        return None
    wanted = entry.options.get(CONF_POLLEN_STATION)
    station = next((s for s in stations if s.abbr == wanted), None) or min(
        stations,
        key=lambda s: distance_km(
            hass.config.latitude, hass.config.longitude, s.latitude, s.longitude
        ),
    )
    pollen = PollenCoordinator(hass, entry, client, station)
    # Not first_refresh: a pollen failure must not block the integration.
    await pollen.async_refresh()
    return pollen


async def _async_options_updated(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> None:
    """Reload the entry when its options change."""
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> bool:
    """Unload a config entry."""
    unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unloaded:
        await _async_update_panel(hass, _other_loaded_entries(hass, entry))
    return unloaded
