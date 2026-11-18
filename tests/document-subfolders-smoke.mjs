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
const moduleSource='const documents='+JSON.stringify(documents)+';\n'+[
 'export function createClient(){',
 ' const user={id:"qa-admin",email:"qa@example.invalid"};',
 ' return {',
 '  auth:{getSession:async()=>({data:{session:null}}),',
 '    signInWithPassword:async()=>({data:{user},error:null}),',
 '    onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})},',
 '  from(table){',
 '    const rows=table==="documents"?documents:[];',
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
    await page.waitForFunction(()=>document.querySelector('#document-subfolder-count')?.textContent.includes('5 tài liệu'),null,{timeout:15000});
    assert.equal(await page.locator('#document-subfolder-filters [data-document-subfolder]').count(),6,label+' 5 folders + all');
    assert.equal(await page.locator('#document-grid .archive-card').count(),5,label+' total documents');
    for(const [group,total] of Object.entries({HCĐ:1,HTĐ:2,CTĐ:0,PT:1,CQK:1})){
      const selector='#document-subfolder-filters [data-document-subfolder="'+group+'"]';
      await page.evaluate(selector=>document.querySelector(selector).click(),selector);
      assert.equal(await page.locator(selector).getAttribute('aria-pressed'),'true',label+' selected '+group);
      assert.equal(await page.locator('#document-grid .archive-card').count(),total,label+' category '+group);
      assert.equal(await page.locator(selector+' [data-document-folder-count]').innerText(),String(total),label+' badge '+group);
    }
    await page.evaluate(()=>document.querySelector('[data-document-subfolder="all"]').click());
    assert.equal(await page.locator('#document-grid .archive-card').count(),5,label+' restore all');
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
