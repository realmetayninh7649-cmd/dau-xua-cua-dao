/**
 * Exercise the actual Worker response code with a genuine private R2 WebP sample.
 * No Worker deployment, no live URL, no Supabase writes. Fails closed on unknown paths.
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import worker from '../workers/gdd-r2-gateway/src/index.mjs';
import {legacyPreviewResponse} from '../workers/gdd-r2-gateway/src/legacy-preview.mjs';

const originalPath=fs.readFileSync('/tmp/gdd-r2-sample-path.txt','utf8').trim();
const realWebP=fs.readFileSync('/tmp/gdd-r2-sample.webp');
if(realWebP.length<100)throw new Error('Missing genuine sampled R2 WebP fixture');
const path='/v1/legacy-preview/'+originalPath+'.webp';
const url='https://gdd-r2-gateway.example.workers.dev'+path;
const readKeys=[];
const env={GDD_BUCKET:{
  get:async key=>{
    readKeys.push(key);
    const expected='legacy-private-image-previews-v1/'+originalPath+'.webp';
    if(key!==expected)throw new Error('Worker reached forbidden R2 object');
    return {body:new Response(realWebP).body,httpMetadata:{contentType:'image/webp'}};
  }
}};
const unpublished=await worker.fetch(new Request(url),env);
assert.equal(unpublished.status,404,'Public maintenance route must remain disabled');
assert.deepEqual(readKeys,[],'Disabled route must make no R2 reads');
const response=await legacyPreviewResponse(
  new Request(url,{headers:{origin:'https://dauxuacuadao.info.vn'}}),
  env,path,'https://dauxuacuadao.info.vn',true);
assert.equal(response.status,200);
assert.equal(response.headers.get('content-type'),'image/webp');
assert.equal(response.headers.get('cache-control'),'public, max-age=86400');
const bytes=Buffer.from(await response.arrayBuffer());
assert.deepEqual(bytes,realWebP,'Worker corrupted actual WebP bytes');
assert.equal(readKeys.length,1);
assert.equal(readKeys[0],'legacy-private-image-previews-v1/'+originalPath+'.webp');
const unapproved=await legacyPreviewResponse(
  new Request('https://example.workers.dev/v1/legacy-preview/documents/unapproved.jpg.webp'),
  env,'/v1/legacy-preview/documents/unapproved.jpg.webp',null,true);
assert.equal(unapproved.status,404);
assert.equal(readKeys.length,1,'Unpublished path must never touch the bucket');
console.log('REAL R2 PREVIEW ROUTE PASS: genuine WebP bytes served intact in isolated test;');
console.log('production still returns 404 while maintenance is active; originals remain private.');
