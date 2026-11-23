"""A weather calendar: warnings, full and new moons, hot days, frost and heavy rain ahead."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import astro
from .const import DAILY_PRECIPITATION, DAILY_TEMP_MAX, DAILY_TEMP_MIN
from .coordinator import MeteoSwissConfigEntry
from .entity import MeteoSwissEntity

L = {
    "de": {"full": "Vollmond", "new": "Neumond", "hot": "Hitzetag {t} °C", "frost": "Frost {t} °C", "rain": "Starker Regen {r} mm",
           "warning": "Warnung {kind} (Stufe {level})",
           "kinds": {"rain": "Regen", "thunderstorm": "Gewitter", "wind": "Wind", "snow": "Schnee", "slippery_roads": "Glätte", "heat": "Hitze", "frost": "Frost"}},
    "fr": {"full": "Pleine lune", "new": "Nouvelle lune", "hot": "Journée chaude {t} °C", "frost": "Gel {t} °C", "rain": "Fortes pluies {r} mm",
           "warning": "Avertissement {kind} (degré {level})",
           "kinds": {"rain": "pluie", "thunderstorm": "orages", "wind": "vent", "snow": "neige", "slippery_roads": "routes glissantes", "heat": "canicule", "frost": "gel"}},
    "it": {"full": "Luna piena", "new": "Luna nuova", "hot": "Giornata calda {t} °C", "frost": "Gelo {t} °C", "rain": "Forti piogge {r} mm",
           "warning": "Allerta {kind} (grado {level})",
           "kinds": {"rain": "pioggia", "thunderstorm": "temporali", "wind": "vento", "snow": "neve", "slippery_roads": "strade sdrucciolevoli", "heat": "canicola", "frost": "gelo"}},
    "rm": {"full": "Glina plaina", "new": "Glina nova", "hot": "Di chaud {t} °C", "frost": "Gelischun {t} °C", "rain": "Ferma plievgia {r} mm",
           "warning": "Avertiment {kind} (grad {level})",
           "kinds": {"rain": "plievgia", "thunderstorm": "urizis", "wind": "vent", "snow": "naiv", "slippery_roads": "vias sglischusas", "heat": "chalira", "frost": "gelischun"}},
    "en": {"full": "Full moon", "new": "New moon", "hot": "Hot day {t} °C", "frost": "Frost {t} °C", "rain": "Heavy rain {r} mm",
           "warning": "{kind} warning (level {level})",
           "kinds": {"rain": "Rain", "thunderstorm": "Thunderstorm", "wind": "Wind", "snow": "Snow", "slippery_roads": "Slippery roads", "heat": "Heat", "frost": "Frost"}},
}
MOON_DAYS = 90


async def async_setup_entry(
    hass: HomeAssistant,
    entry: MeteoSwissConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the weather calendar."""
    async_add_entities([WeatherCalendar(entry.runtime_data.forecast, entry)])


def _lang(hass: HomeAssistant) -> str:
    lang = (hass.config.language or "en").split("-")[0].lower()
    return lang if lang in L else "en"


def moon_events(start: datetime, days: int, t: dict[str, Any]) -> list[CalendarEvent]:
    """Full and new moons between start and start + days (all-day events)."""
    out = []
    for full in (True, False):
        when = start - timedelta(days=1)
        while True:
            when = astro.next_phase(when + timedelta(hours=12), full)
            if when > start + timedelta(days=days):
                break
            day = dt_util.as_local(when).date()
            out.append(CalendarEvent(start=day, end=day + timedelta(days=1), summary=f"{'🌕' if full else '🌑'} {t['full' if full else 'new']}",
                                     description=dt_util.as_local(when).strftime("%H:%M")))
    return out


def forecast_events(entry: MeteoSwissConfigEntry, t: dict[str, Any]) -> list[CalendarEvent]:
    """Hot days, frost and heavy rain of the daily forecast."""
    data = entry.runtime_data.forecast.data
    out: list[CalendarEvent] = []
    if data is None:
        return out
    today = dt_util.now().date()
    for step in data.daily:
        day: date = step.time.date()
        if day < today:
            continue
        v = step.values
        tmax, tmin, rain = v.get(DAILY_TEMP_MAX), v.get(DAILY_TEMP_MIN), v.get(DAILY_PRECIPITATION)
        if tmax is not None and tmax >= 30:
            out.append(CalendarEvent(start=day, end=day + timedelta(days=1), summary="🥵 " + t["hot"].format(t=round(tmax))))
        if tmin is not None and tmin <= 0:
            out.append(CalendarEvent(start=day, end=day + timedelta(days=1), summary="❄️ " + t["frost"].format(t=round(tmin))))
        if rain is not None and rain >= 20:
            out.append(CalendarEvent(start=day, end=day + timedelta(days=1), summary="🌧️ " + t["rain"].format(r=round(rain))))
    return out


def warning_events(entry: MeteoSwissConfigEntry, t: dict[str, Any]) -> list[CalendarEvent]:
    """Weather warnings in force and announced at home."""
    hazards = entry.runtime_data.hazards
    items = (hazards.data.weather or {}) if hazards is not None and hazards.data is not None else {}
    out = []
    now = dt_util.utcnow()
    for kind, w in items.items():
        listed = [{"level": w.level, "event": w.event, "onset": w.onset, "expires": w.expires}] if w.level >= 2 else []
        for item in listed + list(w.upcoming):
            start = dt_util.parse_datetime(item.get("onset") or "") or now
            end = dt_util.parse_datetime(item.get("expires") or "") or start + timedelta(hours=12)
            if end <= start:
                end = start + timedelta(hours=1)
            out.append(CalendarEvent(start=start, end=end, summary="⚠️ " + t["warning"].format(kind=t["kinds"].get(kind, kind), level=item.get("level")),
                                     description=item.get("event") or None))
    return out


class WeatherCalendar(MeteoSwissEntity, CalendarEntity):
    """Calendar of weather events for home."""

    _attr_translation_key = "weather_calendar"
    _attr_icon = "mdi:calendar-weather"

    def __init__(self, coordinator, entry: MeteoSwissConfigEntry) -> None:
        """Initialize the calendar."""
        super().__init__(coordinator, entry)
        self._entry = entry
        self._attr_unique_id = f"{entry.entry_id}_calendar"
        self._moons: tuple[date, str, list[CalendarEvent]] | None = None

    def _events(self) -> list[CalendarEvent]:
        t = L[_lang(self.hass)]
        start = dt_util.utcnow()
        lang, today = _lang(self.hass), dt_util.now().date()
        if self._moons is None or self._moons[:2] != (today, lang):
            self._moons = (today, lang, moon_events(start, MOON_DAYS, t))  # computed once a day
        events = warning_events(self._entry, t) + forecast_events(self._entry, t) + self._moons[2]
        return sorted(events, key=lambda e: e.start_datetime_local)

    @property
    def event(self) -> CalendarEvent | None:
        """The current or next event."""
        now = dt_util.now()
        return next((e for e in self._events() if e.end_datetime_local > now), None)

    async def async_get_events(self, hass: HomeAssistant, start_date: datetime, end_date: datetime) -> list[CalendarEvent]:
        """Events between two dates."""
        return [e for e in self._events() if e.end_datetime_local > start_date and e.start_datetime_local < end_date]
