import {chromium} from 'playwright-core';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const snapshot=JSON.parse(readFileSync('public-fallback.json','utf8'));
assert.equal(snapshot.source,'public-published-read-only-backup');
const kinds=['people','posts','media','videos','obituaries','documents','gdd_memorials',
'gdd_audio_programs','gdd_calendar_memorials','gallery','placements'];
for(const kind of kinds)assert.ok(Array.isArray(snapshot[kind]));
const chrome=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [name,width,height] of [['desktop',1280,900],['iphone',390,844]]){
   const page=await browser.newPage({viewport:{width,height}});
   let d1Requests=0,supabaseRequests=0,legacyImages=0;
   await page.route('**/*',async route=>{
     const url=route.request().url();
     if(url.startsWith('http://127.0.0.1:8765/'))return route.continue();
     if(url.startsWith('https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/')){
       const parsed=new URL(url),kind=parsed.pathname.split('/').pop();
       assert.ok(kinds.includes(kind),'unexpected public path');
       const offset=Number(parsed.searchParams.get('offset')||0),limit=Number(parsed.searchParams.get('limit')||100);
       assert.ok(limit<=100&&offset>=0);
       d1Requests++;
       return route.fulfill({status:200,
         headers:{'content-type':'application/json','access-control-allow-origin':'*'},
         body:JSON.stringify({data:snapshot[kind].slice(offset,offset+limit)})});
     }
     if(url.includes('supabase.co')){
       const u=new URL(url),path=u.pathname;
       if(path.startsWith('/rest/v1/')||path.startsWith('/auth/v1/')||path.startsWith('/functions/v1/')){
         supabaseRequests++;
         console.log('D1_PREVIEW_UNEXPECTED_SUPABASE_API',name,path.slice(0,100),route.request().resourceType());
       }else{
         legacyImages++;
       }
     }
     return route.abort();
   });
   await page.goto('http://127.0.0.1:8765/index.html',{waitUntil:'domcontentloaded',timeout:30000});
   await page.waitForFunction(()=>{
     const banner=document.getElementById('mode-banner');
     return banner && !banner.hidden && banner.textContent.includes('Cloudflare D1');
   },{timeout:25000});
   const state=await page.evaluate(()=>({
     banner:document.getElementById('mode-banner').textContent,
     adminHidden:document.getElementById('admin-login-area').hidden,
     editorHidden:document.getElementById('admin-editor-area').hidden,
     peopleCount:document.getElementById('people-grid').childElementCount,
     provider:window.SITE_CONFIG?.publicReadProvider,
     width:document.documentElement.scrollWidth,
     viewport:window.innerWidth
   }));
   assert.equal(state.provider,'d1-staging');
   assert.equal(state.adminHidden,true);
   assert.equal(state.editorHidden,true);
   assert.ok(state.peopleCount>0,'no published people rendered');
   assert.ok(d1Requests>=11,'full public groups missing');
   assert.equal(supabaseRequests,0,'staging must not make Supabase API requests');
   console.log('D1_PUBLIC_UI_SMOKE_PASS',name,JSON.stringify({peopleCount:state.peopleCount,d1Requests,legacyImages,adminHidden:state.adminHidden,pageWidth:state.width,viewport:state.viewport}));
   await page.close();
 }
}finally{await browser.close()}
