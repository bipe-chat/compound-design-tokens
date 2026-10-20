// Adds an `acai` family (and alpha.acai) to each Compound theme file, matching
// the per-step WCAG contrast targets of Compound's green ramp. Hue 330 (OKLCH).
import { readFileSync, writeFileSync } from "node:fs";
import { contrast as cr, oklch as oklchH, parseHex, ramp, solve } from "./ramp.mjs";
const H = 330, PEAK = 0.155;
const chromaFor=L=>Math.max(0.018,PEAK*Math.sin(Math.PI*Math.min(1,Math.max(0,(L-0.12)/0.86)))**0.9);
const oklch=(L,C)=>oklchH(L,C,H);
const hex=c=>"#"+c.map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("");
const files={"tokens/theme-light.json":false,"tokens/theme-light-hc.json":false,"tokens/theme-dark.json":true,"tokens/theme-dark-hc.json":true};
for(const [f,dark] of Object.entries(files)){
  const doc=JSON.parse(readFileSync(f,"utf8")); const col=doc.color;
  const bg=parseHex(col.theme.bg.value);
  const acai=ramp(col,dark,H,PEAK), alpha={};
  for(const [step,tok] of Object.entries(col.alpha.green)){
    const target=parseFloat(/WCAG: ([\d.]+)/.exec(tok.description)[1]);
    const op=parseFloat(/Opacity: ([\d.]+)/.exec(tok.description)[1]);
    if(op>=1){ const c=solve(target,bg,dark,H,PEAK); alpha[step]={value:hex(c),type:"color",description:`WCAG: ${cr(c,bg).toFixed(2)} Opacity: 1`}; }
    else { const base=oklch(0.45,chromaFor(0.45)); const [r,g,b]=base.map(x=>Math.round(x*255));
      alpha[step]={value:`rgba(${r}, ${g}, ${b}, ${op})`,type:"color",description:`Opacity: ${op} (açaí base, same opacity as green)`}; }
  }
  // insert acai right after purple to keep families grouped
  const out={}; for(const [k,v] of Object.entries(col)){ out[k]=v; if(k==="purple") out.acai=acai; }
  out.alpha={...col.alpha}; const a2={}; for(const [k,v] of Object.entries(out.alpha)){ a2[k]=v; if(k==="purple") a2.acai=alpha; } out.alpha=a2;
  doc.color=out; writeFileSync(f,JSON.stringify(doc,null,2)+(readFileSync(f,"utf8").endsWith("\n")?"\n":""));
  console.log(f, "acai.900", acai["900"].value, acai["900"].description, "| acai.200", acai["200"].value);
}
