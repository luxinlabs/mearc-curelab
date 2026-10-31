import { createHash } from 'node:crypto';
export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export function random(seed) { let a=seed>>>0; return () => { a+=0x6D2B79F5; let t=a; t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296; }; }
export function simulate(p) {
 const rng=random(p.seed), normal=()=>Math.sqrt(-2*Math.log(Math.max(1e-9,rng())))*Math.cos(2*Math.PI*rng());
 const effect=p.dose/(p.dose+5), glucose=p.glucose/(p.glucose+7);
 const groups=['Vehicle','Candidate','Positive control'];
 const wells=groups.flatMap((group,g)=>Array.from({length:p.replicates},(_,i)=>({id:`${String.fromCharCode(65+g)}${i+1}`,group,insulin:+Math.max(.05,(.7+glucose*(g===1?1+effect*1.5:g===2?2.2:1))*(1+normal()*.09)).toFixed(4),viability:+Math.min(100,Math.max(0,97-(g===1?p.dose*.18:0)+normal()*1.5)).toFixed(2)})));
 const summary=groups.map(group=>{const a=wells.filter(w=>w.group===group),mean=a.reduce((s,w)=>s+w.insulin,0)/a.length,sd=Math.sqrt(a.reduce((s,w)=>s+(w.insulin-mean)**2,0)/(a.length-1));return {group,mean:+mean.toFixed(4),sd:+sd.toFixed(4),ci95:+(1.96*sd/Math.sqrt(a.length)).toFixed(4),viability:+(a.reduce((s,w)=>s+w.viability,0)/a.length).toFixed(2)};});
 const series=Array.from({length:25},(_,i)=>({minute:i*5,...Object.fromEntries(summary.map((s,g)=>[s.group,+(s.mean*(.28+.72/(1+Math.exp(-(i-7)/2)))+Math.sin(i*.8+g)*.025).toFixed(4)]))}));
 const qc=[{name:'Complete wells',pass:wells.length===p.replicates*3},{name:'Finite measurements',pass:wells.every(w=>Number.isFinite(w.insulin))},{name:'Viability ≥ 80%',pass:summary.every(s=>s.viability>=80)},{name:'Control CV < 20%',pass:summary[0].sd/summary[0].mean<.2}];
 return {kind:'simulated_measurement',toolVersion:'curelab-assay/1.0.0',parameters:p,wells,summary,series,qc,limitations:['Synthetic toy dose-response model; not fitted to biological data.','Replicate wells are simulated, not independent human donors.','Confidence intervals quantify simulator noise, not clinical uncertainty.','3D geometry and signaling paths are illustrative, not reconstructed tissue.']};
}
