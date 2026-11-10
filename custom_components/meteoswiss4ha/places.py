"""Watched places and followed persons: weather warnings for other locations.

Options: postal codes ("places") and persons / device trackers ("persons").
Each one becomes a device with one warning sensor per kind (rain, wind, ...),
updated from the MeteoAlarm feed; a person's sensors follow its position.
"""

from __future__ import annotations

from dataclasses import dataclass
import logging
from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.core import Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import (
    CoordinatorEntity,
    DataUpdateCoordinator,
    UpdateFailed,
)
from homeassistant.util import dt as dt_util

from .api import POINT_TYPE_POSTAL_CODE, MeteoSwissClient, MeteoSwissError
from .const import ATTRIBUTION, DOMAIN, MANUFACTURER, WARNINGS_UPDATE_INTERVAL
from .events import LevelEventMixin
from .hazards import LEVELS, WARNING_KINDS, HazardClient, WeatherWarning, warnings_at

_LOGGER = logging.getLogger(__name__)

# Rough bounding box of Switzerland: outside it there are no MeteoSwiss warnings.
CH_BOX = (45.8, 47.9, 5.9, 10.6)

WARNING_ICONS = {
    "rain": "mdi:weather-pouring",
    "thunderstorm": "mdi:weather-lightning",
    "wind": "mdi:weather-windy",
    "snow": "mdi:weather-snowy-heavy",
    "slippery_roads": "mdi:snowflake-melt",
    "heat": "mdi:thermometer-high",
    "frost": "mdi:snowflake-thermometer",
}


@dataclass(frozen=True, slots=True)
class Place:
    """A watched postal code, or a followed person (entity_id set)."""

    key: str
    name: str
    latitude: float | None = None
    longitude: float | None = None
    entity_id: str | None = None
    # Local forecast point (point_id, point_type_id) of a watched postal code.
    point: tuple[int, int] | None = None


async def async_resolve_places(
    client: MeteoSwissClient, postal_codes: list[str]
) -> list[Place]:
    """Turn postal codes into places (name and coordinates of the forecast point)."""
    if not postal_codes:
        return []
    try:
        points = await client.async_get_points()
    except MeteoSwissError as err:
        _LOGGER.warning("Cannot resolve watched places: %s", err)
        return []
    postal = [p for p in points if p.point_type_id == POINT_TYPE_POSTAL_CODE and p.postal_code]
    places = []
    for text in dict.fromkeys(str(c).strip() for c in postal_codes):
        point = _find_point(postal, text)
        if point is None:
            _LOGGER.warning("No MeteoSwiss forecast point for %s", text)
            continue
        key = point.postal_code or text
        places.append(
            Place(
                f"place_{key}",
                f"{point.name} ({key})",
                point.latitude,
                point.longitude,
                point=(point.point_id, point.point_type_id),
            )
        )
    return places


def _find_point(postal: list, text: str):
    """A postal code (exact, else the nearest number nearby) or a place name."""
    if text.isdigit():
        exact = next((p for p in postal if p.postal_code == text), None)
        if exact is not None:
            return exact
        # E.g. 3000 Bern has no forecast point, but 3001, 3004, ... have.
        near = [p for p in postal if p.postal_code.isdigit() and p.postal_code[:2] == text[:2]]
        return min(near, key=lambda p: abs(int(p.postal_code) - int(text)), default=None)
    name = text.casefold()
    return next((p for p in postal if p.name.casefold() == name), None) or next(
        (p for p in postal if p.name.casefold().startswith(name)), None
    )


class WarningsCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """MeteoSwiss weather warnings (MeteoAlarm) for the watched places."""

    def __init__(self, hass: HomeAssistant, entry, client: HazardClient) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} place warnings",
            update_interval=WARNINGS_UPDATE_INTERVAL,
        )
        self._client = client

    async def _async_update_data(self) -> dict[str, Any]:
        try:
            return await self._client.async_get_weather_warnings(dt_util.utcnow())
        except MeteoSwissError as err:
            raise UpdateFailed(f"Weather warnings unavailable: {err}") from err


class PlaceWarningSensor(LevelEventMixin, CoordinatorEntity[WarningsCoordinator], SensorEntity):
    """Weather warning of one kind at a watched place or where a person is."""

    _attr_attribution = ATTRIBUTION
    _attr_has_entity_name = True
    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = list(LEVELS)
    _event_type = "warning"

    def __init__(self, coordinator: WarningsCoordinator, entry, place: Place, kind: str) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self._place = place
        self._kind = kind
        self._event_subtype = kind
        self._attr_translation_key = f"{kind}_warning"
        self._attr_unique_id = f"{entry.entry_id}_{place.key}_{kind}_warning"
        self._attr_icon = WARNING_ICONS[kind]
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{entry.entry_id}_{place.key}")},
            name=f"MeteoSwiss {place.name}",
            manufacturer=MANUFACTURER,
            model="Person" if place.entity_id else "Watched place",
            entry_type=DeviceEntryType.SERVICE,
            via_device=(DOMAIN, entry.entry_id),
        )

    def _position(self) -> tuple[float, float] | None:
        if self._place.entity_id is None:
            return self._place.latitude, self._place.longitude
        state = self.hass.states.get(self._place.entity_id)
        if state is None:
            return None
        lat, lon = state.attributes.get("latitude"), state.attributes.get("longitude")
        if lat is None or lon is None:
            return None
        return float(lat), float(lon)

    def _item(self) -> WeatherWarning | None:
        position = self._position()
        if self.coordinator.data is None or position is None:
            return None
        lat, lon = position
        if not (CH_BOX[0] <= lat <= CH_BOX[1] and CH_BOX[2] <= lon <= CH_BOX[3]):
            return None  # outside Switzerland: no MeteoSwiss warnings
        return warnings_at(self.coordinator.data, lat, lon, dt_util.utcnow())[self._kind]

    def _event_level(self) -> int | None:
        item = self._item()
        return item.level if item is not None else None

    def _event_upcoming(self) -> int:
        item = self._item()
        return len(item.upcoming) if item is not None else 0

    @property
    def native_value(self) -> str | None:
        """Return the level of the warning in force ("low": none)."""
        item = self._item()
        return item.state if item is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the warning text, validity and upcoming warnings."""
        item = self._item()
        attrs: dict[str, Any] = {"place": self._place.name}
        if self._place.entity_id:
            attrs["followed_entity"] = self._place.entity_id
            if item is None and self._position() is not None:
                attrs["outside_switzerland"] = True
        if item is not None:
            attrs.update(
                level=item.level,
                event=item.event,
                region=item.region,
                description=item.description,
                instruction=item.instruction,
                onset=item.onset,
                expires=item.expires,
                upcoming=item.upcoming,
            )
        return attrs

    async def async_added_to_hass(self) -> None:
        """Follow the person's position."""
        await super().async_added_to_hass()
        self._check_events()
        if self._place.entity_id:
            self.async_on_remove(
                async_track_state_change_event(
                    self.hass, [self._place.entity_id], self._person_moved
                )
            )

    @callback
    def _person_moved(self, event: Event[EventStateChangedData]) -> None:
        self._check_events()
        self.async_write_ha_state()

    @callback
    def _handle_coordinator_update(self) -> None:
        self._check_events()
        super()._handle_coordinator_update()


def place_sensors(coordinator: WarningsCoordinator, entry, places: list[Place]) -> list[SensorEntity]:
    """Every warning sensor of every watched place and followed person."""
    return [PlaceWarningSensor(coordinator, entry, place, kind) for place in places for kind in WARNING_KINDS]
