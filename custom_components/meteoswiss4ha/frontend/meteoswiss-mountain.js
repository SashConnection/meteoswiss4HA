// MeteoSwiss Complete For HA - mountain and fog panels.
//
//   type: custom:meteoswiss-mountain-card  a generic mountain (no names) with the 0 °C level,
//                                            the snow line, temperatures by altitude (measured
//                                            and estimated), the sea of fog and the avalanche
//                                            danger of my region, a large region or Switzerland
//   type: custom:meteoswiss-fog-card       fog and low stratus by region: reference stations
//                                            from the plain to the summits (Neuchâtel, Chaumont,
//                                            Chasseral, ...), top of the fog, 3-day forecast, map
//
// Options: entity, language; mountain: avalanche_scope (home, switzerland, jura, prealps,
// bernese, valais, central, grisons, engadine, south), max_altitude; fog: region, show_map,
// show_forecast, show_all.

import {
  DANGER, LANGS, ForecastCard, api, define, esc, findWeather, hh, langOf, locOf, makeEditor, num, relatedSensors, weekday,
} from "./meteoswiss-common.js";

const T = {
  de: {
    mountain: "Berge", freezing: "0 °C", snowline: "Schneefallgrenze (geschätzt)", measured: "gemessen", estimated: "geschätzt",
    fogTo: "Nebel bis ~{m} m (geschätzt)", avalanche: "Lawinengefahr", aval: ["gering", "mässig", "erheblich", "gross", "sehr gross"], noRating: "keine Einstufung",
    scope: { home: "Meine Region", switzerland: "Ganze Schweiz", jura: "Jura", prealps: "Voralpen", bernese: "Berner Alpen", valais: "Walliser Alpen", central: "Zentralschweiz", grisons: "Nordbünden", engadine: "Engadin", south: "Alpensüdseite" },
    today: "Heute", tomorrow: "Morgen", fl: "0 °C: {a}–{b} m",
    fog: "Nebel", states: { clear: "Kein Nebel", fog: "Nebel", stratus: "Hochnebel", overcast: "Bedeckt", precipitation: "Niederschlag" },
    between: "Obergrenze zwischen {a} und {b} m", above: "Sonne über ~{m} m", unknownTop: "Obergrenze über {a} m", forecast: "Prognose",
    hoursFog: "{s} {a}–{b}", topAbout: "Obergrenze ~{m} m", sunAbove: "Sonne darüber", noFog: "Kein Nebel", estimatedNote: "Schätzung aus den Stationen der Region",
    unavailable: "Nebeldaten nicht verfügbar (Option «Seen und Nebel»).", now: "Jetzt",
    f: { entity: "Wetter-Entität", language: "Sprache", avalanche_scope: "Lawinengefahr für", max_altitude: "Höhe oben (m)", region: "Region", show_map: "Karte", show_forecast: "Prognose", show_all: "Alle Regionen", name: "Titel" },
  },
  fr: {
    mountain: "Montagne", freezing: "0 °C", snowline: "Limite des chutes de neige (estimée)", measured: "mesuré", estimated: "estimé",
    fogTo: "Brouillard jusqu’à ~{m} m (estimé)", avalanche: "Danger d’avalanche", aval: ["faible", "limité", "marqué", "fort", "très fort"], noRating: "pas d’évaluation",
    scope: { home: "Ma région", switzerland: "Toute la Suisse", jura: "Jura", prealps: "Préalpes", bernese: "Alpes bernoises", valais: "Alpes valaisannes", central: "Suisse centrale", grisons: "Grisons nord", engadine: "Engadine", south: "Sud des Alpes" },
    today: "Aujourd’hui", tomorrow: "Demain", fl: "0 °C : {a}–{b} m",
    fog: "Brouillard", states: { clear: "Pas de brouillard", fog: "Brouillard", stratus: "Stratus", overcast: "Couvert", precipitation: "Précipitations" },
    between: "Sommet entre {a} et {b} m", above: "Soleil au-dessus de ~{m} m", unknownTop: "Sommet au-dessus de {a} m", forecast: "Prévision",
    hoursFog: "{s} {a}–{b}", topAbout: "sommet ~{m} m", sunAbove: "soleil au-dessus", noFog: "Pas de brouillard", estimatedNote: "Estimation d’après les stations de la région",
    unavailable: "Données de brouillard indisponibles (option « Lacs et brouillard »).", now: "Maintenant",
    f: { entity: "Entité météo", language: "Langue", avalanche_scope: "Danger d’avalanche pour", max_altitude: "Altitude en haut (m)", region: "Région", show_map: "Carte", show_forecast: "Prévision", show_all: "Toutes les régions", name: "Titre" },
  },
  it: {
    mountain: "Montagna", freezing: "0 °C", snowline: "Limite delle nevicate (stimato)", measured: "misurato", estimated: "stimato",
    fogTo: "Nebbia fino a ~{m} m (stimato)", avalanche: "Pericolo valanghe", aval: ["debole", "moderato", "marcato", "forte", "molto forte"], noRating: "nessuna valutazione",
    scope: { home: "La mia regione", switzerland: "Tutta la Svizzera", jura: "Giura", prealps: "Prealpi", bernese: "Alpi bernesi", valais: "Alpi vallesane", central: "Svizzera centrale", grisons: "Grigioni settentrionali", engadine: "Engadina", south: "Sud delle Alpi" },
    today: "Oggi", tomorrow: "Domani", fl: "0 °C: {a}–{b} m",
    fog: "Nebbia", states: { clear: "Niente nebbia", fog: "Nebbia", stratus: "Strato", overcast: "Coperto", precipitation: "Precipitazioni" },
    between: "Limite tra {a} e {b} m", above: "Sole sopra ~{m} m", unknownTop: "Limite sopra {a} m", forecast: "Previsione",
    hoursFog: "{s} {a}–{b}", topAbout: "limite ~{m} m", sunAbove: "sole sopra", noFog: "Niente nebbia", estimatedNote: "Stima dalle stazioni della regione",
    unavailable: "Dati della nebbia non disponibili (opzione «Laghi e nebbia»).", now: "Ora",
    f: { entity: "Entità meteo", language: "Lingua", avalanche_scope: "Pericolo valanghe per", max_altitude: "Altitudine in alto (m)", region: "Regione", show_map: "Carta", show_forecast: "Previsione", show_all: "Tutte le regioni", name: "Titolo" },
  },
  rm: {
    mountain: "Muntogna", freezing: "0 °C", snowline: "Cunfin da la naiv (stimà)", measured: "mesirà", estimated: "stimà",
    fogTo: "Tschajera fin ~{m} m (stimà)", avalanche: "Privel da lavinas", aval: ["flaivel", "moderà", "considerabel", "grond", "fitg grond"], noRating: "nagina valitaziun",
    scope: { home: "Mia regiun", switzerland: "Tut la Svizra", jura: "Jura", prealps: "Prealps", bernese: "Alps bernaisas", valais: "Alps vallesanas", central: "Svizra centrala", grisons: "Grischun dal nord", engadine: "Engiadina", south: "Vart dal sid da las Alps" },
    today: "Oz", tomorrow: "Damaun", fl: "0 °C: {a}–{b} m",
    fog: "Tschajera", states: { clear: "Nagina tschajera", fog: "Tschajera", stratus: "Tschajera auta", overcast: "Nivlus", precipitation: "Precipitaziun" },
    between: "Cunfin tranter {a} e {b} m", above: "Sulegl sur ~{m} m", unknownTop: "Cunfin sur {a} m", forecast: "Prognosa",
    hoursFog: "{s} {a}–{b}", topAbout: "cunfin ~{m} m", sunAbove: "sulegl survart", noFog: "Nagina tschajera", estimatedNote: "Stima tenor las staziuns da la regiun",
    unavailable: "Datas da tschajera betg disponiblas (opziun «Lais e tschajera»).", now: "Ussa",
    f: { entity: "Entitad d’aura", language: "Lingua", avalanche_scope: "Privel da lavinas per", max_altitude: "Altezza sura (m)", region: "Regiun", show_map: "Charta", show_forecast: "Prognosa", show_all: "Tut las regiuns", name: "Titel" },
  },
  en: {
    mountain: "Mountain", freezing: "0 °C", snowline: "Snow line (estimated)", measured: "measured", estimated: "estimated",
    fogTo: "Fog up to ~{m} m (estimated)", avalanche: "Avalanche danger", aval: ["low", "moderate", "considerable", "high", "very high"], noRating: "no rating",
    scope: { home: "My region", switzerland: "All of Switzerland", jura: "Jura", prealps: "Prealps", bernese: "Bernese Alps", valais: "Valais Alps", central: "Central Switzerland", grisons: "Northern Grisons", engadine: "Engadine", south: "Southern Alps" },
    today: "Today", tomorrow: "Tomorrow", fl: "0 °C: {a}–{b} m",
    fog: "Fog", states: { clear: "No fog", fog: "Fog", stratus: "Low stratus", overcast: "Overcast", precipitation: "Precipitation" },
    between: "Top between {a} and {b} m", above: "Sunshine above ~{m} m", unknownTop: "Top above {a} m", forecast: "Forecast",
    hoursFog: "{s} {a}–{b}", topAbout: "top ~{m} m", sunAbove: "sunshine above", noFog: "No fog", estimatedNote: "Estimated from the stations of the region",
    unavailable: "Fog data unavailable (option “Lakes and fog”).", now: "Now",
    f: { entity: "Weather entity", language: "Language", avalanche_scope: "Avalanche danger for", max_altitude: "Top altitude (m)", region: "Region", show_map: "Map", show_forecast: "Forecast", show_all: "All regions", name: "Title" },
  },
};
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const LABELS = Object.fromEntries(Object.entries(T).map(([l, t]) => [l, t.f]));

// SLF warning regions (CH-xxxx) grouped into large regions, by number prefix.
const SCOPES = {
  jura: ["8"], prealps: ["11", "13", "121", "32", "33"], bernese: ["122", "123", "124"], valais: ["4"],
  central: ["2", "31"], grisons: ["51", "52"], engadine: ["71"], south: ["6", "72"],
};
const SCOPE_KEYS = ["home", "switzerland", ...Object.keys(SCOPES)];
const inScope = (id, scope) => (SCOPES[scope] || []).some((p) => id.replace("CH-", "").startsWith(p));

const STATE_COLORS = { clear: "#7cc4ff", fog: "#b8bec6", stratus: "#8d959e", overcast: "#5c636b", precipitation: "#3d6fd8" };
const STATION_ICON = { fog: "mdi:weather-fog", grey: "mdi:weather-cloudy", sun: "mdi:white-balance-sunny", dry: "mdi:weather-night", wet: "mdi:weather-rainy", cloud: "mdi:weather-cloudy" };
const GRID_COLORS = { f: "#c3c8cf", g: "#8d959e", s: "#ffd54a", d: "#3b4a7a", w: "#3d6fd8", c: "#5c636b", "-": "transparent" };

const STYLE = `
:host { display: block; }
ha-card { overflow: hidden; color: #fff; background: linear-gradient(180deg, #0d1520 0%, #1b222b 60%, #262a30 100%); border: 0; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 14px 18px 4px; }
.title { font-size: 20px; font-weight: 700; }
select { background: rgba(255,255,255,.1); color: #fff; border: 0; border-radius: 10px; padding: 5px 8px; font: inherit; font-size: 13px; }
select option { color: #111; }
svg { display: block; width: 100%; height: auto; }
svg text { font-family: inherit; }
.empty { padding: 16px; color: #aaa; }
.note { font-size: 12px; opacity: .6; padding: 0 18px 12px; }
`;

// ========================================================== mountain card

class MeteoSwissMountainCard extends ForecastCard {
  setConfig(config) { this._config = { avalanche_scope: "home", ...config }; this._render(); }
  set hass(hass) { const first = !this._hass; super.hass = hass; if (first) this._load(); }
  get hass() { return this._hass; }
  async _load() {
    const [overview, fog] = await Promise.all([api(this._hass, "overview").catch(() => null), api(this._hass, "fog", 5 * 60000).catch(() => null)]);
    this._overview = overview; this._fog = fog;
    this._render();
  }

  _avalanche(t, sensors) {
    const scope = this._config.avalanche_scope || "home";
    const regions = this._overview?.avalanche || {};
    if (scope === "home") {
      const st = sensors.avalanche_danger;
      if (!st) return null;
      return { level: st.attributes.level, where: st.attributes.region || t.scope.home };
    }
    const ids = Object.keys(regions).filter((id) => scope === "switzerland" || inScope(id, scope));
    const level = Math.max(0, ...ids.map((id) => regions[id].level || 0));
    return { level: level || null, where: t.scope[scope] };
  }

  _render() {
    if (!this._config || !this._hass) return;
    const root = this._root();
    const lang = langOf(this._hass, this._config), t = T[lang], loc = locOf(this._hass, this._config);
    const st = this._state;
    if (!st) { root.innerHTML = `<style>${STYLE}</style><ha-card><div class="empty">…</div></ha-card>`; return; }
    const a = st.attributes;
    const sensors = relatedSensors(this._hass, this._entity);
    this._watch = Object.values(sensors).map((s) => s.entity_id);
    const hourly = (this._hourly || []).filter((h) => new Date(h.datetime).getTime() > Date.now() - 36e5);
    const fl = a.freezing_level ?? hourly.find((h) => h.freezing_level != null)?.freezing_level ?? null;
    const homeAlt = a.altitude ?? 500;
    const homeT = a.temperature;
    const maxAlt = Math.max(Number(this._config.max_altitude) || 4000, fl ? Math.ceil((fl + 400) / 500) * 500 : 0);
    const W = 600, H = 360, TOP = 24, BOT = 340, LEFT = 46;
    const y = (alt) => BOT - (alt / maxAlt) * (BOT - TOP);
    // Generic mountain silhouette (relative x, altitude fraction of 4000 m).
    const PROFILE = [[0, 0.1], [0.08, 0.14], [0.16, 0.24], [0.22, 0.2], [0.3, 0.38], [0.36, 0.33], [0.44, 0.55], [0.5, 0.5], [0.58, 0.78],
      [0.63, 0.7], [0.7, 1.0], [0.75, 0.88], [0.8, 0.93], [0.86, 0.66], [0.92, 0.52], [1, 0.35]];
    const mx = (f) => LEFT + f * (W - LEFT);
    const ridge = PROFILE.map(([f, h]) => [mx(f), y(h * 4000)]);
    const mountain = `M${mx(0)},${BOT} L${ridge.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" L")} L${W},${BOT} Z`;
    // A second, lower range behind (depth).
    const BACK = [[0, 0.3], [0.1, 0.46], [0.2, 0.4], [0.32, 0.62], [0.45, 0.52], [0.6, 0.7], [0.74, 0.58], [0.88, 0.66], [1, 0.48]];
    const back = `M${mx(0)},${BOT} L${BACK.map(([f, h]) => `${mx(f).toFixed(1)},${y(h * 3300).toFixed(1)}`).join(" L")} L${W},${BOT} Z`;
    const p = [];
    p.push(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d5c9a"/><stop offset="1" stop-color="#9cc8ee"/></linearGradient>
      <linearGradient id="rock" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9aa1aa"/><stop offset=".55" stop-color="#6c737c"/><stop offset="1" stop-color="#4a5058"/></linearGradient>
      <linearGradient id="fogg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4e7ea" stop-opacity="0"/><stop offset=".25" stop-color="#e4e7ea" stop-opacity=".88"/><stop offset="1" stop-color="#c9ced3" stop-opacity=".95"/></linearGradient>
      <clipPath id="mclip"><path d="${mountain}"/></clipPath></defs>`);
    p.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="url(#sky)"/>`);
    p.push(`<path d="${back}" fill="#7d8fa6" opacity=".5"/>`);
    p.push(`<path d="${mountain}" fill="url(#rock)"/>`);
    // Meadows and forest below ~1600 m, rock above, snow above the (estimated) snow line.
    p.push(`<rect clip-path="url(#mclip)" x="0" y="${y(1600)}" width="${W}" height="${BOT - y(1600)}" fill="#4d7044"/>`);
    const snowLine = fl != null ? Math.max(0, fl - 300) : 2800;
    p.push(`<rect clip-path="url(#mclip)" x="0" y="0" width="${W}" height="${y(snowLine)}" fill="#f4f7fb" opacity=".95"/>`);
    // Avalanche danger tint on the high slopes.
    const av = this._avalanche(t, sensors);
    // Avalanche danger: the ridge above 1500 m drawn in the level color.
    if (av?.level) {
      p.push(`<clipPath id="high"><rect x="0" y="0" width="${W}" height="${y(1500)}"/></clipPath>`);
      const d = `M${ridge.map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" L")}`;
      p.push(`<path clip-path="url(#high)" d="${d}" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="6" stroke-linejoin="round"/>`);
      p.push(`<path clip-path="url(#high)" d="${d}" fill="none" stroke="${DANGER[av.level]}" stroke-width="3.5" stroke-linejoin="round"/>`);
    }
    // Sea of fog (home region).
    const region = this._fog?.regions?.find((r) => r.key === this._fog.home_region);
    let fogTop = null;
    if (region && ["fog", "stratus"].includes(region.now.state) && region.now.top_min != null) {
      fogTop = region.now.top_max != null ? Math.round((region.now.top_min + region.now.top_max) / 2 / 50) * 50 : region.now.top_min;
      p.push(`<rect x="0" y="${y(fogTop) - 18}" width="${W}" height="${BOT - y(fogTop) + 18}" fill="url(#fogg)"/>`);
      p.push(`<text x="${W - 10}" y="${y(fogTop) + 18}" text-anchor="end" font-size="14" fill="#39414a" font-weight="600">${esc(fmt(t.fogTo, { m: num(fogTop, loc) }))}</text>`);
    }
    // Altitude scale.
    for (let alt = 1000; alt < maxAlt; alt += 1000) {
      p.push(`<line x1="${LEFT}" x2="${W}" y1="${y(alt)}" y2="${y(alt)}" stroke="#fff" stroke-opacity=".18" stroke-dasharray="2 4"/>`);
      p.push(`<text x="6" y="${y(alt) + 4}" font-size="12" fill="#fff" opacity=".85">${num(alt, loc)} m</text>`);
    }
    // 0 °C line and snow line.
    if (fl != null) {
      p.push(`<line x1="${LEFT}" x2="${W}" y1="${y(fl)}" y2="${y(fl)}" stroke="#4fc3ff" stroke-width="2.5" stroke-dasharray="8 5"/>`);
      p.push(`<rect x="${LEFT + 6}" y="${y(fl) - 24}" width="132" height="20" rx="10" fill="#0d3b5c" opacity=".85"/>`);
      p.push(`<text x="${LEFT + 14}" y="${y(fl) - 9}" font-size="13" fill="#bfe8ff" font-weight="700">0 °C · ${num(Math.round(fl / 10) * 10, loc)} m</text>`);
      if (hourly.some((h) => (h.precipitation_probability ?? 0) >= 30)) {
        p.push(`<line x1="${LEFT}" x2="${W}" y1="${y(snowLine)}" y2="${y(snowLine)}" stroke="#fff" stroke-width="1.5" stroke-dasharray="3 4" opacity=".8"/>`);
        p.push(`<text x="${LEFT + 10}" y="${y(snowLine) + 15}" font-size="12" fill="#fff">❄ ${esc(t.snowline)} ~${num(Math.round(snowLine / 50) * 50, loc)} m</text>`);
      }
    }
    // Temperatures by altitude: measured (reference stations nearby) and estimated.
    const marks = [];
    const stations = (this._fog?.regions || []).flatMap((r) => r.stations)
      .filter((s, i, all) => all.findIndex((x) => x.abbr === s.abbr) === i && s.temperature != null);
    const lat = this._hass.config?.latitude, lon = this._hass.config?.longitude;
    const near = stations.map((s) => ({ ...s, d: Math.hypot((s.lat - lat) * 111, (s.lon - lon) * 76) })).filter((s) => s.d < 70);
    for (let alt = 1000; alt <= maxAlt - 250; alt += 1000) {
      const m = near.filter((s) => Math.abs(s.altitude - alt) < 350).sort((u, v) => u.d - v.d)[0];
      if (m) marks.push({ alt: m.altitude, temp: m.temperature, measured: true });
      else if (homeT != null && fl != null && fl > homeAlt + 100) marks.push({ alt, temp: homeT * (fl - alt) / (fl - homeAlt), measured: false });
      else if (homeT != null) marks.push({ alt, temp: homeT - 0.0065 * (alt - homeAlt), measured: false });
    }
    if (homeT != null) marks.unshift({ alt: homeAlt, temp: homeT, measured: true, home: true });
    marks.forEach((m) => {
      const yy = y(m.alt), x = W - 64;
      p.push(`<circle cx="${x}" cy="${yy}" r="${m.measured ? 5 : 4}" fill="${m.measured ? "#ffcc33" : "none"}" stroke="#ffcc33" stroke-width="2"/>`);
      p.push(`<text x="${x + 10}" y="${yy + 5}" font-size="15" font-weight="700" fill="#fff" stroke="#000" stroke-opacity=".35" stroke-width="3" paint-order="stroke">${m.measured ? "" : "~"}${num(m.temp, loc)}°</text>`);
    });
    p.push(`<text x="${W - 10}" y="${BOT + 14}" text-anchor="end" font-size="11" fill="#fff" opacity=".75">● ${t.measured}  ○ ${t.estimated}</text>`);
    // Avalanche badge.
    let badge = "";
    if (av) {
      const lvl = av.level;
      badge = `<div class="av" style="--c:${lvl ? DANGER[lvl] : "#9e9e9e"}"><span class="n">${lvl || "–"}</span><div><b>${t.avalanche}</b><br>${lvl ? t.aval[lvl - 1] : t.noRating} · ${esc(av.where)}</div></div>`;
    }
    // 0 °C range today / tomorrow.
    const ranges = [0, 1].map((d) => {
      const day = new Date(); day.setHours(0, 0, 0, 0);
      const from = day.getTime() + d * 864e5;
      const v = hourly.filter((h) => { const ms = new Date(h.datetime).getTime(); return ms >= from && ms < from + 864e5 && h.freezing_level != null; }).map((h) => h.freezing_level);
      return v.length ? `<span><b>${d ? t.tomorrow : t.today}</b> ${fmt(t.fl, { a: num(Math.round(Math.min(...v) / 50) * 50, loc), b: num(Math.round(Math.max(...v) / 50) * 50, loc) })}</span>` : "";
    }).join("");
    const opts = SCOPE_KEYS.map((k) => `<option value="${k}" ${k === (this._config.avalanche_scope || "home") ? "selected" : ""}>${esc(t.scope[k])}</option>`).join("");
    root.innerHTML = `<style>${STYLE}
      .wrap { position: relative; }
      .av { position: absolute; top: 10px; right: 10px; display: flex; gap: 8px; align-items: center; background: rgba(0,0,0,.55); border-radius: 12px; padding: 6px 10px; font-size: 12px; max-width: 60%; }
      .av .n { width: 30px; height: 30px; border-radius: 6px; background: var(--c); color: #111; font-weight: 800; font-size: 18px; display: flex; align-items: center; justify-content: center; flex: 0 0 30px; }
      .fl { display: flex; gap: 16px; flex-wrap: wrap; padding: 8px 18px 14px; font-size: 14px; }
      .fl b { font-weight: 600; margin-right: 4px; }
    </style><ha-card><div class="head"><div class="title">${esc(this._config.name || t.mountain)}</div><select>${opts}</select></div>
      <div class="wrap"><svg viewBox="0 0 ${W} ${H}">${p.join("")}</svg>${badge}</div>
      <div class="fl">${ranges}</div></ha-card>`;
    root.querySelector("select").addEventListener("change", (e) => { this._config = { ...this._config, avalanche_scope: e.target.value }; this._render(); });
  }
  getCardSize() { return 6; }
  static getStubConfig(hass) { return { entity: findWeather(hass), avalanche_scope: "home" }; }
  static getConfigElement() {
    return makeEditor([["entity"], ["avalanche_scope", "max_altitude"], ["language"]], (hass, lang) => ({
      entity: { selector: { entity: { domain: "weather", integration: "meteoswiss4ha" } } },
      avalanche_scope: { selector: { select: { mode: "dropdown", options: SCOPE_KEYS.map((k) => ({ value: k, label: T[lang].scope[k] })) } } },
      max_altitude: { selector: { number: { min: 2000, max: 5000, step: 500, mode: "box" } } },
      language: { selector: { select: { mode: "dropdown", options: LANGS } } },
    }), LABELS);
  }
}

// =============================================================== fog card

let outline = null;
const BASE = new URL(".", import.meta.url).href;
const loadOutline = () => (outline ||= fetch(`${BASE}switzerland.json`).then((r) => r.json()).catch(() => null));
const BOX = { w: 400, h: 260, west: 5.85, east: 10.6, south: 45.75, north: 47.85 };
const merc = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const px = (lon) => ((lon - BOX.west) / (BOX.east - BOX.west)) * BOX.w;
const py = (lat) => ((merc(BOX.north) - merc(lat)) / (merc(BOX.north) - merc(BOX.south))) * BOX.h;
const ring = (c) => `M${c.map(([lon, lat]) => `${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join("L")}Z`;
const geomPath = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates).map((poly) => poly.map(ring).join("")).join("");

export function fogSummary(t, now, loc) {
  if (!now?.state) return "";
  if (!["fog", "stratus", "overcast"].includes(now.state)) return t.states[now.state] || "";
  if (now.top_max != null) return `${t.states[now.state]} · ${fmt(t.between, { a: num(now.top_min, loc), b: num(now.top_max, loc) })}`;
  if (now.top_min != null) return `${t.states[now.state]} · ${fmt(t.unknownTop, { a: num(now.top_min, loc) })}`;
  return t.states[now.state];
}

class MeteoSwissFogCard extends HTMLElement {
  setConfig(config) { this._config = { show_map: true, show_forecast: true, ...config }; this._region = this._config.region; this._render(); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) this._load(); }
  connectedCallback() { this._timer = setInterval(() => this._load(), 10 * 60000); }
  disconnectedCallback() { clearInterval(this._timer); }
  async _load() {
    if (!this._hass) return;
    try { this._data = await api(this._hass, "fog", 5 * 60000); this._error = false; } catch (e) { this._error = true; }
    this._outline = await loadOutline();
    this._render();
  }

  _section(region, t, loc) {
    const W = 600, H = 250, BOT = 228, TOP = 26, LEFT = 40;
    const st = region.stations;
    const maxAlt = Math.max(...st.map((s) => s.altitude)) + 420, minAlt = Math.max(0, Math.min(...st.map((s) => s.altitude)) - 150);
    const y = (alt) => BOT - ((alt - minAlt) / (maxAlt - minAlt)) * (BOT - TOP);
    const xs = st.map((_, i) => LEFT + 40 + (i * (W - LEFT - 100)) / Math.max(1, st.length - 1));
    const ground = st.map((s, i) => [xs[i], y(s.altitude)]);
    const terrain = `M0,${BOT + 20} L0,${ground[0][1] + 8} ${ground.map((g) => `L${g[0].toFixed(1)},${g[1].toFixed(1)}`).join(" ")} L${W},${ground[ground.length - 1][1] - 10} L${W},${BOT + 20} Z`;
    const now = region.now;
    const p = [`<defs><linearGradient id="fs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3c78c0"/><stop offset="1" stop-color="#a9d2f2"/></linearGradient>
      <linearGradient id="ff" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef0f2" stop-opacity="0"/><stop offset=".3" stop-color="#e6e9ec" stop-opacity=".9"/><stop offset="1" stop-color="#cfd4d9" stop-opacity=".95"/></linearGradient></defs>`,
      `<rect width="${W}" height="${H}" fill="url(#fs)"/>`, `<path d="${terrain}" fill="#4d5a48"/>`];
    if (["fog", "stratus", "overcast"].includes(now.state) && now.top_min != null) {
      const topAlt = now.top_max != null ? (now.top_min + now.top_max) / 2 : now.top_min + 100;
      p.push(`<rect x="0" y="${y(topAlt) - 16}" width="${W}" height="${H}" fill="url(#ff)"/>`);
      if (now.top_max != null) p.push(`<rect x="0" y="${y(now.top_max)}" width="${W}" height="${y(now.top_min) - y(now.top_max)}" fill="#fff" opacity=".12"/>
        <line x1="0" x2="${W}" y1="${y(now.top_max)}" y2="${y(now.top_max)}" stroke="#fff" stroke-dasharray="3 4" opacity=".7"/>
        <line x1="0" x2="${W}" y1="${y(now.top_min)}" y2="${y(now.top_min)}" stroke="#fff" stroke-dasharray="3 4" opacity=".7"/>`);
    }
    st.forEach((s, i) => {
      const x = xs[i], yy = y(s.altitude);
      const sunny = s.state === "sun" || s.state === "dry";
      p.push(`<line x1="${x}" x2="${x}" y1="${yy}" y2="${yy - 34}" stroke="#fff" stroke-width="1.5" opacity=".8"/>`);
      p.push(`<circle cx="${x}" cy="${yy - 46}" r="13" fill="${s.state === "sun" ? "#ffd54a" : s.state === "dry" ? "#2b3a6b" : s.state === "wet" ? "#3d6fd8" : s.state === "fog" ? "#d6dadf" : "#8d959e"}" stroke="#fff" stroke-width="1.5"/>`);
      p.push(`<foreignObject x="${x - 10}" y="${yy - 56}" width="20" height="20"><ha-icon xmlns="http://www.w3.org/1999/xhtml" icon="${STATION_ICON[s.state] || "mdi:help"}" style="--mdc-icon-size:18px;color:${sunny && s.state === "sun" ? "#7a5300" : s.state === "fog" ? "#444" : "#fff"}"></ha-icon></foreignObject>`);
      p.push(`<text x="${x}" y="${yy - 66}" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" stroke="#000" stroke-opacity=".4" stroke-width="3" paint-order="stroke">${esc(s.name)}</text>`);
      p.push(`<text x="${x}" y="${yy + 16}" text-anchor="middle" font-size="12" fill="#fff">${num(s.altitude, loc)} m${s.temperature != null ? ` · ${num(s.temperature, loc, 1)}°` : ""}</text>`);
    });
    return `<svg viewBox="0 0 ${W} ${H}">${p.join("")}</svg>`;
  }

  _forecast(region, t, loc) {
    const hours = region.hours || [];
    if (!hours.length) return "";
    const n = hours.length, W = 600, H = 34;
    const cells = hours.map((h, i) => `<rect x="${(i * W) / n}" y="0" width="${W / n + 0.5}" height="${H}" fill="${STATE_COLORS[h.state] || "#333"}"/>`).join("");
    const days = [];
    hours.forEach((h, i) => { const d = new Date(h.time); if (d.getHours() === 0) days.push(`<line x1="${(i * W) / n}" x2="${(i * W) / n}" y1="0" y2="${H}" stroke="#000" stroke-width="2"/><text x="${(i * W) / n + 4}" y="${H - 6}" font-size="11" fill="#111">${esc(weekday(d, loc, "short"))}</text>`); });
    const chips = (region.days || []).map((d) => {
      const label = new Date(d.date).toDateString() === new Date().toDateString() ? t.today : weekday(d.date, loc, "long");
      let text = t.states[d.state] || "";
      if (["fog", "stratus", "overcast"].includes(d.state) && d.start) {
        text = fmt(t.hoursFog, { s: t.states[d.state], a: hh(d.start, loc), b: hh(new Date(new Date(d.end).getTime() + 36e5), loc) });
        if (d.top_max != null) text += ` · ${fmt(t.topAbout, { m: num(Math.round((d.top_min + d.top_max) / 2 / 50) * 50, loc) })}, ${t.sunAbove}`;
      }
      return `<div class="chip"><span class="dot" style="background:${STATE_COLORS[d.state] || "#666"}"></span><b>${esc(label)}</b> ${esc(text)}</div>`;
    }).join("");
    return `<div class="fc"><div class="lbl">${t.forecast}</div><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px;border-radius:8px">${cells}${days.join("")}</svg><div class="chips">${chips}</div></div>`;
  }

  _map(t) {
    if (!this._outline) return "";
    const ch = geomPath(this._outline.geometry);
    const dots = this._data.regions.flatMap((r) => r.stations.map((s) => ({ ...s, region: r.key, rstate: r.now.state })))
      .map((s) => `<circle data-r="${s.region}" cx="${px(s.lon).toFixed(1)}" cy="${py(s.lat).toFixed(1)}" r="${s.region === this._region ? 6 : 4.5}" fill="${s.state === "sun" ? "#ffd54a" : s.state === "fog" ? "#e6e9ec" : s.state === "grey" ? "#8d959e" : s.state === "wet" ? "#3d6fd8" : s.state === "dry" ? "#3b4a7a" : "#5c636b"}" stroke="${s.region === this._region ? "#fff" : "#111"}" stroke-width="${s.region === this._region ? 2 : 1}" style="cursor:pointer"/>`).join("");
    return `<svg class="map" viewBox="0 0 ${BOX.w} ${BOX.h}"><path d="${ch}" fill="#3a4148" stroke="#cfd6dc" stroke-width="1.2"/>${dots}</svg>`;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const lang = langOf(this._hass, this._config), t = T[lang], loc = locOf(this._hass, this._config);
    if (this._error || (this._data && !this._data.regions)) { this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="empty">${t.unavailable}</div></ha-card>`; return; }
    if (!this._data) { this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="empty">…</div></ha-card>`; return; }
    this._region ||= this._data.home_region || this._data.regions[0].key;
    const region = this._data.regions.find((r) => r.key === this._region) || this._data.regions[0];
    const opts = this._data.regions.map((r) => `<option value="${r.key}" ${r.key === region.key ? "selected" : ""}>${esc(r.names[lang] || r.names.en)}</option>`).join("");
    const all = this._config.show_all ? `<div class="all">${this._data.regions.map((r) => `<div class="row" data-r="${r.key}"><span class="dot" style="background:${STATE_COLORS[r.now.state] || "#666"}"></span><b>${esc(r.names[lang] || r.names.en)}</b><span>${esc(fogSummary(t, r.now, loc))}</span></div>`).join("")}</div>` : "";
    this.shadowRoot.innerHTML = `<style>${STYLE}
      .sum { padding: 2px 18px 8px; font-size: 16px; }
      .sum b { font-size: 18px; }
      .fc { padding: 8px 18px 4px; }
      .lbl { font-size: 13px; opacity: .7; margin-bottom: 4px; }
      .chips { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; font-size: 14px; }
      .chip { display: flex; align-items: center; gap: 6px; }
      .dot { width: 11px; height: 11px; border-radius: 50%; display: inline-block; flex: 0 0 11px; }
      .map { max-width: 360px; margin: 6px auto 0; padding: 0 12px; }
      .all { padding: 6px 18px; }
      .all .row { display: grid; grid-template-columns: 14px minmax(110px, 38%) 1fr; gap: 6px; align-items: center; font-size: 13px; padding: 3px 0; cursor: pointer; }
    </style><ha-card><div class="head"><div class="title">${esc(this._config.name || t.fog)}</div><select>${opts}</select></div>
      <div class="sum"><b>${esc(fogSummary(t, region.now, loc))}</b></div>
      ${this._section(region, t, loc)}
      ${this._config.show_forecast !== false ? this._forecast(region, t, loc) : ""}
      ${this._config.show_map !== false ? this._map(t) : ""}${all}
      <div class="note">${t.estimatedNote} · MeteoSwiss</div></ha-card>`;
    const pick = (key) => { this._region = key; this._render(); };
    this.shadowRoot.querySelector("select").addEventListener("change", (e) => pick(e.target.value));
    this.shadowRoot.querySelectorAll("[data-r]").forEach((el) => el.addEventListener("click", () => pick(el.dataset.r)));
  }
  getCardSize() { return 8; }
  static getStubConfig() { return { show_map: true, show_forecast: true }; }
  static getConfigElement() {
    const REGIONS = ["three_lakes", "leman", "fribourg", "bern", "zurich", "central", "basel", "ticino"];
    const NAMES = { three_lakes: "Trois-Lacs / Drei-Seen-Land", leman: "Léman", fribourg: "Fribourg", bern: "Bern", zurich: "Zürich", central: "Zentralschweiz", basel: "Basel / Jura", ticino: "Ticino" };
    return makeEditor([["name"], ["region"], ["show_forecast", "show_map"], ["show_all"], ["language"]], () => ({
      name: { selector: { text: {} } },
      region: { selector: { select: { mode: "dropdown", options: REGIONS.map((r) => ({ value: r, label: NAMES[r] })) } } },
      show_forecast: { selector: { boolean: {} } }, show_map: { selector: { boolean: {} } }, show_all: { selector: { boolean: {} } },
      language: { selector: { select: { mode: "dropdown", options: LANGS } } },
    }), LABELS);
  }
}

define("meteoswiss-mountain-card", MeteoSwissMountainCard, "MeteoSwiss mountain", "Generic mountain with the 0 °C level, snow line, temperatures by altitude, sea of fog and avalanche danger.");
define("meteoswiss-fog-card", MeteoSwissFogCard, "MeteoSwiss fog", "Fog and low stratus by region with reference stations from the plain to the summits, and a 3-day forecast.");
