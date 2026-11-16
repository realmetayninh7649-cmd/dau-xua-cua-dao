import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{VERSION} from '../src/index.mjs';

const OWNER='11111111-1111-4111-8111-111111111111';
const OTHER='22222222-2222-4222-8222-222222222222';
const base='https://gdd-r2-gateway.example.workers.dev';
const origin='https://realmetayninh7649-cmd.github.io';
const MB=1024*1024;
function req(path,method='GET',body,token='admin',headers={}) {
  return new Request(base+path,{
    method,headers:{origin,authorization:'Bearer '+token,...(body instanceof Uint8Array?{'content-length':String(body.byteLength)}:{}),...headers},
    ...(body!==undefined?{body:typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body)}:{})
  });
}
function grantAdmin(){
  const saved=globalThis.fetch;
  globalThis.fetch=async (url,options)=>{
    const token=(options?.headers?.authorization||'').split(' ')[1];
    if(String(url).includes('/auth/v1/user'))return new Response(JSON.stringify({id:token==='other'?OTHER:OWNER}),{status:token==='bad'?401:200});
    if(String(url).includes('/rest/v1/admin_users'))return new Response(JSON.stringify(token==='other'?[]:[{user_id:OWNER}]),{status:200});
    throw Error('Unexpected fetch');
  };
  return ()=>{globalThis.fetch=saved};
}
function mockR2(){
  const objects=new Map(),sessions=new Map();
  let seq=0;
  const b={
    objects,sessions,counts:{get:0,put:0,head:0},
    head:async key=>{b.counts.head++;return objects.get(key)||null},
    get:async key=>{
      b.counts.get++;
      const obj=objects.get(key);
      return obj?{json:async()=>JSON.parse(new TextDecoder().decode(obj.content))}:null;
    },
    put:async(key,content,opts={})=>{
      b.counts.put++;
      const bytes=typeof content==='string'?new TextEncoder().encode(content):new Uint8Array(content);
      const obj={content:bytes,size:bytes.length,customMetadata:opts.customMetadata||{},httpMetadata:opts.httpMetadata||{},etag:'c'.repeat(32)};
      objects.set(key,obj);return obj;
    },
    createMultipartUpload:async (key,opts)=>{
      const id='multipart-'+(++seq);
      const state={key,id,parts:new Map(),opts};
      sessions.set(id,state);
      return {uploadId:id};
    },
    resumeMultipartUpload:(key,uploadId)=>{
      const state=sessions.get(uploadId);
      if(!state||state.key!==key)throw Error('invalid multipart session');
      return {
        uploadPart:async(part,bytes)=>{
          state.parts.set(part,new Uint8Array(bytes));
          return {partNumber:part,etag:'b'.repeat(32)};
        },
        complete:async(parts)=>{
          const values=parts.map(x=>state.parts.get(x.partNumber));
          if(values.some(x=>!x))throw Error('missing part');
          const all=new Uint8Array(values.reduce((sum,v)=>sum+v.length,0));
          let offset=0;for(const v of values){all.set(v,offset);offset+=v.length}
          const obj={size:all.length,content:all,httpMetadata:state.opts.httpMetadata,
            customMetadata:state.opts.customMetadata,etag:'f'.repeat(32)};
          objects.set(key,obj);sessions.delete(uploadId);return obj;
        }
      };
    }
  };
  return b;
}
const env=b=>({GDD_BUCKET:b,SUPABASE_URL:'https://demo.supabase.co',
  SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test'});
test('không xác thực = không có quyền upload hoặc đọc bản gốc',async()=>{
  const b=mockR2(),env0=env(b),restore=grantAdmin();
  try{
    const a=await worker.fetch(req('/v1/uploads/start','POST',{name:'scan.pdf',size:6*MB},'bad',{'content-type':'application/json'}),env0);
    assert.equal(a.status,403);
    const c=await worker.fetch(req('/v1/assets/'+OWNER,'GET',undefined,'other'),env0);
    assert.equal(c.status,403);
    for(const p of ['/originals/scan.pdf','/v1/originals/'+OWNER,'/v1/public/'+OWNER,'/download']) {
      const result=await worker.fetch(new Request(base+p),env0);
      assert.notEqual(result.status,200);
    }
    assert.equal(b.objects.size,0);
  }finally{restore()}
});
test('bắt buộc CORS origin và từ chối định dạng nguy hiểm',async()=>{
  const b=mockR2(),restore=grantAdmin();
  try{
    const preflight=await worker.fetch(new Request(base+'/v1/uploads/start',{method:'OPTIONS',headers:{origin:'https://evil.example'}}),env(b));
    assert.equal(preflight.status,403);
    const r=await worker.fetch(req('/v1/uploads/start','POST',{name:'payload.exe',size:100},'admin',{'content-type':'application/json'}),env(b));
    assert.equal(r.status,400);
    assert.equal(b.sessions.size,0);
  }finally{restore()}
});
test('PDF gốc upload multipart nguyên từng byte, không phát công khai',async()=>{
  const b=mockR2(),restore=grantAdmin();
  try{
    const input=new Uint8Array([37,80,68,70,45,49,46,52,10,79,82,73,71,73,78,65,76]);
    const started=await worker.fetch(req('/v1/uploads/start','POST',{name:'ban-scan.pdf',size:input.length},'admin',{'content-type':'application/json'}),env(b));
    assert.equal(started.status,201);
    const session=await started.json();
    assert.match(session.key,/^originals\/11111111-/);
    assert.equal(session.partCount,1);
    const params=new URLSearchParams({key:session.key,uploadId:session.uploadId,part:'1'});
    const part=await worker.fetch(req('/v1/uploads/part?'+params,'PUT',input,'admin',{'content-type':'application/octet-stream'}),env(b));
    assert.equal(part.status,200);
    const info=await part.json();
    const completed=await worker.fetch(req('/v1/uploads/complete','POST',{
      key:session.key,uploadId:session.uploadId,size:input.length,parts:[info]
    },'admin',{'content-type':'application/json'}),env(b));
    assert.equal(completed.status,201);
    assert.deepEqual([...b.objects.get(session.key).content],[...input]);
    const meta=b.objects.get('meta/'+session.id+'.json');
    assert.ok(meta);
    const infoJson=JSON.parse(new TextDecoder().decode(meta.content));
    assert.equal(infoJson.published,false);
    assert.equal(infoJson.originalBytes,input.length);
    assert.equal(infoJson.kind,'document');
    const notPublic=await worker.fetch(new Request(base+'/v1/assets/'+session.id),env(b));
    assert.equal(notPublic.status,403);
  }finally{restore()}
});
test('lưu ảnh tối ưu riêng, không đụng đến bản gốc',async()=>{
  const b=mockR2(),restore=grantAdmin();
  try{
    const img=new Uint8Array([255,216,255,224,...new Array(20).fill(25)]);
    const a=await worker.fetch(req('/v1/uploads/start','POST',{name:'chan-dung.jpg',size:img.length},'admin',{'content-type':'application/json'}),env(b));
    const s=await a.json();
    const part=await worker.fetch(req('/v1/uploads/part?'+new URLSearchParams({key:s.key,uploadId:s.uploadId,part:'1'}),'PUT',img),env(b));
    const p=await part.json();
    await worker.fetch(req('/v1/uploads/complete','POST',{key:s.key,uploadId:s.uploadId,size:img.length,parts:[p]},'admin',{'content-type':'application/json'}),env(b));
    const snapshot=[...b.objects.get(s.key).content];
    const preview=new Uint8Array([82,73,70,70,10,0,0,0,87,69,66,80,...new Array(30).fill(1)]);
    const prev=await worker.fetch(req('/v1/assets/'+s.id+'/preview','PUT',preview,'admin',{'content-type':'image/webp'}),env(b));
    assert.equal(prev.status,201);
    const jpg=new Uint8Array([255,216,255,224,...new Array(30).fill(2)]);
    const download=await worker.fetch(req('/v1/assets/'+s.id+'/download','PUT',jpg,'admin',{'content-type':'image/jpeg'}),env(b));
    assert.equal(download.status,201);
    assert.deepEqual([...b.objects.get(s.key).content],snapshot);
    assert.ok(b.objects.has('derivatives/'+s.id+'/preview.webp'));
    assert.ok(b.objects.has('derivatives/'+s.id+'/download.jpg'));
    const status=await worker.fetch(req('/v1/assets/'+s.id),env(b));
    assert.deepEqual((({previewReady,downloadReady,published})=>({previewReady,downloadReady,published}))(await status.json()),
      {previewReady:true,downloadReady:true,published:false});
    const publicAttempt=await worker.fetch(new Request(base+'/v1/assets/'+s.id+'/preview'),env(b));
    assert.equal(publicAttempt.status,403);
  }finally{restore()}
});
test('không cho user khác hoàn tất hay gửi phần lên khóa của admin khác',async()=>{
  const b=mockR2(),restore=grantAdmin();
  try{
    const a=await worker.fetch(req('/v1/uploads/start','POST',{name:'test.docx',size:3},'admin',{'content-type':'application/json'}),env(b));
    const s=await a.json();
    const part=await worker.fetch(req('/v1/uploads/part?'+new URLSearchParams({key:s.key,uploadId:s.uploadId,part:'1'}),'PUT',new Uint8Array([1,2,3]),'other'),env(b));
    assert.equal(part.status,403);
    assert.equal(b.objects.size,0);
  }finally{restore()}
});
