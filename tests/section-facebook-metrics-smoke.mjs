// Test mobile/desktop mastheads, Facebook placement, and per-article counters.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({
  headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']
});
const base='http://127.0.0.1:8765/';
const pageURL='https://www.facebook.com/share/1Ds5YZxDwq/?mibextid=wwXIfr';
try{
 for(const [label,width,height] of [['iphone',390,844],['desktop',1280,900]]){
   const page=await browser.newPage({viewport:{width,height}});
   try{
     await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
     await page.goto(base,{waitUntil:'domcontentloaded'});
     const state=await page.evaluate(()=>{
       const sections=['chuc-sac','video-dao-su','ai-tin','tai-lieu-so-hoa','hinh-anh'];
       return {missing:sections.filter(id=>!document.querySelector('#'+id+' .gdd-section-tribute')),
         original:!!document.querySelector('#bien-khao .article-feature'),
         about:[...document.querySelectorAll('#gioi-thieu .gdd-facebook-link')].map(a=>a.href),
         footer:[...document.querySelectorAll('.footer .gdd-facebook-link')].map(a=>a.href),
         overflow:document.documentElement.scrollWidth-innerWidth};
     });
     assert.deepEqual(state.missing,[],label+': missing section banner');
     assert.ok(state.original,label+': original biên khảo feature missing');
     assert.equal(state.about.length,2,label+': two pages in Giới thiệu');
     assert.equal(state.footer.length,2,label+': two pages in footer');
     assert.ok(state.about.includes(pageURL)&&state.footer.includes(pageURL),label+': restoration page link');
     assert.ok(state.overflow<=20,label+': overflow '+state.overflow);
     console.log('SECTION FACEBOOK PASS',label);
   }finally{await page.close();}
 }
 for(const [label,width,height] of [['iphone',390,844],['desktop',1280,900]]){
   const page=await browser.newPage({viewport:{width,height}});
   const html='<!doctype html><html><head><meta charset="utf-8"></head><body>'
     +'<div id="detail-overlay" hidden><div id="detail-content"></div></div>'
     +'<script>window.SITE_CONFIG={supabaseUrl:"https://test.supabase.co",supabasePublishableKey:"test_key"}</script>'
     +'<script src="/gdd-content-metrics.js"></script></body></html>';
   const fake='export function createClient(){return {rpc:async(name,p)=>{'
      +'const s=window.__mockStats||(window.__mockStats={seen:new Set(),views:0,downloads:0});'
      +'const k=[p.p_kind,p.p_record_id,p.p_event_type,p.p_event_key].join(":");'
      +'if(!s.seen.has(k)){s.seen.add(k);if(p.p_event_type==="view")s.views++;'
      +'if(p.p_event_type==="download")s.downloads++;}'
      +'return {data:[{view_count:s.views,download_count:s.downloads}],error:null};'
      +'}};}';
   try{
     await page.route('**/*',route=>{
       const url=route.request().url();
       if(url===base)return route.fulfill({contentType:'text/html',body:html});
       if(url===base+'gdd-content-metrics.js')return route.continue();
       if(url.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')){
         return route.fulfill({contentType:'application/javascript',
           headers:{'Access-Control-Allow-Origin':'*'},body:fake});
       }
       return route.abort();
     });
     await page.goto(base,{waitUntil:'domcontentloaded'});
     const id='86c844b7-bb3d-4911-a464-5c3a5ffae18a';
     await page.evaluate(id=>{
       document.getElementById('detail-overlay').hidden=false;
       const detail=document.getElementById('detail-content');
       detail.innerHTML='<h2>Test</h2><a href="/logo.png" download="logo.png" id="test-download">Tải ảnh</a>';
       window.dispatchEvent(new CustomEvent('gdd:content-open',{detail:{kind:'posts',id,published:true,containerId:'detail-content'}}));
     },id);
     await page.waitForFunction(()=>document.querySelector('[data-count-view]')?.textContent==='1');
     assert.equal(await page.locator('[data-count-download]').innerText(),'0');
     await page.evaluate(id=>window.dispatchEvent(new CustomEvent('gdd:content-open',
       {detail:{kind:'posts',id,published:true,containerId:'detail-content'}})),id);
     await page.waitForFunction(()=>document.querySelector('[data-count-view]')?.textContent==='1');
     await page.evaluate(()=>document.getElementById('test-download').dispatchEvent(
       new MouseEvent('click',{bubbles:true,cancelable:true})));
     await page.waitForFunction(()=>document.querySelector('[data-count-download]')?.textContent==='1');
     const values=await page.evaluate(()=>({
       views:window.__mockStats?.views,downloads:window.__mockStats?.downloads,
       panels:document.querySelectorAll('#detail-content .gdd-content-metrics').length
     }));
     assert.deepEqual(values,{views:1,downloads:1,panels:1},label+': incorrect metrics');
     console.log('CONTENT METRICS PASS',label);
   }finally{await page.close();}
 }
}finally{await browser.close();}
