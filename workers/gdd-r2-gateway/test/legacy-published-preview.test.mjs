import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';
import {legacyPreviewResponse} from '../src/legacy-preview.mjs';
import {LEGACY_PUBLISHED_PATHS} from '../src/legacy-published-paths.mjs';

const example='documents/1793751867587-m0vmt9onf.jpg';
const base='https://gdd-r2-gateway.example.workers.dev/v1/legacy-preview/';
const previewPath='/v1/legacy-preview/'+example+'.webp';
const expectedKey='legacy-private-image-previews-v1/'+example+'.webp';
function fixture(){
  const reads=[];
  const payload=new Uint8Array([82,73,70,70,20,0,0,0,87,69,66,80,86,80,56,32,0,0,0,0]);
  return {
    reads,payload,
    env:{GDD_BUCKET:{
      get:async key=>{reads.push(key);return {
        body:new Response(payload).body,
        httpMetadata:{contentType:'image/webp'}
      }}
    }}
  };
}

test('exact pre-approved set has 700 published image paths',()=>{
  assert.equal(LEGACY_PUBLISHED_PATHS.size,700);
  assert.equal(LEGACY_PUBLISHED_PATHS.has(example),true);
  assert.equal(LEGACY_PUBLISHED_PATHS.has('people/private-draft.jpg'),false);
});

test('production route serves only an already published WebP, never original bytes',async()=>{
  const {env,reads}=fixture();
  const response=await worker.fetch(new Request(base+example+'.webp'),env);
  assert.equal(response.status,200);
  assert.equal(response.headers.get('content-type'),'image/webp');
  assert.deepEqual(reads,[expectedKey]);
  assert.ok(reads.every(key=>!key.startsWith('legacy-private-images-v1/')));
});

test('when explicitly enabled for a future launch, only a published WebP can be read',async()=>{
  const {env,reads,payload}=fixture();
  const response=await legacyPreviewResponse(new Request(base+example+'.webp',{
    headers:{origin:'https://dauxuacuadao.info.vn'}
  }),env,previewPath,'https://dauxuacuadao.info.vn',true);
  assert.equal(response.status,200);
  assert.deepEqual(reads,[expectedKey]);
  assert.equal(response.headers.get('content-type'),'image/webp');
  assert.equal(response.headers.get('access-control-allow-origin'),'https://dauxuacuadao.info.vn');
  assert.equal(response.headers.get('cross-origin-resource-policy'),'cross-origin');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())],[...payload]);
  assert.ok(!reads.some(key=>key.startsWith('legacy-private-images-v1/')));
});

test('future preview endpoint rejects nonpublished paths and traversal without R2 reads',async()=>{
  for(const suffix of ['people/private-draft.jpg.webp','documents/../../people/x.jpg.webp',
    'people%2Fprivate-draft.jpg.webp','documents/%2E%2E/secret.jpg.webp','originals/secret.jpg.webp']){
    const {env,reads}=fixture();
    const req=new Request(base+suffix);
    const r=await legacyPreviewResponse(req,env,'/v1/legacy-preview/'+suffix,null,true);
    assert.equal(r.status,404,'unexpected response for '+suffix);
    assert.deepEqual(reads,[]);
  }
});

test('future endpoint rejects non-GET and missing R2 preview object',async()=>{
  const {env,reads}=fixture();
  const r=await legacyPreviewResponse(new Request(base+example+'.webp',{method:'POST'}),env,previewPath,null,true);
  assert.equal(r.status,405);
  assert.deepEqual(reads,[]);
  const missing={GDD_BUCKET:{get:async()=>null}};
  const absent=await legacyPreviewResponse(new Request(base+example+'.webp'),missing,previewPath,null,true);
  assert.equal(absent.status,404);
});

test('no original, source PDF or raw legacy R2 key route is exposed',async()=>{
  const {env,reads}=fixture();
  for(const path of ['/v1/legacy-original/'+example,'/files/'+example,
    '/legacy-private-images-v1/'+example,
    '/v1/legacy-preview/'+example,
    '/v1/legacy-preview/people/private.jpg.webp']){
    const r=await worker.fetch(new Request('https://gdd-r2-gateway.example.workers.dev'+path),env);
    assert.notEqual(r.status,200);
  }
  assert.deepEqual(reads,[]);
});
