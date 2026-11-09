"""The MeteoSwiss Open Data integration."""

from __future__ import annotations

from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .api import MeteoSwissClient
from .coordinator import CurrentCoordinator, MeteoSwissConfigEntry, MeteoSwissData

PLATFORMS: list[Platform] = [Platform.SENSOR]


async def async_setup_entry(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> bool:
    """Set up MeteoSwiss Open Data from a config entry."""
    client = MeteoSwissClient(async_get_clientsession(hass))

    current = CurrentCoordinator(hass, entry, client)
    await current.async_config_entry_first_refresh()

    entry.runtime_data = MeteoSwissData(client=client, current=current)
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: MeteoSwissConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
