// Run on a dedicated host with agent-relay@7.1.1 installed globally.
// Creates/reuses the SDK's Relaycast workspace and keeps the broker lease alive.
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
const root=execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim();
const require=createRequire(join(root,'agent-relay/package.json'));
const {AgentRelay}=await import(require.resolve('@agent-relay/sdk'));
const relay=new AgentRelay({cwd:process.cwd(),workspaceName:'CureLab research',brokerName:'curelab',binaryArgs:{apiPort:3888,apiBind:'0.0.0.0',persist:true}});
await relay.listAgents();
console.log('CureLab Agent Relay broker ready on port 3888');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await relay.shutdown();process.exit(0);});
setInterval(()=>{},60000);
