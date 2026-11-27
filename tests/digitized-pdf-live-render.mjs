import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const api='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/';
const raw=fs.readFileSync('gdd-document-export.js','utf8'),tail=raw.lastIndexOf('})();');
const source=raw.slice(0,tail)+'window.__gddExportTest={readGallery,preparePrintScans,imageOnlyDocumentPdf};\n'+raw.slice(tail);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 // Browser runs the actual export functions. Live requests use the actual public URL and
 // check CORS before delivering response bytes; no private access and no test image replacement.
 await page.route('https://dauxuacuadao.info.vn/__export_test',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body></body></html>'}));
 await page.goto('https://dauxuacuadao.info.vn/__export_test');
 await page.evaluate(()=>{window.SITE_CONFIG={publicReadProvider:'d1-staging'}});
 for(const path of ['gdd-private-publishing.js','gdd-legacy-r2-images.js'])await page.addScriptTag({path});
 await page.addScriptTag({content:source});
 await page.addScriptTag({path:'node_modules/pdfmake/build/pdfmake.min.js'});
 await page.addScriptTag({path:'node_modules/pdfmake/build/vfs_fonts.js'});
 async function read(path){const r=await fetch(api+path,{headers:{Origin:'https://dauxuacuadao.info.vn'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('D1 HTTP '+r.status);return (await r.json()).data}
 const targets=['ban-chuong-trinh-thieu-xat-chu-thanh-tong-do-tai-toa-thanh-tay-ninh-nam-at-mui-1955-dxcd-sh-hcd-00020','thong-tri-ve-viec-tan-phong-dau-su-va-bo-nhiem-quyen-chanh-phoi-su-cuu-trung-dai-nam-giap-thin-1964-dxcd-sh-hcd-00017'];
 // Find exact 4-page album from prior screenshot rather than assuming its title.
 for(let offset=0;offset<5000;offset+=100){
  const g=await read('gallery?limit=100&offset='+offset);const hit=g.find(x=>x.owner_id==='595f0582-3abf-412b-967c-2f6b818c7fd7');if(hit){for(let n=0;n<5000;n+=100){const docs=await read('documents?limit=100&offset='+n),doc=docs.find(d=>d.id===hit.owner_id);if(doc){targets[1]=doc.slug;break}if(docs.length<100)break}break}if(g.length<100)break;
 }
 for(let i=0;i<targets.length;i++){
  const owner=await read('documents/'+encodeURIComponent(targets[i]));
  const result=await page.evaluate(async ({owner})=>{
   const r={kind:'documents',slug:owner.slug,cover:owner.cover_url||'',gallery:[],title:owner.title};
   r.gallery=await window.__gddExportTest.readGallery(r,()=>{});
   const scans=await window.__gddExportTest.preparePrintScans(r,()=>{});
   const pdf=window.__gddExportTest.imageOnlyDocumentPdf(r,scans);
   const base64=await new Promise(resolve=>window.pdfMake.createPdf(pdf).getBase64(resolve));
   return {count:scans.length,preview:scans.filter(s=>s.previewCopy).length,base64};
  },{owner});
  assert.equal(result.count,i===0?1:4);
  fs.writeFileSync('/tmp/gdd-pdf-test/live-'+i+'.pdf',Buffer.from(result.base64,'base64'));
  console.log('LIVE PDF GENERATED',targets[i],result.count,'pages',result.preview,'preview copies');
 }
}finally{await browser.close()}
