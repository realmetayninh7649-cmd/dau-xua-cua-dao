import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const raw=fs.readFileSync('gdd-document-export.js','utf8');
const tail=raw.lastIndexOf('})();');
assert.ok(tail>0,'Archive export module not found');
const debugSource=raw.slice(0,tail)+
  'window.__GDD_PDF_PRINT_TEST=imageOnlyDocumentPdf;\n'+raw.slice(tail);

const browser=await chromium.launch({
  headless:true,
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']
});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('about:blank');
  await page.addScriptTag({content:debugSource});
  await page.addScriptTag({path:'node_modules/pdfmake/build/pdfmake.min.js'});
  await page.addScriptTag({path:'node_modules/pdfmake/build/vfs_fonts.js'});
  const scans=[1,2,3].map(n=>{
    const base64=fs.readFileSync('/tmp/gdd-pdf-test/'+n+'.png').toString('base64');
    return {data:'data:image/png;base64,'+base64,width:1500,height:2100};
  });
  const pdf64=await page.evaluate(async ({scans})=>{
    const definition=window.__GDD_PDF_PRINT_TEST({
      kind:'documents',title:'THÔNG TRI SỐ 01/NCPS/TT',content:'Không được đưa chữ này vào PDF',
      summary:'Không đưa lời thuyết minh',sources:'Không đưa nguồn'
    },scans);
    if(definition.content.some(x=>x.text)||definition.header||definition.footer)
      throw Error('Print PDF definition contains forbidden text');
    return new Promise((resolve,reject)=>{
      try{window.pdfMake.createPdf(definition).getBase64(resolve)}
      catch(error){reject(error)}
    });
  },{scans});
  fs.writeFileSync('/tmp/gdd-pdf-test/print-only.pdf',Buffer.from(pdf64,'base64'));
  console.log('REAL PDF GENERATED: '+Buffer.byteLength(pdf64,'base64')+' bytes, from 3 source PNG images');
  await page.close();
}finally{await browser.close()}
