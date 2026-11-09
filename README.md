# MeteoSwiss Open Data for Home Assistant

A Home Assistant custom integration that brings official [MeteoSwiss Open Data](https://opendatadocs.meteoswiss.ch/) into Home Assistant:

- **Current conditions** from the nearest SwissMetNet automatic weather station (updated every 10 minutes).
- **Local forecasts** for any of the ~5,800 MeteoSwiss forecast points (postal codes, stations, mountain points): hourly and daily, up to 9 days.
- **Two condition values**: the standard Home Assistant condition (works with every weather card) and the native MeteoSwiss weather symbol code (1–42 day, 101–142 night) with its official description and a dedicated pictogram set.

> Status: under development (v0.1.0).

## Installation (HACS)

1. In HACS, open the menu → **Custom repositories**.
2. Add `https://github.com/SashConnection/meteoswiss4HA` with category **Integration**.
3. Install **MeteoSwiss Open Data** and restart Home Assistant.
4. Go to **Settings → Devices & services → Add integration** and search for **MeteoSwiss Open Data**.

Requires Home Assistant 2026.1 or newer.

## Data source and license

Data: **Source: MeteoSwiss** — published as Open Government Data under [CC BY 4.0](https://opendatadocs.meteoswiss.ch/general/terms-of-use).
This project is not affiliated with or endorsed by MeteoSwiss. The pictograms shipped with this integration are original artwork and are not the official MeteoSwiss pictograms.

Code: MIT License.
