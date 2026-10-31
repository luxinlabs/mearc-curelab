import test from 'node:test';
import assert from 'node:assert/strict';
import {RelayTransport} from '../server/relay.mjs';
const peer={id:'message-1',sender:'OpenAI',content:'Preserve the viability control.'};
const input={mission:'T2D-1234abcd',jobId:'job-1',peer,to:'Groq'};
function broker({tamper=false,down=false}={}){const pending=[],agents=new Set,requests=[];const fetcher=async(url,opts)=>{requests.push({url,opts});assert.equal(opts.headers['X-API-Key'],'test-secret');if(down)throw Error('network');const path=new URL(url).pathname,b=opts.body&&JSON.parse(opts.body);let data={success:true},status=200;
 if(path==='/api/spawn')agents.add(b.name);
 else if(path.endsWith('/delivery-mode')&&!agents.has(path.split('/')[3]))status=404;
 else if(path==='/api/send'){pending.push({from:b.from,target:b.to,body:tamper?JSON.stringify({...JSON.parse(b.message),mission:'T2D-00000000'}):b.message,event_id:'evt-1',queued_at_ms:123});}
 else if(path.endsWith('/pending'))data={pending};
 return new Response(JSON.stringify(data),{status});};return {relay:new RelayTransport({url:'https://relay.example',key:'test-secret',fetcher}),requests};}
test('peer payload is received from real broker API contract, correlated and retry-deduplicated',async()=>{const {relay,requests}=broker();const received=await relay.deliver(input);assert.deepEqual(received.message,peer);assert.equal(received.receipt.eventId,'evt-1');assert.equal(received.receipt.to,'t2d-1234abcd-groq');await relay.deliver(input);assert.equal(requests.filter(r=>r.url.endsWith('/api/send')).length,1);assert.equal(requests.filter(r=>r.url.endsWith('/api/spawn')).length,2);});
test('Relay failure does not return a local peer payload',async()=>{await assert.rejects(broker({down:true}).relay.deliver(input),/unreachable/);});
test('Relay rejects mismatched mission or sender',async()=>{await assert.rejects(broker({tamper:true}).relay.deliver(input),/mismatch/);});
test('Remote broker credentials require TLS',async()=>{await assert.rejects(new RelayTransport({url:'http://relay.example',key:'secret'}).deliver(input),/HTTPS/);});
