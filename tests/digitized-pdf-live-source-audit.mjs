// Read-only audit of public D1 and approved R2 print derivatives, no private originals.
import fs from 'node:fs';
import vm from 'node:vm';
const api='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/';
const env={window:{},URL};for(const p of ['gdd-private-publishing.js','gdd-legacy-r2-images.js'])vm.runInNewContext(fs.readFileSync(p,'utf8'),env);
async function read(url){const r=await fetch(url,{signal:AbortSignal.timeout(15000),headers:{Origin:'https://dauxuacuadao.info.vn'}});if(!r.ok)throw Error('HTTP '+r.status+' '+url);return (await r.json()).data}
const matches=new Set(),other=new Set();
for(let offset=0;offset<=5000;offset+=100){
 const rows=await read(api+'gallery?limit=100&offset='+offset);
 if(!Array.isArray(rows))throw Error('Unexpected album list');
 for(const r of rows)if(r.owner_kind==='documents'){if(/IMG[_ -]?88(?:19|20)/i.test(r.caption||''))matches.add(r.owner_id);other.add(r.owner_id)}
 if(rows.length<100)break;
}
console.log('Matching documents:',matches.size,'total documents with photos:',other.size);
const ids=matches.size?[...matches]:[...other].slice(0,3);
for(const id of ids){
 let images=[];for(let offset=0;offset<2000;offset+=100){const rows=await read(api+'albums?owner_kind=documents&owner_id='+id+'&limit=100&offset='+offset);images.push(...rows);if(rows.length<100)break}
 console.log('Document',id,'album rows',images.length);
 for(const r of images.slice(0,24)){
  const original=r.image_url||'',print=env.window.GDDLegacyImages.printUrl(original);
  let u;try{u=new URL(print)}catch{console.log('invalid URL');continue}
  if(u.hostname!=='gdd-r2-gateway.realmetayninh7649.workers.dev'){console.log('No approved R2 print mapping:',r.caption||r.sort_order,u.hostname);continue}
  try{const resp=await fetch(print,{headers:{Range:'bytes=0-15',Origin:'https://dauxuacuadao.info.vn'},signal:AbortSignal.timeout(15000)});console.log('Print page',r.sort_order,r.caption||'',resp.status,resp.headers.get('content-type'),'CORS',resp.headers.get('access-control-allow-origin'));await resp.body?.cancel()}catch(e){console.log('Print probe error',e.message)}
 }
}
