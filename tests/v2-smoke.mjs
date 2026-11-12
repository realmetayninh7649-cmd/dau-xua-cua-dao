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
    await page.locator('#gdd-v2-main #chuc-sac').waitFor();
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
      const children=[...e('gdd-v2-main').children].map(x=>x.id);
      const desired=['chuc-sac','video-dao-su','ai-tin','tai-lieu-so-hoa','bien-khao','hinh-anh'];
      const actual=children.filter(x=>desired.includes(x));
      const order=actual.join('|')===desired.join('|');
      return {order,overflow:document.documentElement.scrollWidth-innerWidth,footer:!!e('gdd-site-build-version')};
    });
    if(!layout.order)throw Error('Sai thứ tự mục chính');
    if(layout.overflow>3)throw Error('Nội dung tràn ngang: '+layout.overflow);
    const portrait=page.locator('#gdd-v2-main #chuc-sac [data-open-kind="people"]').first();
    await portrait.waitFor({timeout:20000});
    await portrait.click();
    await page.locator('#detail-overlay:not([hidden]) .gdd-archive-qr').waitFor({timeout:12000});
    const qr=await page.evaluate(()=>{
      const c=document.querySelector('#detail-content');
      const card=c.querySelector('.gdd-archive-qr'),img=c.querySelector('.detail-cover');
      return {before:!!card&&!!img&&Boolean(card.compareDocumentPosition(img)&Node.DOCUMENT_POSITION_FOLLOWING),
       hasCanvas:!!card.querySelector('canvas'),code:card.dataset.archiveCode,download:!!card.querySelector('[data-gdd-qr-download]'),
       text:card.innerText};
    });
    if(!qr.before||!qr.download||!qr.code.startsWith('CS-')||!qr.text.includes('KHO TƯ LIỆU ĐẠO SỬ'))throw Error('Thẻ QR không đúng bố cục');
    if(!qr.hasCanvas)throw Error('QR canvas chưa tạo');
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
