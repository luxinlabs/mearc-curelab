import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {installVoiceRoutes} from '../server/voice.mjs';
process.env.CURELAB_MODE='live';process.env.CURELAB_VOICE='true';process.env.OPENAI_API_KEY='test-only';process.env.OPENAI_MODEL='configured-model';
test('speech route speaks only a cached summary, preserving full chat and gating stale guidance and pauses',async()=>{
 const handlers=new Map(),content='Inspect viability before secretion. 请先检查细胞活性。'.repeat(200),mission={messages:[{id:'turn',sender:'Groq',type:'discussion',content,guidanceRevision:0}],guidanceRevision:0},events=[];
 installVoiceRoutes({post:(path,...args)=>handlers.set(path,args.at(-1))},{get:()=>mission,activity:(_s,_sender,_kind,_text,meta)=>events.push(meta)},{raw:()=>()=>{}});
 const handler=handlers.get('/api/missions/:id/voice/speech'),calls=[],original=globalThis.fetch;
 const summary='I suggest checking viability first. This remains a simulated assay.';let summaries=0;globalThis.fetch=async(url,options)=>{if(url.endsWith('/responses')){summaries++;assert.equal(JSON.parse(JSON.parse(options.body).input).message,content);return Response.json({status:'completed',output_text:JSON.stringify({sentences:['I suggest checking viability first.','This remains a simulated assay.']})});}calls.push(JSON.parse(options.body));return new Response(new Uint8Array([73,68,51]),{headers:{'x-request-id':'test-request'}});};
 async function request(part){const res=new EventEmitter();res.headers={};res.set=(k,v)=>{res.headers[k]=v;return res;};res.type=()=>res;res.send=audio=>{res.audio=audio;res.writableEnded=true;};let error;await handler({params:{id:'mission'},body:{messageId:'turn',part}},res,e=>error=e);return {res,error};}
 try{let r=await request(0);assert.equal(r.error,undefined);assert.equal(r.res.headers['X-Speech-Parts'],'1');assert.equal(calls[0].input,summary);assert.equal(calls[0].voice,'onyx');assert.equal(mission.messages[0].content,content);assert.equal(events[0].summary,summary);await request(0);assert.equal(summaries,1,'replay reuses summary');const total=calls.length;
  for(const part of [-1,total,0.5,'1'])assert.equal((await request(part)).error.status,400);
  mission.discussionPaused=true;assert.equal((await request(0)).error.status,409);mission.discussionPaused=false;mission.guidanceRevision=1;assert.equal((await request(0)).error.status,409);assert.equal(calls.length,total,'invalid/stale/paused requests must not call the provider');
 }finally{globalThis.fetch=original;}
});
