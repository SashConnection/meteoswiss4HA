"""Everyday indicators computed from the forecast and the measurements.

Pure functions (no Home Assistant import): solar production, laundry drying,
frost, watering, stargazing, sunset, rainbow, foehn, bise, airing, swimming,
summary of the day and ambiance color.

``hours`` are dicts with "time" (UTC datetime, end of the hour) and the hourly
parameters: temperature, precipitation, precipitation_probability, wind_speed,
wind_gust, sunshine (min), radiation (W/m²), cloud_low/mid/high (0-100),
symbol.
"""

from __future__ import annotations

from datetime import datetime, timedelta
import math
from typing import Any

RAD = math.pi / 180

# --------------------------------------------------------------------- sun


def sun_position(when: datetime, lat: float, lon: float) -> tuple[float, float]:
    """Sun elevation and azimuth (degrees, azimuth 0 = north, 180 = south)."""
    day = when.timetuple().tm_yday
    hours = when.hour + when.minute / 60
    gamma = 2 * math.pi / 365 * (day - 1 + (hours - 12) / 24)
    decl = (0.006918 - 0.399912 * math.cos(gamma) + 0.070257 * math.sin(gamma)
            - 0.006758 * math.cos(2 * gamma) + 0.000907 * math.sin(2 * gamma)
            - 0.002697 * math.cos(3 * gamma) + 0.00148 * math.sin(3 * gamma))
    eqtime = 229.18 * (0.000075 + 0.001868 * math.cos(gamma) - 0.032077 * math.sin(gamma)
                       - 0.014615 * math.cos(2 * gamma) - 0.040849 * math.sin(2 * gamma))
    tst = hours * 60 + eqtime + 4 * lon
    ha = (tst / 4 - 180) * RAD
    la = lat * RAD
    cos_z = math.sin(la) * math.sin(decl) + math.cos(la) * math.cos(decl) * math.cos(ha)
    zen = math.acos(max(-1.0, min(1.0, cos_z)))
    az = math.atan2(math.sin(ha), math.cos(ha) * math.sin(la) - math.tan(decl) * math.cos(la))
    return 90 - zen / RAD, (az / RAD + 180) % 360


# ------------------------------------------------------------------- solar


def solar_estimate(
    hours: list[dict[str, Any]],
    lat: float,
    lon: float,
    kwp: float,
    tilt: float = 30,
    azimuth: float = 180,
    performance: float = 0.85,
) -> list[tuple[datetime, float]]:
    """Estimated PV energy (kWh) for each forecast hour.

    Global horizontal radiation is split into direct and diffuse (Erbs) and
    projected on the panel plane (isotropic sky, 20 % ground reflection).
    """
    result = []
    for h in hours:
        ghi = h.get("radiation")
        if ghi is None:
            continue
        mid = h["time"] - timedelta(minutes=30)
        elev, az = sun_position(mid, lat, lon)
        if elev <= 0 or ghi <= 0:
            result.append((h["time"], 0.0))
            continue
        cos_z = math.sin(elev * RAD)
        extra = 1361 * (1 + 0.033 * math.cos(2 * math.pi * mid.timetuple().tm_yday / 365))
        kt = min(1.0, ghi / max(1.0, extra * cos_z))
        if kt <= 0.22:
            fd = 1 - 0.09 * kt
        elif kt <= 0.8:
            fd = 0.9511 - 0.1604 * kt + 4.388 * kt**2 - 16.638 * kt**3 + 12.336 * kt**4
        else:
            fd = 0.165
        dhi = ghi * fd
        dni_h = ghi - dhi  # direct part on the horizontal
        b, g = tilt * RAD, azimuth * RAD
        cos_i = (math.sin(elev * RAD) * math.cos(b)
                 + math.cos(elev * RAD) * math.sin(b) * math.cos(az * RAD - g))
        beam = dni_h * max(0.0, cos_i) / max(0.087, cos_z)  # limit near the horizon
        poa = beam + dhi * (1 + math.cos(b)) / 2 + ghi * 0.2 * (1 - math.cos(b)) / 2
        result.append((h["time"], kwp * poa / 1000 * performance))
    return result


# ------------------------------------------------------------------ drying


def drying_score(h: dict[str, Any]) -> int:
    """0-100: how well laundry dries outside during this hour."""
    if (h.get("precipitation") or 0) >= 0.1 or (h.get("precipitation_probability") or 0) >= 40:
        return 0
    temp = h.get("temperature")
    if temp is None:
        return 0
    sun = min(1.0, (h.get("sunshine") or 0) / 60)
    wind = min(1.0, (h.get("wind_speed") or 0) / 15)
    warm = max(0.0, min(1.0, (temp - 3) / 20))
    return round(100 * (0.35 * sun + 0.25 * wind + 0.4 * warm))


def best_window(hours: list[dict[str, Any]], score, length: int = 3) -> tuple[int, datetime, datetime] | None:
    """Best consecutive window (mean score, start, end)."""
    best = None
    for i in range(len(hours) - length + 1):
        part = hours[i : i + length]
        mean = sum(score(h) for h in part) / length
        if best is None or mean > best[0]:
            best = (mean, part[0]["time"] - timedelta(hours=1), part[-1]["time"])
    return (round(best[0]), best[1], best[2]) if best else None


def drying(hours_today: list[dict[str, Any]]) -> dict[str, Any]:
    """Laundry drying today: state good / fair / poor and the best window."""
    day = [h for h in hours_today if (h.get("sunshine") is not None or h.get("radiation"))]
    window = best_window(day, drying_score)
    if window is None:
        return {"state": None}
    state = "good" if window[0] >= 55 else "fair" if window[0] >= 30 else "poor"
    return {"state": state, "score": window[0], "start": window[1].isoformat(), "end": window[2].isoformat()}


# ------------------------------------------------------------------- frost


def frost(night: list[dict[str, Any]]) -> dict[str, Any]:
    """Frost tonight for plants and windscreens: none / possible / likely."""
    temps = [h["temperature"] for h in night if h.get("temperature") is not None]
    if not temps:
        return {"state": None}
    tmin = min(temps)
    clouds = [max(h.get("cloud_low") or 0, h.get("cloud_mid") or 0) for h in night]
    clear = (sum(clouds) / len(clouds) if clouds else 100) < 50
    wind = max((h.get("wind_speed") or 0) for h in night)
    # Clear calm nights: the ground is 2-4 °C colder than the air at 2 m.
    ground = tmin - (3 if clear and wind < 10 else 1)
    state = "likely" if ground <= -1 else "possible" if ground <= 1 else "none"
    return {"state": state, "min_temperature": round(tmin, 1), "ground_estimate": round(ground, 1), "clear_sky": clear}


# ---------------------------------------------------------------- watering


def watering(rain_past: list[float | None], evaporation_past: list[float | None],
             rain_next: float | None, tmax_next: float | None) -> dict[str, Any]:
    """Garden watering from the water balance of the last 5 days and the next 2."""
    rain = sum(r or 0 for r in rain_past)
    et0 = sum(e or 0 for e in evaporation_past)
    if not evaporation_past or all(e is None for e in evaporation_past):
        et0 = 2.0 * len(rain_past)  # typical value when the station has no ET0
    balance = rain - et0 + (rain_next or 0)
    if balance >= 5 or (rain_next or 0) >= 8:
        state = "not_needed"
    elif balance <= -8 and (tmax_next or 0) >= 15:
        state = "recommended"
    else:
        state = "optional"
    return {"state": state, "rain_5_days": round(rain, 1), "evaporation_5_days": round(et0, 1),
            "rain_next_2_days": round(rain_next or 0, 1), "water_balance": round(balance, 1)}


# -------------------------------------------------------------- stargazing


def stargazing(night: list[dict[str, Any]], moon_illumination: float) -> dict[str, Any]:
    """Clear night for stars: excellent / good / poor, with the best hours."""
    if not night:
        return {"state": None}
    def score(h):
        cloud = max(h.get("cloud_low") or 0, h.get("cloud_mid") or 0, h.get("cloud_high") or 0)
        return 100 - cloud - (20 if (h.get("precipitation") or 0) > 0 else 0)
    window = best_window(night, score, 2) or (0, night[0]["time"], night[-1]["time"])
    sky = window[0] - moon_illumination * 30
    state = "excellent" if sky >= 70 else "good" if sky >= 45 else "poor"
    return {"state": state, "score": round(max(0, sky)), "moon_illumination": round(moon_illumination * 100),
            "start": window[1].isoformat(), "end": window[2].isoformat()}


# ------------------------------------------------------------------ sunset


def sunset_quality(hour: dict[str, Any] | None) -> str | None:
    """A colorful sunset: some high/mid clouds to light up, few low clouds, dry."""
    if hour is None:
        return None
    low, mid, high = (hour.get(k) or 0 for k in ("cloud_low", "cloud_mid", "cloud_high"))
    if (hour.get("precipitation") or 0) >= 0.2 or low >= 60:
        return "no"
    upper = max(mid, high)
    if 20 <= upper <= 75 and low <= 35:
        return "beautiful"
    return "maybe" if upper >= 10 and low <= 50 else "no"


# ----------------------------------------------------------------- rainbow


def rainbow(sun_elevation: float, sunshine_now: float | None, rain_soon: bool) -> bool:
    """Rainbow possible: low sun (under 42°), sunshine here and showers around."""
    return 3 <= sun_elevation <= 42 and (sunshine_now or 0) >= 2 and rain_soon


# ------------------------------------------------------------ foehn / bise


def foehn(current: dict[str, dict[str, float | None]]) -> dict[str, Any]:
    """South foehn: pressure higher in the south (Lugano) than in the north (Zurich).

    Confirmed "in force" when Altdorf has dry air and gusts.
    """
    lug = (current.get("LUG") or {}).get("pp0qffs0")
    klo = (current.get("KLO") or {}).get("pp0qffs0")
    if lug is None or klo is None:
        return {"state": None}
    diff = lug - klo
    alt = current.get("ALT") or {}
    dry = (alt.get("ure200s0") or 100) < 60
    gusty = (alt.get("fu3010z1") or 0) >= 40
    if diff >= 4 and dry and gusty:
        state = "in_force"
    elif diff >= 4:
        state = "likely"
    elif diff <= -4:
        state = "north_foehn"
    else:
        state = "none"
    return {"state": state, "pressure_difference": round(diff, 1),
            "altdorf_humidity": alt.get("ure200s0"), "altdorf_gust": alt.get("fu3010z1")}


def bise(current: dict[str, dict[str, float | None]]) -> dict[str, Any]:
    """Bise: cold north-east wind on the Plateau, pressure higher in the north-east."""
    klo = (current.get("KLO") or {}).get("pp0qffs0")
    gve = current.get("GVE") or {}
    if klo is None or gve.get("pp0qffs0") is None:
        return {"state": None}
    diff = klo - gve["pp0qffs0"]
    bearing = gve.get("dkl010z0")
    gust = gve.get("fu3010z1") or 0
    north_east = bearing is not None and (bearing >= 330 or bearing <= 90)
    if diff >= 2 and north_east and gust >= 50:
        state = "strong"
    elif diff >= 1 and north_east and gust >= 25:
        state = "moderate"
    else:
        state = "none"
    return {"state": state, "pressure_difference": round(diff, 1), "geneva_gust": gust, "geneva_bearing": bearing}


# ------------------------------------------------------------------ airing


def absolute_humidity(temp: float, rel: float) -> float:
    """Water vapour content of the air (g/m³)."""
    svp = 6.112 * math.exp(17.62 * temp / (243.12 + temp))
    return 216.7 * (rel / 100 * svp) / (273.15 + temp)


def airing(t_in: float | None, rh_in: float | None, t_out: float | None, rh_out: float | None) -> dict[str, Any]:
    """Open the windows? Recommended when the outside air is drier (and not too hot)."""
    if None in (t_in, rh_in, t_out, rh_out):
        return {"state": None}
    ah_in, ah_out = absolute_humidity(t_in, rh_in), absolute_humidity(t_out, rh_out)
    diff = ah_in - ah_out
    if t_out > t_in + 2 and t_in >= 22:
        state = "not_recommended"  # would heat the house
    elif diff >= 1 and rh_in >= 50:
        state = "recommended"
    elif diff < -0.5:
        state = "not_recommended"
    else:
        state = "neutral"
    return {"state": state, "absolute_humidity_inside": round(ah_in, 1),
            "absolute_humidity_outside": round(ah_out, 1), "difference": round(diff, 1)}


# ---------------------------------------------------------------- swimming


def swimming(water: float | None, air: float | None, sunshine_hours: float | None, wind: float | None) -> str | None:
    """Swimming: ideal / pleasant / fresh / cold."""
    if water is None:
        return None
    if water >= 22 and (air or 0) >= 22 and (wind or 0) < 25:
        return "ideal"
    if water >= 19 and (air or 0) >= 18:
        return "pleasant"
    if water >= 15:
        return "fresh"
    return "cold"


# ----------------------------------------------------------- ambiance color


def ambiance_color(symbol: int | None, sun_elevation: float) -> tuple[int, int, int]:
    """A color for a smart light, from the weather and the time of day."""
    code = (symbol or 0) % 100
    if sun_elevation < -6:
        base = (40, 50, 120)  # night blue
    elif sun_elevation < 6:
        base = (255, 140, 70)  # sunrise / sunset
    elif code in (1, 2):
        base = (255, 214, 102)  # sunny
    elif code in (27, 28):
        base = (200, 205, 210)  # fog / stratus
    elif code in (3, 4, 5, 26, 35):
        base = (170, 190, 215)  # clouds
    elif code in (8, 11, 16, 19, 22, 30, 34, 37, 39, 42):
        base = (225, 240, 255)  # snow
    elif code in (12, 13, 23, 24, 25, 36, 38, 40, 41):
        base = (140, 90, 200)  # thunderstorm
    else:
        base = (80, 140, 230)  # rain
    return base


# ----------------------------------------------------------------- summary

PARTS = {
    "fr": ("Matinée", "Après-midi", "Soirée"), "de": ("Morgen", "Nachmittag", "Abend"),
    "it": ("Mattina", "Pomeriggio", "Sera"), "rm": ("Damaun", "Suentermezdi", "Saira"),
    "en": ("Morning", "Afternoon", "Evening"),
}
# Adjectives: (feminine, masculine); the parts of the day are f, m, f in fr / it / rm.
GENDER = {"fr": (0, 1, 0), "it": (0, 1, 0), "rm": (0, 1, 0)}
WORDS = {
    "fr": {"sun": ("ensoleillée", "ensoleillé"), "cloudy": ("nuageuse", "nuageux"), "grey": ("grise", "gris"),
           "rain": ("pluvieuse", "pluvieux"), "snow": ("neigeuse", "neigeux"), "storm": ("orageuse", "orageux"),
           "rain_from": "pluie dès {h} h", "dry": "sec", "temps": "{lo} à {hi} °C"},
    "de": {"sun": "sonnig", "cloudy": "bewölkt", "grey": "grau", "rain": "regnerisch", "snow": "Schnee", "storm": "gewittrig",
           "rain_from": "Regen ab {h} Uhr", "dry": "trocken", "temps": "{lo} bis {hi} °C"},
    "it": {"sun": ("soleggiata", "soleggiato"), "cloudy": ("nuvolosa", "nuvoloso"), "grey": ("grigia", "grigio"),
           "rain": ("piovosa", "piovoso"), "snow": ("nevosa", "nevoso"), "storm": ("temporalesca", "temporalesco"),
           "rain_from": "pioggia dalle {h}", "dry": "asciutto", "temps": "da {lo} a {hi} °C"},
    "rm": {"sun": ("sulegliva", "sulegliv"), "cloudy": ("nivlusa", "nivlus"), "grey": ("grischa", "grisch"),
           "rain": ("plievgiusa", "plievgius"), "snow": ("cun naiv", "cun naiv"), "storm": ("cun urizi", "cun urizi"),
           "rain_from": "plievgia a partir da las {h}", "dry": "sitg", "temps": "{lo} fin {hi} °C"},
    "en": {"sun": "sunny", "cloudy": "cloudy", "grey": "grey", "rain": "rainy", "snow": "snowy", "storm": "stormy",
           "rain_from": "rain from {h}:00", "dry": "dry", "temps": "{lo} to {hi} °C"},
}


def _kind(symbols: list[int]) -> str:
    codes = [s % 100 for s in symbols if s is not None]
    if not codes:
        return "cloudy"
    if any(c in (12, 13, 23, 24, 25, 36, 38, 40, 41) for c in codes):
        return "storm"
    if sum(c in (8, 11, 16, 19, 22, 30, 34, 37, 39, 42) for c in codes) * 2 >= len(codes):
        return "snow"
    if sum(c not in (1, 2, 3, 4, 5, 26, 27, 28, 35) for c in codes) * 2 >= len(codes):
        return "rain"
    if sum(c in (27, 28) for c in codes) * 2 >= len(codes):
        return "grey"
    if sum(c in (1, 2, 26) for c in codes) * 2 >= len(codes):
        return "sun"
    return "cloudy"


def summary(hours_today: list[dict[str, Any]], language: str, tz) -> str | None:
    """One sentence for today: "Matinée grise, après-midi ensoleillée, soirée pluvieuse · pluie dès 18 h · 3 à 9 °C"."""
    lang = language if language in WORDS else "en"
    w, names = WORDS[lang], PARTS[lang]
    local = [(h["time"].astimezone(tz), h) for h in hours_today]
    if not local:
        return None
    chunks = []
    for index, (name, (a, b)) in enumerate(zip(names, ((6, 12), (12, 18), (18, 24)), strict=True)):
        part = [h for t, h in local if a < t.hour <= b or (b == 24 and t.hour == 0)]
        if part:
            word = w[_kind([h.get("symbol") for h in part])]
            if isinstance(word, tuple):
                word = word[GENDER[lang][index]]
            chunks.append(f"{name} {word}")
    if not chunks:
        return None
    sentence = ", ".join([chunks[0]] + [c[0].lower() + c[1:] if lang in ("fr", "it", "rm", "en") else c for c in chunks[1:]])
    wet = next((t for t, h in local if (h.get("precipitation") or 0) >= 0.3 or (h.get("precipitation_probability") or 0) >= 60), None)
    extra = [w["rain_from"].format(h=(wet - timedelta(hours=1)).hour)] if wet else [w["dry"]]
    temps = [h["temperature"] for _, h in local if h.get("temperature") is not None]
    if temps:
        lo, hi = round(min(temps)), round(max(temps))
        extra.append(w["temps"].format(lo=lo, hi=hi) if lo != hi else f"{lo} °C")
    return " · ".join([sentence, *extra])[:250]
