// Builds meteoswiss-radar-flow.json (importable Node-RED flow) from the
// function bodies below. Run: node nodered/build-flow.cjs
const fs = require("fs");
const path = require("path");

const items = `// Radar frames of the last 3 hours: read the list of published files (STAC item
// of the day, and of yesterday when the window crosses midnight UTC). File names
// end with a letter code that MeteoSwiss changes now and then (vl, tl, fl...),
// so they are taken from the list instead of being guessed.
const KEEP = 36;            // frames kept (3 hours)
const DELAY_MIN = 7;        // publication delay
flow.set("radarLastRun", new Date().toISOString());
const last = Math.floor((Date.now() - DELAY_MIN * 60000) / 300000) * 300000;
const first = last - (KEEP - 1) * 300000;
const days = [...new Set([last, first].map((t) => new Date(t).toISOString().slice(0, 10).split("-").join("")))];
return [days.map((d) => ({
    url: "https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-radar-precip/items/" + d + "-ch",
    last, keep: KEEP,
}))];`;

const missing = `// Frames of the window not yet converted, from the published files of one day.
// rzc<YY><day of year><HHMM><code>.001.h5 (UTC); "vl" is preferred when a time
// has several versions.
const frames = flow.get("radarFrames") || {};
const assets = (msg.payload && msg.payload.assets) || {};
const byTime = {};
for (const name of Object.keys(assets)) {
    const m = /^rzc(\\d{2})(\\d{3})(\\d{2})(\\d{2})([a-z]{2})\\.001\\.h5$/.exec(name);
    if (!m) continue;
    const t = Date.UTC(2000 + Number(m[1]), 0, 1) + (Number(m[2]) - 1) * 86400000 + Number(m[3]) * 3600000 + Number(m[4]) * 60000;
    const iso = new Date(t).toISOString().slice(0, 16) + ":00Z";
    if (!byTime[iso] || m[5] === "vl") byTime[iso] = assets[name].href;
}
const wanted = [];
for (let i = 0; i < msg.keep; i++) wanted.push(new Date(msg.last - i * 300000).toISOString().slice(0, 16) + ":00Z");
for (const iso of wanted) {
    if (frames[iso] || !byTime[iso]) continue;
    node.send({ url: byTime[iso], time: iso });
}
// Forget frames older than the window.
for (const k of Object.keys(frames)) if (!wanted.includes(k)) delete frames[k];
flow.set("radarFrames", frames);
node.status({ fill: "green", shape: "dot", text: Object.keys(frames).length + " frames" });
return null;`;

const render = `// MeteoSwiss radar (RZC, ODIM HDF5) -> transparent PNG in Web Mercator.
flow.set("radarLastDownload", { time: msg.time, status: msg.statusCode, bytes: msg.payload && msg.payload.length });
if (msg.statusCode !== 200 || !Buffer.isBuffer(msg.payload)) return null; // not published yet
const BOUNDS = [[45.6, 5.7], [48.0, 10.8]];
const WIDTH = 800;
const COLORS = [
  [40, 255, 25, 0], [20, 255, 125, 1], [10, 255, 199, 3], [6, 254, 255, 1],
  [4, 5, 255, 5], [2, 5, 140, 45], [1, 0, 1, 252], [0.1, 154, 126, 149],
];
function toLv95(lat, lon) {
  const p = (lat * 3600 - 169028.66) / 10000, l = (lon * 3600 - 26782.5) / 10000;
  return [2600072.37 + 211455.93 * l - 10938.51 * l * p - 0.36 * l * p * p - 44.54 * l ** 3,
          1200147.07 + 308807.95 * p + 3745.25 * l * l + 76.63 * p * p - 194.56 * l * l * p + 119.79 * p ** 3];
}
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const buf = msg.payload;
const file = new hdf5.File(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), "rzc.h5");
const ds = file.get("dataset1/data1/data");
const [rows, cols] = ds.shape;
const grid = ds.value;
const scale = Number(file.get("where").attrs.xscale) || 1000;
const e0 = 2255000, n1 = 840000 + rows * scale;
const [[s, w], [nLat, eLon]] = BOUNDS;
const y0 = mercY(nLat), y1 = mercY(s);
const height = Math.round((WIDTH * (y0 - y1)) / (((eLon - w) * Math.PI) / 180));
const png = new pngjs.PNG({ width: WIDTH, height });
for (let py = 0; py < height; py++) {
  const lat = (Math.atan(Math.sinh(y0 + ((y1 - y0) * (py + 0.5)) / height)) * 180) / Math.PI;
  for (let px = 0; px < WIDTH; px++) {
    const [e, n] = toLv95(lat, w + ((eLon - w) * (px + 0.5)) / WIDTH);
    const c = Math.floor((e - e0) / scale), r = Math.floor((n1 - n) / scale);
    const i = (py * WIDTH + px) * 4;
    png.data[i + 3] = 0;
    if (c < 0 || c >= cols || r < 0 || r >= rows) continue;
    const v = grid[r * cols + c];
    if (!(v >= 0.1)) continue;
    const k = COLORS.find((x) => v >= x[0]);
    png.data[i] = k[1]; png.data[i + 1] = k[2]; png.data[i + 2] = k[3]; png.data[i + 3] = 215;
  }
}
const frames = flow.get("radarFrames") || {};
frames[msg.time] = pngjs.PNG.sync.write(png).toString("base64");
flow.set("radarFrames", frames);
flow.set("radarBounds", BOUNDS);
node.status({ fill: "green", shape: "dot", text: Object.keys(frames).length + " frames, last " + msg.time.slice(11, 16) + " UTC" });
return null;`;

const list = `// List available frames (oldest first): radar (past) and forecast (future).
const frames = flow.get("radarFrames") || {};
const cutoff = new Date(Date.now() - 3600000).toISOString();
msg.payload = {
    source: "MeteoSwiss (RZC radar composite, local forecast)",
    bounds: flow.get("radarBounds") || [[45.6, 5.7], [48.0, 10.8]],
    frames: Object.keys(frames).sort(),
    forecast: Object.keys(flow.get("fcFrames") || {}).filter((t) => t > cutoff).sort(),
    forecastRun: flow.get("fcRun") || null,
};
return msg;`;

// ---------------------------------------------------------------- forecast
// Hourly precipitation of the MeteoSwiss local forecast (~5800 points),
// interpolated into images for the next hours. The file (rre150h0, ~32 MB)
// is sorted by point, so it is read entirely; this runs every 3 hours.

const fcRun = `// Find the latest local forecast run (STAC item of today, else yesterday).
const back = msg.stage === "stac-yesterday" ? 86400000 : 0;
const day = new Date(Date.now() - back).toISOString().slice(0, 10).split("-").join("");
msg.url = "https://data.geo.admin.ch/api/stac/v1/collections/ch.meteoschweiz.ogd-local-forecasting/items/" + day + "-ch";
msg.stage = msg.stage || "stac";
return msg;`;

const fcPick = `// Output 1: retry with yesterday's item. Output 2: download points / CSV.
const assets = (msg.payload && msg.payload.assets) || {};
const names = Object.keys(assets).filter((k) => k.endsWith(".rre150h0.csv")).sort();
if (!names.length) {
    if (msg.stage === "stac") { msg.stage = "stac-yesterday"; return [msg, null]; }
    node.status({ fill: "red", shape: "ring", text: "no forecast run found" });
    return null;
}
const name = names[names.length - 1];
msg.run = name.split(".")[2];
msg.csv = assets[name].href;
const today = new Date().toISOString().slice(0, 10);
if (!flow.get("fcPoints") || flow.get("fcPointsDay") !== today) {
    msg.stage = "points";
    msg.url = "https://data.geo.admin.ch/ch.meteoschweiz.ogd-local-forecasting/ogd-local-forecasting_meta_point.csv";
} else {
    msg.stage = "csv";
    msg.url = msg.csv;
}
node.status({ fill: "blue", shape: "dot", text: "run " + msg.run });
return [null, msg];`;

const fcRoute = `// Output 1: back to the download (points done, now the CSV). Output 2: render.
if (msg.statusCode !== 200 || !Buffer.isBuffer(msg.payload)) {
    node.status({ fill: "red", shape: "ring", text: msg.stage + " HTTP " + msg.statusCode });
    return null;
}
if (msg.stage !== "points") return [null, msg];
// ogd-local-forecasting_meta_point.csv -> { "id;type": [lat, lon] }
const lines = msg.payload.toString("latin1").split(String.fromCharCode(10));
const head = lines[0].trim().split(";");
const iId = head.indexOf("point_id"), iT = head.indexOf("point_type_id");
const iLat = head.indexOf("point_coordinates_wgs84_lat"), iLon = head.indexOf("point_coordinates_wgs84_lon");
const pts = {};
for (let k = 1; k < lines.length; k++) {
    const c = lines[k].trim().split(";");
    const lat = parseFloat(c[iLat]), lon = parseFloat(c[iLon]);
    if (c[iId] && !isNaN(lat) && !isNaN(lon)) pts[c[iId] + ";" + c[iT]] = [lat, lon];
}
flow.set("fcPoints", pts);
flow.set("fcPointsDay", new Date().toISOString().slice(0, 10));
msg.stage = "csv";
msg.url = msg.csv;
return [msg, null];`;

const fcRender = `// Interpolate the hourly precipitation of all points into one PNG per hour.
const HOURS = 12;
const BOUNDS = [[45.6, 5.7], [48.0, 10.8]];
const WIDTH = 400;            // the map scales it up smoothly
const RADIUS_KM = 9;          // influence radius of a forecast point
const COLORS = [
  [40, 255, 25, 0], [20, 255, 125, 1], [10, 255, 199, 3], [6, 254, 255, 1],
  [4, 5, 255, 5], [2, 5, 140, 45], [1, 0, 1, 252], [0.1, 154, 126, 149],
];
const points = flow.get("fcPoints") || {};
const pad = (n) => String(n).padStart(2, "0");
const stamp = (d) => d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + pad(d.getUTCHours()) + "00";
// Values are sums over the hour ending at the timestamp: next full hours.
const first = new Date(Math.ceil(Date.now() / 3600000) * 3600000);
const wanted = [];
for (let k = 0; k < HOURS; k++) wanted.push(stamp(new Date(first.getTime() + k * 3600000)));
const from = wanted[0], to = wanted[wanted.length - 1];

// Scan the CSV buffer line by line, keeping only the wanted hours.
const buf = msg.payload;
const hours = {};
for (const h of wanted) hours[h] = {};
let start = buf.indexOf(10) + 1;
while (start > 0 && start < buf.length) {
  let end = buf.indexOf(10, start);
  if (end < 0) end = buf.length;
  const s1 = buf.indexOf(59, start), s2 = buf.indexOf(59, s1 + 1), s3 = buf.indexOf(59, s2 + 1);
  if (s1 > 0 && s3 > 0 && s3 < end) {
    const t = buf.toString("latin1", s2 + 1, s3);
    if (t >= from && t <= to && hours[t]) {
      const v = parseFloat(buf.toString("latin1", s3 + 1, end));
      if (v > 0) hours[t][buf.toString("latin1", start, s2)] = v;
    }
  }
  start = end + 1;
}

const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const [[s, w], [n, e]] = BOUNDS;
const y0 = mercY(n), y1 = mercY(s);
const height = Math.round((WIDTH * (y0 - y1)) / (((e - w) * Math.PI) / 180));
const r2max = RADIUS_KM * RADIUS_KM;
const BIN = 0.1;
const frames = {};
for (const h of wanted) {
  // Spatial bins with every point (dry points count as 0 and stop the rain).
  const bins = new Map();
  for (const key in points) {
    const [lat, lon] = points[key];
    const k = Math.floor(lat / BIN) + ":" + Math.floor(lon / BIN);
    if (!bins.has(k)) bins.set(k, []);
    bins.get(k).push([lat, lon, hours[h][key] || 0]);
  }
  const png = new pngjs.PNG({ width: WIDTH, height });
  for (let py = 0; py < height; py++) {
    const lat = (Math.atan(Math.sinh(y0 + ((y1 - y0) * (py + 0.5)) / height)) * 180) / Math.PI;
    const kx = 111.32 * Math.cos((lat * Math.PI) / 180);
    const by = Math.floor(lat / BIN);
    for (let px = 0; px < WIDTH; px++) {
      const lon = w + ((e - w) * (px + 0.5)) / WIDTH;
      const bx = Math.floor(lon / BIN);
      let sw = 0, sv = 0, near = Infinity;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const list = bins.get((by + dy) + ":" + (bx + dx));
        if (!list) continue;
        for (const [plat, plon, v] of list) {
          const ddy = (plat - lat) * 111.32, ddx = (plon - lon) * kx;
          const d2 = ddx * ddx + ddy * ddy;
          if (d2 > r2max) continue;
          if (d2 < near) near = d2;
          const wgt = 1 / (d2 + 1);
          sw += wgt; sv += wgt * v;
        }
      }
      const i = (py * WIDTH + px) * 4;
      png.data[i + 3] = 0;
      if (!sw) continue;
      const v = sv / sw;
      if (v < 0.1) continue;
      const k = COLORS.find((x) => v >= x[0]);
      png.data[i] = k[1]; png.data[i + 1] = k[2]; png.data[i + 2] = k[3];
      png.data[i + 3] = Math.round(200 * Math.min(1, Math.max(0, (r2max - near) / (r2max * 0.5))));
    }
  }
  const iso = h.slice(0, 4) + "-" + h.slice(4, 6) + "-" + h.slice(6, 8) + "T" + h.slice(8, 10) + ":00:00Z";
  frames[iso] = pngjs.PNG.sync.write(png).toString("base64");
  await new Promise((r) => setTimeout(r, 20)); // let other flows breathe
}
flow.set("fcFrames", frames);
flow.set("fcRun", msg.run);
flow.set("fcUpdated", new Date().toISOString());
node.status({ fill: "green", shape: "dot", text: Object.keys(frames).length + " forecast frames, run " + msg.run.slice(8, 10) + ":00 UTC" });
return null;`;

const image = `// One frame as PNG: ?time=2026-11-09T11:30:00Z (radar or forecast)
const frames = flow.get("radarFrames") || {};
const data = frames[msg.req.query.time] || (flow.get("fcFrames") || {})[msg.req.query.time];
if (!data) {
    msg.statusCode = 404;
    msg.payload = "unknown frame";
    return msg;
}
msg.payload = Buffer.from(data, "base64");
msg.headers = { "Content-Type": "image/png", "Cache-Control": "max-age=3600" };
return msg;`;

const errors = `// Keep the last errors of this tab for the status endpoint.
const errors = flow.get("radarErrors") || [];
errors.unshift({ at: new Date().toISOString(), node: msg.error && msg.error.source && msg.error.source.name, message: msg.error && msg.error.message });
flow.set("radarErrors", errors.slice(0, 5));
return null;`;

const status = `// Diagnostics: last run, last download, frames and errors.
msg.payload = {
    lastRun: flow.get("radarLastRun") || null,
    lastDownload: flow.get("radarLastDownload") || null,
    frames: Object.keys(flow.get("radarFrames") || {}).length,
    forecastRun: flow.get("fcRun") || null,
    forecastUpdated: flow.get("fcUpdated") || null,
    forecastFrames: Object.keys(flow.get("fcFrames") || {}).length,
    errors: flow.get("radarErrors") || [],
};
return msg;`;

const libs = [{ var: "hdf5", module: "jsfive" }, { var: "pngjs", module: "pngjs" }];
const tab = "f1a7c0de5ad40001";
const nodes = [
  { id: tab, type: "tab", label: "MeteoSwiss radar", info: "Converts the MeteoSwiss precipitation radar (Open Data, RZC) into transparent PNG frames for the MeteoSwiss Complete For HA map.\n\nEndpoints:\n- GET /meteoswiss/radar/frames\n- GET /meteoswiss/radar/frame?time=...\n- GET /meteoswiss/radar/status (diagnostics)" },
  { id: "f1a7c0de5ad40002", z: tab, type: "inject", name: "every 5 min", repeat: "300", once: true, onceDelay: "10", topic: "", payload: "", payloadType: "date", props: [{ p: "payload" }], x: 140, y: 80, wires: [["f1a7c0de5ad40019"]] },
  { id: "f1a7c0de5ad40019", z: tab, type: "function", name: "published files", func: items, outputs: 1, libs: [], x: 310, y: 40, wires: [["f1a7c0de5ad4001a"]] },
  { id: "f1a7c0de5ad4001a", z: tab, type: "http request", name: "STAC radar item", method: "GET", ret: "obj", paytoqs: "ignore", url: "", tls: "", persist: false, proxy: "", insecureHTTPParser: false, authType: "", senderr: false, headers: [], x: 500, y: 40, wires: [["f1a7c0de5ad40003"]] },
  { id: "f1a7c0de5ad40003", z: tab, type: "function", name: "missing frames", func: missing, outputs: 1, libs: [], x: 330, y: 80, wires: [["f1a7c0de5ad40004"]] },
  { id: "f1a7c0de5ad40004", z: tab, type: "http request", name: "download HDF5", method: "GET", ret: "bin", paytoqs: "ignore", url: "", tls: "", persist: false, proxy: "", insecureHTTPParser: false, authType: "", senderr: false, headers: [], x: 530, y: 80, wires: [["f1a7c0de5ad40005"]] },
  { id: "f1a7c0de5ad40005", z: tab, type: "function", name: "render PNG", func: render, outputs: 1, libs, x: 720, y: 80, wires: [[]] },
  { id: "f1a7c0de5ad40006", z: tab, type: "http in", name: "", url: "/meteoswiss/radar/frames", method: "get", upload: false, swaggerDoc: "", x: 190, y: 180, wires: [["f1a7c0de5ad40007"]] },
  { id: "f1a7c0de5ad40007", z: tab, type: "function", name: "list frames", func: list, outputs: 1, libs: [], x: 430, y: 180, wires: [["f1a7c0de5ad40008"]] },
  { id: "f1a7c0de5ad40008", z: tab, type: "http response", name: "", statusCode: "", headers: {}, x: 610, y: 180, wires: [] },
  { id: "f1a7c0de5ad40009", z: tab, type: "http in", name: "", url: "/meteoswiss/radar/frame", method: "get", upload: false, swaggerDoc: "", x: 190, y: 240, wires: [["f1a7c0de5ad4000a"]] },
  { id: "f1a7c0de5ad4000a", z: tab, type: "function", name: "frame PNG", func: image, outputs: 1, libs: [], x: 430, y: 240, wires: [["f1a7c0de5ad4000b"]] },
  { id: "f1a7c0de5ad4000b", z: tab, type: "http response", name: "", statusCode: "", headers: {}, x: 610, y: 240, wires: [] },
  { id: "f1a7c0de5ad4000c", z: tab, type: "catch", name: "errors", scope: null, uncaught: false, x: 140, y: 320, wires: [["f1a7c0de5ad4000d"]] },
  { id: "f1a7c0de5ad4000d", z: tab, type: "function", name: "remember error", func: errors, outputs: 1, libs: [], x: 330, y: 320, wires: [[]] },
  { id: "f1a7c0de5ad4000e", z: tab, type: "http in", name: "", url: "/meteoswiss/radar/status", method: "get", upload: false, swaggerDoc: "", x: 190, y: 380, wires: [["f1a7c0de5ad4000f"]] },
  { id: "f1a7c0de5ad4000f", z: tab, type: "function", name: "status", func: status, outputs: 1, libs: [], x: 430, y: 380, wires: [["f1a7c0de5ad40010"]] },
  { id: "f1a7c0de5ad40010", z: tab, type: "http response", name: "", statusCode: "", headers: {}, x: 610, y: 380, wires: [] },
  { id: "f1a7c0de5ad40011", z: tab, type: "comment", name: "Precipitation forecast (local forecast, next 12 hours)", info: "", x: 230, y: 460, wires: [] },
  { id: "f1a7c0de5ad40012", z: tab, type: "inject", name: "every 3 h", repeat: "10800", once: true, onceDelay: "30", topic: "", payload: "", payloadType: "date", props: [{ p: "payload" }], x: 130, y: 520, wires: [["f1a7c0de5ad40013"]] },
  { id: "f1a7c0de5ad40013", z: tab, type: "function", name: "forecast run", func: fcRun, outputs: 1, libs: [], x: 300, y: 520, wires: [["f1a7c0de5ad40014"]] },
  { id: "f1a7c0de5ad40014", z: tab, type: "http request", name: "STAC item", method: "GET", ret: "obj", paytoqs: "ignore", url: "", tls: "", persist: false, proxy: "", insecureHTTPParser: false, authType: "", senderr: false, headers: [], x: 470, y: 520, wires: [["f1a7c0de5ad40015"]] },
  { id: "f1a7c0de5ad40015", z: tab, type: "function", name: "pick run", func: fcPick, outputs: 2, libs: [], x: 630, y: 520, wires: [["f1a7c0de5ad40013"], ["f1a7c0de5ad40016"]] },
  { id: "f1a7c0de5ad40016", z: tab, type: "http request", name: "download points / CSV", method: "GET", ret: "bin", paytoqs: "ignore", url: "", tls: "", persist: false, proxy: "", insecureHTTPParser: false, authType: "", senderr: false, headers: [], x: 330, y: 600, wires: [["f1a7c0de5ad40017"]] },
  { id: "f1a7c0de5ad40017", z: tab, type: "function", name: "route forecast", func: fcRoute, outputs: 2, libs: [], x: 540, y: 600, wires: [["f1a7c0de5ad40016"], ["f1a7c0de5ad40018"]] },
  { id: "f1a7c0de5ad40018", z: tab, type: "function", name: "render forecast", func: fcRender, outputs: 1, libs: [{ var: "pngjs", module: "pngjs" }], x: 740, y: 600, wires: [[]] },
];
fs.writeFileSync(path.join(__dirname, "meteoswiss-radar-flow.json"), JSON.stringify(nodes, null, 2) + "\n");
console.log("written", nodes.length, "nodes");
