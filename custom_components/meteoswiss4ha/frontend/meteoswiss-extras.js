// MeteoSwiss Complete For HA - ephemeris, tips, postcard, guessing game and badge.
//
//   type: custom:meteoswiss-ephemeris-card   date, saint of the day, week, sun, day length, moon (picture, %, name, times, next phases)
//   type: custom:meteoswiss-tips-card        everyday tips as tiles: solar, laundry, frost, watering, stars, sunset, rainbow,
//                                              foehn, bise, airing, normal, yesterday, records, first frost / snow, rain arrival
//   type: custom:meteoswiss-postcard-card    a weather postcard (monument, weather, moon) to share or download
//   type: custom:meteoswiss-guess-card       guess today's maximum temperature, see the result in the evening
//   badge type: custom:meteoswiss-badge      pictogram and temperature (and rain arriving) in the dashboard header

import { monument } from "./meteoswiss-monuments.js";
import { DOMAIN, define, esc, findWeather, hhmm, langOf, locOf, num, relatedSensors } from "./meteoswiss-common.js";
import { PHASES, astroText, dayInfo, loadSaints, moon, moonSvg, moonTimes, saintOf, sunTimesFor } from "./meteoswiss-astro.js";
import { F, sectionEditor, sectionTitle as ST } from "./meteoswiss-editor.js";

const T = {
  de: { eph: "Ephemeride", tips: "Tipps des Tages", postcard: "Wetterkarte", share: "Teilen", download: "Herunterladen", guess: "Rate das Maximum", guessQ: "Wie warm wird es heute höchstens?",
        yourGuess: "Dein Tipp", measured: "Gemessen bis jetzt", result: "Ergebnis", diff: (d) => (Math.abs(d) < 0.5 ? "Volltreffer! 🎯" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} °C daneben`), save: "Tippen", streak: (n) => `${n} Tag(e) in Folge`, wait: "Ergebnis ab 18 Uhr", yesterday: "Gestern",
        moonOf: "Mond", sun: "Sonne", noTips: "Keine Tipps: Sensoren der Integration nicht gefunden.", rain: (m) => (m ? `Regen in ${m} Min.` : "Regen jetzt"),
        f: { entity: "Wetter-Entität", name: "Titel", items: "Angezeigte Tipps", show_rain: "Regen in … Minuten", place: "Ort" } },
  fr: { eph: "Éphéméride", tips: "Conseils du jour", postcard: "Carte postale météo", share: "Partager", download: "Télécharger", guess: "Devine le maximum", guessQ: "Quelle sera la température maximale aujourd’hui ?",
        yourGuess: "Ton pronostic", measured: "Mesuré jusqu’ici", result: "Résultat", diff: (d) => (Math.abs(d) < 0.5 ? "En plein dans le mille ! 🎯" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} °C d’écart`), save: "Valider", streak: (n) => `${n} jour(s) d’affilée`, wait: "Résultat dès 18 h", yesterday: "Hier",
        moonOf: "Lune", sun: "Soleil", noTips: "Pas de conseils : capteurs de l’intégration introuvables.", rain: (m) => (m ? `Pluie dans ${m} min` : "Il pleut"),
        f: { entity: "Entité météo", name: "Titre", items: "Conseils affichés", show_rain: "Pluie dans … minutes", place: "Lieu" } },
  it: { eph: "Effemeride", tips: "Consigli del giorno", postcard: "Cartolina meteo", share: "Condividi", download: "Scarica", guess: "Indovina la massima", guessQ: "Quale sarà la temperatura massima oggi?",
        yourGuess: "Il tuo pronostico", measured: "Misurata finora", result: "Risultato", diff: (d) => (Math.abs(d) < 0.5 ? "Centro pieno! 🎯" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} °C di scarto`), save: "Conferma", streak: (n) => `${n} giorno/i di fila`, wait: "Risultato dalle 18", yesterday: "Ieri",
        moonOf: "Luna", sun: "Sole", noTips: "Nessun consiglio: sensori dell’integrazione non trovati.", rain: (m) => (m ? `Pioggia tra ${m} min` : "Piove"),
        f: { entity: "Entità meteo", name: "Titolo", items: "Consigli mostrati", show_rain: "Pioggia tra … minuti", place: "Luogo" } },
  rm: { eph: "Efemerida", tips: "Cussegls dal di", postcard: "Carta postala d’aura", share: "Cundivider", download: "Telechargiar", guess: "Endevina il maximum", guessQ: "Tge chaud vegn ei oz il pli?",
        yourGuess: "Tes pronostic", measured: "Mesirà fin ussa", result: "Resultat", diff: (d) => (Math.abs(d) < 0.5 ? "Exact! 🎯" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} °C differenza`), save: "Confermar", streak: (n) => `${n} di(s) in suandanza`, wait: "Resultat a partir da las 18", yesterday: "Ier",
        moonOf: "Glina", sun: "Sulegl", noTips: "Nagins cussegls: sensors da l’integraziun betg chattads.", rain: (m) => (m ? `Plievgia en ${m} min` : "I plova"),
        f: { entity: "Entitad d’aura", name: "Titel", items: "Cussegls mussads", show_rain: "Plievgia en … minutas", place: "Lieu" } },
  en: { eph: "Ephemeris", tips: "Tips of the day", postcard: "Weather postcard", share: "Share", download: "Download", guess: "Guess the maximum", guessQ: "How warm will it get today?",
        yourGuess: "Your guess", measured: "Measured so far", result: "Result", diff: (d) => (Math.abs(d) < 0.5 ? "Bullseye! 🎯" : `${d > 0 ? "+" : "−"}${Math.abs(d).toFixed(1)} °C off`), save: "Guess", streak: (n) => `${n} day(s) in a row`, wait: "Result from 18:00", yesterday: "Yesterday",
        moonOf: "Moon", sun: "Sun", noTips: "No tips: the integration's sensors were not found.", rain: (m) => (m ? `Rain in ${m} min` : "Raining"),
        f: { entity: "Weather entity", name: "Title", items: "Tips shown", show_rain: "Rain in … minutes", place: "Place" } },
};
const LABELS = Object.fromEntries(Object.entries(T).map(([l, t]) => [l, t.f]));
const STYLE = `
:host { display: block; }
ha-card { overflow: hidden; color: #fff; background: linear-gradient(180deg, #0d1520 0%, #1b222b 60%, #262a30 100%); border: 0; }
.title { font-size: 20px; font-weight: 700; padding: 14px 18px 4px; display: flex; align-items: center; gap: 8px; }
.title svg.monument { width: 28px; height: 28px; }
.empty { padding: 16px; color: #aaa; }
`;
const shadow = (el) => el.shadowRoot || el.attachShadow({ mode: "open" });

// ============================================================ ephemeris

class MeteoSwissEphemerisCard extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) { loadSaints().then((s) => { this._saints = s; this._render(); }); this._render(); } }
  connectedCallback() { this._timer = setInterval(() => this._render(), 10 * 60000); }
  disconnectedCallback() { clearInterval(this._timer); }
  _render() {
    if (!this._config || !this._hass) return;
    const lang = langOf(this._hass, this._config), loc = locOf(this._hass, this._config), t = T[lang], a = astroText(lang);
    const lat = this._hass.config?.latitude ?? 46.95, lon = this._hass.config?.longitude ?? 7.44;
    const now = new Date();
    const s = sunTimesFor(now, lat, lon), y = sunTimesFor(new Date(now - 864e5), lat, lon);
    const m = moon(now), mt = moonTimes(now, lat, lon), di = dayInfo(now);
    const saint = saintOf(this._saints?.[lang], now);
    const len = s ? `${Math.floor(s.length)} h ${String(Math.round((s.length % 1) * 60)).padStart(2, "0")}` : "–";
    const diff = s && y ? Math.round((s.length - y.length) * 60) : null;
    const days = (d) => Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(now).setHours(0, 0, 0, 0)) / 864e5);
    shadow(this).innerHTML = `<style>${STYLE}
      .top { display: flex; justify-content: space-between; gap: 12px; padding: 16px 18px 6px; }
      .day { font-size: 64px; font-weight: 300; line-height: .9; }
      .date { font-size: 18px; text-transform: capitalize; }
      .saint { font-size: 17px; color: #ffd54a; margin-top: 4px; }
      .small { font-size: 13px; opacity: .75; margin-top: 4px; }
      .moonbox { text-align: center; }
      .moonbox b { display: block; font-size: 14px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px 14px 14px; }
      .cell { background: rgba(255,255,255,.07); border-radius: 12px; padding: 8px 12px; font-size: 14px; }
      .cell .k { font-size: 12px; opacity: .7; }
      .cell .v { font-size: 17px; font-weight: 600; }
    </style><ha-card>
      <div class="top"><div><div class="day">${now.getDate()}</div><div class="date">${esc(now.toLocaleDateString(loc, { weekday: "long" }))}<br>${esc(now.toLocaleDateString(loc, { month: "long", year: "numeric" }))}</div>
        ${saint ? `<div class="saint">✝ ${esc(saint)}</div>` : ""}<div class="small">${a.week} ${di.week} · ${a.dayN} ${di.dayOfYear}/${di.daysInYear}</div></div>
        <div class="moonbox">${moonSvg(m, 92)}<b>${PHASES[lang][m.index]}</b><span class="small">${Math.round(m.illumination * 100)} %</span></div></div>
      <div class="grid">
        <div class="cell"><div class="k">☀ ${a.rise} / ${a.set}</div><div class="v">${s ? `${hhmm(s.rise, loc)} – ${hhmm(s.set, loc)}` : "–"}</div></div>
        <div class="cell"><div class="k">${a.day}</div><div class="v">${len}</div>${diff != null ? `<div class="k">${a.vsYesterday(diff)}</div>` : ""}</div>
        <div class="cell"><div class="k">☾ ${a.moonrise} / ${a.moonset}</div><div class="v">${mt.rise ? hhmm(mt.rise, loc) : "–"} – ${mt.set ? hhmm(mt.set, loc) : "–"}</div></div>
        <div class="cell"><div class="k">${a.full} · ${a.new}</div><div class="v">${a.inDays(days(m.nextFull))}</div><div class="k">${a.new} ${a.inDays(days(m.nextNew))}</div></div>
      </div></ha-card>`;
  }
  getCardSize() { return 5; }
  static getStubConfig() { return {}; }
  static getConfigElement() { return sectionEditor({ labels: LABELS, doc: { fr: "#soleil-lune-et-éphéméride", en: "#sun-moon-and-ephemeris" }, sections: [] }); }
}

// ================================================================= tips

const TIP_KEYS = ["summary", "rain_arrival", "solar_today", "solar_tomorrow", "drying", "frost_tonight", "watering", "stargazing", "sunset_quality", "rainbow",
  "foehn", "bise", "airing", "temperature_anomaly", "yesterday", "year_max_temperature", "year_min_temperature", "year_max_gust", "first_frost", "first_snow", "moon_phase", "ephemeris"];
const TIP_ICONS = { summary: "mdi:text-short", rain_arrival: "mdi:weather-rainy", solar_today: "mdi:solar-power-variant", solar_tomorrow: "mdi:solar-power-variant-outline", drying: "mdi:tshirt-crew",
  frost_tonight: "mdi:snowflake-thermometer", watering: "mdi:watering-can", stargazing: "mdi:telescope", sunset_quality: "mdi:weather-sunset", rainbow: "mdi:looks", foehn: "mdi:weather-windy-variant",
  bise: "mdi:weather-windy", airing: "mdi:window-open-variant", temperature_anomaly: "mdi:thermometer-chevron-up", yesterday: "mdi:calendar-arrow-left", year_max_temperature: "mdi:thermometer-high",
  year_min_temperature: "mdi:thermometer-low", year_max_gust: "mdi:weather-windy", first_frost: "mdi:snowflake-thermometer", first_snow: "mdi:snowflake", moon_phase: "mdi:moon-waxing-crescent", ephemeris: "mdi:calendar-star" };
const GOOD = { drying: "good", watering: "not_needed", stargazing: "excellent", sunset_quality: "beautiful", rainbow: "yes", airing: "recommended" };
const DEFAULT_TIPS = ["summary", "rain_arrival", "drying", "frost_tonight", "watering", "stargazing", "sunset_quality", "temperature_anomaly", "yesterday"];

class MeteoSwissTipsCard extends HTMLElement {
  setConfig(config) { this._config = { items: DEFAULT_TIPS, ...config }; this._render(); }
  set hass(hass) {
    this._hass = hass;
    const sensors = relatedSensors(hass, this._config?.entity || findWeather(hass));
    const sig = Object.values(sensors).map((s) => s.last_updated).join();
    if (sig !== this._sig) { this._sig = sig; this._render(); }
  }
  _render() {
    if (!this._config || !this._hass) return;
    const lang = langOf(this._hass, this._config), t = T[lang], loc = locOf(this._hass, this._config);
    const weather = this._config.entity || findWeather(this._hass);
    const sensors = relatedSensors(this._hass, weather);
    const dev = this._hass.entities?.[weather]?.device_id;
    const devName = dev ? this._hass.devices?.[dev]?.name : null;
    const name = (st) => { let n = st.attributes.friendly_name || st.entity_id; if (devName && n.startsWith(devName)) n = n.slice(devName.length).trim(); return n; };
    const value = (st) => (this._hass.formatEntityState ? this._hass.formatEntityState(st) : `${st.state} ${st.attributes.unit_of_measurement || ""}`);
    const tiles = (this._config.items || DEFAULT_TIPS).map((k) => {
      const st = sensors[k];
      if (!st || st.state === "unavailable" || st.state === "unknown") return "";
      let extra = "";
      const at = st.attributes;
      if (k === "drying" && at.start) extra = `${hhmm(at.start, loc)} – ${hhmm(at.end, loc)}`;
      if (k === "stargazing" && at.start) extra = `${hhmm(at.start, loc)} – ${hhmm(at.end, loc)} · ☾ ${at.moon_illumination} %`;
      if (k === "frost_tonight" && at.min_temperature != null) extra = `${num(at.min_temperature, loc, 1)} °C`;
      if (k === "watering" && at.water_balance != null) extra = `${at.water_balance > 0 ? "+" : ""}${num(at.water_balance, loc, 1)} mm`;
      if (k === "temperature_anomaly" && at.normal_max != null) extra = `${num(at.normal_min, loc, 1)} / ${num(at.normal_max, loc, 1)} °C (1991–2020)`;
      if (k === "yesterday" && at.today_vs_yesterday != null) extra = `${at.today_vs_yesterday > 0 ? "+" : ""}${num(at.today_vs_yesterday, loc, 1)} °C`;
      if (k.startsWith("year_") && at.date) extra = new Date(at.date).toLocaleDateString(loc, { day: "numeric", month: "long" });
      if (k === "moon_phase") extra = `${at.illumination} %`;
      if (k === "rain_arrival") { if (at.state === "none" || st.state === "unknown") return ""; extra = at.arrival ? hhmm(at.arrival, loc) : ""; }
      if (k === "solar_today" || k === "solar_tomorrow") extra = at.best_hour ? `☀ ${hhmm(at.best_hour, loc)}` : "";
      const good = GOOD[k] && st.state === GOOD[k];
      const wide = k === "summary" ? " wide" : "";
      return `<div class="tip${wide}${good ? " good" : ""}" data-e="${st.entity_id}"><ha-icon icon="${TIP_ICONS[k]}"></ha-icon><div><div class="k">${esc(name(st))}</div><div class="v">${esc(value(st))}</div>${extra ? `<div class="x">${esc(extra)}</div>` : ""}</div></div>`;
    }).join("");
    shadow(this).innerHTML = `<style>${STYLE}
      .tips { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; padding: 8px 14px 14px; }
      .tip { display: flex; gap: 10px; background: rgba(255,255,255,.07); border-radius: 14px; padding: 10px 12px; cursor: pointer; }
      .tip.wide { grid-column: 1 / -1; }
      .tip.good { background: rgba(102,187,106,.18); }
      .tip ha-icon { --mdc-icon-size: 24px; opacity: .85; flex: 0 0 24px; }
      .k { font-size: 12px; opacity: .7; }
      .v { font-size: 16px; font-weight: 600; }
      .x { font-size: 12px; opacity: .8; }
    </style><ha-card><div class="title">${esc(this._config.name || t.tips)}</div>${tiles ? `<div class="tips">${tiles}</div>` : `<div class="empty">${t.noTips}</div>`}</ha-card>`;
    shadow(this).querySelectorAll(".tip").forEach((el) => el.addEventListener("click", () =>
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: el.dataset.e } }))));
  }
  getCardSize() { return 5; }
  static getStubConfig(hass) { return { items: DEFAULT_TIPS }; }
  static getConfigElement() {
    const TIPN = {
      de: { summary: "Der Tag in einem Satz", rain_arrival: "Regen in … Minuten", solar_today: "Solarertrag heute", solar_tomorrow: "Solarertrag morgen", drying: "Wäsche trocknen", frost_tonight: "Frost heute Nacht", watering: "Garten giessen", stargazing: "Sterne", sunset_quality: "Sonnenuntergang", rainbow: "Regenbogen", foehn: "Föhn", bise: "Bise", airing: "Lüften", temperature_anomaly: "Abweichung von der Norm", yesterday: "Gestern", year_max_temperature: "Wärmster Wert des Jahres", year_min_temperature: "Kältester Wert des Jahres", year_max_gust: "Stärkste Böe", first_frost: "Erster Frost", first_snow: "Erster Schnee", moon_phase: "Mondphase", ephemeris: "Heilige des Tages" },
      fr: { summary: "La journée en une phrase", rain_arrival: "Pluie dans … minutes", solar_today: "Solaire aujourd’hui", solar_tomorrow: "Solaire demain", drying: "Séchage du linge", frost_tonight: "Gel cette nuit", watering: "Arrosage", stargazing: "Étoiles", sunset_quality: "Coucher de soleil", rainbow: "Arc-en-ciel", foehn: "Foehn", bise: "Bise", airing: "Aérer", temperature_anomaly: "Écart à la normale", yesterday: "Hier", year_max_temperature: "Plus chaud de l’année", year_min_temperature: "Plus froid de l’année", year_max_gust: "Plus forte rafale", first_frost: "Premier gel", first_snow: "Première neige", moon_phase: "Phase de lune", ephemeris: "Saint du jour" },
      it: { summary: "La giornata in una frase", rain_arrival: "Pioggia tra … minuti", solar_today: "Solare oggi", solar_tomorrow: "Solare domani", drying: "Bucato", frost_tonight: "Gelo stanotte", watering: "Annaffiare", stargazing: "Stelle", sunset_quality: "Tramonto", rainbow: "Arcobaleno", foehn: "Favonio", bise: "Bise", airing: "Arieggiare", temperature_anomaly: "Scarto dalla norma", yesterday: "Ieri", year_max_temperature: "Più caldo dell’anno", year_min_temperature: "Più freddo dell’anno", year_max_gust: "Raffica più forte", first_frost: "Primo gelo", first_snow: "Prima neve", moon_phase: "Fase lunare", ephemeris: "Santo del giorno" },
      rm: { summary: "Il di en ina frasa", rain_arrival: "Plievgia en … minutas", solar_today: "Solar oz", solar_tomorrow: "Solar damaun", drying: "Sitgar la rauba", frost_tonight: "Gelischun questa notg", watering: "Bagnar", stargazing: "Stailas", sunset_quality: "Rendida dal sulegl", rainbow: "Artg da la plievgia", foehn: "Föhn", bise: "Bisa", airing: "Aerar", temperature_anomaly: "Differenza da la norma", yesterday: "Ier", year_max_temperature: "Il pli chaud da l’onn", year_min_temperature: "Il pli fraid da l’onn", year_max_gust: "Il buf il pli ferm", first_frost: "Emprima gelischun", first_snow: "Emprima naiv", moon_phase: "Fasa da la glina", ephemeris: "Sogn dal di" },
      en: { summary: "Today in a sentence", rain_arrival: "Rain in … minutes", solar_today: "Solar today", solar_tomorrow: "Solar tomorrow", drying: "Laundry drying", frost_tonight: "Frost tonight", watering: "Watering", stargazing: "Stars", sunset_quality: "Sunset", rainbow: "Rainbow", foehn: "Foehn", bise: "Bise", airing: "Airing", temperature_anomaly: "Vs normal", yesterday: "Yesterday", year_max_temperature: "Warmest of the year", year_min_temperature: "Coldest of the year", year_max_gust: "Strongest gust", first_frost: "First frost", first_snow: "First snow", moon_phase: "Moon phase", ephemeris: "Saint of the day" },
    };
    return sectionEditor({ defaults: { items: DEFAULT_TIPS }, labels: LABELS, doc: { fr: "#conseils-du-jour", en: "#tips-of-the-day" },
      top: () => [F.text("name")],
      sections: [{ key: "items", icon: "mdi:lightbulb-on-outline", title: ST("Tipps", "Conseils", "Consigli", "Cussegls", "Tips"), keys: ["items"],
        fields: ({ lang }) => [{ name: "items", selector: { select: { multiple: true, reorder: true, mode: "list", options: TIP_KEYS.map((k) => ({ value: k, label: TIPN[lang][k] })) } } }],
        summary: (c) => `${(c.items || []).length} / ${TIP_KEYS.length}` }] });
  }
}

// ============================================================= postcard

const loadImage = (src) => new Promise((ok, ko) => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => ok(i); i.onerror = ko; i.src = src; });
const svgUrl = (svg) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.includes("xmlns") ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'))}`;

class MeteoSwissPostcardCard extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._drawn = null; this._render(); }
  set hass(hass) { this._hass = hass; const st = hass.states[this._config?.entity || findWeather(hass)]; if (st !== this._st) { this._st = st; this._render(); } }
  async _draw(canvas) {
    const hass = this._hass, st = this._st;
    if (!st) return;
    const a = st.attributes, lang = langOf(hass, this._config), loc = locOf(hass, this._config);
    const place = this._config.place || a.location || a.friendly_name;
    const W = 1080, H = 1350;
    canvas.width = W; canvas.height = H;
    const c = canvas.getContext("2d");
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#21436e"); g.addColorStop(0.55, "#6f9ccc"); g.addColorStop(1, "#f2c48d");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Frame like a postcard.
    c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 6; c.setLineDash([22, 12]); c.strokeRect(40, 40, W - 80, H - 80); c.setLineDash([]);
    c.fillStyle = "#fff"; c.textAlign = "left";
    c.font = "700 84px system-ui, sans-serif"; c.fillText(place, 90, 180);
    c.font = "400 40px system-ui, sans-serif"; c.fillText(new Date().toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long", year: "numeric" }), 92, 245);
    // Monument (line drawing), big, at the bottom.
    const mon = monument(place);
    if (mon) {
      try {
        const svg = mon.replace(/stroke="currentColor"/g, 'stroke="#ffffff"').replace(/stroke-width="1.6"/, 'stroke-width="0.9"').replace(/class="monument"/, 'width="500" height="500"');
        const img = await loadImage(svgUrl(svg));
        c.globalAlpha = 0.9; c.drawImage(img, (W - 500) / 2, 620, 500, 500); c.globalAlpha = 1;
      } catch (e) { /* no monument picture */ }
    }
    // Weather pictogram and temperature.
    if (a.icons_url && a.meteoswiss_symbol != null) {
      try { const img = await loadImage(`${a.icons_url}/${a.meteoswiss_symbol}.svg`); c.drawImage(img, W - 400, 300, 300, 300); } catch (e) { /* ignore */ }
    }
    c.font = "200 220px system-ui, sans-serif"; c.fillText(a.temperature != null ? `${Math.round(a.temperature)}°` : "", 80, 520);
    c.font = "500 48px system-ui, sans-serif"; c.fillText(hass.formatEntityState ? hass.formatEntityState(st) : st.state, 92, 600);
    // Moon.
    const m = moon();
    try { const img = await loadImage(svgUrl(moonSvg(m, 120))); c.drawImage(img, 92, H - 215, 120, 120); } catch (e) { /* ignore */ }
    c.font = "500 38px system-ui, sans-serif"; c.fillText(`${PHASES[lang][m.index]} · ${Math.round(m.illumination * 100)} %`, 240, H - 150);
    c.font = "400 26px system-ui, sans-serif"; c.globalAlpha = 0.8; c.fillText("MeteoSwiss Complete For HA · Source: MeteoSwiss", 240, H - 108); c.globalAlpha = 1;
  }
  _render() {
    if (!this._config || !this._hass) return;
    const lang = langOf(this._hass, this._config), t = T[lang];
    const root = shadow(this);
    if (!root.querySelector("canvas")) {
      root.innerHTML = `<style>${STYLE}
        canvas { width: 100%; display: block; border-radius: 12px; }
        .wrap { padding: 8px 14px; }
        .btns { display: flex; gap: 8px; padding: 0 14px 14px; }
        button { flex: 1; border: 0; border-radius: 12px; padding: 10px; font: inherit; font-weight: 600; cursor: pointer; background: #fff; color: #111; display: flex; gap: 6px; align-items: center; justify-content: center; }
        button.sec { background: rgba(255,255,255,.15); color: #fff; }
      </style><ha-card><div class="title">${esc(this._config.name || t.postcard)}</div><div class="wrap"><canvas></canvas></div>
        <div class="btns"><button class="share"><ha-icon icon="mdi:share-variant"></ha-icon>${t.share}</button><button class="sec dl"><ha-icon icon="mdi:download"></ha-icon>${t.download}</button></div></ha-card>`;
      const canvas = root.querySelector("canvas");
      const blob = () => new Promise((ok) => canvas.toBlob(ok, "image/jpeg", 0.92));
      const name = () => `meteo-${new Date().toISOString().slice(0, 10)}.jpg`;
      root.querySelector(".dl").addEventListener("click", async () => {
        const url = URL.createObjectURL(await blob()); const link = document.createElement("a"); link.href = url; link.download = name(); link.click(); setTimeout(() => URL.revokeObjectURL(url), 5000);
      });
      root.querySelector(".share").addEventListener("click", async () => {
        const file = new File([await blob()], name(), { type: "image/jpeg" });
        if (navigator.canShare?.({ files: [file] })) navigator.share({ files: [file], title: t.postcard }).catch(() => {});
        else root.querySelector(".dl").click();
      });
    }
    const key = `${this._st?.last_updated}|${lang}`;
    if (this._drawn !== key) { this._drawn = key; this._draw(root.querySelector("canvas")); }
  }
  getCardSize() { return 8; }
  static getStubConfig(hass) { return { entity: findWeather(hass) }; }
  static getConfigElement() { return sectionEditor({ labels: LABELS, doc: { fr: "#carte-postale-météo", en: "#weather-postcard" }, top: () => [F.weather, F.text("name"), F.text("place")], sections: [] }); }
}

// ================================================================ guess

const store = { get: (k) => { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };

class MeteoSwissGuessCard extends HTMLElement {
  setConfig(config) { this._config = { ...config }; this._render(); }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first || Date.now() - (this._loaded || 0) > 15 * 60000) this._loadMax(); }
  async _loadMax() {
    this._loaded = Date.now();
    const sensors = relatedSensors(this._hass, this._config.entity || findWeather(this._hass));
    const temp = sensors.temperature;
    if (!temp) { this._render(); return; }
    const start = new Date(); start.setHours(0, 0, 0, 0);
    try {
      const res = await this._hass.callApi("GET", `history/period/${start.toISOString()}?filter_entity_id=${temp.entity_id}&minimal_response&no_attributes`);
      const vals = (res?.[0] || []).map((s) => parseFloat(s.state)).filter((v) => !Number.isNaN(v));
      this._max = vals.length ? Math.max(...vals) : null;
    } catch (e) { this._max = null; }
    this._yesterday = sensors.yesterday ? parseFloat(sensors.yesterday.state) : null;
    this._render();
  }
  _render() {
    if (!this._config || !this._hass) return;
    const lang = langOf(this._hass, this._config), t = T[lang], loc = locOf(this._hass, this._config);
    const today = new Date().toISOString().slice(0, 10), yday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const guesses = store.get("meteoswiss4ha.guesses") || {};
    const g = guesses[today], gy = guesses[yday];
    const evening = new Date().getHours() >= 18;
    let streak = 0;
    for (let d = 1; d < 400; d++) { const k = new Date(Date.now() - d * 864e5).toISOString().slice(0, 10); if (guesses[k]?.ok) streak++; else break; }
    const resY = gy != null && this._yesterday != null && !Number.isNaN(this._yesterday) ? this._yesterday - gy.value : null;
    if (gy && resY != null && gy.ok === undefined) { gy.ok = Math.abs(resY) <= 1; store.set("meteoswiss4ha.guesses", guesses); }
    shadow(this).innerHTML = `<style>${STYLE}
      .body { padding: 6px 18px 16px; }
      .q { font-size: 15px; opacity: .85; }
      .row { display: flex; gap: 8px; margin-top: 10px; }
      input { flex: 1; font: inherit; font-size: 22px; padding: 8px 12px; border-radius: 12px; border: 0; background: rgba(255,255,255,.12); color: #fff; width: 100%; }
      button { border: 0; border-radius: 12px; padding: 0 18px; font: inherit; font-weight: 600; background: #ffd54a; color: #222; cursor: pointer; }
      .big { font-size: 34px; font-weight: 300; }
      .line { margin-top: 8px; display: flex; justify-content: space-between; gap: 8px; font-size: 15px; }
      .res { font-size: 18px; font-weight: 600; color: #ffd54a; margin-top: 6px; }
      .muted { opacity: .7; font-size: 13px; margin-top: 8px; }
    </style><ha-card><div class="title">${esc(this._config.name || t.guess)}</div><div class="body">
      ${g == null ? `<div class="q">${t.guessQ}</div><div class="row"><input type="number" step="0.5" inputmode="decimal" placeholder="°C"><button>${t.save}</button></div>`
        : `<div class="line"><span>${t.yourGuess}</span><span class="big">${num(g.value, loc, 1)}°</span></div>
           <div class="line"><span>${t.measured}</span><span class="big">${this._max != null ? `${num(this._max, loc, 1)}°` : "…"}</span></div>
           ${evening && this._max != null ? `<div class="res">${t.diff(this._max - g.value)}</div>` : `<div class="muted">${t.wait}</div>`}`}
      ${gy && resY != null ? `<div class="muted">${t.yesterday} : ${num(gy.value, loc, 1)}° → ${num(this._yesterday, loc, 1)}° (${t.diff(resY)})</div>` : ""}
      ${streak ? `<div class="muted">🔥 ${t.streak(streak)}</div>` : ""}
    </div></ha-card>`;
    const btn = shadow(this).querySelector("button");
    btn?.addEventListener("click", () => {
      const v = parseFloat(shadow(this).querySelector("input").value);
      if (Number.isNaN(v)) return;
      guesses[today] = { value: v };
      store.set("meteoswiss4ha.guesses", guesses);
      this._render();
    });
  }
  getCardSize() { return 3; }
  static getStubConfig(hass) { return {}; }
  static getConfigElement() { return sectionEditor({ labels: LABELS, doc: { fr: "#devinette", en: "#guessing-game" }, top: () => [F.weather, F.text("name")], sections: [] }); }
}

// ================================================================ badge

class MeteoSwissBadge extends HTMLElement {
  setConfig(config) { this._config = { show_rain: true, ...config }; this._render(); }
  set hass(hass) { this._hass = hass; this._render(); }
  _render() {
    if (!this._config || !this._hass) return;
    const id = this._config.entity || findWeather(this._hass);
    const st = this._hass.states[id];
    if (!st) return;
    const a = st.attributes, t = T[langOf(this._hass, this._config)];
    const rain = relatedSensors(this._hass, id).rain_arrival;
    const r = this._config.show_rain && rain && ["approaching", "raining"].includes(rain.attributes.state) ? t.rain(rain.attributes.minutes) : "";
    const key = `${a.meteoswiss_symbol}|${a.temperature}|${r}`;
    if (key === this._key) return;
    this._key = key;
    shadow(this).innerHTML = `<style>
      :host { display: inline-block; }
      .b { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px 0 4px; border-radius: 18px; background: var(--ha-card-background, var(--card-background-color, #fff));
           border: 1px solid var(--divider-color, #ddd); color: var(--primary-text-color); font: 500 14px/1 var(--paper-font-body1_-_font-family, inherit); cursor: pointer; }
      img { width: 30px; height: 30px; }
      .r { color: #2f7fd1; font-weight: 600; }
    </style><div class="b">${a.icons_url && a.meteoswiss_symbol != null ? `<img src="${a.icons_url}/${a.meteoswiss_symbol}.svg" alt="">` : ""}<span>${a.temperature != null ? `${Math.round(a.temperature)}°` : ""}</span>${r ? `<span class="r">☂ ${esc(r)}</span>` : ""}</div>`;
    shadow(this).querySelector(".b").addEventListener("click", () =>
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId: id } })));
  }
  static getStubConfig(hass) { return { entity: findWeather(hass) }; }
  static getConfigElement() { return sectionEditor({ defaults: { show_rain: true }, labels: LABELS, doc: { fr: "#badge-météo", en: "#weather-badge" }, top: () => [F.weather, F.bool("show_rain")], sections: [] }); }
}
if (!customElements.get("meteoswiss-badge")) {
  customElements.define("meteoswiss-badge", MeteoSwissBadge);
  window.customBadges = window.customBadges || [];
  window.customBadges.push({ type: "meteoswiss-badge", name: "MeteoSwiss", description: "Pictogram and temperature, and the rain arriving.", preview: true });
}

define("meteoswiss-ephemeris-card", MeteoSwissEphemerisCard, "MeteoSwiss ephemeris", "Date, saint of the day, sun, day length and moon (picture, %, phase, times).");
define("meteoswiss-tips-card", MeteoSwissTipsCard, "MeteoSwiss tips", "Everyday tips: solar, laundry, frost, watering, stars, sunset, rainbow, foehn, airing, records…");
define("meteoswiss-postcard-card", MeteoSwissPostcardCard, "MeteoSwiss postcard", "A weather postcard with the town's monument and the moon, to share.");
define("meteoswiss-guess-card", MeteoSwissGuessCard, "MeteoSwiss guess", "Guess today's maximum temperature and see the result in the evening.");
