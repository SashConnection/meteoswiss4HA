"""Cities shown on the Switzerland overview map.

(point_id, name, latitude, longitude, min_zoom). All are postal-code points
(point type 2) of the MeteoSwiss local forecast. The first 17 are the cities
MeteoSwiss itself shows on its maps; min_zoom hides the smaller ones when the
map is zoomed out.
"""

from __future__ import annotations

from typing import Final

from .api import POINT_TYPE_MOUNTAIN, POINT_TYPE_POSTAL_CODE

CITIES: Final[tuple[tuple[int, str, float, float, int], ...]] = (
    (400100, "Basel", 47.55675, 7.588633, 7),
    (300400, "Bern", 46.972661, 7.448847, 7),
    (700000, "Chur", 46.855881, 9.526189, 7),
    (120100, "Genève", 46.209839, 6.143739, 7),
    (690000, "Lugano", 46.008308, 8.953075, 7),
    (800100, "Zürich", 47.372289, 8.542189, 7),
    (100300, "Lausanne", 46.520433, 6.631964, 7),
    (195000, "Sion", 46.230603, 7.358856, 7),
    (600300, "Luzern", 47.047869, 8.300947, 7),
    (900000, "St. Gallen", 47.423922, 9.374475, 7),
    (750000, "St. Moritz", 46.491592, 9.835431, 7),
    (371500, "Adelboden", 46.492119, 7.562986, 8),
    (646000, "Altdorf", 46.878097, 8.639806, 8),
    (676000, "Faido", 46.478789, 8.798344, 8),
    (875000, "Glarus", 47.042469, 9.064219, 8),
    (820000, "Schaffhausen", 47.704831, 8.635986, 8),
    (450000, "Solothurn", 47.208794, 7.532022, 8),
    (200000, "Neuchâtel", 46.994889, 6.928972, 8),
    (170000, "Fribourg", 46.804358, 7.155722, 8),
    (280000, "Delémont", 47.365247, 7.347969, 8),
    (650000, "Bellinzona", 46.194139, 9.022436, 8),
    (660000, "Locarno", 46.166, 8.793858, 9),
    (727000, "Davos", 46.794753, 9.824081, 8),
    (390000, "Brig", 46.317075, 7.990064, 8),
    (500000, "Aarau", 47.391117, 8.0483, 9),
    (360000, "Thun", 46.754572, 7.624267, 9),
    (840000, "Winterthur", 47.500497, 8.729017, 9),
    (380000, "Interlaken", 46.684258, 7.859283, 9),
    (392000, "Zermatt", 46.019961, 7.748289, 8),
    (850000, "Frauenfeld", 47.557189, 8.894367, 9),
    (755000, "Scuol", 46.796786, 10.299706, 8),
)

# Summits (point type 3), shown as green labels like on the MeteoSwiss map.
MOUNTAINS: Final[tuple[tuple[int, str, float, float, int], ...]] = (
    (711, "Säntis", 47.249425, 9.343242, 8),
    (1021, "Pilatus", 46.97915, 8.256178, 8),
    (717, "Titlis", 46.772033, 8.437781, 8),
    (730, "Eiger", 46.5776, 8.005286, 8),
    (800, "Galenstock", 46.612611, 8.416958, 8),
    (892, "Matterhorn", 45.976411, 7.658603, 8),
    (895, "Monte Leone", 46.249444, 8.110192, 8),
    (675, "Piz Bernina", 46.382353, 9.90805, 8),
    (1034, "Chasseral", 47.133044, 7.059333, 9),
    (807, "Wildhorn", 46.354753, 7.360808, 9),
    (1049, "Monte Generoso", 45.931325, 9.019925, 9),
)

CITY_POINTS: Final = tuple((c[0], POINT_TYPE_POSTAL_CODE) for c in CITIES) + tuple(
    (m[0], POINT_TYPE_MOUNTAIN) for m in MOUNTAINS
)
