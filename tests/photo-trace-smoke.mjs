// Archival trace smoke: no production writes or external image requests.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const parent='DXCD-HA-00001',photoCode=parent+'/001';
const files={
 album:readFileSync('dao-su-albums.js','utf8'),
 more:readFileSync('index.html','utf8'),
 search:readFileSync('gdd-phase2-search.js','utf8'),
 export:readFileSync('gdd-document-export.js','utf8')
};
assert.ok(files.album.includes('photo_code'),'Album must query permanent photo codes');
assert.ok(files.more.includes("photo_code"),'Large albums must query photo codes');
assert.ok(files.search.includes("lookupPhotoCode"),'Unified search must resolve child photo codes');
assert.ok(files.export.includes('dauxuacuadao.info.vn | '),'PDF Word must have source footer');

const browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']});
const base='http://127.0.0.1:8765/';
try{
  for(const [label,width,height] of [['iphone',390,844],['desktop',1280,900]]){
    const page=await browser.newPage({viewport:{width,height},hasTouch:label==='iphone'});
    await page.route('**/*',route=>route.request().url().startsWith(base)
      ?route.continue():route.abort());
    try{
      await page.goto(base,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>!!window.GDDTrace&&!!document.getElementById('gdd-image-viewer'));
      const output=await page.evaluate(async code=>{
        const bytes=await fetch('/logo.png').then(r=>r.blob());
        const im=await createImageBitmap(bytes);
        const traced=await window.GDDTrace.stampedBlob(bytes,code);
        const mapped=await createImageBitmap(traced);
        return {sameWidth:im.width===mapped.width,
          largerHeight:mapped.height>im.height,
          outputType:traced.type,
          codeValid:window.GDDTrace.validCode(code),
          footer:window.GDDTrace.textFor(code),
          originalBytes:bytes.size,tracedBytes:traced.size};
      },photoCode);
      assert.equal(output.sameWidth,true,label+': preserve photo width');
      assert.equal(output.largerHeight,true,label+': new footer outside original pixels');
      assert.equal(output.outputType,'image/jpeg');
      assert.equal(output.codeValid,true);
      assert.equal(output.footer,'dauxuacuadao.info.vn | '+photoCode);

      const clickState=await page.evaluate(code=>{
        const detail=document.getElementById('detail-content');
        detail.dataset.gddKind='media';
        detail.dataset.gddDisplayTarget='media';
        detail.innerHTML='<div class="detail-cover"><img alt="Ảnh tư liệu thử nghiệm" src="/logo.png"></div>';
        const img=detail.querySelector('img');img.dataset.photoCode=code;
        img.click();
        return {viewerHidden:document.getElementById('gdd-image-viewer').hidden};
      },photoCode);
      assert.equal(clickState.viewerHidden,false,label+': photo viewer opens normally');
      await page.waitForFunction(()=>document.getElementById('gdd-image-full')?.src.startsWith('blob:'),null,{timeout:7000});
      assert.equal(await page.locator('#gdd-image-download').isVisible(),false,label+': do not restore removed image download button');
      await page.locator('#gdd-image-close').click();
      await page.locator('#gdd-image-viewer').waitFor({state:'hidden'});
      console.log('PHOTO TRACE PASS',label,'outside-bottom margin, traced viewer, previous controls preserved');
    }catch(e){
      console.error('PHOTO TRACE FAIL',label,e.message);
      await page.screenshot({path:'/tmp/gdd-photo-trace-'+label+'.png',fullPage:true}).catch(()=>{});
      throw e;
    }finally{await page.close()}
  }
}finally{await browser.close()}
