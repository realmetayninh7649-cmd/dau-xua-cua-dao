import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import worker from '../workers/gdd-d1-admin/src/worker.mjs';
import {readFileSync} from 'node:fs';
const cfg=JSON.parse(readFileSync('workers/gdd-d1-admin/wrangler.jsonc','utf8'));
const mail='work-editor@example.invalid';
const env={...cfg.vars,ADMIN_EMAIL_SHA256:createHash('sha256').update(mail).digest('hex')};
const good={access:{aud:env.ACCESS_AUD,getIdentity:async()=>({email:mail})}};
const forged={access:{aud:env.ACCESS_AUD,getIdentity:async()=>({email:'forged@example.invalid'})}};
const base='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev';
let queries=[];
const data={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',slug:'mau-ho-so',archive_code:'CS-CTD.GS-00001',
  full_name:'Thử nghiệm mẫu',summary:'Bản gốc giả lập',published:0,gdd_version:1};
const db={prepare(sql){
 queries.push(sql);
 assert.match(sql,/^(SELECT|UPDATE|INSERT) /,'Only allow SQL read/update/insert');
 const self={
  bind(...args){return {
   first:async()=>{
    if(sql.startsWith('SELECT * FROM "people"'))return {...data};
    if(sql.startsWith('UPDATE "people"')){
      if(args.at(-1)!==data.gdd_version)return null;
      const m=sql.match(/SET (.*?)\,updated_at=\?/),columns=m[1].split(',').map(x=>x.split('=')[0].replaceAll('"',''));
      for(let i=0;i<columns.length;i++)data[columns[i]]=args[i];
      data.gdd_version++;return {...data};
    }
    if(sql.includes('gdd_v2_editor_revisions'))return null;
    return null;
   },
   all:async()=>({results:[]})
  }},
  all:async()=>({results:[]})
 };
 return self;
}};
async function call(method,path,payload,{authorized=true,enabled=true,headers={}}={}){
 const body=payload===undefined?undefined:JSON.stringify(payload);
 const req=new Request(base+path,{
  method,headers:{...(body?{'Origin':base,'Content-Type':'application/json'}:{}),...headers},body
 });
 const res=await worker.fetch(req,{...env,DB:db,ENABLE_WORKING_EDITOR:enabled?'enabled':'disabled'},authorized?good:forged);
 return {status:res.status,body:await res.json()};
}
test('working editor Access and kill switch deny ALL unauthorized calls',async()=>{
 const path='/api/v1/admin/work/people/'+data.id;
 assert.equal((await call('GET',path,undefined,{authorized:false})).status,403);
 assert.equal((await call('GET',path,undefined,{enabled:false})).status,403);
 assert.equal((await call('PATCH',path,{version:1,fields:{summary:'Fake'}},{authorized:false})).status,403);
 assert.equal((await call('DELETE',path,undefined)).status,405);
});
test('field whitelist forbids modifying protected ID and archive code',async()=>{
 const p='/api/v1/admin/work/people/'+data.id;
 assert.equal((await call('PATCH',p,{version:1,fields:{archive_code:'fake'}})).status,400);
 assert.equal((await call('PATCH',p,{version:1,fields:{id:'anything'}})).status,400);
 assert.equal((await call('PATCH',p,{version:1,fields:{full_name:'Name',published:'true'}})).status,400);
 assert.equal((await call('PATCH',p,{version:1,fields:{image_url:'javascript:alert(1)'}})).status,400);
 assert.equal((await call('PATCH',p,{version:1,fields:{summary:'Edit'}},{headers:{Origin:'https://evil.invalid'}})).status,403);
});
test('optimistic versioned edit updates ONLY explicitly selected fields',async()=>{
 const p='/api/v1/admin/work/people/'+data.id;
 const before={...data};
 const updated=await call('PATCH',p,{version:1,fields:{summary:'Biên tập được lưu',published:false}});
 assert.equal(updated.status,200);
 assert.equal(updated.body.data.summary,'Biên tập được lưu');
 assert.equal(updated.body.data.gdd_version,2);
 assert.equal(updated.body.data.archive_code,before.archive_code);
 assert.equal(updated.body.audit_trigger,'automatic');
 assert.equal((await call('PATCH',p,{version:1,fields:{summary:'Lỗi phiên bản'}})).status,409);
 assert.ok(queries.some(q=>q.includes('gdd_version=gdd_version+1')));
 assert.ok(queries.every(q=>!/^DELETE/i.test(q)));
});
test('disabled flag leaves working D1 entirely unchanged',async()=>{
 const before=queries.length;
 const r=await call('PATCH','/api/v1/admin/work/people/'+data.id,
   {version:2,fields:{summary:'test'}},{enabled:false});
 assert.equal(r.status,403);
 assert.equal(queries.length,before);
});
test('all nine working content kinds listed but private system tables rejected',async()=>{
 const kinds=['people','posts','media','videos','obituaries','documents',
   'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials'];
 for(const kind of kinds)assert.equal((await call('GET','/api/v1/admin/work/'+kind)).status,200);
 assert.equal((await call('GET','/api/v1/admin/work/admin_users')).status,404);
 assert.equal((await call('GET','/api/v1/admin/work/submissions')).status,404);
});
