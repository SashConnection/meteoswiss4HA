// MeteoSwiss Complete For HA - "app style" cards.
//
//   type: custom:meteoswiss-now-card     big pictogram, place, condition, temperature
//                                          + hour-by-hour chart (pictograms, temperature
//                                          with its uncertainty band, rain probability
//                                          and amount)
//   type: custom:meteoswiss-days-card    days (pictogram, min | max) above one continuous
//                                          temperature curve and rain histogram
//   type: custom:meteoswiss-tiles-card   "Weather warnings" (mini map + hazard chips) and
//                                          "Radar" (animated last hour) tiles
//
// All: entity (optional), language (auto, de, fr, it, rm, en). Dark design.

import { monument } from "./meteoswiss-monuments.js";

const DOMAIN = "meteoswiss4ha";
const DANGER = ["#9e9e9e", "#ccff66", "#ffff00", "#ff9900", "#ff0000", "#8b0000"];
const RAIN_SCALE = ["#9a7e95", "#0001fc", "#058c2d", "#05ff05", "#feff01", "#ffc703", "#ff7d01", "#ff1900"];
const RAIN_STEPS = [0.1, 1, 2, 4, 6, 10, 20, 40];

const T = {
  de: { lastHour: "Letzte Stunde", warnings: "Unwetter", radar: "Radar", hazards: "Naturgefahren", now: "Jetzt", noEntity: "Keine MeteoSwiss-Wetterentität gefunden.",
        prob: "Regenwahrscheinlichkeit", amount: "Regenmenge", allDays: "Prognose", f: { entity: "Wetter-Entität", name: "Titel", hours: "Stunden", days: "Tage", language: "Sprache", tap_path: "Ziel beim Antippen (z. B. /meteoswiss)", show_chart: "Stündliche Grafik" } },
  fr: { lastHour: "Dernière heure", warnings: "Intempéries", radar: "Radar", hazards: "Dangers naturels", now: "Maint.", noEntity: "Aucune entité météo MeteoSwiss trouvée.",
        prob: "Probabilité de pluie", amount: "Quantité de pluie", allDays: "Prévisions", f: { entity: "Entité météo", name: "Titre", hours: "Heures", days: "Jours", language: "Langue", tap_path: "Page ouverte au toucher (p. ex. /meteoswiss)", show_chart: "Graphique heure par heure" } },
  it: { lastHour: "Ultima ora", warnings: "Maltempo", radar: "Radar", hazards: "Pericoli naturali", now: "Ora", noEntity: "Nessuna entità meteo MeteoSwiss trovata.",
        prob: "Probabilità di pioggia", amount: "Quantità di pioggia", allDays: "Previsioni", f: { entity: "Entità meteo", name: "Titolo", hours: "Ore", days: "Giorni", language: "Lingua", tap_path: "Pagina aperta al tocco (es. /meteoswiss)", show_chart: "Grafico orario" } },
  rm: { lastHour: "Ultima ura", warnings: "Malaura", radar: "Radar", hazards: "Privels natirals", now: "Ussa", noEntity: "Nagina entitad d’aura MeteoSwiss chattada.",
        prob: "Probabilitad da plievgia", amount: "Quantitad da plievgia", allDays: "Prognosa", f: { entity: "Entitad d’aura", name: "Titel", hours: "Uras", days: "Dis", language: "Lingua", tap_path: "Pagina averta cun tutgar (p. ex. /meteoswiss)", show_chart: "Grafica per ura" } },
  en: { lastHour: "Last hour", warnings: "Severe weather", radar: "Radar", hazards: "Natural hazards", now: "Now", noEntity: "No MeteoSwiss weather entity found.",
        prob: "Rain probability", amount: "Rain amount", allDays: "Forecast", f: { entity: "Weather entity", name: "Title", hours: "Hours", days: "Days", language: "Language", tap_path: "Page opened on tap (e.g. /meteoswiss)", show_chart: "Hourly chart" } },
};
const LANGS = [{ value: "auto", label: "Auto" }, { value: "de", label: "Deutsch" }, { value: "fr", label: "Français" }, { value: "it", label: "Italiano" }, { value: "rm", label: "Rumantsch" }, { value: "en", label: "English" }];

const langOf = (hass, cfg) => {
  const l = cfg?.language && cfg.language !== "auto" ? cfg.language : (hass?.locale?.language || hass?.language || "en").split("-")[0];
  return T[l] ? l : "en";
};
const locOf = (hass, cfg) => (cfg?.language && cfg.language !== "auto" ? cfg.language : hass?.locale?.language || hass?.language || "en");
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const findEntity = (hass) =>
  Object.values(hass?.entities || {}).find((e) => e.platform === DOMAIN && e.entity_id.startsWith("weather."))?.entity_id ||
  Object.keys(hass?.states || {}).find((id) => id.startsWith("weather.") && hass.states[id].attributes.icons_url);
const hhmm = (d, loc) => d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const BASE_STYLE = `
:host { display: block; }
ha-card { overflow: hidden; color: #fff; background: linear-gradient(180deg, #0d1520 0%, #1b222b 60%, #262a30 100%); border: 0; }
.chart { border: 1px solid rgba(255,255,255,.65); border-radius: 18px; overflow-x: auto; overflow-y: hidden; background: rgba(0,0,0,.22); scrollbar-width: none; }
.chart::-webkit-scrollbar { display: none; }
svg text { font-family: inherit; fill: #fff; }
.empty { padding: 16px; color: #aaa; }
`;

// Live forecasts of the weather entity, shared by the card instances.
class ForecastMixin extends HTMLElement {
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    const entity = this._config?.entity || findEntity(hass);
    if (entity !== this._entity || first) {
      this._entity = entity;
      this._resubscribe();
    }
    const st = entity ? hass.states[entity] : null;
    if (st !== this._state) {
      this._state = st;
      this._render();
    }
  }
  connectedCallback() { this._connected = true; this._resubscribe(); }
  disconnectedCallback() { this._connected = false; this._unsubscribe(); }
  _unsubscribe() {
    (this._subs || []).forEach((p) => p.then((u) => u()).catch(() => {}));
    this._subs = [];
  }
  _resubscribe() {
    this._unsubscribe();
    if (!this._connected || !this._hass || !this._entity || !this._config) return;
    this._subs = this._types().map((type) =>
      this._hass.connection.subscribeMessage((msg) => {
        this[`_${type}`] = msg.forecast || [];
        this._render();
      }, { type: "weather/subscribe_forecast", entity_id: this._entity, forecast_type: type })
        .catch(() => { this[`_${type}`] = []; this._render(); return () => {}; }));
  }
  _types() { return ["hourly"]; }
  _root() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    return this.shadowRoot;
  }
}

// ------------------------------------------------------------- now card

class MeteoSwissNowCard extends ForecastMixin {
  setConfig(config) {
    this._config = { hours: 24, show_chart: true, ...config };
    this._resubscribe();
    this._render();
  }

  _chart(hours, icons, loc) {
    const COL = 56, n = hours.length, W = COL * n, H = 214;
    const ICON_Y = 4, TOP = 70, BOT = 150, BAR_BOT = 196, BAR_H = 52;
    const x = (i) => COL / 2 + i * COL;
    const vals = hours.flatMap((h) => [h.temperature, h.temperature_p10, h.temperature_p90]).filter((v) => v != null);
    const lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(hi - lo, 6);
    const y = (v) => BOT - ((v - lo) / span) * (BOT - TOP);
    const p = [];
    // Rain: probability (grey, full height = 100 %) and amount (colored).
    hours.forEach((h, i) => {
      const prob = h.precipitation_probability || 0;
      if (prob > 0) p.push(`<rect x="${x(i) - COL / 2 + 1}" y="${BAR_BOT - (prob / 100) * BAR_H}" width="${COL - 2}" height="${(prob / 100) * BAR_H}" fill="rgba(255,255,255,.16)"/>`);
      const mm = h.precipitation || 0;
      if (mm >= 0.1) {
        const c = RAIN_SCALE[Math.max(0, RAIN_STEPS.findLastIndex((s) => mm >= s))];
        const bh = Math.min(BAR_H, 8 + Math.log2(1 + mm) * 10);
        p.push(`<rect x="${x(i) - COL / 2 + 6}" y="${BAR_BOT - bh}" width="${COL - 12}" height="${bh}" rx="2" fill="${c}" opacity=".9"/>`);
      }
    });
    // Hour lines, labels, pictograms.
    hours.forEach((h, i) => {
      const d = new Date(h.datetime);
      const midnight = d.getHours() === 0;
      p.push(`<line x1="${x(i)}" x2="${x(i)}" y1="${TOP - 18}" y2="${BAR_BOT}" stroke="rgba(255,255,255,${midnight ? 0.6 : 0.22})"/>`);
      if (icons && h.meteoswiss_symbol != null) p.push(`<image href="${icons}/${h.meteoswiss_symbol}.svg" x="${x(i) - 20}" y="${ICON_Y}" width="40" height="40"/>`);
      if (h.temperature != null) p.push(`<text x="${x(i)}" y="${y(h.temperature) - 12}" text-anchor="middle" font-size="15">${Math.round(h.temperature)}°</text>`);
      p.push(`<text x="${x(i)}" y="${H - 2}" text-anchor="middle" font-size="13" font-weight="${midnight ? 700 : 400}">${hhmm(d, loc)}</text>`);
    });
    // Uncertainty band and temperature line, "now" dot.
    const up = hours.map((h, i) => [x(i), y(h.temperature_p90 ?? h.temperature)]);
    const dn = hours.map((h, i) => [x(i), y(h.temperature_p10 ?? h.temperature)]).reverse();
    p.push(`<path d="M${[...up, ...dn].map((q) => q.join(",")).join("L")}Z" fill="#e53935" opacity=".28"/>`);
    p.push(`<path d="M${hours.map((h, i) => `${x(i)},${y(h.temperature)}`).join("L")}" fill="none" stroke="#ef3b3b" stroke-width="3" stroke-linejoin="round"/>`);
    p.push(`<circle cx="${x(0)}" cy="${y(hours[0].temperature)}" r="7" fill="#ef3b3b"/>`);
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${p.join("")}</svg>`;
  }

  _render() {
    if (!this._config || !this._hass) return;
    const root = this._root();
    const t = T[langOf(this._hass, this._config)];
    const loc = locOf(this._hass, this._config);
    const st = this._state;
    if (!st) { root.innerHTML = `<style>${BASE_STYLE}</style><ha-card><div class="empty">${t.noEntity}</div></ha-card>`; return; }
    const a = st.attributes;
    const cond = this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state;
    const icon = a.icons_url && a.meteoswiss_symbol != null ? `<img class="big" src="${a.icons_url}/${a.meteoswiss_symbol}.svg" alt="">` : "";
    const temp = a.temperature != null ? `${Math.round(a.temperature)}${esc(a.temperature_unit || "°C")}` : "";
    const hours = (this._hourly || []).filter((h) => h.temperature != null).slice(0, Math.max(6, Math.min(48, Number(this._config.hours) || 24)));
    const chart = this._config.show_chart !== false && hours.length > 1 ? `<div class="chart">${this._chart(hours, a.icons_url, loc)}</div>` : "";
    root.innerHTML = `<style>${BASE_STYLE}
      .hero { position: relative; padding: 22px 22px 8px; min-height: 210px; cursor: pointer; }
      .place { font-size: 30px; font-weight: 700; line-height: 1.1; max-width: 60%; display: flex; align-items: center; gap: 8px; }
      .place svg.monument { width: 34px; height: 34px; flex: 0 0 34px; opacity: .9; }
      .cond { font-size: 20px; margin-top: 6px; max-width: 60%; }
      .temp { position: absolute; left: 22px; bottom: 14px; font-size: 32px; font-weight: 700; }
      .big { position: absolute; right: 6px; top: 6px; width: 200px; height: 200px; filter: drop-shadow(0 6px 14px rgba(0,0,0,.45)); }
      .chart { margin: 0 12px 14px; }
    </style><ha-card><div class="hero"><div class="place">${this._config.monument === false ? "" : monument(a.location || this._config.name)}${esc(this._config.name || a.location || a.friendly_name)}</div>
      <div class="cond">${esc(cond)}</div><div class="temp">${temp}</div>${icon}</div>${chart}</ha-card>`;
    root.querySelector(".hero").addEventListener("click", () =>
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: this._entity } })));
  }

  getCardSize() { return 7; }
  static getStubConfig(hass) { return { entity: findEntity(hass) }; }
  static getConfigElement() { return makeEditor([["entity"], ["name"], ["show_chart", "hours"], ["language"]]); }
}

// ------------------------------------------------------------ days card

class MeteoSwissDaysCard extends ForecastMixin {
  setConfig(config) {
    this._config = { days: 6, ...config };
    this._resubscribe();
    this._render();
  }
  _types() { return ["daily", "hourly"]; }

  _render() {
    if (!this._config || !this._hass) return;
    const root = this._root();
    const t = T[langOf(this._hass, this._config)];
    const loc = locOf(this._hass, this._config);
    const st = this._state;
    if (!st) { root.innerHTML = `<style>${BASE_STYLE}</style><ha-card><div class="empty">${t.noEntity}</div></ha-card>`; return; }
    const a = st.attributes;
    const nDays = Math.max(2, Math.min(9, Number(this._config.days) || 6));
    const days = (this._daily || []).slice(0, nDays);
    if (!days.length) { root.innerHTML = `<style>${BASE_STYLE}</style><ha-card><div class="empty">…</div></ha-card>`; return; }
    const W = 120 * days.length, H = 150, TOP = 14, BOT = 108, BAR_BOT = 150, BAR_H = 70;
    const start = new Date(days[0].datetime).getTime();
    const end = start + days.length * 864e5;
    const xt = (ms) => ((ms - start) / (end - start)) * W;
    // Hourly temperatures where available, then a curve through the daily min (06:00) / max (15:00).
    const hourly = (this._hourly || []).filter((h) => h.temperature != null).map((h) => ({ ...h, ms: new Date(h.datetime).getTime() })).filter((h) => h.ms >= start && h.ms < end);
    const lastHourly = hourly.length ? hourly[hourly.length - 1].ms : start;
    const synth = [];
    days.forEach((d) => {
      const day = new Date(d.datetime).getTime();
      [[6, d.templow], [15, d.temperature]].forEach(([hr, v]) => { const ms = day + hr * 36e5; if (v != null && ms > lastHourly) synth.push({ ms, temperature: v }); });
    });
    const all = [...hourly, ...synth];
    const vals = all.flatMap((h) => [h.temperature, h.temperature_p10, h.temperature_p90]).filter((v) => v != null);
    const lo = Math.min(0, ...vals) - 1, hi = Math.max(10, ...vals) + 1;
    const y = (v) => BOT - ((v - lo) / (hi - lo)) * (BOT - TOP);
    const p = [];
    // Grid: 0° and 10° (solid), 5° steps dotted.
    for (let v = Math.ceil(lo / 5) * 5; v <= hi; v += 5) {
      const solid = v % 10 === 0;
      p.push(`<line x1="0" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(255,255,255,${solid ? 0.4 : 0.25})" ${solid ? "" : 'stroke-dasharray="2 3"'}/>`);
      if (solid) p.push(`<text x="3" y="${y(v) - 3}" font-size="10" fill="rgba(255,255,255,.7)">${v}°</text>`);
    }
    // Rain histogram (hourly): probability grey, amount purple/blue.
    const cw = Math.max(1.5, W / (days.length * 24));
    hourly.forEach((h) => {
      const xx = xt(h.ms);
      const prob = h.precipitation_probability || 0;
      if (prob > 0) p.push(`<rect x="${xx}" y="${BAR_BOT - (prob / 100) * BAR_H}" width="${cw}" height="${(prob / 100) * BAR_H}" fill="rgba(255,255,255,.2)"/>`);
      const mm = h.precipitation || 0;
      if (mm >= 0.1) {
        const c = mm >= 1 ? "#1d3dff" : "#b392c9";
        p.push(`<rect x="${xx}" y="${BAR_BOT - Math.min(BAR_H, 4 + mm * 12)}" width="${cw}" height="${Math.min(BAR_H, 4 + mm * 12)}" fill="${c}"/>`);
      }
    });
    // Day separators.
    days.forEach((_, i) => { if (i) p.push(`<line x1="${i * 120}" x2="${i * 120}" y1="0" y2="${H}" stroke="rgba(255,255,255,.45)"/>`); });
    // Band and curve.
    if (hourly.length > 1) {
      const up = hourly.map((h) => [xt(h.ms), y(h.temperature_p90 ?? h.temperature)]);
      const dn = hourly.map((h) => [xt(h.ms), y(h.temperature_p10 ?? h.temperature)]).reverse();
      p.push(`<path d="M${[...up, ...dn].map((q) => q.map((v) => v.toFixed(1)).join(",")).join("L")}Z" fill="#e53935" opacity=".3"/>`);
    }
    const pts = all.sort((m, n) => m.ms - n.ms).map((h) => [xt(h.ms), y(h.temperature)]);
    if (pts.length > 1) {
      // Smooth curve (Catmull-Rom to Bézier).
      let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
        d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
      }
      p.push(`<path d="${d}" fill="none" stroke="#ff2323" stroke-width="3.5" stroke-linecap="round"/>`);
    }
    const head = days.map((d) => {
      const dt = new Date(d.datetime);
      const name = dt.toLocaleDateString(loc, { weekday: "short" }).replace(/\.$/, "");
      return `<div class="d"><div class="n">${esc(name.charAt(0).toUpperCase() + name.slice(1, 2))}</div>
        ${a.icons_url && d.meteoswiss_symbol != null ? `<img src="${a.icons_url}/${d.meteoswiss_symbol}.svg" alt="">` : ""}
        <div class="mm">${d.templow != null ? Math.round(d.templow) : "–"}° | ${d.temperature != null ? Math.round(d.temperature) : "–"}°</div></div>`;
    }).join("");
    root.innerHTML = `<style>${BASE_STYLE}
      ha-card { background: #1c1f24; border-radius: 22px; }
      .title { font-size: 26px; font-weight: 700; padding: 18px 20px 6px; display: flex; align-items: center; gap: 8px; }
      .title svg.monument { width: 30px; height: 30px; flex: 0 0 30px; opacity: .9; }
      .wrap { overflow-x: auto; scrollbar-width: none; }
      .wrap::-webkit-scrollbar { display: none; }
      .inner { width: 100%; min-width: ${days.length * 58}px; }
      .head { display: grid; grid-template-columns: repeat(${days.length}, 1fr); }
      .d { text-align: center; padding: 4px 0 8px; border-left: 1px solid rgba(255,255,255,.35); }
      .d:first-child { border-left: 0; }
      .n { font-size: 20px; color: #c9c9c9; }
      .d img { width: 46px; height: 46px; margin: 2px 0; }
      .mm { font-size: 14px; color: #bdbdbd; white-space: nowrap; }
      svg { display: block; width: 100%; height: 140px; }
    </style><ha-card><div class="title">${this._config.monument === false ? "" : monument(a.location || this._config.name)}${esc(this._config.name || a.location || a.friendly_name)}</div>
      <div class="wrap"><div class="inner"><div class="head">${head}</div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${p.join("")}</svg></div></div></ha-card>`;
  }

  getCardSize() { return 5; }
  static getStubConfig(hass) { return { entity: findEntity(hass) }; }
  static getConfigElement() { return makeEditor([["entity"], ["name"], ["days"], ["language"]]); }
}

// ----------------------------------------------------------- tiles card

let overviewRequest = null, overviewTime = 0, chOutline = null;
const loadOverview = (hass) => {
  if (!overviewRequest || Date.now() - overviewTime > 10 * 60000) {
    overviewTime = Date.now();
    overviewRequest = hass.callApi("GET", "meteoswiss4ha/overview").catch((e) => { overviewRequest = null; throw e; });
  }
  return overviewRequest;
};
const BASE_URL = new URL(".", import.meta.url).href;
const loadOutline = () => (chOutline ||= fetch(`${BASE_URL}switzerland.json`).then((r) => r.json()).catch(() => null));

// Simple projection of Switzerland in a W x H box (Web Mercator, like the radar).
const BOX = { w: 400, h: 260, west: 5.85, east: 10.6, south: 45.75, north: 47.85 };
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const px = (lon) => ((lon - BOX.west) / (BOX.east - BOX.west)) * BOX.w;
const py = (lat) => ((merc(BOX.north) - merc(lat)) / (merc(BOX.north) - merc(BOX.south))) * BOX.h;
const ring = (coords) => `M${coords.map(([lon, lat]) => `${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join("L")}Z`;
const geomPath = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates).map((poly) => poly.map(ring).join("")).join("");

const HAZARD_ICONS = { fire: "mdi:pine-tree-fire", flood: "mdi:home-flood", drought: "mdi:weather-sunny-alert", avalanche: "mdi:snowflake-alert" };
const WARN_ICONS = { rain: "mdi:weather-pouring", thunderstorm: "mdi:weather-lightning", wind: "mdi:weather-windy", snow: "mdi:weather-snowy-heavy", slippery_roads: "mdi:snowflake-melt", heat: "mdi:thermometer-high", frost: "mdi:snowflake-thermometer" };

class MeteoSwissTilesCard extends HTMLElement {
  setConfig(config) { this._config = { tap_path: "/meteoswiss", ...config }; this._render(); }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._load();
  }
  connectedCallback() { this._timer = setInterval(() => this._load(), 10 * 60000); this._startRadar(); }
  disconnectedCallback() { clearInterval(this._timer); clearInterval(this._anim); this._anim = null; }

  async _load() {
    if (!this._hass) return;
    try {
      const [overview, outline, warnings] = await Promise.all([
        loadOverview(this._hass), loadOutline(),
        this._hass.callApi("GET", "meteoswiss4ha/weather_warnings").catch(() => null),
      ]);
      this._data = { overview, outline, warnings };
      this._render();
      this._loadRadar();
    } catch (err) {
      this._error = true;
      this._render();
    }
  }

  async _loadRadar() {
    try {
      const list = await this._hass.callApi("GET", "meteoswiss4ha/radar/frames");
      const frames = (list.frames || []).slice(-12);
      const urls = await Promise.all(frames.map(async (time) => {
        const path = `/api/meteoswiss4ha/radar/frame/${encodeURIComponent(time)}`;
        const res = await this._hass.callWS({ type: "auth/sign_path", path, expires: 3600 });
        return res.path;
      }));
      this._radar = { bounds: list.bounds, urls, frames };
      this._render();
      this._startRadar();
    } catch (err) {
      this._radar = null;
    }
  }

  _startRadar() {
    if (this._anim || !this._radar?.urls?.length) return;
    let i = 0;
    this._anim = setInterval(() => {
      const img = this.shadowRoot?.querySelector(".radar image");
      if (!img || !this._radar) return;
      i = (i + 1) % this._radar.urls.length;
      img.setAttribute("href", this._radar.urls[i]);
    }, 450);
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const t = T[langOf(this._hass, this._config)];
    const d = this._data;
    const ch = d?.outline ? geomPath(d.outline.geometry) : "";
    // Warnings mini map: Switzerland green, warning regions in their level color.
    const regions = (d?.warnings?.features || []).sort((a, b) => a.properties.level - b.properties.level)
      .map((f) => `<path d="${geomPath(f.geometry)}" fill="${DANGER[f.properties.level]}" fill-opacity=".85"/>`).join("");
    const kinds = d?.overview?.warning_kinds || {};
    const maxima = d?.overview?.maxima || {};
    const chip = (icon, level) => `<span class="chip" style="background:${level > 1 ? DANGER[level] : "#cfe9a0"}"><ha-icon icon="${icon}"></ha-icon></span>`;
    const chips = [
      ...Object.entries(HAZARD_ICONS).map(([k, i]) => chip(i, maxima[k] || 1)),
      ...Object.entries(WARN_ICONS).map(([k, i]) => chip(i, kinds[k] || 1)),
    ].join("");
    let radar = "";
    if (this._radar?.bounds && this._radar.urls.length) {
      const [[s, w], [n, e]] = this._radar.bounds;
      radar = `<image href="${this._radar.urls[this._radar.urls.length - 1]}" x="${px(w)}" y="${py(n)}" width="${px(e) - px(w)}" height="${py(s) - py(n)}" preserveAspectRatio="none" opacity=".95"/>`;
    }
    const last = this._radar?.frames?.length ? hhmm(new Date(this._radar.frames[this._radar.frames.length - 1]), locOf(this._hass, this._config)) : "";
    this.shadowRoot.innerHTML = `<style>
      :host { display: block; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .tile { position: relative; border-radius: 18px; overflow: hidden; background: #2b2f35; cursor: pointer; color: #fff; display: flex; flex-direction: column; }
      .tile h3 { position: absolute; top: 10px; left: 14px; margin: 0; font-size: 22px; font-weight: 700; text-shadow: 0 1px 4px rgba(0,0,0,.7); z-index: 1; }
      .tile svg { display: block; width: 100%; height: auto; background: #3a3f46; }
      .foot { background: #1f2227; padding: 8px 12px 10px; }
      .foot b { font-size: 15px; }
      .chips { display: flex; gap: 4px; margin-top: 6px; overflow-x: auto; scrollbar-width: none; }
      .chip { flex: 0 0 28px; height: 28px; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #222; }
      .chip ha-icon { --mdc-icon-size: 20px; }
      .sub { margin-top: 6px; height: 28px; line-height: 28px; font-size: 14px; color: #cfd6dc; }
      .tile svg { flex: 1; }
      @container (max-width: 380px) { .tile h3 { font-size: 17px; } }
    </style><div class="grid">
      <div class="tile warn"><h3>${t.warnings}</h3>
        <svg viewBox="0 -44 ${BOX.w} ${BOX.h + 54}"><path d="${ch}" fill="#cfe9a0"/>${regions}<path d="${ch}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/></svg>
        <div class="foot"><b>${t.hazards}</b><div class="chips">${chips}</div></div></div>
      <div class="tile radar"><h3>${t.radar}</h3>
        <svg viewBox="0 -44 ${BOX.w} ${BOX.h + 54}"><path d="${ch}" fill="#4a5058"/>${radar}<path d="${ch}" fill="none" stroke="#e8e8e8" stroke-opacity=".9" stroke-width="2"/></svg>
        <div class="foot"><b>${t.lastHour}</b><div class="sub">${last}</div></div></div>
    </div>`;
    this.shadowRoot.querySelectorAll(".tile").forEach((el) => el.addEventListener("click", () => {
      if (!this._config.tap_path) return;
      history.pushState(null, "", this._config.tap_path);
      window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
    }));
  }

  getCardSize() { return 4; }
  static getStubConfig() { return { tap_path: "/meteoswiss" }; }
  static getConfigElement() { return makeEditor([["tap_path"], ["language"]]); }
}

// --------------------------------------------------------------- editors

const FIELDS = {
  entity: { selector: { entity: { domain: "weather", integration: DOMAIN } } },
  name: { selector: { text: {} } },
  hours: { selector: { number: { min: 6, max: 48, mode: "box" } } },
  days: { selector: { number: { min: 2, max: 9, mode: "box" } } },
  show_chart: { selector: { boolean: {} } },
  tap_path: { selector: { text: {} } },
  language: { selector: { select: { mode: "dropdown", options: LANGS } } },
};

function makeEditor(rows) {
  const el = document.createElement("meteoswiss-app-card-editor");
  el._rows = rows;
  return el;
}

class MeteoSwissAppCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }
  _render() {
    if (!this._hass || !this._config || !this._rows) return;
    const t = T[langOf(this._hass, this._config)];
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (e) =>
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = this._config;
    this._form.computeLabel = (s) => t.f[s.name] || s.name;
    this._form.schema = this._rows.map((row) => row.length === 1
      ? { name: row[0], ...FIELDS[row[0]] }
      : { type: "grid", name: "", schema: row.map((n) => ({ name: n, ...FIELDS[n] })) });
  }
}

const define = (tag, cls, name, description) => {
  if (customElements.get(tag)) return;
  customElements.define(tag, cls);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: tag, name, description, preview: true });
};
if (!customElements.get("meteoswiss-app-card-editor")) customElements.define("meteoswiss-app-card-editor", MeteoSwissAppCardEditor);
define("meteoswiss-now-card", MeteoSwissNowCard, "MeteoSwiss now", "Big pictogram, place and temperature, with an hour-by-hour chart.");
define("meteoswiss-days-card", MeteoSwissDaysCard, "MeteoSwiss days", "Days with pictograms above one continuous temperature curve and rain.");
define("meteoswiss-tiles-card", MeteoSwissTilesCard, "MeteoSwiss tiles", "Severe weather mini map with hazard chips, and an animated radar tile.");
