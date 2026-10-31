// Unlock output directly in the user's click handler, before API latency.
export class VoicePlayer {
 constructor(factory=()=>{const AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AudioContext)throw Error('Audio playback is not supported in this browser.');return new AudioContext();}){this.factory=factory;this.context=null;this.source=null;this.finish=null;this.generation=0;}
 async unlock(){this.context??=this.factory();if(this.context.state!=='running')await this.context.resume();if(this.context.state!=='running')throw Error('Audio is blocked. Click Listen again to enable sound.');}
 async play(bytes,onStart=()=>{}){const generation=this.generation;if(!this.context||this.context.state!=='running')throw Error('Click Listen to enable audio playback.');const buffer=await this.context.decodeAudioData(bytes);if(generation!==this.generation)return;return new Promise((resolve,reject)=>{const source=this.context.createBufferSource();source.buffer=buffer;source.connect(this.context.destination);this.source=source;const done=()=>{source.disconnect();if(this.source===source){this.source=null;this.finish=null;}resolve();};this.finish=done;source.onended=done;try{source.start();onStart();}catch(e){done();reject(e);}});}
 stop(){this.generation++;const source=this.source;if(source){source.onended=null;try{source.stop();}catch{}this.finish?.();}}
 close(){this.stop();this.context?.close().catch(()=>{});this.context=null;}
}
