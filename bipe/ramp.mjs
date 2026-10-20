// OKLCH ramp solver shared by acai-ramp.mjs and expressive-ramps.mjs. Each step gets the lightness
// that gives the same WCAG contrast against the theme background as the same step of Compound's
// green ramp, so Compound's accessibility guarantees hold for every Bipe ramp. Chroma peaks mid-ramp.
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toS = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function oklch(L, C, H) {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map((x) => Math.min(1, Math.max(0, toS(x))));
}
export const hex = (c) => "#" + c.map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
export const parseHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (c) => { const [r, g, b] = c.map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const lOf = (c) => { const [r, g, b] = c.map(toLin); const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b); return 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s; };

/** A colour of hue H whose contrast against bg is `target`, moving away from bg. */
export function solve(target, bg, dark, H, peak) {
  const chromaFor = (L) => Math.max(0.018, peak * Math.sin(Math.PI * Math.min(1, Math.max(0, (L - 0.12) / 0.86))) ** 0.9);
  let lo = dark ? lOf(bg) : 0, hi = 1;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const c = contrast(oklch(mid, chromaFor(mid), H), bg);
    if (dark) { if (c < target) lo = mid; else hi = mid; } else { if (c < target) hi = mid; else lo = mid; }
  }
  const L = (lo + hi) / 2;
  return oklch(L, chromaFor(L), H);
}

/** The ramp for hue H on one theme file's colours: { step: { value, type, description } }. */
export function ramp(col, dark, H, peak) {
  const bg = parseHex(col.theme.bg.value);
  const out = {};
  for (const [step, tok] of Object.entries(col.green)) {
    const target = parseFloat(/WCAG: ([\d.]+)/.exec(tok.description)[1]);
    const c = solve(target, bg, dark, H, peak);
    out[step] = { value: hex(c), type: "color", description: `WCAG: ${contrast(c, bg).toFixed(2)}` };
  }
  return out;
}
