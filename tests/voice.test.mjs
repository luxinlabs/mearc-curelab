import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {synthesize,transcribe,voiceConfig} from '../server/voice.mjs';
import {Lab} from '../server/lab.mjs';
process.env.CURELAB_MODE='live';process.env.CURELAB_VOICE='true';process.env.OPENAI_API_KEY='voice-test-key';
test('both scientists use distinct OpenAI voices without changing their provider identity',async()=>{
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return new Response(new Uint8Array([73,68,51,1]),{headers:{'x-request-id':'speech-request'}});};
 for(const sender of ['OpenAI','Groq']){const r=await synthesize({sender,type:'discussion',content:'Keep **viability** as a separate outcome.'},{fetcher});assert.equal(r.requestId,'speech-request');assert.equal(r.audio.length,4);}
 assert.ok(calls.every(c=>c.url==='https://api.openai.com/v1/audio/speech'&&c.options.headers.Authorization==='Bearer voice-test-key'));
 const payloads=calls.map(c=>JSON.parse(c.options.body));assert.equal(payloads[0].voice,'nova');assert.equal(payloads[1].voice,'onyx');assert.equal(payloads[0].input,'Keep viability as a separate outcome.');assert.equal(payloads[0].response_format,'mp3');
 await assert.rejects(synthesize({sender:'You',type:'note',content:'x'},{fetcher}),/shared scientist/);
 await assert.rejects(synthesize({sender:'Groq',type:'discussion',content:'x'.repeat(4097)},{fetcher}),/too long/);
});
test('human audio uses a multipart transcription request and does not fabricate a transcript',async()=>{
 let called=0;const fetcher=async(url,options)=>{called++;assert.equal(url,'https://api.openai.com/v1/audio/transcriptions');assert.equal(options.body.get('model'),'gpt-transcribe');assert.equal(options.body.get('file').name,'human-note.webm');assert.equal(options.body.get('file').size,128);assert.equal(options.headers['Content-Type'],undefined);return Response.json({text:'  请先检查细胞活性。  '});};
 assert.equal((await transcribe(Buffer.alloc(128),'audio/webm;codecs=opus',{fetcher})).text,'请先检查细胞活性。');
 await assert.rejects(transcribe(Buffer.alloc(128),'text/plain',{fetcher}),/supported/);assert.equal(called,1);
 await assert.rejects(transcribe(Buffer.alloc(128),'audio/webm',{fetcher:async()=>Response.json({text:''})}),/No speech/);
 await assert.rejects(transcribe(Buffer.alloc(128),'audio/webm',{fetcher:async()=>new Response('',{status:401})}),/HTTP 401/);
});
test('demo mode never makes voice API calls',async()=>{process.env.CURELAB_MODE='demo';try{assert.equal(voiceConfig().enabled,false);await assert.rejects(synthesize({sender:'OpenAI',type:'reply',content:'Hi'},{fetcher:()=>{throw Error('should not call');}}),/requires live/);}finally{process.env.CURELAB_MODE='live';}});
test('pause gates dispatch, human advice takes priority and binds to following peer turns',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'curelab-voice-')),lab=new Lab(dir);try{const s=lab.create();s.phase='PROTOCOL_REVIEW';s.transport='local';const sent=[];for(const a of s.agents){a.status='online';lab.workers.set(lab.key(s.id,a.name),{connected:true,send:j=>sent.push(structuredClone(j)),kill(){}});lab.queue(s,a.name,'discussion',{peerMessage:{content:'Old conclusion'}});}
 lab.pauseDiscussion(s.id,true);await lab.dispatch(s,'OpenAI');assert.equal(sent.length,0);
 lab.note(s.id,'Prioritize viability controls before interpreting secretion.');assert.equal(s.discussionPaused,false);assert.equal(s.guidanceRevision,1);assert.equal(sent.length,2);assert.ok(sent.every(j=>j.phase==='reply'&&j.guidanceRevision===1&&j.context.humanGuidance[0].content.includes('viability')));
 for(const j of s.jobs)if(j.phase==='reply')j.status='done';for(const a of s.agents)a.status='online';await lab.dispatch(s,'OpenAI');assert.equal(sent.at(-1).phase,'discussion');assert.equal(sent.at(-1).context.humanGuidance[0].content,'Prioritize viability controls before interpreting secretion.');
 lab.pauseDiscussion(s.id,true);assert.throws(()=>lab.discuss(s.id),/paused/);
 }finally{lab.close();rmSync(dir,{recursive:true,force:true});}
});
test('a human pause while Relay is awaiting delivery prevents the queued model invocation',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'curelab-voice-race-')),lab=new Lab(dir);try{const s=lab.create();s.phase='CROSS_REVIEW';s.transport='agent-relay';s.agents[0].status='online';let sent=false,release;
 const peer=lab.message(s,'Groq','proposal','Peer report');lab.queue(s,'OpenAI','critique',{}, {replyTo:peer.id,recipient:'Groq'});lab.workers.set(lab.key(s.id,'OpenAI'),{connected:true,send:()=>{sent=true;},kill(){}});
 lab.relay={deliver:()=>new Promise(r=>{release=r;})};const pending=lab.dispatch(s,'OpenAI');lab.pauseDiscussion(s.id,true);release({message:peer,receipt:{transport:'agent-relay'}});await pending;assert.equal(sent,false);assert.equal(s.jobs[0].status,'pending');
 }finally{lab.close();rmSync(dir,{recursive:true,force:true});}
});

test('retrying a remote job preserves its original human guidance revision',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'curelab-voice-retry-')),lab=new Lab(dir);try{const s=lab.create();s.phase='PROTOCOL_REVIEW';s.transport='local';s.agents[0].status='online';const sent=[];lab.workers.set(lab.key(s.id,'OpenAI'),{connected:true,send:j=>sent.push(structuredClone(j)),kill(){}});lab.queue(s,'OpenAI','reply',{}, {note:'original task'});await lab.dispatch(s,'OpenAI');const j=s.jobs[0];assert.equal(j.guidanceRevision,0);
 s.guidanceRevision=1;lab.message(s,'You','note','New suggestion');j.status='pending';s.agents[0].status='online';await lab.dispatch(s,'OpenAI');assert.equal(sent[1].guidanceRevision,0);assert.deepEqual(sent[1].context.humanGuidance,[]);
 }finally{lab.close();rmSync(dir,{recursive:true,force:true});}
});
