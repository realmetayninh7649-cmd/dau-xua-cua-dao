import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import worker from '../workers/gdd-d1-admin/src/worker.mjs';
import {ADMIN_HTML,ADMIN_JS,ADMIN_CSS} from '../workers/gdd-d1-admin/src/admin-ui.mjs';
import {readFileSync} from 'node:fs';
const original=JSON.parse(readFileSync('workers/gdd-d1-admin/wrangler.jsonc','utf8'));
const auditEmail='qa-person@example.invalid';
const vars={...original.vars,
 ADMIN_EMAIL_SHA256:createHash('sha256').update(auditEmail).digest('hex')};
let sqlHistory=[];
const counts=JSON.parse(readFileSync('workers/gdd-d1/source-row-counts-20261123.json','utf8')).table_counts;
const publishedCounts={people:50,posts:17,documents:21,media:13,videos:8,
 obituaries:2,gdd_memorials:5,gdd_audio_programs:2,gdd_calendar_memorials:0};
const db={prepare(sql){
 sqlHistory.push(sql);
 assert.ok(/^SELECT\s/i.test(sql),'Only SELECT statements are supported: '+sql);
 const match=sql.match(/FROM "(\w+)"/);
 const key=match?.[1];
 if(/COUNT\(\*\)/.test(sql)){
  return {first:async(field)=>{
   assert.equal(field,'n');
   return (/WHERE published=1/.test(sql)?publishedCounts[key]:counts[key])??0;
  }};
 }
 if(/FROM people WHERE published=1/.test(sql))
  return {bind:(limit,offset)=>{assert.equal(limit,15);assert.equal(offset,0);
   return {all:async()=>({results:[{id:'test-id',title:'Hồ sơ thử nghiệm',category:'Giáo Hữu',archive_code:'CS-CTD.GH-1',created_at:'2026-11-23'}]})}
  }};
 throw Error('Unexpected SQL '+sql);
}};
const good={access:{aud:vars.ACCESS_AUD,getIdentity:async()=>({email:auditEmail})}};
const unapproved={access:{aud:vars.ACCESS_AUD,getIdentity:async()=>({email:'not-authorized@example.invalid'})}};
const badAud={access:{aud:'f'.repeat(64),getIdentity:async()=>({email:auditEmail})}};
async function call(path,{ctx=good,method='GET',env={...vars,DB:db},headers}={}){
 const req=new Request('https://test.invalid'+path,{method,headers});
 const res=await worker.fetch(req,env,ctx);
 return {res,body:res.headers.get('Content-Type')?.includes('json')?await res.json():await res.text()};
}
test('correct Access identity can start read-only admin session',async()=>{
 const {res,body}=await call('/api/v1/admin/session');
 assert.equal(res.status,200);assert.equal(body.authenticated,true);
 assert.equal(body.role,'administrator');assert.equal(body.write_enabled,false);
});
test('deny untrusted requests, wrong email, wrong audience, forged request header',async()=>{
 for(const ctx of [{},unapproved,badAud]){
  const {res}=await call('/admin',{ctx,headers:{'cf-access-jwt-assertion':'forged'}});
  assert.equal(res.status,403);
 }
 assert.equal((await call('/api/v1/admin/session',{env:{...vars,DB:db,ACCESS_AUD:'bad'}})).res.status,403);
});
test('protect all admin pages and static assets, never show private rows',async()=>{
 for(const p of ['/admin','/admin/style.css','/admin/app.js','/api/v1/admin/summary','/api/v1/admin/records?kind=people']){
  assert.equal((await call(p,{ctx:{}})).res.status,403);
 }
 for(const p of ['/api/v1/admin/records?kind=admin_users',
                 '/api/v1/admin/records?kind=submissions',
                 '/api/v1/admin/records?kind=people%22%3BDROP%20TABLE']){
  assert.equal((await call(p)).res.status,404);
 }
});
test('dashboard has mobile layout and strict CSP and does not embed private data',async()=>{
 const {res,body}=await call('/admin');
 assert.equal(res.status,200);assert.match(body,/Quản trị tư liệu/);
 assert.match(res.headers.get('Content-Security-Policy'),/script-src 'self'/);
 assert.match(res.headers.get('Cache-Control'),/no-store/);
 assert.ok(ADMIN_JS.includes('textContent'));
 assert.ok(!ADMIN_JS.includes('.innerHTML'));
 assert.ok(ADMIN_CSS.includes('@media(max-width:440px)'));
 assert.ok(ADMIN_HTML.includes('viewport'));
 assert.ok(ADMIN_HTML.includes('Kiểm tra bảo toàn tư liệu gốc'));
 assert.ok(ADMIN_JS.includes('source_integrity_snapshot'));

});
test('21-table D1 inventory counts imported published records',async()=>{
 sqlHistory=[];
 const {res,body}=await call('/api/v1/admin/summary');
 assert.equal(res.status,200);assert.equal(body.table_count,21);
 assert.equal(body.inventory.length,21);
 assert.equal(body.source_total,1892);
 assert.equal(body.total_records,1892);
 assert.equal(body.remaining_records,0);
 assert.equal(body.source_snapshot_date,'2026-11-23');
 assert.equal(body.source_integrity_snapshot.people.unpublished,2);
 assert.equal(body.source_integrity_snapshot.r2_asset_metadata.rows,269);
 assert.equal(body.source_integrity_snapshot.gallery.without_photo_code,0);
 assert.equal(body.source_integrity_snapshot.gallery.without_image_url,0);
 assert.equal(body.r2_object_inventory_snapshot.object_count,2512);
 assert.equal(body.r2_object_inventory_snapshot.total_bytes,3156978971);

 assert.equal(body.published_records,118);
 assert.equal(body.gallery_images,615);
 assert.equal(body.r2_asset_records,269);
 assert.equal(body.write_enabled,false);
 assert.equal(sqlHistory.length,30);
 assert.equal(body.row_counts_match_snapshot,true);
 assert.ok(sqlHistory.some(sql=>/FROM "people" WHERE published=1/.test(sql)));
});
test('published list read-only with parameterized paging',async()=>{
 sqlHistory=[];
 const {res,body}=await call('/api/v1/admin/records?kind=people&limit=15&offset=0');
 assert.equal(res.status,200);assert.equal(body.data.length,1);
 assert.equal(body.data[0].title,'Hồ sơ thử nghiệm');
 assert.equal(body.write_enabled,false);
 assert.match(sqlHistory[0],/published=1/);
 for(const p of ['/api/v1/admin/records?kind=people&limit=1000',
                 '/api/v1/admin/records?kind=people&offset=-1'])
  assert.equal((await call(p)).res.status,400);
});
test('all mutations denied regardless of identity or URL',async()=>{
 for(const method of ['POST','PUT','PATCH','DELETE']){
  const {res,body}=await call('/api/v1/admin/records?kind=people',{method});
  assert.equal(res.status,405);
  assert.equal(body.write_enabled,false);
 }
});
