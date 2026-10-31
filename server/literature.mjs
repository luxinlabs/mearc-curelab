import {createHash} from 'node:crypto';
export async function findPapers(question,emit,fetcher=fetch){
 emit({event:'LITERATURE_SEARCH',detail:'Searching Europe PMC for up to 3 abstracts.'});
 const url=new URL('https://www.ebi.ac.uk/europepmc/webservices/rest/search');url.search=new URLSearchParams({query:question,format:'json',resultType:'core',pageSize:'3'});
 const res=await fetcher(url,{signal:AbortSignal.timeout(20000)});if(!res.ok)throw Error(`Literature search HTTP ${res.status}`);
 const data=await res.json();const papers=(data.resultList?.result||[]).slice(0,3).map(r=>({id:`${r.source}:${r.id}`,title:r.title||'Untitled',authors:r.authorString||'',year:r.pubYear||'',doi:r.doi||null,url:`https://europepmc.org/article/${encodeURIComponent(r.source)}/${encodeURIComponent(r.id)}`,abstract:(r.abstractText||'').replace(/<[^>]*>/g,' ').slice(0,16000),scope:'abstract_only',retrievedAt:new Date().toISOString()}));
 for(const p of papers){p.contentSha256=createHash('sha256').update(p.abstract).digest('hex');emit({event:'PAPER_RETRIEVED',detail:p.abstract?'Abstract retrieved; not yet supplied to model.':'Metadata retrieved; abstract unavailable.',paper:p});}
 return papers;
}
