export const GROUP_COLORS=['#92aaa4','#c5e6a0','#b8a4ed'];
export const metricInfo={insulin:{label:'Insulin secretion',unit:'AU'},viability:{label:'Cell viability',unit:'%'}};
export function quantile(sorted,p){if(!sorted.length)return null;const index=(sorted.length-1)*p,lo=Math.floor(index);return sorted[lo]+(sorted[Math.ceil(index)]-sorted[lo])*(index-lo);}
export function distribution(wells,metric){return [...new Set(wells.map(w=>w.group))].map(group=>{const values=wells.filter(w=>w.group===group).map(w=>w[metric]).filter(Number.isFinite).sort((a,b)=>a-b);return {group,n:values.length,min:values[0],q1:quantile(values,.25),median:quantile(values,.5),q3:quantile(values,.75),max:values.at(-1)};}).filter(g=>g.n);}
export function csvForWells(wells){const quote=v=>'"'+String(v).replaceAll('"','""')+'"';return ['well,group,insulin_AU,viability_percent',...wells.map(w=>[w.id,w.group,w.insulin,w.viability].map(quote).join(','))].join('\r\n');}
