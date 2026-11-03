// theme-engine.js - derive a full theme from ONE base color (OKLCH math, no dependencies)
// Usage:  node theme-engine.js "#B08D57"            -> prints theme JSON
//         node theme-engine.js "#1F4D3A" --write    -> also patches site.json "theme.colors"

const fs = require("fs");

// ---------- sRGB <-> OKLab/OKLCH (Bjorn Ottosson's matrices) ----------
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const delin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
function rgbToOklab([r, g, b]) {
  [r, g, b] = [r, g, b].map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function oklabToRgbRaw([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
const toLCH = (hex) => {
  const [L, a, b] = rgbToOklab(hexToRgb(hex));
  return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
};
const inGamut = (rgb) => rgb.every((v) => v >= -0.0001 && v <= 1.0001);

// OKLCH -> hex, reducing chroma until it fits sRGB (gamut mapping)
function toHex({ L, C, h }) {
  L = Math.min(1, Math.max(0, L));
  const hr = (h * Math.PI) / 180;
  let c = C;
  let rgb = oklabToRgbRaw([L, c * Math.cos(hr), c * Math.sin(hr)]);
  while (!inGamut(rgb) && c > 0) {
    c -= 0.002;
    rgb = oklabToRgbRaw([L, Math.max(c, 0) * Math.cos(hr), Math.max(c, 0) * Math.sin(hr)]);
  }
  return (
    "#" +
    rgb
      .map((v) => Math.round(Math.min(1, Math.max(0, delin(Math.max(v, 0)))) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

// ---------- WCAG 2.x contrast ----------
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
// Move L toward `dir` (-1 darker, +1 lighter) in 0.005 steps until ratio >= target
function ensureContrast(color, against, target, dir) {
  let c = { ...color };
  let hex = toHex(c);
  while (contrast(hex, against) < target && c.L > 0 && c.L < 1) {
    c.L += dir * 0.005;
    hex = toHex(c);
  }
  return hex;
}

// ---------- THE EQUATIONS ----------
// Base color B = (L0, C0, h0) in OKLCH.  clamp(x,a,b) = min(b, max(a, x))
//
//  Neutral tint (carries brand hue subtly):  Cn(k) = clamp(k * C0, 0, cap)
//
//  Light mode
//   accent        = (L0,            C0,               h0)
//   accentDark    = (L0 - 0.12,     0.95 * C0,        h0)   then L lowered until contrast vs bg >= 4.5
//   accentSoft    = (0.94,          0.25 * C0,        h0)
//   background    = (0.99,          Cn(0.10) cap .012, h0)
//   surface       = (0.95,          Cn(0.15) cap .020, h0)
//   border        = (0.88,          Cn(0.15) cap .020, h0)
//   text          = (0.20,          Cn(0.08) cap .015, h0)   then L lowered until contrast vs bg >= 7
//   muted         = (0.50,          Cn(0.10) cap .020, h0)   then L lowered until contrast vs bg >= 4.5
//   inverse       = (0.17,          Cn(0.08) cap .015, h0)
//   onAccent      = white if contrast(white, accent) >= contrast(black, accent) else near-black
//
//  Secondary hue options (harmony):
//   analogous     h0 +/- 30     complementary  h0 + 180
//   split-comp    h0 + 150, h0 + 210     triadic  h0 + 120, h0 + 240
//
//  Dark mode (retuned, NOT inverted)
//   background    = (0.16, Cn(0.10) cap .012, h0)       surface = (0.21, ...)
//   text          = (0.95, Cn(0.05) cap .010, h0)
//   accent        = (max(L0, 0.72), 0.90 * C0, h0)      then L raised until contrast vs bg >= 4.5
//
//  Proportion (60-30-10):  60% background/surface, 30% text/inverse, 10% accent

function buildTheme(baseHex, { harmony = "analogous" } = {}) {
  const { L: L0, C: C0, h: h0 } = toLCH(baseHex);
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const tint = (k, cap) => clamp(k * C0, 0, cap);

  const bg = toHex({ L: 0.99, C: tint(0.1, 0.012), h: h0 });
  const surface = toHex({ L: 0.95, C: tint(0.15, 0.02), h: h0 });
  const border = toHex({ L: 0.88, C: tint(0.15, 0.02), h: h0 });
  const accent = baseHex.toLowerCase();
  const accentDark = ensureContrast({ L: L0 - 0.12, C: 0.95 * C0, h: h0 }, bg, 4.5, -1);
  const accentSoft = toHex({ L: 0.94, C: 0.25 * C0, h: h0 });
  const text = ensureContrast({ L: 0.2, C: tint(0.08, 0.015), h: h0 }, bg, 7, -1);
  const muted = ensureContrast({ L: 0.5, C: tint(0.1, 0.02), h: h0 }, bg, 4.5, -1);
  const inverse = toHex({ L: 0.17, C: tint(0.08, 0.015), h: h0 });
  // Gloss shades (equations): light = (L0 + 0.13, 1.02*C0, h0)   deep = (L0 - 0.24, 0.90*C0, h0)   inverseHi = (0.30, Cn(0.12) cap .02, h0)
  const accentLight = toHex({ L: Math.min(0.9, L0 + 0.13), C: 1.02 * C0, h: h0 });
  const accentDeep = toHex({ L: Math.max(0.25, L0 - 0.24), C: 0.9 * C0, h: h0 });
  const inverseHi = toHex({ L: 0.3, C: tint(0.12, 0.02), h: h0 });
  const onAccent = contrast("#ffffff", accent) >= contrast("#111111", accent) ? "#ffffff" : "#111111";

  const offsets = {
    analogous: [-30, 30],
    complementary: [180],
    "split-complementary": [150, 210],
    triadic: [120, 240],
  }[harmony];
  const secondary = offsets.map((d) =>
    toHex({ L: clamp(L0, 0.45, 0.75), C: 0.85 * C0, h: (h0 + d + 360) % 360 })
  );

  const dbg = toHex({ L: 0.16, C: tint(0.1, 0.012), h: h0 });
  const dark = {
    background: dbg,
    surface: toHex({ L: 0.21, C: tint(0.1, 0.014), h: h0 }),
    border: toHex({ L: 0.3, C: tint(0.1, 0.014), h: h0 }),
    text: toHex({ L: 0.95, C: tint(0.05, 0.01), h: h0 }),
    accent: ensureContrast({ L: Math.max(L0, 0.72), C: 0.9 * C0, h: h0 }, dbg, 4.5, +1),
  };

  const report = {
    "text/background": +contrast(text, bg).toFixed(2),
    "muted/background": +contrast(muted, bg).toFixed(2),
    "accentDark/background": +contrast(accentDark, bg).toFixed(2),
    "onAccent/accent": +contrast(onAccent, accent).toFixed(2),
    "dark text/background": +contrast(dark.text, dark.background).toFixed(2),
    "dark accent/background": +contrast(dark.accent, dark.background).toFixed(2),
  };

  return {
    base: { hex: accent, oklch: { L: +L0.toFixed(3), C: +C0.toFixed(3), h: +h0.toFixed(1) } },
    harmony,
    colors: { background: bg, surface, border, text, muted, accent, accentDark, accentSoft, accentLight, accentDeep, inverse, inverseHi, onAccent, secondary },
    dark,
    contrastReport: report,
  };
}

module.exports = { buildTheme };

if (require.main === module) {
  const base = process.argv[2] || "#B08D57";
  const harmonyArg = process.argv.find((a) => a.startsWith("--harmony="));
  const theme = buildTheme(base, { harmony: harmonyArg ? harmonyArg.split("=")[1] : "analogous" });
  console.log(JSON.stringify(theme, null, 2));
  if (process.argv.includes("--write")) {
    const path = __dirname + "/site.json";
    const site = JSON.parse(fs.readFileSync(path, "utf8"));
    site.theme.baseColor = theme.base.hex;
    site.theme.colors = theme.colors;
    site.theme.dark = theme.dark;
    fs.writeFileSync(path, JSON.stringify(site, null, 2));
    console.error("site.json theme updated from base " + theme.base.hex);
  }
}
