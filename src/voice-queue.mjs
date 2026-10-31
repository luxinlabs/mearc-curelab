export function playableTurns(mission){return mission.messages.filter(m=>['OpenAI','Groq'].includes(m.sender)&&['critique','discussion','reply'].includes(m.type)&&(m.guidanceRevision||0)>=(mission.guidanceRevision||0));}
export function nextUnheardTurn(mission,seen){return playableTurns(mission).find(m=>!seen.has(m.id));}
// An explicit Listen replays the most recent current turn from each scientist.
// Independent proposals and conclusions predating human guidance stay silent.
export function seedListeningQueue(mission){const turns=playableTurns(mission),latest=new Map();for(const m of turns)latest.set(m.sender,m.id);const replay=new Set(latest.values());return new Set(turns.filter(m=>!replay.has(m.id)).map(m=>m.id));}
