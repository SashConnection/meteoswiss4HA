# Changelog

Versions follow the calendar: `YEAR.MONTH.N` (N starts at 0 each month), like Home Assistant.
The minimum Home Assistant version is a separate setting (2026.1).

## 2026.11.3

- Integration logo (original artwork), shown by Home Assistant 2026.3 and newer.

## 2026.11.2

- New detailed weather card (`custom:meteoswiss-weather-card`): place and altitude, measurements chosen one by one, hourly chart with the temperature uncertainty band and precipitation, 9 days with rain probability and precipitation range.
- Weather entity: location, altitude, station, all station measurements, freezing level and rain probability of the current hour; forecasts carry the temperature band (hourly), freezing level, precipitation range and daily rain probability.

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
