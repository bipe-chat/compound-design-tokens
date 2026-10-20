// Adds an `acai` family (and alpha.acai) to each Compound theme file, matching
// the per-step WCAG contrast targets of Compound's green ramp. Hue 330 (OKLCH).
import { readFileSync, writeFileSync } from "node:fs";
import {
  chroma,
  contrast,
  hex,
  oklch,
  parseHex,
  ramp,
  solve,
} from "./ramp.mjs";

const H = 330;
const PEAK = 0.155;
const files = {
  "tokens/theme-light.json": false,
  "tokens/theme-light-hc.json": false,
  "tokens/theme-dark.json": true,
  "tokens/theme-dark-hc.json": true,
};
const number = (re, text) => Number.parseFloat(re.exec(text)[1]);

for (const [f, dark] of Object.entries(files)) {
  const doc = JSON.parse(readFileSync(f, "utf8"));
  const col = doc.color;
  const bg = parseHex(col.theme.bg.value);
  const acai = ramp(col, dark, H, PEAK);
  const alpha = {};
  for (const [step, tok] of Object.entries(col.alpha.green)) {
    const target = number(/WCAG: ([\d.]+)/, tok.description);
    const op = number(/Opacity: ([\d.]+)/, tok.description);
    if (op >= 1) {
      const c = solve(target, bg, dark, H, PEAK);
      alpha[step] = {
        value: hex(c),
        type: "color",
        description: `WCAG: ${contrast(c, bg).toFixed(2)} Opacity: 1`,
      };
    } else {
      const base = oklch(0.45, chroma(0.45, PEAK), H);
      const [r, g, b] = base.map((x) => Math.round(x * 255));
      alpha[step] = {
        value: `rgba(${r}, ${g}, ${b}, ${op})`,
        type: "color",
        description: `Opacity: ${op} (açaí base, same opacity as green)`,
      };
    }
  }
  // insert acai right after purple to keep families grouped
  const out = {};
  for (const [k, v] of Object.entries(col)) {
    out[k] = v;
    if (k === "purple") out.acai = acai;
  }
  const a2 = {};
  for (const [k, v] of Object.entries(col.alpha)) {
    a2[k] = v;
    if (k === "purple") a2.acai = alpha;
  }
  out.alpha = a2;
  doc.color = out;
  const end = readFileSync(f, "utf8").endsWith("\n") ? "\n" : "";
  writeFileSync(f, `${JSON.stringify(doc, null, 2)}${end}`);
  console.log(f, "acai.900", acai["900"].value, acai["900"].description);
}
