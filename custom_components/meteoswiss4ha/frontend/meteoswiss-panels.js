// MeteoSwiss Complete For HA - everyday panels.
//
//   type: custom:meteoswiss-sky-card       live sky (sun/moon, clouds, rain, snow, fog, stars)
//                                            behind the place, temperature and condition
//   type: custom:meteoswiss-outing-card    "Should I go out?": verdict, rain timing, clothes,
//                                            wind, warnings, pollen, fog, best time
//   type: custom:meteoswiss-day-card       "My day": morning, afternoon, evening, night
//                                            on a timeline with sunrise and sunset
//   type: custom:meteoswiss-compare-card   home and watched places side by side
//   type: custom:meteoswiss-wall-card      wall screen: big clock, weather, next hours,
//                                            warnings; dark red night mode
//
// All: entity (optional), language (auto, de, fr, it, rm, en).

import { monument } from "./meteoswiss-monuments.js";
import {
  DANGER, LANGS, WARNING_KINDS, WARN_ICONS, ForecastCard, api, dayCode, define, esc, findWeather, hh, hhmm,
  isSunnyCode, isWetCode, langOf, locOf, makeEditor, num, relatedSensors, sunElevation, weekday,
} from "./meteoswiss-common.js";
import { astroFor, moon as moonInfo } from "./meteoswiss-astro.js";
import { F, sectionEditor, sectionTitle as ST } from "./meteoswiss-editor.js";

const T = {
  de: {
    outing: "Rausgehen?", rainIn: "Regen in {m} Min. (Radar)", escape: "Sonne in {name} ({alt} m, {km} km)", escapeFrom: "Sonne ab {t} in {name} ({alt} m)", yes: "Ja, los!", umbrella: "Ja, mit Schirm", later: "Lieber später", no: "Besser drinnen bleiben",
    dryUntil: "Trocken bis {t}", dryAll: "Trocken in den nächsten Stunden", rainFrom: "Regen wahrscheinlich ab {t} ({p} %)", rainNow: "Es regnet ({mm} mm/h)",
    best: "Bester Zeitpunkt: {a}–{b}", gusts: "Böen bis {v} km/h", warning: "Warnung {kind}: Stufe {n}", pollen: "Pollen: {level}",
    fog: "Hochnebel, Sonne über ~{m} m", fogNo: "Nebel", ice: "Glättegefahr", sun: "Viel Sonne: Sonnenbrille", sunset: "Sonnenuntergang {t}",
    clothes: ["Mütze, Handschuhe und dicke Jacke", "Warmer Mantel", "Jacke", "Leichter Pullover", "T-Shirt", "Sehr heiss: Hut und Wasser"],
    levels: ["schwach", "mässig", "stark", "sehr stark"],
    kinds: { rain: "Regen", thunderstorm: "Gewitter", wind: "Wind", snow: "Schnee", slippery_roads: "Glätte", heat: "Hitze", frost: "Frost" },
    myDay: "Mein Tag", parts: ["Nacht", "Morgen", "Nachmittag", "Abend"], today: "Heute", tomorrow: "Morgen", sunrise: "Sonnenaufgang", sunsetW: "Sonnenuntergang",
    compare: "Meine Orte vergleichen", bestToday: "Heute am besten", noPlaces: "Füge Orte oder Personen in den Optionen der Integration hinzu (Beobachtete Orte).",
    home: "Zuhause", now: "Jetzt", noEntity: "Keine MeteoSwiss-Wetterentität gefunden.", rainMm: "Regen",
    f: { entity: "Wetter-Entität", name: "Titel", hours: "Stunden", language: "Sprache", animate: "Animiert", background: "Als Hintergrund des Dashboards", night_mode: "Nachtmodus", days: "Tage", show_seconds: "Sekunden" },
    night: { auto: "Automatisch (Sonne)", on: "Immer", off: "Nie" },
  },
  fr: {
    outing: "Faut-il sortir ?", rainIn: "Pluie dans {m} min (radar)", escape: "Soleil à {name} ({alt} m, {km} km)", escapeFrom: "Soleil dès {t} à {name} ({alt} m)", yes: "Oui, vas-y !", umbrella: "Oui, avec un parapluie", later: "Plutôt plus tard", no: "Mieux vaut rester",
    dryUntil: "Sec jusqu’à {t}", dryAll: "Sec ces prochaines heures", rainFrom: "Pluie probable dès {t} ({p} %)", rainNow: "Il pleut ({mm} mm/h)",
    best: "Meilleur moment : {a}–{b}", gusts: "Rafales jusqu’à {v} km/h", warning: "Alerte {kind} : degré {n}", pollen: "Pollen : {level}",
    fog: "Grisaille, soleil au-dessus de ~{m} m", fogNo: "Brouillard", ice: "Risque de verglas", sun: "Beaucoup de soleil : lunettes", sunset: "Coucher du soleil {t}",
    clothes: ["Bonnet, gants et grosse veste", "Manteau chaud", "Veste", "Pull léger", "T-shirt", "Très chaud : chapeau et eau"],
    levels: ["faible", "moyen", "fort", "très fort"],
    kinds: { rain: "pluie", thunderstorm: "orages", wind: "vent", snow: "neige", slippery_roads: "routes glissantes", heat: "canicule", frost: "gel" },
    myDay: "Ma journée", parts: ["Nuit", "Matin", "Après-midi", "Soir"], today: "Aujourd’hui", tomorrow: "Demain", sunrise: "Lever du soleil", sunsetW: "Coucher du soleil",
    compare: "Comparer mes lieux", bestToday: "Le meilleur aujourd’hui", noPlaces: "Ajoute des lieux ou des personnes dans les options de l’intégration (Lieux et personnes surveillés).",
    home: "Maison", now: "Maint.", noEntity: "Aucune entité météo MeteoSwiss trouvée.", rainMm: "Pluie",
    f: { entity: "Entité météo", name: "Titre", hours: "Heures", language: "Langue", animate: "Animé", background: "En fond du tableau de bord", night_mode: "Mode nuit", days: "Jours", show_seconds: "Secondes" },
    night: { auto: "Automatique (soleil)", on: "Toujours", off: "Jamais" },
  },
  it: {
    outing: "Uscire?", rainIn: "Pioggia tra {m} min (radar)", escape: "Sole a {name} ({alt} m, {km} km)", escapeFrom: "Sole dalle {t} a {name} ({alt} m)", yes: "Sì, vai!", umbrella: "Sì, con l’ombrello", later: "Meglio più tardi", no: "Meglio restare a casa",
    dryUntil: "Asciutto fino alle {t}", dryAll: "Asciutto nelle prossime ore", rainFrom: "Pioggia probabile dalle {t} ({p} %)", rainNow: "Piove ({mm} mm/h)",
    best: "Momento migliore: {a}–{b}", gusts: "Raffiche fino a {v} km/h", warning: "Allerta {kind}: grado {n}", pollen: "Polline: {level}",
    fog: "Grigio, sole sopra ~{m} m", fogNo: "Nebbia", ice: "Rischio di ghiaccio", sun: "Molto sole: occhiali da sole", sunset: "Tramonto {t}",
    clothes: ["Berretto, guanti e giacca pesante", "Cappotto caldo", "Giacca", "Maglione leggero", "Maglietta", "Molto caldo: cappello e acqua"],
    levels: ["debole", "moderato", "forte", "molto forte"],
    kinds: { rain: "pioggia", thunderstorm: "temporali", wind: "vento", snow: "neve", slippery_roads: "strade sdrucciolevoli", heat: "canicola", frost: "gelo" },
    myDay: "La mia giornata", parts: ["Notte", "Mattino", "Pomeriggio", "Sera"], today: "Oggi", tomorrow: "Domani", sunrise: "Alba", sunsetW: "Tramonto",
    compare: "Confronta i miei luoghi", bestToday: "Il migliore oggi", noPlaces: "Aggiungi luoghi o persone nelle opzioni dell’integrazione (Luoghi e persone sorvegliati).",
    home: "Casa", now: "Ora", noEntity: "Nessuna entità meteo MeteoSwiss trovata.", rainMm: "Pioggia",
    f: { entity: "Entità meteo", name: "Titolo", hours: "Ore", language: "Lingua", animate: "Animato", background: "Come sfondo della dashboard", night_mode: "Modalità notte", days: "Giorni", show_seconds: "Secondi" },
    night: { auto: "Automatico (sole)", on: "Sempre", off: "Mai" },
  },
  rm: {
    outing: "Ir ora?", rainIn: "Plievgia en {m} min (radar)", escape: "Sulegl a {name} ({alt} m, {km} km)", escapeFrom: "Sulegl a partir da las {t} a {name} ({alt} m)", yes: "Gea, va!", umbrella: "Gea, cun il parastgel", later: "Pli tard", no: "Meglier restar en chasa",
    dryUntil: "Sitg fin {t}", dryAll: "Sitg las proximas uras", rainFrom: "Plievgia probabla a partir da {t} ({p} %)", rainNow: "I plova ({mm} mm/h)",
    best: "Il meglier mument: {a}–{b}", gusts: "Buffs fin {v} km/h", warning: "Avertiment {kind}: grad {n}", pollen: "Pollen: {level}",
    fog: "Grisch, sulegl sur ~{m} m", fogNo: "Tschajera", ice: "Privel da glatsch", sun: "Bler sulegl: egliers da sulegl", sunset: "Il sulegl va da rendiu {t}",
    clothes: ["Chapitscha, manetschas e giacca grossa", "Mantel chaud", "Giacca", "Pullover lev", "T-shirt", "Fitg chaud: chapè ed aua"],
    levels: ["flaivel", "moderà", "ferm", "fitg ferm"],
    kinds: { rain: "plievgia", thunderstorm: "urizi", wind: "vent", snow: "naiv", slippery_roads: "vias glischas", heat: "chalira", frost: "gelischun" },
    myDay: "Mes di", parts: ["Notg", "Damaun", "Suentermezdi", "Saira"], today: "Oz", tomorrow: "Damaun", sunrise: "Levada dal sulegl", sunsetW: "Rendida dal sulegl",
    compare: "Cumparegliar mes lieus", bestToday: "Il meglier oz", noPlaces: "Agiuntescha lieus u persunas en las opziuns da l’integraziun (Lieus e persunas observads).",
    home: "Chasa", now: "Ussa", noEntity: "Nagina entitad d’aura MeteoSwiss chattada.", rainMm: "Plievgia",
    f: { entity: "Entitad d’aura", name: "Titel", hours: "Uras", language: "Lingua", animate: "Animà", background: "Sco fund dal dashboard", night_mode: "Modus da notg", days: "Dis", show_seconds: "Secundas" },
    night: { auto: "Automatic (sulegl)", on: "Adina", off: "Mai" },
  },
  en: {
    outing: "Go out?", rainIn: "Rain in {m} min (radar)", escape: "Sunshine at {name} ({alt} m, {km} km)", escapeFrom: "Sunshine from {t} at {name} ({alt} m)", yes: "Yes, go!", umbrella: "Yes, with an umbrella", later: "Better later", no: "Better stay in",
    dryUntil: "Dry until {t}", dryAll: "Dry for the next hours", rainFrom: "Rain likely from {t} ({p} %)", rainNow: "Raining ({mm} mm/h)",
    best: "Best time: {a}–{b}", gusts: "Gusts up to {v} km/h", warning: "{kind} warning: level {n}", pollen: "Pollen: {level}",
    fog: "Grey, sunshine above ~{m} m", fogNo: "Fog", ice: "Risk of ice", sun: "Plenty of sun: sunglasses", sunset: "Sunset {t}",
    clothes: ["Hat, gloves and a thick jacket", "Warm coat", "Jacket", "Light sweater", "T-shirt", "Very hot: hat and water"],
    levels: ["weak", "moderate", "strong", "very strong"],
    kinds: { rain: "Rain", thunderstorm: "Thunderstorm", wind: "Wind", snow: "Snow", slippery_roads: "Slippery roads", heat: "Heat", frost: "Frost" },
    myDay: "My day", parts: ["Night", "Morning", "Afternoon", "Evening"], today: "Today", tomorrow: "Tomorrow", sunrise: "Sunrise", sunsetW: "Sunset",
    compare: "Compare my places", bestToday: "Best today", noPlaces: "Add places or persons in the integration options (Watched places and persons).",
    home: "Home", now: "Now", noEntity: "No MeteoSwiss weather entity found.", rainMm: "Rain",
    f: { entity: "Weather entity", name: "Title", hours: "Hours", language: "Language", animate: "Animated", background: "As dashboard background", night_mode: "Night mode", days: "Days", show_seconds: "Seconds" },
    night: { auto: "Automatic (sun)", on: "Always", off: "Never" },
  },
};
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const LABELS = Object.fromEntries(Object.entries(T).map(([l, t]) => [l, t.f]));
const FIELDS = (hass, lang) => ({
  entity: { selector: { entity: { domain: "weather", integration: "meteoswiss4ha" } } },
  name: { selector: { text: {} } },
  hours: { selector: { number: { min: 3, max: 24, mode: "box" } } },
  days: { selector: { number: { min: 1, max: 5, mode: "box" } } },
  animate: { selector: { boolean: {} } },
  show_seconds: { selector: { boolean: {} } },
  night_mode: { selector: { select: { mode: "dropdown", options: ["auto", "on", "off"].map((v) => ({ value: v, label: T[lang].night[v] })) } } },
  language: { selector: { select: { mode: "dropdown", options: LANGS } } },
});

const SNOW = [8, 11, 16, 19, 22, 30, 34, 37, 39, 42];
const MIXED = [7, 10, 15, 18, 21, 31];
const THUNDER = [12, 13, 23, 24, 25, 36, 38, 40, 41];
const CLOUD_COVER = { 1: 0, 2: 0.2, 3: 0.45, 4: 0.6, 5: 0.92, 26: 0.3, 27: 0.85, 28: 0.95, 35: 0.85 };
const coverOf = (code) => { const d = dayCode(code); return d == null ? 0.4 : CLOUD_COVER[d] ?? 0.9; };

const sunTimes = (hass) => {
  const sun = hass?.states?.["sun.sun"]?.attributes;
  if (!sun) return null;
  // "next" times: keep their time of day, on today's date.
  const today = (iso) => { const d = new Date(iso), t = new Date(); t.setHours(d.getHours(), d.getMinutes(), 0, 0); return t; };
  return { rise: today(sun.next_rising), set: today(sun.next_setting) };
};

const CARD_DARK = `
:host { display: block; }
ha-card { overflow: hidden; color: #fff; background: linear-gradient(180deg, #0d1520 0%, #1b222b 60%, #262a30 100%); border: 0; border-radius: var(--ha-card-border-radius, 18px); }
.empty { padding: 16px; color: #aaa; }
ha-icon { --mdc-icon-size: 22px; }
`;
const empty = (root, t) => { root.innerHTML = `<style>${CARD_DARK}</style><ha-card><div class="empty">${t.noEntity}</div></ha-card>`; };

// ================================================================ sky card

class MeteoSwissSkyCard extends ForecastCard {
  setConfig(config) { this._config = { animate: true, ...config }; this._render(); }
  _types() { return ["daily"]; }
  connectedCallback() {
    super.connectedCallback();
    this._io = new IntersectionObserver((e) => { this._visible = e.some((x) => x.isIntersecting); this._loop(); });
    this._io.observe(this);
  }
  disconnectedCallback() { super.disconnectedCallback(); this._io?.disconnect(); cancelAnimationFrame(this._raf); this._raf = null; }

  _render() {
    if (!this._config || !this._hass) return;
    const root = this._root();
    const t = T[langOf(this._hass, this._config)];
    const st = this._state;
    if (!st) return empty(root, t);
    const a = st.attributes;
    const today = (this._daily || [])[0];
    const cond = this._hass.formatEntityState ? this._hass.formatEntityState(st) : st.state;
    const loc = locOf(this._hass, this._config);
    const times = sunTimes(this._hass);
    const bg = !!this._config.background;
    if (!root.querySelector("canvas") || this._bg !== bg) {
      this._bg = bg;
      root.innerHTML = `<style>${CARD_DARK}
        ha-card { background: #0d1520; cursor: pointer; }
        .sky { position: relative; height: 230px; }
        canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
        ${bg ? `ha-card { background: transparent; box-shadow: none; border: 0; cursor: default; }
        .sky { position: static; height: 0; } .o { display: none; }
        canvas { position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; }` : ""}
        .o { position: relative; padding: 18px 20px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; text-shadow: 0 1px 6px rgba(0,0,0,.55); }
        .place { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .place svg.monument { width: 30px; height: 30px; flex: 0 0 30px; }
        .temp { font-size: 64px; font-weight: 300; line-height: 1; margin-top: 8px; }
        .cond { font-size: 18px; margin-top: 4px; }
        .foot { margin-top: auto; display: flex; gap: 14px; font-size: 14px; opacity: .92; flex-wrap: wrap; }
        .foot span { display: inline-flex; align-items: center; gap: 4px; }
        .foot ha-icon { --mdc-icon-size: 18px; }
      </style><ha-card><div class="sky"><canvas></canvas><div class="o"></div></div><div class="ast"></div></ha-card>`;
      root.querySelector("ha-card").addEventListener("click", () =>
        this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: this._entity } })));
    }
    const ast = root.querySelector(".ast");
    if (ast) ast.innerHTML = bg ? "" : astroFor(this, this._config, this._hass, langOf(this._hass, this._config), loc, "#fff");
    root.querySelector(".o").innerHTML = `
      <div class="place">${this._config.monument === false ? "" : monument(a.location || this._config.name)}${esc(this._config.name || a.location || a.friendly_name)}</div>
      <div class="temp">${a.temperature != null ? Math.round(a.temperature) + "°" : ""}</div>
      <div class="cond">${esc(cond)}</div>
      <div class="foot">${today ? `<span>↑ ${num(today.temperature, loc)}°</span><span>↓ ${num(today.templow, loc)}°</span>` : ""}
        ${times ? `<span><ha-icon icon="mdi:weather-sunset-up"></ha-icon>${hhmm(times.rise, loc)}</span><span><ha-icon icon="mdi:weather-sunset-down"></ha-icon>${hhmm(times.set, loc)}</span>` : ""}
        ${a.precipitation_probability != null ? `<span><ha-icon icon="mdi:umbrella-outline"></ha-icon>${Math.round(a.precipitation_probability)} %</span>` : ""}</div>`;
    this._scene = this._sceneFrom(a);
    this._loop(true);
  }

  _sceneFrom(a) {
    const code = a.meteoswiss_symbol;
    const d = dayCode(code);
    const sensors = relatedSensors(this._hass, this._entity);
    const fogState = sensors.fog?.state;
    const sun = this._hass.states["sun.sun"]?.attributes;
    const elev = sun?.elevation ?? sunElevation(this._hass.config?.latitude ?? 46.9, this._hass.config?.longitude ?? 7.4);
    const times = sunTimes(this._hass);
    let frac = 0.5;
    if (times) frac = (Date.now() - times.rise) / (times.set - times.rise);
    return {
      elev, frac, cover: coverOf(code),
      rain: d != null && isWetCode(code) && !SNOW.includes(d) ? (d === 20 ? 1 : 0.6) : 0,
      snow: d != null && (SNOW.includes(d) || MIXED.includes(d)) ? 0.7 : 0,
      thunder: d != null && THUNDER.includes(d),
      fog: d === 28 || d === 27 || fogState === "fog" || fogState === "stratus" ? (d === 28 || fogState === "fog" ? 1 : 0.6) : 0,
      wind: (a.wind_speed || 0) / 40,
    };
  }

  _loop(force) {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const animate = this._config?.animate !== false && !reduce;
    if (!animate || !this._visible) { cancelAnimationFrame(this._raf); this._raf = null; if (force || !animate) this._draw(0); return; }
    if (this._raf) return;
    const step = (ts) => { this._draw(ts / 1000); this._raf = requestAnimationFrame(step); };
    this._raf = requestAnimationFrame(step);
  }

  _draw(time) {
    const canvas = this.shadowRoot?.querySelector("canvas");
    const s = this._scene;
    if (!canvas || !s) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = canvas.clientWidth || 400, H = canvas.clientHeight || 230;
    if (canvas.width !== Math.round(W * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    const c = canvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Sky gradient: night, twilight, day; washed out by the clouds.
    const e = s.elev, grey = s.cover * 0.85;
    const mix = (x, y, f) => x.map((v, i) => Math.round(v + (y[i] - v) * f));
    const day = [[58, 128, 210], [150, 200, 240]], night = [[8, 14, 34], [26, 38, 70]], dusk = [[50, 60, 120], [245, 150, 90]];
    let top, bottom;
    if (e <= -8) [top, bottom] = night;
    else if (e < 0) { const f = (e + 8) / 8; top = mix(night[0], dusk[0], f); bottom = mix(night[1], dusk[1], f); }
    else if (e < 10) { const f = e / 10; top = mix(dusk[0], day[0], f); bottom = mix(dusk[1], day[1], f); }
    else [top, bottom] = day;
    const greyTop = e > 0 ? [120, 130, 140] : [30, 34, 40], greyBottom = e > 0 ? [170, 175, 180] : [45, 48, 54];
    top = mix(top, greyTop, grey); bottom = mix(bottom, greyBottom, grey);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgb(${top})`); g.addColorStop(1, `rgb(${bottom})`);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Stars.
    if (e < -4 && s.cover < 0.6) {
      for (let i = 0; i < 70; i++) {
        const x = (i * 97.13) % W, y = (i * 53.71) % (H * 0.7);
        const tw = 0.5 + 0.5 * Math.sin(time * 2 + i);
        c.fillStyle = `rgba(255,255,255,${(0.25 + 0.5 * tw) * (1 - s.cover)})`;
        c.fillRect(x, y, 1.6, 1.6);
      }
    }
    // Sun (by day) on its arc, moon at night.
    const fx = Math.max(0.05, Math.min(0.95, s.frac));
    const sx = W * (0.15 + 0.7 * fx), sy = H * (0.85 - 0.6 * Math.sin(Math.PI * fx));
    if (e > -2) {
      const r = 26, glow = c.createRadialGradient(sx, sy, 4, sx, sy, r * 3.5);
      const alpha = 1 - s.cover * 0.8;
      glow.addColorStop(0, `rgba(255,236,170,${0.95 * alpha})`); glow.addColorStop(0.3, `rgba(255,210,120,${0.35 * alpha})`); glow.addColorStop(1, "rgba(255,200,100,0)");
      c.fillStyle = glow; c.beginPath(); c.arc(sx, sy, r * 3.5, 0, 7); c.fill();
      c.fillStyle = `rgba(255,244,214,${alpha})`; c.beginPath(); c.arc(sx, sy, r * 0.75, 0, 7); c.fill();
    } else {
      const mi = moonInfo(new Date()), phase = mi.waxing ? mi.illumination / 2 : 1 - mi.illumination / 2; // 0 new, .5 full
      const mx = W * 0.78, my = H * 0.25, r = 16;
      c.fillStyle = `rgba(245,243,230,${1 - s.cover * 0.7})`;
      c.beginPath(); c.arc(mx, my, r, 0, 7); c.fill();
      // Shadow disc: covers the moon at new moon, moves away towards full moon.
      const off = r * 4 * (0.5 - Math.abs(phase - 0.5));
      if (off < 2 * r) { c.fillStyle = `rgb(${top})`; c.beginPath(); c.arc(mx + (phase < 0.5 ? -off : off), my, r + 0.5, 0, 7); c.fill(); }
    }
    // Clouds drifting with the wind.
    const n = Math.round(s.cover * 9);
    for (let i = 0; i < n; i++) {
      const speed = 6 + s.wind * 30 + (i % 3) * 3;
      const w = 110 + (i * 37) % 90, x = ((i * 173 + time * speed) % (W + w * 2)) - w, y = 18 + ((i * 61) % Math.max(40, H * 0.55));
      const shade = e > 0 ? 255 - s.cover * 90 - (i % 3) * 12 : 70 - (i % 3) * 8;
      c.fillStyle = `rgba(${shade},${shade},${shade + 4},${0.55 + s.cover * 0.35})`;
      c.beginPath();
      c.ellipse(x, y, w * 0.5, 16, 0, 0, 7); c.ellipse(x - w * 0.22, y + 6, w * 0.3, 14, 0, 0, 7); c.ellipse(x + w * 0.2, y - 8, w * 0.28, 17, 0, 0, 7);
      c.fill();
    }
    // Rain or snow.
    const drops = Math.round((s.rain + s.snow) * 120);
    for (let i = 0; i < drops; i++) {
      const snow = s.snow && (i % 3 !== 0 || !s.rain);
      const sp = snow ? 30 : 260;
      const x = ((i * 89.7) + (snow ? Math.sin(time + i) * 12 : 0) + time * s.wind * 40) % W;
      const y = ((i * 41.3) + time * sp) % (H + 20) - 10;
      if (snow) { c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill(); }
      else { c.strokeStyle = "rgba(200,220,255,.55)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2 - s.wind * 4, y + 10); c.stroke(); }
    }
    // Lightning flash every few seconds.
    if (s.thunder && Math.sin(time * 1.7) > 0.985) { c.fillStyle = "rgba(255,255,240,.35)"; c.fillRect(0, 0, W, H); }
    // Fog banks.
    if (s.fog) {
      for (let i = 0; i < 4; i++) {
        const y = H * (0.55 + i * 0.12), off = Math.sin(time * 0.2 + i) * 30;
        const fg = c.createLinearGradient(0, y - 30, 0, y + 40);
        fg.addColorStop(0, "rgba(220,224,228,0)"); fg.addColorStop(0.5, `rgba(220,224,228,${0.35 * s.fog})`); fg.addColorStop(1, "rgba(220,224,228,0)");
        c.fillStyle = fg; c.fillRect(-40 + off, y - 30, W + 80, 70);
      }
    }
    // Darken a little behind the text.
    const shade = c.createLinearGradient(0, 0, W, 0);
    shade.addColorStop(0, "rgba(0,0,0,.28)"); shade.addColorStop(0.6, "rgba(0,0,0,0)");
    c.fillStyle = shade; c.fillRect(0, 0, W, H);
  }

  getCardSize() { return 4; }
  static getStubConfig(hass) { return { entity: findWeather(hass) }; }
  static getConfigElement() {
    return sectionEditor({ defaults: { animate: true, background: false }, labels: LABELS, astro: true, doc: { fr: "#panneaux-du-quotidien", en: "#3d-everyday-panels" },
      top: () => [F.weather, F.text("name")],
      sections: [{ key: "display", icon: "mdi:weather-partly-snowy-rainy", title: ST("Himmel", "Ciel", "Cielo", "Tschiel", "Sky"), keys: ["animate", "background"],
        fields: () => [F.bool("animate"), F.bool("background")],
        summary: (c, { lang, w }) => [c.animate ? T[lang].f.animate : w.off, c.background ? T[lang].f.background : ""].filter(Boolean).join(" · ") }] });
  }
}

// ============================================================= outing card

// Advice for the next hours from the hourly forecast, warnings, pollen and fog.
export function outingAdvice(t, hours, sensors, temp, loc) {
  const lines = [];
  const next = hours.slice(0, 12);
  // Radar: rain arriving in the next hour.
  const rain = sensors.rain_arrival?.attributes;
  const rainSoon = rain?.state === "approaching" && rain.minutes != null;
  if (rainSoon) lines.push(["mdi:weather-pouring", fmt(t.rainIn, { m: rain.minutes })]);
  const wet = (h) => (h.precipitation_probability ?? 0) >= 50 || (h.precipitation ?? 0) >= 0.3;
  const firstWet = next.findIndex(wet);
  let verdict = "yes";
  if (firstWet === 0) {
    lines.push(["mdi:weather-pouring", fmt(t.rainNow, { mm: num(next[0].precipitation, loc, 1) })]);
    verdict = (next[0].precipitation ?? 0) >= 2 ? "later" : "umbrella";
  } else if (firstWet > 0) {
    lines.push(["mdi:umbrella-outline", fmt(t.rainFrom, { t: hh(next[firstWet].datetime, loc), p: Math.round(next[firstWet].precipitation_probability ?? 0) })]);
    lines.push(["mdi:weather-cloudy-clock", fmt(t.dryUntil, { t: hh(next[firstWet].datetime, loc) })]);
    if (firstWet < 3) verdict = "umbrella";
  } else if (next.length && !rainSoon) lines.push(["mdi:weather-partly-cloudy", t.dryAll]);
  if (rainSoon && rain.minutes <= 30 && verdict === "yes") verdict = "umbrella";
  // Clothes from the temperature now (wind chill when windy).
  if (temp != null) {
    const wind = next[0]?.wind_speed ?? 0;
    const feel = wind > 10 && temp < 12 ? temp - wind / 8 : temp;
    const idx = feel < 0 ? 0 : feel < 8 ? 1 : feel < 15 ? 2 : feel < 21 ? 3 : feel < 30 ? 4 : 5;
    lines.push(["mdi:tshirt-crew-outline", t.clothes[idx]]);
    if (temp <= 1 && next.slice(0, 6).some(wet)) lines.push(["mdi:snowflake-melt", t.ice]);
  }
  const gust = Math.max(0, ...next.slice(0, 6).map((h) => h.wind_gust_speed ?? 0));
  if (gust >= 50) { lines.push(["mdi:weather-windy", fmt(t.gusts, { v: Math.round(gust) })]); if (gust >= 75) verdict = "no"; }
  for (const kind of WARNING_KINDS) {
    const st = sensors[`${kind}_warning`];
    const lvl = st?.attributes?.level;
    if (lvl >= 2) {
      lines.unshift([WARN_ICONS[kind], fmt(t.warning, { kind: t.kinds[kind], n: lvl })]);
      if (lvl >= 3) verdict = "no";
    }
  }
  const pollen = sensors.pollen_level?.attributes?.level_index;
  if (pollen >= 2) lines.push(["mdi:flower-pollen", fmt(t.pollen, { level: t.levels[pollen - 1] || "" })]);
  const fog = sensors.fog;
  if (fog && (fog.state === "fog" || fog.state === "stratus")) {
    const top = sensors.fog_top?.state;
    lines.push(["mdi:weather-fog", top && !isNaN(top) ? fmt(t.fog, { m: Math.round(top) }) : t.fogNo]);
    // Escape the fog: a summit in the sun nearby, now or later today.
    const esc_ = fog.attributes.escape, later = fog.attributes.escape_forecast;
    if (esc_) lines.push(["mdi:image-filter-hdr", fmt(t.escape, { name: esc_.name, alt: Math.round(esc_.altitude), km: esc_.distance_km })]);
    else if (later) lines.push(["mdi:image-filter-hdr", fmt(t.escapeFrom, { t: hh(later.time, loc), name: later.name, alt: Math.round(later.altitude) })]);
  }
  if (next.slice(0, 6).filter((h) => isSunnyCode(h.meteoswiss_symbol) && !(dayCode(h.meteoswiss_symbol) > 100)).length >= 4) lines.push(["mdi:sunglasses", t.sun]);
  // Best 2-hour window in the next 12 hours (driest, then warmest).
  let best = null;
  for (let i = 0; i + 1 < next.length; i++) {
    const pair = [next[i], next[i + 1]];
    const score = pair.reduce((s, h) => s - (h.precipitation_probability ?? 0) * 2 - (h.precipitation ?? 0) * 40 - (h.wind_gust_speed ?? 0) * 0.3 + (h.temperature ?? 0), 0)
      + pair.filter((h) => isSunnyCode(h.meteoswiss_symbol)).length * 8;
    if (!best || score > best.score) best = { score, i };
  }
  if (best && verdict !== "yes") {
    const a = new Date(next[best.i].datetime), b = new Date(new Date(next[best.i + 1].datetime).getTime() + 36e5);
    lines.push(["mdi:clock-check-outline", fmt(t.best, { a: hh(a, loc), b: hh(b, loc) })]);
  }
  return { verdict, lines };
}

class MeteoSwissOutingCard extends ForecastCard {
  setConfig(config) { this._config = { hours: 12, ...config }; this._render(); }
  _render() {
    if (!this._config || !this._hass) return;
    const root = this._root();
    const lang = langOf(this._hass, this._config), t = T[lang], loc = locOf(this._hass, this._config);
    const st = this._state;
    if (!st) return empty(root, t);
    const sensors = relatedSensors(this._hass, this._entity);
    this._watch = Object.values(sensors).map((s) => s.entity_id);
    const hours = (this._hourly || []).filter((h) => new Date(h.datetime).getTime() > Date.now() - 36e5).slice(0, Number(this._config.hours) || 12);
    const { verdict, lines } = outingAdvice(t, hours, sensors, st.attributes.temperature, loc);
    const COLORS = { yes: "#2e9e5b", umbrella: "#2f7fd1", later: "#e08a1e", no: "#d23c3c" };
    const ICONS = { yes: "mdi:walk", umbrella: "mdi:umbrella", later: "mdi:clock-outline", no: "mdi:home" };
    const times = sunTimes(this._hass);
    if (times && times.set > Date.now()) lines.push(["mdi:weather-sunset-down", fmt(t.sunset, { t: hhmm(times.set, loc) })]);
    // Rain bar for the next hours.
    const bar = hours.map((h) => {
      const p = h.precipitation_probability ?? 0, mm = h.precipitation ?? 0;
      return `<div class="h"><div class="b" style="height:${Math.max(3, p * 0.36)}px;background:${mm >= 1 ? "#1d5cff" : mm >= 0.1 ? "#6ea4ff" : "rgba(255,255,255,.25)"}"></div><span>${new Date(h.datetime).getHours()}</span></div>`;
    }).join("");
    root.innerHTML = `<style>${CARD_DARK}
      .top { display: flex; align-items: center; gap: 14px; padding: 16px 18px 8px; }
      .badge { width: 58px; height: 58px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${COLORS[verdict]}; flex: 0 0 58px; box-shadow: 0 4px 14px rgba(0,0,0,.35); }
      .badge ha-icon { --mdc-icon-size: 34px; }
      .q { font-size: 14px; opacity: .75; }
      .v { font-size: 24px; font-weight: 700; }
      ul { list-style: none; margin: 4px 0 0; padding: 0 18px 10px; }
      li { display: flex; gap: 10px; align-items: center; padding: 6px 0; border-top: 1px solid rgba(255,255,255,.08); font-size: 15px; }
      li ha-icon { opacity: .85; --mdc-icon-size: 20px; flex: 0 0 20px; }
      .bar { display: flex; gap: 2px; align-items: flex-end; padding: 6px 18px 14px; height: 52px; }
      .h { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 2px; }
      .h .b { width: 100%; border-radius: 3px 3px 0 0; }
      .h span { font-size: 10px; opacity: .6; }
    </style><ha-card><div class="top"><div class="badge"><ha-icon icon="${ICONS[verdict]}"></ha-icon></div>
      <div><div class="q">${esc(this._config.name || t.outing)}</div><div class="v">${t[verdict]}</div></div></div>
      <ul>${lines.map(([i, s]) => `<li><ha-icon icon="${i}"></ha-icon><span>${esc(s)}</span></li>`).join("")}</ul>
      ${hours.length ? `<div class="bar">${bar}</div>` : ""}</ha-card>`;
  }
  getCardSize() { return 5; }
  static getStubConfig(hass) { return { entity: findWeather(hass) }; }
  static getConfigElement() {
    return sectionEditor({ defaults: { hours: 12 }, labels: LABELS, doc: { fr: "#panneaux-du-quotidien", en: "#3d-everyday-panels" },
      top: () => [F.weather, F.text("name")],
      sections: [{ key: "hours", icon: "mdi:clock-outline", title: ST("Zeitraum", "Période", "Periodo", "Perioda", "Period"), keys: ["hours"],
        fields: () => [F.num("hours", 3, 24)], summary: (c, { lang }) => `${c.hours} h` }] });
  }
}

// ================================================================ day card

class MeteoSwissDayCard extends ForecastCard {
  // After 18:00 the day is nearly over: show tomorrow first.
  setConfig(config) { this._config = { ...config }; this._day = new Date().getHours() >= 18 ? 1 : 0; this._render(); }
  _render() {
    if (!this._config || !this._hass) return;
    const root = this._root();
    const lang = langOf(this._hass, this._config), t = T[lang], loc = locOf(this._hass, this._config);
    const st = this._state;
    if (!st) return empty(root, t);
    const icons = st.attributes.icons_url;
    const base = new Date(); base.setHours(0, 0, 0, 0);
    const start = base.getTime() + this._day * 864e5;
    const hours = (this._hourly || []).map((h) => ({ ...h, ms: new Date(h.datetime).getTime() })).filter((h) => h.ms >= start && h.ms < start + 864e5);
    // Four parts of the day: night 0-6, morning 6-12, afternoon 12-18, evening 18-24.
    const parts = [0, 6, 12, 18].map((from, i) => {
      const hs = hours.filter((h) => new Date(h.ms).getHours() >= from && new Date(h.ms).getHours() < from + 6);
      if (!hs.length) return null;
      const temps = hs.map((h) => h.temperature).filter((v) => v != null);
      // Most significant symbol: wettest, else the most frequent.
      const codes = hs.map((h) => h.meteoswiss_symbol).filter((c) => c != null);
      const wet = codes.filter(isWetCode);
      const pick = (list) => list.sort((x, y) => list.filter((v) => v === y).length - list.filter((v) => v === x).length)[0];
      return {
        name: t.parts[i], code: wet.length >= 2 ? pick(wet) : pick(codes),
        min: Math.min(...temps), max: Math.max(...temps),
        prob: Math.max(0, ...hs.map((h) => h.precipitation_probability ?? 0)),
        mm: hs.reduce((s, h) => s + (h.precipitation ?? 0), 0),
        wind: Math.max(0, ...hs.map((h) => h.wind_gust_speed ?? h.wind_speed ?? 0)),
      };
    });
    // Timeline: temperature curve over 24 h, sunrise/sunset, now.
    const W = 600, H = 70;
    const temps = hours.map((h) => h.temperature).filter((v) => v != null);
    const lo = Math.min(...temps, 0), hi = Math.max(...temps, lo + 6);
    const x = (ms) => ((ms - start) / 864e5) * W, y = (v) => H - 8 - ((v - lo) / (hi - lo)) * (H - 22);
    const times = sunTimes(this._hass);
    let night = "";
    if (times) {
      const rise = new Date(times.rise.getTime() + this._day * 864e5), set = new Date(times.set.getTime() + this._day * 864e5);
      night = `<rect x="0" y="0" width="${x(rise)}" height="${H}" fill="rgba(0,0,30,.35)"/><rect x="${x(set)}" y="0" width="${W - x(set)}" height="${H}" fill="rgba(0,0,30,.35)"/>
        <text x="${x(rise) + 4}" y="12" font-size="11" fill="#ffd27a">☀ ${hhmm(rise, loc)}</text><text x="${x(set) - 4}" y="12" font-size="11" fill="#ffb37a" text-anchor="end">${hhmm(set, loc)} ☾</text>`;
    }
    const path = hours.filter((h) => h.temperature != null).map((h, i) => `${i ? "L" : "M"}${x(h.ms).toFixed(1)},${y(h.temperature).toFixed(1)}`).join("");
    const rain = hours.map((h) => (h.precipitation ?? 0) >= 0.1 ? `<rect x="${x(h.ms) - 9}" y="${H - Math.min(30, 4 + h.precipitation * 8)}" width="11" height="${Math.min(30, 4 + h.precipitation * 8)}" fill="#3d7bff" opacity=".7"/>` : "").join("");
    const nowX = this._day === 0 ? x(Date.now()) : null;
    const dayName = this._day === 0 ? t.today : this._day === 1 ? t.tomorrow : weekday(start, loc);
    root.innerHTML = `<style>${CARD_DARK}
      .head { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px 6px; }
      .title { font-size: 20px; font-weight: 700; }
      .tabs { display: flex; gap: 6px; }
      .tabs button { background: rgba(255,255,255,.1); color: #fff; border: 0; border-radius: 14px; padding: 5px 12px; font: inherit; font-size: 13px; cursor: pointer; }
      .tabs button.on { background: #fff; color: #111; }
      .parts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 4px 12px; }
      .p { background: rgba(255,255,255,.06); border-radius: 14px; padding: 8px 4px; text-align: center; }
      .p.empty { opacity: .3; }
      .p .n { font-size: 13px; opacity: .8; }
      .p img { width: 52px; height: 52px; }
      .p .t { font-size: 17px; font-weight: 600; }
      .p .r { font-size: 12px; opacity: .8; margin-top: 2px; }
      svg { display: block; width: 100%; height: 70px; margin: 8px 0 12px; }
      svg text { fill: #fff; font-family: inherit; }
    </style><ha-card><div class="head"><div class="title">${esc(this._config.name || t.myDay)} · ${esc(dayName)}</div>
      <div class="tabs"><button data-d="0" class="${this._day === 0 ? "on" : ""}">${t.today}</button><button data-d="1" class="${this._day === 1 ? "on" : ""}">${t.tomorrow}</button></div></div>
      <div class="parts">${parts.map((p, i) => p ? `<div class="p"><div class="n">${p.name}</div>
        ${icons && p.code != null ? `<img src="${icons}/${p.code}.svg" alt="">` : ""}
        <div class="t">${Math.round(p.min)}°${p.max !== p.min ? ` / ${Math.round(p.max)}°` : ""}</div>
        <div class="r">${p.prob ? `☂ ${Math.round(p.prob)} %` : "&nbsp;"}${p.mm >= 0.1 ? ` · ${num(p.mm, loc, 1)} mm` : ""}</div></div>` : `<div class="p empty"><div class="n">${t.parts[i]}</div></div>`).join("")}</div>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${night}${rain}
        ${[6, 12, 18].map((hr) => `<line x1="${(hr / 24) * W}" x2="${(hr / 24) * W}" y1="0" y2="${H}" stroke="rgba(255,255,255,.18)"/>`).join("")}
        <path d="${path}" fill="none" stroke="#ff5a4a" stroke-width="3" vector-effect="non-scaling-stroke"/>
        ${nowX != null ? `<line x1="${nowX}" x2="${nowX}" y1="0" y2="${H}" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/>` : ""}</svg>${astroFor(this, this._config, this._hass, lang, loc, "#fff")}</ha-card>`;
    root.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => { this._day = Number(b.dataset.d); this._render(); }));
  }
  getCardSize() { return 4; }
  static getStubConfig(hass) { return { entity: findWeather(hass) }; }
  static getConfigElement() {
    return sectionEditor({ labels: LABELS, astro: true, doc: { fr: "#panneaux-du-quotidien", en: "#3d-everyday-panels" }, top: () => [F.weather, F.text("name")], sections: [] });
  }
}

// ============================================================ compare card

class MeteoSwissCompareCard extends HTMLElement {
  setConfig(config) { this._config = { days: 3, ...config }; this._render(); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) this._load(); }
  connectedCallback() { this._timer = setInterval(() => this._load(), 15 * 60000); }
  disconnectedCallback() { clearInterval(this._timer); }
  async _load() {
    if (!this._hass) return;
    try { this._data = await api(this._hass, "places"); } catch (e) { this._data = { places: [] }; }
    this._render();
  }
  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const lang = langOf(this._hass, this._config), t = T[lang], loc = locOf(this._hass, this._config);
    const places = this._data?.places || [];
    const icons = this._data?.icons_url;
    const nDays = Math.max(1, Math.min(5, Number(this._config.days) || 3));
    // Best today: least rain, then warmest.
    const score = (p) => { const d = p.days?.[0]; return d ? -(d.precip ?? 0) * 3 + (d.tmax ?? 0) - (isWetCode(d.symbol) ? 5 : 0) - Math.max(0, ...Object.values(p.warnings || {})) * 4 : -1e9; };
    const best = places.length > 1 ? places.reduce((a, b) => (score(b) > score(a) ? b : a)) : null;
    const head = (places[0]?.days || []).slice(0, nDays).map((d, i) => `<th>${i === 0 ? t.today : weekday(d.date, loc, "short")}</th>`).join("");
    const rows = places.map((p) => {
      const warn = Object.entries(p.warnings || {}).filter(([, l]) => l >= 2).map(([k, l]) => `<span class="w" style="background:${DANGER[l]}"><ha-icon icon="${WARN_ICONS[k]}"></ha-icon></span>`).join("");
      const name = p.key === "home" ? `${esc(p.name)}` : esc(p.name.replace(/ \(\d+\)$/, ""));
      return `<tr class="${p === best ? "best" : ""}"><td class="name"><div>${monument(p.name.replace(/ \(\d+\)$/, ""))}<span>${name}</span>${p.person ? `<ha-icon icon="mdi:account"></ha-icon>` : ""}</div>
        ${p === best ? `<small>★ ${t.bestToday}</small>` : ""}${warn ? `<div class="ws">${warn}</div>` : ""}</td>
        ${p.days.slice(0, nDays).map((d) => `<td>${icons && d.symbol != null ? `<img src="${icons}/${d.symbol}.svg" alt="">` : ""}<div class="mm"><b>${num(d.tmax, loc)}°</b> ${num(d.tmin, loc)}°</div>${d.precip >= 0.1 ? `<div class="r">${num(d.precip, loc, 1)} mm</div>` : `<div class="r">&nbsp;</div>`}</td>`).join("")}</tr>`;
    }).join("");
    this.shadowRoot.innerHTML = `<style>${CARD_DARK}
      .title { font-size: 20px; font-weight: 700; padding: 14px 18px 4px; }
      table { width: 100%; border-collapse: collapse; }
      th { font-weight: 500; font-size: 13px; opacity: .7; padding: 4px; }
      td { text-align: center; padding: 6px 4px; border-top: 1px solid rgba(255,255,255,.08); vertical-align: middle; }
      td.name { text-align: left; padding-left: 16px; }
      td.name div { display: flex; align-items: center; gap: 6px; font-weight: 600; }
      td.name svg.monument { width: 24px; height: 24px; flex: 0 0 24px; }
      td.name ha-icon { --mdc-icon-size: 16px; opacity: .7; }
      td.name small { color: #ffd54a; font-size: 12px; }
      tr.best td { background: rgba(255,213,74,.08); }
      td img { width: 40px; height: 40px; }
      .mm { font-size: 14px; white-space: nowrap; }
      .mm b { font-size: 15px; }
      .r { font-size: 12px; color: #8fb6ff; }
      .ws { display: flex; gap: 3px; margin-top: 3px; }
      .w { width: 20px; height: 20px; border-radius: 4px; display: inline-flex; align-items: center; justify-content: center; color: #222; }
      .w ha-icon { --mdc-icon-size: 15px; opacity: 1; }
      .hint { padding: 6px 18px 14px; font-size: 13px; opacity: .7; }
    </style><ha-card><div class="title">${esc(this._config.name || t.compare)}</div>
      <table><tr><th></th>${head}</tr>${rows}</table>
      ${places.length < 2 ? `<div class="hint">${t.noPlaces}</div>` : `<div style="height:8px"></div>`}</ha-card>`;
  }
  getCardSize() { return 4; }
  static getStubConfig() { return {}; }
  static getConfigElement() {
    return sectionEditor({ defaults: { days: 3 }, labels: LABELS, doc: { fr: "#panneaux-du-quotidien", en: "#3d-everyday-panels" }, top: () => [F.text("name")],
      sections: [{ key: "days", icon: "mdi:calendar-week", title: ST("Tage", "Jours", "Giorni", "Dis", "Days"), keys: ["days"],
        fields: () => [F.num("days", 1, 5)], summary: (c, { lang }) => `${c.days} ${String(T[lang].f.days).toLowerCase()}` }] });
  }
}

// =============================================================== wall card

class MeteoSwissWallCard extends ForecastCard {
  setConfig(config) { this._config = { night_mode: "auto", hours: 8, ...config }; this._render(); }
  _types() { return ["hourly", "daily"]; }
  connectedCallback() { super.connectedCallback(); this._clock = setInterval(() => this._tick(), 1000); }
  disconnectedCallback() { super.disconnectedCallback(); clearInterval(this._clock); }
  _tick() {
    const el = this.shadowRoot?.querySelector(".clock");
    if (!el) return;
    const loc = locOf(this._hass, this._config);
    const now = new Date();
    el.textContent = now.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", ...(this._config.show_seconds ? { second: "2-digit" } : {}), hourCycle: "h23" });
    const night = this._isNight();
    if (night !== this._night) this._render();
  }
  _isNight() {
    const mode = this._config?.night_mode || "auto";
    if (mode === "on") return true;
    if (mode === "off") return false;
    const sun = this._hass?.states?.["sun.sun"];
    if (sun) return sun.state === "below_horizon";
    return sunElevation(this._hass?.config?.latitude ?? 46.9, this._hass?.config?.longitude ?? 7.4) < -3;
  }
  _render() {
    if (!this._config || !this._hass) return;
    const root = this._root();
    const lang = langOf(this._hass, this._config), t = T[lang], loc = locOf(this._hass, this._config);
    const st = this._state;
    if (!st) return empty(root, t);
    const a = st.attributes;
    this._night = this._isNight();
    const night = this._night;
    const sensors = relatedSensors(this._hass, this._entity);
    this._watch = Object.values(sensors).map((s) => s.entity_id);
    const today = (this._daily || [])[0], tomorrow = (this._daily || [])[1];
    const hours = (this._hourly || []).filter((h) => new Date(h.datetime).getTime() > Date.now() - 36e5).slice(0, Number(this._config.hours) || 8);
    const warnings = WARNING_KINDS.map((k) => [k, sensors[`${k}_warning`]?.attributes?.level]).filter(([, l]) => l >= 2);
    const now = new Date();
    const fg = night ? "#b33a3a" : "#fff", dim = night ? "#7a2626" : "rgba(255,255,255,.7)";
    const img = (code, size) => (a.icons_url && code != null ? `<img src="${a.icons_url}/${code}.svg" style="width:${size}px;height:${size}px;${night ? "filter:grayscale(1) brightness(.45) sepia(1) hue-rotate(-50deg) saturate(4);" : ""}" alt="">` : "");
    root.innerHTML = `<style>${CARD_DARK}
      ha-card { background: ${night ? "#000" : "linear-gradient(180deg,#0d1520,#1b222b)"}; color: ${fg}; padding: 20px 24px; box-sizing: border-box; }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .clock { font-size: clamp(56px, 14vw, 120px); font-weight: 200; line-height: 1; letter-spacing: -2px; font-variant-numeric: tabular-nums; }
      .date { font-size: 22px; color: ${dim}; margin-top: 6px; }
      .now { display: flex; align-items: center; gap: 8px; }
      .now .t { font-size: clamp(44px, 10vw, 84px); font-weight: 300; }
      .days { display: flex; gap: 22px; margin-top: 14px; font-size: 18px; color: ${dim}; }
      .days b { color: ${fg}; font-weight: 600; }
      .hours { display: flex; justify-content: space-between; margin-top: 18px; border-top: 1px solid ${night ? "#2a0d0d" : "rgba(255,255,255,.15)"}; padding-top: 10px; }
      .h { display: flex; flex-direction: column; align-items: center; font-size: 15px; color: ${dim}; }
      .h b { display: block; color: ${fg}; font-size: 18px; font-weight: 500; }
      .warn { margin-top: 14px; display: flex; gap: 8px; flex-wrap: wrap; }
      .warn span { display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; padding: 4px 10px; color: #111; font-weight: 600; }
    </style><ha-card>
      <div class="row"><div><div class="clock"></div><div class="date">${esc(now.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" }))}</div></div>
        <div class="now">${img(a.meteoswiss_symbol, 110)}<div class="t">${a.temperature != null ? Math.round(a.temperature) + "°" : ""}</div></div></div>
      <div class="days">${today ? `<span>${t.today} <b>${num(today.templow, loc)}° / ${num(today.temperature, loc)}°</b></span>` : ""}
        ${tomorrow ? `<span>${t.tomorrow} ${img(tomorrow.meteoswiss_symbol, 28)} <b>${num(tomorrow.templow, loc)}° / ${num(tomorrow.temperature, loc)}°</b></span>` : ""}</div>
      ${warnings.length ? `<div class="warn">${warnings.map(([k, l]) => `<span style="background:${night ? "#5a1a1a" : DANGER[l]};${night ? "color:#d55" : ""}"><ha-icon icon="${WARN_ICONS[k]}"></ha-icon>${esc(t.kinds[k])} ${l}</span>`).join("")}</div>` : ""}
      ${hours.length ? `<div class="hours">${hours.map((h) => `<div class="h">${hh(h.datetime, loc)}${img(h.meteoswiss_symbol, 40)}<b>${num(h.temperature, loc)}°</b>${(h.precipitation_probability ?? 0) >= 30 ? `☂ ${Math.round(h.precipitation_probability)}%` : "&nbsp;"}</div>`).join("")}</div>` : ""}
      ${astroFor(this, this._config, this._hass, lang, loc, fg).replace("padding: 6px 16px 12px", "padding: 12px 0 0")}
    </ha-card>`;
    this._tick();
  }
  getCardSize() { return 6; }
  static getStubConfig(hass) { return { entity: findWeather(hass) }; }
  static getConfigElement() {
    return sectionEditor({ defaults: { night_mode: "auto", hours: 8, show_seconds: false }, labels: LABELS, astro: true, doc: { fr: "#panneaux-du-quotidien", en: "#3d-everyday-panels" },
      top: () => [F.weather],
      sections: [
        { key: "night", icon: "mdi:weather-night", title: ST("Nachtmodus", "Mode nuit", "Modalità notte", "Modus da notg", "Night mode"), keys: ["night_mode"],
          fields: ({ lang }) => [F.select("night_mode", ["auto", "on", "off"].map((v) => ({ value: v, label: T[lang].night[v] })))], summary: (c, { lang }) => T[lang].night[c.night_mode] },
        { key: "clock", icon: "mdi:clock-digital", title: ST("Uhr und Stunden", "Horloge et heures", "Orologio e ore", "Ura e uras", "Clock and hours"), keys: ["show_seconds", "hours"],
          fields: () => [F.bool("show_seconds"), F.num("hours", 3, 12)], summary: (c, { lang }) => `${c.hours} h${c.show_seconds ? ` · ${T[lang].f.show_seconds}` : ""}` },
      ] });
  }
}

define("meteoswiss-sky-card", MeteoSwissSkyCard, "MeteoSwiss live sky", "Animated sky (sun, moon, clouds, rain, snow, fog) behind the weather now.");
define("meteoswiss-outing-card", MeteoSwissOutingCard, "MeteoSwiss go out?", "Should I go out? Verdict, rain timing, clothes, wind, warnings, pollen, fog.");
define("meteoswiss-day-card", MeteoSwissDayCard, "MeteoSwiss my day", "Morning, afternoon, evening and night on a timeline with sunrise and sunset.");
define("meteoswiss-compare-card", MeteoSwissCompareCard, "MeteoSwiss compare places", "Home and watched places side by side, with the best place today.");
define("meteoswiss-wall-card", MeteoSwissWallCard, "MeteoSwiss wall screen", "Big clock and weather for a wall tablet, with a dark red night mode.");
