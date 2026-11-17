// Acceptance smoke for the ACTIVE Phase 1/Phase 2 public site (NOT dormant gdd-v2 trial).
// Offline, read-only UI validation: never writes to Supabase or R2.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';

const browser=await chromium.launch({
  headless:true,
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']
});
const base='http://127.0.0.1:8765/';
try{
  for(const [name,width,height] of [['desktop',1280,900],['iphone',390,844]]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
    // Test the active layout in isolation. No external read/write, login or tracking.
    await page.route('**/*',route=>route.request().url().startsWith(base)
      ?route.continue():route.abort());
    try{
      await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
      await page.locator('body.gdd-p1-ready').waitFor({timeout:12000});
      await page.locator('#gdd-p1-main').waitFor({timeout:12000});
      await page.locator('#gdd-p2-search').waitFor({timeout:12000});
      await page.locator('#gdd-p2-q').waitFor({timeout:12000});
      const state=await page.evaluate(()=>{
        const id=name=>document.getElementById(name);
        const main=id('gdd-p1-main');
        const aside=id('gdd-p1-aside');
        const search=id('gdd-p2-search');
        return {
          main:!!main,aside:!!aside,search:!!search,
          support:!!id('gdd-p1-support'),
          stats:!!id('gdd-p1-statistics'),
          memorial:!!main?.querySelector('.gdd-memorial-shell'),
          audio:!!id('gdd-p1-audio-panel'),
          calendar:!!id('gdd-p1-calendar-panel'),
          sixCategories:['people','posts','media','videos','obituaries','documents']
            .every(kind=>!!document.querySelector('[data-kind="'+kind+'"],#'+({
              people:'chuc-sac',posts:'bien-khao',media:'hinh-anh',videos:'video-dao-su',
              obituaries:'ai-tin',documents:'tai-lieu-so-hoa'
            })[kind])),
          switcher:!!id('gdd-p1-switch'),
          overflow:document.documentElement.scrollWidth-innerWidth
        };
      });
      for(const key of ['main','aside','search','support','stats','memorial','audio','calendar','switcher']){
        assert.ok(state[key],name+': active homepage missing '+key);
      }
      assert.ok(state.overflow<=20,name+': horizontal overflow '+state.overflow);

      // Phase 2 search has one shared form with multiple content categories.
      const kinds=await page.locator('#gdd-p2-kind option').count();
      const branches=await page.locator('#gdd-p2-branch option').count();
      assert.ok(kinds>=7,name+': missing unified search categories');
      assert.ok(branches>=5,name+': missing branch filters');
      await page.locator('#gdd-p2-q').fill('ngoc lich nguyet');
      assert.equal(await page.locator('#gdd-p2-q').inputValue(),'ngoc lich nguyet');

      if(width<=600){
        const asideTab=page.locator('#gdd-p1-switch [data-p1-view="aside"]');
        await asideTab.click();
        assert.equal(await asideTab.getAttribute('aria-selected'),'true','mobile view tab must change');
        assert.equal(await page.locator('#gdd-p1-aside').getAttribute('hidden'),null,'mobile sidebar must show');
        await page.locator('#gdd-p1-switch [data-p1-view="main"]').click();
        assert.notEqual(await page.locator('#gdd-p1-aside').getAttribute('hidden'),null,'mobile sidebar must hide');
      }

      // The active layout must hide on a category route and restore at homepage.
      await page.evaluate(()=>{location.hash='#chuc-sac'});
      await page.waitForFunction(()=>document.getElementById('gdd-p1-layout')?.hidden===true);
      await page.evaluate(()=>{location.hash='#trang-chu'});
      await page.waitForFunction(()=>document.getElementById('gdd-p1-layout')?.hidden===false);
      console.log('V20 ACTIVE SITE PASS '+name,JSON.stringify({categories:kinds,branches,layout:state}));
    }catch(error){
      console.error('V20 ACTIVE SITE FAIL '+name+': '+String(error?.message||error));
      await page.screenshot({path:'/tmp/v20-active-'+name+'.png',fullPage:true}).catch(()=>{});
      throw error;
    }finally{await page.close()}
  }
}finally{await browser.close()}
