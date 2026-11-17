import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const executable=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});
const ROOT='http://127.0.0.1:8765/';
const legacy='https://gwpdgubxoquhrfbolftq.supabase.co/storage/v1/object/public/dao-su-documents/media/example-37-pages.pdf';
const stub="export const GlobalWorkerOptions={workerSrc:''};export function getDocument(){return {promise:Promise.resolve({numPages:37,getPage:async n=>({getViewport:({scale})=>({width:600*scale,height:840*scale}),render:()=>({promise:Promise.resolve()}),cleanup:()=>{}}),destroy:async()=>{}})}}";
try{
 for(const [label,w,h] of [['desktop',1200,850],['iphone',390,844]]){
  const page=await browser.newPage({viewport:{width:w,height:h}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs',route=>
    route.fulfill({status:200,body:stub,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'}}));
  const target=ROOT+'r2-xem.html?source='+encodeURIComponent(legacy);
  await page.goto(target,{waitUntil:'domcontentloaded'});
  await page.locator('#r2-controls:not([hidden])').waitFor({timeout:12000});
  assert.equal((await page.locator('#r2-counter').innerText()).trim(),'1 / 37');
  assert.match(await page.locator('#r2-desc').innerText(),/vẫn đang công khai trên Supabase/);
  assert.equal(await page.locator('#r2-download').isVisible(),false);
  await page.locator('#r2-next').click();
  await page.waitForFunction(()=>document.getElementById('r2-counter').textContent==='2 / 37');
  assert.equal(await page.locator('#r2-canvas').isVisible(),true);
  await page.locator('#r2-zoom').selectOption('150');
  assert.equal(await page.locator('#r2-canvas').evaluate(el=>el.style.width),'150%');
  assert.equal(errors.length,0,errors.join('\n'));
  console.log('DK015 UNIFIED reader PASS '+label+' legacy PDF 37 pages');
  await page.close();
 }
}finally{await browser.close()}
