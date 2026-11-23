// MeteoSwiss Complete For HA - rain minute by minute, climate stripes, month summary, rivers, air quality, snow.
//
//   type: custom:meteoswiss-rain-card      rain at home over the next 60 minutes (radar), bar by bar
//   type: custom:meteoswiss-stripes-card   one stripe per year since the station opened (mean temperature)
//   type: custom:meteoswiss-month-card     this month and last month: temperature, rain, sunshine vs the normal
//   type: custom:meteoswiss-rivers-card    FOEN rivers: water temperature, discharge, level, flood danger
//   type: custom:meteoswiss-air-card       air quality (NABEL): ozone, NO2, PM10, PM2.5 against the standards
//   type: custom:meteoswiss-snow-card      snow depth at the stations near home

import { DANGER, api, define, esc, findWeather, hhmm, langOf, locOf, num, relatedSensors } from "./meteoswiss-common.js";
import { F, sectionEditor } from "./meteoswiss-editor.js";

const T = {
  de: { rain: "Regen in der nächsten Stunde", none: "Kein Regen in der nächsten Stunde", now: "Es regnet", inMin: (m) => `Regen in ${m} Min.`, stops: (m) => `Hört in etwa ${m} Min. auf`,
        noRadar: "Radar nicht verfügbar", min: "Min.", stripes: "Klimastreifen", since: (y) => `seit ${y}`, vsRef: (d) => `Letzte 10 Jahre: ${d} °C gegenüber 1961–1990`,
        month: "Monatsbilanz", thisMonth: "Dieser Monat", lastMonth: "Letzter Monat", tmean: "Mitteltemperatur", rainSum: "Niederschlag", rainDays: "Regentage", sun: "Sonnenschein",
        frost: "Frosttage", summer: "Sommertage", hot: "Hitzetage", extremes: "Extreme", normal: "Norm", vsNormal: (p) => `${p} % der Norm`,
        rivers: "Flüsse", temp: "Wasser", flow: "Abfluss", level: "Pegel", danger: "Gefahr", noRivers: "Keine Flüsse gewählt (Optionen → Seen, Flüsse und Nebel).",
        air: "Luftqualität", airLevels: { good: "Gut", elevated: "Erhöht", high: "Hoch", very_high: "Sehr hoch" }, limit: "Grenzwert", noAir: "Luftqualität nicht verfügbar.",
        snow: "Schneehöhe", noSnow: "Keine Schneemessung verfügbar.", today: "heute", unavailable: "Daten noch nicht verfügbar.",
        swim: { ideal: "Ideal zum Baden", pleasant: "Angenehm", fresh: "Frisch", cold: "Kalt" },
        f: { entity: "Wetter-Entität", name: "Titel" } },
  fr: { rain: "Pluie dans l’heure", none: "Pas de pluie dans l’heure", now: "Il pleut", inMin: (m) => `Pluie dans ${m} min`, stops: (m) => `S’arrête dans environ ${m} min`,
        noRadar: "Radar indisponible", min: "min", stripes: "Bandes du climat", since: (y) => `depuis ${y}`, vsRef: (d) => `10 dernières années : ${d} °C par rapport à 1961–1990`,
        month: "Bilan du mois", thisMonth: "Ce mois-ci", lastMonth: "Le mois passé", tmean: "Température moyenne", rainSum: "Précipitations", rainDays: "Jours de pluie", sun: "Ensoleillement",
        frost: "Jours de gel", summer: "Jours d’été", hot: "Jours de canicule", extremes: "Extrêmes", normal: "Normale", vsNormal: (p) => `${p} % de la normale`,
        rivers: "Rivières", temp: "Eau", flow: "Débit", level: "Niveau", danger: "Danger", noRivers: "Aucune rivière choisie (options → Lacs, rivières et brouillard).",
        air: "Qualité de l’air", airLevels: { good: "Bonne", elevated: "Accrue", high: "Élevée", very_high: "Très élevée" }, limit: "Valeur limite", noAir: "Qualité de l’air indisponible.",
        snow: "Hauteur de neige", noSnow: "Aucune mesure de neige disponible.", today: "aujourd’hui", unavailable: "Données pas encore disponibles.",
        swim: { ideal: "Idéal pour se baigner", pleasant: "Agréable", fresh: "Fraîche", cold: "Froide" },
        f: { entity: "Entité météo", name: "Titre" } },
  it: { rain: "Pioggia nella prossima ora", none: "Nessuna pioggia nella prossima ora", now: "Piove", inMin: (m) => `Pioggia tra ${m} min`, stops: (m) => `Smette tra circa ${m} min`,
        noRadar: "Radar non disponibile", min: "min", stripes: "Strisce del clima", since: (y) => `dal ${y}`, vsRef: (d) => `Ultimi 10 anni: ${d} °C rispetto al 1961–1990`,
        month: "Bilancio del mese", thisMonth: "Questo mese", lastMonth: "Il mese scorso", tmean: "Temperatura media", rainSum: "Precipitazioni", rainDays: "Giorni di pioggia", sun: "Soleggiamento",
        frost: "Giorni di gelo", summer: "Giorni estivi", hot: "Giorni di canicola", extremes: "Estremi", normal: "Norma", vsNormal: (p) => `${p} % della norma`,
        rivers: "Fiumi", temp: "Acqua", flow: "Portata", level: "Livello", danger: "Pericolo", noRivers: "Nessun fiume scelto (opzioni → Laghi, fiumi e nebbia).",
        air: "Qualità dell’aria", airLevels: { good: "Buona", elevated: "Aumentata", high: "Elevata", very_high: "Molto elevata" }, limit: "Valore limite", noAir: "Qualità dell’aria non disponibile.",
        snow: "Altezza della neve", noSnow: "Nessuna misura della neve disponibile.", today: "oggi", unavailable: "Dati non ancora disponibili.",
        swim: { ideal: "Ideale per nuotare", pleasant: "Gradevole", fresh: "Fresca", cold: "Fredda" },
        f: { entity: "Entità meteo", name: "Titolo" } },
  rm: { rain: "Plievgia en la proxima ura", none: "Nagina plievgia en la proxima ura", now: "I plova", inMin: (m) => `Plievgia en ${m} min`, stops: (m) => `Chala en circa ${m} min`,
        noRadar: "Radar betg disponibel", min: "min", stripes: "Strivlas dal clima", since: (y) => `dapi ${y}`, vsRef: (d) => `Ultims 10 onns: ${d} °C cumpareglià cun 1961–1990`,
        month: "Bilanza dal mais", thisMonth: "Quest mais", lastMonth: "L’ultim mais", tmean: "Temperatura media", rainSum: "Precipitaziun", rainDays: "Dis da plievgia", sun: "Sulegl",
        frost: "Dis da gelischun", summer: "Dis da stad", hot: "Dis da chalira", extremes: "Extrems", normal: "Norma", vsNormal: (p) => `${p} % da la norma`,
        rivers: "Flums", temp: "Aua", flow: "Debit", level: "Nivel", danger: "Privel", noRivers: "Nagins flums tschernids (opziuns → Lais, flums e tschajera).",
        air: "Qualitad da l’aria", airLevels: { good: "Buna", elevated: "Augmentada", high: "Auta", very_high: "Fitg auta" }, limit: "Valur limita", noAir: "Qualitad da l’aria betg disponibla.",
        snow: "Autezza da la naiv", noSnow: "Nagina mesiraziun da naiv disponibla.", today: "oz", unavailable: "Datas anc betg disponiblas.",
        swim: { ideal: "Ideal per nudar", pleasant: "Agreabel", fresh: "Fraida", cold: "Fraida fitg" },
        f: { entity: "Entitad d’aura", name: "Titel" } },
  en: { rain: "Rain in the next hour", none: "No rain in the next hour", now: "Raining", inMin: (m) => `Rain in ${m} min`, stops: (m) => `Stops in about ${m} min`,
        noRadar: "Radar unavailable", min: "min", stripes: "Climate stripes", since: (y) => `since ${y}`, vsRef: (d) => `Last 10 years: ${d} °C vs 1961–1990`,
        month: "Month summary", thisMonth: "This month", lastMonth: "Last month", tmean: "Mean temperature", rainSum: "Precipitation", rainDays: "Rain days", sun: "Sunshine",
        frost: "Frost days", summer: "Summer days", hot: "Hot days", extremes: "Extremes", normal: "Normal", vsNormal: (p) => `${p} % of normal`,
        rivers: "Rivers", temp: "Water", flow: "Discharge", level: "Level", danger: "Danger", noRivers: "No river chosen (options → Lakes, rivers and fog).",
        air: "Air quality", airLevels: { good: "Good", elevated: "Elevated", high: "High", very_high: "Very high" }, limit: "Limit", noAir: "Air quality unavailable.",
        snow: "Snow depth", noSnow: "No snow measurement available.", today: "today", unavailable: "Data not available yet.",
        swim: { ideal: "Ideal for a swim", pleasant: "Pleasant", fresh: "Fresh", cold: "Cold" },
        f: { entity: "Weather entity", name: "Title" } },
};
const LABELS = Object.fromEntries(Object.entries(T).map(([l, t]) => [l, t.f]));
const STYLE = `
:host { display: block; }
ha-card { overflow: hidden; color: #fff; background: linear-gradient(180deg, #0d1520 0%, #1b222b 60%, #262a30 100%); border: 0; }
.title { font-size: 20px; font-weight: 700; padding: 14px 18px 4px; }
.sub { font-size: 13px; opacity: .75; padding: 0 18px 10px; }
.empty { padding: 4px 18px 16px; color: #aaa; }
.big { font-size: 26px; font-weight: 600; padding: 4px 18px 2px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 6px 14px 14px; }
.cell { background: rgba(255,255,255,.07); border-radius: 12px; padding: 8px 12px; font-size: 14px; }
.cell .k { font-size: 12px; opacity: .7; }
.cell .v { font-size: 17px; font-weight: 600; }
`;
const shadow = (el) => el.shadowRoot || el.attachShadow({ mode: "open" });
const editor = (doc) => sectionEditor({ labels: LABELS, doc: { fr: doc, en: doc }, top: () => [F.weather, F.text("name")], sections: [] });

class Base extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) this._load?.(); this._render(); }
  get t() { return T[langOf(this._hass, this._config)]; }
  get loc() { return locOf(this._hass, this._config); }
  sensors() { return relatedSensors(this._hass, this._config.entity || findWeather(this._hass)); }
  getCardSize() { return 4; }
  static getStubConfig() { return {}; }
}

// ============================================================ rain minute by minute

class MeteoSwissRainCard extends Base {
  _render() {
    if (!this._config || !this._hass) return;
    const t = this.t, st = this.sensors().rain_arrival, a = st?.attributes || {};
    const line = a.timeline || [];
    let head = t.noRadar, sub = "";
    if (line.length) {
      const wet = (x) => x.rain >= 0.3;
      if (wet(line[0])) { const dry = line.find((x) => !wet(x)); head = t.now; if (dry) sub = t.stops(dry.minutes); }
      else { const first = line.find(wet); head = first ? t.inMin(first.minutes) : t.none; }
    }
    const bars = line.map((x) => {
      const h = Math.max(3, Math.round(x.rain * 70));
      const c = x.rain >= 0.6 ? "#2f7fd8" : x.rain >= 0.3 ? "#64a8f0" : x.rain > 0.05 ? "#9cc9f5" : "rgba(255,255,255,.15)";
      return `<div class="bar"><div style="height:${h}px;background:${c}"></div><span>${x.minutes % 15 === 0 ? x.minutes : ""}</span></div>`;
    }).join("");
    shadow(this).innerHTML = `<style>${STYLE}
      .bars { display: flex; align-items: flex-end; gap: 4px; height: 96px; padding: 4px 18px 0; }
      .bar { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; height: 100%; }
      .bar div { width: 100%; border-radius: 4px 4px 0 0; }
      .bar span { font-size: 11px; opacity: .7; height: 14px; }
      .foot { font-size: 12px; opacity: .6; padding: 2px 18px 12px; text-align: right; }
    </style><ha-card><div class="title">${esc(this._config.name || t.rain)}</div>
      <div class="big">${line.length ? "☂ " : ""}${esc(head)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
      ${line.length ? `<div class="bars">${bars}</div><div class="foot">${t.min} · ${a.radar_time ? hhmm(a.radar_time, this.loc) : ""}</div>` : `<div class="empty">${t.unavailable}</div>`}
    </ha-card>`;
  }
  static getConfigElement() { return editor("#card-rain"); }
}

// ============================================================ climate stripes

const STRIPES = ["#08306b", "#08519c", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#deebf7",
  "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"];

class MeteoSwissStripesCard extends Base {
  _load() { api(this._hass, "climate", 6 * 3600000).then((d) => { this._data = d; this._render(); }).catch(() => { this._data = null; this._failed = true; this._render(); }); }
  _render() {
    if (!this._config || !this._hass) return;
    const t = this.t, d = this._data, years = d?.years || [];
    let body = `<div class="empty">${this._failed ? t.unavailable : "…"}</div>`;
    if (years.length) {
      const ref = d.reference ?? years.reduce((s, y) => s + y.t, 0) / years.length;
      const span = Math.max(...years.map((y) => Math.abs(y.t - ref)), 0.5);
      const w = 100 / years.length;
      const rects = years.map((y, i) => {
        const k = Math.max(0, Math.min(STRIPES.length - 1, Math.floor(((y.t - ref) / span + 1) / 2 * STRIPES.length)));
        return `<rect x="${(i * w).toFixed(3)}" y="0" width="${(w + 0.05).toFixed(3)}" height="100" fill="${STRIPES[k]}"><title>${y.year}: ${num(y.t, this.loc, 1)} °C</title></rect>`;
      }).join("");
      const last = years.slice(-10), recent = last.reduce((s, y) => s + y.t, 0) / last.length;
      body = `<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="display:block;width:100%;height:120px">${rects}</svg>
        <div class="row"><span>${years[0].year}</span><span>${years[years.length - 1].year}</span></div>
        ${d.reference != null ? `<div class="sub">${esc(t.vsRef((recent > d.reference ? "+" : "") + num(recent - d.reference, this.loc, 1)))}</div>` : ""}`;
    }
    shadow(this).innerHTML = `<style>${STYLE} .row { display: flex; justify-content: space-between; font-size: 12px; opacity: .7; padding: 4px 18px; }</style>
      <ha-card><div class="title">${esc(this._config.name || t.stripes)}</div>
      ${years.length ? `<div class="sub">${esc(d.name || d.station)} · ${t.since(years[0].year)}</div>` : ""}${body}</ha-card>`;
  }
  static getConfigElement() { return editor("#card-stripes"); }
}

// ============================================================ month summary

class MeteoSwissMonthCard extends Base {
  _load() { api(this._hass, "climate", 3 * 3600000).then((d) => { this._data = d; this._render(); }).catch(() => { this._failed = true; this._render(); }); }
  _month(m, title) {
    const t = this.t, loc = this.loc, n = m.normal || {};
    // A month in progress is compared with the share of the normal for the days already past.
    const share = m.days / new Date(m.year, m.month, 0).getDate();
    const pct = (v, ref) => (v != null && ref ? Math.round((v / (ref * share)) * 100) : null);
    const name = new Date(m.year, m.month - 1, 1).toLocaleDateString(loc, { month: "long", year: "numeric" });
    const cell = (k, v, extra = "") => `<div class="cell"><div class="k">${k}</div><div class="v">${v}</div>${extra ? `<div class="k">${extra}</div>` : ""}</div>`;
    const dt = m.tmean_vs_normal;
    return `<div class="title" style="font-size:16px">${title} · <span style="text-transform:capitalize">${esc(name)}</span></div><div class="grid">
      ${cell(t.tmean, `${num(m.tmean, loc, 1)} °C`, dt != null ? `${dt > 0 ? "+" : ""}${num(dt, loc, 1)} °C · ${t.normal} ${num(n.tmean, loc, 1)} °C` : "")}
      ${cell(t.rainSum, `${num(m.rain, loc)} mm`, pct(m.rain, n.rain) != null ? t.vsNormal(pct(m.rain, n.rain)) : "")}
      ${cell(t.sun, `${num(m.sunshine, loc)} h`, pct(m.sunshine, n.sunshine) != null ? t.vsNormal(pct(m.sunshine, n.sunshine)) : "")}
      ${cell(t.rainDays, m.rain_days)}
      ${cell(`${t.frost} · ${t.summer} · ${t.hot}`, `${m.frost_days} · ${m.summer_days} · ${m.hot_days}`)}
      ${cell(t.extremes, `${num(m.tmin, loc, 1)} / ${num(m.tmax, loc, 1)} °C`)}
    </div>`;
  }
  _render() {
    if (!this._config || !this._hass) return;
    const t = this.t, months = this._data?.months || [];
    shadow(this).innerHTML = `<style>${STYLE}</style><ha-card>
      ${months.length ? `${this._month(months[0], t.thisMonth)}${months[1] ? this._month(months[1], t.lastMonth) : ""}` : `<div class="title">${t.month}</div><div class="empty">${this._failed ? t.unavailable : "…"}</div>`}
    </ha-card>`;
  }
  getCardSize() { return 7; }
  static getConfigElement() { return editor("#card-month"); }
}

// ============================================================ rivers

class MeteoSwissRiversCard extends Base {
  _load() { const get = () => api(this._hass, "rivers", 10 * 60000).then((d) => { this._data = d; this._render(); }).catch(() => { this._failed = true; this._render(); }); get(); this._timer = setInterval(get, 10 * 60000); }
  disconnectedCallback() { clearInterval(this._timer); this._timer = null; }
  connectedCallback() { if (this._hass && !this._timer) this._load(); }
  _render() {
    if (!this._config || !this._hass) return;
    const t = this.t, loc = this.loc, list = this._data?.stations || [];
    const air = this._hass.states[findWeather(this._hass)]?.attributes?.temperature;
    const swim = (w) => (w == null ? null : w >= 22 && (air ?? 0) >= 22 ? "ideal" : w >= 19 && (air ?? 0) >= 18 ? "pleasant" : w >= 15 ? "fresh" : "cold");
    const rows = list.map((s) => `<div class="river">
        <div class="name">${esc(s.water || "")}<small>${esc(s.name)}</small></div>
        <div class="vals">
          ${s.temperature != null ? `<div><b>${num(s.temperature, loc, 1)} °C</b><span>${t.temp}${swim(s.temperature) ? ` · ${t.swim[swim(s.temperature)]}` : ""}</span></div>` : ""}
          ${s.discharge != null ? `<div><b>${num(s.discharge, loc, s.discharge < 10 ? 1 : 0)} m³/s</b><span>${t.flow}</span></div>` : ""}
          ${s.level != null ? `<div><b>${num(s.level, loc, 2)} m</b><span>${t.level}</span></div>` : ""}
          ${s.danger != null ? `<div><b style="color:${DANGER[s.danger] || "#fff"}">●&nbsp;${s.danger}</b><span>${t.danger}</span></div>` : ""}
        </div></div>`).join("");
    shadow(this).innerHTML = `<style>${STYLE}
      .river { margin: 6px 14px; background: rgba(255,255,255,.07); border-radius: 12px; padding: 10px 12px; }
      .name { font-weight: 700; font-size: 16px; } .name small { display: block; font-weight: 400; font-size: 12px; opacity: .7; }
      .vals { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 6px; }
      .vals b { display: block; font-size: 18px; } .vals span { font-size: 12px; opacity: .7; }
      .foot { font-size: 11px; opacity: .5; padding: 6px 18px 12px; }
    </style><ha-card><div class="title">${esc(this._config.name || t.rivers)}</div>
      ${list.length ? rows : `<div class="empty">${this._failed ? t.noRivers : "…"}</div>`}
      ${list.length ? `<div class="foot">FOEN / BAFU · ${list[0].time ? hhmm(list[0].time, loc) : ""}</div>` : ""}</ha-card>`;
  }
  static getConfigElement() { return editor("#card-rivers"); }
}

// ============================================================ air quality

const AIR_COLORS = { good: "#4caf50", elevated: "#ffeb3b", high: "#ff9800", very_high: "#f44336" };

class MeteoSwissAirCard extends Base {
  _render() {
    if (!this._config || !this._hass) return;
    const t = this.t, loc = this.loc, st = this.sensors().air_quality, a = st?.attributes || {};
    const rows = [["O₃", a.o3, 120, "1 h"], ["NO₂", a.no2, 80, "24 h"], ["PM10", a.pm10, 50, "24 h"], ["PM2.5", a.pm25, null, "24 h"]]
      .filter(([, v]) => v != null)
      .map(([k, v, lim, per]) => {
        const r = lim ? v / lim : 0, c = !lim ? "#90caf9" : r <= 1 ? AIR_COLORS.good : r <= 1.5 ? AIR_COLORS.elevated : r <= 2 ? AIR_COLORS.high : AIR_COLORS.very_high;
        const w = lim ? Math.min(100, (v / (lim * 2)) * 100) : Math.min(100, v);
        return `<div class="p"><span class="k">${k} <small>${per}</small></span><div class="track"><div style="width:${w}%;background:${c}"></div>${lim ? `<i style="left:50%"></i>` : ""}</div><b>${num(v, loc)} µg/m³</b></div>`;
      }).join("");
    const level = st?.state;
    shadow(this).innerHTML = `<style>${STYLE}
      .p { display: grid; grid-template-columns: 74px 1fr 82px; align-items: center; gap: 8px; padding: 5px 18px; font-size: 14px; }
      .p small { opacity: .6; font-size: 11px; } .p b { text-align: right; }
      .track { position: relative; height: 10px; background: rgba(255,255,255,.1); border-radius: 5px; }
      .track div { height: 100%; border-radius: 5px; } .track i { position: absolute; top: -3px; bottom: -3px; width: 2px; background: #fff; opacity: .6; }
      .foot { font-size: 11px; opacity: .5; padding: 8px 18px 12px; }
    </style><ha-card><div class="title">${esc(this._config.name || t.air)}</div>
      ${st && AIR_COLORS[level] ? `<div class="big" style="color:${AIR_COLORS[level]}">● ${esc(t.airLevels[level])}</div><div class="sub">${esc(a.site || "")}</div>${rows}
        <div class="foot">| = ${t.limit} · NABEL (FOEN / Empa)${a.time ? ` · ${esc(a.time)}` : ""}</div>` : `<div class="empty">${t.noAir}</div>`}
    </ha-card>`;
  }
  static getConfigElement() { return editor("#card-air"); }
}

// ============================================================ snow

class MeteoSwissSnowCard extends Base {
  _render() {
    if (!this._config || !this._hass) return;
    const t = this.t, loc = this.loc, st = this.sensors().snow_depth, list = st?.attributes?.stations || [];
    const max = Math.max(50, ...list.map((s) => s.depth || 0));
    const rows = list.map((s) => `<div class="s"><span class="n">${esc(s.name)}<small>${num(s.altitude, loc)} m · ${s.distance} km</small></span>
      <div class="track"><div style="width:${((s.depth || 0) / max) * 100}%"></div></div>
      <b>${num(s.depth, loc)} cm${s.change ? `<small>${s.change > 0 ? "+" : ""}${s.change} ${t.today}</small>` : ""}</b></div>`).join("");
    shadow(this).innerHTML = `<style>${STYLE}
      .s { display: grid; grid-template-columns: 1.3fr 1fr 70px; gap: 8px; align-items: center; padding: 6px 18px; font-size: 14px; }
      .s small { display: block; font-size: 11px; opacity: .6; } .s b { text-align: right; }
      .track { height: 10px; background: rgba(255,255,255,.1); border-radius: 5px; } .track div { height: 100%; border-radius: 5px; background: #e3f2fd; }
      .foot { font-size: 11px; opacity: .5; padding: 6px 18px 12px; }
    </style><ha-card><div class="title">❄ ${esc(this._config.name || t.snow)}</div>
      ${list.length ? `${rows}<div class="foot">MeteoSwiss</div>` : `<div class="empty">${t.noSnow}</div>`}</ha-card>`;
  }
  static getConfigElement() { return editor("#card-snow"); }
}

define("meteoswiss-rain-card", MeteoSwissRainCard, "MeteoSwiss rain minute by minute", "Rain at home over the next 60 minutes, from the radar.");
define("meteoswiss-stripes-card", MeteoSwissStripesCard, "MeteoSwiss climate stripes", "One stripe per year since the station opened, colored by the mean temperature.");
define("meteoswiss-month-card", MeteoSwissMonthCard, "MeteoSwiss month summary", "This month and last month: temperature, rain, sunshine, frost and hot days vs the normal.");
define("meteoswiss-rivers-card", MeteoSwissRiversCard, "MeteoSwiss rivers", "Water temperature, discharge, level and flood danger of your rivers (FOEN).");
define("meteoswiss-air-card", MeteoSwissAirCard, "MeteoSwiss air quality", "Ozone, NO2, PM10 and PM2.5 against the Swiss standards (NABEL).");
define("meteoswiss-snow-card", MeteoSwissSnowCard, "MeteoSwiss snow", "Snow depth at the stations near home.");
