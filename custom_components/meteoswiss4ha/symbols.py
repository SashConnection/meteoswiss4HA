"""MeteoSwiss weather symbol codes and their Home Assistant conditions.

MeteoSwiss uses codes 1-42 for day and 101-142 for night (night = day + 100).
"""

from __future__ import annotations

from homeassistant.components.weather import (
    ATTR_CONDITION_CLEAR_NIGHT,
    ATTR_CONDITION_CLOUDY,
    ATTR_CONDITION_FOG,
    ATTR_CONDITION_LIGHTNING_RAINY,
    ATTR_CONDITION_PARTLYCLOUDY,
    ATTR_CONDITION_POURING,
    ATTR_CONDITION_RAINY,
    ATTR_CONDITION_SNOWY,
    ATTR_CONDITION_SNOWY_RAINY,
    ATTR_CONDITION_SUNNY,
)

NIGHT_OFFSET = 100

_CONDITIONS: dict[str, tuple[int, ...]] = {
    ATTR_CONDITION_SUNNY: (1,),
    ATTR_CONDITION_PARTLYCLOUDY: (2, 3, 4, 26),
    ATTR_CONDITION_CLOUDY: (5, 27, 35),
    ATTR_CONDITION_FOG: (28,),
    ATTR_CONDITION_RAINY: (6, 9, 14, 17, 29, 32, 33),
    ATTR_CONDITION_POURING: (20,),
    # 37, 39, 42 are thundery snow showers: HA has no such condition, snow
    # is the more relevant information.
    ATTR_CONDITION_SNOWY: (8, 11, 16, 19, 22, 30, 34, 37, 39, 42),
    ATTR_CONDITION_SNOWY_RAINY: (7, 10, 15, 18, 21, 31),
    ATTR_CONDITION_LIGHTNING_RAINY: (12, 13, 23, 24, 25, 36, 38, 40, 41),
}

SYMBOL_TO_CONDITION: dict[int, str] = {
    code: condition for condition, codes in _CONDITIONS.items() for code in codes
}


def day_code(code: int) -> int:
    """Return the day variant (1-42) of a symbol code."""
    return code - NIGHT_OFFSET if code > NIGHT_OFFSET else code


def is_night_code(code: int) -> bool:
    """Return True for a night symbol code (101-142)."""
    return code > NIGHT_OFFSET


def symbol_to_condition(code: int | float | None, night: bool | None = None) -> str | None:
    """Map a MeteoSwiss symbol code to a Home Assistant weather condition.

    ``night`` overrides the day/night information carried by the code, e.g.
    when a daily (daytime) symbol is shown after sunset.
    """
    if code is None:
        return None
    code = int(code)
    if night is None:
        night = is_night_code(code)
    condition = SYMBOL_TO_CONDITION.get(day_code(code))
    if condition == ATTR_CONDITION_SUNNY and night:
        return ATTR_CONDITION_CLEAR_NIGHT
    return condition
