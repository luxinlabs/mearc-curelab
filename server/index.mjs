import {existsSync,readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import express from 'express';
import {resolve} from 'node:path';
import {createApplication} from './app.mjs';
// Explicit project configuration wins over inherited shell credentials.
if(existsSync('.env')){const config=parseEnv(readFileSync('.env','utf8'));for(const key of ['PORT','CURELAB_MODE','OPENAI_API_KEY','OPENAI_MODEL','GROQ_API_KEY','GROQ_MODEL','CURELAB_DATA_DIR','FREESTYLE_API_KEY','CURELAB_RUNTIME','CURELAB_TRANSPORT','RELAY_BROKER_URL','RELAY_BROKER_API_KEY','CURELAB_VOICE','OPENAI_TTS_MODEL','OPENAI_TRANSCRIBE_MODEL','OPENAI_SCIENTIST_VOICE','GROQ_SCIENTIST_VOICE'])if(Object.hasOwn(config,key))process.env[key]=config[key];}
const port=Number(process.env.PORT)||3000;
const {app,lab}=createApplication({port,dir:resolve(process.env.CURELAB_DATA_DIR||'data')});
if(process.env.NODE_ENV==='production'){app.use(express.static(resolve('dist')));app.get('*',(req,res)=>res.sendFile(resolve('dist/index.html')));}else{const {createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
const server=app.listen(port,'127.0.0.1',()=>console.log(`CureLab: http://localhost:${port} (${process.env.CURELAB_MODE||'demo'} mode)`));
function shutdown(){lab.close();server.close();process.exit(0);}process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
