import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import worker from '../workers/gdd-d1/src/worker.mjs';
const db=new DatabaseSync(':memory:');
db.exec([
'CREATE TABLE gdd_visit_totals(singleton INTEGER PRIMARY KEY,total_visits INTEGER);',
'CREATE TABLE gdd_visit_sessions(session_id TEXT PRIMARY KEY,first_seen TEXT,last_seen TEXT);',
'CREATE TABLE gdd_site_download_totals(singleton INTEGER PRIMARY KEY,total_unlinked INTEGER);',
'CREATE TABLE gdd_site_download_events(event_id TEXT PRIMARY KEY,session_id TEXT,download_kind TEXT,recorded_at TEXT);',
'CREATE TABLE gdd_content_metrics(kind TEXT,record_id TEXT,view_count INTEGER,download_count INTEGER,updated_at TEXT,PRIMARY KEY(kind,record_id));',
'CREATE TABLE gdd_content_metric_events(kind TEXT,record_id TEXT,event_type TEXT,event_key TEXT,recorded_at TEXT,PRIMARY KEY(kind,record_id,event_type,event_key));',
'CREATE TABLE people(id TEXT PRIMARY KEY,published INTEGER);',
'CREATE TABLE posts(id TEXT PRIMARY KEY,published INTEGER);',
'INSERT INTO gdd_visit_totals(singleton,total_visits) VALUES(1,549);',
'INSERT INTO gdd_site_download_totals(singleton,total_unlinked) VALUES(1,13);'
].join('\n'));
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const other='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
db.prepare('INSERT INTO people(id,published) VALUES(?,1)').run(id);
db.prepare('INSERT INTO posts(id,published) VALUES(?,0)').run(other);
const env={DB:{prepare(sql){
 const st=db.prepare(sql);
 return {first:async()=>st.get()||null,run:async()=>st.run(),
  bind(...args){return {first:async()=>st.get(...args)||null,run:async()=>st.run(...args)}}
 };
}},STATS_RATE:{limit:async()=>({success:true})}};
const url='https://gdd-d1-api-staging.realmetayninh7649.workers.dev';
async function api(path,data,origin='https://dauxuacuadao.info.vn'){
 const res=await worker.fetch(new Request(url+path,{
  method:data?'POST':'GET',
  headers:{Origin:origin,'CF-Connecting-IP':'198.51.100.3',
   ...(data?{'Content-Type':'application/json'}:{})},
  body:data?JSON.stringify(data):undefined
 }),env,{});
 return {status:res.status,body:await res.json()};
}
test('legacy site totals are preserved on D1',async()=>{
 const x=await api('/api/v1/stats');
 assert.equal(x.status,200);
 assert.equal(x.body.total_visits,549);
 assert.equal(x.body.total_downloads,13);
});
test('new anonymous visitor increments once, subsequent heartbeat does not',async()=>{
 const a=await api('/api/v1/stats/visit',{session_id:id});
 assert.equal(a.status,200);assert.equal(a.body.total_visits,550);
 const b=await api('/api/v1/stats/visit',{session_id:id});
 assert.equal(b.body.total_visits,550);assert.equal(b.body.online_count,1);
});
test('unlinked downloads are deduplicated by unique random event UUID',async()=>{
 const item={event_id:other,session_id:id,kind:'image'};
 assert.equal((await api('/api/v1/stats/download',item)).body.total_downloads,14);
 assert.equal((await api('/api/v1/stats/download',item)).body.total_downloads,14);
});
test('article view deduplicated; download increments both article and site totals',async()=>{
 const v={kind:'people',record_id:id,event_type:'view',event_key:'v_20261124_'+'a'.repeat(32)};
 assert.equal((await api('/api/v1/stats/content',v)).body.views,1);
 assert.equal((await api('/api/v1/stats/content',v)).body.views,1);
 const d={kind:'people',record_id:id,event_type:'download',event_key:'d_'+'b'.repeat(32)};
 assert.equal((await api('/api/v1/stats/content',d)).body.downloads,1);
 assert.equal((await api('/api/v1/stats')).body.total_downloads,15);
});
test('drafts and unapproved origins cannot alter metrics',async()=>{
 const before=(await api('/api/v1/stats')).body;
 const draft=await api('/api/v1/stats/content',
  {kind:'posts',record_id:other,event_type:'view',event_key:'v_20261124_'+'c'.repeat(32)});
 assert.equal(draft.status,404);
 assert.equal((await api('/api/v1/stats/visit',{session_id:id},'https://evil.invalid')).status,403);
 assert.equal((await api('/api/v1/stats/download',{event_id:id,session_id:id,kind:'admin_users'})).status,400);
 assert.deepEqual((await api('/api/v1/stats')).body,before);
});
test('aggregates never expose session identity or IP address',async()=>{
 const result=JSON.stringify((await api('/api/v1/stats')).body);
 assert.ok(!result.includes(id)&&!result.includes(other));
 assert.ok(!result.includes('198.51.100.3'));
});
