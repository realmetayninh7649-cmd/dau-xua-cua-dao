import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../gdd-legacy-r2-images.js',import.meta.url),'utf8');
function bridge(){
  const sandbox={window:{},URL};
  vm.runInNewContext(source,sandbox,{timeout:1000});
  return sandbox.window.GDDLegacyImages;
}
const original='https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-images/documents/1793751867587-m0vmt9onf.jpg';
const target='https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/legacy-preview/documents/1793751867587-m0vmt9onf.jpg.webp';

test('bridge is permanently disabled while maintenance flag is in effect',()=>{
  const relay=bridge();
  assert.equal(relay.enabled,false);
  assert.equal(relay.displayUrl(original),original);
  assert.equal(relay.candidate(original),target);
});
test('relay cannot rewrite non-archive sources, PDF, private paths or query-transformed images',()=>{
  const relay=bridge();
  const forbidden=[
    'http://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-images/people/a.jpg',
    'https://evil.example/storage/v1/object/public/dao-su-images/people/a.jpg',
    'https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-documents/documents/123.pdf',
    'https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/sign/dao-su-images/people/a.jpg',
    original+'?download=1',
    original+'#fragment',
    'https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-images/private/a.jpg'
  ];
  for(const url of forbidden){
    assert.equal(relay.candidate(url),'','unexpected rewrite of '+url);
    assert.equal(relay.displayUrl(url),url);
  }
});
test('staged public image bridge leaves administration and source data untouched',()=>{
  const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const album=fs.readFileSync(new URL('../dao-su-albums.js',import.meta.url),'utf8');
  assert.match(app,/if\(!source\|\|state\.admin\)return source;/);
  assert.match(app,/const displayImageUrl=raw=>/);
  assert.match(album,/img\.src=window\.GDDLegacyImages\?\.displayUrl\(url\)\|\|url/);
  assert.match(album,/else\{img\.src=safeUrl\(row\.image_url\)/);
  assert.match(app,/data-gdd-archive-qr/);
});
