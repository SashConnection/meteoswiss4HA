// MeteoSwiss Complete For HA - Switzerland map.
//
// Two custom elements share the same map:
//   <meteoswiss-panel>     full page in the sidebar
//   <meteoswiss-map-card>  dashboard card (type: custom:meteoswiss-map-card)
//
// Data comes from the integration (/api/meteoswiss4ha/...). Base map: swisstopo
// relief shading and FOEN lakes (geo.admin.ch WMTS) with a bundled, simplified
// Switzerland outline (swissBOUNDARIES3D).

import * as L from "./leaflet/leaflet-src.esm.js";
import "./meteoswiss-forecast.js";
import "./meteoswiss-weather-card.js";
import "./meteoswiss-pollen-card.js";

const BASE = new URL(".", import.meta.url).href;
const WMTS = (layer, ext = "png") =>
  `https://wmts.geo.admin.ch/1.0.0/${layer}/default/current/3857/{z}/{x}/{y}.${ext}`;

const CH_BOUNDS = [[45.75, 5.9], [47.85, 10.55]];

const LAYERS = ["weather", "radar", "warnings", "fire", "flood", "drought", "avalanche", "pollen"];
const HAZARDS = ["fire", "flood", "drought", "avalanche"];
const ICONS = {
  weather: "mdi:weather-partly-cloudy",
  radar: "mdi:weather-pouring",
  warnings: "mdi:alert",
  fire: "mdi:pine-tree-fire",
  flood: "mdi:home-flood",
  drought: "mdi:weather-sunny-alert",
  avalanche: "mdi:snowflake-alert",
  pollen: "mdi:flower-pollen",
};

// Swiss / European 5-level natural hazard scale.
const DANGER_COLORS = ["#c8c8c8", "#ccff66", "#ffff00", "#ff9900", "#ff0000", "#8b0000"];
const POLLEN_COLORS = ["#c8c8c8", "#ccff66", "#ffff00", "#ff9900", "#ff0000"];
// MeteoSwiss precipitation scale (mm/h), same colors as the radar frames.
const RAIN_SCALE = [
  ["#9a7e95", "0.1 – 1"], ["#0001fc", "1 – 2"], ["#058c2d", "2 – 4"], ["#05ff05", "4 – 6"],
  ["#feff01", "6 – 10"], ["#ffc703", "10 – 20"], ["#ff7d01", "20 – 40"], ["#ff1900", "> 40"],
];
// MeteoSwiss weather warning kinds (MeteoAlarm feed), in the site's order.
const WARNING_KINDS = ["rain", "thunderstorm", "wind", "snow", "slippery_roads", "heat", "frost"];
const WARNING_ICONS = {
  rain: "mdi:weather-pouring", thunderstorm: "mdi:weather-lightning", wind: "mdi:weather-windy",
  snow: "mdi:weather-snowy-heavy", slippery_roads: "mdi:snowflake-melt", heat: "mdi:thermometer-high",
  frost: "mdi:snowflake-thermometer",
};
const FRAME_MS = 350;   // time per radar frame (3 hours ≈ 13 s)
const FADE_MS = 250;    // cross-fade between frames

const LINKS = {
  fr: { warnings: "https://www.meteosuisse.admin.ch/services-et-publications/applications/dangers.html", hazards: "https://www.dangers-naturels.ch", avalanche: "https://www.slf.ch/fr/" },
  de: { warnings: "https://www.meteoschweiz.admin.ch/service-und-publikationen/applikationen/gefahren.html", hazards: "https://www.naturgefahren.ch", avalanche: "https://www.slf.ch/de/" },
  it: { warnings: "https://www.meteosvizzera.admin.ch/servizi-e-pubblicazioni/applicazioni/pericoli.html", hazards: "https://www.pericoli-naturali.ch", avalanche: "https://www.slf.ch/it/" },
  rm: { warnings: "https://www.meteoschweiz.admin.ch/service-und-publikationen/applikationen/gefahren.html", hazards: "https://www.naturgefahren.ch", avalanche: "https://www.slf.ch/de/" },
  en: { warnings: "https://www.meteoswiss.admin.ch/services-and-publications/applications/hazards.html", hazards: "https://www.natural-hazards.ch", avalanche: "https://www.slf.ch/en/" },
};

const I18N = {
  fr: {
    title: "MétéoSuisse", recenter: "Recentrer", today: "Aujourd’hui", home: "Domicile", error: "Données indisponibles",
    layer: { weather: "Météo", radar: "Radar", warnings: "Intempéries", fire: "Incendies de forêt", flood: "Crues", drought: "Sécheresse", avalanche: "Avalanches", pollen: "Pollen" },
    heading: {
      weather: "Prévisions météo", radar: "Radar des précipitations", warnings: "Alertes intempéries", fire: "Danger d’incendie de forêt", flood: "Danger de crues",
      drought: "Danger de sécheresse", avalanche: "Danger d’avalanches", pollen: "Pollen (mesures)",
    },
    warnNone: "Pas d’alerte", warnFrom: "du", warnTo: "au", warnSoon: "à venir", warnNote: "Alertes officielles de MétéoSuisse (via MeteoAlarm). Les alertes à venir sont en pointillés.", warnLink: "Dangers actuels (MétéoSuisse)",
    warnKinds: { rain: "Pluie", thunderstorm: "Orages", wind: "Vent", snow: "Neige", slippery_roads: "Routes glissantes", heat: "Canicule", frost: "Gel" },
    legend: "Légende", rain: "Intensité (mm/h)", radarNote: "Radar MétéoSuisse, 3 dernières heures, une image toutes les 5 minutes.", noRadar: "Le radar n’est pas disponible pour le moment.", forecastLabel: "Prévision", forecastNote: "Ensuite, en orange sur le curseur : prévision de pluie heure par heure (prévisions locales MétéoSuisse, interpolées).", radarSetup: "Radar non configuré : indiquez l’URL du serveur radar dans Paramètres → Appareils et services → MeteoSwiss Complete For HA → Configurer → Affichage.", levels: "Degrés de danger", updated: "Mise à jour le",
    explain: "Explication des degrés de danger", bulletin: "Bulletin d’avalanches (SLF)",
    danger: ["Pas de bulletin", "Aucun danger ou faible danger", "Danger limité", "Danger marqué", "Fort danger", "Très fort danger"],
    pollenLevels: ["Aucun", "Faible", "Moyen", "Fort", "Très fort"],
    pollenNote: "Mesures des 15 stations SwissPollen, moyenne sur 24 heures.",
    noBulletin: "Pas de bulletin d’avalanches publié actuellement (hors saison).",
    species: { hazel: "Noisetier", alder: "Aulne", birch: "Bouleau", ash: "Frêne", beech: "Hêtre", oak: "Chêne", grasses: "Graminées" },
  },
  de: {
    title: "MeteoSchweiz", recenter: "Zentrieren", today: "Heute", home: "Zuhause", error: "Daten nicht verfügbar",
    layer: { weather: "Wetter", radar: "Radar", warnings: "Unwetter", fire: "Waldbrand", flood: "Hochwasser", drought: "Trockenheit", avalanche: "Lawinen", pollen: "Pollen" },
    heading: {
      weather: "Wetterprognose", radar: "Niederschlagsradar", warnings: "Unwetterwarnungen", fire: "Waldbrandgefahr", flood: "Hochwassergefahr",
      drought: "Trockenheitsgefahr", avalanche: "Lawinengefahr", pollen: "Pollen (Messungen)",
    },
    warnNone: "Keine Warnung", warnFrom: "von", warnTo: "bis", warnSoon: "bevorstehend", warnNote: "Offizielle Warnungen von MeteoSchweiz (über MeteoAlarm). Bevorstehende Warnungen sind gestrichelt.", warnLink: "Aktuelle Gefahren (MeteoSchweiz)",
    warnKinds: { rain: "Regen", thunderstorm: "Gewitter", wind: "Wind", snow: "Schnee", slippery_roads: "Glätte", heat: "Hitze", frost: "Frost" },
    legend: "Legende", rain: "Intensität (mm/h)", radarNote: "MeteoSchweiz-Radar, letzte 3 Stunden, ein Bild alle 5 Minuten.", noRadar: "Das Radar ist im Moment nicht verfügbar.", forecastLabel: "Prognose", forecastNote: "Danach, orange auf dem Regler: stündliche Niederschlagsprognose (MeteoSchweiz-Lokalprognosen, interpoliert).", radarSetup: "Radar nicht eingerichtet: URL des Radar-Servers unter Einstellungen → Geräte & Dienste → MeteoSwiss Complete For HA → Konfigurieren → Anzeige eintragen.", levels: "Gefahrenstufen", updated: "Aktualisiert am",
    explain: "Erklärung der Gefahrenstufen", bulletin: "Lawinenbulletin (SLF)",
    danger: ["Kein Bulletin", "Keine oder geringe Gefahr", "Mässige Gefahr", "Erhebliche Gefahr", "Grosse Gefahr", "Sehr grosse Gefahr"],
    pollenLevels: ["Keine", "Schwach", "Mässig", "Stark", "Sehr stark"],
    pollenNote: "Messungen der 15 SwissPollen-Stationen, Mittel über 24 Stunden.",
    noBulletin: "Zurzeit kein Lawinenbulletin publiziert (ausserhalb der Saison).",
    species: { hazel: "Hasel", alder: "Erle", birch: "Birke", ash: "Esche", beech: "Buche", oak: "Eiche", grasses: "Gräser" },
  },
  it: {
    title: "MeteoSvizzera", recenter: "Centrare", today: "Oggi", home: "Casa", error: "Dati non disponibili",
    layer: { weather: "Meteo", radar: "Radar", warnings: "Maltempo", fire: "Incendi boschivi", flood: "Piene", drought: "Siccità", avalanche: "Valanghe", pollen: "Polline" },
    heading: {
      weather: "Previsioni meteo", radar: "Radar delle precipitazioni", warnings: "Allerte maltempo", fire: "Pericolo d’incendi boschivi", flood: "Pericolo di piene",
      drought: "Pericolo di siccità", avalanche: "Pericolo di valanghe", pollen: "Polline (misure)",
    },
    warnNone: "Nessuna allerta", warnFrom: "dal", warnTo: "al", warnSoon: "imminente", warnNote: "Allerte ufficiali di MeteoSvizzera (tramite MeteoAlarm). Le allerte imminenti sono tratteggiate.", warnLink: "Pericoli attuali (MeteoSvizzera)",
    warnKinds: { rain: "Pioggia", thunderstorm: "Temporali", wind: "Vento", snow: "Neve", slippery_roads: "Strade sdrucciolevoli", heat: "Canicola", frost: "Gelo" },
    legend: "Legenda", rain: "Intensità (mm/h)", radarNote: "Radar MeteoSvizzera, ultime 3 ore, un’immagine ogni 5 minuti.", noRadar: "Il radar non è disponibile al momento.", forecastLabel: "Previsione", forecastNote: "Poi, in arancione sul cursore: previsione oraria delle precipitazioni (previsioni locali MeteoSvizzera, interpolate).", radarSetup: "Radar non configurato: inserire l’URL del server radar in Impostazioni → Dispositivi e servizi → MeteoSwiss Complete For HA → Configura → Visualizzazione.", levels: "Gradi di pericolo", updated: "Aggiornato il",
    explain: "Spiegazione dei gradi di pericolo", bulletin: "Bollettino valanghe (SLF)",
    danger: ["Nessun bollettino", "Pericolo debole o assente", "Pericolo moderato", "Pericolo marcato", "Pericolo forte", "Pericolo molto forte"],
    pollenLevels: ["Nessuno", "Debole", "Moderato", "Forte", "Molto forte"],
    pollenNote: "Misure delle 15 stazioni SwissPollen, media su 24 ore.",
    noBulletin: "Nessun bollettino valanghe pubblicato (fuori stagione).",
    species: { hazel: "Nocciolo", alder: "Ontano", birch: "Betulla", ash: "Frassino", beech: "Faggio", oak: "Quercia", grasses: "Graminacee" },
  },
  rm: {
    title: "MeteoSvizra", recenter: "Centrar", today: "Oz", home: "Chasa", error: "Datas betg disponiblas",
    layer: { weather: "Aura", radar: "Radar", warnings: "Malaura", fire: "Incendis da guaud", flood: "Auazuns", drought: "Sitgira", avalanche: "Lavinas", pollen: "Pollen" },
    heading: {
      weather: "Prognosa da l’aura", radar: "Radar da precipitaziuns", warnings: "Avertiments da malaura", fire: "Privel d’incendis da guaud", flood: "Privel d’auazuns",
      drought: "Privel da sitgira", avalanche: "Privel da lavinas", pollen: "Pollen (mesiraziuns)",
    },
    warnNone: "Nagin avertiment", warnFrom: "da", warnTo: "fin", warnSoon: "previs", warnNote: "Avertiments uffizials da MeteoSvizra (via MeteoAlarm). Avertiments previs èn punctads.", warnLink: "Privels actuals (MeteoSvizra)",
    warnKinds: { rain: "Plievgia", thunderstorm: "Urizis", wind: "Vent", snow: "Naiv", slippery_roads: "Vias sblundriusas", heat: "Chalira", frost: "Glatsch" },
    legend: "Legenda", rain: "Intensitad (mm/h)", radarNote: "Radar da MeteoSvizra, las ultimas 3 uras, in maletg mintga 5 minutas.", noRadar: "Il radar n’è actualmain betg disponibel.", forecastLabel: "Prognosa", forecastNote: "Suenter, oransch sin il cursur: prognosa da precipitaziuns per ura (prognosas localas da MeteoSvizra, interpoladas).", radarSetup: "Il radar n’è betg disponibel.", levels: "Grads da privel", updated: "Actualisà ils",
    explain: "Explicaziun dals grads da privel", bulletin: "Bulletin da lavinas (SLF)",
    danger: ["Nagin bulletin", "Nagin u pitschen privel", "Privel moderà", "Privel considerabel", "Grond privel", "Fitg grond privel"],
    pollenLevels: ["Nagin", "Flaivel", "Moderà", "Ferm", "Fitg ferm"],
    pollenNote: "Mesiraziuns da las 15 staziuns SwissPollen, media da 24 uras.",
    noBulletin: "Actualmain nagin bulletin da lavinas publitgà (ordaifer la stagiun).",
    species: { hazel: "Coller", alder: "Ogn", birch: "Badugn", ash: "Fraissen", beech: "Fau", oak: "Ruver", grasses: "Gramineas" },
  },
  en: {
    title: "MeteoSwiss", recenter: "Re-center", today: "Today", home: "Home", error: "Data unavailable",
    layer: { weather: "Weather", radar: "Radar", warnings: "Severe weather", fire: "Forest fire", flood: "Floods", drought: "Drought", avalanche: "Avalanches", pollen: "Pollen" },
    heading: {
      weather: "Weather forecast", radar: "Precipitation radar", warnings: "Weather warnings", fire: "Forest fire danger", flood: "Flood danger",
      drought: "Drought danger", avalanche: "Avalanche danger", pollen: "Pollen (measurements)",
    },
    warnNone: "No warning", warnFrom: "from", warnTo: "to", warnSoon: "upcoming", warnNote: "Official MeteoSwiss warnings (via MeteoAlarm). Upcoming warnings are dashed.", warnLink: "Current hazards (MeteoSwiss)",
    warnKinds: { rain: "Rain", thunderstorm: "Thunderstorms", wind: "Wind", snow: "Snow", slippery_roads: "Slippery roads", heat: "Heat", frost: "Frost" },
    legend: "Legend", rain: "Intensity (mm/h)", radarNote: "MeteoSwiss radar, last 3 hours, one image every 5 minutes.", noRadar: "The radar is not available at the moment.", forecastLabel: "Forecast", forecastNote: "Then, in orange on the slider: hourly precipitation forecast (MeteoSwiss local forecasts, interpolated).", radarSetup: "Radar not set up: enter the radar server URL in Settings → Devices & services → MeteoSwiss Complete For HA → Configure → Display.", levels: "Danger levels", updated: "Updated",
    explain: "Danger levels explained", bulletin: "Avalanche bulletin (SLF)",
    danger: ["No bulletin", "No or low danger", "Moderate danger", "Considerable danger", "High danger", "Very high danger"],
    pollenLevels: ["None", "Weak", "Moderate", "Strong", "Very strong"],
    pollenNote: "Measurements of the 15 SwissPollen stations, 24-hour mean.",
    noBulletin: "No avalanche bulletin currently published (off-season).",
    species: { hazel: "Hazel", alder: "Alder", birch: "Birch", ash: "Ash", beech: "Beech", oak: "Oak", grasses: "Grasses" },
  },
};

const STYLE = `
:host { display: block; height: 100%; }
[hidden] { display: none !important; }
.wrap { display: flex; flex-direction: column; height: 100%; background: #1f2a33; color: #fff;
  font-family: var(--paper-font-body1_-_font-family, Roboto, sans-serif); }
.main { position: relative; flex: 1; display: flex; min-height: 0; }
.map { flex: 1; min-height: 300px; position: relative; }
.side { width: 300px; padding: 16px 20px; background: #26333d; overflow: auto; font-size: 15px; line-height: 1.45; }
.wrap.narrow .side { position: absolute; z-index: 600; left: 8px; bottom: 26px; width: auto; max-width: 260px;
  padding: 8px 12px; font-size: 12px; border-radius: 8px; background: rgba(38,51,61,.92); }
.wrap.narrow .side .extra, .wrap.narrow .side h2 { display: none; }
.wrap.narrow .side h3 { font-size: 12px; margin-bottom: 4px; }
.wrap.narrow .side .row { margin: 2px 0; gap: 6px; }
.side h2 { font-size: 17px; margin: 0 0 12px; }
.side h3 { font-size: 15px; font-weight: 400; margin: 0 0 8px; }
.side .row { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
.side .row i { flex: 0 0 26px; height: 26px; border-radius: 2px; }
.wrap.narrow .side .row i { flex-basis: 14px; height: 14px; }
.side .row b { font-weight: 400; min-width: 12px; }
.side a { color: #fff; display: block; margin-top: 14px; }
.side p { margin: 12px 0 0; color: #d7dee4; }
.toolbar { position: absolute; z-index: 600; left: 16px; top: 12px; display: flex; background: #26333d;
  border-radius: 4px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,.4); }
.toolbar button { position: relative; width: 48px; height: 46px; border: 0; background: transparent; color: #fff;
  cursor: pointer; display: flex; align-items: center; justify-content: center; border-top: 4px solid #8a949c; }
.toolbar button.on { background: #3d4d59; }
.wrap.single .heading { top: 14px; }
.wrap.single .note { top: 44px; }
.place.home { font-weight: 700; }
.place.home::before { width: 9px; height: 9px; background: #f57c00; vertical-align: 1px; }
.leaflet-bar a.ms-fit { font-size: 20px; line-height: 30px; }
/* Small cards: legend as one compact line of colors. */
.wrap.tiny .side { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; max-width: calc(100% - 70px); padding: 5px 8px; }
.wrap.tiny .side h3 { display: none; }
.wrap.tiny .side .row { margin: 0; gap: 3px; }
.wrap.tiny .side .row b + span { display: none; }
.wrap.tiny .side .row i { flex-basis: 12px; height: 12px; }
.wrap.narrow .toolbar { left: 8px; max-width: calc(100% - 16px); overflow-x: auto; }
.wrap.narrow .toolbar button { width: 40px; flex: 0 0 40px; }
.wrap.narrow .heading { left: 12px; top: 66px; font-size: 16px; }
.wrap.narrow .tabs { overflow-x: auto; }
.wrap.narrow .tabs button { flex: 1 0 auto; padding: 10px 8px; font-size: 14px; }
.toolbar button.menu { border-top-color: transparent; border-right: 1px solid #3d4d59; }
.toolbar button ha-icon, .toolbar button .fallback { --mdc-icon-size: 22px; font-size: 13px; }
.heading { position: absolute; z-index: 600; left: 20px; top: 74px; font-size: 18px; font-weight: 700;
  text-shadow: 0 1px 3px rgba(0,0,0,.8); pointer-events: none; }
.updated { padding: 6px 16px; font-size: 12px; color: #c9d2d9; }
.note { position: absolute; z-index: 600; left: 20px; top: 104px; max-width: 360px; font-size: 13px;
  background: rgba(38,51,61,.9); border-radius: 6px; padding: 6px 10px; }
.pill { position: relative; display: inline-flex; flex-direction: column; padding: 4px 12px 5px 30px;
  margin-left: 26px; border-radius: 16px; background: #2f6fe0; color: #fff; white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0,0,0,.35); font-size: 13px; line-height: 1.2; }
.pill.mountain { background: #0f7a5c; }
.pill.home { background: #f57c00; }
.pill img { position: absolute; left: -30px; top: 50%; transform: translateY(-58%); width: 50px; height: 50px;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,.35)); }
.pill .n { font-weight: 600; }
.pill .t { display: flex; gap: 3px; margin-top: 3px; }
.pill .t span { min-width: 26px; text-align: center; padding: 1px 4px; border-radius: 4px; background: rgba(0,0,0,.28); font-weight: 600; }
.place { white-space: nowrap; font-size: 14px; color: #263238; font-weight: 500;
  text-shadow: 0 0 3px #fff, 0 0 3px #fff, 0 0 2px #fff; }
.place::before { content: ""; display: inline-block; width: 5px; height: 5px; border-radius: 50%;
  background: #263238; border: 1px solid #fff; margin-right: 4px; vertical-align: 2px; }
.tabs { display: flex; background: #1f2a33; }
.player { display: flex; align-items: center; gap: 12px; padding: 8px 16px; background: #1f2a33; font-size: 15px; }
.player button { width: 36px; height: 36px; border-radius: 50%; border: 1px solid #8a949c; background: transparent;
  color: #fff; cursor: pointer; font-size: 16px; }
.player input { flex: 1; }
.player .time { min-width: 56px; font-weight: 600; white-space: nowrap; }
.player .time.fc { color: #ff9f43; }
.player input.split { -webkit-appearance: none; appearance: none; height: 6px; border-radius: 3px; }
.player input.split::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #fff; }
.player input.split::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #fff; border: 0; }
.radar-img { transition: opacity ${FADE_MS}ms linear; }
.tabs button { flex: 1; border: 0; border-top: 4px solid #4b5862; background: transparent; color: #fff;
  padding: 10px 4px; cursor: pointer; font: inherit; font-size: 15px; }
.tabs button ha-icon { --mdc-icon-size: 20px; }
.ms-warn-tip { max-width: 320px; white-space: normal; }
.tabs button.on { border-top-color: #fff; font-weight: 600; background: rgba(255,255,255,.1); }
.leaflet-pane.ms-tint, .leaflet-pane.ms-regions { mix-blend-mode: multiply; }
.leaflet-container { background: #26323b; font: inherit; }
.leaflet-tooltip { font-size: 13px; }
`;

function lang(hass, override) {
  const l = override && override !== "auto" ? override : (hass?.locale?.language || hass?.language || "en").split("-")[0];
  return I18N[l] ? l : "en";
}

class MeteoSwissMap {
  constructor(root, options = {}) {
    this.root = root;
    this.options = options;
    const shown = (Array.isArray(options.layers) ? options.layers : []).filter((l) => LAYERS.includes(l));
    this.shown = shown.length ? shown : LAYERS;
    this.layer = this.shown.includes(options.layer) ? options.layer : this.shown[0];
    this.day = 0;
    this.data = null;
    this.geo = {}; // cached region GeoJSON per hazard
    this.t = I18N.en;
    this._build();
  }

  // ------------------------------------------------------------- layout

  _build() {
    this.root.innerHTML = `
      <link rel="stylesheet" href="${BASE}leaflet/leaflet.css">
      <style>${STYLE}</style>
      <div class="wrap">
        <div class="main">
          <div class="map">
            <div class="toolbar"></div>
            <div class="heading"></div>
            <div class="note" hidden></div>
          </div>
          <div class="side" hidden></div>
        </div>
        <div class="tabs" hidden></div>
        <div class="player" hidden><button class="play">❚❚</button><input type="range" min="0" value="0"><span class="time"></span></div>
        <div class="updated" hidden></div>
      </div>`;
    const $ = (s) => this.root.querySelector(s);
    this.wrap = $(".wrap");
    this.toolbar = $(".toolbar");
    this.heading = $(".heading");
    this.note = $(".note");
    this.side = $(".side");
    this.tabs = $(".tabs");
    this.updated = $(".updated");
    this.player = $(".player");
    this.player.querySelector(".play").addEventListener("click", () => this._togglePlay());
    this.player.querySelector("input").addEventListener("input", (e) => {
      this._stopRadar();
      this._showFrame(Number(e.target.value));
    });
    const mapEl = $(".map");

    this.map = L.map(mapEl, {
      zoomSnap: 0.25, minZoom: 6, maxZoom: 12, zoomControl: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(this.map);
    // Button to re-center the map (whole Switzerland or the home region).
    const Fit = L.Control.extend({
      onAdd: () => {
        const box = L.DomUtil.create("div", "leaflet-bar");
        const a = L.DomUtil.create("a", "ms-fit", box);
        a.href = "#";
        a.role = "button";
        this._fitBtn = a;
        a.innerHTML = "⌖";
        L.DomEvent.disableClickPropagation(box);
        L.DomEvent.on(a, "click", (e) => {
          L.DomEvent.preventDefault(e);
          this._fitView();
        });
        return box;
      },
    });
    new Fit({ position: "bottomright" }).addTo(this.map);
    this.map.attributionControl.setPrefix(false);

    // Panes, bottom to top: relief, green tint and warning regions (both
    // multiplied onto the relief), lakes, dark mask outside Switzerland,
    // then labels (marker pane).
    const pane = (name, z, cls, interactive = false) => {
      const p = this.map.createPane(name);
      p.style.zIndex = z;
      if (cls) p.classList.add(cls);
      if (!interactive) p.style.pointerEvents = "none";
    };
    pane("ms-tint", 250, "ms-tint");
    pane("ms-regions", 260, "ms-regions", true);
    pane("ms-lakes", 270);
    pane("ms-radar", 275);
    pane("ms-mask", 280);
    L.tileLayer(WMTS("ch.swisstopo.leichte-basiskarte_reliefschattierung"), {
      attribution: "© swisstopo · MeteoSwiss, MeteoAlarm, SLF, FOEN", maxZoom: 18,
    }).addTo(this.map);
    L.tileLayer(WMTS("ch.bafu.vec25-seen"), { pane: "ms-lakes", maxZoom: 18 }).addTo(this.map);
    this.map.fitBounds(CH_BOUNDS);
    this.overlay = L.layerGroup().addTo(this.map);
    this._loadCountry();
    this.map.on("zoomend", () => this._render());

    this._resize = new ResizeObserver(() => {
      const narrow = this.wrap.clientWidth < 900;
      const changed = narrow !== this.wrap.classList.contains("narrow");
      this.wrap.classList.toggle("narrow", narrow);
      this.wrap.classList.toggle("tiny", this.wrap.clientWidth < 560);
      // New map size (first layout, card resized, day tabs or radar player
      // shown or hidden): fit the view again, which also redraws the vector
      // layers for the new size. No "pan": that would shift the view.
      this.map.invalidateSize({ pan: false });
      const size = `${mapEl.clientWidth}x${mapEl.clientHeight}`;
      if (size !== this._size && mapEl.clientWidth && mapEl.clientHeight) {
        this._size = size;
        this._fitView();
      }
      if (changed) this._render(); // day names, legend placement
    });
    this._resize.observe(this.wrap);
    this._resize.observe(mapEl);
  }

  async _loadCountry() {
    try {
      const ch = await (await fetch(`${BASE}switzerland.json`)).json();
      this._ch = ch;
      this.tint = L.geoJSON(ch, {
        pane: "ms-tint", interactive: false,
        style: { stroke: false, fillColor: "#8fd1b0", fillOpacity: 0.85 },
      }).addTo(this.map);
      // Mask: a large rectangle with Switzerland as holes.
      const world = [[30, -20], [30, 40], [65, 40], [65, -20]];
      const holes = ch.geometry.coordinates.map((poly) => poly[0].map(([lon, lat]) => [lat, lon]));
      L.polygon([world, ...holes], {
        pane: "ms-mask", interactive: false, stroke: false, fillColor: "#1d2830", fillOpacity: 0.78,
      }).addTo(this.map);
      L.geoJSON(ch, {
        pane: "ms-mask", interactive: false,
        style: { color: "#ffffff", weight: 1.2, opacity: 0.55, fill: false },
      }).addTo(this.map);
    } catch (err) {
      console.warn("MeteoSwiss: country outline unavailable", err);
    }
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    this.t = I18N[lang(hass, this.options?.language)];
    if (this._fitBtn) this._fitBtn.title = this.t.recenter;
    if (first) {
      this.refresh();
      this._timer = setInterval(() => this.refresh(), 10 * 60 * 1000);
    }
  }

  destroy() {
    clearInterval(this._timer);
    this._resize?.disconnect();
    this._clearRadar();
    this.map.remove();
  }

  set narrow(narrow) {
    this._narrowPanel = !!narrow;
    if (this.toolbar) this.toolbar.dataset.layers = ""; // rebuild with/without menu button
    if (this.data) this._toolbar();
  }

  _toolbar() {
    const shown = this.shown;
    const menu = this.options.menuButton && this._narrowPanel;
    const key = shown.join() + (menu ? "+menu" : "");
    const single = shown.length === 1 && !menu;
    this.wrap.classList.toggle("single", single);
    this.toolbar.hidden = single;
    if (this.toolbar.dataset.layers !== key) {
      this.toolbar.dataset.layers = key;
      const hasIcon = !!customElements.get("ha-icon");
      const icon = (name, text) =>
        hasIcon ? `<ha-icon icon="${name}"></ha-icon>` : `<span class="fallback">${text}</span>`;
      this.toolbar.innerHTML = (menu ? `<button class="menu" title="Menu">${icon("mdi:menu", "☰")}</button>` : "") +
        shown.map((l) => `<button data-layer="${l}" title="${this.t.layer[l]}">${icon(ICONS[l], this.t.layer[l].slice(0, 3))}</button>`).join("");
      this.toolbar.querySelector(".menu")?.addEventListener("click", () =>
        this.root.host?.dispatchEvent(new Event("hass-toggle-menu", { bubbles: true, composed: true })));
      this.toolbar.querySelectorAll("button[data-layer]").forEach((b) =>
        b.addEventListener("click", () => {
          this.layer = b.dataset.layer;
          this._render();
        }));
    }
    // Colored top bar: highest current level of each hazard in Switzerland.
    const max = this.data?.maxima || {};
    this.toolbar.querySelectorAll("button[data-layer]").forEach((b) => {
      const l = b.dataset.layer;
      b.classList.toggle("on", l === this.layer);
      const level = max[l];
      const colors = l === "pollen" ? POLLEN_COLORS : DANGER_COLORS;
      b.style.borderTopColor = level ? colors[level] : "#8a949c";
    });
  }

  // --------------------------------------------------------------- data

  async refresh() {
    try {
      const query = this.options.entry_id ? `?entry_id=${this.options.entry_id}` : "";
      this.data = await this._hass.callApi("GET", `meteoswiss4ha/overview${query}`);
      if (!this._viewSet) {
        this._viewSet = true;
        this._fitView();
      }
      this.geo = {};
      this._radarLoaded = 0;
      this._render();
    } catch (err) {
      this.note.hidden = false;
      this.note.textContent = `${this.t.error} (${err?.message || err})`;
    }
  }

  async _regions(kind) {
    if (!this.geo[kind]) {
      const path = kind === "avalanche" ? "meteoswiss4ha/avalanche_regions" : `meteoswiss4ha/hazard_regions/${kind}`;
      this.geo[kind] = this._hass.callApi("GET", path).catch(() => null);
    }
    return this.geo[kind];
  }

  // ------------------------------------------------------------ drawing

  async _render() {
    if (!this.data) return;
    const layer = this.layer;
    this._toolbar();
    this.heading.textContent = this.t.heading[layer];
    this.note.hidden = true;
    this.tabs.hidden = layer !== "weather" && layer !== "warnings";
    if (layer !== "radar") this.player.hidden = true;
    if (layer !== "radar") this._clearRadar();
    if (this.tint) this.tint.setStyle({ fillOpacity: layer === "weather" ? 0.85 : 0.35 });
    const token = (this._token = (this._token || 0) + 1);
    const draw = [];
    if (layer === "weather") {
      this._weather(draw);
      this.side.hidden = true;
      this.updated.hidden = true;
    } else if (layer === "pollen") {
      this._pollen(draw);
    } else if (layer === "warnings") {
      await this._warnings(draw, token);
      if (token !== this._token) return;
    } else if (layer === "radar") {
      await this._radar(draw, token);
      if (token !== this._token) return;
    } else {
      const geo = await this._regions(layer);
      if (token !== this._token) return; // another layer was chosen meanwhile
      this._hazard(layer, geo, draw);
    }
    this.overlay.clearLayers();
    draw.forEach((d) => d.addTo(this.overlay));
    // The legend panel changes the map width: re-center Switzerland.
    if (this.options.legend === false) this.side.hidden = true;
    const sideShown = !this.side.hidden && !this.wrap.classList.contains("narrow");
    if (sideShown !== this._sideShown) {
      this._sideShown = sideShown;
      this.map.invalidateSize({ pan: false });
      this._fitView();
    }
  }

  // Whole Switzerland, or zoomed on the home location (option area: home).
  _fitView() {
    // Always measure the container first: HA may lay the card out after the map was built.
    this.map.invalidateSize({ pan: false });
    const home = this.data?.home;
    if (this.options.area === "home" && home?.lat != null) {
      this.map.setView([home.lat, home.lon], Number(this.options.zoom) || 9, { reset: true });
    } else {
      // reset: re-project every vector layer for the (possibly new) map size.
      this.map.fitBounds(CH_BOUNDS, { reset: true });
    }
  }

  // Greedy label placement: keep a label only if it doesn't overlap one
  // already placed (candidates are sorted by importance).
  _placeLabels(candidates, size) {
    const placed = [];
    return candidates.filter((p) => {
      const pt = this.map.latLngToContainerPoint([p.lat, p.lon]);
      const [x1, y1, x2, y2] = size(p, pt);
      if (placed.some((o) => x1 < o[2] && x2 > o[0] && y1 < o[3] && y2 > o[1])) return false;
      placed.push([x1, y1, x2, y2]);
      return true;
    });
  }

  _dayTabs(days) {
    const narrow = this.wrap.classList.contains("narrow");
    const key = days.map((d) => d.date).join() + narrow;
    if (this._tabsKey !== key) {
      this._tabsKey = key;
      this.tabs.innerHTML = days.map((d, i) => `<button data-day="${i}">${
        i === 0 ? this.t.today
          : new Date(`${d.date}T12:00:00`).toLocaleDateString(lang(this._hass, this.options?.language), { weekday: narrow ? "short" : "long" })
      }</button>`).join("");
      this.tabs.querySelectorAll("button").forEach((b) =>
        b.addEventListener("click", () => {
          this.day = Number(b.dataset.day);
          this._render();
        }));
    }
    this.tabs.querySelectorAll("button").forEach((b) => b.classList.toggle("on", Number(b.dataset.day) === this.day));
  }

  _weather(draw) {
    const home = this.data.home;
    const candidates = [
      { ...home, name: home.name || this.t.home, kind: "home", min_zoom: 0 },
      ...[...this.data.cities].sort(
        (a, b) => a.min_zoom - b.min_zoom || (a.kind === "mountain") - (b.kind === "mountain"),
      ),
    ];
    const places = this._placeLabels(candidates, (p, pt) =>
      [pt.x - 26, pt.y - 26, pt.x + 44 + p.name.length * 7.5, pt.y + 20]);
    const ref = places.find((p) => p.days?.length);
    if (ref) {
      this.day = Math.min(this.day, ref.days.length - 1);
      this._dayTabs(ref.days.slice(0, 8));
    }
    const round = (v) => (v != null ? `${Math.round(v)}°` : "–");
    for (const place of places) {
      const d = place.days?.[this.day];
      if (!d || d.symbol == null) continue;
      const html = `<div class="pill ${place.kind || "city"}">
        <img src="${this.data.icons_url}/${d.symbol}.svg" alt="">
        <span class="n">${place.name}</span>
        <span class="t"><span>${round(d.tmin)}</span><span>${round(d.tmax)}</span></span></div>`;
      draw.push(L.marker([place.lat, place.lon], {
        icon: L.divIcon({ html, className: "", iconSize: null, iconAnchor: [22, 22] }),
        keyboard: false, zIndexOffset: place.kind === "home" ? 1000 : 0,
      }));
    }
  }

  // Small "• Name" labels for orientation on the warning maps.
  _placeNames(draw) {
    const home = this.data.home;
    if (home?.lat != null) {
      draw.push(L.marker([home.lat, home.lon], {
        icon: L.divIcon({ html: `<span class="place home">${home.name || this.t.home}</span>`, className: "", iconSize: null, iconAnchor: [6, 9] }),
        keyboard: false, interactive: false, zIndexOffset: 1000,
      }));
    }
    const cities = this.data.cities.filter((c) => c.kind === "city").sort((a, b) => a.min_zoom - b.min_zoom);
    for (const c of this._placeLabels(cities, (p, pt) => [pt.x - 4, pt.y - 10, pt.x + 14 + p.name.length * 8, pt.y + 10])) {
      draw.push(L.marker([c.lat, c.lon], {
        icon: L.divIcon({ html: `<span class="place">${c.name}</span>`, className: "", iconSize: null, iconAnchor: [4, 9] }),
        keyboard: false, interactive: false,
      }));
    }
  }

  _hazard(kind, geo, draw) {
    let level = (f) => f.properties.level || 0;
    let tooltip = (f) => `<b>${f.properties.name || ""}</b><br>${f.properties.text || this.t.danger[level(f)]}`;
    let validFrom = [];
    if (kind === "avalanche") {
      const levels = this.data.avalanche || {};
      level = (f) => levels[f.properties.id]?.level || 0;
      tooltip = (f) => `<b>${levels[f.properties.id]?.name || f.properties.id}</b><br>${this.t.danger[level(f)]}`;
      if (!Object.keys(levels).length) {
        this.note.hidden = false;
        this.note.textContent = this.t.noBulletin;
      }
    } else if (geo) {
      validFrom = geo.features.map((f) => f.properties.valid_from).filter(Boolean);
    }
    if (geo) {
      draw.push(L.geoJSON(geo, {
        pane: "ms-regions",
        style: (f) => {
          const lvl = level(f);
          if (f.geometry.type.includes("Line")) {
            // Rivers and lakes of the flood map.
            return { color: lvl > 1 ? DANGER_COLORS[lvl] : "#5aa0d0", weight: lvl > 1 ? 5 : 2, opacity: 0.95 };
          }
          return {
            color: "#ffffff", weight: 0.4, opacity: 0.5,
            fillColor: DANGER_COLORS[lvl], fillOpacity: lvl ? 0.9 : 0.15,
          };
        },
        onEachFeature: (f, l) => l.bindTooltip(tooltip(f), { sticky: true }),
      }));
    }
    this._placeNames(draw);

    const rows = [1, 2, 3, 4, 5].map((i) =>
      `<div class="row"><i style="background:${DANGER_COLORS[i]}"></i><b>${i}</b><span>${this.t.danger[i]}</span></div>`).join("");
    const links = LINKS[lang(this._hass, this.options?.language)];
    const extra = kind === "avalanche"
      ? `<a href="${links.avalanche}" target="_blank" rel="noreferrer">${this.t.bulletin}</a>`
      : `<a href="${links.hazards}" target="_blank" rel="noreferrer">${this.t.explain}</a>`;
    this.side.hidden = false;
    this.side.innerHTML = `<h2>${this.t.legend}</h2><h3>${this.t.levels}</h3>${rows}<div class="extra">${extra}</div>`;
    this._updated(validFrom);
  }

  // ---------------------------------------------------- weather warnings

  _kindTabs() {
    const narrow = this.wrap.classList.contains("narrow");
    const hasIcon = !!customElements.get("ha-icon");
    const key = `warnings${narrow}${hasIcon}`;
    if (this._tabsKey !== key) {
      this._tabsKey = key;
      this.tabs.innerHTML = WARNING_KINDS.map((k) => `<button data-kind="${k}" title="${this.t.warnKinds[k]}">${
        narrow && hasIcon ? `<ha-icon icon="${WARNING_ICONS[k]}"></ha-icon>` : this.t.warnKinds[k]
      }</button>`).join("");
      this.tabs.querySelectorAll("button").forEach((b) =>
        b.addEventListener("click", () => {
          this.warnKind = b.dataset.kind;
          this._render();
        }));
    }
    const levels = this.data.warning_kinds || {};
    this.tabs.querySelectorAll("button").forEach((b) => {
      b.classList.toggle("on", b.dataset.kind === this.warnKind);
      const level = levels[b.dataset.kind];
      b.style.borderTopColor = level ? DANGER_COLORS[level] : "";
    });
  }

  async _warnings(draw, token) {
    if (!this.warnKind) {
      // Start on the kind with the highest warning in force.
      const levels = this.data.warning_kinds || {};
      this.warnKind = WARNING_KINDS.reduce((a, b) => ((levels[b] || 0) > (levels[a] || 0) ? b : a));
    }
    this._kindTabs();
    if (!this.geo.warnings) {
      this.geo.warnings = this._hass.callApi("GET", "meteoswiss4ha/weather_warnings").catch(() => null);
    }
    const geo = await this.geo.warnings;
    if (token !== this._token) return;
    const kind = this.warnKind;
    const loc = lang(this._hass, this.options?.language);
    const fmt = (s) => (s ? new Date(s).toLocaleString(loc, {
      weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit",
    }) : "");
    const now = Date.now();
    const esc = (t) => String(t || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    if (!geo) {
      this.note.hidden = false;
      this.note.textContent = this.t.error;
    } else {
      // Whole country at level 1 (no warning), then this kind's regions, highest on top.
      if (this._ch) {
        draw.push(L.geoJSON(this._ch, {
          pane: "ms-regions", interactive: false,
          style: { stroke: false, fillColor: DANGER_COLORS[1], fillOpacity: 0.9 },
        }));
      }
      const features = geo.features
        .filter((f) => f.properties.kind === kind)
        .sort((a, b) => a.properties.level - b.properties.level);
      const soon = (p) => !!p.onset && Date.parse(p.onset) > now;
      draw.push(L.geoJSON({ type: "FeatureCollection", features }, {
        pane: "ms-regions",
        style: (f) => {
          const p = f.properties;
          const color = DANGER_COLORS[p.level];
          return soon(p)
            ? { color, weight: 2, opacity: 1, dashArray: "4 4", fillColor: color, fillOpacity: 0.4 }
            : { color: "#ffffff", weight: 0.4, opacity: 0.6, fillColor: color, fillOpacity: 0.9 };
        },
        onEachFeature: (f, l) => {
          const p = f.properties;
          const text = esc(p.description).split("\n").slice(0, 4).join("<br>");
          l.bindTooltip(`<b>${esc(p.name)}</b><br>${p.level} – ${esc(p.event)}${soon(p) ? ` (${this.t.warnSoon})` : ""}<br>${
            this.t.warnFrom} ${fmt(p.onset)} ${this.t.warnTo} ${fmt(p.expires)}<br><small>${text}</small>`,
          { sticky: true, className: "ms-warn-tip" });
        },
      }));
    }
    this._placeNames(draw);
    const rows = [1, 2, 3, 4, 5].map((i) =>
      `<div class="row"><i style="background:${DANGER_COLORS[i]}"></i><b>${i}</b><span>${i === 1 ? this.t.warnNone : this.t.danger[i]}</span></div>`).join("");
    this.side.hidden = false;
    this.side.innerHTML = `<h2>${this.t.legend}</h2><h3>${this.t.levels}</h3>${rows}<div class="extra"><p>${this.t.warnNote}</p><a href="${LINKS[loc].warnings}" target="_blank" rel="noreferrer">${this.t.warnLink}</a></div>`;
    this._updated([]);
  }

  // ------------------------------------------------------------- radar

  async _radar(draw, token) {
    this._placeNames(draw);
    const rows = RAIN_SCALE.map(([c, l]) => `<div class="row"><i style="background:${c}"></i><span>${l}</span></div>`).join("");
    this.side.hidden = false;
    this.side.innerHTML = `<h2>${this.t.legend}</h2><h3>${this.t.rain}</h3>${rows}<p class="extra">${this.t.radarNote}${this._hasForecast ? " " + this.t.forecastNote : ""}</p>`;
    if (!this.data.radar) {
      // No radar server configured in the integration options.
      this._clearRadar();
      this.player.hidden = true;
      this.note.hidden = false;
      this.note.textContent = this.t.radarSetup;
      return;
    }
    if (this._radarFrames && Date.now() - this._radarLoaded < 4 * 60000) return; // still fresh
    let list;
    try {
      const query = this.options.entry_id ? `?entry_id=${this.options.entry_id}` : "";
      list = await this._hass.callApi("GET", `meteoswiss4ha/radar/frames${query}`);
    } catch (err) {
      list = { frames: [] };
    }
    if (token !== this._token) return;
    this._clearRadar();
    // Timeline: radar (past, every 5 min) then forecast (next hours, hourly).
    const radar = (list.frames || []).map((time) => ({ time, forecast: false }));
    const last = radar.length ? radar[radar.length - 1].time : "";
    const forecast = (list.forecast || []).filter((t) => t > last).map((time) => ({ time, forecast: true }));
    const timeline = [...radar, ...forecast];
    if (!timeline.length) {
      this._radarUnavailable();
      return;
    }
    this._hasForecast = forecast.length > 0;
    if (this._hasForecast) {
      this.side.querySelector(".extra").textContent = `${this.t.radarNote} ${this.t.forecastNote}`;
    }
    this.player.hidden = false;
    // Image URLs must be signed: <img> requests cannot carry the HA token.
    const urls = await Promise.all(timeline.map(async ({ time }) => {
      const path = `/api/meteoswiss4ha/radar/frame/${encodeURIComponent(time)}${
        this.options.entry_id ? `?entry_id=${this.options.entry_id}` : ""}`;
      try {
        const res = await this._hass.callWS({ type: "auth/sign_path", path, expires: 3600 });
        return res.path;
      } catch (err) {
        return path; // outside HA (tests)
      }
    }));
    if (token !== this._token) return;
    this._radarFrames = timeline.map(({ time, forecast: isForecast }, i) => {
      const frame = { time, forecast: isForecast, broken: false };
      frame.layer = L.imageOverlay(urls[i], list.bounds, {
        pane: "ms-radar", opacity: 0, interactive: false, className: "radar-img",
      });
      // A frame that fails to load is skipped; if none loads, say so.
      frame.layer.on("error", () => {
        frame.broken = true;
        if (this._radarFrames?.every((f) => f.broken)) this._radarUnavailable();
      });
      frame.layer.addTo(this.map);
      return frame;
    });
    this._radarLoaded = Date.now();
    // "Now" = the latest radar image (or the first forecast one).
    this._nowFrame = Math.max(0, radar.length - 1);
    const slider = this.player.querySelector("input");
    slider.max = this._radarFrames.length - 1;
    // Slider track: grey for the radar past, orange for the forecast.
    const split = this._radarFrames.length > 1 ? (100 * this._nowFrame) / (this._radarFrames.length - 1) : 100;
    slider.style.background = forecast.length
      ? `linear-gradient(to right, #8a949c 0 ${split}%, #ff9f43 ${split}% 100%)`
      : "";
    slider.classList.toggle("split", forecast.length > 0);
    this._updated([]);
    this._showFrame(this._nowFrame);
    this._playRadar();
  }

  _radarUnavailable() {
    this._clearRadar();
    this.player.hidden = true;
    this.note.hidden = false;
    this.note.textContent = this.t.noRadar;
    this._radarLoaded = 0; // retry on the next render / refresh
  }

  _showFrame(index) {
    if (!this._radarFrames) return;
    // Skip frames whose image could not be loaded.
    const n = this._radarFrames.length;
    for (let k = 0; k < n && this._radarFrames[index].broken; k++) index = (index + 1) % n;
    this._frame = index;
    const frame = this._radarFrames[index];
    this._radarFrames.forEach((f, i) => f.layer.setOpacity(i === index ? (f.forecast ? 0.75 : 0.85) : 0));
    this.player.querySelector("input").value = index;
    const t = new Date(frame.time).toLocaleTimeString(lang(this._hass, this.options?.language), { hour: "2-digit", minute: "2-digit" });
    const label = this.player.querySelector(".time");
    label.textContent = frame.forecast ? `${this.t.forecastLabel} ${t}` : t;
    label.classList.toggle("fc", frame.forecast);
  }

  _playRadar() {
    this._stopRadar();
    this.player.querySelector(".play").textContent = "❚❚";
    this._radarTimer = setInterval(() => {
      const n = this._radarFrames?.length || 0;
      if (!n) return;
      // Pause on "now" and on the last frame; forecast frames (hourly)
      // stay longer than radar frames (5 minutes).
      const frame = this._radarFrames[this._frame];
      const hold = this._frame === n - 1 || this._frame === this._nowFrame ? 6 : frame?.forecast ? 3 : 1;
      if ((this._hold = (this._hold || 0) + 1) < hold) return;
      this._hold = 0;
      this._showFrame((this._frame + 1) % n);
    }, FRAME_MS);
  }

  _stopRadar() {
    clearInterval(this._radarTimer);
    this._radarTimer = null;
    this.player.querySelector(".play").textContent = "▶";
  }

  _togglePlay() {
    if (this._radarTimer) this._stopRadar();
    else this._playRadar();
  }

  _clearRadar() {
    this._stopRadar();
    (this._radarFrames || []).forEach((f) => f.layer.remove());
    this._radarFrames = null;
  }

  _pollen(draw) {
    for (const s of this.data.pollen || []) {
      const lvl = s.level ?? 0;
      const lines = Object.entries(s.species || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${this.t.species[k] || k}: ${this.t.pollenLevels[v]}`);
      draw.push(L.circleMarker([s.lat, s.lon], {
        radius: 13, color: "#263238", weight: 1.5, fillColor: POLLEN_COLORS[lvl], fillOpacity: 1,
      }).bindTooltip(`<b>${s.name}</b><br>${this.t.pollenLevels[lvl]}${lines.length ? "<br>" + lines.join("<br>") : ""}`));
    }
    this._placeNames(draw);
    const rows = this.t.pollenLevels.map((label, i) =>
      `<div class="row"><i style="background:${POLLEN_COLORS[i]}"></i><span>${label}</span></div>`).join("");
    this.side.hidden = false;
    this.side.innerHTML = `<h2>${this.t.legend}</h2>${rows}<p class="extra">${this.t.pollenNote}</p>`;
    this._updated([]);
  }

  _updated(validFrom) {
    // FOEN dates come as "DD.MM.YYYY" or "YYYY/MM/DD ..."; show the newest.
    const parse = (s) => {
      const m = /^(\d{2})\.(\d{2})\.(\d{4})/.exec(s) || /^(\d{4})\/(\d{2})\/(\d{2})/.exec(s);
      if (!m) return null;
      return m[1].length === 4 ? new Date(`${m[1]}-${m[2]}-${m[3]}`) : new Date(`${m[3]}-${m[2]}-${m[1]}`);
    };
    const dates = validFrom.map(parse).filter((d) => d && !isNaN(d));
    const when = dates.length ? new Date(Math.max(...dates)) : new Date(this.data.updated);
    this.updated.hidden = false;
    this.updated.textContent = `${this.t.updated} ${when.toLocaleDateString(lang(this._hass, this.options?.language))}${
      dates.length ? "" : ", " + when.toLocaleTimeString(lang(this._hass, this.options?.language), { hour: "2-digit", minute: "2-digit" })
    }`;
  }
}

class MeteoSwissPanel extends HTMLElement {
  connectedCallback() {
    // A custom panel gets no height from its container: take the full window.
    this.style.display = "block";
    this.style.height = "100vh";
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._map) {
      this._map = new MeteoSwissMap(this.shadowRoot, { menuButton: true });
      this._map.narrow = this._narrow;
    }
    if (this._hass) this._map.hass = this._hass;
  }
  disconnectedCallback() {
    this._map?.destroy();
    this._map = null;
    this.shadowRoot.innerHTML = "";
  }
  set hass(hass) {
    this._hass = hass;
    if (this._map) this._map.hass = hass;
  }
  set panel(_p) {}
  set narrow(narrow) {
    // HA hides the sidebar on narrow screens: show a menu button instead.
    this._narrow = narrow;
    if (this._map) this._map.narrow = narrow;
  }
}

class MeteoSwissMapCard extends HTMLElement {
  setConfig(config) {
    const changed = this._map && JSON.stringify(config) !== JSON.stringify(this._config);
    this._config = config || {};
    if (changed) {
      // Edited in the card editor: rebuild with the new options.
      this._map.destroy();
      this._map = null;
      if (this.isConnected) this.connectedCallback();
    }
  }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._map) {
      this.shadowRoot.innerHTML = "";
      const card = document.createElement("ha-card");
      card.style.overflow = "hidden";
      const box = document.createElement("div");
      box.style.height = `${this._config?.height || 420}px`;
      card.appendChild(box);
      this.shadowRoot.appendChild(card);
      const inner = box.attachShadow({ mode: "open" });
      this._map = new MeteoSwissMap(inner, this._config);
    }
    if (this._hass) this._map.hass = this._hass;
  }
  disconnectedCallback() {
    this._map?.destroy();
    this._map = null;
  }
  set hass(hass) {
    this._hass = hass;
    if (this._map) this._map.hass = hass;
  }
  getCardSize() {
    return Math.ceil((this._config?.height || 420) / 50);
  }
  static getStubConfig() {
    return { layer: "weather", height: 420 };
  }
  static getConfigElement() {
    return document.createElement("meteoswiss-map-card-editor");
  }
}

const EDITOR = {
  fr: { layers: "Couches affichées (vide = toutes ; une seule = carte d’un seul danger)", layer: "Couche au démarrage", area: "Zone", zoom: "Zoom sur la région (7 – 12)", legend: "Légende", height: "Hauteur (px)", language: "Langue",
        areas: { switzerland: "Toute la Suisse", home: "Ma région (domicile)" } },
  de: { layers: "Angezeigte Ebenen (leer = alle; eine = Karte einer Gefahr)", layer: "Ebene beim Start", area: "Bereich", zoom: "Zoom auf die Region (7 – 12)", legend: "Legende", height: "Höhe (px)", language: "Sprache",
        areas: { switzerland: "Ganze Schweiz", home: "Meine Region (Zuhause)" } },
  it: { layers: "Livelli mostrati (vuoto = tutti; uno = carta di un solo pericolo)", layer: "Livello iniziale", area: "Zona", zoom: "Zoom sulla regione (7 – 12)", legend: "Legenda", height: "Altezza (px)", language: "Lingua",
        areas: { switzerland: "Tutta la Svizzera", home: "La mia regione (casa)" } },
  rm: { layers: "Nivels mussads (vid = tuts; in = charta d’in sulet privel)", layer: "Nivel a l’entschatta", area: "Zona", zoom: "Zoom sin la regiun (7 – 12)", legend: "Legenda", height: "Autezza (px)", language: "Lingua",
        areas: { switzerland: "Tut la Svizra", home: "Mia regiun (chasa)" } },
  en: { layers: "Layers shown (empty = all; one = single-hazard map)", layer: "Layer at start", area: "Area", zoom: "Zoom on the region (7 – 12)", legend: "Legend", height: "Height (px)", language: "Language",
        areas: { switzerland: "Whole Switzerland", home: "My region (home)" } },
};

class MeteoSwissMapCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }
  set hass(hass) {
    this._hass = hass;
    this._render();
  }
  _render() {
    if (!this._hass || !this._config) return;
    const l = lang(this._hass, this._config.language);
    const e = EDITOR[l];
    const t = I18N[l];
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (ev) => {
        const config = { ...ev.detail.value };
        if (Array.isArray(config.layers) && !config.layers.length) delete config.layers;
        if (config.area !== "home") delete config.zoom;
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const layerOptions = LAYERS.map((v) => ({ value: v, label: t.heading[v] }));
    this._form.hass = this._hass;
    this._form.data = { area: "switzerland", legend: true, height: 420, ...this._config };
    this._form.computeLabel = (sch) => e[sch.name] || sch.name;
    this._form.schema = [
      { name: "layers", selector: { select: { multiple: true, mode: "list", options: layerOptions } } },
      { name: "layer", selector: { select: { mode: "dropdown", options: layerOptions } } },
      { name: "area", selector: { select: { mode: "dropdown", options: ["switzerland", "home"].map((v) => ({ value: v, label: e.areas[v] })) } } },
      ...(this._config.area === "home" ? [{ name: "zoom", selector: { number: { min: 7, max: 12, step: 0.5, mode: "slider" } } }] : []),
      { name: "legend", selector: { boolean: {} } },
      { name: "height", selector: { number: { min: 200, max: 1200, step: 10, mode: "box" } } },
      { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "auto", label: "Auto" }, { value: "de", label: "Deutsch" }, { value: "fr", label: "Français" }, { value: "it", label: "Italiano" }, { value: "rm", label: "Rumantsch" }, { value: "en", label: "English" }] } } },
    ];
  }
}

if (!customElements.get("meteoswiss-panel")) customElements.define("meteoswiss-panel", MeteoSwissPanel);
if (!customElements.get("meteoswiss-map-card")) {
  customElements.define("meteoswiss-map-card", MeteoSwissMapCard);
  customElements.define("meteoswiss-map-card-editor", MeteoSwissMapCardEditor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "meteoswiss-map-card",
    name: "MeteoSwiss map",
    preview: true,
    description: "Switzerland or your region: weather, radar, weather warnings, forest fire, floods, drought, avalanches and pollen.",
  });
}
