# Changelog

Versions follow the calendar: `YEAR.MONTH.N` (N starts at 0 each month), like Home Assistant.
The minimum Home Assistant version is a separate setting (2026.1).

## 2026.11.1

- Map: fixed the view sometimes off-center (mostly on narrow screens and cards); compact one-line legend on small cards; selected tab highlighted.
- User guide with screenshots (docs/GUIDE.fr.md).

## 2026.11.0

First official release.

- Weather entity: current conditions from the nearest SwissMetNet station, daily and hourly local forecast, with both the Home Assistant condition and the MeteoSwiss symbol.
- Sensors: measurements, MeteoSwiss symbol and description, pollen (per species and overall), natural hazards (avalanche, flood, forest fire, drought) and weather warnings (rain, thunderstorm, wind, snow, slippery roads, heat, frost).
- Pictogram packs: animated, vivid and classic.
- Forecast card (`custom:meteoswiss-forecast-card`) with the chosen pictograms.
- Map card (`custom:meteoswiss-map-card`): weather, precipitation radar (3 hours + hourly forecast), weather warnings, forest fire, flood, drought, avalanche and pollen maps; single-hazard maps and zoom on the home region.
- Optional map page in the sidebar (off by default).
