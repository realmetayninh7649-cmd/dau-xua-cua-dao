import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{VERSION} from '../src/index.mjs';

const user='11111111-1111-4111-8111-111111111111';
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const base='https://gdd-r2-gateway.example.workers.dev';
const origin='https://realmetayninh7649-cmd.github.io';
const documentMeta={id,owner:user,kind:'document',mime:'application/pdf',
  originalName:'thu-bao.pdf',originalBytes:1050,key:'originals/'+user+'/'+id+'/original.pdf',
  preview:false,download:false,published:false};
function fixture(meta){
 const store=new Map();
 const encode=(value)=>typeof value==='string'?new TextEncoder().encode(value):new Uint8Array(value);
 const b={
   store,readKeys:[],
   get:async key=>{
     b.readKeys.push(key);
     const x=store.get(key);
     if(!x)return null;
     return {...x,body:new Response(x.bytes).body,json:async()=>JSON.parse(new TextDecoder().decode(x.bytes))};
   },
   head:async key=>store.get(key)||null,
   put:async (key,data,opts={})=>{
     const bytes=encode(data);
     const obj={bytes,size:bytes.length,httpMetadata:opts.httpMetadata||{},customMetadata:opts.customMetadata||{},etag:'c'.repeat(32)};
     store.set(key,obj);return obj;
   }
 };
 const metaObject={...meta};
 store.set('meta/'+id+'.json',{bytes:encode(JSON.stringify(metaObject)),size:255,httpMetadata:{contentType:'application/json'}});
 const env={GDD_BUCKET:b,SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'};
 return {b,env};
}
const origFetch=globalThis.fetch;
function setAuth(){
 globalThis.fetch=async (url,options)=>{
   const str=String(url);
   if(str.includes('/auth/v1/user'))return Response.json({id:user});
   if(str.includes('/rest/v1/admin_users'))return Response.json([{user_id:user}]);
   throw Error('Unexpected network URL');
 };
 return ()=>{globalThis.fetch=origFetch};
}
function req(path,method='GET',body,authenticated=false,contentType){
 return new Request(base+path,{
   method,
   headers:{origin,...(authenticated?{authorization:'Bearer admin'}:{}),...(contentType?{'content-type':contentType}:{})},
   ...(body!==undefined?{body:typeof body==='object'&&!ArrayBuffer.isView(body)?JSON.stringify(body):body}:{})
 });
}
test('mọi bản chưa công bố trả 404, không có đường dẫn nguyên mẫu',async()=>{
 const {env,b}=fixture(documentMeta);
 let r=await worker.fetch(req('/v1/public/'+id),env);
 assert.equal(r.status,404);
 for(const path of ['/v1/public/'+id+'/page/1','/v1/public/'+id+'/download','/v1/assets/'+id+'/original','/originals/a.pdf']){
   r=await worker.fetch(req(path),env);
   assert.notEqual(r.status,200);
 }
 assert.ok(!b.readKeys.some(key=>key.startsWith('originals/')));
});
test('PDF từng trang: chỉ Admin mới tải được, không được công bố khi thiếu trang',async()=>{
 const restore=setAuth();
 try{
   const {env,b}=fixture(documentMeta);
   const bytes=new Uint8Array([255,216,255,224,...new Array(40).fill(9)]);
   let r=await worker.fetch(req('/v1/assets/'+id+'/page/1','PUT',bytes,false,'image/jpeg'),env);
   assert.equal(r.status,403);
   r=await worker.fetch(req('/v1/assets/'+id+'/page/1','PUT',bytes,true,'image/jpeg'),env);
   assert.equal(r.status,201);
   const missing=await worker.fetch(req('/v1/assets/'+id+'/publication','POST',{
     publish:true,pageCount:2,viewSource:'pdf'
   },true,'application/json'),env);
   assert.equal(missing.status,409);
   assert.equal((await worker.fetch(req('/v1/public/'+id),env)).status,404);
   r=await worker.fetch(req('/v1/assets/'+id+'/page/2','PUT',bytes,true,'image/jpeg'),env);
   assert.equal(r.status,201);
   const pub=await worker.fetch(req('/v1/assets/'+id+'/publication','POST',{
     publish:true,pageCount:2,viewSource:'pdf'
   },true,'application/json'),env);
   assert.equal(pub.status,200);
   const data=await pub.json();
   assert.equal(data.originalPrivate,true);
   const manifest=await worker.fetch(req('/v1/public/'+id),env);
   assert.equal(manifest.status,200);
   assert.deepEqual((({kind,pageCount,viewSource,allowDownload})=>({kind,pageCount,viewSource,allowDownload}))(await manifest.json()),
     {kind:'document',pageCount:2,viewSource:'pdf',allowDownload:false});
   const image=await worker.fetch(req('/v1/public/'+id+'/page/2'),env);
   assert.equal(image.status,200);
   assert.equal(image.headers.get('content-type'),'image/jpeg');
   assert.deepEqual([...new Uint8Array(await image.arrayBuffer())],[...bytes]);
   assert.equal((await worker.fetch(req('/v1/public/'+id+'/download'),env)).status,404);
   assert.equal((await worker.fetch(req('/v1/public/'+id+'/page/3'),env)).status,404);
   const hidden=await worker.fetch(req('/v1/assets/'+id+'/publication','POST',{publish:false},true,'application/json'),env);
   assert.equal(hidden.status,200);
   assert.equal((await worker.fetch(req('/v1/public/'+id+'/page/1'),env)).status,404);
   assert.ok(!b.readKeys.some(k=>k.startsWith('originals/')));
 }finally{restore()}
});
test('ảnh xem public theo lựa chọn, tải chỉ là JPEG tối ưu khi cho phép',async()=>{
 const restore=setAuth();
 try{
   const {env,b}=fixture({...documentMeta,kind:'image',mime:'image/png',originalName:'ban-anh.png',preview:true,download:true,previewMime:'image/jpeg'});
   const bytes=new Uint8Array([255,216,255,224,...new Array(40).fill(8)]);
   await b.put('derivatives/'+id+'/preview.jpg',bytes,{httpMetadata:{contentType:'image/jpeg'}});
   await b.put('derivatives/'+id+'/download.jpg',bytes,{httpMetadata:{contentType:'image/jpeg'}});
   const pub=await worker.fetch(req('/v1/assets/'+id+'/publication','POST',{publish:true,allowDownload:false},true,'application/json'),env);
   assert.equal(pub.status,200);
   assert.equal((await worker.fetch(req('/v1/public/'+id+'/preview'),env)).status,200);
   assert.equal((await worker.fetch(req('/v1/public/'+id+'/download'),env)).status,404);
   const change=await worker.fetch(req('/v1/assets/'+id+'/publication','POST',{publish:true,allowDownload:true},true,'application/json'),env);
   assert.equal(change.status,200);
   assert.equal((await worker.fetch(req('/v1/public/'+id+'/download'),env)).status,200);
   assert.equal((await worker.fetch(req('/v1/assets/'+id),env)).status,403);
   assert.ok(!b.readKeys.some(k=>k.startsWith('originals/')));
 }finally{restore()}
});
test('Word .doc cũ không thể công bố như PDF, DOCX phải dùng bản đọc chữ',async()=>{
 const restore=setAuth();
 try{
   const {env}=fixture({...documentMeta,mime:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',originalName:'ban.docx'});
   const bytes=new Uint8Array([255,216,255,224,...new Array(40).fill(8)]);
   assert.equal((await worker.fetch(req('/v1/assets/'+id+'/page/1','PUT',bytes,true,'image/jpeg'),env)).status,201);
   assert.equal((await worker.fetch(req('/v1/assets/'+id+'/publication','POST',{publish:true,pageCount:1,viewSource:'pdf'},true,'application/json'),env)).status,400);
   assert.equal((await worker.fetch(req('/v1/assets/'+id+'/publication','POST',{publish:true,pageCount:1,viewSource:'docx_text'},true,'application/json'),env)).status,200);
 }finally{restore()}
});
