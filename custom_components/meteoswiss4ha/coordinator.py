"""Data update coordinators for MeteoSwiss Open Data."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import CurrentConditions, MeteoSwissClient, MeteoSwissError
from .const import CONF_STATION, CURRENT_UPDATE_INTERVAL, DOMAIN

_LOGGER = logging.getLogger(__name__)


@dataclass
class MeteoSwissData:
    """Runtime data stored on the config entry."""

    client: MeteoSwissClient
    current: CurrentCoordinator


type MeteoSwissConfigEntry = ConfigEntry[MeteoSwissData]


class CurrentCoordinator(DataUpdateCoordinator[CurrentConditions]):
    """Fetch the latest 10-minute measurements of the configured station."""

    config_entry: MeteoSwissConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        entry: MeteoSwissConfigEntry,
        client: MeteoSwissClient,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} current {entry.data[CONF_STATION]}",
            update_interval=CURRENT_UPDATE_INTERVAL,
        )
        self._client = client
        self.station = entry.data[CONF_STATION]

    async def _async_update_data(self) -> CurrentConditions:
        try:
            stations = await self._client.async_get_current()
        except MeteoSwissError as err:
            raise UpdateFailed(f"Error fetching current conditions: {err}") from err
        if self.station not in stations:
            raise UpdateFailed(f"Station {self.station} not found in current data")
        return stations[self.station]
