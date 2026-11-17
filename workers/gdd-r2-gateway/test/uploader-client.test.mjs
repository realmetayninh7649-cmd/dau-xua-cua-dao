import test from 'node:test';
import assert from 'node:assert/strict';
import {finishOptimizingExisting} from '../client/uploader.mjs';

const id='68b9257e-283f-41b8-a844-d63975ffd558';
const origin='https://gdd-r2-gateway.example.workers.dev';
function browserMocks() {
  const prev={fetch:globalThis.fetch,createImageBitmap:globalThis.createImageBitmap,
    document:globalThis.document};
  const requests=[];
  globalThis.createImageBitmap=async()=>({width:100,height:120,close(){}});
  globalThis.document={createElement(name){
    assert.equal(name,'canvas');
    return {width:0,height:0,
      getContext(){return {imageSmoothingEnabled:true,imageSmoothingQuality:'high',
        fillStyle:'#ffffff',globalCompositeOperation:'source-over',fillRect(){},drawImage(){}};},
      toBlob(cb,type){
        // Simulate Safari lacking WebP encoder: returns PNG on WebP request.
        const mime=type==='image/webp'?'image/png':type;
        const bytes=mime==='image/jpeg'
          ?new Uint8Array([255,216,255,224,...new Array(24).fill(7)])
          :new Uint8Array([137,80,78,71,...new Array(24).fill(5)]);
        cb(new Blob([bytes],{type:mime}));
      }
    };
  }};
  globalThis.fetch=async (url,args={})=>{
    const path=new URL(url).pathname;
    requests.push({path,method:args.method||'GET',type:args.headers?.['content-type']||''});
    if(path==='/v1/assets/'+id&&args.method==='GET')
      return Response.json({id,kind:'image',originalBytes:100,originalName:'ban-goc.png',
        previewReady:false,downloadReady:false});
    if(path==='/v1/assets/'+id+'/preview'&&args.method==='PUT')
      return Response.json({variant:'preview',storedBytes:30,originalUnchanged:true},{status:201});
    if(path==='/v1/assets/'+id+'/download'&&args.method==='PUT')
      return Response.json({variant:'download',storedBytes:30,originalUnchanged:true},{status:201});
    throw Error('Unexpected network request '+path);
  };
  return {requests,restore:()=>Object.assign(globalThis,prev)};
}
const supabase={auth:{getSession:async()=>({data:{session:{access_token:'localtest'}},error:null})}};
test('Tạo lại ảnh xem trên iPhone không tải trùng ảnh gốc và fallback JPEG',async()=>{
  const mock=browserMocks();
  try{
    const file={name:'ban-goc.png',size:100};
    const result=await finishOptimizingExisting(file,id,{supabase,endpoint:origin});
    assert.equal(result.status,'original-and-optimized');
    assert.equal(result.previewReady,true);
    assert.equal(result.downloadReady,true);
    assert.deepEqual(mock.requests.map(r=>[r.method,r.path]),[
      ['GET','/v1/assets/'+id],['PUT','/v1/assets/'+id+'/preview'],['PUT','/v1/assets/'+id+'/download']
    ]);
    assert.ok(mock.requests.every(x=>!x.path.includes('/uploads/')));
    assert.equal(mock.requests[1].type,'image/jpeg');
  }finally{mock.restore()}
});
test('Không xử lý lại nếu chọn sai tệp nguồn, dù ID ảnh đúng',async()=>{
  const mock=browserMocks();
  try{
    await assert.rejects(
      ()=>finishOptimizingExisting({name:'anh-khac.png',size:100},id,{supabase,endpoint:origin}),
      /không khớp ảnh nguyên mẫu/
    );
    assert.deepEqual(mock.requests.map(x=>x.method),['GET']);
  }finally{mock.restore()}
});
