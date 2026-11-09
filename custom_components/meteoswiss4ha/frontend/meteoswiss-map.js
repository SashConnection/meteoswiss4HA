// MeteoSwiss Complete For HA - Switzerland map.
//
// Provides two custom elements sharing the same map:
//   <meteoswiss-panel>     full page in the sidebar
//   <meteoswiss-map-card>  dashboard card (type: custom:meteoswiss-map-card)
//
// Data comes from the integration (/api/meteoswiss4ha/overview); base map and
// FOEN warning layers are swisstopo / geo.admin.ch WMTS tiles.

import * as L from "./leaflet/leaflet-src.esm.js";

const BASE = new URL(".", import.meta.url).href;
const WMTS = (layer, ext = "png") =>
  `https://wmts.geo.admin.ch/1.0.0/${layer}/default/current/3857/{z}/{x}/{y}.${ext}`;

const CH_BOUNDS = [[45.75, 5.9], [47.85, 10.55]];

const LAYERS = ["weather", "avalanche", "pollen", "fire", "drought", "flood"];
// FOEN warning maps: drought is a WMTS layer, forest fire a WMS layer,
// floods come as GeoJSON from the integration.
const DROUGHT_LAYER = "ch.bafu.trockenheitswarnkarte";
const FIRE_LAYER = "ch.bafu.gefahren-waldbrand_warnung";

// EAWS / Swiss 5-level danger scale colors.
const DANGER_COLORS = ["#c8c8c8", "#ccff66", "#ffff00", "#ff9900", "#ff0000", "#a50000"];
const POLLEN_COLORS = ["#9e9e9e", "#8bc34a", "#ffeb3b", "#ff9800", "#e53935"];

const I18N = {
  fr: {
    title: "MétéoSuisse", weather: "Météo", avalanche: "Avalanches", pollen: "Pollen",
    fire: "Incendies", drought: "Sécheresse", flood: "Crues", today: "Aujourd’hui",
    danger: ["Pas de bulletin", "Faible", "Limité", "Marqué", "Fort", "Très fort"],
    pollenLevels: ["Aucun", "Faible", "Moyen", "Fort", "Très fort"],
    noBulletin: "Pas de bulletin d’avalanches publié actuellement (hors saison).",
    home: "Domicile", loading: "Chargement…", error: "Données indisponibles",
    species: { hazel: "Noisetier", alder: "Aulne", birch: "Bouleau", ash: "Frêne", beech: "Hêtre", oak: "Chêne", grasses: "Graminées" },
  },
  de: {
    title: "MeteoSchweiz", weather: "Wetter", avalanche: "Lawinen", pollen: "Pollen",
    fire: "Waldbrand", drought: "Trockenheit", flood: "Hochwasser", today: "Heute",
    danger: ["Kein Bulletin", "Gering", "Mässig", "Erheblich", "Gross", "Sehr gross"],
    pollenLevels: ["Keine", "Schwach", "Mässig", "Stark", "Sehr stark"],
    noBulletin: "Zurzeit kein Lawinenbulletin publiziert (ausserhalb der Saison).",
    home: "Zuhause", loading: "Laden…", error: "Daten nicht verfügbar",
    species: { hazel: "Hasel", alder: "Erle", birch: "Birke", ash: "Esche", beech: "Buche", oak: "Eiche", grasses: "Gräser" },
  },
  it: {
    title: "MeteoSvizzera", weather: "Meteo", avalanche: "Valanghe", pollen: "Polline",
    fire: "Incendi", drought: "Siccità", flood: "Piene", today: "Oggi",
    danger: ["Nessun bollettino", "Debole", "Moderato", "Marcato", "Forte", "Molto forte"],
    pollenLevels: ["Nessuno", "Debole", "Moderato", "Forte", "Molto forte"],
    noBulletin: "Nessun bollettino valanghe pubblicato (fuori stagione).",
    home: "Casa", loading: "Caricamento…", error: "Dati non disponibili",
    species: { hazel: "Nocciolo", alder: "Ontano", birch: "Betulla", ash: "Frassino", beech: "Faggio", oak: "Quercia", grasses: "Graminacee" },
  },
  en: {
    title: "MeteoSwiss", weather: "Weather", avalanche: "Avalanches", pollen: "Pollen",
    fire: "Forest fire", drought: "Drought", flood: "Floods", today: "Today",
    danger: ["No bulletin", "Low", "Moderate", "Considerable", "High", "Very high"],
    pollenLevels: ["None", "Weak", "Moderate", "Strong", "Very strong"],
    noBulletin: "No avalanche bulletin currently published (off-season).",
    home: "Home", loading: "Loading…", error: "Data unavailable",
    species: { hazel: "Hazel", alder: "Alder", birch: "Birch", ash: "Ash", beech: "Beech", oak: "Oak", grasses: "Grasses" },
  },
};

const STYLE = `
:host { display: block; height: 100%; }
[hidden] { display: none !important; }
.wrap { display: flex; flex-direction: column; height: 100%; background: var(--card-background-color, #fff);
  color: var(--primary-text-color, #212121); font-family: var(--paper-font-body1_-_font-family, sans-serif); }
.bar { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; padding: 8px 12px;
  border-bottom: 1px solid var(--divider-color, #e0e0e0); }
.bar h1 { font-size: 18px; font-weight: 500; margin: 0 12px 0 0; }
.bar button { border: 1px solid var(--divider-color, #ccc); background: transparent; color: inherit;
  border-radius: 16px; padding: 4px 12px; cursor: pointer; font: inherit; font-size: 13px; }
.bar button.on { background: var(--primary-color, #03a9f4); border-color: var(--primary-color, #03a9f4); color: var(--text-primary-color, #fff); }
.days { display: flex; gap: 8px; align-items: center; padding: 6px 12px; font-size: 13px; }
.days input { flex: 1; }
.map { flex: 1; min-height: 300px; position: relative; }
.legend { position: absolute; z-index: 500; right: 10px; bottom: 22px; background: var(--card-background-color, #fff);
  border-radius: 8px; padding: 6px 10px; font-size: 12px; box-shadow: 0 1px 4px rgba(0,0,0,.3); max-width: 220px; }
.legend i { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -2px; border: 1px solid rgba(0,0,0,.2); }
.city { text-align: center; font-size: 12px; line-height: 1.15; color: #212121; text-shadow: 0 0 3px #fff, 0 0 3px #fff; white-space: nowrap; }
.city img { width: 52px; height: 52px; display: block; margin: 0 auto -4px; }
.city b { font-weight: 600; } .city .tmin { color: #1565c0; } .city .tmax { color: #c62828; }
.city.home b { color: var(--primary-color, #03a9f4); }
.note { padding: 6px 12px; font-size: 13px; color: var(--secondary-text-color, #727272); }
.leaflet-container { background: #dfe6ec; font: inherit; }
`;

function lang(hass) {
  const l = (hass?.locale?.language || hass?.language || "en").split("-")[0];
  return I18N[l] ? l : "en";
}

class MeteoSwissMap {
  constructor(root, options = {}) {
    this.root = root;
    this.options = options;
    this.layer = options.layer || "weather";
    this.day = 0;
    this.data = null;
    this.regions = null;
    this.t = I18N.en;
    this._build();
  }

  _build() {
    this.root.innerHTML = `
      <link rel="stylesheet" href="${BASE}leaflet/leaflet.css">
      <style>${STYLE}</style>
      <div class="wrap">
        <div class="bar"></div>
        <div class="days" hidden><input type="range" min="0" max="8" value="0"><span></span></div>
        <div class="note" hidden></div>
        <div class="map"><div class="legend" hidden></div></div>
      </div>`;
    this.bar = this.root.querySelector(".bar");
    this.daysBox = this.root.querySelector(".days");
    this.slider = this.daysBox.querySelector("input");
    this.dayLabel = this.daysBox.querySelector("span");
    this.note = this.root.querySelector(".note");
    this.legend = this.root.querySelector(".legend");
    const mapEl = this.root.querySelector(".map");

    this.map = L.map(mapEl, { zoomSnap: 0.25, attributionControl: true, minZoom: 6, maxZoom: 13 });
    this.map.attributionControl.setPrefix(false);
    L.tileLayer(WMTS("ch.swisstopo.pixelkarte-grau", "jpeg"), {
      attribution: "© swisstopo · Source: MeteoSwiss, SLF, FOEN",
      maxZoom: 18,
    }).addTo(this.map);
    this.map.fitBounds(CH_BOUNDS);
    this.overlay = L.layerGroup().addTo(this.map);
    this.map.on("zoomend", () => this.layer === "weather" && this._render());

    this.slider.addEventListener("input", () => {
      this.day = Number(this.slider.value);
      this._render();
    });
    new ResizeObserver(() => this.map.invalidateSize()).observe(mapEl);
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    this.t = I18N[lang(hass)];
    if (first) {
      this._buttons();
      this.refresh();
      this._timer = setInterval(() => this.refresh(), 10 * 60 * 1000);
    }
  }

  destroy() {
    clearInterval(this._timer);
    this.map.remove();
  }

  _buttons() {
    const shown = this.options.layers || LAYERS;
    this.bar.innerHTML = (this.options.title === false ? "" : `<h1>${this.t.title}</h1>`) +
      shown.map((l) => `<button data-layer="${l}">${this.t[l]}</button>`).join("");
    this.bar.querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        this.layer = b.dataset.layer;
        this._render();
      }));
  }

  async refresh() {
    this.floods = null;
    try {
      const query = this.options.entry_id ? `?entry_id=${this.options.entry_id}` : "";
      this.data = await this._hass.callApi("GET", `meteoswiss4ha/overview${query}`);
      if (!this.regions) {
        this.regions = await this._hass.callApi("GET", "meteoswiss4ha/avalanche_regions").catch(() => null);
      }
      this._render();
    } catch (err) {
      this.note.hidden = false;
      this.note.textContent = `${this.t.error} (${err?.message || err})`;
    }
  }

  _render() {
    if (!this.data) return;
    this.bar.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.layer === this.layer));
    this.overlay.clearLayers();
    this.note.hidden = true;
    this.legend.hidden = true;
    this.daysBox.hidden = this.layer !== "weather";
    ({
      weather: () => this._weather(),
      avalanche: () => this._avalanche(),
      pollen: () => this._pollen(),
      fire: () => this._fire(),
      drought: () => this._drought(),
      flood: () => this._flood(),
    })[this.layer]();
  }

  _dayLabel(day) {
    if (!day) return "";
    if (this.day === 0) return this.t.today;
    return new Date(`${day.date}T12:00:00`).toLocaleDateString(lang(this._hass), {
      weekday: "long", day: "numeric", month: "long",
    });
  }

  _weather() {
    const zoom = this.map.getZoom();
    const home = this.data.home;
    const places = this.data.cities.filter((c) => zoom + 0.01 >= c.min_zoom - 0.5);
    places.push({ ...home, name: home.name || this.t.home, home: true });
    const ref = places.find((p) => p.days?.length);
    const days = ref ? ref.days.length : 1;
    this.slider.max = Math.max(0, days - 1);
    this.dayLabel.textContent = this._dayLabel(ref?.days[this.day]);
    for (const place of places) {
      const d = place.days?.[this.day];
      if (!d || d.symbol == null) continue;
      const html = `<div class="city${place.home ? " home" : ""}">
        <img src="${this.data.icons_url}/${d.symbol}.svg" alt="">
        <b>${place.name}</b><br>
        <span class="tmin">${d.tmin != null ? Math.round(d.tmin) : "–"}°</span> /
        <span class="tmax">${d.tmax != null ? Math.round(d.tmax) : "–"}°</span></div>`;
      L.marker([place.lat, place.lon], {
        icon: L.divIcon({ html, className: "", iconSize: [96, 84], iconAnchor: [48, 36] }),
        keyboard: false,
      }).addTo(this.overlay);
    }
  }

  _avalanche() {
    const levels = this.data.avalanche || {};
    const any = Object.keys(levels).length > 0;
    if (!any) {
      this.note.hidden = false;
      this.note.textContent = this.t.noBulletin;
    }
    if (this.regions) {
      L.geoJSON(this.regions, {
        style: (f) => {
          const lvl = levels[f.properties.id]?.level || 0;
          return { color: "#555", weight: 0.6, fillColor: DANGER_COLORS[lvl], fillOpacity: lvl ? 0.6 : 0.15 };
        },
        onEachFeature: (f, layer) => {
          const r = levels[f.properties.id];
          layer.bindTooltip(`${r?.name || f.properties.id}: ${this.t.danger[r?.level || 0]}`);
        },
      }).addTo(this.overlay);
    }
    this._dangerLegend();
  }

  _pollen() {
    for (const s of this.data.pollen || []) {
      const lvl = s.level ?? 0;
      const lines = Object.entries(s.species || {})
        .filter(([, v]) => v)
        .map(([k, v]) => `${this.t.species[k] || k}: ${this.t.pollenLevels[v]}`);
      L.circleMarker([s.lat, s.lon], {
        radius: 11, color: "#333", weight: 1, fillColor: POLLEN_COLORS[lvl], fillOpacity: 0.9,
      }).bindTooltip(`<b>${s.name}</b><br>${this.t.pollenLevels[lvl]}${lines.length ? "<br>" + lines.join("<br>") : ""}`)
        .addTo(this.overlay);
    }
    this._legend(this.t.pollenLevels.map((label, i) => [POLLEN_COLORS[i], label]));
  }

  _dangerLegend() {
    this._legend(this.t.danger.slice(1).map((label, i) => [DANGER_COLORS[i + 1], `${i + 1} · ${label}`]));
  }

  _drought() {
    L.tileLayer(WMTS(DROUGHT_LAYER), { opacity: 0.7, maxZoom: 18 }).addTo(this.overlay);
    this._dangerLegend();
  }

  _fire() {
    L.tileLayer.wms("https://wms.geo.admin.ch/", {
      layers: FIRE_LAYER, format: "image/png", transparent: true, opacity: 0.7, maxZoom: 18,
    }).addTo(this.overlay);
    this._dangerLegend();
  }

  async _flood() {
    if (!this.floods) {
      this.floods = await this._hass.callApi("GET", "meteoswiss4ha/flood_regions").catch(() => null);
      if (this.layer !== "flood") return;
    }
    if (this.floods) {
      L.geoJSON(this.floods, {
        style: (f) => {
          const lvl = f.properties.level || 0;
          // Rivers and lakes are lines: draw them thick in the level color.
          if (f.geometry.type.includes("Line")) {
            return { color: lvl > 1 ? DANGER_COLORS[lvl] : "#4a90c2", weight: lvl > 1 ? 5 : 2.5, opacity: 0.9 };
          }
          return { color: "#555", weight: 0.6, fillColor: DANGER_COLORS[lvl], fillOpacity: lvl > 1 ? 0.6 : 0.25 };
        },
        onEachFeature: (f, layer) =>
          layer.bindTooltip(`<b>${f.properties.name}</b><br>${f.properties.text || ""}`),
      }).addTo(this.overlay);
    }
    this._dangerLegend();
  }

  _legend(rows) {
    this.legend.hidden = false;
    this.legend.innerHTML = rows.map(([c, l]) => `<div><i style="background:${c}"></i>${l}</div>`).join("");
  }
}

class MeteoSwissPanel extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    if (!this._map) this._map = new MeteoSwissMap(this.shadowRoot);
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
  set narrow(_n) {}
}

class MeteoSwissMapCard extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
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
      this._map = new MeteoSwissMap(inner, { title: false, ...this._config });
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
}

if (!customElements.get("meteoswiss-panel")) customElements.define("meteoswiss-panel", MeteoSwissPanel);
if (!customElements.get("meteoswiss-map-card")) {
  customElements.define("meteoswiss-map-card", MeteoSwissMapCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "meteoswiss-map-card",
    name: "MeteoSwiss map",
    description: "Switzerland map: weather, avalanches, pollen, fire, drought and floods.",
  });
}
