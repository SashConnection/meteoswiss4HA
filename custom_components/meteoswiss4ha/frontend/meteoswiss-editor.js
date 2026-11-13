// MeteoSwiss Complete For HA - card editor with collapsible sections.
//
// Top: the essential fields (always visible). Then one collapsible section per topic,
// each with an icon, a title, a one-line summary of its settings and a reset button.
// "Sun and moon" and "Advanced" (language) are added to every card that wants them,
// and a link opens the right section of the user guide.

import { ASTRO_OPTIONS } from "./meteoswiss-astro.js";

const LANGS = ["de", "fr", "it", "rm", "en"];
const langOfHass = (hass, cfg) => {
  const l = cfg?.language && cfg.language !== "auto" ? cfg.language : (hass?.locale?.language || hass?.language || "en").split("-")[0];
  return LANGS.includes(l) ? l : "en";
};

// Titles of the common sections and words used in summaries.
export const W = {
  de: { advanced: "Erweitert", astro: "Sonne und Mond", actions: "Aktionen", reset: "Zurücksetzen", doc: "Anleitung öffnen", haLang: "Sprache von Home Assistant", language: "Sprache", off: "aus", all: "alle", none: "keine", default: "Standard",
        astroF: { show_sun: "Sonnenaufgang und -untergang", show_day_length: "Tageslänge", show_moon: "Mondphase (Bild, %, Name)", show_moon_times: "Mondaufgang und -untergang", show_next_moons: "Nächster Voll- und Neumond", show_ephemeris: "Ephemeride (Heilige des Tages, Woche)" },
        astroS: { show_sun: "Sonne", show_day_length: "Tageslänge", show_moon: "Mond", show_moon_times: "Mondzeiten", show_next_moons: "Vollmond", show_ephemeris: "Ephemeride" } },
  fr: { advanced: "Avancé", astro: "Soleil et lune", actions: "Actions", reset: "Remettre par défaut", doc: "Ouvrir le mode d’emploi", haLang: "Langue de Home Assistant", language: "Langue", off: "désactivé", all: "toutes", none: "aucun", default: "par défaut",
        astroF: { show_sun: "Lever et coucher du soleil", show_day_length: "Durée du jour", show_moon: "Phase de lune (image, %, nom)", show_moon_times: "Lever et coucher de la lune", show_next_moons: "Prochaine pleine et nouvelle lune", show_ephemeris: "Éphéméride (saint du jour, semaine)" },
        astroS: { show_sun: "soleil", show_day_length: "durée du jour", show_moon: "lune", show_moon_times: "heures de la lune", show_next_moons: "pleine lune", show_ephemeris: "éphéméride" } },
  it: { advanced: "Avanzate", astro: "Sole e luna", actions: "Azioni", reset: "Ripristina", doc: "Apri le istruzioni", haLang: "Lingua di Home Assistant", language: "Lingua", off: "disattivato", all: "tutti", none: "nessuno", default: "predefinito",
        astroF: { show_sun: "Alba e tramonto", show_day_length: "Durata del giorno", show_moon: "Fase lunare (immagine, %, nome)", show_moon_times: "Sorgere e tramonto della luna", show_next_moons: "Prossima luna piena e nuova", show_ephemeris: "Effemeride (santo del giorno, settimana)" },
        astroS: { show_sun: "sole", show_day_length: "durata del giorno", show_moon: "luna", show_moon_times: "orari della luna", show_next_moons: "luna piena", show_ephemeris: "effemeride" } },
  rm: { advanced: "Avanzà", astro: "Sulegl e glina", actions: "Acziuns", reset: "Reinizialisar", doc: "Avrir l’instrucziun", haLang: "Lingua da Home Assistant", language: "Lingua", off: "deactivà", all: "tuts", none: "nagin", default: "standard",
        astroF: { show_sun: "Levada e rendida dal sulegl", show_day_length: "Durada dal di", show_moon: "Fasa da la glina (maletg, %, num)", show_moon_times: "Levada e rendida da la glina", show_next_moons: "Proxima glina plaina e nova", show_ephemeris: "Efemerida (sogn dal di, emna)" },
        astroS: { show_sun: "sulegl", show_day_length: "durada dal di", show_moon: "glina", show_moon_times: "uras da la glina", show_next_moons: "glina plaina", show_ephemeris: "efemerida" } },
  en: { advanced: "Advanced", astro: "Sun and moon", actions: "Actions", reset: "Reset to default", doc: "Open the user guide", haLang: "Home Assistant language", language: "Language", off: "off", all: "all", none: "none", default: "default",
        astroF: { show_sun: "Sunrise and sunset", show_day_length: "Day length", show_moon: "Moon phase (picture, %, name)", show_moon_times: "Moonrise and moonset", show_next_moons: "Next full and new moon", show_ephemeris: "Ephemeris (saint of the day, week)" },
        astroS: { show_sun: "sun", show_day_length: "day length", show_moon: "moon", show_moon_times: "moon times", show_next_moons: "full moon", show_ephemeris: "ephemeris" } },
};
const LANG_OPTIONS = (w) => [{ value: "auto", label: `Auto (${w.haLang})` }, { value: "de", label: "Deutsch" }, { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" }, { value: "rm", label: "Rumantsch" }, { value: "en", label: "English" }];
const LANG_NAMES = { de: "Deutsch", fr: "Français", it: "Italiano", rm: "Rumantsch", en: "English" };

const GUIDE = { fr: "https://github.com/SashConnection/meteoswiss4HA/blob/main/docs/GUIDE.fr.md", other: "https://github.com/SashConnection/meteoswiss4HA/blob/main/README.md" };

// spec: { defaults, labels: {lang: {field: label}}, top(ctx), sections: [{ key, icon, title: {lang}, keys, fields(ctx), summary(cfg, ctx) }],
//         astro: bool, doc: { fr: "#anchor", en: "#anchor" }, load(hass) -> extra, clean(config) -> config }
export function sectionEditor(spec) {
  const el = document.createElement("meteoswiss-section-editor");
  el._spec = spec;
  return el;
}

class SectionEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._render(); }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first && this._spec?.load) Promise.resolve(this._spec.load(hass)).then((x) => { this._extra = x; this._render(true); }).catch(() => {});
    this._render();
  }

  _emit(config) {
    const clean = this._spec.clean ? this._spec.clean({ ...config }) : { ...config };
    for (const [k, v] of Object.entries(clean)) if (v === undefined || v === "" || (Array.isArray(v) && !v.length && !this._spec.keepEmpty?.includes(k))) delete clean[k];
    // Values equal to the defaults are not written to the card configuration.
    for (const [k, v] of Object.entries(this._spec.defaults || {})) if (k in clean && JSON.stringify(clean[k]) === JSON.stringify(v)) delete clean[k];
    if (clean.language === "auto") delete clean.language;
    this._config = clean;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: clean }, bubbles: true, composed: true }));
    this._render();
  }

  _sections(ctx) {
    const w = W[ctx.lang];
    const list = [...(this._spec.sections || [])];
    if (this._spec.astro) list.push({
      key: "astro", icon: "mdi:weather-sunset", title: Object.fromEntries(LANGS.map((l) => [l, W[l].astro])), keys: ASTRO_OPTIONS,
      fields: () => ASTRO_OPTIONS.map((n) => ({ name: n, selector: { boolean: {} } })),
      summary: (cfg) => ASTRO_OPTIONS.filter((n) => cfg[n]).map((n) => w.astroS[n]).join(" · ") || w.off,
    });
    list.push({
      key: "advanced", icon: "mdi:tune-variant", title: Object.fromEntries(LANGS.map((l) => [l, W[l].advanced])), keys: ["language", ...(this._spec.advancedKeys || [])],
      fields: (c) => [{ name: "language", selector: { select: { mode: "dropdown", options: LANG_OPTIONS(w) } } }, ...(this._spec.advanced ? this._spec.advanced(c) : [])],
      summary: (cfg) => (cfg.language && cfg.language !== "auto" ? LANG_NAMES[cfg.language] : w.haLang),
    });
    return list;
  }

  _render(force) {
    if (!this._hass || !this._config || !this._spec) return;
    const lang = langOfHass(this._hass, this._config);
    const w = W[lang];
    const ctx = { hass: this._hass, lang, config: this._config, extra: this._extra, w };
    const data = { ...(this._spec.defaults || {}), ...this._config };
    const labels = { ...(this._spec.labels?.en || {}), ...(this._spec.labels?.[lang] || {}), ...w.astroF, language: w.language };
    const sections = this._sections(ctx);
    const layoutKey = `${lang}|${sections.map((s) => s.key).join(",")}|${force ? Math.random() : ""}`;
    if (!this._root || this._layout !== layoutKey) {
      this._layout = layoutKey;
      const open = new Set(this._open || []);
      this.innerHTML = `<style>
        meteoswiss-section-editor { display: block; }
        .mse-top { margin-bottom: 12px; }
        .mse-sec { margin-bottom: 10px; display: block; --expansion-panel-summary-padding: 0 8px 0 12px; }
        .mse-hdr { display: flex; align-items: center; gap: 14px; padding: 10px 0; min-width: 0; }
        .mse-hdr ha-icon { color: var(--secondary-text-color); flex: 0 0 24px; }
        .mse-txt { min-width: 0; }
        .mse-title { font-weight: 500; font-size: 15px; }
        .mse-sum { font-size: 13px; color: var(--secondary-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mse-body { padding: 4px 4px 12px; }
        .mse-reset { color: var(--secondary-text-color); }
        .mse-doc { display: flex; justify-content: flex-end; border-top: 1px solid var(--divider-color); margin-top: 14px; padding-top: 10px; }
        .mse-doc a { color: var(--primary-color); text-decoration: none; font-size: 14px; display: inline-flex; gap: 6px; align-items: center; }
      </style><div class="mse-top"></div>${sections.map((s) => `
        <ha-expansion-panel class="mse-sec" outlined data-key="${s.key}" ${open.has(s.key) ? "expanded" : ""}>
          <div slot="header" class="mse-hdr"><ha-icon icon="${s.icon}"></ha-icon><div class="mse-txt"><div class="mse-title">${s.title[lang] || s.title.en}</div><div class="mse-sum"></div></div></div>
          <ha-icon-button slot="icons" class="mse-reset" label="${w.reset}" title="${w.reset}"><ha-icon icon="mdi:restore"></ha-icon></ha-icon-button>
          <div class="mse-body"></div>
        </ha-expansion-panel>`).join("")}
        <div class="mse-doc"><a target="_blank" rel="noreferrer" href="${lang === "fr" ? GUIDE.fr + (this._spec.doc?.fr || "") : GUIDE.other + (this._spec.doc?.en || "")}"><ha-icon icon="mdi:book-open-variant"></ha-icon>${w.doc}</a></div>`;
      this._root = true;
      this._forms = {};
      const mk = (host, key) => {
        const f = document.createElement("ha-form");
        f.addEventListener("value-changed", (e) => this._emit({ ...this._config, ...e.detail.value }));
        host.appendChild(f);
        this._forms[key] = f;
      };
      mk(this.querySelector(".mse-top"), "_top");
      this.querySelectorAll(".mse-sec").forEach((panel) => {
        const key = panel.dataset.key;
        mk(panel.querySelector(".mse-body"), key);
        panel.addEventListener("expanded-changed", (e) => {
          const set = new Set(this._open || []);
          e.detail?.expanded ? set.add(key) : set.delete(key);
          this._open = [...set];
        });
        panel.querySelector(".mse-reset").addEventListener("click", (e) => {
          e.stopPropagation();
          const sec = sections.find((s) => s.key === key);
          const cfg = { ...this._config };
          for (const k of sec.keys || []) delete cfg[k];
          this._emit(cfg);
        });
      });
    }
    const setForm = (form, schema) => {
      form.hass = this._hass;
      form.data = data;
      form.computeLabel = (s) => labels[s.name] || s.name;
      form.computeHelper = (s) => this._spec.helpers?.[lang]?.[s.name];
      form.schema = schema;
    };
    setForm(this._forms._top, this._spec.top ? this._spec.top(ctx) : []);
    for (const s of sections) {
      setForm(this._forms[s.key], s.fields(ctx));
      const sum = this.querySelector(`.mse-sec[data-key="${s.key}"] .mse-sum`);
      if (sum) sum.textContent = s.summary ? s.summary(data, ctx) : "";
    }
  }
}
if (!customElements.get("meteoswiss-section-editor")) customElements.define("meteoswiss-section-editor", SectionEditor);

// Field helpers.
export const F = {
  weather: { name: "entity", selector: { entity: { domain: "weather", integration: "meteoswiss4ha" } } },
  text: (name) => ({ name, selector: { text: {} } }),
  bool: (name) => ({ name, selector: { boolean: {} } }),
  num: (name, min, max, step = 1, mode = "box") => ({ name, selector: { number: { min, max, step, mode } } }),
  select: (name, options, extra = {}) => ({ name, selector: { select: { mode: "dropdown", options, ...extra } } }),
  grid: (...schema) => ({ type: "grid", name: "", schema }),
};
export const sectionTitle = (de, fr, it, rm, en) => ({ de, fr, it, rm, en });
