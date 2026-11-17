import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('../../../gdd-document-router.js',import.meta.url),'utf8');
const root='https://realmetayninh7649-cmd.github.io';
const legacy='https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-documents/media/tang-le.pdf';
const r2=root+'/dau-xua-cua-dao/r2-xem.html?asset=47487fbf-5460-4a35-87ab-083da85d8945';
function load(){
  const handlers={},opens=[];
  const win={location:{href:root+'/dau-xua-cua-dao/',origin:root,assign:(url)=>opens.push(['assign',url])},
    open:(url,target)=>opens.push([target,url])};
  const doc={addEventListener:(ev,fn)=>{handlers[ev]=fn}};
  const sandbox={window:win,document:doc,URL};
  vm.runInNewContext(src,sandbox);
  return {api:win.GDDDocumentReader,handlers,opens};
}
test('all old public PDF links use one shared reader without changing original URL in DB',()=>{
  const {api}=load();
  assert.equal(api.kind(legacy),'legacy-pdf');
  const destination=new URL(api.readerUrl(legacy));
  assert.equal(destination.pathname,'/dau-xua-cua-dao/r2-xem.html');
  assert.equal(destination.searchParams.get('source'),legacy);
  assert.equal(api.readerUrl(r2),r2);
});
test('never proxy unknown external or signed/nonpublic PDF links',()=>{
  const {api}=load();
  for(const url of [
    'javascript:alert(1)','http://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-documents/b.pdf',
    'https://evil.com/malicious.pdf',
    'https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/sign/dao-su-documents/t.pdf',
    'https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-documents/n.png'
  ]){assert.equal(api.kind(url),'other');assert.equal(api.readerUrl(url),url)}
});
test('clicks from dynamically loaded albums also route old PDF to common reader',()=>{
  const {handlers,opens}=load();
  let prevented=false;
  handlers.click({defaultPrevented:false,button:0,altKey:false,ctrlKey:false,metaKey:false,
    shiftKey:false,preventDefault:()=>{prevented=true},
    target:{closest:()=>({getAttribute:()=>legacy,target:'_blank'})}});
  assert.equal(prevented,true);
  assert.equal(opens.length,1);
  assert.equal(opens[0][0],'_blank');
  assert.equal(new URL(opens[0][1]).searchParams.get('source'),legacy);
});
test('album/detail no longer offer direct original PDF download controls',()=>{
  const app=readFileSync(new URL('../../../app.js',import.meta.url),'utf8');
  const albums=readFileSync(new URL('../../../dao-su-albums.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../../../index.html',import.meta.url),'utf8');
  assert.match(app,/GDDDocumentReader\?\.readerUrl/);
  assert.match(albums,/GDDDocumentReader\?\.readerUrl/);
  assert.doesNotMatch(app,/↓ Tải PDF/);
  assert.doesNotMatch(albums,/down\.textContent='↓ Tải '/);
  assert.match(html,/gdd-document-router\.js/);
});
