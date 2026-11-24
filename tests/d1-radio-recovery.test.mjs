import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverRadio} from '../workers/gdd-d1-admin/src/radio-recovery.mjs';
const json=(x,status=200)=>Response.json(x,{status});
const original='https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-audio/radio/1794152210157-3l8hj18qb9.mp3';
function env(published=1){
 return {DB:{prepare(sql){assert.match(sql,/^SELECT id,published,audio_url,gdd_version/);return {bind(){return {first:async()=>({published,audio_url:original,gdd_version:1})}}}}},GDD_BUCKET:{head(){throw Error('unexpected read')},put(){throw Error('unexpected write')},get(){throw Error('unexpected read')}}};
}
test('wrong size rejected before any storage operation',async()=>{
 const req=new Request('https://example.com',{method:'PUT',body:'x',headers:{'Content-Length':'1'}});
 const r=await recoverRadio(req,env(),json);assert.equal(r.status,400);assert.equal((await r.json()).error,'wrong_file_size');
});
test('same size incorrect hash rejected without any storage write',async()=>{
 const req=new Request('https://example.com',{method:'PUT',body:new Uint8Array(16116406)});
 const r=await recoverRadio(req,env(),json);assert.equal(r.status,400);assert.equal((await r.json()).error,'wrong_file_hash');
});
test('unpublished record cannot be recovered or exposed',async()=>{
 const req=new Request('https://example.com',{method:'PUT',body:'x'});
 const r=await recoverRadio(req,env(0),json);assert.equal(r.status,409);assert.equal((await r.json()).error,'record_changed');
});
