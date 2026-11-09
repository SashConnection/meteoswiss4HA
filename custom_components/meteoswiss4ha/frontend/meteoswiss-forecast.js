// MeteoSwiss Complete For HA - forecast card with the integration's pictograms.
//
//   type: custom:meteoswiss-forecast-card
//   entity: weather.home          # optional: first MeteoSwiss weather entity
//   forecast: both                # both, daily, hourly or none
//   days: 7                       # 1-9
//   hours: 12                     # 1-48
//   show_current: true
//   show_details: true            # humidity, wind, gusts, pressure
//
// Pictograms come from the pack chosen in the integration options (the
// weather entity exposes its base URL in the "icons_url" attribute).

const DOMAIN = "meteoswiss4ha";

const T = {
  fr: { today: "Auj.", humidity: "Humidité", wind: "Vent", gust: "Rafales", pressure: "Pression", noEntity: "Aucune entité météo MeteoSwiss trouvée.",
        f: { entity: "Entité météo", name: "Titre", forecast: "Prévisions", days: "Jours", hours: "Heures", show_current: "Météo actuelle", show_details: "Détails (humidité, vent, pression)" },
        modes: { both: "Heures et jours", daily: "Jours", hourly: "Heures", none: "Aucune" } },
  de: { today: "Heute", humidity: "Feuchte", wind: "Wind", gust: "Böen", pressure: "Druck", noEntity: "Keine MeteoSwiss-Wetterentität gefunden.",
        f: { entity: "Wetter-Entität", name: "Titel", forecast: "Prognose", days: "Tage", hours: "Stunden", show_current: "Aktuelles Wetter", show_details: "Details (Feuchte, Wind, Druck)" },
        modes: { both: "Stunden und Tage", daily: "Tage", hourly: "Stunden", none: "Keine" } },
  it: { today: "Oggi", humidity: "Umidità", wind: "Vento", gust: "Raffiche", pressure: "Pressione", noEntity: "Nessuna entità meteo MeteoSwiss trovata.",
        f: { entity: "Entità meteo", name: "Titolo", forecast: "Previsioni", days: "Giorni", hours: "Ore", show_current: "Meteo attuale", show_details: "Dettagli (umidità, vento, pressione)" },
        modes: { both: "Ore e giorni", daily: "Giorni", hourly: "Ore", none: "Nessuna" } },
  en: { today: "Today", humidity: "Humidity", wind: "Wind", gust: "Gusts", pressure: "Pressure", noEntity: "No MeteoSwiss weather entity found.",
        f: { entity: "Weather entity", name: "Title", forecast: "Forecast", days: "Days", hours: "Hours", show_current: "Current weather", show_details: "Details (humidity, wind, pressure)" },
        modes: { both: "Hours and days", daily: "Days", hourly: "Hours", none: "None" } },
};

const lang = (hass) => {
  const l = (hass?.locale?.language || hass?.language || "en").split("-")[0];
  return T[l] ? l : "en";
};

const findEntity = (hass) =>
  Object.values(hass?.entities || {}).find((e) => e.platform === DOMAIN && e.entity_id.startsWith("weather."))?.entity_id ||
  Object.keys(hass?.states || {}).find((id) => id.startsWith("weather.") && hass.states[id].attributes.icons_url);

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const STYLE = `
ha-card { padding: 16px; overflow: hidden; }
.cur { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.cur img { width: 96px; height: 96px; flex: 0 0 96px; margin: -8px 0; }
.cur .main { flex: 1; min-width: 0; }
.cur .name { color: var(--secondary-text-color); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cur .cond { font-size: 18px; margin-top: 2px; }
.cur .temp { font-size: 44px; font-weight: 300; line-height: 1; white-space: nowrap; }
.cur .temp small { font-size: 20px; vertical-align: top; }
.details { display: flex; flex-wrap: wrap; gap: 4px 16px; margin-top: 10px; font-size: 13px; color: var(--secondary-text-color); }
.details b { color: var(--primary-text-color); font-weight: 500; }
.sec { margin-top: 14px; border-top: 1px solid var(--divider-color); padding-top: 10px; }
.sec:first-child { margin-top: 0; border-top: 0; padding-top: 0; }
.strip { display: flex; gap: 2px; overflow-x: auto; scrollbar-width: thin; }
.item { flex: 1 0 52px; display: flex; flex-direction: column; align-items: center; text-align: center; font-size: 13px; }
.days .item { flex-basis: 56px; }
.item .t { color: var(--secondary-text-color); white-space: nowrap; }
.item img { width: 44px; height: 44px; margin: 2px 0; }
.days .item img { width: 50px; height: 50px; }
.item .hi { font-weight: 600; font-size: 14px; }
.item .lo { color: var(--secondary-text-color); }
.item .p { color: #2f7fd8; font-size: 12px; min-height: 15px; white-space: nowrap; }
.empty { color: var(--secondary-text-color); }
`;

class MeteoSwissForecastCard extends HTMLElement {
  setConfig(config) {
    this._config = {
      forecast: "both", days: 7, hours: 12, show_current: true, show_details: true, ...config,
    };
    this._resubscribe();
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    const entity = this._config?.entity || findEntity(hass);
    if (entity !== this._entity) {
      this._entity = entity;
      this._resubscribe();
    } else if (first) {
      this._resubscribe();
    }
    const state = entity ? hass.states[entity] : undefined;
    if (state !== this._state) {
      this._state = state;
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
    this._daily = this._hourly = undefined;
    const mode = this._config.forecast;
    const types = mode === "both" ? ["daily", "hourly"] : mode === "daily" || mode === "hourly" ? [mode] : [];
    this._subs = types.map((type) =>
      this._hass.connection.subscribeMessage(
        (msg) => {
          this[type === "daily" ? "_daily" : "_hourly"] = msg.forecast || [];
          this._render();
        },
        { type: "weather/subscribe_forecast", entity_id: this._entity, forecast_type: type },
      ).catch(() => {
        // Hourly forecast disabled in the integration options.
        this[type === "daily" ? "_daily" : "_hourly"] = [];
        this._render();
        return () => {};
      }));
  }

  _render() {
    if (!this._config || !this._hass) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const t = T[lang(this._hass)];
    const loc = this._hass.locale?.language || this._hass.language || "en";
    const st = this._state;
    if (!st) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="empty">${t.noEntity}</div></ha-card>`;
      return;
    }
    const a = st.attributes;
    const icons = a.icons_url;
    const img = (code, alt = "") => (icons && code != null ? `<img src="${icons}/${code}.svg" alt="${esc(alt)}">` : `<img alt="">`);
    const num = (v, d = 0) => (v == null || isNaN(v) ? "–" : Number(v).toLocaleString(loc, { maximumFractionDigits: d }));
    const c = this._config;
    const parts = [];

    if (c.show_current !== false) {
      const cond = this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state;
      const details = c.show_details === false ? "" : `<div class="details">${[
        a.humidity != null && `${t.humidity} <b>${num(a.humidity)} %</b>`,
        a.wind_speed != null && `${t.wind} <b>${num(a.wind_speed)} ${esc(a.wind_speed_unit || "")}</b>`,
        a.wind_gust_speed != null && `${t.gust} <b>${num(a.wind_gust_speed)} ${esc(a.wind_speed_unit || "")}</b>`,
        a.pressure != null && `${t.pressure} <b>${num(a.pressure)} ${esc(a.pressure_unit || "")}</b>`,
      ].filter(Boolean).join("")}</div>`;
      parts.push(`<div class="sec"><div class="cur">${img(a.meteoswiss_symbol, cond)}
        <div class="main"><div class="name">${esc(c.name || a.friendly_name)}</div><div class="cond">${esc(cond)}</div></div>
        <div class="temp">${num(a.temperature, 1)}<small>${esc(a.temperature_unit || "°C")}</small></div></div>${details}</div>`);
    }

    const precip = (f) => {
      const mm = f.precipitation;
      const prob = f.precipitation_probability;
      if (prob != null && prob >= 10) return `${num(prob)} %`;
      return mm != null && mm >= 0.1 ? `${num(mm, 1)} mm` : "";
    };
    if (this._hourly?.length) {
      const items = this._hourly.slice(0, Math.max(1, Number(c.hours) || 12)).map((f) => `<div class="item">
        <span class="t">${new Date(f.datetime).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" })}</span>
        ${img(f.meteoswiss_symbol, f.condition)}<span class="hi">${num(f.temperature)}°</span><span class="p">${precip(f)}</span></div>`);
      parts.push(`<div class="sec"><div class="strip">${items.join("")}</div></div>`);
    }
    if (this._daily?.length) {
      const today = new Date().toDateString();
      const items = this._daily.slice(0, Math.min(9, Math.max(1, Number(c.days) || 7))).map((f) => {
        const d = new Date(f.datetime);
        const label = d.toDateString() === today ? t.today : d.toLocaleDateString(loc, { weekday: "short" });
        return `<div class="item"><span class="t">${esc(label)}</span>${img(f.meteoswiss_symbol, f.condition)}
          <span class="hi">${num(f.temperature)}°</span><span class="lo">${num(f.templow)}°</span><span class="p">${precip(f)}</span></div>`;
      });
      parts.push(`<div class="sec"><div class="strip days">${items.join("")}</div></div>`);
    }

    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card>${parts.join("")}</ha-card>`;
    this.shadowRoot.querySelector(".cur")?.addEventListener("click", () =>
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: this._entity } })));
  }

  getCardSize() {
    const c = this._config || {};
    return (c.show_current !== false ? 3 : 0) + (c.forecast === "both" ? 4 : c.forecast === "none" ? 0 : 2);
  }

  static getStubConfig(hass) {
    return { entity: findEntity(hass), forecast: "both", days: 7, hours: 12 };
  }

  static getConfigElement() {
    return document.createElement("meteoswiss-forecast-card-editor");
  }
}

// Visual editor (ha-form).
class MeteoSwissForecastCardEditor extends HTMLElement {
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
    const t = T[lang(this._hass)];
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (e) =>
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = { forecast: "both", days: 7, hours: 12, show_current: true, show_details: true, ...this._config };
    this._form.computeLabel = (s) => t.f[s.name] || s.name;
    this._form.schema = [
      { name: "entity", selector: { entity: { domain: "weather", integration: DOMAIN } } },
      { name: "name", selector: { text: {} } },
      { name: "forecast", selector: { select: { mode: "dropdown", options: ["both", "daily", "hourly", "none"].map((v) => ({ value: v, label: t.modes[v] })) } } },
      { type: "grid", name: "", schema: [
        { name: "days", selector: { number: { min: 1, max: 9, mode: "box" } } },
        { name: "hours", selector: { number: { min: 1, max: 48, mode: "box" } } },
      ] },
      { name: "show_current", selector: { boolean: {} } },
      { name: "show_details", selector: { boolean: {} } },
    ];
  }
}

if (!customElements.get("meteoswiss-forecast-card")) {
  customElements.define("meteoswiss-forecast-card", MeteoSwissForecastCard);
  customElements.define("meteoswiss-forecast-card-editor", MeteoSwissForecastCardEditor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "meteoswiss-forecast-card",
    name: "MeteoSwiss forecast",
    description: "Current weather, hourly and daily forecast with the MeteoSwiss pictograms (animated pack available).",
    preview: true,
  });
}
