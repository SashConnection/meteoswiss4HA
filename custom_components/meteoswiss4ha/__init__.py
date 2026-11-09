"""The MeteoSwiss Complete For HA integration."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.typing import ConfigType

from .api import MeteoSwissClient, MeteoSwissError, distance_km
from .const import CONF_POLLEN_STATION, DOMAIN, ICONS_URL
from .coordinator import (
    CurrentCoordinator,
    ForecastCoordinator,
    MeteoSwissConfigEntry,
    MeteoSwissData,
    PollenCoordinator,
)

_LOGGER = logging.getLogger(__name__)

PLATFORMS: list[Platform] = [Platform.SENSOR, Platform.WEATHER]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Serve the pictograms shipped with the integration."""
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                ICONS_URL, str(Path(__file__).parent / "icons"), cache_headers=True
            )
        ]
    )
    return True


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
    )
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


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
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
