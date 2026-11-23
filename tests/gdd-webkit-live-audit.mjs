import assert from 'node:assert/strict';
import {webkit} from 'playwright';
import {createServer} from 'node:http';
import {ADMIN_HTML,ADMIN_CSS,ADMIN_JS} from '../workers/gdd-d1-admin/src/admin-ui.mjs';
const LIVE='https://dauxuacuadao.info.vn';
const CHROME_WIDTHS=[['iphone-webkit',390,844],['laptop-webkit',1280,900]];
const browser=await webkit.launch({headless:true});
const sessions={authenticated:true,write_enabled:false,mode:'staging',role:'administrator',
 working_editor_enabled:true,managed_r2_enabled:true};
const summary={source_total:1892,total_records:1892,remaining_records:0,table_count:21,
 published_records:118,gallery_images:615,r2_asset_records:269,row_counts_match_snapshot:true,
 source_integrity_snapshot:{people:{unpublished:2},r2_asset_metadata:{rows:269,preview_ready:0},
  gallery:{rows:615,without_image_url:0,without_photo_code:0}},
 r2_object_inventory_snapshot:{object_count:2512,total_bytes:3157000000},inventory:[]};
const local=createServer((req,res)=>{
 const p=new URL(req.url,'http://127.0.0.1').pathname;
 let type='application/json',response='{}',status=200;
 if(p==='/admin'){type='text/html';response=ADMIN_HTML}
 else if(p==='/admin/style.css'){type='text/css';response=ADMIN_CSS}
 else if(p==='/admin/app.js'){type='application/javascript';response=ADMIN_JS}
 else if(p==='/api/v1/admin/session')response=JSON.stringify(sessions);
 else if(p==='/api/v1/admin/summary')response=JSON.stringify(summary);
 else if(p==='/api/v1/admin/contributions')response=JSON.stringify({private:true,data:[]});
 else if(p.startsWith('/api/v1/admin/work/'))response=JSON.stringify({data:[]});
 else if(p==='/api/v1/admin/records')response=JSON.stringify({data:[]});
 else {status=404;response='{}'}
 res.writeHead(status,{'content-type':type,'cache-control':'no-store'});res.end(response)
});
await new Promise(resolve=>local.listen(0,'127.0.0.1',resolve));
const BASE='http://127.0.0.1:'+local.address().port;
try{
 for(const [label,width,height] of CHROME_WIDTHS){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(LIVE+'/?webkit_d1_audit=20261124',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>document.querySelector('#people-grid')?.children.length>=5
   &&window.GDDPublicReadOnly&&document.getElementById('mode-banner').hidden,null,{timeout:38000});
  const info=await page.evaluate(async()=>{
   const d=await window.GDDPublicReadOnly.load();
   return {people:d.people.length,posts:d.posts.length,documents:d.documents.length,
    gallery:d.gallery.length,backend:d.backend,width:document.documentElement.scrollWidth,
    viewport:innerWidth}
  });
  assert.equal(info.backend,'d1');assert.equal(info.people,50);
  assert.equal(info.posts,17);assert.equal(info.documents,21);assert.equal(info.gallery,615);
  assert.ok(info.width<=info.viewport+4,'mobile horizontal overflow');
  assert.deepEqual(errors,[],'public page errors');
  console.log('WEBKIT_LIVE_PUBLIC_'+label+'=PASS',JSON.stringify(info));
  let mocked=false;
  await page.route('**/api/v1/contributions',async route=>{
   assert.equal(route.request().method(),'POST');
   const body=route.request().postDataBuffer();
   assert.ok(body.includes(Buffer.from('Người thử nghiệm')));
   assert.ok(body.includes(Buffer.from('Văn kiện khảo cứu')));
   mocked=true;
   await route.fulfill({status:201,contentType:'application/json',
    headers:{'access-control-allow-origin':LIVE},
    body:JSON.stringify({accepted:true,private:true,reference:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'})});
  });
  await page.evaluate(()=>location.hash='#gui-tu-lieu');
  await page.waitForFunction(()=>{const el=document.getElementById('gui-tu-lieu');
   return el&&!el.hidden&&getComputedStyle(el).display!=='none';},null,{timeout:9000});
  await page.locator('#contribute-form [name=sender_name]').fill('Người thử nghiệm');
  await page.locator('#contribute-form [name=sender_email]').fill('test@example.invalid');
  await page.locator('#contribute-form [name=category]').selectOption({label:'Biên khảo'});
  await page.locator('#contribute-form [name=title]').fill('Văn kiện khảo cứu');
  await page.locator('#contribute-form [name=description]').fill('Tư liệu giả lập không gửi thật vào D1.');
  await page.locator('#contribute-form [name=consent]').check();
  await page.locator('#contribute-form button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#submission-status')?.textContent.includes('Đã tiếp nhận tư liệu riêng tư.'),null,{timeout:10000});
  assert.ok(mocked,'public submission endpoint must be called');
  console.log('WEBKIT_CONTRIBUTION_FORM_MOCKED_'+label+'=PASS');
  await page.close();
  const adm=await browser.newPage({viewport:{width,height}});
  const adminErrors=[];adm.on('pageerror',e=>adminErrors.push(e.message));
  await adm.goto(BASE+'/admin',{waitUntil:'domcontentloaded',timeout:25000});
  await adm.waitForFunction(()=>document.getElementById('work-editor-panel')?.hidden===false&&
   document.getElementById('r2-managed-panel')?.hidden===false,null,{timeout:16000});
  assert.equal(await adm.locator('#contribution-panel').count(),1);
  assert.equal(await adm.locator('#r2-managed-docx-pages').count(),1);
  assert.ok(await adm.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+4));
  assert.deepEqual(adminErrors,[]);
  console.log('WEBKIT_ACCESS_ADMIN_'+label+'=PASS');
  await adm.close();
 }
}finally{
 await browser.close();
 await new Promise(resolve=>local.close(resolve));
}
