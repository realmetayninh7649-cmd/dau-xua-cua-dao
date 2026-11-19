import test from 'node:test';
import assert from 'node:assert/strict';
import {File} from 'node:buffer';
import {readFileSync} from 'node:fs';
import {uploadPreservedAsset} from '../client/uploader.mjs';

test('DK01.7: album upload preserves original bytes and skips unneeded R2 derivatives',async()=>{
  const file=new File([new Uint8Array([255,216,255,1,2,3,4])],'original.jpg',{type:'image/jpeg'});
  const expectedId='47487fbf-5460-4a35-87ab-083da85d8945';
  const events=[], requests=[], oldFetch=globalThis.fetch;
  globalThis.fetch=async(url,options)=>{
    requests.push({url:String(url),method:options?.method});
    assert.match(String(url),/\/v1\/uploads\/small\?/);
    assert.equal(options.method,'PUT');
    assert.equal(options.body,file); // EXACT original File object, no recompression
    return new Response(JSON.stringify({
      id:expectedId,originalPreserved:true,originalBytes:file.size,previewReady:false,downloadReady:false
    }),{status:201,headers:{'content-type':'application/json'}});
  };
  const supabase={auth:{getSession:async()=>({data:{session:{access_token:'admin-test-session'}},error:null})}};
  try{
    const result=await uploadPreservedAsset(file,{
      supabase,endpoint:'https://api.example.invalid',skipDerivatives:true,onProgress:event=>events.push(event.phase)
    });
    assert.equal(result.id,expectedId);
    assert.equal(result.originalBytes,file.size);
    assert.equal(result.originalPreserved,true);
    assert.equal(result.previewReady,false);
    assert.equal(result.downloadReady,false);
    assert.equal(result.originalDownloadPublic,false);
    assert.equal(result.status,'original-preserved-derivatives-deferred');
    assert.deepEqual(events,['original','original-preserved','derivatives-deferred']);
    assert.equal(requests.length,1);
    assert.ok(!requests.some(request=>/\/v1\/assets\//.test(request.url)));
  }finally{globalThis.fetch=oldFetch}
});

test('Private-cutover: gallery and primary create R2 derivatives before publishing; retry utility remains available',()=>{
  const root=new URL('../../../',import.meta.url);
  const album=readFileSync(new URL('index.html',root),'utf8');
  const app=readFileSync(new URL('app.js',root),'utf8');
  const admin=readFileSync(new URL('gdd-r2-admin.js',root),'utf8');
  const module=readFileSync(new URL('workers/gdd-r2-gateway/client/uploader.mjs',root),'utf8');
  assert.match(album,/skipDerivatives:false/);
  assert.match(album,/window.GDDPrivatePublishing.publishArchivedImage/);
  assert.match(app,/skipDerivatives:false/);
  assert.match(app,/window.GDDPrivatePublishing.publishArchivedImage/);
  assert.match(admin,/finishOptimizingExisting\(sourcePicker\.files\[0\],entry\.asset_id/);
  assert.match(module,/export async function finishOptimizingExisting/);
  assert.match(album,/gdd-r2-admin\.js\?v=20261118-batch-01/);
  assert.match(admin,/uploader\.mjs\?v=20261118-batch-01/);
});
