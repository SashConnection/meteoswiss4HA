// Generate the weather pictograms for all MeteoSwiss symbol codes.
//
//   node scripts/generate_icons.mjs
//
// Writes custom_components/meteoswiss4ha/icons/<code>.svg for codes 1-42
// (day) and 101-142 (night). The artwork is original and built from a few
// shared parts, so the whole set can be restyled by editing THEME below.

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..",
  "custom_components", "meteoswiss4ha", "icons");

const THEME = {
  sun: "#FDB813", sunStroke: "#F29A00",
  moon: "#F4E3A1", moonStroke: "#C9B26A",
  cloud: "#EEF2F7", cloudStroke: "#8C99AA",
  darkCloud: "#A3AEBD", darkCloudStroke: "#5E6B7D",
  rain: "#2F7BEA", snow: "#5AA7F2", bolt: "#FFCC1F", boltStroke: "#D99400",
  fog: "#9AA6B6", high: "#B9C4D3",
};

// ------------------------------------------------------------------ parts

const sun = (cx, cy, r) => {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x1 = cx + Math.cos(a) * (r + 3), y1 = cy + Math.sin(a) * (r + 3);
    const x2 = cx + Math.cos(a) * (r + 8), y2 = cy + Math.sin(a) * (r + 8);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;
  }).join("");
  return `<g stroke="${THEME.sunStroke}" stroke-width="2.5" stroke-linecap="round">${rays}</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${THEME.sun}" stroke="${THEME.sunStroke}" stroke-width="1.5"/>`;
};

const moon = (cx, cy, r) =>
  // Crescent: big circle minus an offset circle.
  `<path d="M ${cx + r * 0.35} ${cy - r} A ${r} ${r} 0 1 0 ${cx + r} ${cy + r * 0.35} ` +
  `A ${r * 0.8} ${r * 0.8} 0 1 1 ${cx + r * 0.35} ${cy - r} Z" ` +
  `fill="${THEME.moon}" stroke="${THEME.moonStroke}" stroke-width="1.5" stroke-linejoin="round"/>`;

// Cloud outline in a 40x22 box, translated/scaled.
const cloudPath =
  "M 9 22 A 9 9 0 0 1 8.5 4 A 11 11 0 0 1 29 6 A 8 8 0 0 1 32 22 Z";
const cloud = (x, y, s, dark = false) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="${cloudPath}" ` +
  `fill="${dark ? THEME.darkCloud : THEME.cloud}" ` +
  `stroke="${dark ? THEME.darkCloudStroke : THEME.cloudStroke}" ` +
  `stroke-width="${(1.6 / s).toFixed(2)}" stroke-linejoin="round"/>`;

const drop = (x, y) =>
  `<line x1="${x}" y1="${y}" x2="${x - 2.5}" y2="${y + 6}" stroke="${THEME.rain}" stroke-width="2.8" stroke-linecap="round"/>`;

const flake = (x, y) => {
  const r = 3.4;
  const arms = [0, 60, 120].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return `<line x1="${(x - Math.cos(a) * r).toFixed(1)}" y1="${(y - Math.sin(a) * r).toFixed(1)}" ` +
      `x2="${(x + Math.cos(a) * r).toFixed(1)}" y2="${(y + Math.sin(a) * r).toFixed(1)}"/>`;
  }).join("");
  return `<g stroke="${THEME.snow}" stroke-width="1.6" stroke-linecap="round">${arms}</g>`;
};

const bolt = (x, y, s = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M 6 0 L 0 11 L 5 11 L 2 20 L 11 7 L 6 7 L 9 0 Z" ` +
  `fill="${THEME.bolt}" stroke="${THEME.boltStroke}" stroke-width="1.2" stroke-linejoin="round"/>`;

// Precipitation under a cloud: type rain|snow|mix, intensity 1..3.
const precipitation = (type, n, y = 46, dx = 0) => {
  const xs = { 1: [32], 2: [26, 38], 3: [20, 32, 44] }[n].map((x) => x + dx);
  return xs.map((x, i) => {
    const t = type === "mix" ? (i % 2 ? "snow" : "rain") : type;
    const yy = y + (i % 2) * 4;
    return t === "rain" ? drop(x + 2, yy) : flake(x, yy + 3);
  }).join("");
};

const fogLines = () =>
  [30, 38, 46, 54].map((y, i) =>
    `<line x1="${10 + (i % 2) * 6}" y1="${y}" x2="${54 - (i % 2) * 4}" y2="${y}" stroke="${THEME.fog}" stroke-width="3" stroke-linecap="round"/>`
  ).join("");

const highClouds = () =>
  [[26, 30, 56], [32, 40, 58], [20, 48, 50]].map(([x1, y, x2]) =>
    `<path d="M ${x1} ${y} Q ${(x1 + x2) / 2} ${y - 5} ${x2} ${y}" fill="none" stroke="${THEME.high}" stroke-width="2.6" stroke-linecap="round"/>`
  ).join("");

const stratus = () =>
  `<rect x="6" y="26" width="52" height="14" rx="7" fill="${THEME.darkCloud}" stroke="${THEME.darkCloudStroke}" stroke-width="1.6"/>` +
  `<rect x="12" y="20" width="40" height="10" rx="5" fill="${THEME.cloud}" stroke="${THEME.cloudStroke}" stroke-width="1.6"/>`;

// ------------------------------------------------------------- composition
//
// sky:   "full" (sun/moon alone), "big" (large, cloud small), "part"
//        (behind cloud), "small" (peeking), null (no sun/moon)
// cloud: null, "small", "light", "dark", "overcast", "dry", "high",
//        "stratus", "fog"
// precip: [type, intensity]   bolt: 0 none, 1 weak, 2 strong

const SPEC = {
  1: { sky: "full" },
  2: { sky: "big", cloud: "small" },
  3: { sky: "part", cloud: "light" },
  4: { sky: "small", cloud: "light" },
  5: { cloud: "overcast" },
  6: { sky: "part", cloud: "light", precip: ["rain", 1] },
  7: { sky: "part", cloud: "light", precip: ["mix", 2] },
  8: { sky: "part", cloud: "light", precip: ["snow", 2] },
  9: { sky: "small", cloud: "dark", precip: ["rain", 2] },
  10: { sky: "small", cloud: "dark", precip: ["mix", 2] },
  11: { sky: "small", cloud: "dark", precip: ["snow", 2] },
  12: { sky: "part", cloud: "light", bolt: 1 },
  13: { sky: "part", cloud: "dark", bolt: 2, precip: ["rain", 1] },
  14: { cloud: "dark", precip: ["rain", 1] },
  15: { cloud: "dark", precip: ["mix", 2] },
  16: { cloud: "dark", precip: ["snow", 1] },
  17: { cloud: "dark", precip: ["rain", 2] },
  18: { cloud: "dark", precip: ["mix", 3] },
  19: { cloud: "dark", precip: ["snow", 2] },
  20: { cloud: "overcast", precip: ["rain", 3] },
  21: { cloud: "overcast", precip: ["mix", 3] },
  22: { cloud: "overcast", precip: ["snow", 3] },
  23: { cloud: "dark", bolt: 1 },
  24: { cloud: "dark", bolt: 2, precip: ["rain", 2] },
  25: { cloud: "overcast", bolt: 2, precip: ["rain", 3] },
  26: { sky: "big", cloud: "high" },
  27: { cloud: "stratus" },
  28: { cloud: "fog" },
  29: { sky: "big", cloud: "small", precip: ["rain", 1] },
  30: { sky: "big", cloud: "small", precip: ["snow", 1] },
  31: { sky: "big", cloud: "small", precip: ["mix", 2] },
  32: { sky: "part", cloud: "light", precip: ["rain", 2] },
  33: { sky: "small", cloud: "dark", precip: ["rain", 3] },
  34: { sky: "small", cloud: "dark", precip: ["snow", 3] },
  35: { cloud: "dry" },
  36: { sky: "part", cloud: "light", bolt: 2, precip: ["rain", 2] },
  37: { sky: "part", cloud: "light", bolt: 2, precip: ["snow", 2] },
  38: { sky: "small", cloud: "dark", bolt: 2, precip: ["rain", 2] },
  39: { sky: "small", cloud: "dark", bolt: 2, precip: ["snow", 2] },
  40: { cloud: "dark", bolt: 1, precip: ["rain", 1] },
  41: { cloud: "light", bolt: 1 },
  42: { cloud: "overcast", bolt: 2, precip: ["snow", 2] },
};

function render({ sky = null, cloud: kind = null, precip = null, bolt: b = 0 }, night) {
  const parts = [];
  const body = (cx, cy, r) => (night ? moon(cx, cy, r) : sun(cx, cy, r));

  if (sky === "full") parts.push(body(32, 32, 14));
  if (sky === "big") parts.push(body(26, 24, 12));
  if (sky === "part") parts.push(body(22, 20, 10));
  if (sky === "small") parts.push(body(18, 16, 7));

  switch (kind) {
    case "small": parts.push(cloud(30, 30, 0.8)); break;
    case "light": parts.push(cloud(14, 18, 1.05)); break;
    case "dark": parts.push(cloud(14, 18, 1.05, true)); break;
    case "overcast":
      parts.push(cloud(22, 8, 0.85, true), cloud(8, 18, 1.15, true)); break;
    case "dry":
      parts.push(cloud(22, 10, 0.8), cloud(8, 20, 1.1)); break;
    case "high": parts.push(highClouds()); break;
    case "stratus": parts.push(stratus()); break;
    case "fog": parts.push(fogLines()); break;
  }

  if (precip) {
    parts.push(kind === "small"
      ? precipitation(precip[0], Math.min(precip[1], 2), 51, 12)
      : precipitation(precip[0], precip[1]));
  }
  if (b) parts.push(bolt(precip ? 36 : 28, 38, b === 2 ? 1.1 : 0.85));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">` +
    parts.join("") + `</svg>\n`;
}

mkdirSync(OUT, { recursive: true });
let count = 0;
for (const [code, spec] of Object.entries(SPEC)) {
  writeFileSync(join(OUT, `${code}.svg`), render(spec, false));
  writeFileSync(join(OUT, `${Number(code) + 100}.svg`), render(spec, true));
  count += 2;
}
console.log(`Wrote ${count} icons to ${OUT}`);
