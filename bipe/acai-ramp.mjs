// Adds an `acai` family (and alpha.acai) to each Compound theme file, matching
// the per-step WCAG contrast targets of Compound's green ramp. Hue 330 (OKLCH).
import { readFileSync, writeFileSync } from "node:fs";
const H = 330;
const toLin=c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4, toS=c=>c<=0.0031308?12.92*c:1.055*c**(1/2.4)-0.055;
function oklch(L,C){const a=C*Math.cos(H*Math.PI/180),b=C*Math.sin(H*Math.PI/180);
 const l=(L+0.3963377774*a+0.2158037573*b)**3,m=(L-0.1055613458*a-0.0638541728*b)**3,s=(L-0.0894841775*a-1.2914855480*b)**3;
 return [4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.7076147010*s].map(x=>Math.min(1,Math.max(0,toS(x))));}
const hex=c=>"#"+c.map(x=>Math.round(x*255).toString(16).padStart(2,"0")).join("");
const parseHex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const lum=c=>{const [r,g,b]=c.map(toLin);return 0.2126*r+0.7152*g+0.0722*b};
const cr=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+0.05)/(y+0.05)};
// chroma peaks mid-ramp, low at the extremes
const chromaFor=L=>Math.max(0.018,0.155*Math.sin(Math.PI*Math.min(1,Math.max(0,(L-0.12)/0.86)))**0.9);
const lOf=c=>{const [r,g,b]=c.map(toLin);const l=Math.cbrt(0.4122214708*r+0.5363325363*g+0.0514459929*b),m=Math.cbrt(0.2119034982*r+0.6806995451*g+0.1073969566*b),s=Math.cbrt(0.0883024619*r+0.2817188376*g+0.6299787005*b);return 0.2104542553*l+0.7936177850*m-0.0040720468*s;};
function solve(target,bg,dark){ // find L so contrast(color,bg)=target, moving away from bg
  let lo=dark?lOf(bg):0,hi=dark?1:1; if(!dark){lo=0;hi=1;}
  for(let i=0;i<60;i++){const mid=(lo+hi)/2;const c=cr(oklch(mid,chromaFor(mid)),bg);
    if(dark){ if(c<target) lo=mid; else hi=mid; } else { if(c<target) hi=mid; else lo=mid; } }
  const L=(lo+hi)/2; return oklch(L,chromaFor(L));
}
const files={"tokens/theme-light.json":false,"tokens/theme-light-hc.json":false,"tokens/theme-dark.json":true,"tokens/theme-dark-hc.json":true};
for(const [f,dark] of Object.entries(files)){
  const doc=JSON.parse(readFileSync(f,"utf8")); const col=doc.color;
  const bg=parseHex(col.theme.bg.value);
  const acai={}, alpha={};
  for(const [step,tok] of Object.entries(col.green)){
    const target=parseFloat(/WCAG: ([\d.]+)/.exec(tok.description)[1]);
    const c=solve(target,bg,dark);
    acai[step]={value:hex(c),type:"color",description:`WCAG: ${cr(c,bg).toFixed(2)}`};
  }
  for(const [step,tok] of Object.entries(col.alpha.green)){
    const target=parseFloat(/WCAG: ([\d.]+)/.exec(tok.description)[1]);
    const op=parseFloat(/Opacity: ([\d.]+)/.exec(tok.description)[1]);
    if(op>=1){ const c=solve(target,bg,dark); alpha[step]={value:hex(c),type:"color",description:`WCAG: ${cr(c,bg).toFixed(2)} Opacity: 1`}; }
    else { const base=oklch(0.45,chromaFor(0.45)); const [r,g,b]=base.map(x=>Math.round(x*255));
      alpha[step]={value:`rgba(${r}, ${g}, ${b}, ${op})`,type:"color",description:`Opacity: ${op} (açaí base, same opacity as green)`}; }
  }
  // insert acai right after purple to keep families grouped
  const out={}; for(const [k,v] of Object.entries(col)){ out[k]=v; if(k==="purple") out.acai=acai; }
  out.alpha={...col.alpha}; const a2={}; for(const [k,v] of Object.entries(out.alpha)){ a2[k]=v; if(k==="purple") a2.acai=alpha; } out.alpha=a2;
  doc.color=out; writeFileSync(f,JSON.stringify(doc,null,2)+(readFileSync(f,"utf8").endsWith("\n")?"\n":""));
  console.log(f, "acai.900", acai["900"].value, acai["900"].description, "| acai.200", acai["200"].value);
}
