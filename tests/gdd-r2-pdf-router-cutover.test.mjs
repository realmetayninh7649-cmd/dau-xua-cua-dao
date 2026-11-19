import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../gdd-document-router.js',import.meta.url),'utf8');
const root='https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-documents/';
const mappings=[
 ['documents/1794684373312-e808f501-1bba-458d-b82f-f5f096479426.pdf','a4bf8d79-a7a3-51cb-909c-0a4681902c01'],
 ['documents/1794684462288-fc373424-39bf-4d8d-950c-2195aa01a603.pdf','203886e9-cd67-58ab-96b3-ee4ff97b401a'],
 ['media/1794860043784-52816aff-f9f7-4790-9e91-d87d7a86fc96.pdf','1105db24-e971-5f1a-b632-d3b9f41b3b39']
];
function sandbox(host='dauxuacuadao.info.vn'){
  const prefix=host==='realmetayninh7649-cmd.github.io'?'/dau-xua-cua-dao/':'/';
  const origin='https://'+host;
  const location={hostname:host,origin,href:origin+prefix,pathname:prefix};
  const window={location};
  const document={addEventListener(){}};
  vm.runInNewContext(source,{window,document,URL},{timeout:1000});
  return {reader:window.GDDDocumentReader,origin,prefix};
}
test('three exact previously published PDFs route only to R2 page-only assets at custom domain',()=>{
  const {reader,origin}=sandbox();
  for(const [path,id] of mappings){
    const url=root+path;
    assert.equal(reader.kind(url),'legacy-pdf');
    assert.equal(reader.readerUrl(url),origin+'/r2-xem.html?asset='+id);
    assert.equal(reader.kind(reader.readerUrl(url)),'r2');
  }
});
test('GitHub Pages repo subdirectory and custom domain use correct viewer paths',()=>{
  const {reader,origin}=sandbox('realmetayninh7649-cmd.github.io');
  const [path,id]=mappings[0];
  assert.equal(reader.readerUrl(root+path),origin+'/dau-xua-cua-dao/r2-xem.html?asset='+id);
});
test('other PDFs and Word docs keep original unified reader fallback, not arbitrary R2 access',()=>{
  const {reader,origin}=sandbox();
  const others=[
    root+'media/another-unpublished-document.pdf',
    root+'documents/private.docx',
    root+'media/unlisted.doc'
  ];
  for(const url of others){
    const parsed=new URL(reader.readerUrl(url));
    assert.equal(parsed.origin,origin);
    assert.equal(parsed.pathname,'/r2-xem.html');
    assert.equal(parsed.searchParams.get('source'),url);
    assert.equal(parsed.searchParams.has('asset'),false);
  }
  const path=mappings[0][0];
  for(const altered of [root+path+'?download=1',root+path+'#fragment']){
    const parsed=new URL(reader.readerUrl(altered));
    assert.equal(parsed.searchParams.get('asset'),null);
  }
});
test('R2 original keys and unrelated origins never map to viewer IDs',()=>{
  const {reader}=sandbox();
  const bad=[
    'https://example.invalid/storage/v1/object/public/dao-su-documents/'+mappings[0][0],
    'https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/other/'+mappings[0][0],
    'https://gdd-r2-gateway.realmetayninh7649.workers.dev/legacy-private-dk016/private.pdf'
  ];
  for(const url of bad)assert.equal(reader.readerUrl(url),url);
});
