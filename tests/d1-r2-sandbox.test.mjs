import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import worker from '../workers/gdd-d1-admin/src/worker.mjs';
import {readFileSync} from 'node:fs';
const cfg=JSON.parse(readFileSync('workers/gdd-d1-admin/wrangler.jsonc','utf8'));
const email='r2-admin@example.invalid',origin='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev';
const env={...cfg.vars,ADMIN_EMAIL_SHA256:createHash('sha256').update(email).digest('hex')};
const ctx={access:{aud:env.ACCESS_AUD,getIdentity:async()=>({email})}};
const bucket={
 objects:[],list:async({prefix,limit})=>{assert.equal(prefix,'__gdd_internal__/access-staging-uploads-v1/');
  return {objects:bucket.objects.slice(0,limit),truncated:false};},
 head:async key=>bucket.objects.find(o=>o.key===key)||null,
 put:async(key,data,options)=>{
  assert.match(key,/^__gdd_internal__\/access-staging-uploads-v1\/[a-f\d-]{36}\/source\.(?:png|jpg|webp|pdf|docx)$/);
  assert.equal(options.customMetadata.published,'false');
  assert.match(options.httpMetadata.cacheControl,/private/);
  bucket.objects.push({key,size:data.byteLength,uploaded:new Date(),customMetadata:options.customMetadata});
 }};
async function go(method,data,type='image/png',headers={},testCtx=ctx){
 const req=new Request(origin+'/api/v1/admin/r2/staging-uploads',{
  method,headers:{...(method==='POST'?{'Origin':origin,'Content-Type':type,'Content-Length':String(data.length)}:{}),...headers},
  body:method==='POST'?data:undefined
 });
 const r=await worker.fetch(req,{...env,GDD_BUCKET:bucket},testCtx);
 return {status:r.status,data:await r.json()};
}
test('unauthenticated R2 upload and GET blocked even with payload',async()=>{
 const bad={};
 assert.equal((await go('GET',null,'image/png',{},bad)).status,403);
 assert.equal((await go('POST',new Uint8Array(8),'image/png',{},bad)).status,403);
 assert.equal(bucket.objects.length,0);
});
test('reject invalid file signature and forbidden origin, no object written',async()=>{
 const bytes=new Uint8Array(16);
 assert.equal((await go('POST',bytes)).status,422);
 assert.equal((await go('POST',bytes,'image/png',{Origin:'https://evil.example'})).status,403);
 assert.equal(bucket.objects.length,0);
});
test('private PNG upload computes SHA256 and never publishes / provides key',async()=>{
 const bytes=new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0,1]);
 const r=await go('POST',bytes);
 assert.equal(r.status,201);
 assert.equal(r.data.original_private,true);
 assert.equal(r.data.published,false);
 assert.ok(!JSON.stringify(r.data).includes('__gdd_internal__'));
 assert.equal(r.data.sha256,createHash('sha256').update(bytes).digest('hex'));
 assert.equal(bucket.objects.length,1);
 const list=await go('GET');
 assert.equal(list.status,200);
 assert.equal(list.data.count,1);
 assert.equal(list.data.objects[0].sha256,r.data.sha256);
 assert.ok(!JSON.stringify(list.data).includes('source.png'));
});
test('hard delete prohibited and quota strictly bounded',async()=>{
 assert.equal((await go('DELETE')).status,403);
 bucket.objects=Array.from({length:20},(_,i)=>({key:'key'+i,size:100,uploaded:new Date()}));
 const bytes=new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0,0,0,0]);
 assert.equal((await go('POST',bytes,'application/pdf')).status,429);
 assert.equal(bucket.objects.length,20);
});
