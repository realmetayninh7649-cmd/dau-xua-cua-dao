import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../workers/gdd-d1/src/worker.mjs';
import {readFileSync} from 'node:fs';

const config=JSON.parse(readFileSync('workers/gdd-d1/wrangler.jsonc','utf8'));
assert.equal(config.d1_databases[0].database_name,'gdd-dao-su-editor-live-clone-20261124');
const published=Array.from({length:50},(_,i)=>({
 id:String(i+1).padStart(8,'0')+'-0000-4000-8000-000000000001',
 slug:'ho-so-cong-khai-'+i,full_name:'Hồ sơ công khai '+i,published:1,verified:1
}));
const draft={id:'88888888-0000-4000-8000-000000000002',slug:'bi-mat-ban-nhap',
 full_name:'Hồ sơ chưa công bố',published:0,verified:0};
const posts=Array.from({length:17},(_,i)=>({slug:'post-'+i,title:'Bài '+i,published:1}));
let issued=[];
const db={prepare(sql){
 issued.push(sql);
 assert.match(sql,/^SELECT /);
 const bind=(...args)=>({
  first:async()=>{
   if(sql.includes('FROM "people"')&&sql.includes('published=1 AND slug=?'))
      return published.find(r=>r.slug===args[0])||null;
   if(sql.includes('SELECT id FROM "people"'))
      return published.find(r=>r.id===args[0])||null;
   return null;
  },
  all:async()=>{
   let src=sql.includes('FROM "people"')?published:
     sql.includes('FROM "posts"')?posts:[];
   assert.match(sql,/published=1/,'Every public content query must filter published=1');
   if(sql.includes('LIMIT ? OFFSET ?'))src=src.slice(args[1],args[1]+args[0]);
   return {results:src};
  }
 });
 return {bind};
}};
async function call(path,method='GET',ctx={}){
 const res=await worker.fetch(new Request('https://staging.test'+path,{method}),{DB:db},ctx);
 return {status:res.status,body:await res.json()};
}
test('D1 full restore serves only 50 published people, never the two private rows',async()=>{
 issued=[];
 const r=await call('/api/v1/public/people?limit=100');
 assert.equal(r.status,200);
 assert.equal(r.body.data.length,50);
 assert.ok(r.body.data.every(p=>p.published===true));
 assert.equal(r.body.data.some(p=>p.id===draft.id),false);
 assert.ok(issued.every(s=>s.startsWith('SELECT ')));
});
test('unpublished slug is invisible, while published slug is readable',async()=>{
 const hidden=await call('/api/v1/public/people/bi-mat-ban-nhap');
 assert.equal(hidden.status,404);
 const ok=await call('/api/v1/public/people/ho-so-cong-khai-1');
 assert.equal(ok.status,200);
 assert.equal(ok.body.data.published,true);
});
test('private tables and every mutation are unavailable',async()=>{
 for(const path of ['/api/v1/public/admin_users','/api/v1/public/submissions',
 '/api/v1/public/gdd_r2_assets','/api/v1/public/gdd_visit_sessions'])
  assert.equal((await call(path)).status,404);
 for(const method of ['POST','PUT','PATCH','DELETE'])
  assert.equal((await call('/api/v1/public/people',method)).status,405);
});
test('public post listing respects published filter and pagination',async()=>{
 const r=await call('/api/v1/public/posts?limit=100');
 assert.equal(r.body.data.length,17);
 assert.ok(r.body.data.every(p=>p.published===true));
 assert.equal((await call('/api/v1/public/posts?limit=101')).status,400);
});
test('without database binding no records can be served',async()=>{
 const res=await worker.fetch(new Request('https://staging.test/api/v1/public/people'),{},{});
 assert.equal(res.status,503);
});

test('gallery and placement endpoints filter by published parent, never list private orphan records',async()=>{
 const called=[];
 const filteredDb={prepare(sql){
   called.push(sql);
   assert.ok(/^SELECT /.test(sql));
   assert.ok(sql.includes('p.published=1'),'Must check parent publication');
   for(const kind of ['people','posts','media','videos','obituaries','documents'])
     assert.ok(sql.includes("owner_kind='"+kind+"'"),'Missing allowed owner '+kind);
   return {bind:(limit,offset)=>({
     all:async()=>({results:sql.includes('archive_gallery_images')
       ?[{id:'visible-image',owner_kind:'people',owner_id:'published-id',image_url:'https://example.invalid/preview.webp'}]
       :[{owner_kind:'posts',owner_id:'published-id',target_kind:'homepage'}]})
   })};
 }};
 for(const kind of ['gallery','placements']){
   const res=await worker.fetch(new Request('https://staging.test/api/v1/public/'+kind+'?limit=100'),{DB:filteredDb},{});
   assert.equal(res.status,200);
   assert.equal((await res.json()).data.length,1);
 }
 assert.equal(called.length,2);
 assert.equal((await call('/api/v1/public/gallery?limit=101')).status,400);
});
