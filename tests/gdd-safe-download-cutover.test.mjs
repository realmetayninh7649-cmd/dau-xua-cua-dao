import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const base='https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-images/';
const bridgeSrc=fs.readFileSync(new URL('../gdd-legacy-r2-images.js',import.meta.url),'utf8');
function bridge(){const env={window:{},URL};vm.runInNewContext(bridgeSrc,env,{timeout:1500});return env.window.GDDLegacyImages;}
test('all 133 published document scans use approved printable R2 copies',()=>{
 const paths=JSON.parse(fs.readFileSync(new URL('../maintenance-tasks/gdd-public-print-paths.json',import.meta.url),'utf8')).paths;
 assert.equal(paths.length,133);
 const b=bridge();
 for(const path of paths)assert.equal(b.printUrl(base+path),'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/legacy-print/'+path+'.jpg');
});
test('cannot redirect unpublished or untrusted print paths',()=>{
 const b=bridge();
 for(const url of [base+'people/draft-secret.jpg',base+'../private/draft.jpg',base+'documents/fake.jpg',
     base+'documents/fake.jpg?raw=1','http://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-images/documents/fake.jpg',
     'https://evil.example/documents/fake.jpg'])assert.equal(b.printUrl(url),url);
});
test('no public original download via site image button; official output always marked',()=>{
 const source=fs.readFileSync(new URL('../image-viewer.js',import.meta.url),'utf8');
 assert.match(source,/const approvedUrl=window.GDDLegacyImages\?\.displayUrl\?\.\(url\)\|\|url/);
 assert.match(source,/const traceCode=window.GDDTrace\?\.validCode\(photoCode\)/);
 assert.match(source,/window.GDDTrace\.stampedBlob\(original,traceCode\)/);
});
test('document export uses printable R2 derivatives and optimized photo previews',()=>{
 const source=fs.readFileSync(new URL('../gdd-document-export.js',import.meta.url),'utf8');
 assert.match(source,/fetch\(window.GDDLegacyImages\?\.printUrl\?\.\(url\)\|\|url/);
 assert.match(source,/fetch\(window.GDDLegacyImages\?\.displayUrl\?\.\(url\)\|\|url/);
});
test('legacy PDF routed only to 3 verified page-only R2 assets',()=>{
 const router=fs.readFileSync(new URL('../gdd-document-router.js',import.meta.url),'utf8');
 const viewer=fs.readFileSync(new URL('../r2-xem.mjs',import.meta.url),'utf8');
 const ids=['a4bf8d79-a7a3-51cb-909c-0a4681902c01','203886e9-cd67-58ab-96b3-ee4ff97b401a','1105db24-e971-5f1a-b632-d3b9f41b3b39'];
 for(const id of ids){assert.ok(router.includes(id));assert.ok(viewer.includes(id));}
 assert.match(viewer,/location\.replace\(target\.href\)/);
});
