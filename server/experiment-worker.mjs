import { simulate, hash } from './simulator.mjs';
process.on('message',async ({protocol,checkpoint=0})=>{
 const result=simulate(protocol);
 for(let progress=checkpoint+5;progress<=100;progress+=5){await new Promise(r=>setTimeout(r,Number(process.env.ASSAY_TICK_MS)||650));process.send({type:'progress',progress});}
 process.send({type:'complete',result,hash:hash(result)});
});
