// MeteoSwiss Complete For HA - detailed weather card.
//
//   type: custom:meteoswiss-weather-card
//   entity: weather.home        # optional: first MeteoSwiss weather entity
//   details: [humidity, wind, gust, pressure, dew_point, precipitation_probability, freezing_level, pollen]
//   show_header: true
//   show_chart: true
//   hours: 24                   # hourly chart, 6-48
//   show_daily: true
//   days: 9                     # 1-9
//
// Header (place, altitude, pictogram, condition, station, temperature), a grid
// of measurements chosen one by one, an hourly chart (temperature with its
// 10-90 % band, precipitation) and daily columns.

const DOMAIN = "meteoswiss4ha";

// Measurements that can be shown in the grid, in their default order.
const DETAILS = {
  humidity: "mdi:water-percent",
  wind: "mdi:weather-windy",
  gust: "mdi:windsock",
  pressure: "mdi:gauge",
  dew_point: "mdi:thermometer-water",
  precipitation_probability: "mdi:umbrella",
  freezing_level: "mdi:snowflake-thermometer",
  pollen: "mdi:flower-pollen",
  precipitation: "mdi:weather-rainy",
  sunshine: "mdi:weather-sunny",
  global_radiation: "mdi:solar-power-variant",
  pressure_qnh: "mdi:gauge",
  pressure_qfe: "mdi:gauge-low",
  warnings: "mdi:alert",
};
const DEFAULT_DETAILS = ["humidity", "wind", "gust", "pressure", "dew_point", "precipitation_probability", "freezing_level", "pollen"];

const T = {
  fr: {
    altitude: "m", station: "Station", today: "Auj.", source: "Source : MétéoSuisse, prévision du", noEntity: "Aucune entité météo MeteoSwiss trouvée.",
    noWarning: "Pas d’alerte",
    d: { humidity: "Humidité", wind: "Vent", gust: "Rafales", pressure: "Pression", dew_point: "Point de rosée", precipitation_probability: "Risque de pluie",
         freezing_level: "Isotherme 0 °C", pollen: "Pollen", precipitation: "Pluie (10 min)", sunshine: "Soleil (10 min)", global_radiation: "Rayonnement",
         pressure_qnh: "Pression QNH", pressure_qfe: "Pression station", warnings: "Alertes" },
    f: { entity: "Entité météo", name: "Titre (par défaut : lieu et altitude)", details: "Mesures affichées (cochez et ordonnez)", show_header: "En-tête",
         show_chart: "Graphique heure par heure", hours: "Heures du graphique", show_daily: "Prévisions par jour", days: "Jours", language: "Langue" },
  },
  de: {
    altitude: "m ü. M.", station: "Station", today: "Heute", source: "Quelle: MeteoSchweiz, Lauf", noEntity: "Keine MeteoSwiss-Wetterentität gefunden.",
    noWarning: "Keine Warnung",
    d: { humidity: "Feuchte", wind: "Wind", gust: "Böen", pressure: "Druck", dew_point: "Taupunkt", precipitation_probability: "Regenrisiko",
         freezing_level: "Nullgradgrenze", pollen: "Pollen", precipitation: "Regen (10 min)", sunshine: "Sonne (10 min)", global_radiation: "Strahlung",
         pressure_qnh: "Druck QNH", pressure_qfe: "Stationsdruck", warnings: "Warnungen" },
    f: { entity: "Wetter-Entität", name: "Titel (Standard: Ort und Höhe)", details: "Angezeigte Messwerte (auswählen und ordnen)", show_header: "Kopfzeile",
         show_chart: "Stündliche Grafik", hours: "Stunden der Grafik", show_daily: "Tagesprognose", days: "Tage", language: "Sprache" },
  },
  it: {
    altitude: "m s.l.m.", station: "Stazione", today: "Oggi", source: "Fonte: MeteoSvizzera, corsa del", noEntity: "Nessuna entità meteo MeteoSwiss trovata.",
    noWarning: "Nessuna allerta",
    d: { humidity: "Umidità", wind: "Vento", gust: "Raffiche", pressure: "Pressione", dew_point: "Punto di rugiada", precipitation_probability: "Rischio pioggia",
         freezing_level: "Limite dello zero", pollen: "Polline", precipitation: "Pioggia (10 min)", sunshine: "Sole (10 min)", global_radiation: "Radiazione",
         pressure_qnh: "Pressione QNH", pressure_qfe: "Pressione stazione", warnings: "Allerte" },
    f: { entity: "Entità meteo", name: "Titolo (predefinito: luogo e altitudine)", details: "Misure mostrate (selezionare e ordinare)", show_header: "Intestazione",
         show_chart: "Grafico orario", hours: "Ore del grafico", show_daily: "Previsioni giornaliere", days: "Giorni", language: "Lingua" },
  },
  rm: {
    altitude: "m s. m.", station: "Staziun", today: "Oz", source: "Funtauna: MeteoSvizra, prognosa dals", noEntity: "Nagina entitad d’aura MeteoSwiss chattada.",
    noWarning: "Nagin avertiment",
    d: { humidity: "Umiditad", wind: "Vent", gust: "Buffadas", pressure: "Pressiun", dew_point: "Punct da rosada", precipitation_probability: "Ristg da plievgia",
         freezing_level: "Cunfin da zero grads", pollen: "Pollen", precipitation: "Plievgia (10 min)", sunshine: "Sulegl (10 min)", global_radiation: "Radiaziun",
         pressure_qnh: "Pressiun QNH", pressure_qfe: "Pressiun da la staziun", warnings: "Avertiments" },
    f: { entity: "Entitad d’aura", name: "Titel (standard: lieu ed autezza)", details: "Mesiraziuns mussadas (tscherner ed ordinar)", show_header: "Chau",
         show_chart: "Grafica per ura", hours: "Uras da la grafica", show_daily: "Prognosa per di", days: "Dis", language: "Lingua" },
  },
  en: {
    altitude: "m", station: "Station", today: "Today", source: "Source: MeteoSwiss, run of", noEntity: "No MeteoSwiss weather entity found.",
    noWarning: "No warning",
    d: { humidity: "Humidity", wind: "Wind", gust: "Gusts", pressure: "Pressure", dew_point: "Dew point", precipitation_probability: "Rain risk",
         freezing_level: "Freezing level", pollen: "Pollen", precipitation: "Rain (10 min)", sunshine: "Sunshine (10 min)", global_radiation: "Radiation",
         pressure_qnh: "Pressure QNH", pressure_qfe: "Station pressure", warnings: "Warnings" },
    f: { entity: "Weather entity", name: "Title (default: place and altitude)", details: "Measurements shown (tick and order)", show_header: "Header",
         show_chart: "Hourly chart", hours: "Chart hours", show_daily: "Daily forecast", days: "Days", language: "Language" },
  },
};
const DANGER_COLORS = ["#c8c8c8", "#ccff66", "#ffff00", "#ff9900", "#ff0000", "#8b0000"];

const lang = (hass, override) => {
  const l = override && override !== "auto" ? override : (hass?.locale?.language || hass?.language || "en").split("-")[0];
  return T[l] ? l : "en";
};
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const findEntity = (hass) =>
  Object.values(hass?.entities || {}).find((e) => e.platform === DOMAIN && e.entity_id.startsWith("weather."))?.entity_id ||
  Object.keys(hass?.states || {}).find((id) => id.startsWith("weather.") && hass.states[id].attributes.icons_url);

const STYLE = `
ha-card { padding: 14px; overflow: hidden; }
.title { font-size: 20px; font-weight: 600; margin: 0 0 4px; }
.head { display: flex; align-items: center; gap: 14px; cursor: pointer; }
.head img { width: 120px; height: 120px; flex: 0 0 120px; margin: -10px -6px -10px -10px; }
.head .mid { flex: 1; min-width: 0; }
.head .cond { font-size: 19px; font-weight: 600; }
.head .st { font-size: 12px; color: var(--secondary-text-color); margin-top: 4px; }
.head .temp { font-size: 46px; font-weight: 300; white-space: nowrap; }
.head .temp small { font-size: 18px; vertical-align: top; }
.box { background: rgba(127,127,127,.12); border-radius: 10px; padding: 10px 12px; margin-top: 12px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; }
.it { display: flex; align-items: center; gap: 10px; min-width: 0; }
.it ha-icon { --mdc-icon-size: 26px; color: var(--secondary-text-color); flex: 0 0 26px; }
.it .l { font-size: 12px; color: var(--secondary-text-color); }
.it .v { font-size: 15px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.it .v .arr { display: inline-block; margin-left: 4px; font-size: 13px; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
svg text { fill: var(--primary-text-color); font-size: 11px; font-family: inherit; }
svg text.t { font-size: 12px; font-weight: 600; }
svg text.ax { fill: var(--secondary-text-color); }
svg text.mm { fill: #4a9eff; font-size: 10px; }
.days { display: flex; overflow-x: auto; gap: 2px; scrollbar-width: thin; }
.day { flex: 1 0 40px; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 2px; border-radius: 8px; font-size: 12px; }
.day.today { background: rgba(127,127,127,.18); }
.day .n { color: var(--secondary-text-color); }
.day img { width: 38px; height: 38px; }
.day .b { min-width: 26px; text-align: center; padding: 3px 4px; border-radius: 5px; background: rgba(127,127,127,.25); font-weight: 600; font-size: 13px; }
.day .mm { color: #4a9eff; white-space: nowrap; font-size: 11px; }
.day .mm.dry { color: var(--secondary-text-color); }
.day .s { color: var(--secondary-text-color); font-size: 11px; white-space: nowrap; }
.src { text-align: right; font-size: 11px; color: var(--secondary-text-color); margin-top: 8px; }
.empty { color: var(--secondary-text-color); }
`;

class MeteoSwissWeatherCard extends HTMLElement {
  setConfig(config) {
    this._config = { show_header: true, show_chart: true, show_daily: true, hours: 24, days: 9, details: DEFAULT_DETAILS, ...config };
    this._resubscribe();
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    const entity = this._config?.entity || findEntity(hass);
    if (entity !== this._entity || first) {
      this._entity = entity;
      this._resubscribe();
    }
    // Re-render when the weather entity or one of the related sensors changes.
    const related = this._related();
    const key = [entity, ...related].map((id) => hass.states[id]?.last_updated).join();
    if (key !== this._key) {
      this._key = key;
      this._render();
    }
  }

  connectedCallback() {
    this._connected = true;
    this._resubscribe();
  }

  disconnectedCallback() {
    this._connected = false;
    this._unsubscribe();
  }

  _unsubscribe() {
    (this._subs || []).forEach((p) => p.then((unsub) => unsub()).catch(() => {}));
    this._subs = [];
  }

  _resubscribe() {
    this._unsubscribe();
    if (!this._connected || !this._hass || !this._entity || !this._config) return;
    const types = [];
    if (this._config.show_daily !== false) types.push("daily");
    if (this._config.show_chart !== false || this._config.show_daily !== false) types.push("hourly");
    this._subs = types.map((type) =>
      this._hass.connection.subscribeMessage(
        (msg) => {
          this[`_${type}`] = msg.forecast || [];
          this._render();
        },
        { type: "weather/subscribe_forecast", entity_id: this._entity, forecast_type: type },
      ).catch(() => {
        this[`_${type}`] = [];
        this._render();
        return () => {};
      }));
  }

  // Pollen level and weather warning sensors of the same MeteoSwiss device.
  _related() {
    const ents = this._hass?.entities || {};
    const device = ents[this._entity]?.device_id;
    if (!device) return [];
    return Object.values(ents)
      .filter((e) => e.device_id === device && (e.translation_key === "pollen_level" || /_warning$/.test(e.translation_key || "")))
      .map((e) => e.entity_id);
  }

  _detail(name, a, t, num) {
    const m = a.measurements || {};
    const unitP = a.pressure_unit || "hPa";
    switch (name) {
      case "humidity": return a.humidity != null ? `${num(a.humidity)} %` : null;
      case "wind": {
        if (a.wind_speed == null) return null;
        // Arrow points where the wind blows to.
        const arrow = a.wind_bearing != null ? `<span class="arr" style="transform:rotate(${a.wind_bearing + 180}deg)">↑</span>` : "";
        return `${num(a.wind_speed)} ${esc(a.wind_speed_unit || "km/h")}${arrow}`;
      }
      case "gust": return a.wind_gust_speed != null ? `${num(a.wind_gust_speed)} ${esc(a.wind_speed_unit || "km/h")}` : null;
      case "pressure": return a.pressure != null ? `${num(a.pressure)} ${esc(unitP)}` : null;
      case "dew_point": return a.dew_point != null ? `${num(a.dew_point, 1)} °` : null;
      case "precipitation_probability": return a.precipitation_probability != null ? `${num(a.precipitation_probability)} %` : null;
      case "freezing_level": return a.freezing_level != null ? `${num(Math.round(a.freezing_level / 25) * 25)} m` : null;
      case "precipitation": return m.precipitation != null ? `${num(m.precipitation, 1)} mm` : null;
      case "sunshine": return m.sunshine != null ? `${num(m.sunshine)} min` : null;
      case "global_radiation": return m.global_radiation != null ? `${num(m.global_radiation)} W/m²` : null;
      case "pressure_qnh": return m.pressure_qnh != null ? `${num(m.pressure_qnh, 1)} hPa` : null;
      case "pressure_qfe": return m.pressure_qfe != null ? `${num(m.pressure_qfe, 1)} hPa` : null;
      case "pollen": {
        const id = this._related().find((e) => this._hass.entities[e]?.translation_key === "pollen_level");
        const st = id && this._hass.states[id];
        return st ? esc(this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state) : null;
      }
      case "warnings": {
        const ids = this._related().filter((e) => /_warning$/.test(this._hass.entities[e]?.translation_key || ""));
        if (!ids.length) return null;
        let top = null;
        for (const id of ids) {
          const st = this._hass.states[id];
          if (st && (st.attributes.level || 1) > (top?.attributes.level || 1)) top = st;
        }
        if (!top) return t.noWarning;
        const color = DANGER_COLORS[top.attributes.level] || "";
        return `<span style="color:${color}">●</span> ${esc(top.attributes.event || this._hass.formatEntityState?.(top) || top.state)}`;
      }
      default: return null;
    }
  }

  _chart(hours, icons, t, loc) {
    const n = hours.length;
    if (n < 2) return "";
    const W = 460, X0 = 14, X1 = W - 14, TOP = 40, BOT = 112, PB = 136, H = 168;
    const x = (i) => X0 + ((X1 - X0) * i) / (n - 1);
    const temps = hours.flatMap((h) => [h.temperature, h.temperature_p10, h.temperature_p90]).filter((v) => v != null);
    const lo = Math.min(...temps), hi = Math.max(...temps);
    const span = Math.max(hi - lo, 4);
    const y = (v) => BOT - ((v - lo) / span) * (BOT - TOP - 12);
    const step = Math.max(1, Math.ceil(n / 8));
    const parts = [];
    // Precipitation bars.
    const pmax = Math.max(1, ...hours.map((h) => h.precipitation || 0));
    const bw = Math.max(2, ((X1 - X0) / n) * 0.7);
    hours.forEach((h, i) => {
      const p = h.precipitation || 0;
      if (p < 0.05) return;
      const bh = (p / pmax) * 22;
      parts.push(`<rect x="${(x(i) - bw / 2).toFixed(1)}" y="${(PB - bh).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="1" fill="#4a9eff" opacity=".75"/>`);
    });
    const maxP = Math.max(...hours.map((h) => h.precipitation || 0));
    if (maxP >= 0.1) parts.push(`<text class="mm" x="${X1}" y="${PB - 26}" text-anchor="end">${maxP.toLocaleString(loc, { maximumFractionDigits: 1 })} mm</text>`);
    // Temperature band (10-90 %) and line.
    const band = hours.map((h, i) => [i, h.temperature_p90 ?? h.temperature]).filter(([, v]) => v != null);
    const bandLo = hours.map((h, i) => [i, h.temperature_p10 ?? h.temperature]).filter(([, v]) => v != null).reverse();
    if (band.length > 1) {
      parts.push(`<path d="M${[...band, ...bandLo].map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("L")}Z" fill="#ef5350" opacity=".22"/>`);
    }
    const line = hours.map((h, i) => [i, h.temperature]).filter(([, v]) => v != null);
    parts.push(`<path d="M${line.map(([i, v]) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("L")}" fill="none" stroke="#ef5350" stroke-width="2.5" stroke-linejoin="round"/>`);
    // Labels: pictogram, temperature and time every few hours; midnight lines.
    hours.forEach((h, i) => {
      const d = new Date(h.datetime);
      if (d.getHours() === 0 && i > 0) {
        parts.push(`<line x1="${x(i)}" x2="${x(i)}" y1="${TOP - 6}" y2="${PB}" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 3"/>`);
        parts.push(`<text class="ax" x="${x(i)}" y="${H}" text-anchor="middle" font-weight="600">${esc(d.toLocaleDateString(loc, { weekday: "short" }))}</text>`);
      }
      if (i % step) return;
      if (icons && h.meteoswiss_symbol != null) {
        parts.push(`<image href="${icons}/${h.meteoswiss_symbol}.svg" x="${(x(i) - 15).toFixed(1)}" y="0" width="30" height="30"/>`);
      }
      if (h.temperature != null) {
        parts.push(`<text class="t" x="${x(i).toFixed(1)}" y="${(y(h.temperature) - 8).toFixed(1)}" text-anchor="middle">${Math.round(h.temperature)}°</text>`);
      }
      parts.push(`<text class="ax" x="${x(i).toFixed(1)}" y="${PB + 16}" text-anchor="middle">${esc(d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" }))}</text>`);
    });
    return `<svg viewBox="0 0 ${W} ${H + 4}" style="color:var(--primary-text-color)">${parts.join("")}</svg>`;
  }

  _render() {
    if (!this._config || !this._hass) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const t = T[lang(this._hass, this._config?.language)];
    const forced = this._config.language && this._config.language !== "auto" ? this._config.language : null;
    const loc = forced || this._hass.locale?.language || this._hass.language || "en";
    const st = this._entity ? this._hass.states[this._entity] : undefined;
    if (!st) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="empty">${t.noEntity}</div></ha-card>`;
      return;
    }
    const a = st.attributes;
    const c = this._config;
    const icons = a.icons_url;
    const num = (v, d = 0) => (v == null || isNaN(v) ? "–" : Number(v).toLocaleString(loc, { maximumFractionDigits: d, minimumFractionDigits: d }));
    const img = (code) => (icons && code != null ? `<img src="${icons}/${code}.svg" alt="">` : `<img alt="">`);
    const time = (s) => (s ? new Date(s).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" }) : "");
    const parts = [];

    if (c.show_header !== false) {
      const place = a.location || a.friendly_name;
      const title = c.name || (a.altitude != null ? `${place}, ${num(a.altitude)} ${t.altitude}` : place);
      const cond = this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state;
      const station = a.station ? `${t.station} ${esc(a.station)}${a.measured_at ? ` · ${time(a.measured_at)}` : ""}` : "";
      parts.push(`<div class="title">${esc(title)}</div>
        <div class="head">${img(a.meteoswiss_symbol)}<div class="mid"><div class="cond">${esc(cond)}</div><div class="st">${station}</div></div>
        <div class="temp">${num(a.temperature, 1)}<small>${esc(a.temperature_unit || "°C")}</small></div></div>`);
    }

    const details = (Array.isArray(c.details) ? c.details : DEFAULT_DETAILS).filter((d) => DETAILS[d]);
    const items = details.map((d) => [d, this._detail(d, a, t, num)]).filter(([, v]) => v != null);
    if (items.length) {
      parts.push(`<div class="box grid">${items.map(([d, v]) =>
        `<div class="it"><ha-icon icon="${DETAILS[d]}"></ha-icon><div><div class="l">${t.d[d]}</div><div class="v">${v}</div></div></div>`).join("")}</div>`);
    }

    if (c.show_chart !== false && this._hourly?.length) {
      const hours = this._hourly.slice(0, Math.min(48, Math.max(6, Number(c.hours) || 24)));
      parts.push(`<div class="box">${this._chart(hours, icons, t, loc)}</div>`);
    }

    if (c.show_daily !== false && this._daily?.length) {
      const today = new Date().toDateString();
      const days = this._daily.slice(0, Math.min(9, Math.max(1, Number(c.days) || 9))).map((f) => {
        const d = new Date(f.datetime);
        const isToday = d.toDateString() === today;
        const mm = f.precipitation ?? null;
        const range = f.precipitation_p10 != null && f.precipitation_p90 != null
          ? `${Math.round(f.precipitation_p10)}–${Math.round(f.precipitation_p90)}` : "";
        return `<div class="day${isToday ? " today" : ""}"><span class="n">${esc(isToday ? t.today : d.toLocaleDateString(loc, { weekday: "short" }))}</span>
          ${img(f.meteoswiss_symbol)}<span class="b">${num(f.templow)}°</span><span class="b">${num(f.temperature)}°</span>
          <span class="mm${mm != null && mm >= 0.1 ? "" : " dry"}">${num(mm, 1)} mm</span>
          <span class="s">${f.precipitation_probability != null ? `${num(f.precipitation_probability)} %` : "&nbsp;"}</span>
          <span class="s">${range || "&nbsp;"}</span></div>`;
      });
      parts.push(`<div class="box days">${days.join("")}</div>`);
    }

    if (a.forecast_reference_time) {
      const run = new Date(a.forecast_reference_time);
      parts.push(`<div class="src">${t.source} ${run.toLocaleDateString(loc, { day: "2-digit", month: "2-digit" })}, ${time(run)}</div>`);
    }

    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card>${parts.join("")}</ha-card>`;
    this.shadowRoot.querySelector(".head")?.addEventListener("click", () =>
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: this._entity } })));
  }

  getCardSize() {
    const c = this._config || {};
    return 2 + (c.show_header !== false ? 3 : 0) + (c.show_chart !== false ? 4 : 0) + (c.show_daily !== false ? 4 : 0);
  }

  static getStubConfig(hass) {
    return { entity: findEntity(hass) };
  }

  static getConfigElement() {
    return document.createElement("meteoswiss-weather-card-editor");
  }
}

class MeteoSwissWeatherCardEditor extends HTMLElement {
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
    const t = T[lang(this._hass, this._config?.language)];
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (e) =>
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = { show_header: true, show_chart: true, show_daily: true, hours: 24, days: 9, details: DEFAULT_DETAILS, ...this._config };
    this._form.computeLabel = (s) => t.f[s.name] || s.name;
    this._form.schema = [
      { name: "entity", selector: { entity: { domain: "weather", integration: DOMAIN } } },
      { name: "name", selector: { text: {} } },
      { name: "details", selector: { select: { multiple: true, reorder: true, mode: "list",
        options: Object.keys(DETAILS).map((d) => ({ value: d, label: t.d[d] })) } } },
      { name: "show_header", selector: { boolean: {} } },
      { type: "grid", name: "", schema: [
        { name: "show_chart", selector: { boolean: {} } },
        { name: "hours", selector: { number: { min: 6, max: 48, mode: "box" } } },
        { name: "show_daily", selector: { boolean: {} } },
        { name: "days", selector: { number: { min: 1, max: 9, mode: "box" } } },
      ] },
      { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "auto", label: "Auto" }, { value: "de", label: "Deutsch" }, { value: "fr", label: "Français" }, { value: "it", label: "Italiano" }, { value: "rm", label: "Rumantsch" }, { value: "en", label: "English" }] } } },
    ];
  }
}

if (!customElements.get("meteoswiss-weather-card")) {
  customElements.define("meteoswiss-weather-card", MeteoSwissWeatherCard);
  customElements.define("meteoswiss-weather-card-editor", MeteoSwissWeatherCardEditor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "meteoswiss-weather-card",
    name: "MeteoSwiss detailed weather",
    description: "Place and altitude, measurements of your choice, hourly chart with uncertainty band and 9-day forecast.",
    preview: true,
  });
}
