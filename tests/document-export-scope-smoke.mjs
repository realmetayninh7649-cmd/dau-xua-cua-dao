// The PDF/Word archive panel must NOT appear in Ai Tín or Tưởng Niệm Chức Sắc.
// Keep the original export feature for other sections. Offline, no Supabase writes.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';

const base='http://127.0.0.1:8765/';
const html='<!doctype html><html lang="vi"><head><meta charset="utf-8"></head><body>'
  +'<section id="detail-content"><h2 class="detail-title">Bài thử nghiệm</h2>'
  +'<div class="detail-body">Nội dung tư liệu thử nghiệm.</div></section>'
  +'<div id="gdd-memorial-dialog-body"><h2>Tưởng niệm thử nghiệm</h2>'
  +'<div id="gdd-memorial-text">Bài tưởng niệm</div></div>'
  +'<script src="/gdd-document-export.js"></script></body></html>';

const browser=await chromium.launch({
  headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']
});
try{
  for(const [label,width,height] of [['iphone',390,844],['desktop',1280,900]]){
    const page=await browser.newPage({viewport:{width,height}});
    await page.route('**/*',route=>{
      const url=route.request().url();
      if(url===base)return route.fulfill({status:200,contentType:'text/html',body:html});
      if(url===base+'gdd-document-export.js')return route.continue();
      return route.abort();
    });
    try{
      await page.goto(base+'#bai-viet/test',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.querySelectorAll('#detail-content .gdd-doc-export').length===1);
      assert.equal(await page.locator('#detail-content [data-gdd-document]').count(),2,
        label+': biên khảo must keep PDF/Word export');

      await page.evaluate(()=>{location.hash='#ai-tin/test'});
      await page.waitForFunction(()=>document.querySelectorAll('#detail-content .gdd-doc-export').length===0);
      assert.equal(await page.locator('.gdd-doc-export').count(),0,
        label+': Ai Tín must not show archive/export block');

      await page.evaluate(()=>{location.hash='#tuong-niem/test'});
      await page.waitForFunction(()=>document.querySelectorAll('.gdd-doc-export').length===0);
      assert.equal(await page.locator('#gdd-memorial-dialog-body .gdd-doc-export').count(),0,
        label+': Tưởng Niệm Chức Sắc must not show archive/export block');

      await page.evaluate(()=>{location.hash='#nhan-vat/test'});
      await page.waitForFunction(()=>document.querySelectorAll('#detail-content .gdd-doc-export').length===1);
      assert.equal(await page.locator('#detail-content [data-gdd-document]').count(),2,
        label+': Chức Sắc article export unaffected');
      console.log('DOCUMENT EXPORT SCOPE PASS',label);
    }catch(e){
      console.error('DOCUMENT EXPORT SCOPE FAIL',label,String(e?.message||e));
      await page.screenshot({path:'/tmp/gdd-document-scope-'+label+'.png',fullPage:true}).catch(()=>{});
      throw e;
    }finally{await page.close();}
  }
}finally{await browser.close();}
