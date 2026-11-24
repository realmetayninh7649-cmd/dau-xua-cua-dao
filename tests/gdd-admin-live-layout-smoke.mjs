import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {chromium} from 'playwright-core';
import {ADMIN_HTML,ADMIN_CSS,ADMIN_JS} from '../workers/gdd-d1-admin/src/admin-ui.mjs';
import {PHOTO_JS} from '../workers/gdd-d1-admin/src/photo-album-ui.mjs';
const summary={
 source_total:1892,total_records:1892,remaining_records:0,table_count:21,
 published_records:118,gallery_images:615,r2_asset_records:269,row_counts_match_snapshot:true,
 source_integrity_snapshot:{
  people:{unpublished:2},r2_asset_metadata:{rows:269,preview_ready:0},
  gallery:{rows:615,without_image_url:0,without_photo_code:0}
 },
 r2_object_inventory_snapshot:{object_count:2512,total_bytes:3157000000},inventory:[]
};
const session={
 authenticated:true,write_enabled:false,working_editor_enabled:true,
 managed_r2_enabled:true,mode:'staging',role:'administrator'
};
const requests=[];
const album=[];let uploaded=0, previews=0, approvals=0;const postId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const server=createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 requests.push(pathname);
 let body='',type='application/json; charset=utf-8',status=200;
 if(pathname==='/admin') {type='text/html; charset=utf-8';body=ADMIN_HTML}
 else if(pathname==='/admin/style.css'){type='text/css';body=ADMIN_CSS}
 else if(pathname==='/admin/app.js'){type='text/javascript';body=ADMIN_JS}
 else if(pathname==='/admin/photo-album.js'){type='text/javascript';body=PHOTO_JS}
 else if(pathname==='/api/v1/admin/session')body=JSON.stringify(session);
 else if(pathname==='/api/v1/admin/summary')body=JSON.stringify(summary);
 else if(pathname==='/api/v1/admin/work/people'){
  const offset=Number(new URL(req.url,'http://127.0.0.1').searchParams.get('offset')||0);
  const people=Array.from({length:14},(_,i)=>({
    id:'aaaaaaaa-aaaa-4aaa-8aaa-'+String(i+1).padStart(12,'0'),
    title:'HỒ SƠ SỐ '+(i+1),full_name:'HỒ SƠ SỐ '+(i+1),published:1,
    archive_code:'CS-CTD.GS-'+String(i+1).padStart(5,'0'),gdd_version:1
  }));
  body=JSON.stringify({data:people.slice(offset,offset+10),kind:'people'});
 }
 else if(pathname.startsWith('/api/v1/admin/work/people/')){
  const id=pathname.split('/').at(-1);
  const person={id,title:'HỒ SƠ SỐ 2',full_name:'HỒ SƠ SỐ 2',published:1,
    archive_code:'CS-CTD.GS-00002',gdd_version:1};
  body=JSON.stringify({data:id==='history'?[]:person});
 }
 else if(pathname==='/api/v1/admin/work/posts'){
  body=JSON.stringify({data:[{id:postId,title:'BÀI KIỂM TRA ẢNH',published:1,
   gdd_version:1,archive_code:'DXCD-BK-00001'}],kind:'posts'});
 }
 else if(pathname==='/api/v1/admin/work/posts/'+postId+'/photos'){
  if(req.method==='POST'){
   let text='';for await(const chunk of req)text+=chunk;
   const item=JSON.parse(text);
   assert.equal(typeof item.caption,'string');
   assert.match(item.asset_id,/^[a-f0-9-]{36}$/i);
   const image={image_url:'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/'+item.asset_id+'/preview',
    caption:item.caption,sort_order:album.length+1};
   album.push(image);status=201;body=JSON.stringify({data:image,attached:true});
  }else body=JSON.stringify({data:album});
 }
 else if(pathname==='/api/v1/admin/work/posts/'+postId){
  body=JSON.stringify({data:{id:postId,title:'BÀI KIỂM TRA ẢNH',published:1,
   archive_code:'DXCD-BK-00001',gdd_version:1,body:'Bài viết có nhiều ảnh'}});
 }
 else if(pathname==='/api/v1/admin/work/posts/'+postId+'/history')body=JSON.stringify({data:[]});
 else if(pathname.startsWith('/api/v1/admin/r2/managed/')){
  if(pathname.endsWith('/v1/uploads/small')){
   uploaded++;const id='cccccccc-cccc-4ccc-8ccc-'+String(uploaded).padStart(12,'0');
   status=201;body=JSON.stringify({id,originalPreserved:true,publiclyAccessible:false});
  }else if(pathname.endsWith('/preview')){
   previews++;status=201;body=JSON.stringify({id:'fake',originalUnchanged:true});
  }else if(pathname.endsWith('/publication')){
   approvals++;status=200;body=JSON.stringify({published:true,originalPrivate:true});
  }else{status=404;body=JSON.stringify({error:'not_found'})}
 }
 else if(pathname.startsWith('/api/v1/admin/work/'))body=JSON.stringify({data:[],kind:'posts'});
 else if(pathname==='/api/v1/admin/records')body=JSON.stringify({data:[],has_next:false});
 else {status=404;body=JSON.stringify({error:'not_found'})}
 res.writeHead(status,{'content-type':type,'cache-control':'no-store'});res.end(body);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
 args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [label,width,height] of [['iphone',390,844],['desktop',1280,900]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+port+'/admin',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{
    const editor=document.getElementById('work-editor-panel');
    const managed=document.getElementById('r2-managed-panel');
    return editor&&!editor.hidden&&managed&&!managed.hidden;
  },null,{timeout:12000});
  const info=await page.evaluate(()=>({
    text:document.body.textContent,
    editorVisible:!document.getElementById('work-editor-panel').hidden,
    r2Visible:!document.getElementById('r2-managed-panel').hidden,
    technical:document.querySelector('details.admin-technical')?.open,
    docWidth:document.documentElement.scrollWidth,viewport:innerWidth,
    firstPanel:document.querySelector('main.wrap>section[id]')?.id,
    testR2Present:!!document.getElementById('r2-sandbox-upload'),
    testEditorPresent:!!document.getElementById('sandbox-save'),
    workStatus:document.getElementById('work-status')?.textContent
  }));
  assert.equal(info.editorVisible,true);
  assert.equal(info.r2Visible,true);
  assert.equal(info.technical,false);
  assert.equal(info.firstPanel,'work-editor-panel');
  assert.equal(info.testR2Present,false);
  assert.equal(info.testEditorPresent,false);
  assert.ok(info.text.includes('Website công khai đã hoạt động.'));
  assert.ok(!info.text.includes('Website chính vẫn đang bảo trì.'));
  assert.ok(!info.text.includes('Chế độ thử nghiệm chỉ đọc'));
  assert.ok(info.docWidth<=info.viewport+4,JSON.stringify({width:info.docWidth,viewport:info.viewport}));
  assert.equal(errors.length,0,errors.join('; '));
  console.log('ADMIN_D1_REOPENED_UI_'+label.toUpperCase()+'=PASS',
    JSON.stringify({width,editorVisible:info.editorVisible,R2Visible:info.r2Visible,
      technicalCollapsed:info.technical,firstPanel:info.firstPanel,oldSandboxRemoved:!info.testR2Present&&!info.testEditorPresent}));
  // Authoring always comes BEFORE the initially collapsed (potentially long) list.
  await page.waitForFunction(()=>document.querySelector('#work-list-count')?.textContent.includes('10 bản ghi'),null,{timeout:12000});
  assert.equal(await page.locator('#work-list-details').evaluate(el=>el.open),false);
  assert.equal(await page.locator('.work-archive-lookup').evaluate(el=>el.open),false);
  const order=await page.evaluate(()=>{
    const editor=document.getElementById('work-edit-area');
    const list=document.getElementById('work-list-details');
    return Boolean(editor.compareDocumentPosition(list)&Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert.equal(order,true,'editor must appear before the archival list');
  await page.locator('#work-list-details summary').click();
  assert.equal(await page.locator('#work-list .work-row-title').count(),10);
  await page.locator('#work-search').fill('HỒ SƠ SỐ 2');
  assert.equal(await page.locator('#work-list .work-row-title').count(),1,'title filter should reduce visible list');
  await page.locator('#work-list button').click();
  await page.waitForFunction(()=>!document.getElementById('work-edit-area').hidden);
  assert.equal(await page.locator('#work-list-details').evaluate(el=>el.open),false,'edit closes old list');
  assert.equal(await page.locator('#work-edit-heading').textContent(),'Đang sửa HỒ SƠ SỐ 2');
  await page.locator('#work-new').click();
  await page.waitForFunction(()=>document.getElementById('work-edit-heading').textContent.includes('Tạo bản nháp'));
  assert.equal(await page.locator('#work-list-details').evaluate(el=>el.open),false,'new draft should not reopen old list');
  assert.equal(await page.locator('#work-fields label').count()>0,true,'draft form must be populated');
  const picker=page.locator('#work-branch-rank-picker');
  assert.equal(await picker.count(),1);
  assert.equal(await page.locator('#work-field-secular_name,#work-field-years,#work-field-birthplace').count(),0);
  assert.equal(await page.locator('#work-field-branch').isVisible(),false);
  assert.equal(await page.locator('#work-field-rank').isVisible(),false);
  await picker.selectOption({label:'Hiệp Thiên Đài – Hộ Pháp'});
  assert.equal(await page.locator('#work-field-branch').inputValue(),'Hiệp Thiên Đài');
  assert.equal(await page.locator('#work-field-rank').inputValue(),'Hộ Pháp');
  assert.equal(await page.locator('#work-field-subgroup option[value="Bộ Pháp Chánh"]').count(),1);
  await picker.selectOption({label:'Cửu Trùng Đài – Giáo Tông'});
  assert.equal(await page.locator('#work-field-subgroup option[value="Bộ Pháp Chánh"]').count(),0);
  await picker.selectOption('custom');
  assert.equal(await page.locator('#work-field-branch').isVisible(),true);
  assert.equal(await page.locator('#work-field-rank').isVisible(),true);
  await picker.selectOption({label:'Hiệp Thiên Đài – Hộ Pháp'});
  const dateInput=page.locator('#work-death-date');
  await dateInput.fill('AL: 1/1/2024');
  assert.equal(await page.locator('#work-field-death_solar_date').inputValue(),'2024-02-10');
  await dateInput.fill('DL: 10/02/2024');
  assert.equal(await page.locator('#work-field-death_lunar_day').inputValue(),'1');
  assert.equal(await page.locator('#work-field-death_lunar_month').inputValue(),'1');
  await dateInput.fill('DL: 31/02/2024');
  assert.ok((await page.locator('.work-date-help').textContent()).includes('Chưa đổi được'));
  await dateInput.fill('');
  assert.equal(await page.locator('#work-field-death_solar_date').inputValue(),'');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+4));
  console.log('ADMIN_COMPACT_CLASSIFICATION_AND_DATE_'+label.toUpperCase()+'=PASS');
  console.log('ADMIN_COMPACT_COMPOSE_FIRST_'+label.toUpperCase()+'=PASS',
    JSON.stringify({editorBeforeList:order,tenRowsPerPage:10,searchFilters:true,editAutoOpensForm:true,draftOnTop:true}));
  await page.locator('#work-kind').selectOption('posts');
  await page.waitForTimeout(120);
  await page.locator('#work-list-details summary').click();
  await page.locator('#work-list button').first().click();
  await page.waitForFunction(()=>!document.getElementById('work-photo-panel').hidden);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6e5F8AAAAASUVORK5CYII=','base64');
  await page.locator('#work-photo-files').setInputFiles([
   {name:'anh-mot.png',mimeType:'image/png',buffer:png},
   {name:'anh-hai.png',mimeType:'image/png',buffer:png}
  ]);
  assert.equal(await page.locator('#work-photo-queue li').count(),2);
  await page.locator('#work-photo-queue input').first().fill('Hình ảnh 01 – tư liệu');
  await page.locator('#work-photo-confirm').check();
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#work-photo-upload').click();
  await page.waitForFunction(()=>document.getElementById('work-photo-count')?.textContent.includes('2 ảnh'),null,{timeout:17000});
  assert.equal(await page.locator('#work-photo-album figure').count(),2);
  assert.equal(await page.locator('#work-photo-album figcaption').first().textContent(),'Hình ảnh 01 – tư liệu');
  assert.equal(errors.length,0,errors.join('; '));
  console.log('ADMIN_MULTIPHOTO_IPHONE_DESKTOP_'+label.toUpperCase()+'=PASS',
   JSON.stringify({selected:2,albumVisible:2,storageOriginalsPrivate:true,attachments:album.length}));
  if(label==='iphone'){assert.equal(uploaded,2);assert.equal(previews,2);assert.equal(approvals,2)}
  album.length=0;
  await page.close();
 }
 assert.equal(requests.some(x=>x.includes('/sandbox')),false,'synthetic sandbox API must not auto-fetch');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
