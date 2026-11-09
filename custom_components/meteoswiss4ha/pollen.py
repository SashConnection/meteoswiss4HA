"""Pollen species, MeteoSwiss intensity classes and data processing."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta

from .api import PollenMeasurement

# Intensity levels, as used by MeteoSwiss in its pollen information.
LEVELS = ("none", "weak", "moderate", "strong", "very_strong")


@dataclass(frozen=True, slots=True)
class PollenSpecies:
    """One pollen type measured by the SwissPollen network."""

    key: str
    param: str  # hourly mean concentration parameter
    # Upper bounds (grains/m³, daily mean) of weak, moderate and strong.
    thresholds: tuple[float, float, float]
    icon: str


SPECIES: tuple[PollenSpecies, ...] = (
    PollenSpecies("hazel", "kacoryh0", (10, 69, 249), "mdi:tree"),
    PollenSpecies("alder", "kaalnuh0", (10, 69, 249), "mdi:tree"),
    PollenSpecies("birch", "kabetuh0", (10, 69, 299), "mdi:tree"),
    PollenSpecies("ash", "kafraxh0", (10, 69, 299), "mdi:tree"),
    PollenSpecies("beech", "kafaguh0", (10, 69, 299), "mdi:tree"),
    PollenSpecies("oak", "kaquerh0", (10, 69, 299), "mdi:tree"),
    PollenSpecies("grasses", "khpoach0", (19, 49, 149), "mdi:grass"),
)


def level_index(species: PollenSpecies, concentration: float | None) -> int | None:
    """Return the intensity level index (0 none .. 4 very strong)."""
    if concentration is None:
        return None
    if concentration < 1:
        return 0
    for index, bound in enumerate(species.thresholds, start=1):
        if concentration <= bound:
            return index
    return 4


@dataclass(slots=True)
class PollenData:
    """Latest hourly value and 24-hour mean of each species at a station."""

    station: str
    measured_at: datetime | None
    latest: dict[str, float | None]
    mean_24h: dict[str, float | None]

    def level(self, species: PollenSpecies) -> int | None:
        """Level of a species, from its 24-hour mean (MeteoSwiss classes are daily)."""
        return level_index(species, self.mean_24h.get(species.key))

    def overall(self) -> tuple[int | None, str | None]:
        """Highest level among all species and the species causing it."""
        best: tuple[int | None, str | None] = (None, None)
        for species in SPECIES:
            level = self.level(species)
            if level is not None and (best[0] is None or level > best[0]):
                best = (level, species.key if level > 0 else None)
        return best


def summarize(station: str, rows: list[PollenMeasurement], now: datetime) -> PollenData:
    """Build the latest values and 24-hour means from hourly measurements."""
    rows = sorted(rows, key=lambda r: r.time)
    window = [r for r in rows if r.time > now - timedelta(hours=24)]
    latest: dict[str, float | None] = {}
    mean: dict[str, float | None] = {}
    measured_at: datetime | None = None
    for species in SPECIES:
        values = [r.values.get(species.param) for r in window]
        known = [v for v in values if v is not None]
        mean[species.key] = round(sum(known) / len(known), 1) if known else None
        latest[species.key] = None
        for row in reversed(rows):
            value = row.values.get(species.param)
            if value is not None:
                latest[species.key] = value
                measured_at = max(measured_at, row.time) if measured_at else row.time
                break
    return PollenData(station=station, measured_at=measured_at, latest=latest, mean_24h=mean)
