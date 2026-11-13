"""Sun, moon and ephemeris, computed locally (same formulas as frontend/meteoswiss-astro.js).

Moon: low-precision formulas from J. Meeus, Astronomical Algorithms (phase angle,
illuminated fraction, next new / full moon). Sun: NOAA sunrise equation.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
import json
import math
from pathlib import Path

RAD = math.pi / 180
PHASE_KEYS = (
    "new_moon",
    "waxing_crescent",
    "first_quarter",
    "waxing_gibbous",
    "full_moon",
    "waning_gibbous",
    "last_quarter",
    "waning_crescent",
)
SAINTS_FILE = Path(__file__).parent / "frontend" / "saints.json"


def _norm(x: float) -> float:
    return x % 360


def _jd(when: datetime) -> float:
    return when.timestamp() / 86400 + 2440587.5


def _phase_angle(j: float) -> tuple[float, bool]:
    t = (j - 2451545) / 36525
    d = _norm(297.8501921 + 445267.1114034 * t)
    m = _norm(357.5291092 + 35999.0502909 * t)
    mp = _norm(134.9633964 + 477198.8675055 * t)
    i = (
        180
        - d
        - 6.289 * math.sin(mp * RAD)
        + 2.1 * math.sin(m * RAD)
        - 1.274 * math.sin((2 * d - mp) * RAD)
        - 0.658 * math.sin(2 * d * RAD)
        - 0.214 * math.sin(2 * mp * RAD)
        - 0.11 * math.sin(d * RAD)
    )
    return _norm(i), d < 180


def illumination(when: datetime) -> tuple[float, bool]:
    """Illuminated fraction of the Moon (0-1) and whether it is waxing."""
    i, waxing = _phase_angle(_jd(when))
    return (1 + math.cos(i * RAD)) / 2, waxing


def phase_index(k: float, waxing: bool) -> int:
    """Index in PHASE_KEYS for an illuminated fraction."""
    if k < 0.03:
        return 0
    if k > 0.97:
        return 4
    if abs(k - 0.5) < 0.06:
        return 2 if waxing else 6
    if k < 0.5:
        return 1 if waxing else 7
    return 3 if waxing else 5


def next_phase(when: datetime, full: bool) -> datetime:
    """Next full (or new) moon, to the hour."""
    best: tuple[float, int] | None = None
    for hour in range(1, 31 * 24 + 1):
        k, _ = illumination(when + timedelta(hours=hour))
        score = k if full else 1 - k
        if best is not None and score < best[0] and best[0] > 0.995:
            break
        if best is None or score > best[0]:
            best = (score, hour)
    assert best is not None
    return (when + timedelta(hours=best[1])).replace(minute=0, second=0, microsecond=0)


def sun_times(day: date, lat: float, lon: float) -> tuple[datetime, datetime] | None:
    """Sunrise and sunset (UTC) of a day; None during polar day or night."""
    noon = datetime(day.year, day.month, day.day, 12, tzinfo=UTC)
    n = round(_jd(noon) - lon / 360 - 2451545.0009)
    js = 2451545.0009 + n - lon / 360
    m = _norm(357.5291 + 0.98560028 * (js - 2451545))
    c = 1.9148 * math.sin(m * RAD) + 0.02 * math.sin(2 * m * RAD) + 0.0003 * math.sin(3 * m * RAD)
    lam = _norm(m + c + 180 + 102.9372)
    jt = js + 0.0053 * math.sin(m * RAD) - 0.0069 * math.sin(2 * lam * RAD)
    dec = math.asin(math.sin(lam * RAD) * math.sin(23.44 * RAD))
    cosw = (math.sin(-0.833 * RAD) - math.sin(lat * RAD) * math.sin(dec)) / (
        math.cos(lat * RAD) * math.cos(dec)
    )
    if not -1 <= cosw <= 1:
        return None
    w = math.acos(cosw) / RAD / 360

    def to_dt(x: float) -> datetime:
        return datetime.fromtimestamp((x - 2440587.5) * 86400, UTC)

    return to_dt(jt - w), to_dt(jt + w)


def day_length(day: date, lat: float, lon: float) -> float | None:
    """Day length in minutes."""
    times = sun_times(day, lat, lon)
    if times is None:
        return None
    return (times[1] - times[0]).total_seconds() / 60


_saints: dict[str, list[str]] | None = None


def saint_of(day: date, language: str) -> str | None:
    """Saint or feast of a day in a language (de, fr, it, rm, en)."""
    global _saints  # noqa: PLW0603 - small read-only cache
    if _saints is None:
        try:
            _saints = json.loads(SAINTS_FILE.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            _saints = {}
    names = _saints.get(language) or _saints.get("en") or []
    days = (31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)
    index = sum(days[: day.month - 1]) + day.day - 1
    return names[index] if index < len(names) else None
