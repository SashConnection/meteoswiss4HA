// MeteoSwiss Complete For HA - line pictograms of each city's best-known monument.
//
// monument(name) returns an <svg> (viewBox 0 0 32 32, stroke = currentColor)
// for the cities of the map, or "" when there is none. Original drawings.

// ----------------------------------------------------------------- shapes
const f = (n) => +n.toFixed(1);
const ground = (x1 = 2, x2 = 30, y = 30) => `<path d="M${x1} ${y}H${x2}"/>`;

// Tower: body (x, width, top), with a roof.
function tower(x, w, top, roof = "spire", base = 30) {
  const cx = x + w / 2;
  let s = `<path d="M${x} ${base}V${top}H${x + w}V${base}"/>`;
  if (roof === "spire") s += `<path d="M${x - 0.5} ${top}L${cx} ${f(top - w * 1.6)}L${x + w + 0.5} ${top}"/>`;
  if (roof === "pyramid") s += `<path d="M${x - 0.8} ${top}L${cx} ${f(top - w * 0.8)}L${x + w + 0.8} ${top}"/>`;
  if (roof === "onion") s += `<path d="M${x + 0.5} ${top}C${x - 1} ${f(top - 2)} ${cx - 1} ${f(top - 3)} ${cx} ${f(top - 5)}C${cx + 1} ${f(top - 3)} ${x + w + 1} ${f(top - 2)} ${x + w - 0.5} ${top}M${cx} ${f(top - 5)}V${f(top - 6.5)}"/>`;
  if (roof === "dome") s += `<path d="M${x} ${top}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${top}M${cx} ${f(top - w / 2)}V${f(top - w / 2 - 2)}"/>`;
  if (roof === "crenel") {
    const n = Math.max(2, Math.round(w / 2.5)), step = w / (2 * n - 1);
    let d = `M${x} ${top}`;
    for (let i = 0; i < 2 * n - 1; i++) d += `V${i % 2 ? top : f(top - 2)}H${f(x + (i + 1) * step)}`;
    s += `<path d="${d}V${top}"/>`;
  }
  return s;
}
const clock = (cx, cy, r = 1.6) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
const door = (cx, base = 30, w = 3, h = 4) => `<path d="M${cx - w / 2} ${base}V${base - h + w / 2}A${w / 2} ${w / 2} 0 0 1 ${cx + w / 2} ${base - h + w / 2}V${base}"/>`;
const win = (x, y, w = 1.6, h = 2.4) => `<path d="M${x} ${y + h}V${y + w / 2}A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2}V${y + h}"/>`;
const peaks = (pts) => `<path d="M${pts.map((p) => p.join(" ")).join("L")}"/>`;
const water = (y = 30, x1 = 3, x2 = 29) => {
  let d = `M${x1} ${y}`;
  for (let x = x1; x < x2; x += 4) d += `q1 -1.2 2 0t2 0`;
  return `<path d="${d}"/>`;
};

// ---------------------------------------------------------------- monuments
// key: city name without accents, lower case.
const M = {
  // Zytglogge: clock tower with a steep roof and a little bell turret.
  bern: tower(11, 10, 13, "pyramid") + `<path d="M16 9V5.5M14.8 7.5h2.4"/>` + clock(16, 17, 2.2) + door(16) + ground(),
  // Grossmünster: twin towers with domed tops.
  zurich: tower(7, 6, 11, "dome") + tower(19, 6, 11, "dome") + `<path d="M13 30V17H19M13 17l3-3 3 3"/>` + win(9.2, 14) + win(21.2, 14) + door(16) + ground(),
  // Jet d'eau on the lake.
  geneve: `<path d="M16 28C16 18 15.5 10 16 3"/><path d="M16 3C13 8 11 14 10.5 22M16 3c3 5 4.5 11 5 19"/><path d="M14 27c1-1 3-1 4 0"/>` + water(29.5),
  // Basler Münster: two slender towers on a red sandstone church.
  basel: tower(8, 5, 13, "spire") + tower(19, 5, 13, "spire") + `<path d="M13 30V18H19"/>` + win(9.7, 17) + win(20.7, 17) + door(16) + ground(),
  // Kapellbrücke with the Wasserturm.
  luzern: tower(20, 6, 14, "pyramid", 27) + `<path d="M2 24H20M26 24H30M2 21L20 18M26 18L30 21"/><path d="M5 24v3M10 24v3M15 24v3M28 24v3"/>` + water(29.5),
  // Cathédrale de Lausanne: tall belfry and a smaller lantern tower.
  lausanne: tower(18, 7, 12, "spire") + tower(9, 5, 17, "pyramid") + `<path d="M14 30V20H18"/>` + win(20.7, 16) + door(21.5) + ground(),
  // Valère and Tourbillon on their two hills.
  sion: `<path d="M2 30C5 22 8 20 11 20S16 24 17 26C19 20 23 16 26 16S30 22 31 30"/>` + tower(8, 4, 17, "pyramid", 20.5) + tower(23, 5, 12, "crenel", 16.5) + `<path d="M12 20.5V18H8"/>`,
  // Monte San Salvatore above the lake.
  lugano: peaks([[3, 26], [12, 12], [15, 7], [18, 11], [29, 26]]) + `<path d="M14.2 8.2L15 5.5L15.8 8.2"/><path d="M8 26L15.5 9" stroke-dasharray="1.5 1.5"/><path d="M10 19.5l2.5 1-1 2.3-2.5-1z"/>` + water(29.5),
  // Stiftskirche St. Gallen: twin baroque towers with onion domes.
  "st gallen": tower(8, 5, 14, "onion") + tower(19, 5, 14, "onion") + `<path d="M13 30V19H19"/>` + clock(10.5, 17, 1.2) + clock(21.5, 17, 1.2) + door(16) + ground(),
  // Leaning tower of St. Moritz.
  "st moritz": `<path d="M13 30L16.5 9L21.5 10L19 30"/><path d="M16.5 9L19.5 5L21.5 10"/>` + win(16.6, 14) + win(16.1, 19) + ground(8, 26),
  // Cathedral of Chur on the hill.
  chur: tower(17, 6, 12, "spire", 26) + `<path d="M8 26V19H17M8 19l4.5-3.5L17 19"/>` + win(19.2, 16) + `<path d="M2 30C8 26 24 26 30 30"/>`,
  // Engstligenfälle waterfall between cliffs.
  adelboden: `<path d="M3 30V10L9 6V30M23 30V8L29 11V30"/><path d="M11 8C13 14 12 22 13 30M15 8C17 15 16 23 17 30M19 8C20 14 20 22 21 30"/><path d="M9 6H23"/>`,
  // Telldenkmal: Tell with his crossbow and son.
  altdorf: `<circle cx="13" cy="7" r="2"/><path d="M13 9V19L11 28M13 19L15 28M13 12L18 9M18 6V12M10 13L13 11"/><circle cx="20" cy="17" r="1.5"/><path d="M20 18.5V24L19 28M20 24L21 28"/>` + `<path d="M8 30H25V28H8Z"/>`,
  // Faido: Leventina bell tower (Lombard style).
  faido: tower(13, 6, 10, "pyramid") + win(15.2, 13) + win(15.2, 18) + `<path d="M7 30V22H13M19 22H25V30"/>` + ground(),
  // Glärnisch above the town church.
  glarus: peaks([[2, 22], [9, 10], [13, 14], [18, 6], [24, 13], [30, 20]]) + tower(14, 4, 22, "spire") + `<path d="M8 30V25H14M18 25H24V30"/>` + ground(),
  // Munot: round fortress with its tower.
  schaffhausen: `<path d="M5 30V20H27V30"/><path d="M5 20V18H7V20M9 20V18H11V20M13 20V18H15V20M17 20V18H19V20M21 20V18H23V20M25 20V18H27V20"/>` + tower(13, 6, 10, "pyramid", 20) + win(15.2, 12) + door(16, 30, 4, 5),
  // St. Ursen cathedral: dome and bell tower.
  solothurn: `<path d="M4 30V20H22V30M8 20A5 5 0 0 1 18 20M13 15V13"/>` + tower(22, 6, 11, "dome") + win(24.2, 14) + door(13) + ground(),
  // Château and Collégiale de Neuchâtel.
  neuchatel: tower(19, 6, 10, "spire", 24) + `<path d="M4 24V18H19M25 24H29V19L27 16.5L25 19"/><path d="M4 18L8 14L12 18"/>` + win(21.2, 14) + `<path d="M2 30C8 26 24 26 30 30"/>`,
  // Cathédrale Saint-Nicolas de Fribourg: square tower with pinnacles.
  fribourg: `<path d="M11 30V9H21V30"/><path d="M11 9L11.8 6.5L12.6 9M19.4 9L20.2 6.5L21 9M14 9L16 4.5L18 9"/>` + win(13, 12) + win(17.4, 12) + door(16) + `<path d="M4 30V21H11M21 21H28V30"/>`,
  // Porte au Loup, Delémont.
  delemont: tower(10, 12, 12, "pyramid") + `<path d="M13.5 30V24A2.5 2.5 0 0 1 18.5 24V30"/>` + clock(16, 16, 1.8) + `<path d="M3 30V22H10M22 22H29V30"/>`,
  // Castelgrande, Bellinzona: two towers and the wall.
  bellinzona: `<path d="M2 30C6 25 26 25 30 30"/>` + tower(7, 5, 10, "crenel", 26) + tower(18, 6, 14, "crenel", 26) + `<path d="M12 26V20H18M24 20H29V26"/><path d="M24 20V18.5H25.5V20M27 20V18.5H28.5V20"/>`,
  // Madonna del Sasso on its rock.
  locarno: `<path d="M3 30C5 24 9 21 13 21L20 22C24 23 27 26 29 30"/>` + `<path d="M10 21V15H18V21M10 15L14 12L18 15"/>` + tower(18, 4, 13, "dome", 22) + water(31.5, 3, 29),
  // Davos: Jakobshorn with a cable car.
  davos: peaks([[2, 30], [12, 12], [16, 15], [22, 6], [30, 18]]) + `<path d="M5 27L22 7"/><path d="M11 20h3v3h-3z"/>`,
  // Stockalperpalast: three towers with onion domes.
  brig: tower(4, 5, 15, "onion") + tower(13.5, 5, 13, "onion") + tower(23, 5, 15, "onion") + `<path d="M9 30V20H13.5M18.5 20H23"/>` + win(15.2, 17) + ground(),
  // Obertor, Aarau.
  aarau: tower(11, 10, 11, "pyramid") + `<path d="M14 30V24A2 2 0 0 1 18 24V30"/>` + clock(16, 16, 2) + `<path d="M3 30V23H11M21 23H29V30"/>`,
  // Schloss Thun: keep with four corner turrets.
  thun: `<path d="M9 30V12H23V30"/>` + `<path d="M8 12L10 7.5L12 12M20 12L22 7.5L24 12M12 12L16 6L20 12"/>` + win(12, 16) + win(18.4, 16) + door(16) + `<path d="M2 30C5 27 27 27 30 30"/>`,
  // Winterthur: town church with twin towers.
  winterthur: tower(9, 5, 11, "pyramid") + tower(18, 5, 11, "pyramid") + `<path d="M14 30V18H18"/>` + clock(11.5, 15, 1.2) + clock(20.5, 15, 1.2) + door(16) + ground(),
  // Interlaken: Jungfrau above the lakes.
  interlaken: peaks([[2, 26], [8, 14], [11, 17], [17, 5], [21, 11], [24, 9], [30, 22]]) + `<path d="M15 8.5L17 5L19 8.5"/>` + water(29.5),
  // Matterhorn.
  zermatt: peaks([[3, 30], [13, 13], [16, 5], [19.5, 9], [21, 16], [29, 30]]) + `<path d="M14.5 9.5L16 5L17.5 7.5"/>`,
  // Schloss Frauenfeld: keep on the rock.
  frauenfeld: tower(13, 8, 9, "crenel", 24) + `<path d="M8 24V18H13M21 18H25V24"/>` + win(15.6, 12) + `<path d="M3 30C6 25 26 25 29 30"/>`,
  // Schloss Tarasp above Scuol.
  scuol: `<path d="M2 30C6 22 10 18 16 17S26 22 30 30"/>` + tower(14, 5, 8, "pyramid", 17) + `<path d="M9 17V13H14M19 13H23V17"/>` + win(15.7, 11),
};
// Summits share a simple peak.
const PEAK = peaks([[3, 28], [12, 11], [16, 6], [21, 12], [29, 28]]) + `<path d="M13.5 9L16 6L18.5 9.5"/>`;
const MOUNTAINS = ["santis", "pilatus", "titlis", "eiger", "galenstock", "matterhorn", "monte leone", "piz bernina", "chasseral", "wildhorn", "monte generoso"];

export const monumentKey = (name) =>
  String(name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\./g, "").replace(/\s*\(.*\)$/, "").trim().toLowerCase();

export function monument(name, extra = "") {
  const key = monumentKey(name);
  const body = M[key] || (MOUNTAINS.includes(key) ? (key === "matterhorn" ? M.zermatt : PEAK) : "");
  if (!body) return "";
  return `<svg class="monument" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</svg>`;
}

export const MONUMENT_NAMES = Object.keys(M);
