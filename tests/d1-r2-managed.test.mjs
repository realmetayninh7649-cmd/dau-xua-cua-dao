import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import worker from '../workers/gdd-d1-admin/src/worker.mjs';
const cfg=JSON.parse(readFileSync('workers/gdd-d1-admin/wrangler.jsonc','utf8'));
const mail='managed-qa@example.invalid',base='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev';
const env={...cfg.vars,ADMIN_EMAIL_SHA256:createHash('sha256').update(mail).digest('hex')};
const ctx={access:{aud:env.ACCESS_AUD,getIdentity:async()=>({email:mail})}};
let r2Touched=0;
const bucket={async get(){r2Touched++;return null},async put(){r2Touched++;throw Error('No writes expected')},
 async createMultipartUpload(){r2Touched++;throw Error('No writes expected')},async head(){r2Touched++;return null}};
async function call(path,{method='GET',data,enabled=false,headers={},auth=ctx}={}){
 const req=new Request(base+path,{method,headers:{...(data?{'Content-Type':'application/json',Origin:base}:{}),...headers},
  body:data?JSON.stringify(data):undefined});
 const res=await worker.fetch(req,{...env,GDD_BUCKET:bucket,ENABLE_MANAGED_R2:enabled?'enabled':'disabled'},auth);
 return {status:res.status,body:await res.json()};
}
test('Managed R2 is denied to every unauthorized caller even on enabled host',async()=>{
 const path='/api/v1/admin/r2/managed/v1/uploads/start';
 assert.equal((await call(path,{method:'POST',data:{name:'test.pdf',size:512},enabled:true,auth:{}})).status,403);
 assert.equal(r2Touched,0);
});
test('Managed R2 fail-closed flag prevents bucket operations',async()=>{
 const path='/api/v1/admin/r2/managed/v1/uploads/start';
 assert.equal((await call(path,{method:'POST',data:{name:'test.pdf',size:512}})).status,403);
 assert.equal(r2Touched,0);
});
test('Same-origin CSRF protection rejects arbitrary origins and hard deletion',async()=>{
 const path='/api/v1/admin/r2/managed/v1/uploads/start';
 assert.equal((await call(path,{method:'POST',data:{name:'test.pdf',size:512},enabled:true,
 headers:{Origin:'https://evil.example'}})).status,403);
 assert.equal((await call('/api/v1/admin/r2/managed/v1/assets/invalid',{enabled:true})).status,404);
 assert.equal(r2Touched,0);
});
