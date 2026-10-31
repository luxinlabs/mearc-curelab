// Preserve the complete text, including non-Latin text, within the speech API limit.
export function speechParts(text,limit=3500){
 if(!Number.isInteger(limit)||limit<2)throw Error('Invalid speech segment size');
 const parts=[];let rest=text||'';
 while(rest.length>limit){let end=limit;const boundary=rest.slice(0,limit).search(/[\s。！？.!?][^\s。！？.!?]*$/u);if(boundary>limit/2)end=boundary+1;
  if(/[\uD800-\uDBFF]/.test(rest[end-1]))end--;
  parts.push(rest.slice(0,end));rest=rest.slice(end);
 }if(rest)parts.push(rest);return parts;
}
export async function playSpeechTurn({request,player,isCurrent,onPrepare=()=>{},onStart=()=>{}}){
 let total=1;
 for(let part=0;part<total;part++){
  if(!isCurrent())return;onPrepare(part);
  const response=await request(part);const count=Number(response.headers.get('X-Speech-Parts')||1);
  if(!Number.isInteger(count)||count<1||count>1000)throw Error('Invalid speech response');total=count;
  const bytes=await response.arrayBuffer();if(!isCurrent())return;
  await player.play(bytes,onStart);
 }
}
