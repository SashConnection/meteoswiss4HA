# Graph Report - meteoswiss4HA  (2026-11-12)

## Corpus Check
- 46 files · ~73,679 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 3)

## Summary
- 1192 nodes · 2481 edges · 80 communities (45 shown, 35 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 161 edges (avg confidence: 0.92)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3ac96ea9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App Cards Bundle
- MeteoSwissWeather
- Switzerland Map Card
- PlaceWarningSensor
- async_setup_entry
- LevelEventMixin
- overview.py
- Local Forecast Coordinator
- Pictogram Generator Scripts
- Config Flow
- Lake Card and Shared JS
- hazards.py
- ._region
- __init__.py
- MeteoSwiss Open Data Client
- Pollen Card
- Hazard Client and Errors
- Common JS Helpers
- async_register_views
- Alplakes Lake Data
- Device Triggers
- sensor.py
- Current Measurements
- Fog Detection Engine
- api.py
- Pollen Data Pipeline
- Fog Card and Formatting
- CI Validation Workflow
- Detailed Weather Card
- Map Card Constants
- Card Editors and Sky Card
- Mountain Map Drawing
- Docs Fog Hazards Mountain
- My Day Card
- Mountain Card
- HazardSensor
- Forecast Card Base Class
- Forecast Card
- Monument Pictograms
- Integration Manifest
- Fog Coordinator
- MeteoSwissForecastCardEditor
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
- symbol_to_condition
- Entity Generic Init
- warnings_at
- WeatherWarningSensor
- Docs My Day Card
- Docs Now Card
- Docs Live Sky Card
- WarningsCoordinator
- LakeTemperatureSensor
- ForecastStep
- Any
- FogSensor
- _FogBase
- async_setup_entry

## God Nodes (most connected - your core abstractions)
1. `MeteoSwissConfigEntry` - 53 edges
2. `MeteoSwissClient` - 37 edges
3. `MeteoSwissMap` - 30 edges
4. `HazardClient` - 30 edges
5. `MeteoSwissWeather` - 29 edges
6. `MeteoSwissError` - 24 edges
7. `ForecastCoordinator` - 21 edges
8. `esc()` - 18 edges
9. `async_register_views()` - 17 edges
10. `CurrentCoordinator` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Brouillard par region (FR fog by region)` --semantically_similar_to--> `Fog by region detection (station ladder plain to summits)`  [INFERRED] [semantically similar]
  docs/GUIDE.fr.md → README.md
- `Reglages (FR settings)` --semantically_similar_to--> `Integration settings pages (Display, Forecast, Pollen and hazards, Lakes and fog, Watched places)`  [INFERRED] [semantically similar]
  docs/GUIDE.fr.md → README.md
- `Alertes pour vos lieux (FR watched places)` --semantically_similar_to--> `Watched places and followed persons`  [INFERRED] [semantically similar]
  docs/GUIDE.fr.md → README.md
- `Lacs (FR lakes)` --semantically_similar_to--> `Lakes (27 Swiss lakes, 13 with 3D map)`  [INFERRED] [semantically similar]
  docs/GUIDE.fr.md → README.md
- `Degres de danger (FR danger levels)` --semantically_similar_to--> `Danger levels 1-5`  [INFERRED] [semantically similar]
  docs/GUIDE.fr.md → README.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Everyday panels** — readme_sky_card, readme_outing_card, readme_day_card, readme_compare_card, readme_wall_card [EXTRACTED 1.00]
- **External data sources of the integration** — readme_meteoswiss_open_data, readme_meteoalarm, readme_foen, readme_slf, readme_eawag_alplakes, readme_swisstopo, readme_radar_server [EXTRACTED 1.00]
- **Fog by region feature (detection, sensors, card, triggers)** — readme_fog_by_region, readme_fog_sensors, readme_fog_card, readme_device_triggers, readme_swissmetnet [EXTRACTED 1.00]

## Communities (80 total, 35 thin omitted)

### Community 0 - "App Cards Bundle"
Cohesion: 0.06
Nodes (27): BOX, DANGER, esc(), FIELDS, findEntity(), ForecastMixin, geomPath(), HAZARD_ICONS (+19 more)

### Community 2 - "Switzerland Map Card"
Cohesion: 0.10
Nodes (5): lang(), MeteoSwissMap, MeteoSwissMapCard, MeteoSwissPanel, WMTS()

### Community 4 - "async_setup_entry"
Cohesion: 0.26
Nodes (6): _async_options_updated(), async_setup_entry(), _async_setup_fog(), async_unload_entry(), _async_update_panel(), _other_loaded_entries()

### Community 7 - "Local Forecast Coordinator"
Cohesion: 0.14
Nodes (5): ForecastCoordinator, MeteoSwissConfigEntry, DescriptionSensor, _SymbolBase, SymbolSensor

### Community 8 - "Pictogram Generator Scripts"
Cohesion: 0.10
Nodes (29): bolt(), C, CLOUD, cloud(), delay(), DROP_X, fogLines(), moon() (+21 more)

### Community 10 - "Lake Card and Shared JS"
Cohesion: 0.12
Nodes (14): api(), define(), langOf(), LANGS, locOf(), tempColor(), weekday(), DEPTHS (+6 more)

### Community 11 - "hazards.py"
Cohesion: 0.18
Nodes (7): _flood_level(), flood_to_wgs84(), ring(), lv95_to_wgs84(), parse_flood(), _warning_kind(), wgs84_to_lv95()

### Community 13 - "__init__.py"
Cohesion: 0.11
Nodes (6): distance_km(), MeteoSwissError, MeteoSwissData, _async_setup_lakes(), default_lakes(), LakeCoordinator

### Community 14 - "MeteoSwiss Open Data Client"
Cohesion: 0.12
Nodes (8): MeteoSwissClient, parse_stations_csv(), Station, PollenCoordinator, _async_setup_pollen(), load(), async_resolve_places(), _find_point()

### Community 15 - "Pollen Card"
Cohesion: 0.12
Nodes (11): esc(), LANG_NAMES, langOf(), LEVEL_COLORS, loadPollen(), MeteoSwissPollenCard, MeteoSwissPollenCardEditor, SKETCH (+3 more)

### Community 16 - "Hazard Client and Errors"
Cohesion: 0.11
Nodes (6): MeteoSwissConnectionError, HazardCoordinator, HazardClient, HazardData, _async_setup_hazards(), OverviewView

### Community 17 - "Common JS Helpers"
Cohesion: 0.14
Nodes (22): apiCache, DANGER, dayCode(), DOMAIN, hh(), ICON_KEYS, isSunnyCode(), isWetCode() (+14 more)

### Community 18 - "async_register_views"
Cohesion: 0.05
Nodes (20): async_setup(), async_register_views(), AvalancheRegionsView, _BaseView, _Cache, _days(), FogView, hazard_regions() (+12 more)

### Community 19 - "Alplakes Lake Data"
Cohesion: 0.15
Nodes (5): AlplakesClient, Lake, lake_facts(), _round(), _stamp()

### Community 20 - "Device Triggers"
Cohesion: 0.10
Nodes (4): async_attach_trigger(), async_get_trigger_capabilities(), async_get_triggers(), _is_main_device()

### Community 21 - "sensor.py"
Cohesion: 0.13
Nodes (4): place_sensors(), async_setup_entry(), env_sensors(), FogTopSensor

### Community 22 - "Current Measurements"
Cohesion: 0.10
Nodes (3): CurrentCoordinator, CurrentSensor, MeasurementTimeSensor

### Community 23 - "Fog Detection Engine"
Cohesion: 0.15
Nodes (8): build(), FogStation, region_state(), station_forecast(), station_now(), summarize_days(), sun_elevation(), _symbol_before()

### Community 24 - "api.py"
Cohesion: 0.08
Nodes (12): CurrentConditions, ForecastPoint, ForecastRun, LocalForecast, _merge_series(), fetch(), MeteoSwissDataError, parse_current_csv() (+4 more)

### Community 25 - "Pollen Data Pipeline"
Cohesion: 0.15
Nodes (5): PollenMeasurement, one(), level_index(), PollenData, summarize()

### Community 26 - "Fog Card and Formatting"
Cohesion: 0.19
Nodes (6): esc(), num(), fmt(), fogSummary(), loadOutline(), MeteoSwissFogCard

### Community 28 - "CI Validation Workflow"
Cohesion: 0.11
Nodes (18): name, runs-on, steps, name, runs-on, steps, jobs, hacs (+10 more)

### Community 29 - "Detailed Weather Card"
Cohesion: 0.25
Nodes (3): esc(), findEntity(), MeteoSwissWeatherCard

### Community 30 - "Map Card Constants"
Cohesion: 0.14
Nodes (12): CH_BOUNDS, DANGER_COLORS, EDITOR, HAZARDS, I18N, ICONS, LAYERS, LINKS (+4 more)

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

### Community 38 - "Forecast Card"
Cohesion: 0.23
Nodes (5): esc(), findEntity(), lang(), MeteoSwissForecastCard, T

### Community 39 - "Monument Pictograms"
Cohesion: 0.16
Nodes (7): f(), M, monument(), MONUMENT_NAMES, monumentKey(), MOUNTAINS, tower()

### Community 40 - "Integration Manifest"
Cohesion: 0.17
Nodes (11): codeowners, config_flow, dependencies, documentation, domain, integration_type, iot_class, issue_tracker (+3 more)

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

### Community 59 - "symbol_to_condition"
Cohesion: 0.18
Nodes (3): day_code(), is_night_code(), symbol_to_condition()

### Community 62 - "warnings_at"
Cohesion: 0.19
Nodes (5): _leading_int(), parse_meteoalarm(), _parse_polygon(), _parse_time(), warnings_at()

### Community 67 - "WarningsCoordinator"
Cohesion: 0.20
Nodes (3): _async_setup_places(), Place, WarningsCoordinator

### Community 70 - "Any"
Cohesion: 0.31
Nodes (6): _centroid(), _elevation_text(), find_region(), parse_bulletin(), _point_in_geometry(), _point_in_ring()

## Knowledge Gaps
- **21 isolated node(s):** `FOEN (forest fire, floods, drought)`, `Wall screen card (meteoswiss-wall-card)`, `Montagne (FR mountain)`, `2026.11.1 Map centering fix and user guide`, `2026.11.6 Five languages` (+16 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 472 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **35 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `MeteoSwissConfigEntry` connect `Local Forecast Coordinator` to `MeteoSwissWeather`, `async_setup_entry`, `overview.py`, `._region`, `__init__.py`, `MeteoSwiss Open Data Client`, `Hazard Client and Errors`, `async_register_views`, `sensor.py`, `Current Measurements`, `HazardSensor`, `Fog Coordinator`, `Pollen Species Sensors`, `Pollen Level Sensor`, `Entity Generic Init`, `WeatherWarningSensor`, `WarningsCoordinator`, `LakeTemperatureSensor`, `FogSensor`, `async_setup_entry`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 27 inferred relationships involving `MeteoSwissConfigEntry` (e.g. with `MeteoSwissEntity` and `_async_options_updated()`) actually correct?**
  _`MeteoSwissConfigEntry` has 27 INFERRED edges - model-reasoned connections that need verification._
- **What connects `FOEN (forest fire, floods, drought)`, `Wall screen card (meteoswiss-wall-card)`, `Montagne (FR mountain)` to the rest of the system?**
  _21 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Cards Bundle` be split into smaller, more focused modules?**
  _Cohesion score 0.0597567424643046 - nodes in this community are weakly interconnected._
- **Why does `MeteoSwissClient` connect `MeteoSwiss Open Data Client` to `async_setup_entry`, `overview.py`, `Local Forecast Coordinator`, `Config Flow`, `Fog Coordinator`, `__init__.py`, `.__init__`, `async_register_views`, `Current Measurements`, `Fog Detection Engine`, `api.py`, `Pollen Data Pipeline`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Are the 10 inferred relationships involving `MeteoSwissClient` (e.g. with `MeteoSwissConfigFlow` and `MeteoSwissOptionsFlow`) actually correct?**
  _`MeteoSwissClient` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Should `MeteoSwissWeather` be split into smaller, more focused modules?**
  _Cohesion score 0.1368421052631579 - nodes in this community are weakly interconnected._