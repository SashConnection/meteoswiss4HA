"""Device triggers: ready-made automation triggers for warnings, hazards and pollen.

Automations → Add trigger → Device → a MeteoSwiss device, then e.g.
"Thunderstorm warning announced" or "Wind warning reaches level 3".
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components.device_automation import DEVICE_TRIGGER_BASE_SCHEMA
from homeassistant.components.homeassistant.triggers import event as event_trigger
from homeassistant.const import CONF_DEVICE_ID, CONF_DOMAIN, CONF_PLATFORM, CONF_TYPE
from homeassistant.core import CALLBACK_TYPE, HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers.trigger import TriggerActionType, TriggerInfo
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN
from .events import (
    EVENT,
    FOG_ENDED,
    FOG_STARTED,
    HAZARD_LEVEL,
    POLLEN_LEVEL,
    WARNING_ANNOUNCED,
    WARNING_ENDED,
    WARNING_LEVEL,
    WARNING_STARTED,
)
from .hazards import WARNING_KINDS

CONF_SUBTYPE = "subtype"
CONF_LEVEL = "level"

HAZARD_KINDS = ("forest_fire", "flood", "drought", "avalanche")
WARNING_TYPES = (WARNING_ANNOUNCED, WARNING_STARTED, WARNING_ENDED, WARNING_LEVEL)
LEVEL_TYPES = {WARNING_LEVEL: (2, 3, 4, 5), HAZARD_LEVEL: (2, 3, 4, 5), POLLEN_LEVEL: (1, 2, 3, 4)}
SUBTYPES = (*WARNING_KINDS, *HAZARD_KINDS, "pollen", "fog")

TRIGGER_SCHEMA = DEVICE_TRIGGER_BASE_SCHEMA.extend(
    {
        vol.Required(CONF_TYPE): vol.In(
            (*WARNING_TYPES, HAZARD_LEVEL, POLLEN_LEVEL, FOG_STARTED, FOG_ENDED)
        ),
        vol.Required(CONF_SUBTYPE): vol.In(SUBTYPES),
        vol.Optional(CONF_LEVEL): vol.All(vol.Coerce(int), vol.Range(min=1, max=5)),
    }
)


def _is_main_device(device: dr.DeviceEntry) -> bool:
    """The location device of a config entry (not a watched place)."""
    return any(
        domain == DOMAIN and ident in device.config_entries for domain, ident in device.identifiers
    )


async def async_get_triggers(hass: HomeAssistant, device_id: str) -> list[dict[str, Any]]:
    """List the triggers of a MeteoSwiss device."""
    device = dr.async_get(hass).async_get(device_id)
    if device is None:
        return []
    base = {CONF_PLATFORM: "device", CONF_DOMAIN: DOMAIN, CONF_DEVICE_ID: device_id}
    triggers = [
        {**base, CONF_TYPE: kind, CONF_SUBTYPE: sub} for sub in WARNING_KINDS for kind in WARNING_TYPES
    ]
    if _is_main_device(device):
        triggers += [{**base, CONF_TYPE: HAZARD_LEVEL, CONF_SUBTYPE: sub} for sub in HAZARD_KINDS]
        triggers.append({**base, CONF_TYPE: POLLEN_LEVEL, CONF_SUBTYPE: "pollen"})
        triggers += [{**base, CONF_TYPE: t, CONF_SUBTYPE: "fog"} for t in (FOG_STARTED, FOG_ENDED)]
    return triggers


async def async_get_trigger_capabilities(
    hass: HomeAssistant, config: ConfigType
) -> dict[str, vol.Schema]:
    """Level choice for the "reaches level" triggers."""
    levels = LEVEL_TYPES.get(config[CONF_TYPE])
    if not levels:
        return {}
    return {"extra_fields": vol.Schema({vol.Required(CONF_LEVEL, default=levels[0]): vol.In(levels)})}


async def async_attach_trigger(
    hass: HomeAssistant,
    config: ConfigType,
    action: TriggerActionType,
    trigger_info: TriggerInfo,
) -> CALLBACK_TYPE:
    """Listen to the matching MeteoSwiss events."""
    event_data = {
        CONF_DEVICE_ID: config[CONF_DEVICE_ID],
        CONF_TYPE: config[CONF_TYPE],
        CONF_SUBTYPE: config[CONF_SUBTYPE],
    }
    if config[CONF_TYPE] in LEVEL_TYPES:
        event_data[CONF_LEVEL] = config.get(CONF_LEVEL, LEVEL_TYPES[config[CONF_TYPE]][0])
    event_config = event_trigger.TRIGGER_SCHEMA(
        {
            event_trigger.CONF_PLATFORM: "event",
            event_trigger.CONF_EVENT_TYPE: EVENT,
            event_trigger.CONF_EVENT_DATA: event_data,
        }
    )
    return await event_trigger.async_attach_trigger(
        hass, event_config, action, trigger_info, platform_type="device"
    )
