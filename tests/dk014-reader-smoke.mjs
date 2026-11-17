import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const CHROME=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const browser=await chromium.launch({headless:true,executablePath:CHROME,args:['--no-sandbox','--disable-dev-shm-usage']});
const BASE='http://127.0.0.1:8765/';
const ID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const API='https://gdd-r2-gateway.realmetayninh7649.workers.dev';
const img=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Pz7sAAAAASUVORK5CYII=','base64');
async function check(label,width,height,type,showDownload){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route(API+'/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/v1/public/'+ID)return route.fulfill({
      status:200,contentType:'application/json',
      headers:{'access-control-allow-origin':'*'},
      body:JSON.stringify({id:ID,name:'TƯ LIỆU ĐẠO SỬ – BẢN XEM',
        kind:type==='image'?'image':'document',
        viewSource:type,pageCount:type==='image'?1:2,allowDownload:showDownload})
    });
    if(path.startsWith('/v1/public/'+ID+'/page/')||path.endsWith('/preview'))
      return route.fulfill({status:200,contentType:'image/png',body:img,
        headers:{'access-control-allow-origin':'*'}});
    return route.fulfill({status:404,body:'Not found',headers:{'access-control-allow-origin':'*'}});
  });
  try{
    await page.goto(BASE+'r2-xem.html?asset='+ID,{waitUntil:'domcontentloaded',timeout:30000});
    await page.locator('#r2-controls:not([hidden])').waitFor({timeout:16000});
    assert.match(await page.locator('#r2-title').innerText(),/TƯ LIỆU ĐẠO SỬ/);
    const scroller=await page.locator('#r2-scroller').boundingBox();
    assert.ok(scroller&&scroller.width<=width+2,label+' horizontal overflow');
    const dlVisible=await page.locator('#r2-download').isVisible();
    assert.equal(dlVisible,showDownload,label+' unexpected download link');
    if(type!=='image'){
      assert.equal((await page.locator('#r2-counter').innerText()).trim(),'1 / 2');
      await page.locator('#r2-next').click();
      assert.equal((await page.locator('#r2-counter').innerText()).trim(),'2 / 2');
      assert.match(await page.locator('#r2-page').getAttribute('src'),/page\/2$/);
      assert.equal(await page.locator('#r2-download').isVisible(),false);
      if(type==='docx_text')assert.match(await page.locator('#r2-desc').innerText(),/không giữ bố cục/);
    }
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('DK014 browser PASS '+label+' '+type);
  }finally{await page.close()}
}
try{
  await check('desktop',1280,900,'pdf',false);
  await check('iphone',390,844,'docx_text',false);
  await check('image-download-optin',390,844,'image',true);
}finally{await browser.close()}
