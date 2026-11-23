import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const code=readFileSync('gdd-public-readonly.js','utf8');
const app=readFileSync('app.js','utf8');
const cfg=readFileSync('supabase-config.js','utf8');
const kinds=['people','posts','media','videos','obituaries','documents',
  'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials'];
function fixture(){
 const backup={source:'public-published-read-only-backup',
   gallery:[{owner_kind:'people',owner_id:'p1',sort_order:1,photo_code:'IMG-1'}],
   placements:[]};
 for(const k of kinds)backup[k]=[{id:k+'-backup',published:true}];
 return backup;
}
function makeEnv({d1Okay=true,privateRow=false}={}){
 const calls=[];
 const window={SITE_CONFIG:{publicReadProvider:'d1-staging'}};
 const fetch=async(url,opts)=>{
   calls.push({url,opts});
   if(url.includes('public-fallback.json'))
     return {ok:true,json:async()=>fixture()};
   if(!d1Okay)return {ok:false,status:503};
   const kind=String(url).match(/\/api\/v1\/public\/([a-z0-9_]+)/)?.[1];
   if(!kinds.includes(kind))throw Error('Unexpected remote request');
   const data=[{id:kind+'-remote',published:!privateRow}];
   return {ok:true,json:async()=>({data})};
 };
 const console={warn:()=>{}};
 vm.runInNewContext(code,{window,fetch,console});
 return {window,calls};
}
test('D1 adapter replaces nine public groups while keeping verified gallery snapshot',async()=>{
 const {window,calls}=makeEnv();
 const archive=await window.GDDPublicReadOnly.load();
 assert.equal(archive.backend,'d1');
 assert.equal(archive.people[0].id,'people-remote');
 assert.equal(archive.gallery[0].photo_code,'IMG-1');
 assert.equal(archive.source,'public-published-read-only-backup');
 assert.equal(calls.filter(x=>x.url.includes('/api/v1/public/')).length,9);
 assert.equal(calls.some(x=>x.url.includes('admin')),false);
 assert.ok(calls.every(x=>x.opts.credentials==='omit'));
});
test('blocked D1 requests fall back to verified public snapshot only',async()=>{
 const {window}=makeEnv({d1Okay:false});
 const archive=await window.GDDPublicReadOnly.load();
 assert.equal(archive.backend,'snapshot');
 assert.equal(archive.people[0].id,'people-backup');
});
test('an unexpected unpublished record never enters the public browser data',async()=>{
 const {window}=makeEnv({privateRow:true});
 const archive=await window.GDDPublicReadOnly.load();
 assert.equal(archive.backend,'snapshot');
 assert.equal(archive.people[0].id,'people-backup');
});
test('staging switch disables Supabase sign-in and never enables editor',()=>{
 assert.match(cfg,/publicReadProvider: "d1-staging"/);
 assert.ok(app.includes("if(config.publicReadProvider==='d1-staging')"));
 assert.ok(app.includes("state.admin=false;state.user=null;state.supabase=null"));
 assert.ok(app.includes("$('#admin-login-area').hidden=true"));
});
