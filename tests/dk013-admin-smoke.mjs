import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const chrome=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [name,w,h] of [['desktop',1280,900],['iphone',390,844]]){
  const page=await browser.newPage({viewport:{width:w,height:h}});
  await page.route('**/*',route=>{const url=route.request().url();return url.startsWith('http://127.0.0.1:8765/')?route.continue():route.abort()});
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!!window.GDDR2?.archive && !!window.GDDR2?.link,{timeout:10000});
  const result=await page.evaluate(()=>{
    const editor=document.getElementById('admin-editor-area');
    const vault=document.getElementById('gdd-r2-vault-panel');
    const upload=document.getElementById('gdd-r2-vault-upload');
    const file=document.getElementById('gdd-r2-vault-files');
    const hidden=editor?.hidden&&vault?.hidden;
    document.getElementById('admin-overlay').hidden=false;
    document.body.classList.add('modal-open');
    editor.hidden=false;vault.hidden=false;
    const details=vault.querySelector('details');details.open=true;
    const rect=vault.getBoundingClientRect();
    return {hidden,upload:!!upload,file:!!file,archive:typeof window.GDDR2.archive==='function',link:typeof window.GDDR2.link==='function',width:rect.width,viewport:innerWidth};
  });
  assert.equal(result.hidden,true,name+' must keep admin panel hidden until login');
  assert.ok(result.upload&&result.file&&result.archive&&result.link,name+' integration missing');
  assert.ok(result.width<=result.viewport+2,name+' vault overflows screen');
  console.log('DK013 browser PASS '+name,JSON.stringify(result));
  await page.close();
 }
}finally{await browser.close()}
