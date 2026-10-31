// Run with server-side environment (never prints credentials or broker config).
import {RelayTransport} from '../server/relay.mjs';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync} from 'node:fs';
const relay=new RelayTransport();
const mission=`T2D-${randomUUID().slice(0,8)}`,receipts=[];
for(const [from,to] of [['OpenAI','Groq'],['Groq','OpenAI']]){
 const message={id:randomUUID(),sender:from,type:'connectivity',content:`${from} to ${to}: Relay transport verification; no scientific result.`};
 const result=await relay.deliver({mission,jobId:randomUUID(),peer:message,to});
 receipts.push(result.receipt);
}
const evidence={verifiedAt:new Date().toISOString(),kind:'real_broker_round_trip',mission,receipts};
mkdirSync('data',{recursive:true});writeFileSync('data/relay-verification.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence,null,2));
