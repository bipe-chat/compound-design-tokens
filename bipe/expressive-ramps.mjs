// Writes tokens/bipe-expressive.json: the Bipe expressive ramps for marketing backgrounds (store
// panels, link-preview cards), named after Brazilian fruits next to açaí. Solved with bipe/ramp.mjs on
// the light theme, so each step has the WCAG contrast of the same step of Compound green and açaí.
// Not a UI token: the Compound build (build.ts, $metadata.json) does not read this file, and no app
// uses these ramps for text, borders, icons or trust states. See BIPE.md.
// Usage: node bipe/expressive-ramps.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { ramp } from "./ramp.mjs";

// Hue in OKLCH and the chroma peak mid-ramp.
const RAMPS = {
  pitanga: { hue: 33, peak: 0.17, note: "Coral. Between Compound red (hue 25) and orange (42): background fields only." },
  jabuticaba: { hue: 305, peak: 0.11, note: "Deep violet, low chroma." },
  jenipapo: { hue: 230, peak: 0.12, note: "Blue-black of the jenipapo dye. Near Compound cyan (241), which is not a state colour." },
};

const col = JSON.parse(readFileSync("tokens/theme-light.json", "utf8")).color;
const expressive = {};
for (const [name, { hue, peak, note }] of Object.entries(RAMPS)) {
  const steps = ramp(col, false, hue, peak);
  for (const tok of Object.values(steps)) tok.description += ` on the light theme background. OKLCH hue ${hue}. ${note}`;
  expressive[name] = steps;
}
writeFileSync("tokens/bipe-expressive.json", `${JSON.stringify({ color: { expressive } }, null, 2)}\n`);
console.log(Object.entries(expressive).map(([k, v]) => `${k} 1100 ${v[1100].value}`).join(", "));
