import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import worker from '../workers/gdd-d1-admin/src/worker.mjs';
import {ADMIN_HTML,ADMIN_JS} from '../workers/gdd-d1-admin/src/admin-ui.mjs';
const conf=JSON.parse(readFileSync('workers/gdd-d1-admin/wrangler.jsonc','utf8'));
const email='test-inbox@example.invalid',vars={...conf.vars,ADMIN_EMAIL_SHA256:createHash('sha256').update(email).digest('hex')};
const authorized={access:{aud:vars.ACCESS_AUD,getIdentity:async()=>({email})}};
const denied={access:{aud:vars.ACCESS_AUD,getIdentity:async()=>({email:'no@example.invalid'})}};
const uuid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const row={id:uuid,title:'Tư liệu gửi riêng',sender_name:'Người đóng góp',
 sender_email:'example@example.invalid',description:'Chỉ xem trong quản trị',
 file_path:'contributions/pending/'+uuid+'/attachment.pdf',status:'pending'};
const sql=[];
const db={prepare(statement){sql.push(statement);return {
 all:async()=>({results:[row]}),
 bind:(id)=>({first:async()=>id===uuid?row:null})
};}};
const r2={get:async(key)=>{
 assert.equal(key,row.file_path);
 return {body:new Blob(['%PDF-private']),size:12};
}};
async function call(path,ctx=authorized,env={...vars,DB:db,GDD_BUCKET:r2}){
 const res=await worker.fetch(new Request('https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'+path),env,ctx);
 return res;
}
test('private submissions listing requires Access and exposes no public preview',async()=>{
 assert.equal((await call('/api/v1/admin/contributions',denied)).status,403);
 assert.equal((await call('/api/v1/admin/contributions')).status,200);
 const res=await call('/api/v1/admin/contributions');
 assert.equal((await res.json()).data[0].sender_email,row.sender_email);
 assert.ok(sql.some(x=>x.startsWith('SELECT')));
});
test('original contribution only streams as attachment to validated Access staff',async()=>{
 const path='/api/v1/admin/contributions/'+uuid+'/attachment';
 assert.equal((await call(path,denied)).status,403);
 const res=await call(path);
 assert.equal(res.status,200);
 assert.match(res.headers.get('Content-Disposition'),/attachment;/);
 assert.equal(res.headers.get('Cache-Control'),'private,no-store');
 assert.equal((await res.text()).startsWith('%PDF'),true);
 assert.equal((await call('/api/v1/admin/contributions/'+uuid+'/../attachment')).status,404);
});
test('staff page shows inbox link without synthetic sandbox UI',()=>{
 assert.ok(ADMIN_HTML.includes('id="contribution-panel"'));
 assert.ok(ADMIN_HTML.includes('id="contribution-refresh"'));
 assert.ok(ADMIN_JS.includes("api('/api/v1/admin/contributions')"));
 assert.ok(!ADMIN_HTML.includes('id="sandbox-title"'));
});
