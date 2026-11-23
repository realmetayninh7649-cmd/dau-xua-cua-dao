import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import worker from '../workers/gdd-d1-admin/src/worker.mjs';
import {ownerUUID} from '../workers/gdd-d1-admin/src/r2-managed.mjs';
import {readFileSync} from 'node:fs';
const cfg=JSON.parse(readFileSync('workers/gdd-d1-admin/wrangler.jsonc','utf8'));
const email='editor-album@example.invalid',origin='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev';
const env={...cfg.vars,ADMIN_EMAIL_SHA256:createHash('sha256').update(email).digest('hex')};
const good={access:{aud:env.ACCESS_AUD,getIdentity:async()=>({email})}};
const bad={access:{aud:env.ACCESS_AUD,getIdentity:async()=>({email:'intruder@example.invalid'})}};
const post='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',asset='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
let published=0,ready=1,assetOwner=ownerUUID(env),recordLinked=null;
const album=[];
const db={prepare(sql){
 return{bind(...args){
  return{
   first:async()=>{
    if(sql.startsWith('SELECT id FROM "posts"'))return {id:post};
    if(sql.startsWith('SELECT asset_id,owner_id'))return {
      asset_id:asset,owner_id:assetOwner,media_kind:'image',
      public_view:published,preview_ready:ready,
      record_id:recordLinked,record_kind:recordLinked?'posts':null
    };
    if(sql.includes('SELECT id,image_url,caption,sort_order FROM archive_gallery_images')){
      return album.find(x=>x.image_url===args.at(-1))||null;
    }
    if(sql.includes('COUNT(*) AS n'))return {
      n:album.length,last_position:album.at(-1)?.sort_order||0
    };
    return null;
   },
   all:async()=>({results:[...album]}),
   run:async()=>{
    if(sql.startsWith('INSERT INTO archive_gallery_images')){
      album.push({id:args[0],image_url:args[3],caption:args[4],sort_order:args[5]});
    }
    if(sql.startsWith('UPDATE gdd_r2_assets'))recordLinked=post;
    return {success:true};
   }
  };
 }};
}};
async function invoke(method='GET',payload=null,ctx=good,headers={}){
 const path=origin+'/api/v1/admin/work/posts/'+post+'/photos';
 const req=new Request(path,{method,headers:{
  ...(payload!==null?{'Origin':origin,'Content-Type':'application/json'}:{}),...headers
 },body:payload===null?undefined:JSON.stringify(payload)});
 const res=await worker.fetch(req,{...env,DB:db,ENABLE_WORKING_EDITOR:'enabled'},ctx);
 const obj=await res.json();return {status:res.status,data:obj};
}
test('Access private inbox listing is empty and unauthenticated uploads are rejected',async()=>{
 assert.equal((await invoke('GET',null,bad)).status,403);
 assert.equal((await invoke('POST',{asset_id:asset,caption:'X'},bad)).status,403);
 assert.equal((await invoke('GET')).status,200);
 assert.deepEqual((await invoke('GET')).data.data,[]);
});
test('unpublished R2 preview cannot be attached to content',async()=>{
 assert.equal((await invoke('POST',{asset_id:asset,caption:'Hình 1'})).status,409);
 assert.equal(album.length,0);
 published=1;
 assetOwner='not-the-editor';
 assert.equal((await invoke('POST',{asset_id:asset,caption:'Hình 1'})).status,409);
 assetOwner=ownerUUID(env);
 ready=0;
 assert.equal((await invoke('POST',{asset_id:asset,caption:'Hình 1'})).status,409);
 ready=1;
});
test('after explicit preview publication attach image, preserve order and idempotence',async()=>{
 let result=await invoke('POST',{asset_id:asset,caption:'Hình 1 — Tư liệu gốc'});
 assert.equal(result.status,201,JSON.stringify(result.data));
 assert.equal(result.data.attached,true);
 assert.equal(album.length,1);
 assert.equal(album[0].sort_order,1);
 assert.equal(album[0].caption,'Hình 1 — Tư liệu gốc');
 assert.equal(album[0].image_url,'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/'+asset+'/preview');
 result=await invoke('POST',{asset_id:asset,caption:'Hình 1 — Tư liệu gốc'});
 assert.equal(result.status,200);
 assert.equal(result.data.already_attached,true);
 assert.equal(album.length,1);
});
test('reject cross origin / invalid payload / delete with no original mutation',async()=>{
 assert.equal((await invoke('POST',{asset_id:asset,caption:'test'},{...good},{Origin:'https://evil.invalid'})).status,403);
 assert.equal((await invoke('POST',{asset_id:asset,caption:'x',url:'https://evil.invalid'})).status,400);
 assert.equal((await invoke('POST',{asset_id:'xyz',caption:'test'})).status,400);
 assert.equal((await invoke('DELETE',null)).status,403);
 assert.equal(album.length,1);
});
