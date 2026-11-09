# Changelog

Versions follow the calendar: `YEAR.MONTH.N` (N starts at 0 each month), like Home Assistant.
The minimum Home Assistant version is a separate setting (2026.1).

## 2026.11.8

- Watched places (postal codes or place names) and followed persons: weather warning sensors for each.
- Ready-made automation triggers (device triggers) in 5 languages: warning announced, starts, ends, reaches a level; hazard and pollen levels.
- New cards: Now (big pictogram + hourly chart), Days (continuous temperature curve and rain), Tiles (severe weather mini map + animated radar).

## 2026.11.7

- New HACS page: everything in one, five languages, animated or static pictograms, ready in 2 minutes (examples: Neuchâtel and Bern).
- Pollen card fits narrow dashboards; 24-hour times everywhere.

## 2026.11.6

- Everything in 5 languages: German, French, Italian, Romansh and English (settings, entities, all cards and the map). Each card has a language option (default: the Home Assistant language).

## 2026.11.5

- New pollen card (`custom:meteoswiss-pollen-card`): a sketch of each plant that takes the color of the pollen level, levels and concentrations for the stations of your choice, table or list layout, in German, French, Italian, Romansh and English.
- API: pollen of every SwissPollen station (`/api/meteoswiss4ha/pollen`).

## 2026.11.4

- Logo: Swiss flag added.

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
