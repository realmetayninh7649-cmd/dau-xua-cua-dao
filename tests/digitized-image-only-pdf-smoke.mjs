import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const original=fs.readFileSync(new URL('../gdd-document-export.js',import.meta.url),'utf8');
const last=original.lastIndexOf('})();');
assert.ok(last>100,'Expected archive export module IIFE');
const instrumented=original.slice(0,last)+
  'globalThis.__PDF_TEST_ONLY={documentScanSources,imageOnlyDocumentPdf,fullResolutionPrintScan,preparePrintScans,pdfDefinition,docxBlob,readGallery};\n'
  +original.slice(last);

function fakeDocument(){
  return {
    head:{appendChild(){}},
    body:{},
    getElementById(){return null},
    addEventListener(){},
    createElement(tag){
      return {nodeName:tag,style:{},setAttribute(){},remove(){},appendChild(){},
        getContext(){return {drawImage(){},fillRect(){}}},toDataURL(type){return 'data:'+(type||'image/png')+';base64,iVBORw0KGgo='}};
    }
  };
}
class FakeImage{
  naturalWidth=4200;
  naturalHeight=6000;
  set src(value){setImmediate(()=>this.onload?.())}
}
class FakeFileReader{
  async readAsDataURL(blob){
    const bytes=Buffer.from(await blob.arrayBuffer());
    this.result='data:'+(blob.type||'application/octet-stream')+';base64,'+bytes.toString('base64');
    this.onload?.();
  }
}
function mockEnvironment({fetchFunction,imageWidth=1800,imageHeight=2600,d1=false}={}){
  class SizedFakeImage extends FakeImage{
    constructor(){super();this.naturalWidth=imageWidth;this.naturalHeight=imageHeight;}
  }
  const c={window:{addEventListener(){},SITE_CONFIG:d1?{publicReadProvider:'d1-staging'}:{}},document:fakeDocument(),
    MutationObserver:class{observe(){} disconnect(){}},
    Image:SizedFakeImage,
    FileReader:FakeFileReader,
    Blob,
    URL, URLSearchParams, location:{href:'https://dauxuacuadao.info.vn/',
      origin:'https://dauxuacuadao.info.vn',pathname:'/',
      hash:'#tai-lieu-so-hoa/example'},
    setTimeout,clearTimeout,AbortController,
    queueMicrotask(){},setImmediate,
    fetch:fetchFunction||(()=>Promise.reject(new Error('Unexpected network use'))),
    console,TextEncoder,Uint8Array
  };
  vm.runInNewContext(instrumented,c,{filename:'gdd-document-export.js',timeout:6000});
  return c.__PDF_TEST_ONLY;
}
const base='https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-images/';
const record={
  kind:'documents',title:'THÔNG TRI SỐ 01/NCPS/TT — CỨU TRỢ MIỀN TRUNG',
  documentFileUrl:base+'documents/original-page-1.jpg',
  cover:'https://gdd-r2-gateway.example.workers.dev/v1/legacy-preview/documents/original-page-1.jpg.webp',
  gallery:[
    {url:base+'documents/original-page-2.jpg',caption:'Trang thứ 2'},
    {url:base+'documents/original-page-3.png',caption:'Trang thứ 3'},
    {url:base+'documents/original-page-2.jpg',caption:'Trùng trang hai'},
    {url:base+'documents/attachment.docx',caption:'File Word'}
  ],
  subtitle:'Văn kiện hành chánh Đạo',
  summary:'Thống Tri Hội Thánh về việc cứu trợ đồng bào bão lụt.',
  content:'Nội dung dài phải ở Word, không xuất trong PDF in.',
  sources:'Nguồn tư liệu và biên khảo để tham chiếu.',
  archiveCode:'DXCD-SH.HCD-00012',
  permalink:'https://dauxuacuadao.info.vn/#tai-lieu-so-hoa/sample'
};

test('Document PDF orders original file_url first, then gallery in source order, without thumbnails or DOCX',()=>{
  const m=mockEnvironment();
  const urls=m.documentScanSources(record);
  assert.deepEqual([...urls],[
    base+'documents/original-page-1.jpg',
    base+'documents/original-page-2.jpg',
    base+'documents/original-page-3.png'
  ]);
});

test('Document PDF definition is photo-only: one picture per A4 page, no text, cover, captions or footer',()=>{
  const m=mockEnvironment();
  const scans=[
    {data:'data:image/jpeg;base64,AAA',width:4200,height:6000},
    {data:'data:image/jpeg;base64,BBB',width:2400,height:3200},
    {data:'data:image/png;base64,CCC',width:3500,height:5000},
  ];
  const pdf=m.imageOnlyDocumentPdf(record,scans);
  assert.equal(pdf.pageSize,'A4');
  assert.equal(pdf.content.length,3);
  assert.equal(pdf.footer,undefined);
  assert.equal(pdf.header,undefined);
  assert.ok(pdf.pageMargins.every(x=>x>=0&&x<=12));
  for(let i=0;i<3;i++){
    const item=pdf.content[i];
    assert.equal(item.image,scans[i].data);
    assert.equal(item.text,undefined);
    assert.equal(item.caption,undefined);
    assert.ok(item.width>0&&item.width<=595.28);
    assert.ok(item.height>0&&item.height<=841.89);
    assert.equal(item.pageBreak,i===0?undefined:'before');
    assert.equal(item.alignment,'center');
  }
  assert.ok(!JSON.stringify(pdf.content).includes('NỘI DUNG TƯ LIỆU'));
  assert.ok(!JSON.stringify(pdf.content).includes(record.title));
  assert.ok(!JSON.stringify(pdf.content).includes(record.summary));
});

test('Original JPEG is embedded byte-for-byte (no 1400px resize, no JPEG quality-82 conversion)',async()=>{
  const jpeg=Uint8Array.from([0xff,0xd8,0xff,0xe0,0,1,2,3,4,5,6,7]);
  const m=mockEnvironment({fetchFunction:async()=>({
    ok:true,
    blob:async()=>new Blob([jpeg],{type:'image/jpeg'})
  })});
  const image=await m.fullResolutionPrintScan(base+'documents/test-original.jpg');
  assert.equal(image.width,1800);
  assert.equal(image.height,2600);
  assert.equal(image.data.slice(0,23),'data:image/jpeg;base64,');
  assert.deepEqual(Buffer.from(image.data.split(',')[1],'base64'),Buffer.from(jpeg));
});

test('Oversized photographic scan is reduced only to 300-DPI A4 pixel limits, preserving its orientation',async()=>{
  const jpeg=Uint8Array.from([0xff,0xd8,0xff,0xe0,0,1,2,3,4,5,6,7]);
  const m=mockEnvironment({
    imageWidth:4200,imageHeight:6000,
    fetchFunction:async()=>({ok:true,blob:async()=>new Blob([jpeg],{type:'image/jpeg'})})
  });
  const scan=await m.fullResolutionPrintScan(base+'documents/huge.jpg');
  assert.ok(scan.width<=2480&&scan.height<=3508);
  assert.ok(scan.width>1800&&scan.height>2600);
  assert.ok(Math.abs(scan.width/scan.height-4200/6000)<.002);
  assert.ok(scan.data.startsWith('data:image/jpeg;base64,'));
});

test('Landscape oversized scan is capped to 3508x2480, not portrait letterboxing',async()=>{
  const jpeg=Uint8Array.from([0xff,0xd8,0xff,0xe0,0,1,2,3,4,5,6,7]);
  const m=mockEnvironment({
    imageWidth:6200,imageHeight:4400,
    fetchFunction:async()=>({ok:true,blob:async()=>new Blob([jpeg],{type:'image/jpeg'})})
  });
  const scan=await m.fullResolutionPrintScan(base+'documents/landscape.jpg');
  assert.ok(scan.width<=3508&&scan.height<=2480);
  assert.ok(scan.width>scan.height);
});

test('Failed source scan stops entire print export; no omitted pages',async()=>{
  const m=mockEnvironment({fetchFunction:async()=>({ok:false,status:402})});
  const messages=[];
  await assert.rejects(async()=>m.preparePrintScans(record,v=>messages.push(v)),
    /Trang ảnh 1\/3 chưa tải được.*HTTP 402.*Chưa xuất PDF/);
});

test('Existing article PDF remains scholarly, and Word keeps text, references, captions',()=>{
  const m=mockEnvironment();
  const pdf=m.pdfDefinition({...record,kind:'posts'}, {ok:[],fail:[]});
  assert.ok(pdf.content.some(x=>x.text==='NỘI DUNG TƯ LIỆU'));
  assert.ok(pdf.content.some(x=>x.text==='TÀI LIỆU THAM KHẢO'));
  assert.ok(pdf.footer);
  const js=original;
  assert.match(js,/async function docxBlob\(record,images\)/);
  assert.match(js,/if\(record\.sources\)\{heading\('TÀI LIỆU THAM KHẢO'\)/);
  assert.match(js,/attachBlob\(await docxBlob\(record,images\),record,'docx',bar\)/);
});

test('No digitized document scans must fail, not create a text-only PDF',()=>{
  const m=mockEnvironment();
  assert.throws(()=>m.documentScanSources({...record,documentFileUrl:'',cover:'',gallery:[]}),
    /chưa có ảnh chụp tài liệu/);
});

test('Digitized public catalog renders published preview images in all groups with R2 lazy relay',()=>{
  const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../gdd-document-folders.css',import.meta.url),'utf8');
  assert.match(app,/imageFromRecord\(x,originKind\)/);
  assert.match(app,/const imageFromRecord=\(x,kind=''\)=>/);
  assert.match(app,/state\.galleryImages=Array\.isArray\(archive\.gallery\)/);
  assert.match(app,/loading="lazy" decoding="async" fetchpriority="low"/);
  assert.match(css,/#tai-lieu-so-hoa #document-grid \.archive-thumb > img/);
  assert.match(css,/object-fit:contain/);
});

test('D1 export obtains published owner and complete album without Supabase',async()=>{const id='11111111-1111-4111-8111-111111111111',calls=[];const m=mockEnvironment({d1:true,fetchFunction:async url=>{calls.push(String(url));const data=String(url).includes('/albums?')?[{owner_kind:'documents',owner_id:id,image_url:'https://example.org/2.jpg',caption:'Trang 2'}]:{id,published:true,file_url:'https://example.org/1.jpg'};return {ok:true,json:async()=>({data})}}});const r={kind:'documents',slug:'sample',gallery:[]};const gallery=await m.readGallery(r,()=>{});assert.equal(r.documentFileUrl,'https://example.org/1.jpg');assert.equal(gallery[0].url,'https://example.org/2.jpg');assert.equal(calls.length,2);assert.ok(calls.every(u=>u.startsWith('https://gdd-d1-api-staging.')));});
test('D1 print never requests restricted legacy original when no print derivative exists',async()=>{const m=mockEnvironment({d1:true,fetchFunction:async()=>{throw Error('unexpected network')}});await assert.rejects(m.fullResolutionPrintScan(base+'documents/missing.jpg'),/chưa có bản in công khai/);});
