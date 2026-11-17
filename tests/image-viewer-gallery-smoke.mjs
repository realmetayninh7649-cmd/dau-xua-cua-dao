// Read-only browser acceptance test for sequential image viewing.
// It uses three local thumbnails (no Supabase/R2 credentials or remote image downloads).
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const browser=await chromium.launch({
  headless:true,
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']
});
const base='http://127.0.0.1:8765/';
try {
  for (const [label,width,height] of [['desktop',1280,800],['iphone',390,844]]) {
    const page=await browser.newPage({viewport:{width,height},hasTouch:label==='iphone'});
    await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
    try {
      await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
      await page.locator('#gdd-image-viewer').waitFor();
      await page.evaluate(()=>{
        const detail=document.querySelector('#detail-content');
        detail.dataset.gddKind='media';
        const grid=document.createElement('div');grid.className='gdd-album-grid';
        for(let i=1;i<=3;i++){
          const button=document.createElement('button');
          button.type='button';button.className='gdd-album-tile detail-cover';
          const img=document.createElement('img');
          img.src='/logo.png';img.alt='Ảnh tư liệu '+i;
          button.appendChild(img);grid.appendChild(button);
        }
        detail.appendChild(grid);
        grid.querySelectorAll('img')[1].click();
      });
      await page.locator('#gdd-image-viewer').waitFor({state:'visible'});
      assert.equal(await page.locator('#gdd-image-title').innerText(),'Ảnh tư liệu 2 · 2/3',label+': opening image 2');
      assert.equal(await page.locator('#gdd-image-prev').isVisible(),true);
      assert.equal(await page.locator('#gdd-image-next').isVisible(),true);
      await page.locator('#gdd-image-next').click();
      assert.equal(await page.locator('#gdd-image-title').innerText(),'Ảnh tư liệu 3 · 3/3',label+': next');
      assert.equal(await page.locator('#gdd-image-next').isDisabled(),true,label+': last image boundary');
      await page.locator('#gdd-image-prev').click();
      assert.equal(await page.locator('#gdd-image-title').innerText(),'Ảnh tư liệu 2 · 2/3',label+': previous');

      // Arrow keys work on desktop and mobile external keyboards.
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.locator('#gdd-image-title').innerText(),'Ảnh tư liệu 1 · 1/3');
      assert.equal(await page.locator('#gdd-image-prev').isDisabled(),true);

      const swipe=await page.evaluate(()=>{
        const stage=document.getElementById('gdd-image-stage');
        function run(fromX,toX){
          for(const [event,x] of [['pointerdown',fromX],['pointermove',toX],['pointerup',toX]])
            stage.dispatchEvent(new PointerEvent(event,{
              bubbles:true,cancelable:true,pointerId:63,pointerType:'touch',
              clientX:x,clientY:350,isPrimary:true
            }));
        }
        run(310,100); // swipe left: next image
        return document.getElementById('gdd-image-title').textContent;
      });
      assert.equal(swipe,'Ảnh tư liệu 2 · 2/3',label+': swipe left');
      await page.locator('#gdd-image-plus').click();
      const zoomed=await page.locator('#gdd-image-scale').innerText();
      assert.notEqual(zoomed,'100%',label+': zoom preserved');
      const afterZoomSwipe=await page.evaluate(()=>{
        const stage=document.getElementById('gdd-image-stage');
        for(const [event,x] of [['pointerdown',310],['pointermove',100],['pointerup',100]])
          stage.dispatchEvent(new PointerEvent(event,{
            bubbles:true,cancelable:true,pointerId:64,pointerType:'touch',
            clientX:x,clientY:350,isPrimary:true
          }));
        return document.getElementById('gdd-image-title').textContent;
      });
      assert.equal(afterZoomSwipe,'Ảnh tư liệu 2 · 2/3',label+': dragging zoomed image must not change photo');
      await page.locator('#gdd-image-reset').click();
      assert.equal(await page.locator('#gdd-image-scale').innerText(),'100%');
      await page.keyboard.press('Escape');
      await page.locator('#gdd-image-viewer').waitFor({state:'hidden'});
      console.log('IMAGE GALLERY PASS',label,'arrows/swipe/keyboard/zoom/close');
    } catch(error) {
      console.error('IMAGE GALLERY FAIL',label,error.message);
      await page.screenshot({path:'/tmp/gdd-gallery-'+label+'.png',fullPage:true}).catch(()=>{});
      throw error;
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
