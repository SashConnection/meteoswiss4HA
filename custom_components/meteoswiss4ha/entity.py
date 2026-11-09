"""Base entity for MeteoSwiss Open Data."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import (
    CoordinatorEntity,
    DataUpdateCoordinator,
)

from .const import ATTRIBUTION, DOMAIN, MANUFACTURER
from .coordinator import MeteoSwissConfigEntry


class MeteoSwissEntity[_CoordinatorT: DataUpdateCoordinator](
    CoordinatorEntity[_CoordinatorT]
):
    """Common attributes for all MeteoSwiss entities."""

    _attr_attribution = ATTRIBUTION
    _attr_has_entity_name = True

    def __init__(self, coordinator: _CoordinatorT, entry: MeteoSwissConfigEntry) -> None:
        """Initialize the entity and attach it to the location device."""
        super().__init__(coordinator)
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=entry.title,
            manufacturer=MANUFACTURER,
            model="Open Data",
            entry_type=DeviceEntryType.SERVICE,
            configuration_url="https://opendatadocs.meteoswiss.ch/",
        )
