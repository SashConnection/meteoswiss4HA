// MeteoSwiss Complete For HA - sun, moon and ephemeris (computed locally, no download).
//
// Moon: low-precision formulas (J. Meeus, Astronomical Algorithms, ch. 47-49): phase angle,
// illuminated fraction, next new / full moon, moonrise and moonset (a few minutes accuracy).
// Moon pictures are drawn here (SVG), for the exact phase of the moment.

const RAD = Math.PI / 180;
const norm = (x) => ((x % 360) + 360) % 360;
const jd = (date) => date.getTime() / 864e5 + 2440587.5;

export const PHASES = {
  fr: ["Nouvelle lune", "Premier croissant", "Premier quartier", "Gibbeuse croissante", "Pleine lune", "Gibbeuse décroissante", "Dernier quartier", "Dernier croissant"],
  de: ["Neumond", "Zunehmende Sichel", "Erstes Viertel", "Zunehmender Mond", "Vollmond", "Abnehmender Mond", "Letztes Viertel", "Abnehmende Sichel"],
  it: ["Luna nuova", "Luna crescente", "Primo quarto", "Gibbosa crescente", "Luna piena", "Gibbosa calante", "Ultimo quarto", "Luna calante"],
  rm: ["Glina nova", "Glina creschenta", "Emprim quart", "Glina creschenta gibosa", "Glina plaina", "Glina sminuenta gibosa", "Ultim quart", "Glina sminuenta"],
  en: ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"],
};

// Mean elements of the Moon and the Sun (degrees) for a Julian day.
function elements(j) {
  const T = (j - 2451545) / 36525;
  return {
    T,
    D: norm(297.8501921 + 445267.1114034 * T),
    M: norm(357.5291092 + 35999.0502909 * T),
    Mp: norm(134.9633964 + 477198.8675055 * T),
    F: norm(93.272095 + 483202.0175233 * T),
    Lp: norm(218.3164477 + 481267.88123421 * T),
  };
}

// Phase angle i (0 = full, 180 = new) and whether the Moon is waxing.
function phaseAngle(j) {
  const { D, M, Mp } = elements(j);
  const i = 180 - D - 6.289 * Math.sin(Mp * RAD) + 2.1 * Math.sin(M * RAD) - 1.274 * Math.sin((2 * D - Mp) * RAD)
    - 0.658 * Math.sin(2 * D * RAD) - 0.214 * Math.sin(2 * Mp * RAD) - 0.11 * Math.sin(D * RAD);
  return { i: norm(i), waxing: norm(D) < 180 };
}

export function moon(date = new Date()) {
  const j = jd(date);
  const { i, waxing } = phaseAngle(j);
  const k = (1 + Math.cos(i * RAD)) / 2; // illuminated fraction
  let index;
  if (k < 0.03) index = 0;
  else if (k > 0.97) index = 4;
  else if (Math.abs(k - 0.5) < 0.06) index = waxing ? 2 : 6;
  else if (k < 0.5) index = waxing ? 1 : 7;
  else index = waxing ? 3 : 5;
  return { illumination: k, waxing, index, nextFull: nextPhase(date, 4), nextNew: nextPhase(date, 0) };
}

// Next full (target 4) or new (target 0) moon: the illumination extreme, to the hour.
function nextPhase(date, target) {
  let best = null;
  const start = date.getTime();
  for (let h = 1; h <= 31 * 24; h++) {
    const k = (1 + Math.cos(phaseAngle(jd(new Date(start + h * 36e5))).i * RAD)) / 2;
    const score = target === 4 ? k : 1 - k;
    if (best && score < best.score && best.score > 0.995) break; // passed the peak
    if (!best || score > best.score) best = { score, h };
  }
  return new Date(start + best.h * 36e5);
}

// Moon equatorial position (low precision), for rise and set.
function moonRaDec(j) {
  const { T, D, M, Mp, F, Lp } = elements(j);
  const lon = Lp + 6.289 * Math.sin(Mp * RAD) + 1.274 * Math.sin((2 * D - Mp) * RAD) + 0.658 * Math.sin(2 * D * RAD)
    + 0.214 * Math.sin(2 * Mp * RAD) - 0.186 * Math.sin(M * RAD) - 0.114 * Math.sin(2 * F * RAD);
  const lat = 5.128 * Math.sin(F * RAD) + 0.281 * Math.sin((Mp + F) * RAD) + 0.278 * Math.sin((Mp - F) * RAD) + 0.173 * Math.sin((2 * D - F) * RAD);
  const eps = (23.439291 - 0.0130042 * T) * RAD;
  const l = lon * RAD, b = lat * RAD;
  const ra = Math.atan2(Math.sin(l) * Math.cos(eps) - Math.tan(b) * Math.sin(eps), Math.cos(l));
  const dec = Math.asin(Math.sin(b) * Math.cos(eps) + Math.cos(b) * Math.sin(eps) * Math.sin(l));
  return { ra, dec };
}
function moonAltitude(date, lat, lon) {
  const j = jd(date);
  const { ra, dec } = moonRaDec(j);
  const gmst = norm(280.46061837 + 360.98564736629 * (j - 2451545));
  const ha = (gmst + lon) * RAD - ra;
  return Math.asin(Math.sin(lat * RAD) * Math.sin(dec) + Math.cos(lat * RAD) * Math.cos(dec) * Math.cos(ha)) / RAD;
}

// Moonrise and moonset of a local day (null when it does not rise or set that day).
export function moonTimes(day, lat, lon) {
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const h0 = 0.125;
  let rise = null, set = null, prev = moonAltitude(start, lat, lon) - h0;
  for (let m = 10; m <= 1440; m += 10) {
    const t = new Date(start.getTime() + m * 6e4);
    const cur = moonAltitude(t, lat, lon) - h0;
    if (prev < 0 && cur >= 0 && !rise) rise = new Date(t.getTime() - (cur / (cur - prev)) * 6e5);
    if (prev >= 0 && cur < 0 && !set) set = new Date(t.getTime() - (cur / (cur - prev)) * 6e5);
    prev = cur;
  }
  return { rise, set };
}

// Sunrise / sunset (NOAA formulas), for days when the sun.sun entity is not enough.
export function sunTimesFor(day, lat, lon) {
  const d = new Date(day); d.setHours(12, 0, 0, 0);
  const j = jd(d) - lon / 360;
  const n = Math.round(j - 2451545.0009);
  const Js = 2451545.0009 + n - lon / 360;
  const M = norm(357.5291 + 0.98560028 * (Js - 2451545));
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const L = norm(M + C + 180 + 102.9372);
  const Jt = Js + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * L * RAD);
  const dec = Math.asin(Math.sin(L * RAD) * Math.sin(23.44 * RAD));
  const cosw = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * Math.sin(dec)) / (Math.cos(lat * RAD) * Math.cos(dec));
  if (cosw < -1 || cosw > 1) return null;
  const w = Math.acos(cosw) / RAD / 360;
  const toDate = (x) => new Date((x - 2440587.5) * 864e5);
  return { rise: toDate(Jt - w), set: toDate(Jt + w), length: 2 * w * 24 };
}

// ISO week number and day of the year.
export function dayInfo(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const week = Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  const start = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((new Date(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 864e5);
  const leap = new Date(date.getFullYear(), 1, 29).getMonth() === 1;
  return { week, dayOfYear: doy, daysInYear: leap ? 366 : 365 };
}

// Saint of the day (calendar of 366 days, Feb 29 included).
let saints = null;
const BASE = new URL(".", import.meta.url).href;
export const loadSaints = () => (saints ||= fetch(`${BASE}saints.json`).then((r) => r.json()).catch(() => null));
export function saintOf(list, date = new Date()) {
  if (!list) return null;
  const month = date.getMonth(), day = date.getDate();
  const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const index = DAYS.slice(0, month).reduce((a, b) => a + b, 0) + day - 1;
  return list[index] ?? null;
}

// Moon picture: the lit part for the exact illumination, craters, dark side in night blue.
let uid = 0;
export function moonSvg(info, size = 48) {
  const id = `m${++uid}`;
  const r = 40, c = 50, k = info.illumination;
  const rx = r * Math.abs(1 - 2 * k);
  const s1 = info.waxing ? 1 : 0;
  const s2 = info.waxing ? (k > 0.5 ? 1 : 0) : (k > 0.5 ? 0 : 1);
  const lit = k < 0.005 ? "" : k > 0.995 ? `<circle cx="${c}" cy="${c}" r="${r}"/>`
    : `<path d="M${c},${c - r} A${r},${r} 0 0 ${s1} ${c},${c + r} A${rx.toFixed(2)},${r} 0 0 ${s2} ${c},${c - r}Z"/>`;
  const craters = (a, b) => `<circle cx="38" cy="36" r="7" fill="${a}"/><circle cx="60" cy="58" r="10" fill="${b}"/><circle cx="62" cy="31" r="4.5" fill="${a}"/><circle cx="35" cy="62" r="5" fill="${b}"/><circle cx="49" cy="76" r="3.5" fill="${a}"/><circle cx="74" cy="46" r="3" fill="${b}"/>`;
  return `<svg class="moon" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
    <defs><clipPath id="${id}d"><circle cx="${c}" cy="${c}" r="${r}"/></clipPath><clipPath id="${id}l">${lit || '<rect width="0" height="0"/>'}</clipPath></defs>
    <circle cx="${c}" cy="${c}" r="${r}" fill="#2f3648"/><g clip-path="url(#${id}d)">${craters("#262c3c", "#283043")}</g>
    <g clip-path="url(#${id}l)"><circle cx="${c}" cy="${c}" r="${r}" fill="#f2ead0"/>${craters("#d9cfae", "#ddd3b3")}</g>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="#9aa3b8" stroke-width="1.2"/></svg>`;
}

const T = {
  fr: { rise: "Lever", set: "Coucher", day: "Durée du jour", moonrise: "Lever de la lune", moonset: "Coucher de la lune", full: "Pleine lune", new: "Nouvelle lune", inDays: (n) => (n <= 0 ? "aujourd’hui" : n === 1 ? "demain" : `dans ${n} jours`), week: "Semaine", dayN: "Jour", vsYesterday: (m) => `${m >= 0 ? "+" : "−"}${Math.abs(m)} min par rapport à hier` },
  de: { rise: "Aufgang", set: "Untergang", day: "Tageslänge", moonrise: "Mondaufgang", moonset: "Monduntergang", full: "Vollmond", new: "Neumond", inDays: (n) => (n <= 0 ? "heute" : n === 1 ? "morgen" : `in ${n} Tagen`), week: "Woche", dayN: "Tag", vsYesterday: (m) => `${m >= 0 ? "+" : "−"}${Math.abs(m)} Min. gegenüber gestern` },
  it: { rise: "Alba", set: "Tramonto", day: "Durata del giorno", moonrise: "Sorgere della luna", moonset: "Tramonto della luna", full: "Luna piena", new: "Luna nuova", inDays: (n) => (n <= 0 ? "oggi" : n === 1 ? "domani" : `fra ${n} giorni`), week: "Settimana", dayN: "Giorno", vsYesterday: (m) => `${m >= 0 ? "+" : "−"}${Math.abs(m)} min rispetto a ieri` },
  rm: { rise: "Levada", set: "Rendida", day: "Durada dal di", moonrise: "Levada da la glina", moonset: "Rendida da la glina", full: "Glina plaina", new: "Glina nova", inDays: (n) => (n <= 0 ? "oz" : n === 1 ? "damaun" : `en ${n} dis`), week: "Emna", dayN: "Di", vsYesterday: (m) => `${m >= 0 ? "+" : "−"}${Math.abs(m)} min cumpareglià cun ier` },
  en: { rise: "Sunrise", set: "Sunset", day: "Day length", moonrise: "Moonrise", moonset: "Moonset", full: "Full moon", new: "New moon", inDays: (n) => (n <= 0 ? "today" : n === 1 ? "tomorrow" : `in ${n} days`), week: "Week", dayN: "Day", vsYesterday: (m) => `${m >= 0 ? "+" : "−"}${Math.abs(m)} min vs yesterday` },
};
export const astroText = (lang) => T[lang] || T.en;

// Options shared by the cards (editor section "Sun and moon").
export const ASTRO_OPTIONS = ["show_sun", "show_day_length", "show_moon", "show_moon_times", "show_next_moons", "show_ephemeris"];

const hm = (d, loc) => (d ? d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }) : "–");
const daysUntil = (d) => Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 864e5);

// One block of sun / moon / ephemeris lines for a card, according to its options.
export function astroBlock(cfg, lang, loc, lat, lon, saintsList, color = "inherit") {
  const t = astroText(lang);
  const parts = [];
  const now = new Date();
  if (cfg.show_sun || cfg.show_day_length) {
    const s = sunTimesFor(now, lat, lon), y = sunTimesFor(new Date(now - 864e5), lat, lon);
    const items = [];
    if (cfg.show_sun && s) items.push(`<span>☀ ${t.rise} ${hm(s.rise, loc)}</span><span>${t.set} ${hm(s.set, loc)}</span>`);
    if (cfg.show_day_length && s) {
      const h = Math.floor(s.length), m = Math.round((s.length - h) * 60);
      const diff = y ? Math.round((s.length - y.length) * 60) : null;
      items.push(`<span>${t.day} ${h} h ${String(m).padStart(2, "0")}${diff != null ? ` <small>(${t.vsYesterday(diff)})</small>` : ""}</span>`);
    }
    parts.push(`<div class="astro-row">${items.join("")}</div>`);
  }
  if (cfg.show_moon || cfg.show_moon_times || cfg.show_next_moons) {
    const m = moon(now);
    const items = [];
    if (cfg.show_moon) items.push(`<span class="astro-moon">${moonSvg(m, 34)}<span><b>${PHASES[lang]?.[m.index] || PHASES.en[m.index]}</b><br>${Math.round(m.illumination * 100)} %</span></span>`);
    if (cfg.show_moon_times) { const mt = moonTimes(now, lat, lon); items.push(`<span>↑ ${hm(mt.rise, loc)} ↓ ${hm(mt.set, loc)}</span>`); }
    if (cfg.show_next_moons) items.push(`<span>${t.full} ${t.inDays(daysUntil(m.nextFull))} · ${t.new} ${t.inDays(daysUntil(m.nextNew))}</span>`);
    parts.push(`<div class="astro-row">${items.join("")}</div>`);
  }
  if (cfg.show_ephemeris) {
    const di = dayInfo(now);
    const saint = saintOf(saintsList?.[lang] || saintsList?.en, now);
    parts.push(`<div class="astro-row"><span>${now.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "long" })}</span>${saint ? `<span>✝ ${saint}</span>` : ""}<span>${t.week} ${di.week} · ${t.dayN} ${di.dayOfYear}/${di.daysInYear}</span></div>`);
  }
  if (!parts.length) return "";
  return `<div class="astro" style="color:${color}">${parts.join("")}</div>`;
}
export const ASTRO_STYLE = `
.astro { padding: 6px 16px 12px; display: flex; flex-direction: column; gap: 6px; font-size: 13.5px; }
.astro-row { display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: center; opacity: .92; }
.astro-row small { opacity: .75; }
.astro-moon { display: inline-flex; align-items: center; gap: 8px; line-height: 1.2; }
`;

// The block for a card: language and place from Home Assistant; saints loaded once, then re-render.
export function astroFor(card, cfg, hass, lang, loc, color) {
  if (!ASTRO_OPTIONS.some((k) => cfg?.[k])) return "";
  let list = null;
  if (cfg.show_ephemeris) {
    if (!card.__saints) {
      card.__saints = "loading";
      loadSaints().then((s) => { card.__saints = s || "none"; card._render?.(); });
    }
    list = typeof card.__saints === "object" ? card.__saints : null;
  }
  const lat = hass?.config?.latitude ?? 46.95, lon = hass?.config?.longitude ?? 7.44;
  return `<style>${ASTRO_STYLE}</style>` + astroBlock(cfg, lang, loc, lat, lon, list, color);
}
