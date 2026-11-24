import test from 'node:test';
import assert from 'node:assert/strict';
import {uploadAudio} from '../workers/gdd-d1-admin/src/audio-upload.mjs';
import {serveAudio} from '../workers/gdd-d1/src/public-audio.mjs';
const id='51fb2d6c-8085-4e41-82c6-fc10f9da7553';
const json=(x,status=200)=>Response.json(x,{status});
const data=new Uint8Array(417);data.set([255,251,144,100]);
const base='https://gdd-d1-api-staging.realmetayninh7649.workers.dev';
let published=false,linked='',writes=0;const store=new Map();
const bucket={
 async head(key){return store.get(key)},
 async put(key,bytes,opts){assert.equal(opts.onlyIf.etagDoesNotMatch,'*');writes++;store.set(key,{size:bytes.length,customMetadata:opts.customMetadata,body:bytes.slice()})},
 async get(key,opts){const item=store.get(key);if(!item)return null;const range=opts?.range;return {...item,body:range?item.body.slice(range.offset,range.offset+range.length):item.body}}
};
const DB={prepare(sql){return {bind(...args){return {first:async()=>sql.includes('published=1')?(published&&args[0]===id&&args[1]===linked?{id}:null):(args[0]===id?{id}:null)}}}}};
const env={DB,GDD_BUCKET:bucket,SUBMISSIONS_BUCKET:bucket};
test('MP3 upload immutable and hidden until the exact record is published',async()=>{
 const req=()=>new Request(base,{method:'PUT',headers:{'Content-Type':'audio/mpeg'},body:data});
 let r=await uploadAudio(req(),env,id,json);assert.equal(r.status,200);const result=await r.json();assert.equal(result.uploaded,true);assert.equal(writes,1);
 r=await uploadAudio(req(),env,id,json);assert.equal(r.status,200);assert.equal(writes,1);
 const play=(headers={},method='GET')=>serveAudio(new Request(result.url,{headers,method}),env,id,result.sha256,(_,x,status)=>json(x,status),new Set());
 assert.equal((await play()).status,404);
 published=true;assert.equal((await play()).status,404);
 linked=result.url;
 r=await play({Range:'bytes=0-3'});assert.equal(r.status,206);assert.equal(r.headers.get('Content-Range'),'bytes 0-3/417');assert.deepEqual(new Uint8Array(await r.arrayBuffer()),data.slice(0,4));
 r=await play({},'HEAD');assert.equal(r.status,200);assert.equal(r.headers.get('Content-Length'),'417');
 assert.equal((await play({Range:'bytes=500-'})).status,416);
 published=false;assert.equal((await play()).status,404);
});
test('Reject non-MP3 and oversized request before storage writes',async()=>{
 const bad=new Request(base,{method:'PUT',headers:{'Content-Type':'audio/mpeg'},body:new Uint8Array(10)});
 assert.equal((await uploadAudio(bad,env,id,json)).status,400);
 const large=new Request(base,{method:'PUT',headers:{'Content-Type':'audio/mpeg','Content-Length':'99999999'},body:data});
 assert.equal((await uploadAudio(large,env,id,json)).status,413);
 assert.equal(writes,1);
});
