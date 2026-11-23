import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';

const BASE='https://dauxuacuadao.info.vn';
const browser=await chromium.launch({headless:true,
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 args:['--no-sandbox','--disable-dev-shm-usage']});
const expected={people:50,posts:17,documents:21,media:13,videos:8,
 obituaries:2,gdd_memorials:5,gdd_audio_programs:2,
 gdd_calendar_memorials:0,gallery:615,placements:8};
const errors=[];
try{
 await fs.mkdir('/tmp/gdd-production-site-smoke',{recursive:true});
 for(const [name,width,height] of [['desktop',1280,900],['iphone',390,844]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push({view:name,message:String(e.message).slice(0,120)}));
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>{
    const banner=document.getElementById('mode-banner');
    return banner&&banner.hidden&&window.GDDPublicReadOnly
      &&(document.getElementById('people-grid')?.children.length||0)>0;
  },{timeout:35000});
  const result=await page.evaluate(async()=>{
    const archive=await window.GDDPublicReadOnly.load();
    return {
      backend:archive.backend,
      counts:Object.fromEntries(['people','posts','documents','media','videos','obituaries',
        'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials','gallery','placements']
         .map(k=>[k,archive[k]?.length??-1])),
      loginHidden:document.getElementById('admin-login-area')?.hidden,
      editorHidden:document.getElementById('admin-editor-area')?.hidden,
      publishedOnly:archive.people.every(p=>p.published===true),
      cards:document.getElementById('people-grid')?.children.length,
      docWidth:document.documentElement.scrollWidth,
      viewport:innerWidth
    };
  });
  assert.equal(result.backend,'d1','live backend is not D1');
  for(const [kind,n] of Object.entries(expected))
   assert.equal(result.counts[kind],n,'live public count mismatch in '+kind);
  assert.equal(result.loginHidden,true);
  assert.equal(result.editorHidden,true);
  assert.ok(result.publishedOnly);
  assert.ok(result.cards>0,'public cards missing');
  assert.ok(result.docWidth<=result.viewport+3,'page overflows viewport');
  await page.waitForFunction(()=>['gdd-online-count','gdd-total-visits','gdd-total-downloads']
    .every(id=>{const el=document.getElementById(id);
      return el&&/^[0-9.]+$/.test(el.textContent.trim())}),null,{timeout:28000});
  const live=await page.evaluate(async()=>{
    const imgs=[...document.querySelectorAll('#gdd-directory .gdd-preview-thumb img')];
    imgs.forEach(img=>{img.loading='eager'});
    const loaded=await Promise.all(imgs.map(img=>Promise.race([
      img.decode().then(()=>img.naturalWidth>0).catch(()=>false),
      new Promise(resolve=>setTimeout(()=>resolve(false),10000))
    ])));
    const counters=Object.fromEntries(['gdd-online-count','gdd-total-visits','gdd-total-downloads']
      .map(id=>[id,document.getElementById(id)?.textContent.trim()]));
    return {images:imgs.length,loaded:loaded.filter(Boolean).length,
      broken:loaded.filter(x=>!x).length,counters};
  });
  assert.ok(live.images>=10,'Insufficient public preview images');
  assert.ok(live.loaded>=10,'Most public R2 images must render');
  console.log('PRODUCTION_R2_COVERS_D1_STATS_'+name.toUpperCase()+'=PASS '+JSON.stringify(live));
  await page.screenshot({path:'/tmp/gdd-production-site-smoke/'+name+'.png',fullPage:false});
  console.log('PRODUCTION_D1_WEBSITE_UI_'+name.toUpperCase()+'=PASS',JSON.stringify(result));
  await page.route('https://gdd-d1-admin-staging.realmetayninh7649.workers.dev/**',
    route=>route.fulfill({status:200,contentType:'text/html',body:'<h1>Access admin portal</h1>'}));
  await page.locator('#admin-open').click();
  await page.waitForURL(url=>url.hostname==='gdd-d1-admin-staging.realmetayninh7649.workers.dev',{timeout:12000});
  console.log('PRODUCTION_D1_ADMIN_REDIRECT_'+name.toUpperCase()+'=PASS');
  await page.close();
 }
 const page=await browser.newPage();
 for(const path of ['/r2-xem.html','/bien-khao/index.html',
   '/ho-so/duc-quyen-giao-tong-le-van-trung-0zks4j.html']){
   const response=await page.goto(BASE+path,{waitUntil:'domcontentloaded',timeout:40000});
   assert.equal(response?.status(),200,'Staging direct deep link failure '+path);
   console.log('LIVE_SITE_DEEP_LINK=PASS '+path);
 }
 await page.close();
 console.log('LIVE_PAGE_SCRIPT_ERRORS='+errors.length);
 assert.equal(errors.length,0,'Public website has unhandled script errors');
 for(const issue of errors.slice(0,12))console.log('LIVE_PUBLIC_PAGEERROR_DETAIL='+JSON.stringify(issue));
 console.log('MAIN_PRODUCTION_REOPENED_D1_PUBLIC=TRUE');
}finally{await browser.close()}
