import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {installVoiceRoutes} from '../server/voice.mjs';
process.env.CURELAB_MODE='live';process.env.CURELAB_VOICE='true';process.env.OPENAI_API_KEY='test-only';
test('speech route serves complete long messages in validated ordered parts, gating stale guidance and pauses',async()=>{
 const handlers=new Map(),content='Inspect viability before secretion. 请先检查细胞活性。'.repeat(200),mission={messages:[{id:'turn',sender:'Groq',type:'discussion',content,guidanceRevision:0}],guidanceRevision:0},events=[];
 installVoiceRoutes({post:(path,...args)=>handlers.set(path,args.at(-1))},{get:()=>mission,activity:(_s,_sender,_kind,_text,meta)=>events.push(meta)},{raw:()=>()=>{}});
 const handler=handlers.get('/api/missions/:id/voice/speech'),calls=[],original=globalThis.fetch;
 globalThis.fetch=async(_url,options)=>{calls.push(JSON.parse(options.body));return new Response(new Uint8Array([73,68,51]),{headers:{'x-request-id':'test-request'}});};
 async function request(part){const res=new EventEmitter();res.headers={};res.set=(k,v)=>{res.headers[k]=v;return res;};res.type=()=>res;res.send=audio=>{res.audio=audio;res.writableEnded=true;};let error;await handler({params:{id:'mission'},body:{messageId:'turn',part}},res,e=>error=e);return {res,error};}
 try{let r=await request(0);assert.equal(r.error,undefined);const total=Number(r.res.headers['X-Speech-Parts']);assert.ok(total>1);for(let part=1;part<total;part++){r=await request(part);assert.equal(r.error,undefined);assert.equal(r.res.audio.length,3);}assert.equal(calls.map(c=>c.input).join(''),content);assert.ok(calls.every(c=>c.voice==='onyx'&&c.input.length<=3500));assert.equal(events.length,total);
  for(const part of [-1,total,0.5,'1'])assert.equal((await request(part)).error.status,400);
  mission.discussionPaused=true;assert.equal((await request(0)).error.status,409);mission.discussionPaused=false;mission.guidanceRevision=1;assert.equal((await request(0)).error.status,409);assert.equal(calls.length,total,'invalid/stale/paused requests must not call the provider');
 }finally{globalThis.fetch=original;}
});
