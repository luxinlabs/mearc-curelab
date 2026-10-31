import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSummary,summarizeForVoice,summaryKey} from '../server/voice-summary.mjs';
process.env.OPENAI_MODEL='configured-model';process.env.OPENAI_API_KEY='test-only';
test('summary limits enforce brevity without truncating important caveats',()=>{
 assert.equal(validateSummary({sentences:['请先检查细胞活性。','这只是模拟结果。']}),'请先检查细胞活性。 这只是模拟结果。');
 for(const sentences of [[],['One.','Two.','Three.'],['One. Two. Three.'],['x'.repeat(501)],['word '.repeat(66)],['']])assert.throws(()=>validateSummary({sentences}));
});
test('summary request uses full source, configured model and constrained output; malformed/refused output fails closed',async()=>{
 const message={sender:'Groq',content:'Long original research report. '.repeat(300)};const original=structuredClone(message);
 const result=await summarizeForVoice(message,{fetcher:async(url,options)=>{assert.ok(url.endsWith('/responses'));const body=JSON.parse(options.body);assert.equal(body.model,'configured-model');assert.equal(JSON.parse(body.input).message,message.content);assert.equal(body.text.format.strict,true);assert.match(body.instructions,/uncertainty/);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({sentences:['I propose a controlled simulation.','Clinical benefit remains untested.']})}]}]});}});
 assert.equal(result.text,'I propose a controlled simulation. Clinical benefit remains untested.');assert.deepEqual(message,original);
 for(const data of [{output_text:'not json'},{status:'incomplete',output_text:'{}'},{output:[{content:[{type:'refusal',refusal:'No'}]}]}])await assert.rejects(summarizeForVoice(message,{fetcher:async()=>Response.json(data)}));
 assert.notEqual(summaryKey(message),summaryKey({...message,content:'Changed'}));assert.notEqual(summaryKey(message),summaryKey({...message,guidanceRevision:1}));
});
