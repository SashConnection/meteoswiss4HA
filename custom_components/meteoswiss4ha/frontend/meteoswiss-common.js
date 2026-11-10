// MeteoSwiss Complete For HA - helpers shared by the newer cards.

export const DOMAIN = "meteoswiss4ha";
export const LANG_CODES = ["de", "fr", "it", "rm", "en"];
export const LANGS = [
  { value: "auto", label: "Auto" }, { value: "de", label: "Deutsch" }, { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" }, { value: "rm", label: "Rumantsch" }, { value: "en", label: "English" },
];
export const DANGER = ["#9e9e9e", "#ccff66", "#ffff00", "#ff9900", "#ff0000", "#8b0000"];

export const langOf = (hass, cfg) => {
  const l = cfg?.language && cfg.language !== "auto" ? cfg.language : (hass?.locale?.language || hass?.language || "en").split("-")[0];
  return LANG_CODES.includes(l) ? l : "en";
};
// Locale for dates and numbers (Romansh: browsers know "rm" poorly, fall back to de-CH formats).
export const locOf = (hass, cfg) => {
  const l = langOf(hass, cfg);
  return l === "rm" ? "rm-CH" : `${l}-CH`;
};
export const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const hhmm = (d, loc) => new Date(d).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
export const hh = (d, loc) => new Date(d).toLocaleTimeString(loc, { hour: "2-digit", hourCycle: "h23" }).replace(/\D+$/, "") + " h";
export const weekday = (d, loc, style = "long") => {
  const s = new Date(d).toLocaleDateString(loc, { weekday: style });
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const num = (v, loc, digits = 0) => (v == null || Number.isNaN(v) ? "–" : Number(v).toLocaleString(loc, { maximumFractionDigits: digits, minimumFractionDigits: digits }));

export const findWeather = (hass) =>
  Object.values(hass?.entities || {}).find((e) => e.platform === DOMAIN && e.entity_id.startsWith("weather."))?.entity_id ||
  Object.keys(hass?.states || {}).find((id) => id.startsWith("weather.") && hass.states[id].attributes.icons_url);

// Sensors of the integration on the same device as the weather entity, keyed by translation key
// (falls back to the icon when the registry entry has no translation key).
const ICON_KEYS = {
  "mdi:weather-pouring": "rain_warning", "mdi:weather-lightning": "thunderstorm_warning", "mdi:weather-windy": "wind_warning",
  "mdi:weather-snowy-heavy": "snow_warning", "mdi:snowflake-melt": "slippery_roads_warning", "mdi:thermometer-high": "heat_warning",
  "mdi:snowflake-thermometer": "frost_warning", "mdi:flower-pollen": "pollen_level", "mdi:weather-fog": "fog",
  "mdi:arrow-collapse-up": "fog_top", "mdi:snowflake-alert": "avalanche_danger", "mdi:pine-tree-fire": "forest_fire_danger",
  "mdi:home-flood": "flood_danger", "mdi:weather-sunny-alert": "drought_danger",
};
export const relatedSensors = (hass, weatherId) => {
  const dev = hass?.entities?.[weatherId]?.device_id;
  const out = {};
  for (const e of Object.values(hass?.entities || {})) {
    if (e.platform !== DOMAIN || !e.entity_id.startsWith("sensor.") || (dev && e.device_id !== dev)) continue;
    const st = hass.states[e.entity_id];
    if (!st) continue;
    const key = e.translation_key || ICON_KEYS[st.attributes.icon];
    if (key && !out[key]) out[key] = st;
  }
  return out;
};
export const WARNING_KINDS = ["rain", "thunderstorm", "wind", "snow", "slippery_roads", "heat", "frost"];
export const WARN_ICONS = { rain: "mdi:weather-pouring", thunderstorm: "mdi:weather-lightning", wind: "mdi:weather-windy", snow: "mdi:weather-snowy-heavy", slippery_roads: "mdi:snowflake-melt", heat: "mdi:thermometer-high", frost: "mdi:snowflake-thermometer" };

// Day codes of the MeteoSwiss symbols (night = day + 100).
export const dayCode = (c) => (c == null ? null : Number(c) % 100);
export const isWetCode = (c) => { const d = dayCode(c); return d != null && ![1, 2, 3, 4, 5, 26, 27, 28, 35].includes(d); };
export const isSunnyCode = (c) => [1, 2, 26].includes(dayCode(c));

// Cached API calls (shared by the card instances).
const apiCache = new Map();
export const api = (hass, path, ttl = 10 * 60000) => {
  const hit = apiCache.get(path);
  if (hit && Date.now() - hit.time < ttl) return hit.promise;
  const promise = hass.callApi("GET", `${DOMAIN}/${path}`);
  apiCache.set(path, { time: Date.now(), promise });
  promise.catch(() => apiCache.delete(path));
  return promise;
};

// Live forecasts of a weather entity.
export class ForecastCard extends HTMLElement {
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    const entity = this._config?.entity || findWeather(hass);
    if (entity !== this._entity || first) {
      this._entity = entity;
      this._resubscribe();
    }
    const st = entity ? hass.states[entity] : null;
    if (st !== this._state || this._watch?.some((id) => hass.states[id] !== this._seen?.[id])) {
      this._state = st;
      this._seen = Object.fromEntries((this._watch || []).map((id) => [id, hass.states[id]]));
      this._render();
    }
  }
  get hass() { return this._hass; }
  connectedCallback() { this._connected = true; this._resubscribe(); }
  disconnectedCallback() { this._connected = false; this._unsubscribe(); }
  _unsubscribe() { (this._subs || []).forEach((p) => p.then((u) => u()).catch(() => {})); this._subs = []; }
  _resubscribe() {
    this._unsubscribe();
    if (!this._connected || !this._hass || !this._entity || !this._config) return;
    this._subs = this._types().map((type) =>
      this._hass.connection.subscribeMessage((msg) => { this[`_${type}`] = msg.forecast || []; this._render(); },
        { type: "weather/subscribe_forecast", entity_id: this._entity, forecast_type: type })
        .catch(() => { this[`_${type}`] = []; this._render(); return () => {}; }));
  }
  _types() { return ["hourly"]; }
  _root() { if (!this.shadowRoot) this.attachShadow({ mode: "open" }); return this.shadowRoot; }
}

// ha-form editor built from a list of rows of field names.
export function makeEditor(rows, fields, labels) {
  const el = document.createElement("meteoswiss-panel-editor");
  el._rows = rows; el._fields = fields; el._labels = labels;
  return el;
}
class PanelEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }
  _render() {
    if (!this._hass || !this._config || !this._rows) return;
    const lang = langOf(this._hass, this._config);
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (e) =>
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._form);
    }
    const fields = typeof this._fields === "function" ? this._fields(this._hass, lang) : this._fields;
    this._form.hass = this._hass;
    this._form.data = this._config;
    this._form.computeLabel = (s) => this._labels[lang]?.[s.name] || this._labels.en[s.name] || s.name;
    this._form.schema = this._rows.map((row) => row.length === 1
      ? { name: row[0], ...fields[row[0]] }
      : { type: "grid", name: "", schema: row.map((n) => ({ name: n, ...fields[n] })) });
  }
}
if (!customElements.get("meteoswiss-panel-editor")) customElements.define("meteoswiss-panel-editor", PanelEditor);

export const define = (tag, cls, name, description) => {
  if (customElements.get(tag)) return;
  customElements.define(tag, cls);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: tag, name, description, preview: true });
};

// Sun elevation (degrees), for the sky and night mode when sun.sun is missing.
export const sunElevation = (lat, lon, when = new Date()) => {
  const rad = Math.PI / 180;
  const start = Date.UTC(when.getUTCFullYear(), 0, 0);
  const day = Math.floor((when - start) / 864e5);
  const decl = 23.44 * rad * Math.sin(rad * (360 / 365) * (day - 81));
  const hours = when.getUTCHours() + when.getUTCMinutes() / 60 + lon / 15;
  const ang = rad * 15 * (hours - 12);
  const s = Math.sin(lat * rad) * Math.sin(decl) + Math.cos(lat * rad) * Math.cos(decl) * Math.cos(ang);
  return Math.asin(Math.max(-1, Math.min(1, s))) / rad;
};

// Color of a water/air temperature (blue -> green -> yellow -> red).
const TEMP_STOPS = [[0, [49, 54, 149]], [4, [69, 117, 180]], [8, [116, 173, 209]], [12, [171, 217, 233]], [15, [224, 243, 248]],
  [18, [254, 224, 144]], [21, [253, 174, 97]], [24, [244, 109, 67]], [27, [215, 48, 39]], [30, [165, 0, 38]]];
export const tempColor = (t, alpha = 1) => {
  if (t == null) return "transparent";
  let i = TEMP_STOPS.findIndex((s) => s[0] >= t);
  if (i <= 0) i = i === 0 ? 1 : TEMP_STOPS.length - 1;
  const [t0, c0] = TEMP_STOPS[i - 1], [t1, c1] = TEMP_STOPS[i];
  const f = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
  const c = c0.map((v, k) => Math.round(v + (c1[k] - v) * f));
  return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
};
