import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import worker from '../workers/gdd-d1-admin/src/worker.mjs';
import r2Gateway from '../workers/gdd-r2-gateway/src/index.mjs';

const cfg=JSON.parse(readFileSync('workers/gdd-d1-admin/wrangler.jsonc','utf8'));
const mail='managed-qa@example.invalid',base='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev';
const envVars={...cfg.vars,ADMIN_EMAIL_SHA256:createHash('sha256').update(mail).digest('hex')};
const ctx={access:{aud:envVars.ACCESS_AUD,getIdentity:async()=>({email:mail})}};
const objects=new Map(),sqlCalls=[];
const bucket={
 async get(key){
  const value=objects.get(key);return value?{json:async()=>JSON.parse(value.data),body:value.data,
    httpMetadata:value.httpMetadata}:null;
 },
 async head(key){const value=objects.get(key);return value?{size:value.size,etag:value.etag,
    customMetadata:value.customMetadata,httpMetadata:value.httpMetadata}:null},
 async put(key,data,options){
  if(objects.has(key)&&!key.startsWith('meta/'))throw Error('object collision');
  const size=typeof data==='string'?new TextEncoder().encode(data).length:data.byteLength;
  const obj={data,size,etag:'f'.repeat(32),...options};
  objects.set(key,obj);return {size,etag:obj.etag};
 },
 createMultipartUpload:async(key,opts)=>{
  assert.ok(!objects.has(key));return {uploadId:'test-upload-id-0001'};
 },
 resumeMultipartUpload:(key,uploadId)=>{
  assert.equal(uploadId,'test-upload-id-0001');
  return {
   uploadPart:async(partNumber,bytes)=>({etag:'e'.repeat(32),partNumber}),
   complete:async(parts)=>{assert.ok(parts.length>=1);return {}}
  };
 },
 list:async()=>({objects:[],truncated:false})
};
const db={prepare(sql){
 sqlCalls.push(sql);
 assert.match(sql,/^(INSERT OR IGNORE|UPDATE|SELECT)/,'Unexpected SQL in R2 index');
 return {bind:(...args)=>({run:async()=>({success:true}),first:async()=>null})};
}};
let bucketCalls=0;
async function go(path,{method='GET',raw=null,contentType='application/json',enabled=true,auth=ctx,origin=base}={}){
 const headers={};
 if(raw!==null){headers['Origin']=origin;headers['Content-Type']=contentType;headers['Content-Length']=String(raw.byteLength);}
 else if(method!=='GET'){headers['Origin']=origin;headers['Content-Type']='application/json'}
 const request=new Request(base+path,{method,headers,body:raw===null?undefined:raw});
 const res=await worker.fetch(request,{
  ...envVars,DB:db,GDD_BUCKET:bucket,ENABLE_MANAGED_R2:enabled?'enabled':'disabled'
 },auth);
 const json=await res.json();
 return {status:res.status,json};
}
test('R2 managed route fails closed without proper Access identity, flag, or origin',async()=>{
 const path='/api/v1/admin/r2/managed/v1/uploads/start';
 const before=objects.size;
 assert.equal((await go(path,{method:'POST',raw:new TextEncoder().encode('{}'),auth:{}})).status,403);
 assert.equal((await go(path,{method:'POST',raw:new TextEncoder().encode('{}'),enabled:false})).status,403);
 assert.equal((await go(path,{method:'POST',raw:new TextEncoder().encode('{}'),origin:'https://evil.example'})).status,403);
 assert.equal(objects.size,before);
});
let id='';
test('Access-managed small original stays private and indexes D1 without Supabase auth',async()=>{
 const bytes=new Uint8Array([255,216,255,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,255]);
 const path='/api/v1/admin/r2/managed/v1/uploads/small?name=kiem-tra.jpg&size='+bytes.length;
 const r=await go(path,{method:'PUT',raw:bytes,contentType:'image/jpeg'});
 assert.equal(r.status,201,JSON.stringify(r.json));
 id=r.json.id;assert.ok(id?.length===36);
 assert.equal(r.json.originalPreserved,true);
 assert.equal(r.json.publiclyAccessible,false);
 const original=[...objects.keys()].find(x=>x.startsWith('originals/')&&x.includes('/'+id+'/'));
 assert.ok(original,'R2 private original missing');
 assert.ok(!objects.has('derivatives/'+id+'/preview.webp'));
 assert.ok(sqlCalls.some(x=>x.includes('INSERT OR IGNORE INTO gdd_r2_assets')));
 assert.equal((await go('/api/v1/admin/r2/managed/v1/assets/'+id)).status,200);
 const denied=await r2Gateway.fetch(new Request('https://r2.test/v1/public/'+id),{GDD_BUCKET:bucket});
 assert.equal(denied.status,404,'Unpublished content must never be public');
});
test('Approved preview derivative is separately stored, then public, never exposes original',async()=>{
 const jpeg=new Uint8Array([255,216,255,...Array(50).fill(1)]);
 const p='/api/v1/admin/r2/managed/v1/assets/'+id+'/preview';
 const saved=await go(p,{method:'PUT',raw:jpeg,contentType:'image/jpeg'});
 assert.equal(saved.status,201);
 assert.equal(saved.json.originalUnchanged,true);
 assert.ok(objects.has('derivatives/'+id+'/preview.jpg'));
 const published=await go('/api/v1/admin/r2/managed/v1/assets/'+id+'/publication',
   {method:'POST',raw:new TextEncoder().encode(JSON.stringify({publish:true})),contentType:'application/json'});
 assert.equal(published.status,200,JSON.stringify(published.json));
 assert.equal(published.json.published,true);
 const publicImage=await r2Gateway.fetch(new Request('https://r2.test/v1/public/'+id+'/preview'),{GDD_BUCKET:bucket});
 assert.equal(publicImage.status,200);
 const badOriginal=await r2Gateway.fetch(new Request('https://r2.test/v1/originals/'+id),{GDD_BUCKET:bucket});
 assert.equal(badOriginal.status,403,'Original must not have any public route');
});
test('DELETE and raw R2 key retrieval remain denied',async()=>{
 assert.equal((await go('/api/v1/admin/r2/managed/v1/assets/'+id,{method:'DELETE'})).status,405);
 assert.equal((await go('/api/v1/admin/r2/managed/originals/private.jpg')).status,404);
});
