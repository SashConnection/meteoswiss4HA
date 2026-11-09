# MeteoSwiss Complete For HA

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/logo.png" alt="Logo" width="96" align="right">

**All of Swiss weather in Home Assistant, in one integration.**
Official MeteoSwiss data, ready-made cards, nothing to program — in **German, French, Italian, Romansh and English**.

🇫🇷 **[Mode d'emploi en français](https://github.com/SashConnection/meteoswiss4HA/blob/main/docs/GUIDE.fr.md)**

![MeteoSwiss Complete For HA](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/overview.png)

## Everything in one

| | |
|---|---|
| 🌤️ **Weather** | Current conditions from the nearest station, forecast for 9 days and hour by hour |
| 🌧️ **Radar** | The last 3 hours of the MeteoSwiss radar, then the rain forecast for the next 12 hours |
| ⚠️ **Weather warnings** | Rain, thunderstorms, wind, snow, slippery roads, heat, frost — official MeteoSwiss warnings |
| 🔥 **Natural hazards** | Forest fire, floods, drought (FOEN) and avalanches (SLF) |
| 🌼 **Pollen** | 7 species, 15 measuring stations across Switzerland |
| 🗺️ **Switzerland map** | All of the above on one map, or zoomed on your region |
| 📍 **Your places** | Warnings for other places (e.g. Bern, Cernier) and **where you are** (follows your phone), with ready-made automation triggers |

## Ready-made cards

<table>
<tr>
<td width="50%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-weather.jpg" width="100%" alt="Detailed weather"><br><b>Detailed weather</b><br><sub>Your place and altitude, the measurements you choose, hourly chart, 9 days</sub></td>
<td width="50%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-pollen.jpg" width="100%" alt="Pollen"><br><b>Pollen</b><br><sub>A sketch of each plant, colored by the pollen level, for the stations you choose</sub>
<br><br><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-forecast.png" width="100%" alt="Forecast"><br><b>Forecast</b><br><sub>Compact current weather, hours and days</sub></td>
</tr>
<tr>
<td valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/map-weather.jpg" width="100%" alt="Switzerland map"><br><b>Switzerland map</b><br><sub>Weather, radar, warnings, hazards and pollen — one tap to switch</sub></td>
<td valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-map-home-radar.png" width="100%" alt="Map of your region"><br><b>Map of your region</b><br><sub>Any layer, zoomed on your home (here: radar over Neuchâtel)</sub></td>
</tr>
<tr>
<td valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-now.png" width="100%" alt="Now"><br><b>Now</b><br><sub>Big pictogram and the next hours: temperature with its uncertainty band, rain probability and amount</sub></td>
<td valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-days.png" width="100%" alt="Days"><br><b>Days</b><br><sub>One continuous temperature curve and rain over the next days</sub>
<br><br><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-tiles.png" width="100%" alt="Tiles"><br><b>Tiles</b><br><sub>Severe weather mini map with hazard chips, animated radar</sub></td>
</tr>
</table>

Add them with **Edit dashboard → Add card → search "MeteoSwiss"**. Every setting is in the card editor: no YAML needed.

## Five languages

Everything — settings, entities, cards and map — speaks **Deutsch, Français, Italiano, Rumantsch and English**. By default the cards follow the Home Assistant language; each card can also be set to another one.

![The pollen card in five languages](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/languages.jpg)

## Animated or static — your choice

Three pictogram packs, one per MeteoSwiss weather symbol. Pick one in the integration options; the animated pack is the default.

<p>
<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/custom_components/meteoswiss4ha/icons/animated/1.svg" width="64" alt="Sunny">
<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/custom_components/meteoswiss4ha/icons/animated/5.svg" width="64" alt="Cloudy">
<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/custom_components/meteoswiss4ha/icons/animated/17.svg" width="64" alt="Rain">
<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/custom_components/meteoswiss4ha/icons/animated/23.svg" width="64" alt="Thunderstorm">
<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/custom_components/meteoswiss4ha/icons/animated/26.svg" width="64" alt="Snow">
<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/custom_components/meteoswiss4ha/icons/animated/101.svg" width="64" alt="Clear night">
</p>

![Pictogram packs](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/packs.jpg)

## Ready in 2 minutes

1. **HACS** → ⋮ → Custom repositories → `https://github.com/SashConnection/meteoswiss4HA` (Integration) → Download → restart Home Assistant.
2. **Settings → Devices & services → Add integration → MeteoSwiss Complete For HA**: pick your station and postal code (the nearest are suggested).
3. **Add a card** to your dashboard: search "MeteoSwiss".

> Screenshots: Neuchâtel and Bern; some values (forecasts, pollen) are examples.

---

# User guide

## Contents

1. [Installation](#1-installation)
2. [Settings](#2-settings)
3. [Forecast card](#3-forecast-card)
4. [Switzerland map](#4-switzerland-map)
5. [One map per hazard, or zoomed on your region](#5-one-map-per-hazard-or-zoomed-on-your-region)
6. [On a phone](#6-on-a-phone)
7. [Entities for your automations](#7-entities-for-your-automations)
8. [Updates and versions](#8-updates-and-versions)
9. [Troubleshooting](#9-troubleshooting)
10. [Technical notes](#10-technical-notes)
11. [Data sources and license](#11-data-sources-and-license)

---

## 1. Installation

Requires Home Assistant **2026.1** or newer and [HACS](https://hacs.xyz).

1. In HACS, open the menu **⋮ → Custom repositories**.
2. Add `https://github.com/SashConnection/meteoswiss4HA`, category **Integration**.
3. Search for **MeteoSwiss Complete For HA**, click **Download**, then **restart Home Assistant**.
4. **Settings → Devices & services → Add integration**, search for **MeteoSwiss Complete For HA**.
5. Choose:
   - the **weather station** (sorted from nearest to farthest from your home): it gives the current temperature, wind, etc.;
   - the **postal code** used for the local forecast.

The integration creates a weather entity and sensors, and adds two cards for your dashboards.

## 2. Settings

**Settings → Devices & services → MeteoSwiss Complete For HA → Configure**. The menu has three pages:

| Page | Settings |
|---|---|
| **Display** | Pictogram pack: **Animated** (default), **Vivid** or **Classic**. Option **"Show the map page in the sidebar"** (off by default). |
| **Forecast** | Hourly forecast on/off, horizon (48 h by default) and refresh interval. MeteoSwiss hourly files are large: reduce the horizon to save bandwidth. |
| **Pollen and hazards** | Pollen station and avalanche region. "Automatic" picks the one nearest to your home. |

The integration reloads by itself after a change.

## 3. Forecast card

The standard Home Assistant weather card always uses its own icons. To see **our pictograms** (animated by default), use the **MeteoSwiss forecast** card:

**Edit dashboard → Add card → search for "MeteoSwiss forecast"**.

| Hours and days | Days only, no details |
|---|---|
| ![Forecast card](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-forecast.png) | ![Daily forecast card](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-forecast-daily.png) |

- **Top**: current weather (pictogram, sky condition, measured temperature) and details (humidity, wind, gusts, pressure). A click opens the entity dialog.
- **Middle**: the next hours (time, pictogram, temperature, rain in mm or probability in %). Scroll to the right.
- **Bottom**: the next days (minimum, maximum, rain).

Settings in the card editor, or in YAML:

```yaml
type: custom:meteoswiss-forecast-card
entity: weather.home  # optional: the first MeteoSwiss weather entity
forecast: both        # both = hours and days, daily, hourly or none
days: 7               # 1 to 9
hours: 12
show_current: true    # current weather
show_details: true    # humidity, wind, pressure
```

The hourly part needs the **hourly forecast** turned on (Forecast settings page).

### Detailed weather card

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-weather.jpg" alt="Detailed weather card" width="360" align="right">

The **MeteoSwiss detailed weather** card shows everything at once:

- place and altitude, pictogram, condition, measuring station and time, temperature;
- a grid of **measurements you choose one by one, in the order you want** (tick and drag them in the card editor);
- an **hourly chart**: pictograms, temperature with its 10–90 % uncertainty band, precipitation bars, day separators;
- **9 days**: pictogram, minimum and maximum, precipitation, rain probability and precipitation range (10–90 %);
- the forecast run time.

Measurements available: humidity, wind, gust, pressure, dew_point, precipitation_probability, freezing_level, pollen, precipitation, sunshine, global_radiation, pressure_qnh, pressure_qfe, warnings.

```yaml
type: custom:meteoswiss-weather-card
details: [humidity, wind, gust, pressure, dew_point, precipitation_probability, freezing_level, pollen]
show_header: true
show_chart: true
hours: 24             # 6 to 48
show_daily: true
days: 9
```

<br clear="right">

### Pollen card

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-pollen.jpg" alt="Pollen card" width="360" align="right">

The **MeteoSwiss pollen** card shows, for each species you choose, a **sketch of the plant** that takes the color of the pollen level as soon as there is pollen, and for each station you choose the **level and the concentration** (24-hour mean or last hour). Layout: **table** (stations as columns) or **list**. Languages: de, fr, it, rm, en.

```yaml
type: custom:meteoswiss-pollen-card
stations: [PNE, PBE]  # Neuchâtel, Bern (default: the station of the integration)
species: [grasses, birch, hazel]
layout: table         # or list
value: mean           # or latest
language: auto        # or de, fr, it, rm, en
```

<br clear="right">

## 3b. Now, Days and Tiles cards

| Now | Days | Tiles |
|---|---|---|
| ![Now](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-now.png) | ![Days](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-days.png) | ![Tiles](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-tiles.png) |

```yaml
type: custom:meteoswiss-now-card     # big pictogram + hour-by-hour chart
hours: 24
---
type: custom:meteoswiss-days-card    # days above one continuous curve
days: 6
---
type: custom:meteoswiss-tiles-card   # severe weather mini map + animated radar
tap_path: /meteoswiss                # page opened on tap
```

The Days curve uses the hourly forecast where it exists (48 h by default) and continues through the daily minimum and maximum; set the hourly horizon to 120 h in the options for a full hourly curve.

## 3c. Warnings for your places and where you are

**Settings → Devices & services → MeteoSwiss Complete For HA → Configure → Watched places and persons**:

- **Postal codes or places**: e.g. `2053` or `Cernier`, `3000` or `Bern` (the nearest forecast point is used);
- **Persons to follow**: a person or the device tracker of your phone (Home Assistant app). The warnings follow its position (in Switzerland).

Each one becomes a device (e.g. *MeteoSwiss Bern (3004)*) with the 7 weather warning sensors.

### Ready-made automation triggers

**Settings → Automations → Create → Add trigger → Device →** a MeteoSwiss device, then choose:

- *Thunderstorm warning announced* (an upcoming warning is published),
- *Rain warning starts* / *ends*,
- *Wind warning reaches a level* (2 to 5),
- on the main device also: *Forest fire / Flood / Drought / Avalanche danger reaches a level*, *Pollen reaches a level*.

Example: notify your phone when a thunderstorm warning is announced where you are — no YAML needed.

## 4. Switzerland map

Add the **MeteoSwiss map** card to a dashboard (or turn on the sidebar page, see [Settings](#2-settings)). The toolbar at the top left switches maps; the **colored line** above each button shows the highest danger level currently in force in Switzerland.

Buttons under the zoom: **⌖** re-centers the map, **+ / −** zoom.

### Weather

Pictogram, minimum and maximum for 31 towns and a few summits (green); your home is orange (see "At a glance" at the top). The tabs at the bottom choose the day. More places appear when you zoom in.

### Precipitation radar

![Radar](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/map-radar.jpg)

The **last 3 hours** of the MeteoSwiss radar, one image every 5 minutes, then the **hourly precipitation forecast** (**orange** part of the slider, labelled "Forecast"):

![Radar forecast](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/map-radar-forecast.jpg)

▶ / ❚❚ starts or stops the animation; the slider picks a time. If the radar server does not answer, the map says that the radar is not available for the moment.

### Weather warnings

![Weather warnings](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/map-warnings.jpg)

The official MeteoSwiss warnings: **rain, thunderstorms, wind, snow, slippery roads, heat, frost** (tabs at the bottom). Switzerland is green when there is no warning; warning regions take the color of their danger level. **Upcoming** warnings are dashed. Hover (or tap) a region to see the warning text, start and end.

### Forest fire, floods, drought

| Forest fire | Floods | Drought |
|---|---|---|
| ![Forest fire](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/map-fire.jpg) | ![Floods](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/map-flood.jpg) | ![Drought](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/map-drought.jpg) |

FOEN maps by region (and by river for floods). The **Avalanches** (SLF bulletin, in season) and **Pollen** (15 measuring stations) layers work the same way.

### Danger levels

| Level | Color | Meaning |
|---|---|---|
| 1 | green | No or low danger (no warning) |
| 2 | yellow | Moderate danger |
| 3 | orange | Considerable danger |
| 4 | red | High danger |
| 5 | dark red | Very high danger |

## 5. One map per hazard, or zoomed on your region

In the **MeteoSwiss map** card editor:

- **Layers shown**: tick **a single** hazard for a dedicated map without toolbar (you can put several on one dashboard);
- **Area**: **Whole Switzerland** or **My region (home)**, with a **zoom** level from 7 to 12;
- **Legend** on or off, map **height**.

| Forest fire only | Radar zoomed on home |
|---|---|
| ![Forest fire card](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-map-fire.png) | ![Zoomed radar](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-map-home-radar.png) |

In YAML:

```yaml
type: custom:meteoswiss-map-card
layer: weather        # layer shown first
layers: [radar]       # one or more of: weather, radar, warnings, fire, flood, drought, avalanche, pollen
area: home            # switzerland (default) or home
zoom: 9
legend: true
height: 360
```

## 6. On a phone

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/mobile.jpg" alt="On a phone" width="300">

On a narrow screen the legend becomes one compact line and the tabs use icons. On the sidebar page, the ☰ button opens the Home Assistant menu.

## 7. Entities for your automations

| Entity | Content |
|---|---|
| `weather.<location>` | Current weather and daily/hourly forecast. Forecast items also carry `meteoswiss_symbol`; the `icons_url` attribute gives the pictogram pack URL. |
| `sensor.<location>_temperature`, `_humidity`, … | Station measurements (only those the station actually measures). |
| `sensor.<location>_meteoswiss_symbol` | Current MeteoSwiss symbol code (1–42 day, 101–142 night); its picture is the pictogram of the chosen pack. |
| `sensor.<location>_weather_description` | Official MeteoSwiss description in the Home Assistant language. |
| `sensor.<location>_rain_warning`, `_thunderstorm_warning`, `_wind_warning`, `_snow_warning`, `_slippery_roads_warning`, `_heat_warning`, `_frost_warning` | Warning in force at your home (`low` = no warning). Attributes: event, region, description, instruction, onset, expires, and `upcoming` for announced warnings. |
| `sensor.<location>_flood_danger`, `_forest_fire_danger`, `_drought_danger` | FOEN danger level of your region. |
| `sensor.<location>_avalanche_danger` | SLF avalanche danger of your region (or no bulletin off-season). |
| `sensor.<location>_pollen_level`, `_birch_pollen`, `_grass_pollen`, … | Overall pollen level and concentration per species. |

Example: get notified as soon as a thunderstorm warning is announced.

```yaml
triggers:
  - trigger: state
    entity_id: sensor.home_thunderstorm_warning
    attribute: upcoming
conditions:
  - condition: template
    value_template: "{{ state_attr('sensor.home_thunderstorm_warning', 'upcoming') | count > 0 }}"
actions:
  - action: notify.notify
    data:
      message: "Thunderstorm warning announced: {{ state_attr('sensor.home_thunderstorm_warning', 'upcoming')[0].event }}"
```

The pictograms can also be used in any card: they are served at `/meteoswiss4ha/icons/<pack>/<code>.svg`, for example:

```yaml
type: picture-entity
entity: sensor.home_meteoswiss_symbol
```

## 8. Updates and versions

Versions follow the calendar: **YEAR.MONTH.N**, for example 2026.11.0, then 2026.11.1 for the next update in the same month, 2026.12.0 the following month. What changed in each version is in the [CHANGELOG](https://github.com/SashConnection/meteoswiss4HA/blob/main/CHANGELOG.md).

To update: HACS offers the new version → **Download** → **restart Home Assistant** → in the browser, **Ctrl+F5** to reload the cards.

## 9. Troubleshooting

| Problem | Solution |
|---|---|
| The cards did not change after an update | Ctrl+F5 in the browser; in the mobile app, *App settings → Debugging → Reload frontend*. |
| The map is off-center | **⌖** button under the zoom. |
| "The radar is not available at the moment" | The project's radar server does not answer; it recovers by itself, try again later. |
| No hourly forecast | Turn on the **hourly forecast** in the settings (Forecast page). |
| A warning or hazard is "unavailable" | Its source (MeteoSwiss/MeteoAlarm, FOEN, SLF) does not answer; the value comes back at the next update. |

## 10. Technical notes

- **Bandwidth**: MeteoSwiss publishes one hourly forecast file per parameter for all ~5,800 points (~33 MB each). The integration streams them and stops once the requested horizon is reached (~8 MB per parameter for 48 h).
- **Radar**: the radar images and the precipitation forecast are prepared by a server run by the project (`ha.jesaispas.ch`) from MeteoSwiss data; Home Assistant downloads them from there. If this server does not answer, the map says the radar is not available for the moment.
- **Pictograms**: generated by `node scripts/generate_icons.mjs` (vivid and classic packs, `THEMES` / `SPEC`) and `scripts/animated_icons.mjs` (animated pack). The animations stop when the device asks for reduced motion.

## 11. Data sources and license

Data: **Source: MeteoSwiss** — Open Government Data under [CC BY 4.0](https://opendatadocs.meteoswiss.ch/general/terms-of-use). Symbol descriptions are the official MeteoSwiss texts.
Weather warnings: MeteoSwiss, published through [MeteoAlarm](https://meteoalarm.org) (EUMETNET, CC BY 4.0); they are not part of the MeteoSwiss Open Data catalogue. MeteoAlarm uses 4 colors, so MeteoSwiss levels 4 and 5 both show as level 4.
Natural hazards: FOEN (forest fire, floods, drought) and SLF (avalanches). Base map © swisstopo.
This project is not affiliated with or endorsed by MeteoSwiss. The pictograms are original artwork, not the official MeteoSwiss pictograms.

Code and pictograms: MIT License.
