// Animated pictogram pack (CSS animations inside each SVG).
//
// Style and animations come from the NSPanel screensaver icons of the same
// author (sun with rotating rays and pulsing glow, drifting clouds made of
// circles, falling drops and flakes, flashing bolt, twinkling stars). Shapes
// get an outline so they stay readable on both light and dark dashboards.
// Animations stop when the viewer asks for reduced motion.

const C = {
  sunInner: "#fff59d", sunOuter: "#ffb300", sunStroke: "#f9a825",
  rays: "#ffca28", glow: "#ffd54f", spark: "#ffc107",
  moonInner: "#fffde7", moonOuter: "#ffe082", moonStroke: "#e0a800",
  moonGlow: "#fff3c4", crater: "#e6d8a8", star: "#ffc107",
  drop: "#29b6f6", dropStroke: "#0277bd",
  flake: "#e1f5fe", flakeStroke: "#29b6f6",
  bolt: "#ffeb3b", boltStroke: "#f57f17",
  fog: "#90a4ae", wisp: "#9db8de",
};

// Cloud colors: [fill, outline]
const CLOUD = {
  light: ["#eceff1", "#90a4ae"],
  back: ["#cfd8dc", "#90a4ae"],
  dark: ["#90a4ae", "#546e7a"],
  heavy: ["#78909c", "#455a64"],
  storm: ["#546e7a", "#37474f"],
};

const STYLE = `<style>
.rays,.glow,.spark,.cloud,.drop,.flake,.bolt,.star,.moon,.mglow,.fog{transform-box:fill-box;transform-origin:center}
.rays{animation:rays 14s linear infinite}
.glow{opacity:.35;animation:glow 2.6s ease-in-out infinite}
.spark{opacity:0;animation:twinkle 2.4s ease-in-out infinite}
.star{opacity:.25;animation:twinkle 2.8s ease-in-out infinite}
.cloud.d1{animation:cloud 6s ease-in-out infinite}
.cloud.d2{animation:cloud 8s ease-in-out infinite reverse}
.drop{opacity:0;animation:drop 1.1s linear infinite}
.drop.fast{animation-duration:.8s}
.flake{opacity:0;animation:flake 2.4s linear infinite}
.bolt{animation:bolt 3.2s linear infinite}
.moon{animation:moon 7s ease-in-out infinite}
.mglow{opacity:.2;animation:glow 4s ease-in-out infinite}
.fog.a{animation:fog 4s ease-in-out infinite}
.fog.b{animation:fog 5s ease-in-out infinite reverse}
@keyframes rays{to{transform:rotate(360deg)}}
@keyframes glow{0%,100%{opacity:.18;transform:scale(.92)}50%{opacity:.5;transform:scale(1.12)}}
@keyframes twinkle{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.1)}}
@keyframes cloud{0%,100%{transform:translateX(-3px)}50%{transform:translateX(4px)}}
@keyframes drop{0%{opacity:0;transform:translateY(-4px)}15%{opacity:1}100%{opacity:0;transform:translateY(20px)}}
@keyframes flake{0%{opacity:0;transform:translate(0,-4px)}20%{opacity:1}50%{transform:translate(3px,8px)}100%{opacity:0;transform:translate(-2px,20px)}}
@keyframes bolt{0%,64%,72%,100%{opacity:.45}66%,70%,76%{opacity:1}}
@keyframes moon{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
@keyframes fog{0%,100%{transform:translateX(-5px)}50%{transform:translateX(6px)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}.drop,.flake,.bolt,.spark{opacity:1}.star{opacity:.8}}
</style>`;

const DEFS = `<defs>` +
  `<radialGradient id="sun" cx="40%" cy="40%" r="60%"><stop offset="0" stop-color="${C.sunInner}"/><stop offset="1" stop-color="${C.sunOuter}"/></radialGradient>` +
  `<radialGradient id="moon" cx="30%" cy="35%" r="70%"><stop offset="0" stop-color="${C.moonInner}"/><stop offset="1" stop-color="${C.moonOuter}"/></radialGradient>` +
  `</defs>`;

const delay = (s) => `style="animation-delay:${s.toFixed(2)}s"`;

const sparkle = (cls, x, y, r, d, fill) =>
  `<path class="${cls}" ${delay(d)} fill="${fill}" d="M${x} ${y - r} L${x + r * 0.27} ${y - r * 0.27} L${x + r} ${y} ` +
  `L${x + r * 0.27} ${y + r * 0.27} L${x} ${y + r} L${x - r * 0.27} ${y + r * 0.27} L${x - r} ${y} L${x - r * 0.27} ${y - r * 0.27}Z"/>`;

// Sun drawn around (50,50) then placed at (cx,cy) with scale s.
function sun(cx, cy, s) {
  const rays = Array.from({ length: 8 }, (_, i) =>
    `<rect x="47.5" y="17" width="5" height="9" rx="2.5" transform="rotate(${i * 45} 50 50)"/>`).join("");
  return `<g transform="translate(${cx - 50 * s} ${cy - 50 * s}) scale(${s})">` +
    `<circle class="glow" cx="50" cy="50" r="30" fill="${C.glow}"/>` +
    `<g class="rays" fill="${C.rays}">${rays}</g>` +
    `<circle cx="50" cy="50" r="20" fill="url(#sun)" stroke="${C.sunStroke}" stroke-width="1.2"/></g>`;
}

function moon(cx, cy, s) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})"><g class="moon">` +
    `<circle class="mglow" cx="0" cy="0" r="34" fill="${C.moonGlow}"/>` +
    `<path fill="url(#moon)" stroke="${C.moonStroke}" stroke-width="1.5" stroke-linejoin="round" ` +
    `d="M4 -28 a28 28 0 1 0 22 46 a22 22 0 1 1 -22 -46z"/>` +
    `<circle cx="-8" cy="6" r="3" fill="${C.crater}" opacity=".6"/>` +
    `<circle cx="-2" cy="-12" r="2" fill="${C.crater}" opacity=".5"/></g></g>`;
}

const CLOUD_SHAPES =
  `<circle cx="38" cy="54" r="14"/><circle cx="55" cy="45" r="18"/>` +
  `<circle cx="71" cy="56" r="12"/><rect x="25" y="54" width="58" height="16" rx="8"/>`;

// Outline trick: the same shapes drawn first in the outline color with a
// stroke, then in the fill color on top.
function cloud(tx, ty, s, [fill, outline], anim = "d1") {
  return `<g transform="translate(${tx} ${ty}) scale(${s})"><g class="cloud ${anim}">` +
    `<g fill="${outline}" stroke="${outline}" stroke-width="${(3 / s).toFixed(1)}">${CLOUD_SHAPES}</g>` +
    `<g fill="${fill}">${CLOUD_SHAPES}</g></g></g>`;
}

const DROP_X = { 1: [44, 62], 2: [36, 50, 64], 3: [30, 41, 52, 63, 74] };

function precipitation(type, n, dx = 0, y = 73, scale = 1) {
  return DROP_X[n].map((x0, i) => {
    const x = x0 * scale + dx;
    const t = type === "mix" ? (i % 2 ? "snow" : "rain") : type;
    if (t === "rain") {
      return `<path class="drop${n === 3 ? " fast" : ""}" ${delay(i * 0.27)} fill="${C.drop}" ` +
        `stroke="${C.dropStroke}" stroke-width=".8" d="M${x} ${y} q5 9 0 13 q-5 -4 0 -13z"/>`;
    }
    return `<circle class="flake" ${delay(i * 0.5)} cx="${x}" cy="${y + 4}" r="3.6" ` +
      `fill="${C.flake}" stroke="${C.flakeStroke}" stroke-width="1.3"/>`;
  }).join("");
}

const bolt = (strong, dx = 0) =>
  `<g transform="translate(${dx + (strong ? 0 : 6)} ${strong ? 0 : 6}) scale(${strong ? 1 : 0.85})">` +
  `<path class="bolt" fill="${C.bolt}" stroke="${C.boltStroke}" stroke-width="1.5" stroke-linejoin="round" ` +
  `d="M54 62 L44 80 L52 80 L47 95 L62 74 L54 74 L59 62Z"/></g>`;

const wisps = () =>
  `<g stroke="${C.wisp}" stroke-width="4" stroke-linecap="round" fill="none">` +
  `<path class="fog a" d="M30 64 Q55 56 84 64"/><path class="fog b" d="M40 76 Q62 69 90 76"/>` +
  `<path class="fog a" d="M22 88 Q48 81 76 88"/></g>`;

const fogLines = () =>
  `<g stroke="${C.fog}" stroke-width="6" stroke-linecap="round">` +
  `<line class="fog a" x1="20" y1="68" x2="70" y2="68"/><line class="fog b" x1="30" y1="80" x2="82" y2="80"/>` +
  `<line class="fog a" x1="18" y1="92" x2="66" y2="92"/></g>`;

const stratus = () =>
  `<g class="cloud d2"><rect x="18" y="34" width="66" height="20" rx="10" fill="${CLOUD.back[0]}" stroke="${CLOUD.back[1]}" stroke-width="2.5"/></g>` +
  `<g class="cloud d1"><rect x="10" y="48" width="80" height="22" rx="11" fill="${CLOUD.dark[0]}" stroke="${CLOUD.dark[1]}" stroke-width="2.5"/></g>`;

export function renderAnimated({ sky = null, cloud: kind = null, precip = null, bolt: b = 0 }, night) {
  const parts = [];
  const body = (cx, cy, s) => (night ? moon(cx, cy, s * 0.95) : sun(cx, cy, s));

  // Clear sky: sparkles by day, twinkling stars at night.
  if (sky === "full") {
    if (night) {
      [[16, 18, 6, 0], [84, 14, 5, 0.9], [88, 58, 4, 1.7], [12, 60, 4, 2.3], [70, 88, 5, 1.2], [30, 90, 3.5, 0.5]]
        .forEach(([x, y, r, d]) => parts.push(sparkle("star", x, y, r, d, C.star)));
      parts.push(moon(50, 50, 1));
    } else {
      [[18, 20, 6, 0], [84, 24, 6, 0.7], [80, 82, 6, 1.3], [16, 76, 6, 1.9]]
        .forEach(([x, y, r, d]) => parts.push(sparkle("spark", x, y, r, d, C.spark)));
      parts.push(sun(50, 50, 1));
    }
  } else if (night && sky && kind !== "overcast") {
    [[86, 14, 4, 0.3], [72, 8, 3, 1.4]].forEach(([x, y, r, d]) => parts.push(sparkle("star", x, y, r, d, C.star)));
  }

  if (sky === "big") parts.push(body(42, 40, 0.8));
  if (sky === "part") parts.push(body(36, 36, 0.7));
  if (sky === "small") parts.push(body(30, 28, 0.5));

  // Precipitation and bolt are drawn behind the cloud so they come out of it.
  const smallCloud = kind === "small";
  if (precip) {
    parts.push(smallCloud
      ? precipitation(precip[0], Math.min(precip[1], 2), 30, 80, 0.7)
      : precipitation(precip[0], precip[1]));
  }
  if (b) parts.push(bolt(b === 2, smallCloud ? 14 : 0));

  const front = b ? CLOUD.storm : precip && precip[1] === 3 ? CLOUD.heavy : CLOUD.dark;
  switch (kind) {
    case "small": parts.push(cloud(36, 38, 0.6, CLOUD.light)); break;
    case "light": parts.push(cloud(0, 0, 1, CLOUD.light)); break;
    case "dark": parts.push(cloud(0, 0, 1, front)); break;
    case "overcast":
      parts.push(cloud(-12, -12, 0.8, CLOUD.back, "d2"), cloud(0, 0, 1, front)); break;
    case "dry":
      parts.push(cloud(-12, -12, 0.8, CLOUD.back, "d2"), cloud(0, 0, 1, CLOUD.light)); break;
    case "high": parts.push(wisps()); break;
    case "stratus": parts.push(stratus()); break;
    case "fog": parts.push(cloud(4, -14, 0.85, CLOUD.back), fogLines()); break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">` +
    STYLE + DEFS + parts.join("") + `</svg>\n`;
}
