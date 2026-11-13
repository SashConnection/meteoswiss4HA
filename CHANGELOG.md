# Changelog

Versions follow the calendar: `YEAR.MONTH.N` (N starts at 0 each month), like Home Assistant.
The minimum Home Assistant version is a separate setting (2026.1).

## 2026.11.12b0 (pre-release)

- **No YAML, ever**: every card has a new editor with clear sections (summary of what is on, ↺ reset, link to the guide); the language moves to "Advanced" and follows Home Assistant.
- **Sun, moon and ephemeris** in the cards of your choice: sunrise, sunset, day length, moon phase drawn for the exact day (%, name), moon times, next full and new moon, saint of the day (5 languages). New Ephemeris card; Moon phase, Day length and Saint of the day sensors.
- **Rain in 20 minutes**: the radar tells when the rain reaches home; sensor and "Rain arrives soon" trigger (minutes in advance in the options).
- **Tips of the day** card and sensors: the day in one sentence, laundry drying, frost tonight, garden watering, stars, sunset, rainbow, foehn, bise, airing (indoor sensors), solar production today and tomorrow (your panels).
- **Station history**: yesterday, the 1991-2020 normal, records of the year, first frost and first snow of the season (with triggers).
- **Escape the fog**: the nearest summit in the sun (now or later today) in the fog sensor and the "Should I go out?" card.
- Lakes: swimming comfort. Hourly forecast: sunshine, global radiation and cloud layers.
- Fun: weather postcard to share, "guess the maximum" game, header badge, ambiance color for smart lights, live sky as dashboard background.
- New options page "Rain alert, solar and indoor".

## 2026.11.11

- Ready for the HACS default catalogue: Swiss-only (`country: CH`), HACS validation without exceptions.

## 2026.11.10

- Fog by region: reference stations from the plain to the summits (Neuchâtel → Chaumont → Chasseral, Bern → Bantiger → Napf, …) detect the sea of fog now and forecast it for 3 days, with its estimated top. New fog card, `fog` and `fog_top` sensors, triggers "fog forms" / "fog clears".
- Lakes (Eawag Alplakes): 27 lakes with water temperature, 4-day forecast, oxygen, thermocline, ice and depth profile; 13 lakes drawn in color by temperature with currents, lakeside towns, time slider and depth. New lake card and water temperature sensors.
- Mountain card: 0 °C level, snow line, temperatures by altitude (measured and estimated), sea of fog, avalanche danger for your region, a large region or all of Switzerland.
- Everyday cards: live animated sky, "Should I go out?", "My day", compare my places, wall screen with a dark red night mode.
- New options page "Lakes and fog". Watched places now also get their daily forecast (compare card).
- Hourly forecast files: reading several points at once no longer stops too early.
- Documentation: everything at a glance on the HACS page and in the French guide.

## 2026.11.9

- Monument pictograms: a line drawing of the best-known monument of each of the 31 towns of the map (and the summits), on the map labels and next to the place name in the cards.

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
