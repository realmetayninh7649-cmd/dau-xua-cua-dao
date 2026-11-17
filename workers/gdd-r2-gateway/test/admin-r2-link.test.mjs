import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.window={};
globalThis.document={getElementById:()=>null};
await import('../../../gdd-r2-admin.js');
test('Admin links a preserved R2 ID to an existing article',async()=>{
 const calls=[];
 const original='68b9257e-283f-41b8-a844-d63975ffd558';
 const record='f6253000-0000-4000-8000-000000000001';
 const maybeSingle=async()=>({data:{asset_id:original},error:null});
 const select=()=>({maybeSingle});
 const eq=(key,value)=>{calls.push(['eq',key,value]);return {select}};
 const update=data=>{calls.push(['update',data]);return {eq}};
 const client={auth:{getSession:async()=>({data:{session:{}}}),getUser:async()=>({data:{user:{id:'11111111-1111-4111-8111-111111111111'}}})},from(table){assert.equal(table,'gdd_r2_assets');return {update}}};
 const info=await window.GDDR2.link({id:original},'media',record,'primary',client);
 assert.equal(info.asset_id,original);
 assert.deepEqual(calls[0],['update',{record_kind:'media',record_id:record,role:'primary'}]);
 assert.deepEqual(calls[1],['eq','asset_id',original]);
});
test('Do not link invalid article types or missing article ids',async()=>{
 await assert.rejects(()=>window.GDDR2.link({id:'a'},'admin','abc','album',{}),/Thiếu mã/);
 await assert.rejects(()=>window.GDDR2.link({id:'a'},'media',null,'album',{}),/Thiếu mã/);
});
