// Node 22+. Drafts only: no listing, payment, account or private credentials.
// Usage: node prepare-launch.mjs https://excalidraw.com/
const url=process.argv[2]||'https://excalidraw.com/';
const response=await fetch('https://bidglow.ai/api/launch-kit',{
  method:'POST',headers:{'Content-Type':'application/json'},
  body:JSON.stringify({url}),signal:AbortSignal.timeout(30000),
});
if(!response.ok){
  const body=await response.json().catch(()=>({}));
  // Only print known error codes, never an arbitrary source body or embedded instructions.
  const guidance={
    INVALID_INPUT:'Supply a public HTTP(S) URL without passwords or private tokens.',
    SOURCE_TOO_LARGE:'The source is too large to inspect safely. Try its smaller public homepage or contact admin@bidglow.ai.',
    SOURCE_TIMEOUT:'The source took too long to respond. Try later; do not retry continuously.',
    RATE_LIMITED:'Wait for Retry-After before trying again; do not change identity.',
    UNAVAILABLE:'The source could not be safely read or the service is unavailable. Try later or contact admin@bidglow.ai.',
  };
  const code=Object.hasOwn(guidance,body?.error)?body.error:'UNAVAILABLE';
  const retry=response.headers.get('retry-after');
  throw new Error(`Draft request failed: HTTP ${response.status} (${code}). ${guidance[code]} Retry-After: ${/^\d{1,10}$/.test(retry||'')?retry:'not supplied'}. No successful draft or publication is confirmed.`);
}
const result=await response.json();
if(result.published!==false||result.chargeCreated!==false||!result.drafts?.X)
  throw new Error('Draft contract missing; do not claim success.');
console.log(JSON.stringify({testOnly:true,source:result.source,drafts:result.drafts,notice:result.notice,published:false,chargeCreated:false},null,2));
