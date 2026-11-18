// Smoke: Số hóa five folders + QTV selector; no real Supabase/R2 writes.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync('app.js','utf8');
assert.match(app,/subfolder_code','Thư mục con Số hóa/);
assert.match(app,/refreshDocumentCodePreview/);
assert.match(app,/archive_legacy_code/);
const documents=[
 ['HCĐ','DXCD-SH.HCĐ-00001','DXCD-TL-00006','Sắc luật pháp nhân'],
 ['HTĐ','DXCD-SH.HTĐ-00001','DXCD-TL-00001','Thánh Lịnh Hiền Tài I'],
 ['HTĐ','DXCD-SH.HTĐ-00002','DXCD-TL-00002','Thánh Lịnh Hiền Tài II'],
 ['PT','DXCD-SH.PT-00001','DXCD-TL-00010','Đạo Nghị Định Phước Thiện'],
 ['CQK','DXCD-SH.CQK-00001','DXCD-TL-00008','Khảo Cứu Vụ']
].map(([subfolder_code,archive_code,archive_legacy_code,title],i)=>({
 id:'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),
 slug:'doc-test-'+i,title,subfolder_code,archive_code,archive_legacy_code,
 archive_code_aliases:[archive_legacy_code],published:true,
 created_at:'2026-11-10T00:00:00Z',summary:'Bản thử nghiệm không ghi dữ liệu thật.'
}));
const people=[{id:'00000000-0000-4000-8000-000000000050',slug:'qa-phoi-su',full_name:'PHỐI SƯ THƯỢNG HÓA THANH',rank:'Phối Sư',branch:'Cửu Trùng Đài',archive_code:'CS-CTD.PS-00025',published:true,created_at:'2026-11-10T00:00:00Z'}];
const moduleSource='const documents='+JSON.stringify(documents)+';\nconst people='+JSON.stringify(people)+';\n'+[
 'export function createClient(){',
 ' const user={id:"qa-admin",email:"qa@example.invalid"};',
 ' return {',
 '  auth:{getSession:async()=>({data:{session:null}}),',
 '    signInWithPassword:async()=>({data:{user},error:null}),',
 '    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},',
 '  from(table){',
 '    const rows=table==="documents"?documents:table==="people"?people:[];',
 '    return {select(){return {',
 '      order(){return {limit(){return Promise.resolve({data:rows,error:null});}};},',
 '      eq(){return {maybeSingle(){return Promise.resolve({data:table==="admin_users"?{user_id:user.id}:null,error:null});}};},',
 '      then(resolve,reject){return Promise.resolve({data:table==="gdd_content_placements"?[]:rows,error:null}).then(resolve,reject);}',
 '    };}};',
 '  },',
 '  storage:{from(){return {list:async()=>({data:[],error:null})};}}',
 ' };',
 '}'
].join('\n');
const browser=await chromium.launch({headless:true,
 executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 args:['--no-sandbox','--disable-dev-shm-usage']});
const base='http://127.0.0.1:8765/';
try{
 for(const [label,width,height] of [['iphone',390,844],['desktop',1280,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.text().slice(0,300));});
  page.on('requestfailed',r=>{if(/jsdelivr|esm\.sh|app\.js/.test(r.url()))errors.push('failed '+r.url().slice(0,160));});
  await page.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(base))return route.continue();
    if(url.includes('cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')||url.includes('esm.sh/@supabase/supabase-js@2'))
      return route.fulfill({status:200,contentType:'application/javascript',
        headers:{'Access-Control-Allow-Origin':'*'},body:moduleSource});
    return route.abort();
  });
  try{
    await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
    try{
      await page.waitForFunction(()=>document.querySelector('#document-subfolder-count')?.textContent.includes('Chọn một thư mục'),null,{timeout:8000});
    }catch(err){
      const diag=await page.evaluate(()=>({
        folder:document.querySelector('#document-subfolder-count')?.textContent,
        mode:document.getElementById('mode-banner')?.textContent,
        total:document.querySelector('#count-documents')?.textContent,
        raw:document.querySelector('#document-grid')?.textContent.slice(0,450),
        config:!!window.SITE_CONFIG?.supabaseUrl
      }));
      console.error('DOCUMENT DIAGNOSTICS',label,JSON.stringify(diag),errors.slice(-12));
      throw err;
    }
    assert.equal(await page.locator('#document-subfolder-filters [data-document-subfolder]').count(),6,label+' 5 folders + all');
    assert.equal(await page.locator('#document-grid .archive-card').count(),5,label+' total document dataset');
    assert.equal(await page.locator('#document-grid').isVisible(),false,label+' no long document list beneath folder menu initially');
    assert.equal(await page.locator('#document-folder-active').isVisible(),false,label+' selected folder panel is hidden before choosing');
    // QR appears immediately beneath detail title/meta, not after content; keep both actions and exact code.
    for(const [kind,selector,expected,size] of [
      ['documents','#document-grid [data-open-kind="documents"]','DXCD-SH.HCĐ-00001',160],
      ['people','#people-grid [data-open-kind="people"]','CS-CTD.PS-00025',148]
    ]){
      await page.evaluate(q=>document.querySelector(q).click(),selector);
      await page.waitForFunction(()=>document.querySelector('#detail-content [data-gdd-archive-qr] canvas'),null,{timeout:7000});
      const qr=await page.evaluate(()=>{
        const root=document.querySelector('#detail-content');
        const children=[...root.children];
        const at=s=>children.indexOf(root.querySelector(s));
        const p=root.querySelector('[data-gdd-archive-qr]');
        const g=p.querySelector('[data-gdd-qr-graphic]');
        return {title:at('.detail-title'),meta:at('.detail-meta'),qr:at('[data-gdd-archive-qr]'),
          photo:at('.detail-cover'),body:at('.detail-body'),code:p.dataset.archiveCode,
          href:p.dataset.archiveUrl,hasCode:p.textContent.includes(p.dataset.archiveCode),
          cardWidth:p.getBoundingClientRect().width,detailWidth:root.getBoundingClientRect().width,
          qrWidth:Math.round(g.getBoundingClientRect().width),
          canvasWidth:g.querySelector('canvas')?.width,
          download:!!p.querySelector('[data-gdd-qr-download]'),
          copy:!!p.querySelector('[data-gdd-qr-copy]')};
      });
      assert.equal(qr.code,expected,label+' QR code '+kind);
      assert.ok(qr.title<qr.meta&&qr.meta<qr.qr&&qr.qr<qr.photo&&qr.photo<qr.body,
        label+' QR top layout '+kind+' '+JSON.stringify(qr));
      assert.ok(qr.hasCode&&qr.download&&qr.copy&&qr.href.includes('#'),
        label+' QR content retained '+kind);
      assert.equal(qr.qrWidth,size,label+' QR CSS size '+kind);
      assert.equal(qr.canvasWidth,size,label+' QR pixels '+kind);
      assert.ok(qr.cardWidth<=qr.detailWidth+2,label+' QR card width '+kind);
      await page.evaluate(()=>document.querySelector('#detail-overlay [data-close="detail"]').click());
    }
    console.log('QR COMPACT PASS',label,'Số hóa + Chức sắc: top placement, sizes, preserved controls');
    for(const [group,total] of Object.entries({HCĐ:1,HTĐ:2,CTĐ:0,PT:1,CQK:1})){
      const selector='#document-subfolder-filters [data-document-subfolder="'+group+'"]';
      await page.evaluate(selector=>document.querySelector(selector).click(),selector);
      assert.equal(await page.locator(selector).getAttribute('aria-pressed'),'true',label+' selected '+group);
      assert.equal(await page.locator('#document-grid .archive-card').count(),total,label+' category '+group);
      assert.equal(await page.locator(selector+' [data-document-folder-count]').innerText(),String(total),label+' badge '+group);
      const folderDiagnostics=await page.evaluate(()=>{
        const panel=document.getElementById('document-subfolder-filters'),active=document.getElementById('document-folder-active');
        const choices=panel?.querySelector('.gdd-document-folder-grid');
        const grid=document.getElementById('document-grid');
        return {mode:panel?.dataset.mode,activeHidden:active?.hidden,activeDisplay:active&&getComputedStyle(active).display,
          activeText:active?.textContent.slice(0,180),activeHeight:active?.getBoundingClientRect().height,
          choicesHidden:choices?.hidden,gridHidden:grid?.hidden,gridDisplay:grid&&getComputedStyle(grid).display,
          panelHeight:panel?.getBoundingClientRect().height};
      });
      assert.equal(await page.locator('#document-folder-active').isVisible(),true,label+' compact folder heading '+group+' '+JSON.stringify(folderDiagnostics));
      assert.equal(await page.locator('.gdd-document-folder-grid').isVisible(),false,label+' five large cards collapse '+group);
      assert.equal(await page.locator('#document-grid').isVisible(),true,label+' result visible '+group);
      const metrics=await page.evaluate(()=>{
        const panel=document.querySelector('#document-subfolder-filters').getBoundingClientRect();
        const grid=document.querySelector('#document-grid').getBoundingClientRect();
        const root=document.querySelector('#tai-lieu-so-hoa');
        const firstCard=document.querySelector('#document-grid .archive-card');
        return {
          gap:Math.round(grid.top-panel.bottom),
          panelHeight:Math.round(panel.height),
          documentColumns:firstCard?getComputedStyle(firstCard).gridTemplateColumns:'',
          touch:getComputedStyle(document.querySelector('#document-folder-active .gdd-document-folder-back')).touchAction,
          scrollWidth:document.documentElement.scrollWidth,
          viewport:window.innerWidth,scale:window.visualViewport?.scale||1,
          sectionOverflow:getComputedStyle(root).overflowX,
          scrollX:window.scrollX
        };
      });
      assert.ok(metrics.gap>=0&&metrics.gap<=35,label+' documents must immediately follow selected folder '+group+' '+JSON.stringify(metrics));
      assert.ok(metrics.panelHeight<=235,label+' selected folder remains compact '+group+' '+JSON.stringify(metrics));
      assert.equal(metrics.touch,'manipulation',label+' prevent double-tap zoom on folder controls');
      assert.equal(metrics.scale,1,label+' must not zoom automatically');
      assert.equal(metrics.scrollX,0,label+' must not wobble horizontally');
      assert.ok(metrics.scrollWidth-metrics.viewport<=20,label+' no horizontal overflow');
      await page.evaluate(()=>document.querySelector('[data-document-folder-back]').click());
      assert.equal(await page.locator('.gdd-document-folder-grid').isVisible(),true,label+' back displays folders '+group);
      assert.equal(await page.locator('#document-grid').isVisible(),false,label+' back hides long document list '+group);
    }
    await page.evaluate(()=>document.querySelector('[data-document-subfolder="all"]').click());
    assert.equal(await page.locator('#document-grid .archive-card').count(),5,label+' view all');
    assert.equal(await page.locator('#document-grid').isVisible(),true,label+' view all results visible');
    assert.equal(await page.locator('.gdd-document-folder-grid').isVisible(),false,label+' all results without five cards');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
    assert.ok(overflow<=20,label+' horizontal overflow '+overflow);

    await page.evaluate(()=>document.getElementById('admin-open').click());
    await page.locator('#login-form input[name="email"]').fill('qa@example.invalid');
    await page.locator('#login-form input[name="password"]').fill('fake-local-qa');
    await page.evaluate(()=>document.querySelector('#login-form button[type="submit"]').click());
    await page.waitForFunction(()=>document.getElementById('admin-editor-area')?.hidden===false,null,{timeout:10000});
    await page.evaluate(()=>document.querySelector('.editor-tabs [data-kind="documents"]').click());
    const select=page.locator('#editor-form select[name="subfolder_code"]');
    await select.waitFor({state:'attached'});
    assert.equal(await select.locator('option').count(),6,label+' QTV options');
    assert.equal(await select.getAttribute('required'),'');
    await select.selectOption('PT');
    assert.match(await page.locator('#document-code-preview').innerText(),/DXCD-SH\.PT-xxxxx/);
    console.log('DOCUMENT FOLDERS PASS',label,'public filters and QTV classification');
  }catch(error){
    console.error('DOCUMENT FOLDERS FAIL',label,error.message);
    await page.screenshot({path:'/tmp/gdd-document-folders-'+label+'.png',fullPage:true}).catch(()=>{});
    throw error;
  }finally{await page.close();}
 }
}finally{await browser.close();}
