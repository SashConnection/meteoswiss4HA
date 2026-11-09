// Builds meteoswiss-radar-flow.json (importable Node-RED flow) from the
// function bodies below. Run: node nodered/build-flow.cjs
const fs = require("fs");
const path = require("path");

const missing = `// Radar frames of the last hour (one every 5 minutes) not yet converted.
// File names are predictable: rzc<YY><day of year><HHMM>vl.001.h5 (UTC).
const KEEP = 12;            // frames kept (1 hour)
const DELAY_MIN = 7;        // publication delay
const frames = flow.get("radarFrames") || {};
const now = Date.now() - DELAY_MIN * 60000;
const last = Math.floor(now / 300000) * 300000;
const pad = (n, l = 2) => String(n).padStart(l, "0");
const wanted = [];
for (let i = 0; i < KEEP; i++) {
    const t = new Date(last - i * 300000);
    const iso = t.toISOString().slice(0, 16) + ":00Z";
    wanted.push(iso);
    if (frames[iso]) continue;
    const start = Date.UTC(t.getUTCFullYear(), 0, 0);
    const doy = Math.floor((t - start) / 86400000);
    const day = t.getUTCFullYear() + pad(t.getUTCMonth() + 1) + pad(t.getUTCDate());
    const name = "rzc" + pad(t.getUTCFullYear() % 100) + pad(doy, 3) + pad(t.getUTCHours()) + pad(t.getUTCMinutes()) + "vl.001.h5";
    node.send({ url: "https://data.geo.admin.ch/ch.meteoschweiz.ogd-radar-precip/" + day + "-ch/" + name, time: iso });
}
// Forget frames older than the window.
for (const k of Object.keys(frames)) if (!wanted.includes(k)) delete frames[k];
flow.set("radarFrames", frames);
node.status({ fill: "green", shape: "dot", text: Object.keys(frames).length + " frames" });
return null;`;

const render = `// MeteoSwiss radar (RZC, ODIM HDF5) -> transparent PNG in Web Mercator.
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

const list = `// List available frames (oldest first).
const frames = flow.get("radarFrames") || {};
msg.payload = {
    source: "MeteoSwiss (RZC radar composite)",
    bounds: flow.get("radarBounds") || [[45.6, 5.7], [48.0, 10.8]],
    frames: Object.keys(frames).sort(),
};
return msg;`;

const image = `// One frame as PNG: ?time=2026-11-09T11:30:00Z
const frames = flow.get("radarFrames") || {};
const data = frames[msg.req.query.time];
if (!data) {
    msg.statusCode = 404;
    msg.payload = "unknown frame";
    return msg;
}
msg.payload = Buffer.from(data, "base64");
msg.headers = { "Content-Type": "image/png", "Cache-Control": "max-age=3600" };
return msg;`;

const libs = [{ var: "hdf5", module: "jsfive" }, { var: "pngjs", module: "pngjs" }];
const tab = "f1a7c0de5ad40001";
const nodes = [
  { id: tab, type: "tab", label: "MeteoSwiss radar", info: "Converts the MeteoSwiss precipitation radar (Open Data, RZC) into transparent PNG frames for the MeteoSwiss Complete For HA map.\n\nEndpoints:\n- GET /meteoswiss/radar/frames\n- GET /meteoswiss/radar/frame?time=..." },
  { id: "f1a7c0de5ad40002", z: tab, type: "inject", name: "every 5 min", repeat: "300", once: true, onceDelay: "10", topic: "", payload: "", payloadType: "date", props: [{ p: "payload" }], x: 140, y: 80, wires: [["f1a7c0de5ad40003"]] },
  { id: "f1a7c0de5ad40003", z: tab, type: "function", name: "missing frames", func: missing, outputs: 1, libs: [], x: 330, y: 80, wires: [["f1a7c0de5ad40004"]] },
  { id: "f1a7c0de5ad40004", z: tab, type: "http request", name: "download HDF5", method: "GET", ret: "bin", paytoqs: "ignore", url: "", tls: "", persist: false, proxy: "", insecureHTTPParser: false, authType: "", senderr: false, headers: [], x: 530, y: 80, wires: [["f1a7c0de5ad40005"]] },
  { id: "f1a7c0de5ad40005", z: tab, type: "function", name: "render PNG", func: render, outputs: 1, libs, x: 720, y: 80, wires: [[]] },
  { id: "f1a7c0de5ad40006", z: tab, type: "http in", name: "", url: "/meteoswiss/radar/frames", method: "get", upload: false, swaggerDoc: "", x: 190, y: 180, wires: [["f1a7c0de5ad40007"]] },
  { id: "f1a7c0de5ad40007", z: tab, type: "function", name: "list frames", func: list, outputs: 1, libs: [], x: 430, y: 180, wires: [["f1a7c0de5ad40008"]] },
  { id: "f1a7c0de5ad40008", z: tab, type: "http response", name: "", statusCode: "", headers: {}, x: 610, y: 180, wires: [] },
  { id: "f1a7c0de5ad40009", z: tab, type: "http in", name: "", url: "/meteoswiss/radar/frame", method: "get", upload: false, swaggerDoc: "", x: 190, y: 240, wires: [["f1a7c0de5ad4000a"]] },
  { id: "f1a7c0de5ad4000a", z: tab, type: "function", name: "frame PNG", func: image, outputs: 1, libs: [], x: 430, y: 240, wires: [["f1a7c0de5ad4000b"]] },
  { id: "f1a7c0de5ad4000b", z: tab, type: "http response", name: "", statusCode: "", headers: {}, x: 610, y: 240, wires: [] },
];
fs.writeFileSync(path.join(__dirname, "meteoswiss-radar-flow.json"), JSON.stringify(nodes, null, 2) + "\n");
console.log("written", nodes.length, "nodes");
