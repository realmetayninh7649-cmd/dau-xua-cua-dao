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
      await page.locator('#gdd-image-viewer').waitFor({state:'attached'});
      const browserErrors=[];
      page.on('pageerror',error=>browserErrors.push(error.message));
      const state=await page.evaluate(()=>{
        // A standalone public gallery: no database activity and no dynamic detail overlay.
        const grid=document.createElement('div');grid.id='gallery-grid';
        grid.style.cssText='position:fixed;top:0;left:0;width:5px;height:5px;z-index:1';
        for(let i=1;i<=3;i++){
          const frame=document.createElement('button');
          frame.type='button';frame.className='gallery-visual';
          const img=document.createElement('img');
          img.src='/logo.png';img.alt='Ảnh tư liệu '+i;
          frame.appendChild(img);grid.appendChild(frame);
        }
        document.body.appendChild(grid);
        grid.querySelectorAll('img')[1].click();
        return {hidden:document.getElementById('gdd-image-viewer')?.hidden,
          images:grid.querySelectorAll('img').length,
          title:document.getElementById('gdd-image-title')?.textContent};
      });
      assert.equal(state.hidden,false,label+': viewer did not open; '+JSON.stringify(state)+' errors='+browserErrors.join(';'));
      await page.locator('#gdd-image-viewer').waitFor({state:'visible'});
      assert.equal(await page.locator('#gdd-image-title').innerText(),'Ảnh tư liệu 2 · 2/3',label+': opening image 2');
      assert.equal(await page.locator('#gdd-image-download').isVisible(),false,label+': no download in Hình ảnh gallery viewer');
      assert.equal(await page.locator('#gdd-image-original').isVisible(),true,label+': gallery original link still available');
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
      // Chức Sắc: giữ nguyên ảnh và trình xem nhưng không hiển thị Tải Ảnh/Mở ảnh gốc.
      await page.evaluate(()=>{
        const people=document.createElement('div');people.id='people-grid';
        const person=document.createElement('div');person.className='person-media';
        const img=document.createElement('img');img.alt='Đầu Sư Thái Bộ Thanh';img.src='/logo.png';
        person.appendChild(img);people.appendChild(person);document.body.appendChild(people);
        img.click();
      });
      await page.locator('#gdd-image-viewer').waitFor({state:'visible'});
      const person=await page.evaluate(()=>({
        imageUrl:document.getElementById('gdd-image-full').src,
        originalHref:document.getElementById('gdd-image-original').getAttribute('href'),
        stampExists:!!document.getElementById('gdd-image-stamp'),
        watermarkLoaded:!!window.GDDPersonPhotoWatermark
      }));
      assert.ok(person.imageUrl.endsWith('/logo.png'),label+': source image preserved');
      assert.equal(person.originalHref,null,label+': no original link in person view');
      assert.equal(await page.locator('#gdd-image-original').isVisible(),false,label+': hide original image link');
      assert.equal(await page.locator('#gdd-image-download').isVisible(),false,label+': hide built-in person download');
      assert.equal(person.stampExists,false,label+': watermark overlay stays disabled');
      assert.equal(person.watermarkLoaded,false,label+': watermark script stays disabled');
      await page.locator('#gdd-image-close').click();
      // Phần hồ sơ Chức Sắc: chỉ có nút xem ảnh toàn màn hình, không có nút tải.
      await page.evaluate(()=>{
        const detail=document.getElementById('detail-content');
        detail.dataset.gddKind='people';
        detail.innerHTML='<div class="detail-cover"><img src="/logo.png" alt="Di ảnh tư liệu"></div>';
      });
      await page.waitForFunction(()=>{
        const bar=document.querySelector('#detail-content .gdd-image-actions');
        return bar?.querySelector('[data-gdd-image-show]');
      });
      assert.equal(await page.locator('#detail-content .gdd-image-actions [data-gdd-image-save]').count(),0,label+': no person cover download button');
      assert.equal(await page.locator('#detail-content .gdd-image-actions [data-gdd-image-show]').count(),1,label+': full screen view kept');
      // Trình xem ở mục Hình ảnh: nút phóng to được giữ, nút tải dưới ảnh chính biến mất.
      await page.evaluate(()=>{
        const detail=document.getElementById('detail-content');
        detail.dataset.gddKind='media';
        detail.dataset.gddDisplayTarget='media';
        detail.innerHTML='<div class="detail-cover"><img src="/logo.png" alt="Bộ ảnh tư liệu"></div>';
      });
      await page.waitForFunction(()=>{
        const d=document.querySelector('#detail-content');
        return d?.querySelector('[data-gdd-image-show]') && !d.querySelector('[data-gdd-image-save]');
      });
      assert.equal(await page.locator('#detail-content [data-gdd-image-save]').count(),0,label+': media cover has no download');
      // Fixture ở trang chủ để ẩn khu chi tiết; kích hoạt click bằng DOM như một hồ sơ đã mở.
      await page.evaluate(()=>document.querySelector('#detail-content [data-gdd-image-show]').click());
      await page.locator('#gdd-image-viewer').waitFor({state:'visible'});
      assert.equal(await page.locator('#gdd-image-download').isVisible(),false,label+': media fullscreen has no download');
      assert.equal(await page.locator('#gdd-image-original').isVisible(),true,label+': existing original viewing not changed');
      await page.locator('#gdd-image-close').click();
      // Bài biên khảo thường vẫn giữ nút tải; không đổi ngoài Hình ảnh.
      await page.evaluate(()=>{
        const detail=document.getElementById('detail-content');
        detail.dataset.gddKind='posts';
        detail.dataset.gddDisplayTarget='posts';
        detail.innerHTML='<div class="detail-cover"><img src="/logo.png" alt="Bài biên khảo thường"></div>';
      });
      await page.waitForFunction(()=>!!document.querySelector('#detail-content [data-gdd-image-save]'));
      assert.equal(await page.locator('#detail-content [data-gdd-image-save]').count(),1,label+': ordinary biên khảo still has download');
      console.log('MEDIA IMAGE DOWNLOAD UI PASS',label,'gallery/cover hidden, regular posts intact');
      console.log('PERSON IMAGE UI PASS',label,'no download/original; gallery controls preserved');
      console.log('IMAGE GALLERY PASS',label,'arrows/swipe/keyboard/zoom/close');
    } catch(error) {
      console.error('IMAGE GALLERY FAIL',label,error.message);
      await page.screenshot({path:'/tmp/gdd-gallery-'+label+'.png',fullPage:true}).catch(()=>{});
      throw error;
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
