// MeteoSwiss Complete For HA - pollen card with a sketch of each plant.
//
//   type: custom:meteoswiss-pollen-card
//   stations: [PZH, PBE]       # optional: default = station of the integration
//   species: [grasses, birch]  # optional: default = all 7, in this order
//   layout: table              # table (stations as columns) or list
//   value: mean                # mean (24 h) or latest (last hour)
//   language: auto             # auto, de, fr, it, rm, en
//   show_names: true
//   title: Pollen
//
// Data: /api/meteoswiss4ha/pollen (SwissPollen network, MeteoSwiss).

const SPECIES = ["hazel", "alder", "birch", "ash", "beech", "oak", "grasses"];
const LEVEL_COLORS = ["#9e9e9e", "#8bc34a", "#fdd835", "#ff9800", "#f44336"];

// Line sketches (64 x 64, stroke = currentColor).
const SKETCH = {
  grasses: `<path d="M24 58 C22 44 18 30 10 16"/><path d="M28 58 C28 42 26 26 22 8"/><path d="M32 58 C33 44 36 30 40 12"/>
    <path d="M36 58 C38 46 44 36 54 26"/><path d="M30 58 C28 48 26 40 20 32"/><path d="M34 58 C35 50 38 44 44 40"/>
    <path d="M22 8 l-2 5 M22 8 l3 4 M40 12 l-4 3 M40 12 l1 5 M10 16 l1 5 M10 16 l5 2"/>`,
  birch: `<path d="M32 60 V12"/><path d="M32 6 C40 10 46 18 48 26 l-3 1 l4 4 l-4 1 l3 4 C46 44 40 52 32 54 C24 52 18 44 17 36 l3 -4 l-4 -1 l4 -4 l-3 -1 C18 18 24 10 32 6 Z"/>
    <path d="M32 20 L42 14 M32 30 L46 24 M32 40 L44 36 M32 20 L22 14 M32 30 L18 24 M32 40 L20 36"/>`,
  hazel: `<path d="M6 10 C14 8 22 10 30 14"/><path d="M12 9 V14"/><path d="M10 14 C8 22 9 30 12 36 C15 30 15 22 13 14 Z"/><path d="M10 20 h4 M10 26 h4 M11 31 h3"/>
    <path d="M21 11 V16"/><path d="M19 16 C18 22 19 28 21 32 C23 28 24 22 22 16 Z"/><path d="M19 21 h4 M20 26 h3"/>
    <path d="M30 14 C34 20 34 26 32 30"/><path d="M32 30 C24 36 22 48 30 56 C36 60 48 58 54 50 C60 42 56 30 46 26 C40 24 35 26 32 30 Z"/>
    <path d="M32 30 L48 50 M36 40 L30 46 M40 38 L46 32 M44 46 L38 52 M46 42 L54 40"/>`,
  alder: `<path d="M10 8 C20 12 26 20 30 30 L34 58"/><path d="M30 30 C38 26 44 22 48 14"/><path d="M28 22 C22 24 18 30 16 36"/>
    <ellipse cx="48" cy="12" rx="5" ry="7"/><path d="M45 9 h6 M44 13 h8 M45 17 h6"/>
    <ellipse cx="16" cy="40" rx="5" ry="7"/><path d="M13 37 h6 M12 41 h8 M13 45 h6"/>
    <ellipse cx="40" cy="34" rx="4.5" ry="6.5"/><path d="M37 31 h6 M36 35 h8 M37 39 h6"/>`,
  ash: `<path d="M32 60 V6"/><path d="M32 10 C29 4 35 4 32 10 Z"/>
    <path d="M32 18 C24 12 16 14 14 18 C18 22 26 22 32 18 Z"/><path d="M32 18 C40 12 48 14 50 18 C46 22 38 22 32 18 Z"/>
    <path d="M32 30 C24 24 16 26 14 30 C18 34 26 34 32 30 Z"/><path d="M32 30 C40 24 48 26 50 30 C46 34 38 34 32 30 Z"/>
    <path d="M32 42 C24 36 16 38 14 42 C18 46 26 46 32 42 Z"/><path d="M32 42 C40 36 48 38 50 42 C46 46 38 46 32 42 Z"/>
    <path d="M32 8 C26 2 38 2 32 8"/>`,
  beech: `<path d="M32 60 V54"/><path d="M32 54 C20 50 14 40 14 30 C14 18 22 8 32 4 C42 8 50 18 50 30 C50 40 44 50 32 54 Z"/>
    <path d="M32 54 V8"/><path d="M32 16 L20 12 M32 24 L16 20 M32 32 L15 30 M32 40 L17 40 M32 16 L44 12 M32 24 L48 20 M32 32 L49 30 M32 40 L47 40"/>`,
  oak: `<path d="M32 60 V52"/><path d="M32 52 C26 52 24 48 26 44 C20 46 16 42 20 38 C14 38 12 32 18 30 C12 28 12 22 18 22 C14 18 16 12 22 14 C22 8 28 6 32 6
    C36 6 42 8 42 14 C48 12 50 18 46 22 C52 22 52 28 46 30 C52 32 50 38 44 38 C48 42 44 46 38 44 C40 48 38 52 32 52 Z"/>
    <path d="M32 52 V10 M32 20 L24 18 M32 28 L22 28 M32 36 L24 40 M32 20 L40 18 M32 28 L42 28 M32 36 L40 40"/>`,
};

const T = {
  fr: { title: "Pollen", unit: "grains/m³", levels: ["Aucun", "Faible", "Moyen", "Fort", "Très fort"], noData: "Pas de données",
        species: { hazel: "Noisetier", alder: "Aulne", birch: "Bouleau", ash: "Frêne", beech: "Hêtre", oak: "Chêne", grasses: "Graminées" },
        f: { title: "Titre", stations: "Stations (vide = celle de l’intégration)", species: "Espèces (cochez et ordonnez)", layout: "Disposition",
             value: "Valeur", language: "Langue", show_names: "Noms des espèces" },
        layouts: { table: "Tableau (stations en colonnes)", list: "Liste (une ligne par station)" },
        values: { mean: "Moyenne sur 24 heures", latest: "Dernière heure" }, auto: "Comme Home Assistant" },
  de: { title: "Pollen", unit: "Pollen/m³", levels: ["Keine", "Schwach", "Mittel", "Stark", "Sehr stark"], noData: "Keine Daten",
        species: { hazel: "Hasel", alder: "Erle", birch: "Birke", ash: "Esche", beech: "Buche", oak: "Eiche", grasses: "Gräser" },
        f: { title: "Titel", stations: "Stationen (leer = Station der Integration)", species: "Arten (auswählen und ordnen)", layout: "Anordnung",
             value: "Wert", language: "Sprache", show_names: "Artnamen" },
        layouts: { table: "Tabelle (Stationen als Spalten)", list: "Liste (eine Zeile pro Station)" },
        values: { mean: "24-Stunden-Mittel", latest: "Letzte Stunde" }, auto: "Wie Home Assistant" },
  it: { title: "Polline", unit: "granuli/m³", levels: ["Nessuno", "Debole", "Medio", "Forte", "Molto forte"], noData: "Nessun dato",
        species: { hazel: "Nocciolo", alder: "Ontano", birch: "Betulla", ash: "Frassino", beech: "Faggio", oak: "Quercia", grasses: "Graminacee" },
        f: { title: "Titolo", stations: "Stazioni (vuoto = quella dell’integrazione)", species: "Specie (selezionare e ordinare)", layout: "Disposizione",
             value: "Valore", language: "Lingua", show_names: "Nomi delle specie" },
        layouts: { table: "Tabella (stazioni in colonne)", list: "Elenco (una riga per stazione)" },
        values: { mean: "Media su 24 ore", latest: "Ultima ora" }, auto: "Come Home Assistant" },
  rm: { title: "Pollen", unit: "grauns/m³", levels: ["Nagin", "Flaivel", "Moderà", "Ferm", "Fitg ferm"], noData: "Naginas datas",
        species: { hazel: "Coller", alder: "Ogn", birch: "Badugn", ash: "Fraissen", beech: "Fau", oak: "Ruver", grasses: "Gramineas" },
        f: { title: "Titel", stations: "Staziuns (vid = quella da l’integraziun)", species: "Spezias (tscherner ed ordinar)", layout: "Disposiziun",
             value: "Valur", language: "Lingua", show_names: "Nums da las spezias" },
        layouts: { table: "Tabella (staziuns en colonnas)", list: "Glista (ina lingia per staziun)" },
        values: { mean: "Media da 24 uras", latest: "Ultima ura" }, auto: "Sco Home Assistant" },
  en: { title: "Pollen", unit: "grains/m³", levels: ["None", "Weak", "Moderate", "Strong", "Very strong"], noData: "No data",
        species: { hazel: "Hazel", alder: "Alder", birch: "Birch", ash: "Ash", beech: "Beech", oak: "Oak", grasses: "Grasses" },
        f: { title: "Title", stations: "Stations (empty = the integration's station)", species: "Species (tick and order)", layout: "Layout",
             value: "Value", language: "Language", show_names: "Species names" },
        layouts: { table: "Table (stations as columns)", list: "List (one row per station)" },
        values: { mean: "24-hour mean", latest: "Last hour" }, auto: "Like Home Assistant" },
};
const LANG_NAMES = { de: "Deutsch", fr: "Français", it: "Italiano", rm: "Rumantsch", en: "English" };

const langOf = (hass, config) => {
  const wanted = config?.language && config.language !== "auto" ? config.language : (hass?.locale?.language || hass?.language || "en").split("-")[0];
  return T[wanted] ? wanted : "en";
};
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const sketch = (key) => `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${SKETCH[key]}</svg>`;

// One request shared by every pollen card and editor on the page.
let pollenRequest = null;
let pollenTime = 0;
const loadPollen = (hass) => {
  if (!pollenRequest || Date.now() - pollenTime > 30 * 60000) {
    pollenTime = Date.now();
    pollenRequest = hass.callApi("GET", "meteoswiss4ha/pollen").catch((err) => {
      pollenRequest = null;
      throw err;
    });
  }
  return pollenRequest;
};

const STYLE = `
ha-card { padding: 12px; }
.title { display: flex; align-items: center; gap: 6px; font-size: 18px; margin: 0 2px 10px; }
.title ha-icon { --mdc-icon-size: 22px; color: #66bb6a; }
.grid { display: grid; gap: 8px; }
.tile { border: 1px solid var(--divider-color, rgba(127,127,127,.3)); border-radius: 12px; padding: 8px 10px; display: flex; align-items: center; gap: 10px; min-width: 0; background: rgba(127,127,127,.05); }
.sp { flex-direction: column; justify-content: center; gap: 2px; padding: 6px; position: relative; text-align: center; }
.sp svg { width: 46px; height: 46px; color: var(--sketch, var(--secondary-text-color)); }
.sp .name { font-size: 13px; font-weight: 500; }
.sp .badge { position: absolute; top: 6px; right: 6px; width: 12px; height: 12px; border-radius: 50%; box-shadow: 0 0 0 2px var(--card-background-color, #1c1c1c); }
.st { font-weight: 600; }
.st .ic { background: rgba(127,127,127,.2); }
.ic { flex: 0 0 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.ic ha-icon { --mdc-icon-size: 22px; }
.txt { min-width: 0; }
.lv { font-weight: 600; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.val { font-size: 12px; color: var(--secondary-text-color); white-space: nowrap; }
.stn { font-weight: 600; font-size: 14px; }
.empty { color: var(--secondary-text-color); padding: 8px; }
`;

class MeteoSwissPollenCard extends HTMLElement {
  setConfig(config) {
    this._config = { layout: "table", value: "mean", language: "auto", show_names: true, ...config };
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._load();
  }

  connectedCallback() {
    this._timer = setInterval(() => this._load(), 30 * 60000);
  }

  disconnectedCallback() {
    clearInterval(this._timer);
  }

  async _load() {
    if (!this._hass) return;
    try {
      this._data = await loadPollen(this._hass);
      this._error = false;
    } catch (err) {
      this._error = true;
    }
    this._render();
  }

  _cell(station, key, t) {
    const level = station?.species?.[key];
    const raw = station?.[this._config.value === "latest" ? "latest" : "mean"]?.[key];
    if (level == null) {
      return `<div class="tile"><div class="ic" style="background:rgba(127,127,127,.15)"><ha-icon icon="mdi:help" style="color:${LEVEL_COLORS[0]}"></ha-icon></div>
        <div class="txt"><div class="lv">${t.noData}</div></div></div>`;
    }
    const color = LEVEL_COLORS[level];
    const value = raw != null ? `${Math.round(raw).toLocaleString(this._loc)} ${t.unit}` : "";
    return `<div class="tile"><div class="ic" style="background:${color}33"><ha-icon icon="mdi:flower-pollen" style="color:${color}"></ha-icon></div>
      <div class="txt"><div class="lv">${t.levels[level]}</div><div class="val">${value}</div></div></div>`;
  }

  _speciesTile(key, stations, t) {
    const levels = stations.map((s) => s?.species?.[key]).filter((l) => l != null);
    const top = levels.length ? Math.max(...levels) : null;
    const badge = top ? `<span class="badge" style="background:${LEVEL_COLORS[top]}"></span>` : "";
    const name = this._config.show_names !== false ? `<span class="name">${t.species[key]}</span>` : "";
    // The sketch takes the color of the level as soon as there is pollen.
    const color = top ? LEVEL_COLORS[top] : "";
    return `<div class="tile sp" title="${t.species[key]}" style="${color ? `--sketch:${color}` : ""}">${badge}${sketch(key)}${name}</div>`;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const t = T[langOf(this._hass, this._config)];
    this._loc = langOf(this._hass, this._config) === "rm" ? "de-CH" : (this._hass?.locale?.language || "en");
    const title = this._config.title ?? t.title;
    const head = title ? `<div class="title"><ha-icon icon="mdi:tree"></ha-icon>${esc(title)}</div>` : "";
    if (!this._data) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card>${head}<div class="empty">${this._error ? t.noData : "…"}</div></ha-card>`;
      return;
    }
    const all = this._data.stations || [];
    const wanted = Array.isArray(this._config.stations) && this._config.stations.length ? this._config.stations : [this._data.home].filter(Boolean);
    const stations = wanted.map((abbr) => all.find((s) => s.abbr === abbr)).filter(Boolean);
    const species = (Array.isArray(this._config.species) && this._config.species.length ? this._config.species : SPECIES).filter((k) => SKETCH[k]);
    if (!stations.length) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card>${head}<div class="empty">${t.noData}</div></ha-card>`;
      return;
    }
    let body;
    if (this._config.layout === "list") {
      // One block per species: plant tile, then one row per station.
      const rows = species.map((key) => {
        const cells = stations.map((s) => {
          const cell = this._cell(s, key, t).replace('<div class="txt">', `<div class="txt"><div class="stn">${esc(s.name)}</div>`);
          return cell;
        });
        return `<div class="grid" style="grid-template-columns:96px 1fr;grid-template-rows:repeat(${stations.length},auto)">
          <div style="grid-row:1 / span ${stations.length};display:grid">${this._speciesTile(key, stations, t)}</div>${cells.join("")}</div>`;
      });
      body = `<div class="grid">${rows.join("")}</div>`;
    } else {
      // Table: stations as columns, species as rows.
      const cols = `grid-template-columns:78px repeat(${stations.length},minmax(0,1fr))`;
      const header = `<div></div>${stations.map((s) => `<div class="tile st"><div class="ic"><ha-icon icon="mdi:city-variant-outline"></ha-icon></div><div class="stn">${esc(s.name)}</div></div>`).join("")}`;
      const rows = species.map((key) => this._speciesTile(key, stations, t) + stations.map((s) => this._cell(s, key, t)).join("")).join("");
      body = `<div class="grid" style="${cols}">${header}${rows}</div>`;
    }
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card>${head}${body}</ha-card>`;
  }

  getCardSize() {
    return 2 + (Array.isArray(this._config?.species) ? this._config.species.length : SPECIES.length) * 2;
  }

  static getStubConfig() {
    return { layout: "table", species: ["grasses", "birch"] };
  }

  static getConfigElement() {
    return document.createElement("meteoswiss-pollen-card-editor");
  }
}

class MeteoSwissPollenCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) {
      loadPollen(hass).then((d) => {
        this._stations = d.stations || [];
        this._render();
      }).catch(() => {});
    }
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;
    const t = T[langOf(this._hass, this._config)];
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (e) =>
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: e.detail.value }, bubbles: true, composed: true })));
      this.appendChild(this._form);
    }
    this._form.hass = this._hass;
    this._form.data = { layout: "table", value: "mean", language: "auto", show_names: true, ...this._config };
    this._form.computeLabel = (s) => t.f[s.name] || s.name;
    this._form.schema = [
      { name: "title", selector: { text: {} } },
      { name: "stations", selector: { select: { multiple: true, reorder: true, mode: "list",
        options: (this._stations || []).map((s) => ({ value: s.abbr, label: s.name })) } } },
      { name: "species", selector: { select: { multiple: true, reorder: true, mode: "list",
        options: SPECIES.map((k) => ({ value: k, label: t.species[k] })) } } },
      { name: "layout", selector: { select: { mode: "dropdown", options: ["table", "list"].map((v) => ({ value: v, label: t.layouts[v] })) } } },
      { name: "value", selector: { select: { mode: "dropdown", options: ["mean", "latest"].map((v) => ({ value: v, label: t.values[v] })) } } },
      { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "auto", label: t.auto },
        ...Object.entries(LANG_NAMES).map(([value, label]) => ({ value, label }))] } } },
      { name: "show_names", selector: { boolean: {} } },
    ];
  }
}

if (!customElements.get("meteoswiss-pollen-card")) {
  customElements.define("meteoswiss-pollen-card", MeteoSwissPollenCard);
  customElements.define("meteoswiss-pollen-card-editor", MeteoSwissPollenCardEditor);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "meteoswiss-pollen-card",
    name: "MeteoSwiss pollen",
    description: "Pollen by species and station, with a sketch of each plant (de, fr, it, rm, en).",
    preview: true,
  });
}
