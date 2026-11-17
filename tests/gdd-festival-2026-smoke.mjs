// UI-only checks for the seasonal decoration. No writes to Supabase/R2.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
const browser=await chromium.launch({
  headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']
});
const home='http://127.0.0.1:8765/';
try{
  for(const [label,width,height] of [['iphone',390,844],['tablet',768,1024],['desktop',1280,900]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    await page.addInitScript(()=>{
      const season=Date.parse('2026-11-25T12:00:00+07:00');
      Date.now=()=>season;
    });
    await page.route('**/*',route=>route.request().url().startsWith(home)?route.continue():route.abort());
    try{
      await page.goto(home,{waitUntil:'domcontentloaded',timeout:30000});
      await page.waitForFunction(()=>document.getElementById('gdd-festival-2026')?.hidden===false);
      const metrics=await page.evaluate(()=>{
        const banner=document.querySelector('.gdd-festival-banner').getBoundingClientRect();
        const header=document.querySelector('.site-header').getBoundingClientRect();
        const shell=document.querySelector('#gdd-festival-2026').getBoundingClientRect();
        return {overflow:document.documentElement.scrollWidth-innerWidth,
          left:banner.left,right:banner.right,screen:innerWidth,
          shellTop:shell.top,headerBottom:header.bottom,
          active:document.body.classList.contains('gdd-festival-active'),
          links:[...document.querySelectorAll('.gdd-festival-actions a')].map(x=>x.hash)};
      });
      assert.ok(metrics.active,label+': festival theme not active');
      assert.ok(metrics.overflow<=20,label+': horizontal overflow '+metrics.overflow);
      assert.ok(metrics.left>=0&&metrics.right<=metrics.screen+1,label+': banner exceeds viewport');
      assert.ok(metrics.shellTop>=metrics.headerBottom-2,label+': banner overlays header');
      assert.deepEqual(metrics.links,['#chuc-sac','#bien-khao'],label+': correct existing content targets');
      await page.locator('#gdd-festival-dismiss').click();
      assert.equal(await page.locator('#gdd-festival-2026').isVisible(),false,label+': dismiss');
      assert.equal(await page.locator('#gdd-festival-restore').isVisible(),true,label+': restore control');
      await page.locator('#gdd-festival-restore').click();
      assert.equal(await page.locator('#gdd-festival-2026').isVisible(),true,label+': restore');
      await page.evaluate(()=>{location.hash='#chuc-sac';});
      await page.waitForFunction(()=>document.getElementById('gdd-festival-2026')?.hidden===true);
      await page.evaluate(()=>{location.hash='#trang-chu';});
      await page.waitForFunction(()=>document.getElementById('gdd-festival-2026')?.hidden===false);
      await page.evaluate(()=>{
        Date.now=()=>Date.parse('2026-12-16T00:01:00+07:00');
        window.dispatchEvent(new Event('pageshow'));
      });
      await page.waitForFunction(()=>document.getElementById('gdd-festival-2026')?.hidden===true);
      assert.equal(await page.locator('#gdd-festival-restore').isVisible(),false,label+': no controls after expiry');
      console.log('FESTIVAL 2026 PASS',label,JSON.stringify(metrics));
    }catch(err){
      console.error('FESTIVAL 2026 FAIL',label,err.message);
      await page.screenshot({path:'/tmp/gdd-festival-'+label+'.png',fullPage:true}).catch(()=>{});
      throw err;
    }finally{await page.close()}
  }
}finally{await browser.close()}