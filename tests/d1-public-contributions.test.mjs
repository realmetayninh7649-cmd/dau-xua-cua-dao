import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../workers/gdd-d1/src/worker.mjs';
const BASE='https://gdd-d1-api-staging.realmetayninh7649.workers.dev';
const ORIGIN='https://dauxuacuadao.info.vn';
const saved=[],queries=[];
let rateOK=true,pending=0,recent=0,failDB=false;
const bucket={put:async(key,body,options)=>{
 assert.match(key,/^contributions\/pending\/[a-f\d-]{36}\/attachment\.(jpg|png|webp|pdf)$/);
 assert.equal(options.customMetadata.published,'false');
 assert.match(options.httpMetadata.cacheControl,/private/);
 saved.push({key,body,options});return {etag:'fake'};
}};
const db={prepare(sql){
 queries.push(sql);
 return {
  first:async()=>({n:sql.includes("status='pending'")?pending:recent}),
  bind(...args){return {
   first:async()=>({n:recent}),
   run:async()=>{if(failDB)throw Error('synthetic database error');return {success:true,meta:{changes:1}}}
  }}
 };
}};
const env={DB:db,SUBMISSIONS_BUCKET:bucket,
 CONTRIBUTION_RATE:{limit:async()=>({success:rateOK})}};
function form({withFile=false,website='',category='Hình ảnh',consent='on'}={}){
 const f=new FormData();
 const fields={sender_name:'Nguyễn Văn Thử',sender_email:'sample@example.invalid',category,
   title:'Tư liệu kiểm thử không công bố',description:'Tư liệu này dùng để thử tiếp nhận.',
   source:'Gia tộc',source_url:'https://example.org/reference',website,consent};
 for(const [k,v] of Object.entries(fields))f.set(k,v);
 if(withFile)f.set('attachment',new Blob([Uint8Array.from([0x25,0x50,0x44,0x46,0x2d,0x30,0x2e,0x31])],
  {type:'application/pdf'}),'test.pdf');
 return f;
}
async function call(formData,{origin=ORIGIN,method='POST',testEnv=env}={}){
 const r=await worker.fetch(new Request(BASE+'/api/v1/contributions',{
  method,headers:{Origin:origin,'CF-Connecting-IP':'198.51.100.7'},
  body:method==='POST'?formData:undefined
 }),testEnv,{});
 return {status:r.status,body:await r.json(),headers:r.headers};
}
test('rejects cross-site, unauthorized and disabled-rate contribution requests',async()=>{
 const count=saved.length;
 assert.equal((await call(form(),{origin:'https://evil.invalid'})).status,403);
 assert.equal((await call(form(),{testEnv:{DB:db,SUBMISSIONS_BUCKET:bucket}})).status,503);
 rateOK=false;
 assert.equal((await call(form())).status,429);
 rateOK=true;
 assert.equal(saved.length,count);
});
test('private text-only submission goes only to non-public D1 submissions inbox',async()=>{
 queries.length=0;
 const r=await call(form());
 assert.equal(r.status,201);
 assert.equal(r.body.accepted,true);
 assert.equal(r.body.private,true);
 assert.equal(r.body.attachment_saved,false);
 assert.match(r.body.reference,/^[a-f\d-]{36}$/);
 assert.equal(r.headers.get('Access-Control-Allow-Origin'),ORIGIN);
 assert.ok(queries.some(x=>x.startsWith('INSERT INTO submissions(')));
 assert.ok(queries.every(x=>!x.startsWith('SELECT * FROM submissions')));
 assert.equal((await worker.fetch(new Request(BASE+'/api/v1/public/submissions'),env,{})).status,404);
});
test('private PDF upload stored under unlisted R2 prefix, not published',async()=>{
 const old=saved.length;
 const r=await call(form({withFile:true}));
 assert.equal(r.status,201);
 assert.equal(r.body.attachment_saved,true);
 assert.equal(saved.length,old+1);
 assert.equal(r.body.private,true);
 assert.ok(!JSON.stringify(r.body).includes('contributions/pending'));
});
test('honeypot and inbox capacity block storage',async()=>{
 const old=saved.length;
 assert.equal((await call(form({website:'https://spam.invalid'}))).status,202);
 pending=100;
 assert.equal((await call(form())).status,429);
 pending=0;recent=20;
 assert.equal((await call(form())).status,429);
 recent=0;
 assert.equal(saved.length,old);
});
test('D1 insert failure cannot delete private original and never confirms receipt',async()=>{
 failDB=true;
 const old=saved.length;
 const r=await call(form({withFile:true}));
 assert.equal(r.status,503);
 assert.equal(r.body.original_kept_private,true);
 assert.equal(saved.length,old+1);
 failDB=false;
});
test('malformed input has no R2 write, and GET cannot expose inbox',async()=>{
 const before=saved.length;
 assert.equal((await call(form({category:'admin_users'}))).status,400);
 assert.equal((await call(form({consent:'no'}))).status,400);
 assert.equal((await call(undefined,{method:'GET'})).status,405);
 assert.equal(saved.length,before);
});
