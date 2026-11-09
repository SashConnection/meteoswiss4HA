"""Events fired when a warning, hazard or pollen level changes.

Device triggers (device_trigger.py) listen to these events, so automations
can be built from menus: "Rain warning announced", "Wind warning reaches
level 3", "Grass pollen becomes strong", ...
"""

from __future__ import annotations

from typing import Any

EVENT = "meteoswiss4ha_event"

# Event / trigger types.
WARNING_ANNOUNCED = "warning_announced"  # a new upcoming warning
WARNING_STARTED = "warning_started"  # a warning comes into force
WARNING_ENDED = "warning_ended"  # no warning any more
WARNING_LEVEL = "warning_level"  # the warning level reaches "level"
HAZARD_LEVEL = "hazard_level"  # a natural hazard reaches "level"
POLLEN_LEVEL = "pollen_level"  # the pollen level reaches "level"


class LevelEventMixin:
    """Fire events when the level of a sensor changes.

    The sensor provides ``_event_type`` ("warning", "hazard" or "pollen"),
    ``_event_subtype`` (rain, forest_fire, pollen, ...) and implements
    ``_event_level()`` (and ``_event_upcoming()`` for warnings). Call
    ``_check_events()`` before writing a new state. Nothing is fired for the
    first value seen (start-up).
    """

    _event_type: str
    _event_subtype: str
    _prev_level: int | None = None
    _prev_upcoming: int | None = None

    def _event_level(self) -> int | None:
        raise NotImplementedError

    def _event_upcoming(self) -> int:
        return 0

    def _fire(self, kind: str, level: int | None = None, **extra: Any) -> None:
        entry = getattr(self, "registry_entry", None)
        if entry is None or entry.device_id is None:
            return
        data: dict[str, Any] = {
            "device_id": entry.device_id,
            "entity_id": self.entity_id,  # type: ignore[attr-defined]
            "type": kind,
            "subtype": self._event_subtype,
            **extra,
        }
        if level is not None:
            data["level"] = level
        self.hass.bus.async_fire(EVENT, data)  # type: ignore[attr-defined]

    def _check_events(self) -> None:
        level = self._event_level()
        upcoming = self._event_upcoming()
        prev, prev_upcoming = self._prev_level, self._prev_upcoming
        if level is None:
            return
        self._prev_level, self._prev_upcoming = level, upcoming
        if prev is None:
            return  # first value: nothing changed yet
        if self._event_type == "warning":
            if prev_upcoming is not None and upcoming > prev_upcoming:
                self._fire(WARNING_ANNOUNCED)
            if prev <= 1 < level:
                self._fire(WARNING_STARTED, level)
            if prev > 1 >= level:
                self._fire(WARNING_ENDED)
            for n in range(max(prev + 1, 2), level + 1):
                self._fire(WARNING_LEVEL, n)
        elif self._event_type == "hazard":
            for n in range(max(prev + 1, 2), level + 1):
                self._fire(HAZARD_LEVEL, n)
        elif self._event_type == "pollen":
            for n in range(max(prev + 1, 1), level + 1):
                self._fire(POLLEN_LEVEL, n)
