# MeteoSwiss Complete For HA

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/logo.png" alt="Logo" width="96" align="right">

**All of Swiss weather in Home Assistant, in one integration.**
Official MeteoSwiss data, ready-made cards and automations, nothing to program — in **German, French, Italian, Romansh and English**.

**Ready to use — no YAML, ever.** Install, pick your station, add a card: that's it. Every card is set up with the mouse in a visual editor, every automation is chosen from menus.

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/overview.png" width="720" alt="MeteoSwiss Complete For HA">

🇫🇷 **[Mode d'emploi en français](https://github.com/SashConnection/meteoswiss4HA/blob/main/docs/GUIDE.fr.md)**

## Contents

- [What you get](#what-you-get)
- **Step by step**
  1. [Install](#1-install)
  2. [Add your home](#2-add-your-home)
  3. [Add a card to a dashboard](#3-add-a-card-to-a-dashboard)
  4. [Show a sensor on a dashboard](#4-show-a-sensor-on-a-dashboard)
  5. [Create an automation](#5-create-an-automation)
  6. [Change the settings](#6-change-the-settings)
  7. [Add another place](#7-add-another-place)
  8. [Update](#8-update)
- [The cards](#the-cards): [Forecast](#card-forecast) · [Detailed weather](#card-weather) · [Pollen](#card-pollen) · [Now, Days, Tiles](#card-now-days-tiles) · [Everyday](#card-everyday) · [Mountain](#card-mountain) · [Fog](#card-fog) · [Lakes](#card-lake) · [Tips](#card-tips) · [Ephemeris](#card-ephemeris) · [Postcard and more](#card-postcard) · [Rain minute by minute](#card-rain) · [Climate](#card-stripes) · [Rivers](#card-rivers) · [Air](#card-air) · [Snow](#card-snow)
- [Sun and moon](#sun-and-moon)
- [Switzerland map](#card-map)
- [Automations](#automations): [yes / no sensors](#yes--no-sensors) · [forecast numbers](#forecast-numbers) · [ready-made triggers](#ready-made-triggers) · [blueprints](#ready-made-automations-blueprints) · [calendar and Energy](#calendar-and-energy-dashboard)
- [All entities](#all-entities)
- [Languages, pictograms and monuments](#languages-pictograms-and-monuments)
- [Troubleshooting](#troubleshooting) · [Technical notes](#technical-notes) · [Data sources and license](#data-sources-and-license)
- [What's new, version by version](#whats-new-version-by-version)

## What you get

| | |
|---|---|
| 🌤️ **Weather** | Current conditions from the nearest station, forecast for 9 days and hour by hour |
| 🌧️ **Radar** | The last 3 hours of the MeteoSwiss radar, then the rain forecast for the next 12 hours |
| ⚠️ **Weather warnings** | Rain, thunderstorms, wind, snow, slippery roads, heat, frost — official MeteoSwiss warnings |
| 🔥 **Natural hazards** | Forest fire, floods, drought (FOEN) and avalanches (SLF) |
| 🌼 **Pollen** | 7 species, 15 measuring stations across Switzerland |
| 🗺️ **Switzerland map** | All of the above on one map, or zoomed on your region |
| 📍 **Your places** | Warnings for other places (e.g. Bern, Cernier) and **where you are** (follows your phone), with ready-made automation triggers; compare them side by side |
| 🌫️ **Fog by region** | Sea of fog detected with reference stations from the plain to the summits (Neuchâtel → Chaumont → Chasseral), estimated top and 3-day forecast, triggers "fog forms / clears" |
| 🏞️ **Lakes** | 27 Swiss lakes: water temperature with a 4-day forecast, oxygen, thermocline, ice, depth profile; 13 lakes drawn in color with their currents (Eawag) |
| 🏔️ **Mountain** | 0 °C level, snow line, temperatures by altitude, sea of fog and avalanche danger — your region, a large region or all of Switzerland |
| 🧥 **Every day** | *Should I go out?*, *My day*, a live animated sky and a wall screen with a dark red night mode |
| 🌧️ **Rain in 20 minutes** | The radar tells when the rain reaches your home, with a ready-made trigger |
| 💡 **Tips of the day** | Laundry drying, frost tonight, garden watering, stars, sunset, rainbow, foehn, bise, airing — and the day in one sentence |
| ☀️ **Solar forecast** | Your panels' production today and tomorrow, hour by hour (just enter their power) |
| 🌙 **Sun, moon, ephemeris** | Sunrise, sunset, day length, moon phase drawn exactly (%, name), saint of the day — in every card you want |
| 📈 **History** | Yesterday, the 1991–2020 normal, the records of the year, first frost and first snow of the season |
| 🏊 **Rivers** | Water temperature, discharge, level and flood danger of the FOEN stations — the Aare in Bern, the Rhine, the Rhône… with swimming comfort |
| 🌬️ **Air quality** | Ozone, NO₂ and fine particles of the nearest NABEL site, with an *Ozone peak* alert |
| ❄️ **Snow** | Snow depth at the stations near home, and how much fell today |
| 📊 **Climate** | Climate stripes of your station since 1864, and this month vs the normal |
| 🧭 **Feels like, pressure** | Feels-like temperature (wind chill, heat), pressure trend over 3 hours |
| 📅 **Calendar and Energy** | A weather calendar (warnings, full moons, hot days, frost) and your solar forecast in the Energy dashboard |
| 🤖 **Automations** | Yes / no sensors (*Strong gusts*, *Rain soon*, *Frost risk tonight*, *Weather warning in force*, *Frozen windscreen tomorrow morning*, *Good day to mow*, *Cool night*, *Ozone peak*…), forecast numbers (maximum tomorrow, rain today…), ready-made triggers and one-click automations |
| 🎁 **Fun** | A weather postcard to share, a "guess the maximum" game, a badge for the header, a color for your lights |

# Step by step

## 1. Install

You need Home Assistant **2026.1** or newer and [HACS](https://hacs.xyz).

1. Open **HACS**, then the menu **⋮ → Custom repositories**.
2. Paste `https://github.com/SashConnection/meteoswiss4HA`, category **Integration**, then **Add**.
3. Search **MeteoSwiss Complete For HA** in HACS, open it and click **Download**.
4. **Restart Home Assistant**: *Settings → System → ⏻ (top right) → Restart Home Assistant*.

## 2. Add your home

1. **Settings → Devices & services → Add integration** (button at the bottom right).
2. Search **MeteoSwiss Complete For HA**.
3. Choose the **weather station** (the nearest is first in the list) and the **postal code** of the forecast, e.g. `2000` for Neuchâtel or `3000` for Bern.
4. **Submit**. Done: the integration creates a *service* named after your place, with a weather entity and its sensors.
5. **Restart Home Assistant** once, as the message at the end reminds you. After a first install, **Settings → Repairs** also shows *Restart Home Assistant to finish installing MeteoSwiss*, with a button that does it for you. Then the cards appear on every dashboard and in the app.

On the integration page you then see your place (e.g. *Neuchâtel (2000)*) with its number of entities. Click it to see them all.

## 3. Add a card to a dashboard

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/editor-en.png" width="300" align="right" alt="Card editor">

1. Open your dashboard, click the **✏️ pencil** (top right) to edit it.
2. **+ Add card**, then type **MeteoSwiss** in the search field: all the cards appear with a preview, named in your Home Assistant language (*MeteoSwiss Tiles*, *MeteoSwiss My day*…).
3. Click the card you want. Its editor opens: clear sections, a summary of what is on, **↺** to go back to the defaults, a link to this guide.
4. Tick what you want to see, then **Save**, and **Done** at the top.

Nothing to type: every card finds your MeteoSwiss weather entity by itself.

> No MeteoSwiss card in the list? Restart Home Assistant (see step 2), then reload the page with **Ctrl+F5** (in the app: *Settings → Companion app → Debugging → Reload frontend*).

<br clear="right">

## 4. Show a sensor on a dashboard

Every value (temperature, *Rain soon*, *Frost risk tonight*, *Maximum tomorrow*…) can be shown on its own:

1. **Edit the dashboard → + Add card → By entity**.
2. Search the value, e.g. *Strong gusts* or *Maximum tomorrow*, tick it, then **Continue → Add to dashboard**.

Or the other way round: **Settings → Devices & services → MeteoSwiss Complete For HA →** your place → **Add to dashboard** adds all its values at once.

> A value you do not find may be **disabled** (e.g. *Pressure QNH*): open it in the device page, ⚙️ → **Enabled** → Update.

## 5. Create an automation

Three ways, all without YAML:

- **One click, ready-made** — the [blueprints](#ready-made-automations-blueprints): *Close the awning before strong gusts*, *Rain is coming*, *Frost tonight*, *Weather warning*, *Morning weather*. Click **Import**, choose your sensor and your phone, save.
- **From a yes / no sensor** — **Settings → Automations & scenes → + Create automation → Create new automation → + Add trigger → Entity → State**, choose e.g. *Strong gusts*, **To: On**. Then **+ Add action**, e.g. *Cover → Close*.
- **From a ready-made trigger** — **+ Add trigger → Device →** your MeteoSwiss place, then *Rain arrives soon*, *Thunderstorm warning announced*, *First frost of the season*, *The fog clears*…

## 6. Change the settings

**Settings → Devices & services → MeteoSwiss Complete For HA → ⚙️ Configure**. The menu has six pages:

| Page | Settings |
|---|---|
| **Display** | Pictogram pack: **Animated** (default), **Vivid** or **Classic**. Option **"Show the map page in the sidebar"** (off by default). |
| **Forecast** | Hourly forecast on/off, horizon (48 h by default) and refresh interval. MeteoSwiss hourly files are large: reduce the horizon to save bandwidth. |
| **Pollen, hazards and air** | Pollen station, avalanche region and air quality site (NABEL). "Automatic" picks the one nearest to your home; air quality can be turned off. |
| **Lakes, rivers and fog** | The lakes that get a water temperature sensor (default: the lake nearest to your home, if within 15 km), the **rivers** (FOEN stations; default: the nearest that measures the water temperature, within 20 km) and **fog by region** (on by default). |
| **Rain alert, wind, solar and indoor** | Rain alert from the radar (and how many minutes in advance), the *Strong gusts* threshold (50 km/h by default) and the warning level of *Weather warning in force* (2 = yellow by default), your solar panels (power, tilt, orientation) and indoor sensors (airing). |
| **Watched places and persons** | Postal codes or places, and persons to follow (see [7](#7-add-another-place)). |

The integration reloads by itself after a change.

## 7. Add another place

Two possibilities:

- **Warnings for other places and for where you are**: *⚙️ Configure → Watched places and persons*. Enter postal codes or places (`2053` or `Cernier`, `3000` or `Bern`) and persons to follow (a person or your phone's tracker: the warnings follow you, in Switzerland). Each one becomes a device with the 7 warning sensors and its own triggers, and appears in the *Compare my places* card.
- **A second complete place** (e.g. your chalet): on the integration page, **Add a service**, and choose its station and postal code. You get a second set of entities and can pick it in every card.

## 8. Update

HACS shows the new version → **Download** → **restart Home Assistant** → in the browser **Ctrl+F5** (in the app: *Settings → Companion app → Debugging → Reload frontend*). What changed is in the [CHANGELOG](https://github.com/SashConnection/meteoswiss4HA/blob/main/CHANGELOG.md). Versions follow the calendar: **YEAR.MONTH.N**.

# The cards

<table>
<tr>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-sky-en.png" width="100%" alt="Live sky"><br><b>Live sky</b><br><sub>Sun or moon, clouds, rain, snow — alive</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-tiles.png" width="100%" alt="Tiles"><br><b>Tiles</b><br><sub>Severe weather mini map, animated radar</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-rain-en.png" width="100%" alt="Rain minute by minute"><br><b>Rain minute by minute</b><br><sub>The next 60 minutes, from the radar</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-air-en.png" width="100%" alt="Air quality"><br><b>Air quality</b><br><sub>Ozone, NO₂, fine particles</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-stripes-en.png" width="100%" alt="Climate stripes"><br><b>Climate stripes</b><br><sub>One stripe per year since 1864</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-day-en.png" width="100%" alt="My day"><br><b>My day</b><br><sub>Morning, afternoon, evening, sunrise and sunset</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-wall-en.png" width="100%" alt="Wall screen"><br><b>Wall screen</b><br><sub>Big clock and weather, red night mode</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/map-weather.jpg" width="100%" alt="Switzerland map"><br><b>Switzerland map</b><br><sub>Weather, radar, warnings, hazards, pollen</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-snow-en.png" width="100%" alt="Snow"><br><b>Snow</b><br><sub>Snow depth around you</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-days.png" width="100%" alt="Days"><br><b>Days</b><br><sub>One temperature curve and rain over the next days</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-ephemeris-en.png" width="100%" alt="Ephemeris"><br><b>Ephemeris</b><br><sub>Saint of the day, sun, moon drawn exactly</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-compare-en.png" width="100%" alt="Compare my places"><br><b>Compare my places</b><br><sub>Home and Bern side by side</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-mountain-en.png" width="100%" alt="Mountain"><br><b>Mountain</b><br><sub>0 °C level, snow line, sea of fog, avalanches</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-outing-en.png" width="100%" alt="Should I go out?"><br><b>Should I go out?</b><br><sub>A verdict, what to wear, the best time</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-pollen.jpg" width="100%" alt="Pollen"><br><b>Pollen</b><br><sub>A sketch of each plant, colored by the level</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-rivers-en.png" width="100%" alt="Rivers"><br><b>Rivers</b><br><sub>The Aare in Bern: water, flow, level</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-forecast.png" width="100%" alt="Forecast"><br><b>Forecast</b><br><sub>Compact current weather, hours and days</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-now.png" width="100%" alt="Now"><br><b>Now</b><br><sub>Big pictogram and the next hours</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-tips-en.png" width="100%" alt="Tips of the day"><br><b>Tips of the day</b><br><sub>Laundry, frost, watering, stars, solar…</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-month-en.png" width="100%" alt="Month summary"><br><b>Month summary</b><br><sub>This month vs the normal</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-postcard-en.png" width="100%" alt="Postcard"><br><b>Postcard</b><br><sub>Your town's monument and the weather, to share</sub></td>
</tr>
<tr>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-weather.jpg" width="100%" alt="Detailed weather"><br><b>Detailed weather</b><br><sub>Place, measurements you choose, hourly chart, 9 days</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-lake-short-en.png" width="100%" alt="Lakes"><br><b>Lakes</b><br><sub>27 lakes, water temperature, currents</sub></td>
<td width="33%" valign="top"><img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-fog-en.png" width="100%" alt="Fog by region"><br><b>Fog by region</b><br><sub>Neuchâtel → Chaumont → Chasseral, top and forecast</sub></td>
</tr>
</table>

<sub>Screenshots: Neuchâtel and Bern; lake and fog show real data of 10 November 2026, other values are examples.</sub>

| Card | What it shows | One-click settings |
|---|---|---|
| 🌤️ **Detailed weather** | Place and altitude, pictogram, condition, temperature, station and measuring time, hourly chart (uncertainty band, rain), 9 days (rain, probability, range) | Measurements and their order, chart, days, sun and moon |
| 📅 **Forecast** | Current weather, next hours and days with the animated pictograms | Hours and/or days, how many, details, sun and moon |
| 🕒 **Now** | Big pictogram, place, temperature, next hours | Chart, hours, sun and moon |
| 📈 **Days** | One continuous temperature curve and rain over several days | Number of days, sun and moon |
| ☁️ **Live sky** | The sky of the moment, animated: sun or moon (real phase), clouds, rain, snow, lightning, fog, stars | Animation, dashboard background, sun and moon |
| 🚶 **Should I go out?** | Verdict, rain timing (radar), what to wear, gusts, warnings, pollen, fog and the summit in the sun, best time | Number of hours |
| 🗓️ **My day** | Night, morning, afternoon, evening, temperature curve, sunrise and sunset | Sun and moon |
| 📍 **Compare my places** | Home and your watched places side by side, best place today | Number of days |
| 🖥️ **Wall screen** | Big clock, date, weather, today and tomorrow, warnings, next hours, dark red night mode | Night mode, seconds, hours, sun and moon |
| 🏔️ **Mountain** | 0 °C level, snow line, temperatures by altitude, sea of fog, avalanche danger | Avalanche region, altitude |
| 🌫️ **Fog** | Reference stations from the plain to the summits, fog top, 3-day forecast, map | Region, forecast, map, all regions |
| 🏞️ **Lake** | Water temperature, forecast, oxygen, thermocline, ice, profile, color map with currents and towns | Lake, values, map, depth, charts |
| 🌼 **Pollen** | A sketch of each plant colored by the level, for the stations you choose | Stations, species, layout |
| 🗺️ **Switzerland map** | Weather, radar, radar forecast, warnings, forest fire, floods, drought, avalanches, pollen | Layers, area, zoom, legend, height |
| 🧩 **Tiles** | Severe weather mini map with hazard chips, animated radar | Page opened on tap |
| 💡 **Tips of the day** | The day in one sentence, rain in … min, solar, laundry, frost, watering, stars, sunset, rainbow, foehn, bise, airing, normal, yesterday, records, first frost and snow | Tiles and their order |
| 🌙 **Ephemeris** | Date, saint of the day, week, sunrise and sunset, day length, moon drawn (%, name), moonrise and moonset, next full and new moon | — |
| 💌 **Postcard** | Your town's monument, the weather and the moon, to share or download | Place |
| 🎯 **Guess the maximum** | Bet on the maximum temperature, result in the evening, streak | — |
| 🏷️ **Badge** | Pictogram and temperature at the top of a dashboard, "☂ Rain in 15 min" | Rain alert |
| ☂️ **Rain minute by minute** | Rain at home over the next 60 minutes, bar by bar, when it starts or stops | — |
| 📊 **Climate stripes** | One stripe per year since the station opened, last 10 years vs 1961–1990 | — |
| 🗓️ **Month summary** | This month and last month: mean temperature, rain, sunshine, rain days, frost, summer and hot days, extremes, vs the normal | — |
| 🏊 **Rivers** | Your FOEN stations: water temperature and swimming comfort, discharge, level, flood danger | Stations in the options |
| 🌬️ **Air quality** | Overall level, ozone, NO₂, PM10, PM2.5 against the Swiss standards | Site in the options |
| ❄️ **Snow** | Snow depth and today's change at the stations near home | — |

<a id="card-forecast"></a>

## Forecast

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

<a id="card-weather"></a>

## Detailed weather

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

<a id="card-pollen"></a>

## Pollen

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

<a id="card-now-days-tiles"></a>

## Now, Days and Tiles

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

<a id="card-everyday"></a>

## Live sky, Should I go out?, My day, Compare, Wall screen

| | |
|---|---|
| ![Live sky](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-sky-en.png) | ![Should I go out?](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-outing-en.png) |
| ![My day](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-day-en.png) | ![Compare my places](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-compare-en.png) |

- **Live sky** (`meteoswiss-sky-card`): the sky of the moment drawn and animated behind the place and the temperature — sun or moon on its arc between sunrise and sunset, clouds drifting with the wind, rain, snow, lightning, fog banks, stars. `animate: false` for a still picture (also when the device asks for reduced motion).
- **Should I go out?** (`meteoswiss-outing-card`): a verdict (*Yes, go!*, *with an umbrella*, *better later*, *better stay in*) and the reasons: when the rain starts, what to wear for the temperature and the wind, gusts, warnings in force, pollen, fog with the sunshine altitude, the best 2-hour window, sunset. `hours: 12`.
- **My day** (`meteoswiss-day-card`): night, morning, afternoon and evening with their pictogram, temperatures and rain, above the temperature curve with sunrise and sunset. Today / Tomorrow buttons (tomorrow first after 18:00).
- **Compare my places** (`meteoswiss-compare-card`): home and every watched place, 1 to 5 days, warnings in force, and ★ the best place today (driest, then warmest). Add places in the options (*Watched places and persons*).
- **Wall screen** (`meteoswiss-wall-card`): big clock, date, temperature, today and tomorrow, warnings and the next hours. `night_mode: auto` turns everything dark red once the sun has set (`on` / `off` to force it).

```yaml
type: custom:meteoswiss-outing-card
hours: 12
---
type: custom:meteoswiss-wall-card
night_mode: auto        # auto (sun), on, off
hours: 8
show_seconds: false
```

<a id="card-mountain"></a>

## Mountain

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-mountain-en.png" alt="Mountain" width="380" align="right">

A generic mountain (no names) up to 4,000 m with:

- the **0 °C level** of the local forecast, and its range today and tomorrow;
- the **snow line** when precipitation is expected (≈ 300 m below the 0 °C level, *estimated*);
- **temperatures by altitude**: ● *measured* by a station near you at that altitude (e.g. Chaumont, Chasseral, Moléson), ○ *estimated* between your temperature and the 0 °C level where no station exists;
- the **sea of fog** of your region (see below);
- the **avalanche danger**, with a menu: *my region*, a large region (*Jura, Prealps, Bernese Alps, Valais Alps, Central Switzerland, Northern Grisons, Engadine, Southern Alps*) or *all of Switzerland* (highest level).

```yaml
type: custom:meteoswiss-mountain-card
avalanche_scope: home    # home, switzerland, jura, prealps, bernese, valais, central, grisons, engadine, south
max_altitude: 4000
```

<br clear="right">

<a id="card-fog"></a>

## Fog by region

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-fog-en.png" alt="Fog by region" width="380" align="right">

MeteoSwiss has no "fog top" measurement, so the integration **reads it from the stations**: each region has a ladder of stations from the plain to the summits. A station is *in the fog* when it gets no sun and the air is saturated; a station is *above* when it gets sun (by day) or dry air (by night). The top lies between the two.

| Region | Plain | Hills and summits |
|---|---|---|
| Three Lakes | Neuchâtel 485 m, Payerne 490 m | Chaumont 1136 m, La Frétaz 1205 m, Chasseral 1594 m |
| Lake Geneva | Geneva 411 m, Changins 458 m, Pully 456 m | Bière 684 m, La Dôle 1670 m |
| Fribourg plateau | Payerne 490 m, Grangeneuve 651 m | Plaffeien 1042 m, Moléson 1974 m |
| Bern / Central Plateau | Wynau 422 m, Bern 553 m | Bantiger 942 m, Napf 1404 m |
| Zurich / North-east | Kloten 426 m, Tänikon 539 m, Zurich 604 m | Lägern 845 m, Uetliberg 854 m, Hörnli 1133 m, Säntis 2501 m |
| Central Switzerland | Lucerne 454 m, Mosen 453 m, Egolzwil 522 m | Einsiedeln 911 m, Pilatus 2105 m |
| Basel / North Jura | Basel 316 m, Delémont 439 m | Fahy 596 m, Rünenberg 611 m |
| Ticino | Magadino 203 m, Lugano 273 m, Locarno 367 m | Monte Generoso 1600 m, Cimetta 1661 m |

- **Now**: every 10 minutes from the measurements (sunshine, humidity, dew point, precipitation).
- **Forecast**: hour by hour for 3 days from the local forecast of the same stations (symbols *stratus* and *fog*, low cloud cover, sunshine duration), summed up by day: *Wednesday: low stratus 6–14 h, top ~1,000 m, sunshine above*.
- **Sensors**: `sensor.<location>_fog` (no fog, fog, low stratus, overcast, precipitation; attributes: region, `top_min`, `top_max`, stations, forecast) and `sensor.<location>_fog_top` (estimated top, m).
- **Triggers**: *Fog or low stratus forms* / *The fog clears*.

```yaml
type: custom:meteoswiss-fog-card
region: three_lakes     # default: your region
show_forecast: true
show_map: true
show_all: false         # list of every region
```

The forecast reads three MeteoSwiss hourly files every 6 hours (~90 MB); turn fog off in *Lakes and fog* to save bandwidth.

<br clear="right">

<a id="card-lake"></a>

## Lakes

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-lake-en.png" alt="Lake of Neuchâtel" width="380" align="right">

Data from the **Eawag Alplakes** lake models (CC BY 4.0), for 27 lakes: Geneva, Constance, Neuchâtel, Maggiore, Lucerne, Zurich, Lugano, Thun, Biel, Zug, Brienz, Walen, Murten, Sempach, Hallwil, Gruyère, Joux, Greifen, Sarnen, Ägeri, Baldegg, Sils, Pfäffikon, Silvaplana, Lungern, Poschiavo, St. Moritz.

- **Values you choose** (`measures`): water temperature at 1 m, change over 24 h, next 24 h range (10–90 %), temperature at the bottom, oxygen saturation, thermocline depth, ice, altitude, area, maximum depth, volume.
- **Map** for the 13 lakes with a 3D model (Geneva, Neuchâtel, Biel, Murten, Zurich, Zug, Lucerne, Lugano, Joux, Hallwil, Greifen, Ägeri, St. Moritz): the lake drawn in color by temperature, **currents** as arrows, the **lakeside towns** with the water temperature in front of them, the warmest and coldest spots. A slider goes from yesterday to +4 days; the depth menu shows 1 to 50 m.
- **Forecast** at 1 m with its 10–90 % range, and the **profile** from the surface to the bottom (temperature, oxygen, thermocline).
- **Sensors**: one `Water temperature <lake>` sensor per lake chosen in *Lakes and fog*, with the forecast and all values as attributes — e.g. "notify me when Lake Neuchâtel reaches 20 °C".

```yaml
type: custom:meteoswiss-lake-card
lake: neuchatel
measures: [trend, range, bottom, oxygen, thermocline, ice, altitude, area, max_depth, volume]
show_map: true
show_forecast: true
show_profile: true
depth: 1
```

<br clear="right">


<a id="card-tips"></a>

## Tips of the day

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-tips-en.png" alt="Tips of the day" width="380" align="right">

One card, the tiles you choose: **the day in one sentence**, **rain in … minutes** (radar), **solar production** today and tomorrow, **laundry drying** (best time), **frost tonight** (plants and windscreen), **garden watering** (water balance of the last 5 days), **stars tonight** (clouds and moon), **sunset** (colorful or dull), **rainbow** (possible right now), **foehn**, **bise**, **airing** (indoor vs outdoor humidity), **vs the 1991–2020 normal**, **yesterday**, **records of the year**, **first frost** and **first snow**. Good news is shown in green. Tap a tile for its details.

Each tip is also a sensor for your automations, and several have a ready-made trigger: *Rain arrives soon*, *First frost of the season*, *First snow*, *Rainbow possible*, *Beautiful sunset expected*, *Foehn blows*, *Bise blows*.

<br clear="right">

<a id="card-ephemeris"></a>

## Sun, moon and ephemeris

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-ephemeris-en.png" alt="Ephemeris" width="380" align="right">

In the editor of the weather, forecast, now, days, my day, sky and wall cards, the **Sun and moon** section adds: sunrise and sunset, day length (and the change since yesterday), the **moon phase drawn for the exact day** with its % and name, moonrise and moonset, next full and new moon, and the **ephemeris** (saint of the day, week and day number) — in the language of the card. The **Ephemeris** card shows all of it at once.

Sensors: *Moon phase*, *Day length*, *Saint of the day*.

<br clear="right">

<a id="rain-solar-airing"></a>

## Rain arriving, solar panels, airing

**Settings → Devices & services → MeteoSwiss Complete For HA → Configure → Rain alert, solar and indoor**:

- **Rain alert**: on by default; choose how many minutes in advance (20 by default). The sensor *Rain arrives in* gives the minutes, and the *Rain arrives soon* trigger notifies you in time to bring the laundry in.
- **Solar panels**: enter the peak power (kWp), tilt and orientation — the sensors *Solar production today / tomorrow* give the kWh and the best hour, hour by hour in their attributes. Perfect to start the dishwasher or charge the car at the right time.
- **Indoor sensors**: choose your indoor temperature and humidity sensors; *Airing* tells when opening the windows dries the house.

<a id="card-postcard"></a>

## Postcard, guessing game, badge, ambiance color, dashboard background

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-postcard-en.png" alt="Weather postcard" width="300" align="right">

- **Weather postcard** (`meteoswiss-postcard-card`): your town's monument, the weather of the moment and the moon on a postcard — **Share** (phone) or **Download**.
- **Guess the maximum** (`meteoswiss-guess-card`): guess today's maximum, see the measured result in the evening, keep your streak.
- **Badge** (`meteoswiss-badge`): the pictogram and the temperature at the top of a dashboard, with "☂ Rain in 15 min" when it is coming.
- **Ambiance color**: the sensor gives a color for the weather and time of day (`rgb_color` attribute) for a smart light.
- **Dashboard background**: the live sky card with *As dashboard background* draws the animated sky behind your cards (use a theme with a transparent view background).

<br clear="right">

<a id="card-rain"></a>

## Rain minute by minute

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-rain-en.png" alt="Rain minute by minute" width="320" align="right">

The radar followed upstream of your home, every 5 minutes for the next hour: *Rain in 20 min*, *Raining — stops in about 15 min* or *No rain in the next hour*. Needs the rain alert (on by default).

<br clear="right">

<a id="card-stripes"></a>

## Climate stripes and month summary

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-stripes-en.png" alt="Climate stripes" width="320" align="right">

**Climate stripes**: one stripe per year since your station opened (since 1864 in Neuchâtel or Bern), from blue (cool) to red (warm), and how much warmer the last 10 years are than 1961–1990.

<a id="card-month"></a>**Month summary**: this month so far and last month — mean temperature, rain, sunshine, rain days, frost, summer and hot days, extremes — compared with the 1991–2020 normal (for the month in progress, with the share of the normal for the days already past).

<br clear="right">

<a id="card-rivers"></a>

## Rivers

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-rivers-en.png" alt="Rivers" width="320" align="right">

The FOEN measures about 230 rivers and lakes every 10 minutes. Choose yours in *⚙️ Configure → Lakes, rivers and fog* (by default the nearest that measures the water temperature: the Aare in Bern, the Broye in Payerne…). Each one gets a *Water temperature* sensor (with the swimming comfort) and a *Discharge* or *Water level* sensor; the card shows them all, with the flood danger level (1 to 5).

<br clear="right">

<a id="card-air"></a>

## Air quality

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-air-en.png" alt="Air quality" width="320" align="right">

The national monitoring network NABEL (16 sites, e.g. Chaumont, Bern, Payerne): ozone now, NO₂, PM10 and PM2.5 over 24 hours, against the Swiss air quality standards. Sensors *Air quality* (good, elevated, high, very high), *Ozone*, *Nitrogen dioxide*, *PM10*, *PM2.5*, and *Ozone peak* (on above 120 µg/m³). The nearest site is used; choose another one or turn it off in *Pollen, hazards and air*.

<br clear="right">

<a id="card-snow"></a>

## Snow

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/card-snow-en.png" alt="Snow" width="320" align="right">

The automatic snow depth of the 6 MeteoSwiss stations nearest to home, with the change since midnight. Sensor *Snow depth* (nearest station, the others as attributes).

<br clear="right">

<a id="sun-and-moon"></a>

# Sun and moon

## The sun: sunrise, sunset and day length

**Sunrise and sunset** are computed for your home, to the minute, with nothing to download. You find them:

- in the **"Sun and moon"** section of most cards, with the **day length** and the change since yesterday ("9 h 29, −3 min vs yesterday");
- in the **ephemeris**, in large;
- in **"My day"**: the night is shaded on the temperature curve, with the sunrise ☀ and sunset ☾ times;
- in the **live sky**: the sun follows its real path between sunrise and sunset, dawn and dusk color the sky, then the moon and the stars take over;
- in **"Should I go out?"** ("Sunset 16:58") and in the wall screen's **automatic night mode**, which turns dark red at sunset;
- in the **tips of the day**: "Beautiful sunset" when the clouds promise colors.

For your automations: the **Day length** sensor (with sunrise, sunset and the change since yesterday) and the **"Beautiful sunset expected"** trigger.

## The moon, drawn for the exact day

The moon is not a stock icon: it is **drawn for the exact phase of the day**, the lit part at the right percentage, with craters and the dark side in night blue. It appears in the ephemeris, in the cards' "Sun and moon" section, in the live sky and on the postcard, with the **phase name in your language** and the **% illuminated**.

![The moon phases](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/moon-phases-en.png)

<a id="card-map"></a>

# Switzerland map

Add the **MeteoSwiss map** card to a dashboard (or turn on the sidebar page, see [Change the settings](#6-change-the-settings)). The toolbar at the top left switches maps; the **colored line** above each button shows the highest danger level currently in force in Switzerland.

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

## One map per hazard, or zoomed on your region

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

## On a phone

<img src="https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/mobile.jpg" alt="On a phone" width="300">

On a narrow screen the legend becomes one compact line and the tabs use icons. On the sidebar page, the ☰ button opens the Home Assistant menu.

# Automations

Everything here is chosen in menus: see [Create an automation](#5-create-an-automation).

## Yes / no sensors

They are **on** when something is happening or needs doing — an automation only needs *"when it turns on"*.

| Sensor | On when… |
|---|---|
| ☔ **Raining now** | the station measured rain in the last 10 minutes, or the radar sees rain at home |
| 🌧️ **Rain soon** | the radar sees rain reaching home within the alert time (20 min by default); attribute `minutes` |
| 💨 **Strong gusts** | gusts reach the threshold (50 km/h by default) now or in the next 3 hours — close the awning; attributes: peak and its time |
| ⚠️ **Weather warning in force** | a MeteoSwiss warning at home reaches the chosen level (2 = yellow by default); attributes: which warnings, highest level, upcoming |
| ❄️ **Frost risk tonight** | frost is possible or likely in the coming night |
| 👕 **Good for drying laundry** | the rest of today is good to dry laundry outside |
| 🌫️ **Fog at home** | fog or low stratus in your region now |
| 🪴 **Watering needed** | the water balance of the last days says the garden needs water |
| 🪟 **Air the rooms now** | opening the windows dries the house (only with your indoor sensors) |
| 🚗 **Frozen windscreen tomorrow morning** | the morning (5–8 h) will be below zero, or close to zero under a clear sky |
| 🌱 **Good day to mow** | March to October, dry now and for the rest of the day, warm enough |
| 🌙 **Cool night: air tonight** | a warm day (25 °C or more) followed by a night at 18 °C or less — open the windows to cool the house |
| 🫁 **Ozone peak** | ozone above the Swiss standard (120 µg/m³) at the NABEL site |

The thresholds are in *⚙️ Configure → Rain alert, wind, solar and indoor*.

## Forecast numbers

Plain numbers, for *"if the maximum tomorrow is above 30 °C…"*:

| Sensor | Value |
|---|---|
| **Maximum today / tomorrow**, **Minimum today / tomorrow** | °C of the local forecast |
| **Precipitation today / tomorrow** | mm |
| **Rain probability today / tomorrow** | % (highest hourly probability of the day) |
| **Strongest gust today** | km/h still expected today, with its time |
| **Rain arrives in** | minutes before the rain reaches home (radar); the 60-minute timeline as attribute |
| **Feels like** | °C: wind chill in the cold, heat index in the heat |
| **Pressure trend (3 h)** | hPa per 3 hours: falling fast, falling, steady, rising, rising fast |
| **Snow depth** | cm at the nearest station that measures it |
| **Water temperature / Discharge / Water level** *(river)* | °C, m³/s, m of your FOEN stations |
| **Ozone**, **Nitrogen dioxide**, **PM10**, **PM2.5** | µg/m³ at the NABEL site |

Use them with **+ Add trigger → Entity → Numeric state**, e.g. *Minimum tomorrow* below 0 → cover the plants.

<a id="ready-made-triggers"></a>

## Ready-made triggers

**+ Add trigger → Device →** your MeteoSwiss place, then:

- weather warnings: *Thunderstorm warning announced* (an upcoming warning is published), *Rain warning starts / ends*, *Wind warning reaches a level* (2 to 5) — also for your watched places and persons;
- *Forest fire / Flood / Drought / Avalanche danger reaches a level*, *Pollen reaches a level*;
- *Fog or low stratus forms*, *The fog clears*;
- *Rain arrives soon*, *First frost of the season*, *First snow of the season*, *Rainbow possible*, *Beautiful sunset expected*, *Foehn blows*, *Bise blows*.

## Ready-made automations (blueprints)

Click **Import**, confirm, then **Create automation** from the blueprint: choose your sensor, your phone (Home Assistant app) or your covers, save. The texts of the messages can be changed in your language.

| Automation | What it does | |
|---|---|---|
| 💨 **Close the awning before strong gusts** | Closes awnings, blinds or shutters when *Strong gusts* turns on (optionally also when it rains) | [![Import](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Fclose_awning_wind.yaml) |
| 🌧️ **Rain is coming** | Notifies your phone: *"Rain reaches home in about 15 minutes"* | [![Import](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Frain_alert.yaml) |
| ❄️ **Frost tonight** | In the evening, warns you when frost is expected, with the minimum | [![Import](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Ffrost_alert.yaml) |
| ⚠️ **Weather warning** | Notifies you when a warning comes into force at home | [![Import](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Fweather_warning.yaml) |
| 🚗 **Frozen windscreen** | In the evening, warns you when the windscreen will be frozen tomorrow morning | [![Import](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Fwindshield_frost.yaml) |
| ☀️ **Morning weather** | Every morning, the day in one sentence, the maximum and the rain probability — on your phone and, if you like, read aloud by a speaker | [![Import](https://my.home-assistant.io/badges/blueprint_import.svg)](https://my.home-assistant.io/redirect/blueprint_import/?blueprint_url=https%3A%2F%2Fgithub.com%2FSashConnection%2Fmeteoswiss4HA%2Fblob%2Fmain%2Fblueprints%2Fautomation%2Fmeteoswiss4ha%2Fmorning_briefing.yaml) |

## Calendar and Energy dashboard

- **Weather calendar** (`calendar.<location>_weather_calendar`): weather warnings in force and announced, full and new moons, hot days (30 °C or more), frost and heavy rain of the forecast. It shows in the Home Assistant calendar and can trigger automations (*Calendar event starts*).
- **Energy dashboard**: when your solar panels are set (*Rain alert, wind, solar and indoor*), **Settings → Dashboards → Energy → Solar panels → Solar production forecast** offers *MeteoSwiss Complete For HA*: the estimated production appears in the Energy charts.

# All entities

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
| `sensor.<location>_moon_phase`, `_day_length`, `_saint_of_the_day` | Moon phase (illumination, next full / new moon), day length (sunrise, sunset), saint of the day (week, day number). |
| `sensor.<location>_today_in_a_sentence`, `_ambiance_color` | The day in one sentence (Home Assistant language); a color for your lights (`rgb_color`). |
| `sensor.<location>_rain_arrives_in` | Minutes before the rain reaches home (radar). |
| `sensor.<location>_laundry_drying`, `_frost_tonight`, `_garden_watering`, `_stargazing_tonight`, `_sunset`, `_rainbow`, `_foehn`, `_bise`, `_airing` | Everyday tips (states translated), details as attributes. |
| `sensor.<location>_solar_production_today`, `_tomorrow` | Estimated kWh of your panels, hour by hour. |
| `sensor.<location>_temperature_vs_normal`, `_yesterday_s_maximum`, `_warmest_of_the_year`, `_coldest_of_the_year`, `_strongest_gust_of_the_year`, `_first_frost_of_the_season`, `_first_snow_of_the_season` | History of your station: normal 1991–2020, yesterday, records, first frost and snow. |
| `sensor.<location>_fog`, `_fog_top` | Fog / low stratus in your region and the estimated top (m). |
| `sensor.<location>_water_temperature_<lake>` | Water temperature of a lake (1 m), with forecast, oxygen, thermocline, ice and lake facts as attributes. |
| `binary_sensor.<location>_raining_now`, `_rain_soon`, `_strong_gusts`, `_weather_warning_in_force`, `_frost_risk_tonight`, `_good_for_drying_laundry`, `_fog_at_home`, `_watering_needed`, `_air_the_rooms_now` | Yes / no sensors for automations (see [above](#yes--no-sensors)). |
| `sensor.<location>_maximum_today`, `_minimum_today`, `_maximum_tomorrow`, `_minimum_tomorrow`, `_precipitation_today`, `_precipitation_tomorrow`, `_rain_probability_today`, `_rain_probability_tomorrow`, `_strongest_gust_today` | Forecast numbers. |
| `binary_sensor.<location>_frozen_windscreen_tomorrow_morning`, `_good_day_to_mow`, `_cool_night_air_tonight`, `_ozone_peak` | More yes / no sensors. |
| `sensor.<location>_feels_like`, `_pressure_trend_3_h`, `_snow_depth` | Feels-like temperature, pressure trend (with `trend`), snow depth (stations around as attributes). |
| `sensor.<location>_water_temperature_<station>`, `_discharge_<station>`, `_water_level_<station>` | Rivers (FOEN): values, flood danger, swimming comfort. |
| `sensor.<location>_air_quality`, `_ozone`, `_nitrogen_dioxide`, `_pm10`, `_pm2_5` | Air quality (NABEL). |
| `calendar.<location>_weather_calendar` | Weather calendar. |

The entity ids above are those of an English Home Assistant; they follow the language set when the integration was added.

For those who like YAML: a notification as soon as a thunderstorm warning is announced.

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

# Languages, pictograms and monuments

Everything — settings, entities, cards and map — speaks **Deutsch, Français, Italiano, Rumantsch and English**. By default the cards follow the Home Assistant language; each card can also be set to another one.

![The pollen card in five languages](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/languages.jpg)

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

Each town of the map has its own line pictogram of its best-known monument — the Zytglogge in Bern, the Jet d’eau in Geneva, the Kapellbrücke in Lucerne, the Matterhorn in Zermatt… They appear on the map labels and next to the place name in the cards (option `monument: false` to hide them).

![Monuments](https://raw.githubusercontent.com/SashConnection/meteoswiss4HA/main/docs/images/monuments.png)

# Troubleshooting

| Problem | Solution |
|---|---|
| No MeteoSwiss card in *Add card* | Restart Home Assistant once after installing (*Settings → Repairs* has a button for it), then Ctrl+F5. Search **MeteoSwiss**. |
| The cards did not change after an update | Ctrl+F5 in the browser; in the mobile app, *App settings → Debugging → Reload frontend*. |
| The map is off-center | **⌖** button under the zoom. |
| "The radar is not available at the moment" | The project's radar server does not answer; it recovers by itself, try again later. |
| No hourly forecast | Turn on the **hourly forecast** in the settings (Forecast page). |
| A warning or hazard is "unavailable" | Its source (MeteoSwiss/MeteoAlarm, FOEN, SLF) does not answer; the value comes back at the next update. |
| The fog card says "unavailable" | Turn on *Fog and low stratus by region* in *Lakes and fog*. |
| A lake card stays empty | The Eawag server limits the number of requests; the card retries at the next refresh. |

# Technical notes

- **Bandwidth**: MeteoSwiss publishes one hourly forecast file per parameter for all ~5,800 points (~33 MB each). The integration streams them and stops once the requested horizon is reached (~8 MB per parameter for 48 h).
- **Fog**: the forecast reads three whole hourly files (low clouds, sunshine, symbol: ~90 MB) every 6 hours; the measurements come with the current conditions (no extra download). The top altitude is an estimate between two stations.
- **History and normals**: the station's daily values of the year (~50 kB, every 3 hours); the 1991–2020 normals are computed once a week from its full daily history (~6 MB).
- **Rain alert**: two radar images every 5 minutes (a few kB), compared around your home to follow the rain.
- **Sun and moon**: computed in Home Assistant and in the browser, nothing downloaded.
- **Rivers**: one small query (~60 kB) every 10 minutes to the federal linked data service LINDAS for all FOEN stations.
- **Air quality**: the FOEN NABEL table (~16 kB) once an hour.
- **Snow and pressure trend**: today's 10-minute values of your station every 10 minutes (~8 kB), and of the 6 nearest snow stations once an hour.
- **Lakes**: the Eawag Alplakes API is called once per hour per chosen lake, one request at a time; the cards' map layers are cached for 3 hours.
- **Radar**: the radar images and the precipitation forecast are prepared by a server run by the project (`ha.jesaispas.ch`) from MeteoSwiss data; Home Assistant downloads them from there. If this server does not answer, the map says the radar is not available for the moment.
- **Pictograms**: generated by `node scripts/generate_icons.mjs` (vivid and classic packs, `THEMES` / `SPEC`) and `scripts/animated_icons.mjs` (animated pack). The animations stop when the device asks for reduced motion.

# Data sources and license

Data: **Source: MeteoSwiss** — Open Government Data under [CC BY 4.0](https://opendatadocs.meteoswiss.ch/general/terms-of-use). Symbol descriptions are the official MeteoSwiss texts.
Weather warnings: MeteoSwiss, published through [MeteoAlarm](https://meteoalarm.org) (EUMETNET, CC BY 4.0); they are not part of the MeteoSwiss Open Data catalogue. MeteoAlarm uses 4 colors, so MeteoSwiss levels 4 and 5 both show as level 4.
Natural hazards: FOEN (forest fire, floods, drought) and SLF (avalanches). Base map © swisstopo.
Rivers: FOEN (BAFU) hydrological data, provisional, through [LINDAS](https://lindas.admin.ch). Air quality: NABEL (FOEN / Empa), provisional data.
Lakes: [Eawag Alplakes](https://www.alplakes.eawag.ch) (Simstrat, MITgcm and Delft3D models), CC BY 4.0. Lake facts (altitude, area, depth, volume) are rounded reference values.
This project is not affiliated with or endorsed by MeteoSwiss. The pictograms are original artwork, not the official MeteoSwiss pictograms.

Code and pictograms: MIT License.

# What's new, version by version

**2026.11.13** — the big one
- **Rivers** (FOEN): the Aare in Bern and about 230 stations — water temperature with swimming comfort, discharge, level, flood danger. New *Rivers* card.
- **Air quality** (NABEL): ozone, NO₂, PM10, PM2.5, overall level and an *Ozone peak* sensor. New *Air quality* card.
- **Snow depth** at the stations around you, **feels-like temperature**, **pressure trend**. New *Snow* card.
- New cards **Rain minute by minute**, **Climate stripes** (since 1864) and **Month summary**.
- **Weather calendar** and your **solar forecast in the Energy dashboard**.
- **Automations made easy**: yes / no sensors (*Raining now*, *Rain soon*, *Strong gusts*, *Weather warning in force*, *Frost risk tonight*, *Frozen windscreen tomorrow morning*, *Good day to mow*, *Cool night*, *Good for drying laundry*, *Fog at home*, *Watering needed*, *Air the rooms now*, *Ozone peak*), forecast numbers (maximum and minimum today and tomorrow, rain, gusts) and **6 one-click automations**.
- **Sun, moon and ephemeris** in the cards: sunrise, sunset, day length, the moon drawn for the exact day, saint of the day. New *Ephemeris* card.
- **Tips of the day**: laundry, frost, watering, stars, sunset, rainbow, foehn, bise, airing, solar production, the day in one sentence. **Station history**: yesterday, the 1991–2020 normal, records, first frost and snow.
- **Escape the fog**: the nearest summit in the sun. **Lakes**: swimming comfort. **Fun**: postcard, guessing game, badge, ambiance color, live sky as background.
- **No YAML, ever**: every card has a clear editor with sections; card names in your language; restart reminder and one-click restart in *Repairs*; new step-by-step guide.

**2026.11.12** — The Switzerland map escapes the texts coming from the federal feeds (security).

**2026.11.11** — Ready for the HACS default catalogue.

**2026.11.10** — **Fog by region** (sea of fog now and for 3 days, with its top), **27 lakes** (water temperature, forecast, oxygen, currents drawn in color), the **Mountain** card (0 °C level, snow line, avalanches) and the everyday cards: **live sky**, **Should I go out?**, **My day**, **Compare my places**, **wall screen**.

**2026.11.9** — A **monument** drawn for each town of the map.

**2026.11.8** — **Watched places and followed persons** with their warnings, **ready-made automation triggers** in 5 languages, and the **Now**, **Days** and **Tiles** cards.

**2026.11.7** — New presentation page, 24-hour times everywhere.

**2026.11.6** — Everything in **5 languages**: German, French, Italian, Romansh and English.

**2026.11.5** — The **pollen card** with a sketch of each plant.

**2026.11.2 – 2026.11.4** — The **detailed weather card** (measurements of your choice, hourly chart with the uncertainty band, 9 days) and the logo.

**2026.11.0 – 2026.11.1** — First release: weather entity, station measurements, forecast, pollen, natural hazards and weather warnings, **animated pictograms**, the **forecast card** and the **Switzerland map** with the radar.

The details are in the [CHANGELOG](https://github.com/SashConnection/meteoswiss4HA/blob/main/CHANGELOG.md).
