import express from 'express';
import { z } from 'zod';
import { resolve, join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { Lab, providers } from './lab.mjs';
export function createApplication({port=3000,dir=resolve('data')}={}) {
function verification(){try{return JSON.parse(readFileSync(join(dir,'runtime-verification.json'),'utf8'));}catch{return null;}}
const app=express(),streams=new Map(),token=randomBytes(32).toString('hex');
app.use(express.json({limit:'32kb'}));
app.use('/api',(req,res,next)=>{res.set('Cache-Control','no-store');if(!['GET','HEAD'].includes(req.method)){if(req.get('x-curelab-session')!==token)return res.status(403).json({error:'Local PI session required. Reload the page.'});if(req.get('origin')&&!new Set([`http://localhost:${port}`,`http://127.0.0.1:${port}`]).has(req.get('origin')))return res.status(403).json({error:'Origin not allowed'});}next();});
const lab=new Lab(dir,id=>{for(const res of streams.get(id)||[])res.write(`data: ${JSON.stringify(lab.snapshot(id))}\n\n`);});
if(!lab.missions.size||[...lab.missions.values()].at(-1).agents.some(a=>!providers.includes(a.name)))lab.create();lab.recover();
app.get('/api/session',(req,res)=>res.json({token,runtimeVerification:verification(),mode:process.env.CURELAB_MODE!=='demo'?'live':'demo',models:{OpenAI:process.env.OPENAI_MODEL||null,Groq:process.env.GROQ_MODEL||null},integrations:{storage:'SQLite · local durable state',transport:process.env.CURELAB_RUNTIME==='freestyle'?'Freestyle VMs · polled task events':'Local IPC · persisted messages',terse:'Not connected',relay:'Not connected',OpenAI:process.env.CURELAB_MODE!=='demo'?'Live provider':'Demo scientist',Groq:process.env.CURELAB_MODE!=='demo'?'Live provider':'Demo scientist'}}));
app.get('/api/missions',(req,res)=>res.json([...lab.missions.values()].map(s=>({id:s.id,question:s.question,phase:s.phase}))));
app.post('/api/missions',(req,res)=>res.status(201).json(lab.create(z.string().trim().min(10).max(500).parse(req.body.question))));
app.get('/api/missions/:id',(req,res)=>res.json(lab.snapshot(req.params.id)));
app.post('/api/missions/:id/start',(req,res)=>{lab.start(req.params.id);res.json(lab.snapshot(req.params.id));});
app.get('/api/missions/:id/events',(req,res)=>{lab.get(req.params.id);res.set({'Content-Type':'text/event-stream','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();if(!streams.has(req.params.id))streams.set(req.params.id,new Set);streams.get(req.params.id).add(res);res.write(`data: ${JSON.stringify(lab.snapshot(req.params.id))}\n\n`);const timer=setInterval(()=>res.write(': heartbeat\n\n'),15000);req.on('close',()=>{clearInterval(timer);streams.get(req.params.id)?.delete(res);});});
app.get('/api/missions/:id/audit',(req,res)=>{lab.get(req.params.id);res.json(lab.store.events(req.params.id));});
app.post('/api/missions/:id/agents/:name/:action',(req,res)=>{const name=z.enum(lab.get(req.params.id).agents.map(a=>a.name)).parse(req.params.name),action=z.enum(['stop','resume']).parse(req.params.action);lab[action](req.params.id,name);res.json({ok:true});});
app.post('/api/missions/:id/discuss',(req,res)=>res.json(lab.discuss(req.params.id)));
app.post('/api/missions/:id/messages',(req,res)=>res.json(lab.note(req.params.id,z.string().trim().min(1).max(2000).parse(req.body.content))));
const protocolSchema=z.object({name:z.string().trim().min(3).max(120),candidate:z.string().trim().min(1).max(80),dose:z.number().min(0).max(100),glucose:z.number().min(2).max(25),replicates:z.number().int().min(3).max(32),seed:z.number().int().min(0).max(2147483647)}).strict();
app.post('/api/experiments',(req,res)=>{const s=lab.get(req.body.missionId);if(['READY','DISCOVERY','CROSS_REVIEW'].includes(s.phase))return res.status(409).json({error:'Complete independent research first.'});if(s.experiments.some(e=>e.status==='RUNNING'))return res.status(409).json({error:'Wait for the active assay to finish.'});res.status(201).json(lab.propose(s,protocolSchema.parse(req.body.protocol)));});
app.post('/api/experiments/:id/approve',(req,res)=>res.json(lab.approve(req.params.id,z.number().int().parse(req.body.version),z.string().length(64).parse(req.body.protocolHash))));
app.post('/api/experiments/:id/run',(req,res)=>res.json(lab.run(req.params.id,z.string().min(8).max(100).parse(req.body.commandId))));
app.get('/api/experiments/:id/results',(req,res)=>{const {e}=lab.experiment(req.params.id);res.json({status:e.status,result:e.result||null,artifact:e.artifact||null});});
app.get('/api/artifacts/:hash',(req,res)=>{const h=z.string().regex(/^[a-f0-9]{64}$/).parse(req.params.hash),file=join(dir,'artifacts',`${h}.json`);if(!existsSync(file))return res.status(404).json({error:'Artifact not found'});res.sendFile(file);});
app.post('/api/missions/:id/pr',(req,res)=>res.json(lab.makePR(req.params.id)));
app.post('/api/missions/:id/pr/decision',(req,res)=>{const s=lab.get(req.params.id);if(!s.pr)return res.status(409).json({error:'Create a PR first.'});s.pr.decision=z.enum(['ACCEPTED','REPLICATION_REQUESTED']).parse(req.body.decision);s.pr.status='REVIEWED';lab.commit(s,'PR_REVIEWED',{decision:s.pr.decision});res.json(s.pr);});
app.get('/api/missions/:id/export',(req,res)=>{const s=lab.snapshot(req.params.id);res.attachment(`${s.id}-research-bundle.json`).json({mission:s,audit:lab.store.events(s.id),exportedAt:new Date().toISOString()});});
app.use('/api',(req,res)=>res.status(404).json({error:'API route not found'}));
app.use((err,req,res,next)=>{res.status(err instanceof z.ZodError?400:err.status||500).json({error:err instanceof z.ZodError?err.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '):err.message});});
return {app,lab};
}
