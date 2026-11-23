import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import worker from '../workers/gdd-d1-admin/src/worker.mjs';

const schema=readFileSync('workers/gdd-d1-admin/migrations/editor-sandbox.sql','utf8');
const sql=new DatabaseSync(':memory:');
sql.exec(schema);
const edits=[];
const editDb={prepare(command){
 edits.push(command);
 const statement=sql.prepare(command);
 return {
  bind(...args){
   return {
    first:async()=>statement.get(...args)||null,
    all:async()=>({results:statement.all(...args)}),
    run:async()=>statement.run(...args)
   };
  },
  all:async()=>({results:statement.all()})
 };
}};
const testEmail='editor-check@example.invalid';
const source=JSON.parse(readFileSync('workers/gdd-d1-admin/wrangler.jsonc','utf8'));
const env={...source.vars,ADMIN_EMAIL_SHA256:createHash('sha256').update(testEmail).digest('hex'),
 EDIT_DB:editDb,DB:{prepare(){throw Error('Restored D1 must never be used by sandbox')}}};
const admin={access:{aud:env.ACCESS_AUD,getIdentity:async()=>({email:testEmail})}};
const deny={access:{aud:env.ACCESS_AUD,getIdentity:async()=>({email:'other@example.invalid'})}};
const origin='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev';
async function call(path,{method='GET',data,ctx=admin,headers={},testEnv=env}={}){
 const req=new Request(origin+path,{method,headers:{
   ...(data!==undefined?{'Content-Type':'application/json','Origin':origin}:{}),...headers
 },body:data===undefined?undefined:JSON.stringify(data)});
 const res=await worker.fetch(req,testEnv,ctx);
 return {status:res.status,body:await res.json()};
}
let recordId='',auditId='';
test('authenticated editor only reads synthetic sandbox and never reaches source D1',async()=>{
 const a=await call('/api/v1/admin/sandbox');
 assert.equal(a.status,200);
 assert.equal(a.body.mode,'synthetic-sandbox-only');
 assert.deepEqual(a.body.data,[]);
 assert.equal((await call('/api/v1/admin/sandbox',{ctx:deny})).status,403);
 assert.equal((await call('/api/v1/admin/sandbox',{ctx:{}})).status,403);
});
test('CSRF and method checks reject untrusted writes',async()=>{
 const p={kind:'people',title:'Test',summary:'Demo'};
 assert.equal((await call('/api/v1/admin/sandbox',{method:'POST',data:p,headers:{Origin:'https://evil.example'}})).status,403);
 assert.equal((await call('/api/v1/admin/sandbox',{method:'POST',data:p,headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
 assert.equal((await call('/api/v1/admin/sandbox',{method:'POST',data:p,ctx:deny})).status,403);
 assert.equal((await call('/api/v1/admin/sandbox',{method:'DELETE',data:p})).status,405);
});
test('create, optimistic update, audit and version conflict are isolated and atomic',async()=>{
 const created=await call('/api/v1/admin/sandbox',{method:'POST',data:{kind:'people',title:'Thử nghiệm',summary:'Không phải tư liệu gốc',published:false}});
 assert.equal(created.status,201);
 recordId=created.body.id;
 assert.match(recordId,/^[a-f\d-]{36}$/);
 assert.equal(created.body.published,false);
 const updated=await call('/api/v1/admin/sandbox/'+recordId,{method:'PATCH',data:{version:1,title:'Thử nghiệm đã chỉnh',summary:'Nội dung giả',published:true}});
 assert.equal(updated.status,200);
 assert.equal(updated.body.data.version,2);
 assert.equal(updated.body.data.published,1);
 assert.equal((await call('/api/v1/admin/sandbox/'+recordId,{method:'PATCH',data:{version:1,title:'Ghi đè'}})).status,409);
 const history=await call('/api/v1/admin/sandbox/'+recordId+'/history');
 assert.equal(history.status,200);
 assert.equal(history.body.data.length,1,'audit trigger must log one transaction');
 auditId=history.body.data[0].audit_id;
 assert.equal(JSON.parse(history.body.data[0].before_json).title,'Thử nghiệm');
 assert.equal(JSON.parse(history.body.data[0].after_json).title,'Thử nghiệm đã chỉnh');
});
test('restore previous revision creates new audit and never deletes originals',async()=>{
 const restored=await call('/api/v1/admin/sandbox/'+recordId+'/restore',{method:'POST',data:{version:2,audit_id:auditId}});
 assert.equal(restored.status,200);
 assert.equal(restored.body.data.title,'Thử nghiệm');
 assert.equal(restored.body.data.version,3);
 const history=await call('/api/v1/admin/sandbox/'+recordId+'/history');
 assert.equal(history.body.data.length,2);
 assert.equal((await call('/api/v1/admin/sandbox/'+recordId,{method:'DELETE'})).status,403); // blocked before any DB mutation
 assert.ok(edits.every(x=>!/^DELETE /i.test(x)));
});
test('validate identifiers, field allowlist, publication type and mutation privilege',async()=>{
 assert.equal((await call('/api/v1/admin/sandbox/invalid-id',{method:'PATCH',data:{version:1,title:'no'}})).status,400);
 assert.equal((await call('/api/v1/admin/sandbox',{method:'POST',data:{kind:'admin_users',title:'privileged'}})).status,400);
 assert.equal((await call('/api/v1/admin/sandbox',{method:'POST',data:{kind:'posts',title:'no',password:'bad'}})).status,400);
 assert.equal((await call('/api/v1/admin/sandbox',{method:'POST',data:{kind:'posts',title:'no',published:'true'}})).status,400);
});
