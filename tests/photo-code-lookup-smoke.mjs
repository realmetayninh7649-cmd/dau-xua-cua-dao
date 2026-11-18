// Public photo-code lookup, offline mock, without production writes.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const code='DXCD-HA-00001/001';
const uuid='11111111-2222-4333-8444-555555555555';
const moduleJS=[
 'export function createClient(){',
 ' return {from(table){',
 '   return {select(){return {eq(){return this;},maybeSingle:async()=>({',
 '      data:table==="archive_gallery_images"',
 '      ?{id:"66666666-6666-4666-8666-666666666666",owner_kind:"media",owner_id:"'+uuid+'",',
 '        photo_no:1,photo_code:"'+code+'",image_url:"https://example.org/test.jpg"}',
 '      :table==="media"?{id:"'+uuid+'",slug:"album-test",published:true,title:"Album thử nghiệm"}',
 '      :null,error:null',
 '   })};}};',
 ' }};',
 '}'
].join('\n');
const base='http://127.0.0.1:8765/';
const browser=await chromium.launch({
 headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 args:['--no-sandbox','--disable-dev-shm-usage']
});
try{
 for(const [label,width,height] of [['iphone',390,844],['desktop',1280,900]]){
   const page=await browser.newPage({viewport:{width,height}});
   const html='<!doctype html><html lang="vi"><head><meta charset="utf-8"></head><body>'
    +'<section id="trang-chu"></section>'
    +'<script>window.SITE_CONFIG={supabaseUrl:"https://fake.supabase.co",supabasePublishableKey:"fake-public-key"}</script>'
    +'<script defer src="/gdd-phase2-search.js"></script>'
    +'</body></html>';
   await page.route('**/*',route=>{
     const url=route.request().url();
     if(url===base)return route.fulfill({contentType:'text/html',body:html});
     if(url===base+'gdd-phase2-search.js')return route.continue();
     if(url.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'))
       return route.fulfill({contentType:'application/javascript',headers:{'Access-Control-Allow-Origin':'*'},body:moduleJS});
     return route.abort();
   });
   try{
     await page.goto(base,{waitUntil:'domcontentloaded'});
     await page.locator('#gdd-p2-q').fill(code);
     await page.waitForFunction(()=>document.querySelector('#gdd-p2-result-grid .gdd-p2-result')?.textContent.includes('Ảnh 001'),null,{timeout:8000});
     const link=await page.locator('#gdd-p2-result-grid .gdd-p2-result').getAttribute('href');
     assert.ok(link.includes('?anh=DXCD-HA-00001%2F001#hinh-anh-tu-lieu/album-test'),label+': photo deep link '+link);
     const content=await page.locator('#gdd-p2-result-grid .gdd-p2-result').innerText();
     assert.ok(content.includes(code),label+': lookup must show code');
     console.log('PHOTO CODE LOOKUP PASS',label);
   }catch(e){
     console.error('PHOTO CODE LOOKUP FAIL',label,e.message);
     await page.screenshot({path:'/tmp/gdd-photo-lookup-'+label+'.png',fullPage:true}).catch(()=>{});
     throw e;
   }finally{await page.close();}
 }
}finally{await browser.close();}
