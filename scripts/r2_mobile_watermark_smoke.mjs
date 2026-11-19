/**
 * Test a genuine private R2 WebP in Chromium at an iPhone-like viewport.
 * This uses only localhost and does not deploy or open the public website.
 */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const executablePath=process.env.CHROME_BIN;
if(!executablePath)throw new Error('No Chrome / Chromium executable available');
const browser=await chromium.launch({executablePath,args:['--no-sandbox'],headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:8765/r2-thu-nghiem.html',{waitUntil:'domcontentloaded'});
  await page.setContent('<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width, initial-scale=1">'+
    '<style>body{margin:0;padding:12px;background:#f7f3e9;font-family:Georgia,serif}'+
    '#detail-content .detail-cover{width:100%;height:520px;display:flex;align-items:center;justify-content:center;overflow:hidden}'+
    '#detail-content .detail-cover img{width:100%;height:100%;object-fit:contain;max-width:100%}</style></head>'+
    '<body><main id="detail-content"><div class="detail-cover"><img id="sample" src="/gdd-qa-temp-sample.webp" '+
    'data-photo-code="DXCD-TL-00001" alt="Văn kiện Đạo sử"></div></main></body></html>');
  await page.addScriptTag({path:'gdd-trace.js'});
  await page.addScriptTag({path:'image-viewer.js'});
  await page.locator('#sample').evaluate(el=>el.decode());
  const initial=await page.evaluate(()=>{
    const img=document.querySelector('#sample');
    return {width:img.naturalWidth,height:img.naturalHeight,rect:img.getBoundingClientRect().toJSON(),scrollWidth:document.documentElement.scrollWidth};
  });
  assert.ok(initial.width>=100&&initial.height>=100);
  assert.ok(initial.rect.width<=390&&initial.scrollWidth<=391,'Image overflowed iPhone screen');
  const trace=await page.evaluate(async()=>{
    const blob=await(await fetch('/gdd-qa-temp-sample.webp')).blob();
    const stamped=await window.GDDTrace.stampedBlob(blob,'DXCD-TL-00001');
    const bitmap=await createImageBitmap(stamped);
    const result={type:stamped.type,size:stamped.size,width:bitmap.width,height:bitmap.height};
    bitmap.close();
    return result;
  });
  assert.equal(trace.type,'image/jpeg');
  assert.ok(trace.width>=100&&trace.height>initial.height,'Stamp footer should extend photo, not crop it');
  assert.ok(trace.size>100);
  await page.locator('#sample').click();
  await page.locator('#gdd-image-viewer').waitFor({state:'visible',timeout:12000});
  const viewer=await page.locator('#gdd-image-full').evaluate(async el=>{
    if(!el.complete||!el.naturalWidth)await el.decode();
    return {src:el.currentSrc||el.src,width:el.naturalWidth,height:el.naturalHeight,rect:el.getBoundingClientRect().toJSON()};
  });
  assert.ok(viewer.src.startsWith('blob:'),'Zoom viewer should use local traced preview blob');
  assert.ok(viewer.rect.width<=390&&viewer.rect.height<=844,'Viewer overflowed mobile viewport');
  assert.ok(viewer.width>=100&&viewer.height>initial.height);
  console.log('MOBILE WATERMARK PASS: 390x844 viewport; real WebP decoded, trace footer generated, fullscreen traced viewer remained within viewport.');
  await page.close();
}finally{await browser.close()}
