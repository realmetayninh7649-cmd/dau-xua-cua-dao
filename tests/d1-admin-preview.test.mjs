import test from 'node:test';
import {Script} from 'node:vm';
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
 if(/FROM people WHERE published=(0|1)/.test(sql))
  return {bind:(limit,offset)=>{assert.equal(limit,15);assert.equal(offset,0);
   return {all:async()=>({results:/WHERE published=0/.test(sql)
     ?[{id:'draft-test',title:'Bản nháp kiểm thử',category:'Giáo Hữu',created_at:'2026-11-23'}]
     :[{id:'test-id',title:'Hồ sơ thử nghiệm',category:'Giáo Hữu',archive_code:'CS-CTD.GH-1',created_at:'2026-11-23'}]})}
  }};
 throw Error('Unexpected SQL '+sql);
}};
const r2History=[];
const mockR2={async list(options){
 r2History.push(options);
 if(!options.cursor)return {objects:[{size:100,key:'originals/private-original.jpg'},{size:200,key:'meta/private.json'}],truncated:true,cursor:'page-2'};
 if(options.cursor==='page-2')return {objects:[{size:300,key:'view/public.webp'}],truncated:false};
 throw Error('Unexpected pagination');
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
 assert.equal(body.view,'published');
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

test('draft records only on Access-protected allowlisted admin route',async()=>{
 sqlHistory=[];
 const {res,body}=await call('/api/v1/admin/records?kind=people&view=draft&limit=15&offset=0');
 assert.equal(res.status,200);
 assert.equal(body.view,'draft');
 assert.equal(body.write_enabled,false);
 assert.equal(body.data.length,1);
 assert.equal(body.data[0].title,'Bản nháp kiểm thử');
 assert.match(sqlHistory[0],/WHERE published=0/);
 assert.equal((await call('/api/v1/admin/records?kind=people&view=draft',{ctx:{}})).res.status,403);
 assert.equal((await call('/api/v1/admin/records?kind=submissions&view=draft')).res.status,404);
 assert.equal((await call('/api/v1/admin/records?kind=people&view=all')).res.status,400);
});

test('R2 inventory: Access-only, metadata-only, no original bytes or private keys',async()=>{
 r2History.length=0;
 const {res,body}=await call('/api/v1/admin/r2/inventory',{env:{...vars,DB:db,GDD_BUCKET:mockR2}});
 assert.equal(res.status,200);
 assert.equal(body.objects,3);
 assert.equal(body.total_bytes,600);
 assert.equal(body.matches_baseline,false);
 assert.equal(body.original_bytes_read,false);
 assert.equal(body.write_enabled,false);
 assert.equal(body.coverage,'complete_listing_metadata_only');
 assert.ok(!JSON.stringify(body).includes('originals/'));
 assert.equal(r2History.length,2);
 const denied=await call('/api/v1/admin/r2/inventory',{ctx:{},env:{...vars,DB:db,GDD_BUCKET:mockR2}});
 assert.equal(denied.res.status,403);
 assert.equal(r2History.length,2,'unauthorized requests must not access bucket');
 assert.equal((await call('/api/v1/admin/r2/inventory')).res.status,503);
 assert.equal((await call('/api/v1/admin/r2/inventory',{method:'POST',env:{...vars,DB:db,GDD_BUCKET:mockR2}})).res.status,405);
});
test('R2 inventory refuses a truncated or repeated cursor, never gives partial success',async()=>{
 const broken={list:async()=>({objects:[{size:1}],truncated:true,cursor:'loop'})};
 const response=await call('/api/v1/admin/r2/inventory',{env:{...vars,DB:db,GDD_BUCKET:broken}});
 assert.equal(response.res.status,503);
 assert.equal(response.body.error,'r2_inventory_unavailable');
});

test('full Access administrator client bundle syntax and editorial controls are valid',()=>{
 try{new Script(ADMIN_JS,{filename:'gdd-access-admin-client.js'});}
 catch(error){console.error('ADMIN_JS_SCRIPT_POSITION:',String(error.stack||error).slice(0,900));throw error;}
 for(const id of ['work-editor-panel','work-fields','work-save','work-kind','work-revisions','r2-managed-upload'])
  assert.ok(ADMIN_HTML.includes('id="'+id+'"'),id+' missing from admin HTML');
 assert.ok(ADMIN_JS.includes('gdd_version'));
 assert.ok(!ADMIN_JS.includes('eval('));
});

test('managed R2 production original flow is correctly exposed only in Access admin UI',()=>{
 assert.doesNotThrow(()=>new Script(ADMIN_JS,{filename:'gdd-access-admin-client.js'}));
 for(const id of ['r2-managed-panel','r2-managed-upload','r2-managed-derivative','r2-managed-publish'])
  assert.ok(ADMIN_HTML.includes('id="'+id+'"'),id+' not found');
 assert.ok(ADMIN_JS.includes("managedBase='/api/v1/admin/r2/managed'"));
 assert.ok(ADMIN_JS.includes('managedPreviewReady'));
});

test('PDF per-page reader is pinned and private-original-safe',()=>{
 assert.doesNotThrow(()=>new Script(ADMIN_JS,{filename:'admin-pdf-uploader.js'}));
 assert.ok(ADMIN_JS.includes('pdfjs-dist@4.10.38'));
 assert.ok(ADMIN_JS.includes('managedPdfPages'));
 assert.ok(ADMIN_JS.includes("viewSource:'pdf'"));
 assert.ok(ADMIN_HTML.includes('id="r2-managed-pdf-pages"'));
});

test('active administrator page hides old maintenance banner and synthetic panels',()=>{
 assert.ok(!ADMIN_HTML.includes('Website chính vẫn đang bảo trì'));
 assert.ok(!ADMIN_HTML.includes('Chế độ thử nghiệm chỉ đọc'));
 assert.ok(!ADMIN_HTML.includes('id="sandbox-title"'));
 assert.ok(!ADMIN_HTML.includes('id="r2-sandbox-title"'));
 assert.ok(ADMIN_HTML.includes('Website công khai đã hoạt động.'));
 assert.ok(ADMIN_HTML.includes('id="work-editor-panel"'));
 assert.ok(ADMIN_HTML.includes('id="r2-managed-panel"'));
 assert.ok(ADMIN_HTML.includes('<details class="admin-technical">'));
 assert.ok(!ADMIN_JS.includes('sandboxR2Refresh()'));
 assert.ok(ADMIN_JS.includes('async function workWrite('));
 assert.doesNotThrow(()=>new Script(ADMIN_JS,{filename:'gdd-admin-production-ui.js'}));
});

test('DOCX originals remain private and only text-only pages may be published',()=>{
 assert.ok(ADMIN_HTML.includes('id="r2-managed-docx-pages"'));
 assert.ok(ADMIN_JS.includes("viewSource:'docx_text'"));
 assert.ok(ADMIN_JS.includes('mammoth@1.13.0/mammoth.browser.min.js'));
 assert.ok(ADMIN_JS.includes('extractRawText'));
 assert.ok(!ADMIN_JS.includes('convertToHtml('));
 assert.doesNotThrow(()=>new Script(ADMIN_JS,{filename:'gdd-admin-docx-client.js'}));
});

test('admin home-screen app uses stable URL, same-origin protected icons, and no private offline cache',async()=>{
 const {res}=await call('/admin/manifest.webmanifest');
 assert.equal(res.status,200);
 assert.match(res.headers.get('Content-Type'),/manifest/);
 const m=(await call('/admin/manifest.webmanifest')).body;
 assert.equal(m.start_url,'/admin');assert.equal(m.display,'standalone');
 for(const [url,size] of [['/admin/icon.png',180],['/admin/icon-192.png',192],['/admin/icon-512.png',512]]){
  const response=await worker.fetch(new Request('https://test.invalid'+url),{...vars,DB:db},good);
  assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),'image/png');
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16),size);assert.equal(bytes.readUInt32BE(20),size);
 }
 assert.equal((await call('/admin/manifest.webmanifest',{ctx:{}})).res.status,403);
 assert.equal((await call('/admin/icon.png',{ctx:{}})).res.status,403);
 assert.ok(ADMIN_HTML.includes('apple-touch-icon'));
 assert.ok(ADMIN_HTML.includes('admin-home-grid'));
 assert.ok(!ADMIN_JS.includes('serviceWorker.register'));
 assert.match((await call('/admin')).res.headers.get('Content-Security-Policy'),/manifest-src 'self'/);
});

// Record access must verify both live services via bindings before changing rights.
test('record access uses internal service bindings and fails closed',async()=>{
 const {verifyRecordAccessReady}=await import('../workers/gdd-d1-admin/src/record-access.mjs');
 const calls=[];
 const binding=(name,body={record_access:true},status=200)=>({fetch:async request=>{
  calls.push([name,new URL(request.url).pathname,request.method]);
  return new Response(JSON.stringify(body),{status});
 }});
 const env={RECORD_GATEWAY:binding('R2'),RECORD_PUBLIC_API:binding('D1')};
 await verifyRecordAccessReady(env);
 assert.deepEqual(calls,[['R2','/record-access-ready','GET'],['D1','/api/v1/public/access-ready','GET']]);
 await assert.rejects(verifyRecordAccessReady({...env,RECORD_GATEWAY:undefined}),/R2.*chưa đổi quyền/);
 await assert.rejects(verifyRecordAccessReady({...env,RECORD_PUBLIC_API:binding('D1',{record_access:false})}),/D1.*chưa đổi quyền/);
 await assert.rejects(verifyRecordAccessReady({...env,RECORD_GATEWAY:binding('R2',{},503)}),/R2.*503/);
 await assert.rejects(verifyRecordAccessReady({...env,RECORD_PUBLIC_API:{fetch:async()=>{throw Error('offline')}}}),/D1.*lỗi kết nối/);
 const config=JSON.parse(readFileSync('workers/gdd-d1-admin/wrangler.jsonc','utf8'));
 assert.deepEqual(config.services,[{binding:'RECORD_GATEWAY',service:'gdd-r2-gateway'},{binding:'RECORD_PUBLIC_API',service:'gdd-d1-api-staging'}]);
});

// Calendar publishing uses the same lunar computation as the public calendar.
test('daily memorial auto-publish is date scoped, deduplicated and preserves restricted portraits',async()=>{
 const {dailyNotices,vietnamDay,MEMORIAL_CRONS}=await import('../workers/gdd-d1-admin/src/daily-memorial.mjs');
 const now=new Date('2026-11-27T17:05:00Z');assert.equal(vietnamDay(now),'2026-11-28');
 const p={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',slug:'thai-khy',full_name:'THÁI KHÝ THANH',rank:'Quyền Thái Chánh Phối Sư',published:1,death_lunar_day:20,death_lunar_month:10,record_access:'protected',image_url:'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/preview'};
 const manual={id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',full_name:p.full_name,published:1,calendar_system:'lunar',lunar_day:20,lunar_month:10,linked_person_id:p.id};
 const list=dailyNotices([p],[manual],[],now);assert.equal(list.length,1);assert.equal(list[0].portrait_url,null);assert.match(list[0].body,/thai-khy/);assert.match(list[0].anniversary_date,/28\/11\/2026/);
 assert.equal(dailyNotices([p],[],[{person_name:p.full_name,published:1,published_at:'2026-11-28T00:00:00Z'}],now).length,0);
 assert.equal(dailyNotices([{...p,published:0}],[],[],now).length,0);
 assert.equal(dailyNotices([p],[],[],new Date('2026-11-29T00:00:00Z')).length,0);
 assert.equal(dailyNotices([{...p,record_access:'download'}],[],[],now)[0].portrait_url,p.image_url);
 const cfg=JSON.parse(readFileSync('workers/gdd-d1-admin/wrangler.jsonc','utf8'));assert.ok(MEMORIAL_CRONS.every(x=>cfg.triggers.crons.includes(x)));
});

test('auto memorial accepts approved legacy previews and rejects arbitrary originals',async()=>{
 const {portraitPreview}=await import('../workers/gdd-d1-admin/src/daily-memorial.mjs');
 const {LEGACY_PUBLISHED_PATHS}=await import('../workers/gdd-r2-gateway/src/legacy-published-paths.mjs');
 const name=[...LEGACY_PUBLISHED_PATHS].find(x=>x.startsWith('people/'));assert.ok(name);
 assert.equal(portraitPreview('https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-images/'+name),'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/legacy-preview/'+name+'.webp');
 assert.equal(portraitPreview('https://example.org/private.jpg'),null);
});
