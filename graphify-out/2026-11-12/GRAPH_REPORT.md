# Graph Report - meteoswiss4HA  (2026-11-11)

## Corpus Check
- 46 files · ~73,671 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 3)

## Summary
- 1190 nodes · 2483 edges · 67 communities (47 shown, 20 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 166 edges (avg confidence: 0.92)
- Token cost: 110,341 input · 0 output

## Community Hubs (Navigation)
- App Cards Bundle
- Weather Entity Forecast
- Switzerland Map Card
- Warnings and Watched Places
- Integration Setup and Runtime
- Level Change Events
- Base Entity and Constants
- Local Forecast Coordinator
- Pictogram Generator Scripts
- Config Flow
- Lake Card and Shared JS
- Hazard Bulletin Parsing
- Fog Sensors
- HTTP Errors and Geo Utils
- MeteoSwiss Open Data Client
- Pollen Card
- Hazard Client and Errors
- Common JS Helpers
- HTTP Views Registration
- Alplakes Lake Data
- Device Triggers
- Overview API Endpoints
- Current Measurements
- Fog Detection Engine
- Current Conditions Parsing
- Pollen Data Pipeline
- Fog Card and Formatting
- Swiss Coordinate Conversion
- CI Validation Workflow
- Detailed Weather Card
- Map Card Constants
- Card Editors and Sky Card
- Mountain Map Drawing
- Docs Fog Hazards Mountain
- My Day Card
- Mountain Card
- Forecast Series Fetching
- Forecast Card Base Class
- Forecast Card
- Monument Pictograms
- Integration Manifest
- Fog Coordinator
- Forecast Card Editor
- Weather Card Editor
- Pollen Species Sensors
- Docs Versions and Languages
- Docs Install and HACS
- Docs Watched Places and Triggers
- Compare Places Card
- Wall Card
- Pollen Level Sensor
- Docs Map and Danger Levels
- Node-RED Flow Builder
- Docs Forecast Cards
- Hazard Level Model
- Docs Pollen
- Docs Lakes
- Map Card Editor
- Avalanche Bulletin
- Warning Regions View
- Hazard Data Model
- Docs My Day Card
- Docs Now Card
- Docs Live Sky Card

## God Nodes (most connected - your core abstractions)
1. `MeteoSwissConfigEntry` - 51 edges
2. `MeteoSwissClient` - 37 edges
3. `HazardClient` - 32 edges
4. `MeteoSwissMap` - 30 edges
5. `MeteoSwissWeather` - 29 edges
6. `MeteoSwissError` - 26 edges
7. `ForecastCoordinator` - 21 edges
8. `esc()` - 18 edges
9. `async_setup_entry()` - 17 edges
10. `CurrentCoordinator` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Reglages (FR settings)` --semantically_similar_to--> `Integration settings pages (Display, Forecast, Pollen and hazards, Lakes and fog, Watched places)`  [INFERRED] [semantically similar]
  docs/GUIDE.fr.md → README.md
- `Brouillard par region (FR fog by region)` --semantically_similar_to--> `Fog by region detection (station ladder plain to summits)`  [INFERRED] [semantically similar]
  docs/GUIDE.fr.md → README.md
- `Lacs (FR lakes)` --semantically_similar_to--> `Lakes (27 Swiss lakes, 13 with 3D map)`  [INFERRED] [semantically similar]
  docs/GUIDE.fr.md → README.md
- `Alertes pour vos lieux (FR watched places)` --semantically_similar_to--> `Watched places and followed persons`  [INFERRED] [semantically similar]
  docs/GUIDE.fr.md → README.md
- `Degres de danger (FR danger levels)` --semantically_similar_to--> `Danger levels 1-5`  [INFERRED] [semantically similar]
  docs/GUIDE.fr.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **External data sources of the integration** — readme_meteoswiss_open_data, readme_meteoalarm, readme_foen, readme_slf, readme_eawag_alplakes, readme_swisstopo, readme_radar_server [EXTRACTED 1.00]
- **Fog by region feature (detection, sensors, card, triggers)** — readme_fog_by_region, readme_fog_sensors, readme_fog_card, readme_device_triggers, readme_swissmetnet [EXTRACTED 1.00]
- **Everyday panels** — readme_sky_card, readme_outing_card, readme_day_card, readme_compare_card, readme_wall_card [EXTRACTED 1.00]

## Communities (67 total, 20 thin omitted)

### Community 0 - "App Cards Bundle"
Cohesion: 0.06
Nodes (27): BOX, DANGER, esc(), FIELDS, findEntity(), ForecastMixin, geomPath(), HAZARD_ICONS (+19 more)

### Community 1 - "Weather Entity Forecast"
Cohesion: 0.06
Nodes (4): ForecastStep, async_setup_entry(), _int(), MeteoSwissWeather

### Community 2 - "Switzerland Map Card"
Cohesion: 0.11
Nodes (4): lang(), MeteoSwissMap, MeteoSwissMapCard, MeteoSwissPanel

### Community 3 - "Warnings and Watched Places"
Cohesion: 0.07
Nodes (6): WeatherWarning, _find_point(), Place, place_sensors(), PlaceWarningSensor, WarningsCoordinator

### Community 4 - "Integration Setup and Runtime"
Cohesion: 0.10
Nodes (15): HazardCoordinator, MeteoSwissConfigEntry, MeteoSwissData, _async_options_updated(), async_setup_entry(), _async_setup_fog(), _async_setup_hazards(), _async_setup_lakes() (+7 more)

### Community 5 - "Level Change Events"
Cohesion: 0.07
Nodes (4): LevelEventMixin, _EventsOnUpdate, HazardSensor, WeatherWarningSensor

### Community 6 - "Base Entity and Constants"
Cohesion: 0.10
Nodes (7): MeteoSwissEntity, env_sensors(), _FogBase, FogTopSensor, day_code(), is_night_code(), symbol_to_condition()

### Community 7 - "Local Forecast Coordinator"
Cohesion: 0.08
Nodes (5): LocalForecast, ForecastCoordinator, DescriptionSensor, _SymbolBase, SymbolSensor

### Community 8 - "Pictogram Generator Scripts"
Cohesion: 0.10
Nodes (29): bolt(), C, CLOUD, cloud(), delay(), DROP_X, fogLines(), moon() (+21 more)

### Community 10 - "Lake Card and Shared JS"
Cohesion: 0.12
Nodes (14): api(), define(), langOf(), LANGS, locOf(), tempColor(), weekday(), DEPTHS (+6 more)

### Community 11 - "Hazard Bulletin Parsing"
Cohesion: 0.14
Nodes (15): _centroid(), _elevation_text(), find_region(), _flood_level(), _leading_int(), parse_bulletin(), parse_flood(), parse_meteoalarm() (+7 more)

### Community 12 - "Fog Sensors"
Cohesion: 0.10
Nodes (3): FogSensor, LakeTemperatureSensor, _lang()

### Community 13 - "HTTP Errors and Geo Utils"
Cohesion: 0.11
Nodes (4): distance_km(), MeteoSwissError, default_lakes(), _lake_call()

### Community 14 - "MeteoSwiss Open Data Client"
Cohesion: 0.10
Nodes (4): MeteoSwissClient, Station, PollenCoordinator, load()

### Community 15 - "Pollen Card"
Cohesion: 0.12
Nodes (11): esc(), LANG_NAMES, langOf(), LEVEL_COLORS, loadPollen(), MeteoSwissPollenCard, MeteoSwissPollenCardEditor, SKETCH (+3 more)

### Community 16 - "Hazard Client and Errors"
Cohesion: 0.13
Nodes (4): MeteoSwissConnectionError, MeteoSwissDataError, HazardClient, OverviewView

### Community 17 - "Common JS Helpers"
Cohesion: 0.14
Nodes (22): apiCache, DANGER, dayCode(), DOMAIN, hh(), ICON_KEYS, isSunnyCode(), isWetCode() (+14 more)

### Community 18 - "HTTP Views Registration"
Cohesion: 0.11
Nodes (12): async_setup(), async_register_views(), AvalancheRegionsView, _BaseView, FogView, HazardRegionsView, LakesView, LakeView (+4 more)

### Community 19 - "Alplakes Lake Data"
Cohesion: 0.16
Nodes (6): AlplakesClient, Lake, lake_facts(), _round(), _stamp(), value_at()

### Community 20 - "Device Triggers"
Cohesion: 0.10
Nodes (4): async_attach_trigger(), async_get_trigger_capabilities(), async_get_triggers(), _is_main_device()

### Community 22 - "Current Measurements"
Cohesion: 0.10
Nodes (4): CurrentCoordinator, async_setup_entry(), CurrentSensor, MeasurementTimeSensor

### Community 23 - "Fog Detection Engine"
Cohesion: 0.15
Nodes (8): build(), FogStation, region_state(), station_forecast(), station_now(), summarize_days(), sun_elevation(), _symbol_before()

### Community 24 - "Current Conditions Parsing"
Cohesion: 0.15
Nodes (7): CurrentConditions, ForecastPoint, ForecastRun, parse_current_csv(), parse_float(), parse_points_csv(), parse_stations_csv()

### Community 25 - "Pollen Data Pipeline"
Cohesion: 0.14
Nodes (6): parse_pollen_csv(), PollenMeasurement, one(), level_index(), PollenData, summarize()

### Community 26 - "Fog Card and Formatting"
Cohesion: 0.19
Nodes (6): esc(), num(), fmt(), fogSummary(), loadOutline(), MeteoSwissFogCard

### Community 27 - "Swiss Coordinate Conversion"
Cohesion: 0.15
Nodes (8): flood_to_wgs84(), ring(), lv95_to_wgs84(), _Cache, hazard_regions(), load(), pollen_stations(), weather_warnings()

### Community 28 - "CI Validation Workflow"
Cohesion: 0.11
Nodes (18): name, runs-on, steps, name, runs-on, steps, jobs, hacs (+10 more)

### Community 29 - "Detailed Weather Card"
Cohesion: 0.25
Nodes (3): esc(), findEntity(), MeteoSwissWeatherCard

### Community 30 - "Map Card Constants"
Cohesion: 0.13
Nodes (13): CH_BOUNDS, DANGER_COLORS, EDITOR, HAZARDS, I18N, ICONS, LAYERS, LINKS (+5 more)

### Community 31 - "Card Editors and Sky Card"
Cohesion: 0.19
Nodes (3): makeEditor(), FIELDS(), MeteoSwissSkyCard

### Community 32 - "Mountain Map Drawing"
Cohesion: 0.19
Nodes (13): BOX, geomPath(), GRID_COLORS, LABELS, merc(), px(), py(), ring() (+5 more)

### Community 33 - "Docs Fog Hazards Mountain"
Cohesion: 0.16
Nodes (12): 2026.11.10 Fog by region, lakes, mountain, everyday cards, Brouillard par region (FR fog by region), Montagne (FR mountain), Panneaux du quotidien (FR everyday panels), FOEN (forest fire, floods, drought), Fog card (custom:meteoswiss-fog-card), Natural hazard sensors (flood, forest fire, drought, avalanche), Mountain card (custom:meteoswiss-mountain-card) (+4 more)

### Community 34 - "My Day Card"
Cohesion: 0.21
Nodes (6): hhmm(), relatedSensors(), empty(), MeteoSwissDayCard, MeteoSwissOutingCard, sunTimes()

### Community 35 - "Mountain Card"
Cohesion: 0.17
Nodes (3): findWeather(), inScope(), MeteoSwissMountainCard

### Community 36 - "Forecast Series Fetching"
Cohesion: 0.24
Nodes (3): _merge_series(), fetch(), parse_timestamp()

### Community 39 - "Monument Pictograms"
Cohesion: 0.18
Nodes (5): f(), M, MONUMENT_NAMES, MOUNTAINS, tower()

### Community 40 - "Integration Manifest"
Cohesion: 0.17
Nodes (11): codeowners, config_flow, dependencies, documentation, domain, integration_type, iot_class, issue_tracker (+3 more)

### Community 42 - "Forecast Card Editor"
Cohesion: 0.27
Nodes (6): esc(), lang(), MeteoSwissForecastCardEditor, T, monument(), monumentKey()

### Community 43 - "Weather Card Editor"
Cohesion: 0.27
Nodes (6): DANGER_COLORS, DEFAULT_DETAILS, DETAILS, lang(), MeteoSwissWeatherCardEditor, T

### Community 45 - "Docs Versions and Languages"
Cohesion: 0.25
Nodes (8): Changelog, 2026.11.1 Map centering fix and user guide, 2026.11.6 Five languages, 2026.11.9 Monument pictograms, Mode d'emploi (French user guide), Updates and versions (YEAR.MONTH.N), Five languages (de, fr, it, rm, en), Monument pictograms for each town

### Community 46 - "Docs Install and HACS"
Cohesion: 0.22
Nodes (8): 2026.11.11 HACS default catalogue readiness, Installation (FR), Reglages (FR settings), Days card (custom:meteoswiss-days-card), HACS, Home Assistant, MeteoSwiss Complete For HA, Integration settings pages (Display, Forecast, Pollen and hazards, Lakes and fog, Watched places)

### Community 47 - "Docs Watched Places and Triggers"
Cohesion: 0.28
Nodes (9): 2026.11.8 Watched places, device triggers, Now/Days/Tiles cards, Alertes pour vos lieux (FR watched places), Entites pour vos automatisations (FR entities), Compare my places card (meteoswiss-compare-card), Ready-made automation device triggers, Fog sensors fog / fog_top, MeteoAlarm (EUMETNET), Weather warning sensors (rain, thunderstorm, wind, snow, slippery roads, heat, frost) (+1 more)

### Community 51 - "Docs Map and Danger Levels"
Cohesion: 0.29
Nodes (8): Carte de la Suisse (FR map), Degres de danger (FR danger levels), Danger levels 1-5, Switzerland map card (custom:meteoswiss-map-card), MeteoSwiss Open Government Data (CC BY 4.0), Project radar server (ha.jesaispas.ch), swisstopo base map, Tiles card (custom:meteoswiss-tiles-card)

### Community 52 - "Node-RED Flow Builder"
Cohesion: 0.29
Nodes (4): fs, libs, nodes, path

### Community 53 - "Docs Forecast Cards"
Cohesion: 0.47
Nodes (6): 2026.11.0 First official release, 2026.11.2 Detailed weather card, Detailed weather card (custom:meteoswiss-weather-card), Forecast card (custom:meteoswiss-forecast-card), Pictogram packs (animated, vivid, classic), Weather entity weather.<location>

### Community 55 - "Docs Pollen"
Cohesion: 0.50
Nodes (5): Pollen API /api/meteoswiss4ha/pollen, 2026.11.5 Pollen card and pollen API, Pollen card (custom:meteoswiss-pollen-card), Pollen sensors, SwissPollen stations (15)

### Community 56 - "Docs Lakes"
Cohesion: 0.50
Nodes (5): Lacs (FR lakes), Eawag Alplakes (Simstrat, MITgcm, Delft3D), Lake card (custom:meteoswiss-lake-card), Lakes (27 Swiss lakes, 13 with 3D map), Water temperature lake sensor

## Knowledge Gaps
- **21 isolated node(s):** `2026.11.1 Map centering fix and user guide`, `2026.11.2 Detailed weather card`, `2026.11.6 Five languages`, `2026.11.9 Monument pictograms`, `2026.11.11 HACS default catalogue readiness` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 470 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MeteoSwissConfigEntry` connect `Integration Setup and Runtime` to `Weather Entity Forecast`, `Level Change Events`, `Base Entity and Constants`, `Local Forecast Coordinator`, `Fog Coordinator`, `Fog Sensors`, `Pollen Species Sensors`, `MeteoSwiss Open Data Client`, `Pollen Level Sensor`, `Current Measurements`, `Entity Generic Init`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 27 inferred relationships involving `MeteoSwissConfigEntry` (e.g. with `MeteoSwissEntity` and `_async_options_updated()`) actually correct?**
  _`MeteoSwissConfigEntry` has 27 INFERRED edges - model-reasoned connections that need verification._
- **What connects `2026.11.1 Map centering fix and user guide`, `2026.11.2 Detailed weather card`, `2026.11.6 Five languages` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Cards Bundle` be split into smaller, more focused modules?**
  _Cohesion score 0.0597567424643046 - nodes in this community are weakly interconnected._
- **Why does `MeteoSwissClient` connect `MeteoSwiss Open Data Client` to `Warnings and Watched Places`, `Forecast Series Fetching`, `Integration Setup and Runtime`, `Local Forecast Coordinator`, `Config Flow`, `Fog Coordinator`, `HTTP Errors and Geo Utils`, `Current Measurements`, `Fog Detection Engine`, `Current Conditions Parsing`, `Pollen Data Pipeline`, `Swiss Coordinate Conversion`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `MeteoSwissClient` (e.g. with `MeteoSwissConfigFlow` and `MeteoSwissOptionsFlow`) actually correct?**
  _`MeteoSwissClient` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Should `Weather Entity Forecast` be split into smaller, more focused modules?**
  _Cohesion score 0.060129509713228495 - nodes in this community are weakly interconnected._