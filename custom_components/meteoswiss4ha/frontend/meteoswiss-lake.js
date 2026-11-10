// MeteoSwiss Complete For HA - lake card (Eawag Alplakes models).
//
//   type: custom:meteoswiss-lake-card
//   lake: neuchatel            one of the 27 lakes (default: the first chosen in the options)
//   measures: [temperature, trend, range, bottom, oxygen, thermocline, ice,
//              altitude, area, max_depth, volume]       (default: all)
//   show_map: true             lakes with a 3D model: the lake drawn in color by temperature,
//                              with currents, lakeside towns and their water temperature,
//                              a time slider (yesterday .. +4 days) and the depth
//   show_profile: true         temperature and oxygen from the surface to the bottom
//   show_forecast: true        temperature at 1 m with its 10-90 % range
//   depth: 1                   depth of the map (m)
//   language: auto

import { LANGS, api, define, esc, hh, langOf, locOf, makeEditor, num, tempColor, weekday } from "./meteoswiss-common.js";

const T = {
  de: {
    measures: { temperature: "Wassertemperatur (1 m)", trend: "Veränderung 24 h", range: "Prognose 24 h (10–90 %)", bottom: "Am Grund", oxygen: "Sauerstoffsättigung", thermocline: "Sprungschicht", ice: "Eis", altitude: "Höhe", area: "Fläche", max_depth: "Max. Tiefe", volume: "Volumen" },
    map: "Karte", profile: "Profil", forecast: "Prognose", depth: "Tiefe", warmest: "wärmste Stelle", coldest: "kälteste Stelle", currents: "Strömungen", now: "Jetzt",
    no3d: "Für diesen See gibt es kein 3D-Modell (keine Karte).", unavailable: "Seedaten nicht verfügbar.", noIce: "kein", oxygenAxis: "O₂ %",
    f: { lake: "See", measures: "Werte", show_map: "Karte", show_profile: "Profil", show_forecast: "Prognose", depth: "Tiefe der Karte (m)", language: "Sprache", name: "Titel" },
  },
  fr: {
    measures: { temperature: "Température de l’eau (1 m)", trend: "Variation 24 h", range: "Prévision 24 h (10–90 %)", bottom: "Au fond", oxygen: "Saturation en oxygène", thermocline: "Thermocline", ice: "Glace", altitude: "Altitude", area: "Superficie", max_depth: "Profondeur max.", volume: "Volume" },
    map: "Carte", profile: "Profil", forecast: "Prévision", depth: "Profondeur", warmest: "endroit le plus chaud", coldest: "endroit le plus froid", currents: "courants", now: "Maintenant",
    no3d: "Pas de modèle 3D pour ce lac (pas de carte).", unavailable: "Données du lac indisponibles.", noIce: "aucune", oxygenAxis: "O₂ %",
    f: { lake: "Lac", measures: "Valeurs", show_map: "Carte", show_profile: "Profil", show_forecast: "Prévision", depth: "Profondeur de la carte (m)", language: "Langue", name: "Titre" },
  },
  it: {
    measures: { temperature: "Temperatura dell’acqua (1 m)", trend: "Variazione 24 h", range: "Previsione 24 h (10–90 %)", bottom: "Sul fondo", oxygen: "Saturazione di ossigeno", thermocline: "Termoclino", ice: "Ghiaccio", altitude: "Altitudine", area: "Superficie", max_depth: "Profondità max.", volume: "Volume" },
    map: "Carta", profile: "Profilo", forecast: "Previsione", depth: "Profondità", warmest: "punto più caldo", coldest: "punto più freddo", currents: "correnti", now: "Ora",
    no3d: "Nessun modello 3D per questo lago (nessuna carta).", unavailable: "Dati del lago non disponibili.", noIce: "nessuno", oxygenAxis: "O₂ %",
    f: { lake: "Lago", measures: "Valori", show_map: "Carta", show_profile: "Profilo", show_forecast: "Previsione", depth: "Profondità della carta (m)", language: "Lingua", name: "Titolo" },
  },
  rm: {
    measures: { temperature: "Temperatura da l’aua (1 m)", trend: "Midada 24 h", range: "Prognosa 24 h (10–90 %)", bottom: "Sin il fund", oxygen: "Saturaziun d’oxigen", thermocline: "Termoclina", ice: "Glatsch", altitude: "Altezza", area: "Surfatscha", max_depth: "Profunditad max.", volume: "Volumen" },
    map: "Charta", profile: "Profil", forecast: "Prognosa", depth: "Profunditad", warmest: "lieu il pli chaud", coldest: "lieu il pli fraid", currents: "currents", now: "Ussa",
    no3d: "Nagin model 3D per quest lai (nagina charta).", unavailable: "Datas dal lai betg disponiblas.", noIce: "nagin", oxygenAxis: "O₂ %",
    f: { lake: "Lai", measures: "Valurs", show_map: "Charta", show_profile: "Profil", show_forecast: "Prognosa", depth: "Profunditad da la charta (m)", language: "Lingua", name: "Titel" },
  },
  en: {
    measures: { temperature: "Water temperature (1 m)", trend: "24 h change", range: "Next 24 h (10–90 %)", bottom: "At the bottom", oxygen: "Oxygen saturation", thermocline: "Thermocline", ice: "Ice", altitude: "Altitude", area: "Area", max_depth: "Max. depth", volume: "Volume" },
    map: "Map", profile: "Profile", forecast: "Forecast", depth: "Depth", warmest: "warmest spot", coldest: "coldest spot", currents: "currents", now: "Now",
    no3d: "No 3D model for this lake (no map).", unavailable: "Lake data unavailable.", noIce: "none", oxygenAxis: "O₂ %",
    f: { lake: "Lake", measures: "Values", show_map: "Map", show_profile: "Profile", show_forecast: "Forecast", depth: "Map depth (m)", language: "Language", name: "Title" },
  },
};
const LABELS = Object.fromEntries(Object.entries(T).map(([l, t]) => [l, t.f]));
const MEASURES = ["temperature", "trend", "range", "bottom", "oxygen", "thermocline", "ice", "altitude", "area", "max_depth", "volume"];
const DEPTHS = [1, 5, 10, 20, 50];

// Lakeside towns shown on the map with the water temperature in front of them.
const TOWNS = {
  neuchatel: [["Neuchâtel", 46.99, 6.93], ["Yverdon-les-Bains", 46.784, 6.645], ["Estavayer-le-Lac", 46.849, 6.846], ["Grandson", 46.81, 6.652], ["Portalban", 46.92, 6.955], ["Saint-Aubin", 46.893, 6.78], ["Cudrefin", 46.957, 7.02]],
  biel: [["Biel/Bienne", 47.132, 7.236], ["La Neuveville", 47.064, 7.1], ["Erlach", 47.044, 7.099], ["Twann", 47.094, 7.158]],
  murten: [["Murten", 46.929, 7.112], ["Môtier", 46.909, 7.085], ["Sugiez", 46.958, 7.107]],
  geneva: [["Genève", 46.21, 6.158], ["Lausanne", 46.505, 6.627], ["Montreux", 46.432, 6.908], ["Nyon", 46.381, 6.243], ["Évian", 46.403, 6.59], ["Thonon", 46.376, 6.48], ["Morges", 46.507, 6.5]],
  zurich: [["Zürich", 47.358, 8.541], ["Wädenswil", 47.232, 8.675], ["Meilen", 47.268, 8.644], ["Rapperswil", 47.225, 8.81], ["Horgen", 47.26, 8.6]],
  zug: [["Zug", 47.165, 8.512], ["Cham", 47.18, 8.465], ["Walchwil", 47.1, 8.51], ["Arth", 47.065, 8.52]],
  lucerne: [["Luzern", 47.052, 8.312], ["Weggis", 47.031, 8.432], ["Brunnen", 46.996, 8.603], ["Flüelen", 46.905, 8.622], ["Stansstad", 46.977, 8.336]],
  lugano: [["Lugano", 46.0, 8.955], ["Melide", 45.955, 8.95], ["Morcote", 45.925, 8.915], ["Porlezza", 46.035, 9.125], ["Ponte Tresa", 45.97, 8.86]],
  joux: [["Le Sentier", 46.61, 6.24], ["L’Abbaye", 46.648, 6.318]],
  hallwil: [["Meisterschwanden", 47.293, 8.226], ["Beinwil am See", 47.262, 8.205]],
  greifensee: [["Greifensee", 47.365, 8.678], ["Maur", 47.338, 8.668]],
  aegeri: [["Unterägeri", 47.135, 8.585], ["Oberägeri", 47.12, 8.613]],
  stmoritz: [["St. Moritz", 46.497, 9.84]],
};

const STYLE = `
:host { display: block; }
ha-card { overflow: hidden; color: #fff; background: linear-gradient(180deg, #0c1c2b 0%, #12293b 55%, #1b2a36 100%); border: 0; }
.head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 18px 4px; }
.title { font-size: 22px; font-weight: 700; }
.title small { display: block; font-size: 13px; font-weight: 400; opacity: .7; }
.big { font-size: 46px; font-weight: 300; white-space: nowrap; }
.tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; padding: 6px 14px; }
.tile { background: rgba(255,255,255,.07); border-radius: 12px; padding: 7px 10px; }
.tile .k { font-size: 11.5px; opacity: .7; }
.tile .v { font-size: 17px; font-weight: 600; margin-top: 2px; }
.sec { padding: 8px 14px 4px; }
.sec h4 { margin: 4px 4px 6px; font-size: 14px; font-weight: 600; opacity: .85; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.mapbox { position: relative; border-radius: 14px; overflow: hidden; background: #0a1520; }
canvas { display: block; width: 100%; }
.legend { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 6px 4px 0; }
.legend .bar { flex: 1; height: 8px; border-radius: 4px; }
.ctl { display: flex; align-items: center; gap: 8px; padding: 6px 4px 0; font-size: 13px; }
.ctl input[type=range] { flex: 1; accent-color: #4fc3ff; }
select { background: rgba(255,255,255,.1); color: #fff; border: 0; border-radius: 10px; padding: 4px 8px; font: inherit; font-size: 13px; }
select option { color: #111; }
.tip { position: absolute; pointer-events: none; background: rgba(0,0,0,.75); padding: 3px 8px; border-radius: 8px; font-size: 13px; transform: translate(-50%, -130%); white-space: nowrap; }
svg { display: block; width: 100%; height: auto; }
svg text { fill: #fff; font-family: inherit; }
.empty { padding: 16px; color: #aaa; }
.src { font-size: 11px; opacity: .55; padding: 4px 18px 12px; }
`;

class MeteoSwissLakeCard extends HTMLElement {
  setConfig(config) {
    this._config = { show_map: true, show_profile: true, show_forecast: true, depth: 1, ...config };
    this._depth = Number(this._config.depth) || 1;
    this._offset = 0; // hours from now (map time slider)
    this._render();
  }
  set hass(hass) { const first = !this._hass; this._hass = hass; if (first) this._load(); }
  connectedCallback() { this._timer = setInterval(() => this._load(true), 60 * 60000); }
  disconnectedCallback() { clearInterval(this._timer); }

  async _load(refresh) {
    if (!this._hass) return;
    try {
      if (!this._lakes) this._lakes = await api(this._hass, "lakes", 30 * 60000);
      this._key = this._config.lake || this._lakes.chosen?.[0] || "neuchatel";
      this._data = await api(this._hass, `lake/${this._key}?depth=${this._depth}`, refresh ? 0 : 30 * 60000);
      this._layer = this._data.layer;
      this._error = false;
    } catch (e) { this._error = true; }
    this._render();
  }

  async _loadLayer() {
    const time = new Date(Date.now() + this._offset * 36e5).toISOString();
    try {
      const d = await api(this._hass, `lake/${this._key}?depth=${this._depth}&time=${encodeURIComponent(time.slice(0, 13) + ":00:00Z")}`, 60 * 60000);
      this._layer = d.layer;
    } catch (e) { /* keep the previous layer */ }
    this._drawMap();
  }

  _tiles(t, loc) {
    const d = this._data, s = d.series || {};
    const now = Date.now();
    const at = (key, ms) => {
      let best = null;
      (s.time || []).forEach((tt, i) => { const v = s[key]?.[i]; if (v == null) return; const dd = Math.abs(new Date(tt) - ms); if (!best || dd < best[0]) best = [dd, v]; });
      return best && best[0] < 6 * 36e5 ? best[1] : null;
    };
    const temp = at("T", now), past = at("T", now - 864e5);
    const next = (s.time || []).map((tt, i) => [new Date(tt).getTime(), s.T_p10?.[i], s.T_p90?.[i]]).filter(([ms]) => ms > now && ms < now + 864e5);
    const lo = next.length ? Math.min(...next.map((x) => x[1]).filter((v) => v != null)) : null, hi = next.length ? Math.max(...next.map((x) => x[2]).filter((v) => v != null)) : null;
    const prof = d.profile || {};
    const bottom = prof.T?.length && prof.depth?.length ? prof.T[prof.depth.indexOf(Math.max(...prof.depth))] : null;
    const ice = at("TotalIceH", now);
    const v = {
      temperature: `${num(temp, loc, 1)} °C`,
      trend: temp != null && past != null ? `${temp - past >= 0 ? "+" : "−"}${num(Math.abs(temp - past), loc, 1)} °C` : "–",
      range: lo != null && isFinite(lo) ? `${num(lo, loc, 1)}–${num(hi, loc, 1)} °C` : "–",
      bottom: bottom != null ? `${num(bottom, loc, 1)} °C` : "–",
      oxygen: at("OxygenSat", now) != null ? `${num(at("OxygenSat", now), loc)} %` : "–",
      thermocline: at("Thermocline", now) != null ? `${num(at("Thermocline", now), loc)} m` : "–",
      ice: ice ? `${num(ice * 100, loc)} cm` : t.noIce,
      altitude: `${num(d.altitude, loc)} m`,
      area: `${num(d.area, loc, d.area < 10 ? 1 : 0)} km²`,
      max_depth: `${num(d.max_depth, loc)} m`,
      volume: `${num(d.volume, loc, d.volume < 1 ? 2 : 1)} km³`,
    };
    const list = (this._config.measures?.length ? this._config.measures : MEASURES).filter((k) => k !== "temperature");
    return { temp, html: list.map((k) => `<div class="tile"><div class="k">${esc(t.measures[k])}</div><div class="v">${esc(v[k])}</div></div>`).join("") };
  }

  _forecastSvg(t, loc) {
    const s = this._data.series || {};
    const pts = (s.time || []).map((tt, i) => ({ ms: new Date(tt).getTime(), v: s.T?.[i], lo: s.T_p10?.[i], hi: s.T_p90?.[i] })).filter((p) => p.v != null);
    if (pts.length < 2) return "";
    const W = 600, H = 150, L = 34, B = 128, TP = 12;
    const all = pts.flatMap((p) => [p.v, p.lo, p.hi]).filter((v) => v != null);
    const lo = Math.floor(Math.min(...all) - 0.3), hi = Math.ceil(Math.max(...all) + 0.3);
    const x0 = pts[0].ms, x1 = pts[pts.length - 1].ms;
    const x = (ms) => L + ((ms - x0) / (x1 - x0)) * (W - L - 6), y = (v) => B - ((v - lo) / (hi - lo)) * (B - TP);
    const band = pts.filter((p) => p.lo != null && p.hi != null);
    const p = [];
    for (let v = lo; v <= hi; v += Math.max(1, Math.round((hi - lo) / 4))) p.push(`<line x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="#fff" stroke-opacity=".12"/><text x="4" y="${y(v) + 4}" font-size="11" opacity=".7">${v}°</text>`);
    pts.forEach((pt) => { const d = new Date(pt.ms); if (d.getHours() < 3) p.push(`<line x1="${x(pt.ms)}" x2="${x(pt.ms)}" y1="${TP}" y2="${B}" stroke="#fff" stroke-opacity=".25"/><text x="${x(pt.ms) + 3}" y="${H - 6}" font-size="11" opacity=".8">${esc(weekday(d, loc, "short"))}</text>`); });
    if (band.length > 1) p.push(`<path d="M${band.map((q) => `${x(q.ms).toFixed(1)},${y(q.hi).toFixed(1)}`).join("L")}L${band.slice().reverse().map((q) => `${x(q.ms).toFixed(1)},${y(q.lo).toFixed(1)}`).join("L")}Z" fill="#4fc3ff" opacity=".25"/>`);
    p.push(`<path d="M${pts.map((q) => `${x(q.ms).toFixed(1)},${y(q.v).toFixed(1)}`).join("L")}" fill="none" stroke="#4fc3ff" stroke-width="2.5"/>`);
    const nx = x(Date.now());
    if (nx > L && nx < W) p.push(`<line x1="${nx}" x2="${nx}" y1="${TP}" y2="${B}" stroke="#fff" stroke-width="1.5"/><text x="${nx + 3}" y="${TP + 10}" font-size="11">${t.now}</text>`);
    return `<svg viewBox="0 0 ${W} ${H}">${p.join("")}</svg>`;
  }

  _profileSvg(t, loc) {
    const pr = this._data.profile || {};
    const depth = pr.depth || [];
    if (!depth.length || !pr.T) return "";
    const W = 600, H = 210, L = 40, R = 40, TP = 22, B = 196;
    const maxD = Math.max(...depth);
    const ts = pr.T.filter((v) => v != null);
    const lo = Math.floor(Math.min(...ts) - 0.5), hi = Math.ceil(Math.max(...ts) + 0.5);
    const x = (v) => L + ((v - lo) / (hi - lo)) * (W - L - R), y = (d) => TP + (d / maxD) * (B - TP);
    const ox = (v) => L + (v / 120) * (W - L - R);
    const p = [];
    for (let d = 0; d <= maxD; d += maxD > 120 ? 50 : maxD > 40 ? 20 : 10) p.push(`<line x1="${L}" x2="${W - R}" y1="${y(d)}" y2="${y(d)}" stroke="#fff" stroke-opacity=".1"/><text x="4" y="${y(d) + 4}" font-size="11" opacity=".7">${d} m</text>`);
    for (let v = lo; v <= hi; v += Math.max(1, Math.round((hi - lo) / 5))) p.push(`<text x="${x(v)}" y="14" font-size="11" text-anchor="middle" opacity=".8">${v}°</text>`);
    // Water column colored by temperature.
    depth.forEach((d, i) => { const v = pr.T[i]; if (v != null) p.push(`<rect x="${L}" y="${y(d) - 1}" width="${W - L - R}" height="${(B - TP) / depth.length + 1.5}" fill="${tempColor(v, 0.22)}"/>`); });
    const line = (vals, fx, color, dash) => `<path d="M${depth.map((d, i) => vals[i] == null ? null : `${fx(vals[i]).toFixed(1)},${y(d).toFixed(1)}`).filter(Boolean).join("L")}" fill="none" stroke="${color}" stroke-width="2.5" ${dash ? 'stroke-dasharray="5 4"' : ""}/>`;
    p.push(line(pr.T, x, "#ff7a59"));
    if (pr.OxygenSat?.some((v) => v != null)) {
      p.push(line(pr.OxygenSat, ox, "#7ee081", true));
      p.push(`<text x="${W - 4}" y="14" font-size="11" text-anchor="end" fill="#7ee081">${t.oxygenAxis}</text>`);
    }
    const s = this._data.series || {};
    // Thermocline now (nearest step of the series).
    let tc = null, gap = Infinity;
    (s.time || []).forEach((tt, i) => { const g = Math.abs(new Date(tt) - Date.now()); if (s.Thermocline?.[i] != null && g < gap) { gap = g; tc = s.Thermocline[i]; } });
    if (tc) p.push(`<line x1="${L}" x2="${W - R}" y1="${y(tc)}" y2="${y(tc)}" stroke="#fff" stroke-dasharray="2 3"/><text x="${W - R - 4}" y="${y(tc) - 4}" font-size="11" text-anchor="end">${esc(t.measures.thermocline)} ${num(tc, loc)} m</text>`);
    return `<svg viewBox="0 0 ${W} ${H}">${p.join("")}</svg>`;
  }

  _drawMap() {
    const canvas = this.shadowRoot?.querySelector("canvas");
    const layer = this._layer;
    if (!canvas || !layer?.lat?.length) return;
    const { lat, lng, t: temp, u, v } = layer;
    const rows = lat.length, cols = lat[0].length;
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180, minT = 99, maxT = -99, hot = null, cold = null;
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const tt = temp[i]?.[j];
      if (tt == null || lat[i][j] == null) continue;
      minLat = Math.min(minLat, lat[i][j]); maxLat = Math.max(maxLat, lat[i][j]); minLng = Math.min(minLng, lng[i][j]); maxLng = Math.max(maxLng, lng[i][j]);
      if (tt < minT) { minT = tt; cold = [i, j]; }
      if (tt > maxT) { maxT = tt; hot = [i, j]; }
    }
    if (maxLat < minLat) return;
    const k = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const W = canvas.clientWidth || 560, pad = 24;
    const spanX = (maxLng - minLng) * k, spanY = maxLat - minLat;
    const scale = Math.min((W - 2 * pad) / spanX, 420 / spanY);
    const H = Math.round(spanY * scale + 2 * pad);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); canvas.style.height = `${H}px`;
    const c = canvas.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const X = (lo) => pad + (lo - minLng) * k * scale + (W - 2 * pad - spanX * scale) / 2, Y = (la) => pad + (maxLat - la) * scale;
    this._proj = { X, Y, lat, lng, temp, rows, cols };
    // Cell corners from the neighbours (curvilinear grid).
    const at = (i, j) => (lat[i]?.[j] != null && lng[i]?.[j] != null ? [lng[i][j], lat[i][j]] : null);
    const delta = (i, j, di, dj) => {
      const a = at(i, j), b = at(i + di, j + dj) || at(i - di, j - dj);
      if (!a || !b) return [0, 0];
      const sgn = at(i + di, j + dj) ? 1 : -1;
      return [(b[0] - a[0]) * sgn, (b[1] - a[1]) * sgn];
    };
    const quad = (i, j, grow) => {
      const a = at(i, j), di = delta(i, j, 1, 0), dj = delta(i, j, 0, 1);
      const g = 0.5 * grow;
      return [[-g, -g], [g, -g], [g, g], [-g, g]].map(([p, q]) => [X(a[0] + di[0] * p + dj[0] * q), Y(a[1] + di[1] * p + dj[1] * q)]);
    };
    const fillQuad = (pts) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let n = 1; n < 4; n++) c.lineTo(pts[n][0], pts[n][1]); c.closePath(); c.fill(); };
    // Shore: a slightly larger dark copy, then the water by temperature.
    c.fillStyle = "#e9eef2";
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) if (temp[i]?.[j] != null) fillQuad(quad(i, j, 1.9));
    c.fillStyle = "#0a1520";
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) if (temp[i]?.[j] != null) fillQuad(quad(i, j, 1.45));
    const color = (tt) => { const f = maxT > minT ? (tt - minT) / (maxT - minT) : 0.5; return this._colorRel(f); };
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const tt = temp[i]?.[j];
      if (tt == null) continue;
      c.fillStyle = color(tt); fillQuad(quad(i, j, 1.08));
    }
    // Currents.
    const cells = (maxLat - minLat) * scale * (maxLng - minLng) * k * scale;
    const step = Math.max(2, Math.round(Math.sqrt((rows * cols) / Math.max(60, cells / 1600))));
    let vmax = 0.001;
    for (let i = 0; i < rows; i += step) for (let j = 0; j < cols; j += step) if (u?.[i]?.[j] != null) vmax = Math.max(vmax, Math.hypot(u[i][j], v[i][j]));
    c.strokeStyle = "rgba(255,255,255,.75)"; c.fillStyle = "rgba(255,255,255,.75)"; c.lineWidth = 1.2;
    for (let i = 0; i < rows; i += step) for (let j = 0; j < cols; j += step) {
      if (temp[i]?.[j] == null || u?.[i]?.[j] == null) continue;
      const sp = Math.hypot(u[i][j], v[i][j]);
      if (sp < vmax * 0.08) continue;
      const len = 4 + (sp / vmax) * 14, ang = Math.atan2(-v[i][j], u[i][j]);
      const x0 = X(lng[i][j]), y0 = Y(lat[i][j]), x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(ang - 0.5) * 4, y1 - Math.sin(ang - 0.5) * 4); c.lineTo(x1 - Math.cos(ang + 0.5) * 4, y1 - Math.sin(ang + 0.5) * 4); c.fill();
    }
    // Towns: water temperature in front of each town (nearest water cell).
    const loc = locOf(this._hass, this._config);
    const nearest = (la, lo) => {
      let best = null;
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
        if (temp[i]?.[j] == null) continue;
        const d = (lat[i][j] - la) ** 2 + ((lng[i][j] - lo) * k) ** 2;
        if (!best || d < best[0]) best = [d, i, j];
      }
      return best && Math.sqrt(best[0]) * 111 < 3 ? best : null;
    };
    // Labels: above the point, else below, else left out (no overlaps).
    const placed = [];
    const free = (r) => !placed.some((p) => r[0] < p[0] + p[2] && p[0] < r[0] + r[2] && r[1] < p[1] + p[3] && p[1] < r[1] + r[3]);
    const label = (x, y, text, sub, dot) => {
      c.font = "600 12px system-ui, sans-serif";
      const w = Math.max(c.measureText(text).width, sub ? c.measureText(sub).width : 0) + 12, h = sub ? 32 : 18;
      const lx = Math.min(Math.max(x - w / 2, 2), W - w - 2);
      const ly = [y - h - 6, y + 8].find((yy) => yy >= 0 && yy + h <= H && free([lx, yy, w, h]));
      c.fillStyle = dot || "#fff"; c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); c.strokeStyle = "#000"; c.lineWidth = 1; c.stroke();
      if (ly === undefined) return;
      placed.push([lx, ly, w, h]);
      c.fillStyle = "rgba(0,0,0,.65)"; c.beginPath(); c.roundRect?.(lx, ly, w, h, 6) ?? c.rect(lx, ly, w, h); c.fill();
      c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText(text, lx + w / 2, ly + 13);
      if (sub) { c.font = "11px system-ui, sans-serif"; c.fillStyle = "#cfe6ff"; c.fillText(sub, lx + w / 2, ly + 27); }
    };
    const t = T[langOf(this._hass, this._config)];
    if (hot) label(X(lng[hot[0]][hot[1]]), Y(lat[hot[0]][hot[1]]), `${num(maxT, loc, 1)}°`, t.warmest, "#ff5a3c");
    if (cold && maxT - minT > 0.2) label(X(lng[cold[0]][cold[1]]), Y(lat[cold[0]][cold[1]]), `${num(minT, loc, 1)}°`, t.coldest, "#4fc3ff");
    (TOWNS[this._key] || []).forEach(([name, la, lo]) => {
      const n = nearest(la, lo);
      label(X(lo), Y(la), n ? `${num(temp[n[1]][n[2]], loc, 1)}°` : "", name, "#fff");
    });
    const leg = this.shadowRoot.querySelector(".legend");
    if (leg) leg.innerHTML = `<span>${num(minT, loc, 1)}°</span><div class="bar" style="background:linear-gradient(90deg,${[0, 0.25, 0.5, 0.75, 1].map((f) => this._colorRel(f)).join(",")})"></div><span>${num(maxT, loc, 1)}°</span>
      <span style="opacity:.7">· ${esc(t.depth)} ${this._depth} m · ${layer.time ? `${esc(weekday(layer.time, loc, "short"))} ${hh(layer.time, loc)}` : ""}</span>`;
  }

  // Relative color scale (stretched on the lake's own range so that small differences show).
  _colorRel(f) {
    const stops = [[0, [43, 92, 170]], [0.25, [52, 152, 205]], [0.5, [90, 200, 180]], [0.75, [245, 210, 90]], [1, [235, 95, 60]]];
    let i = stops.findIndex((s) => s[0] >= f); if (i <= 0) i = 1;
    const [f0, c0] = stops[i - 1], [f1, c1] = stops[i];
    const r = Math.max(0, Math.min(1, (f - f0) / (f1 - f0)));
    return `rgb(${c0.map((v, n) => Math.round(v + (c1[n] - v) * r)).join(",")})`;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const lang = langOf(this._hass, this._config), t = T[lang], loc = locOf(this._hass, this._config);
    if (this._error) { this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="empty">${t.unavailable}</div></ha-card>`; return; }
    if (!this._data) { this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card><div class="empty">…</div></ha-card>`; return; }
    const d = this._data;
    const name = d.names?.[lang] || d.names?.en;
    const { temp, html } = this._tiles(t, loc);
    const showMap = this._config.show_map !== false;
    const lakeOpts = (this._lakes?.lakes || []).map((l) => `<option value="${l.key}" ${l.key === this._key ? "selected" : ""}>${esc(l.names[lang] || l.names.en)}</option>`).join("");
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card>
      <div class="head"><div class="title">${esc(this._config.name || name)}<small>${num(d.altitude, loc)} m · ${num(d.area, loc, d.area < 10 ? 1 : 0)} km² · ${num(d.max_depth, loc)} m</small></div>
        <div class="big" style="color:${tempColor(temp)}">${num(temp, loc, 1)}°</div></div>
      <div class="tiles">${html}</div>
      ${showMap ? (d.map ? `<div class="sec"><h4><span>${t.map} · ${t.currents}</span><select class="lake">${lakeOpts}</select></h4>
        <div class="mapbox"><canvas></canvas><div class="tip" hidden></div></div><div class="legend"></div>
        <div class="ctl"><span>${t.now}</span><input type="range" min="-24" max="96" step="3" value="${this._offset}"><span class="when"></span>
          <select class="depth">${DEPTHS.filter((x) => x <= d.max_depth).map((x) => `<option value="${x}" ${x === this._depth ? "selected" : ""}>${x} m</option>`).join("")}</select></div></div>`
        : `<div class="sec"><h4><span>${t.map}</span><select class="lake">${lakeOpts}</select></h4><div class="empty">${t.no3d}</div></div>`) : ""}
      ${this._config.show_forecast !== false ? `<div class="sec"><h4>${t.forecast} · 1 m</h4>${this._forecastSvg(t, loc)}</div>` : ""}
      ${this._config.show_profile !== false ? `<div class="sec"><h4>${t.profile}</h4>${this._profileSvg(t, loc)}</div>` : ""}
      <div class="src">Eawag Alplakes (Simstrat${d.map ? ", 3D" : ""}) · CC BY 4.0</div></ha-card>`;
    const root = this.shadowRoot;
    root.querySelector("select.lake")?.addEventListener("change", (e) => { this._config = { ...this._config, lake: e.target.value }; this._offset = 0; this._data = null; this._render(); this._load(); });
    const range = root.querySelector("input[type=range]");
    const when = root.querySelector(".when");
    const showWhen = () => { if (when) { const dt = new Date(Date.now() + this._offset * 36e5); when.textContent = this._offset ? `${weekday(dt, loc, "short")} ${hh(dt, loc)}` : ""; } };
    showWhen();
    range?.addEventListener("input", () => { this._offset = Number(range.value); showWhen(); clearTimeout(this._deb); this._deb = setTimeout(() => this._loadLayer(), 350); });
    root.querySelector("select.depth")?.addEventListener("change", (e) => { this._depth = Number(e.target.value); this._loadLayer(); });
    const canvas = root.querySelector("canvas");
    if (canvas) {
      requestAnimationFrame(() => this._drawMap());
      const tip = root.querySelector(".tip");
      canvas.addEventListener("pointermove", (e) => {
        const pj = this._proj; if (!pj) return;
        const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
        let best = null;
        for (let i = 0; i < pj.rows; i++) for (let j = 0; j < pj.cols; j++) {
          if (pj.temp[i]?.[j] == null) continue;
          const dd = (pj.X(pj.lng[i][j]) - mx) ** 2 + (pj.Y(pj.lat[i][j]) - my) ** 2;
          if (!best || dd < best[0]) best = [dd, pj.temp[i][j]];
        }
        if (best && best[0] < 400) { tip.hidden = false; tip.style.left = `${mx}px`; tip.style.top = `${my}px`; tip.textContent = `${num(best[1], loc, 1)} °C`; } else tip.hidden = true;
      });
      canvas.addEventListener("pointerleave", () => { tip.hidden = true; });
    }
  }

  getCardSize() { return 10; }
  static getStubConfig() { return { lake: "neuchatel" }; }
  static getConfigElement() {
    return makeEditor([["name"], ["lake"], ["measures"], ["show_map", "show_forecast", "show_profile"], ["depth"], ["language"]], (hass, lang) => ({
      name: { selector: { text: {} } },
      lake: { selector: { select: { mode: "dropdown", options: LAKE_KEYS.map(([k, n]) => ({ value: k, label: n })) } } },
      measures: { selector: { select: { multiple: true, options: MEASURES.map((m) => ({ value: m, label: T[lang].measures[m] })) } } },
      show_map: { selector: { boolean: {} } }, show_forecast: { selector: { boolean: {} } }, show_profile: { selector: { boolean: {} } },
      depth: { selector: { select: { mode: "dropdown", options: DEPTHS.map((x) => ({ value: x, label: `${x} m` })) } } },
      language: { selector: { select: { mode: "dropdown", options: LANGS } } },
    }), LABELS);
  }
}

const LAKE_KEYS = [["aegeri", "Ägerisee"], ["baldegg", "Baldeggersee"], ["biel", "Bielersee / Lac de Bienne"], ["brienz", "Brienzersee"], ["constance", "Bodensee"],
  ["geneva", "Léman / Genfersee"], ["greifensee", "Greifensee"], ["gruyere", "Lac de la Gruyère"], ["hallwil", "Hallwilersee"], ["joux", "Lac de Joux"],
  ["lucerne", "Vierwaldstättersee"], ["lugano", "Lago di Lugano"], ["lungern", "Lungerersee"], ["maggiore", "Lago Maggiore"], ["murten", "Murtensee / Lac de Morat"],
  ["neuchatel", "Lac de Neuchâtel"], ["pfaffikon", "Pfäffikersee"], ["poschiavo", "Lago di Poschiavo"], ["sarnen", "Sarnersee"], ["sempach", "Sempachersee"],
  ["sils", "Silsersee"], ["silvaplana", "Silvaplanersee"], ["stmoritz", "St. Moritzersee"], ["thun", "Thunersee"], ["walensee", "Walensee"], ["zug", "Zugersee"], ["zurich", "Zürichsee"]];

define("meteoswiss-lake-card", MeteoSwissLakeCard, "MeteoSwiss lake", "A lake in color by water temperature, with currents, towns, forecast, depth profile and lake facts (Eawag Alplakes).");
