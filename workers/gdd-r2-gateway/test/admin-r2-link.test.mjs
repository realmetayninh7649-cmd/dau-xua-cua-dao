import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.window={};
globalThis.document={getElementById:()=>null};
await import('../../../gdd-r2-admin.js');
test('Quản trị viên liên kết đúng ID bản gốc vào bài đã lưu',async()=>{
 const calls=[];
 const client={auth:{getSession:async()=>({data:{session:{}}}),getUser:async()=>({data:{user:{id:'11111111-1111-4111-8111-111111111111'}})},
 from(table){assert.equal(table,'gdd_r2_assets');return {update(data){calls.push(['update',data]);return {eq(k,v){calls.push(['eq',k,v]);return {select(){return {maybeSingle:async()=>({data:{asset_id:v},error:null})}}}}}}}}};
 const info=await window.GDDR2.link({id:'68b9257e-283f-41b8-a844-d63975ffd558'},'media','f6253000-0000-4000-8000-000000000001','primary',client);
 assert.equal(info.asset_id,'68b9257e-283f-41b8-a844-d63975ffd558');
 assert.deepEqual(calls[0],['update',{record_kind:'media',record_id:'f6253000-0000-4000-8000-000000000001',role:'primary'}]);
});
test('Không cho liên kết album với ID bài rỗng hoặc loại không hợp lệ',async()=>{
 await assert.rejects(()=>window.GDDR2.link({id:'a'},'admin','abc','album',{}),/Thiếu mã/);
 await assert.rejects(()=>window.GDDR2.link({id:'a'},'media',null,'album',{}),/Thiếu mã/);
});
