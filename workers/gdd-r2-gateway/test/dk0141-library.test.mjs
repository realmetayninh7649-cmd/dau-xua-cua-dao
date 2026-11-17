import test from 'node:test';
import assert from 'node:assert/strict';

const ASSET='47487fbf-5460-4a35-87ab-083da85d8945';
const DOC='7d887fac-485a-43ae-9212-947ba5629092';
const ROOT='https://realmetayninh7649-cmd.github.io/dau-xua-cua-dao/';
const VIEW=ROOT+'r2-xem.html?asset='+ASSET;
globalThis.window={};
globalThis.document={getElementById:()=>null};
globalThis.location={origin:'https://realmetayninh7649-cmd.github.io',pathname:'/dau-xua-cua-dao/'};
await import('../../../gdd-r2-admin.js');

function rig({published=true, existing=false}={}){
 const previousFetch=globalThis.fetch;
 let asset={asset_id:ASSET,media_kind:'document',role:'vault',record_kind:null,record_id:null,
   original_name:'5-lich-su-dao-cao-dai-trong-thoi-ky-phuc-quoc-1941-1946.pdf',
   original_bytes:4322246,view_page_count:13,view_source:'pdf',public_view:published};
 const calls={docs:[],index:[],http:[],docHidden:false};
 const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
 globalThis.fetch=async (url,config={})=>{
   const path=new URL(url).pathname;
   calls.http.push([config.method,path]);
   if(path.startsWith('/v1/public/'))
     return published?response({id:ASSET,kind:'document',pageCount:13,viewSource:'pdf'}):response({error:'Not found'},404);
   if(path.endsWith('/publication'))return response({id:ASSET,published:false,originalPrivate:true});
   throw Error('Unexpected worker call '+path);
 };
 const thenable=result=>({
   then(resolve,reject){return Promise.resolve(result).then(resolve,reject)}
 });
 const client={
   auth:{getSession:async()=>({data:{session:{access_token:'admin-test'}},error:null})},
   from(table){
     if(table==='gdd_r2_assets'){
       return {
         select(){return {eq(){return {maybeSingle:async()=>({data:asset,error:null})}}}},
         update(data){calls.index.push(data);return {
           eq(){return Object.assign(thenable({error:null}),{
             is(){return {select(){return {maybeSingle:async()=>{
               asset={...asset,...data};return {data:{asset_id:ASSET},error:null}
             }}}}},
           })}
         }}
       };
     }
     if(table==='documents'){
       return {
         select(){return {eq(){return {
           limit:async()=>({data:existing?[{id:DOC,archive_code:'DXCD-TL-00999'}]:[],error:null}),
           maybeSingle:async()=>({data:existing?{id:DOC,file_url:VIEW,published:true}:null,error:null})
         }}}},
         insert(data){calls.docs.push(data);return {select(){return {
           single:async()=>({data:{id:DOC,archive_code:'DXCD-TL-00012'},error:null})
         }}}},
         update(data){calls.docs.push({update:data});return {eq(){calls.docHidden=data.published===false;return thenable({error:null})}}}
       };
     }
     throw Error('Unexpected table '+table);
   }
 };
 window.GDDR2.open(client);
 return {calls,restore:()=>{globalThis.fetch=previousFetch;window.GDDR2.close();},getAsset:()=>asset};
}

test('Publish an already-viewable private R2 PDF into documents, no guessed source or date',async()=>{
 const {calls,getAsset,restore}=rig();
 try{
   const outcome=await window.GDDR2.attachPublishedDocument(ASSET,{
     title:'Lịch sử Đạo Cao Đài trong thời kỳ Phục Quốc (1941–1946)'
   });
   assert.equal(outcome.url,VIEW);
   assert.equal(outcome.archiveCode,'DXCD-TL-00012');
   assert.equal(calls.docs.length,1);
   assert.equal(calls.docs[0].published,true);
   assert.equal(calls.docs[0].file_url,VIEW);
   assert.equal(calls.docs[0].document_date,null);
   assert.equal(calls.docs[0].sources,null);
   assert.match(calls.docs[0].summary,/PDF theo từng trang/);
   assert.equal(getAsset().record_kind,'documents');
   assert.equal(getAsset().record_id,DOC);
   assert.equal(getAsset().role,'primary');
   assert.ok(calls.http.some(([method,path])=>method==='GET'&&path.endsWith(ASSET)));
 }finally{restore()}
});
test('Do not create public document if R2 reader is not published',async()=>{
 const {calls,restore}=rig({published:false});
 try{
   await assert.rejects(()=>window.GDDR2.attachPublishedDocument(ASSET,{
     title:'Tài liệu lịch sử cần kiểm duyệt'
   }),/ĐÃ công bố/);
   assert.equal(calls.docs.length,0);
   assert.equal(calls.index.length,0);
 }finally{restore()}
});
test('Prevent duplicate document entry for already used viewer URL',async()=>{
 const {calls,getAsset,restore}=rig({existing:true});
 try{
   const result=await window.GDDR2.attachPublishedDocument(ASSET,{
     title:'Tên sách đã công bố'
   });
   assert.equal(result.id,DOC);
   assert.equal(calls.docs.length,0);
   assert.equal(getAsset().record_id,DOC);
 }finally{restore()}
});
test('Unpublishing linked viewer also unpublishes matching document card',async()=>{
 const {calls,restore}=rig({published:true,existing:true});
 try{
   await window.GDDR2.attachPublishedDocument(ASSET,{title:'Tư liệu đã có'});
   const r=await window.GDDR2.setPublication(ASSET,false);
   assert.equal(r.published,false);
   assert.equal(calls.docHidden,true);
   assert.ok(calls.docs.some(x=>x.update?.published===false));
 }finally{restore()}
});
