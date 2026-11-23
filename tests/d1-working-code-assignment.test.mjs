import test from 'node:test';
import assert from 'node:assert/strict';
import {handleWorkingCode} from '../workers/gdd-d1-admin/src/working-codes.mjs';
const people=[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',full_name:'Lễ Sanh Thử',
 branch:'Cửu Trùng Đài',rank:'Lễ Sanh',subgroup:'',archive_code:null,
 slug:'ban-nhap-aaaa',gdd_version:1,published:0},
 {id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',full_name:'Đầu Sư Xưa',
 branch:'Cửu Trùng Đài',rank:'Đầu Sư',archive_code:'CS-CTD.ĐS-00017',gdd_version:1,published:1},
 {id:'cccccccc-cccc-4ccc-8ccc-cccccccccccc',full_name:'Hộ Pháp Xưa',
 branch:'Hiệp Thiên Đài',rank:'Hộ Pháp',archive_code:'CS-HTD.HP-00001',gdd_version:1,published:1}];
const docs=[{id:'dddddddd-dddd-4ddd-8ddd-dddddddddddd',title:'Tài liệu mới',
 subfolder_code:'HTĐ',archive_code:null,slug:'ban-nhap-dddd',gdd_version:1,published:0},
 {id:'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',title:'Tài liệu đã có',
 subfolder_code:'HTĐ',archive_code:'DXCD-SH.HTĐ-00007',gdd_version:1,published:1}];
const tables={people,documents:docs,posts:[],media:[],videos:[],obituaries:[]};
const history=[];
const db={prepare(sql){
 const table=Object.keys(tables).find(x=>sql.includes('"'+x+'"'));
 if(!table)throw Error('Unexpected SQL '+sql);
 return {all:async()=>({results:tables[table].filter(x=>x.archive_code).map(x=>({archive_code:x.archive_code}))}),bind(...args){return {
  first:async()=>{
   if(sql.startsWith('SELECT * FROM'))return tables[table].find(x=>x.id===args[0])||null;
   if(sql.startsWith('UPDATE')){
    const [code,slug,updated,id,version,checkingCode]=args;
    const row=tables[table].find(x=>x.id===id);
    if(!row||row.gdd_version!==version||row.archive_code||
      tables[table].some(x=>x.archive_code===checkingCode))return null;
    row.archive_code=code;row.slug=slug;row.gdd_version++;history.push({kind:table,code});
    return {...row};
   }
   return null;
  },
  all:async()=>({results:tables[table].filter(x=>x.archive_code)
    .map(x=>({archive_code:x.archive_code}))})
 }}};
}};
async function call(method,kind,id,op,body){
 const req=new Request('https://admin.test/api/v1/admin/work/'+kind+'/'+id+'/'+op,{
  method,headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const response=await handleWorkingCode(req,db,kind,id,op);
 return {status:response.status,body:await response.json()};
}
test('CTD number must continue across ranks, without resetting for Lễ Sanh',async()=>{
 const id=people[0].id;
 const preview=await call('GET','people',id,'code-preview');
 assert.equal(preview.status,200);
 assert.equal(preview.body.candidate,'CS-CTD.LS-00018');
 assert.equal((await call('POST','people',id,'assign-code',{
  version:1,code:'CS-CTD.LS-00018',confirmed:false})).status,409);
 const assigned=await call('POST','people',id,'assign-code',{
  version:1,code:'CS-CTD.LS-00018',confirmed:true});
 assert.equal(assigned.status,200);assert.equal(assigned.body.published,false);
 assert.equal(assigned.body.version,2);
 assert.ok(assigned.body.slug.includes('le-sanh-thu'));
 assert.equal((await call('POST','people',id,'assign-code',{
  version:2,code:'CS-CTD.LS-00019',confirmed:true})).status,409);
});
test('documents receive folder-specific sequential number and preserve old codes',async()=>{
 const id=docs[0].id;
 const preview=await call('GET','documents',id,'code-preview');
 assert.equal(preview.body.candidate,'DXCD-SH.HTĐ-00008');
 const result=await call('POST','documents',id,'assign-code',{
  version:1,code:'DXCD-SH.HTĐ-00008',confirmed:true});
 assert.equal(result.status,200);
 assert.equal(docs[1].archive_code,'DXCD-SH.HTĐ-00007');
 assert.equal(history.length,2);
});
test('invalid category, unsafe ID and missing confirmation fail closed',async()=>{
 assert.equal((await call('GET','people',docs[0].id,'code-preview')).status,404);
 assert.equal((await call('POST','media',people[0].id,'assign-code',{version:1,code:'X',confirmed:true})).status,404);
});
