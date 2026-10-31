// Official Agent Relay 7.1.1 broker HTTP API. Broker mailbox harnesses are
// transport endpoints; scientific execution stays in the provider's own VM.
export class RelayTransport {
 constructor({url=process.env.RELAY_BROKER_URL,key=process.env.RELAY_BROKER_API_KEY,fetcher=fetch}={}){this.url=url?.replace(/\/$/,'');this.key=key;this.fetcher=fetcher;this.mailboxes=new Map;}
 async api(path,method='GET',body){
  if(!this.url||!this.key)throw Error('Agent Relay requires RELAY_BROKER_URL and RELAY_BROKER_API_KEY');
  const u=new URL(this.url);if(u.protocol!=='https:'&&!['127.0.0.1','localhost','[::1]'].includes(u.hostname))throw Error('Remote Agent Relay requires HTTPS');
  let r;try{r=await this.fetcher(this.url+path,{method,headers:{'X-API-Key':this.key,'Content-Type':'application/json'},signal:AbortSignal.timeout(path==='/api/spawn'?90000:35000),...(body?{body:JSON.stringify(body)}:{})});}catch{throw Error('Agent Relay unreachable; peer delivery stopped');}
  if(!r.ok)throw Object.assign(Error(`Agent Relay HTTP ${r.status}; peer delivery stopped`),{status:r.status});
  const data=await r.json();if(data.success===false)throw Error('Agent Relay rejected the operation');return data;
 }
 identity(mission,provider){if(!/^T2D-[a-f0-9]{8}$/.test(mission)||!['OpenAI','Groq'].includes(provider))throw Error('Invalid Relay identity');return `${mission.toLowerCase()}-${provider.toLowerCase()}`;}
 async mailbox(name){
  if(this.mailboxes.has(name))return this.mailboxes.get(name);
  const pending=this.ensureMailbox(name);this.mailboxes.set(name,pending);
  try{return await pending;}finally{this.mailboxes.delete(name);}
 }
 async ensureMailbox(name){
  try{await this.api(`/api/spawned/${name}/delivery-mode`);}catch(e){if(e.status!==404)throw e;await this.api('/api/spawn','POST',{name,cli:'/bin/cat',skipRelayPrompt:true,channels:[],harnessConfig:{runtime:'pty',command:'/bin/cat',args:[]}});}
  await this.api(`/api/spawned/${name}/delivery-mode`,'PUT',{mode:'manual_flush'});
 }
 async deliver({mission,jobId,peer,to}){
  const from=this.identity(mission,peer.sender),target=this.identity(mission,to);
  await this.mailbox(from);await this.mailbox(target);
  const path=`/api/spawned/${target}/pending`,envelope={schema:'curelab.peer.v1',mission,jobId,message:peer};
  const match=async()=>{const data=await this.api(path);for(const item of data.pending||[]){let value;try{value=JSON.parse(item.body);}catch{continue;}if(value.jobId!==jobId)continue;
    if(item.from!==from||item.target!==target||value.mission!==mission||value.schema!==envelope.schema||value.message?.id!==peer.id||value.message?.sender!==peer.sender||value.message?.content!==peer.content)throw Error('Agent Relay message identity or content mismatch');
    return {message:value.message,receipt:{transport:'agent-relay',jobId,from,to:target,eventId:item.event_id||null,queuedAt:item.queued_at_ms||null,receivedAt:new Date().toISOString()}};
  }return null;};
  let received=await match();if(!received){await this.api('/api/send','POST',{from,to:target,message:JSON.stringify(envelope),mode:'wait'});for(let i=0;i<20&&!received;i++){received=await match();if(!received)await new Promise(r=>setTimeout(r,250));}}
  if(!received)throw Error('Agent Relay did not confirm the recipient mailbox; peer delivery stopped');
  return received;
 }
}
