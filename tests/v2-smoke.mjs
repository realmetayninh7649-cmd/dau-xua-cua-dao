import { chromium } from 'playwright-core';

const base='http://127.0.0.1:8765/';
const executable=process.env.CHROME_BIN||'/usr/bin/google-chrome';
const browser=await chromium.launch({headless:true,executablePath:executable,args:['--no-sandbox','--disable-dev-shm-usage']});
let failures=0;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function checkPage(label,width,height){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  try{
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
    await page.locator('body.gdd-v2-ready').waitFor({timeout:30000});
    await page.locator('#gdd-v2-main #gdd-directory:not([hidden])').waitFor();
    if(await page.locator('#gdd-v2-main #chuc-sac').count())throw Error('Trang Chủ đang bung chuyên mục Chức sắc đầy đủ');
    await page.locator('#gdd-v2-audio-panel').waitFor({timeout:15000});
    await page.locator('#gdd-v2-calendar-panel').waitFor({timeout:15000});
    const collapsedHomeHeight=await page.evaluate(()=>document.documentElement.scrollHeight);
    const audioPanel=page.locator('#gdd-v2-audio-panel'),calendarPanel=page.locator('#gdd-v2-calendar-panel');
    if(width<=900){
      if(await audioPanel.getAttribute('open')!==null)throw Error('Cột phụ âm thanh trên mobile chưa được thu gọn');
      await audioPanel.locator(':scope > summary').click();
      await calendarPanel.locator(':scope > summary').click();
    }
    await page.locator('#gdd-v2-aside #am-thanh-dai-dao').waitFor({timeout:15000});
    await page.locator('#gdd-v2-aside #gdd-archive-dashboard').waitFor({timeout:15000});
    await page.locator('#gdd-v2-statistics .gdd-statistics').waitFor({timeout:15000});
    await page.locator('#gdd-v2-search').waitFor();
    await page.locator('#gdd-v2-support details').first().waitFor();
    await page.locator('#gdd-v2-search #gdd-v2-q').fill('ngoc lich nguyet');
    await page.locator('#gdd-v2-result-grid .gdd-v2-result').first().waitFor({timeout:60000});
    const found=await page.locator('#gdd-v2-result-grid').innerText();
    if(!found.toLowerCase().includes('ngọc lịch nguyệt'))throw Error('Tìm không dấu không trả về Ngọc Lịch Nguyệt');
    await page.locator('#gdd-v2-search #gdd-v2-q').fill('');
    await page.locator('#gdd-v2-branch').selectOption('Hiệp Thiên Đài');
    await page.locator('#gdd-v2-result-grid .gdd-v2-result').first().waitFor({timeout:20000});
    const branchResult=await page.locator('#gdd-v2-result-grid').innerText();
    if(!branchResult.toLowerCase().includes('hiệp thiên'))throw Error('Bộ lọc cơ quan sai');
    const layout=await page.evaluate(()=>{
      const e=id=>document.getElementById(id);
      const desired=['chuc-sac','video-dao-su','ai-tin','tai-lieu-so-hoa','bien-khao','hinh-anh'];
      const preview=[...e('gdd-directory').querySelectorAll('[data-preview-section]')].map(x=>x.dataset.previewSection);
      const main=e('gdd-v2-main').getBoundingClientRect(),side=e('gdd-v2-aside').getBoundingClientRect();
      const radio=e('gdd-radio-list');
      const items=[...radio.querySelectorAll('.gdd-radio-item')];
      return {order:preview.join('|')===desired.join('|'),
        previewCount:preview.length,
        overflow:document.documentElement.scrollWidth-innerWidth,
        footer:!!e('gdd-site-build-version'),
        sameRow:Math.abs(main.top-side.top)<70,
        sideToRight:side.x>main.right-4,
        sideBelow:side.top>=main.bottom-4,
        pageHeight:document.documentElement.scrollHeight,
        audioItemOverflow:items.some(x=>x.scrollWidth>x.clientWidth+4),
        directoryVisible:!e('gdd-directory').hidden};
    });
    if(!layout.order)throw Error('Sai thứ tự mục chính');
    if(!layout.directoryVisible||layout.previewCount!==6)throw Error('Chưa đủ sáu mục giới thiệu');
    if(width>900&&(!layout.sameRow||!layout.sideToRight))throw Error('Máy tính chưa hiển thị đúng 2 cột');
    if(width<=900&&!layout.sideBelow)throw Error('Cột phụ đang chèn vào giữa nội dung trên điện thoại');
    if(layout.overflow>3)throw Error('Nội dung tràn ngang: '+layout.overflow);
    if(layout.audioItemOverflow)throw Error('Một thẻ radio bị tràn chữ');
    if(collapsedHomeHeight>10500)throw Error('Trang Chủ vẫn quá dài khi tiện ích gấp gọn: '+collapsedHomeHeight+'px');
    if(!layout.footer)throw Error('Thiếu phần phiên bản GitHub cuối trang');
    // Các nút đổi tháng, ngày lịch và điều khiển âm thanh vẫn hoạt động sau khi chuyển cột.
    if(width<=600){
      const toggle=page.locator('#gdd-cal-toggle');
      if(await toggle.isVisible())await toggle.click();
    }
    const calendarBefore=await page.locator('#gdd-cal-month').innerText();
    await page.locator('#gdd-cal-next').click();
    const calendarAfter=await page.locator('#gdd-cal-month').innerText();
    if(calendarAfter===calendarBefore)throw Error('Nút chuyển tháng tiếp theo không hoạt động');
    await page.locator('#gdd-cal-prev').click();
    if((await page.locator('#gdd-cal-month').innerText())!==calendarBefore)
      throw Error('Nút trở về tháng trước không hoạt động');
    await page.locator('#gdd-cal-days button').first().click();
    if(!(await page.locator('#gdd-cal-selected').innerText()).trim())
      throw Error('Không hiển thị ngày được chọn');
    await page.locator('#gdd-radio-audio').waitFor();
    const repeat=page.locator('#gdd-radio-repeat-one');
    const repeatBefore=await repeat.getAttribute('aria-pressed');
    await repeat.click();
    if((await repeat.getAttribute('aria-pressed'))===repeatBefore)
      throw Error('Nút lặp bài âm thanh không thay đổi trạng thái');
    await repeat.click();
    const playRow=page.locator('#gdd-radio-list [data-gdd-radio-play]').first();
    if(await playRow.count()){
      await playRow.click();
      if((await page.locator('#gdd-radio-title').innerText()).includes('Mời chọn'))
        throw Error('Chọn số âm thanh không cập nhật trình phát');
    }

    const portrait=page.locator('#gdd-v2-main #gdd-directory [data-preview-section="chuc-sac"] [data-open-kind="people"]').first();
    await portrait.waitFor({timeout:20000});
    await page.evaluate(()=>{
      window.__v2PreviewClicks=[];
      for(const type of ['pointerdown','pointerup','click']){
        document.addEventListener(type,event=>{
          const target=event.target;
          const button=target.closest?.('[data-open-kind]');
          window.__v2PreviewClicks.push({type,target:target.tagName,id:target.id||'',
            classes:String(target.className||'').slice(0,70),
            buttonId:button?.dataset.id||'',time:Date.now()});
          if(window.__v2PreviewClicks.length>20)window.__v2PreviewClicks.shift();
        },true);
      }
    });
    await portrait.click();
    // Kiểm tra kết quả click bằng chuột/touch; ghi chẩn đoán trước khi đợi QR.
    await page.waitForTimeout(250);
    try{
      await page.locator('#detail-overlay:not([hidden]) .gdd-archive-qr').waitFor({timeout:12000});
    }catch(error){
      const debug=await page.evaluate(()=>{
        const b=document.querySelector('#gdd-v2-main #gdd-directory [data-preview-section="chuc-sac"] [data-open-kind="people"]');
        const overlay=document.getElementById('detail-overlay');
        return {hash:location.hash,buttonId:b?.dataset.id,buttonKind:b?.dataset.openKind,
          buttonDisabled:b?.disabled,overlayHidden:overlay?.hidden,
          content:document.getElementById('detail-content')?.innerText?.slice(0,250),
          directoryVisible:!document.getElementById('gdd-directory')?.hidden,
          clickTrace:window.__v2PreviewClicks,toast:document.getElementById('toast')?.textContent,
          online:!!window.SITE_CONFIG?.supabaseUrl,documentReady:document.readyState};
      });
      throw Error('Nhấn hồ sơ không mở QR: '+JSON.stringify(debug));
    }
    const qr=await page.evaluate(()=>{
      const c=document.querySelector('#detail-content');
      const card=c.querySelector('.gdd-archive-qr'),img=c.querySelector('.detail-cover');
      return {before:!!card&&!!img&&Boolean(card.compareDocumentPosition(img)&Node.DOCUMENT_POSITION_FOLLOWING),
       hasCanvas:!!card.querySelector('canvas'),code:card.dataset.archiveCode,download:!!card.querySelector('[data-gdd-qr-download]'),
       text:card.innerText};
    });
    if(!qr.before||!qr.download||!qr.code.startsWith('CS-')||!qr.text.includes('KHO TƯ LIỆU ĐẠO SỬ'))throw Error('Thẻ QR không đúng bố cục');
    if(!qr.hasCanvas) {
      const diag=await page.evaluate(()=>{
        const panel=document.querySelector('#detail-content .gdd-archive-qr');
        return {status:panel?.querySelector('[data-gdd-qr-status]')?.textContent,
          lib:typeof window.QRCode,
          canvas:panel?.querySelector('canvas')?.outerHTML?.slice(0,150),
          image:panel?.querySelector('[data-gdd-qr-graphic] img')?.outerHTML?.slice(0,150)};
      });
      throw Error('QR canvas chưa tạo: '+JSON.stringify(diag));
    }

    // Xuất QR đúng PNG; không chạm vào dữ liệu quản trị.
    const download=page.waitForEvent('download',{timeout:10000});
    await page.locator('#detail-content [data-gdd-qr-download]').click();
    const qrFile=await download;
    if(!/^CS-.+\.png$/i.test(qrFile.suggestedFilename()))
      throw Error('Tên file QR PNG chưa đúng: '+qrFile.suggestedFilename());
    await page.locator('[data-close="detail"]').last().click().catch(()=>{});
    // Truy cập một chuyên mục: menu chỉ mở nội dung đầy đủ khi người xem yêu cầu.
    await page.evaluate(()=>{location.hash='#trang-chu';window.GDDApplySectionRoute?.()});
    await page.evaluate(()=>{location.hash='#chuc-sac';window.GDDApplySectionRoute?.()});
    try{await page.locator('main > #chuc-sac:not([hidden])').waitFor({timeout:10000});}
    catch(error){
      const debug=await page.evaluate(()=>{
        const s=document.getElementById('chuc-sac'),cols=document.getElementById('gdd-v2-columns');
        return {hash:location.hash,sectionParent:s?.parentElement?.id,
          sectionHidden:s?.hidden,display:s?getComputedStyle(s).display:null,
          columnsHidden:cols?.hidden,columnsDisplay:cols?getComputedStyle(cols).display:null,
          ready:document.body.classList.contains('gdd-v2-ready')};
      });
      throw Error('Trang chuyên mục chưa hiện: '+JSON.stringify(debug));
    }
    if(await page.locator('#gdd-v2-columns').isVisible())throw Error('Cột Trang Chủ vẫn hiện trong chuyên mục đầy đủ');
    await page.evaluate(()=>{location.hash='#trang-chu'});
    await page.locator('#gdd-v2-main #gdd-directory:not([hidden])').waitFor({timeout:10000});
    const unexpected=errors.filter(x=>!/ResizeObserver loop limit exceeded/.test(x));
    if(unexpected.length)throw Error('Lỗi JavaScript: '+unexpected.slice(0,2).join(' | '));
    console.log('PASS '+label,JSON.stringify({layout,qr:{before:qr.before,code:qr.code,hasCanvas:qr.hasCanvas}}));
  }catch(error){failures++;console.error('FAIL '+label+': '+error.message);await page.screenshot({path:'/tmp/v2-'+label+'.png',fullPage:true}).catch(()=>{});}
  await page.close();
}
await checkPage('desktop',1380,900);
await checkPage('iphone',390,844);
await browser.close();
if(failures)process.exit(1);
