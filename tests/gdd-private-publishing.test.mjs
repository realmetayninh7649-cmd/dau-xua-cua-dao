import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../gdd-private-publishing.js',import.meta.url),'utf8');
const ID='12345678-1234-4123-8123-123456789abc';
function bootstrap({ready=true,allowDownload=false}={}){
  const calls=[];
  const window={GDDR2:{
    archive:async (file,supa,settings)=>{calls.push(['archive',settings]);return{id:ID,previewReady:ready,downloadReady:ready,originalBytes:file.size}},
    setPublication:async(id,pub,opts)=>{calls.push(['publish',id,pub,opts]);return{allowDownload:opts.allowDownload}}
  }};
  const sandbox={window,URL,fetch:async(url)=>{
    calls.push(['get-meta',url]);
    return{ok:true,json:async()=>({id:ID,kind:'image',allowDownload})};
  }};
  vm.runInNewContext(script,sandbox,{timeout:2000});
  return{api:window.GDDPrivatePublishing,calls};
}
test('new image keeps original private and publishes only R2 derivative after both variants ready',async()=>{
  const {api,calls}=bootstrap({ready:true});
  const result=await api.archiveAndPublish({name:'photo.jpg',size:2000},{},{recordKind:'media',role:'album'});
  assert.match(result.url,/\/v1\/public\/[a-f0-9-]+\/preview$/);
  assert.equal(result.originalPrivate,true);
  assert.equal(calls[0][0],'archive');
  assert.equal(calls[0][1].skipDerivatives,false);
  assert.equal(calls[1][0],'publish');
  assert.equal(calls[2][0],'get-meta');
});
test('do not publish a source without verified printable and preview derivatives',async()=>{
  const {api,calls}=bootstrap({ready:false});
  await assert.rejects(()=>api.archiveAndPublish({name:'bad.jpg',size:1000},{},{}),/chưa tạo đủ/);
  assert.deepEqual(calls.map(x=>x[0]),['archive']);
});
test('published document scan prints from safe R2 download derivative',async()=>{
  const {api}=bootstrap({ready:true,allowDownload:true});
  const result=await api.publishArchivedImage({id:ID,previewReady:true,downloadReady:true},{allowDownload:true});
  assert.equal(result.printUrl,'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/'+ID+'/download');
});
test('reject arbitrary external URLs as R2 public previews',()=>{
  const {api}=bootstrap();
  assert.equal(api.isPreviewURL('https://evil.example/v1/public/'+ID+'/preview'),false);
  assert.equal(api.isPreviewURL('https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/'+ID+'/preview'),true);
});
