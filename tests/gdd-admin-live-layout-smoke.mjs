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
const album=[];let uploaded=0, previews=0, approvals=0,postRecord=null,creates=0,publishWrites=0,failAttach=false;const postId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
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
  if(req.method==='POST'){
   let raw='';for await(const chunk of req)raw+=chunk;const payload=JSON.parse(raw);
   assert.equal(payload.fields.published,false);creates++;
   postRecord={...payload.fields,id:postId,published:0,gdd_version:1,archive_code:null};status=201;body=JSON.stringify({data:postRecord});
  }else body=JSON.stringify({data:postRecord?[postRecord]:[],kind:'posts'});
 }
 else if(pathname==='/api/v1/admin/work/posts/'+postId+'/photos'){
  if(req.method==='POST'){
   let text='';for await(const chunk of req)text+=chunk;
   const item=JSON.parse(text);
   assert.equal(typeof item.caption,'string');
   assert.match(item.asset_id,/^[a-f0-9-]{36}$/i);
   if(failAttach){failAttach=false;res.writeHead(503,{'content-type':type});res.end(JSON.stringify({error:'simulated_attach_failure'}));return}
   const image={image_url:'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/'+item.asset_id+'/preview',
    caption:item.caption,sort_order:album.length+1};
   album.push(image);status=201;body=JSON.stringify({data:image,attached:true});
  }else body=JSON.stringify({data:album});
 }
 else if(pathname==='/api/v1/admin/work/posts/'+postId){
  if(req.method==='PATCH'){
   let raw='';for await(const chunk of req)raw+=chunk;const payload=JSON.parse(raw);
   assert.equal(payload.version,postRecord.gdd_version);
   if(payload.fields.published===true){assert.equal(album.length,2);assert.ok(postRecord.archive_code);assert.ok((payload.fields.cover_url??postRecord.cover_url)?.includes('/preview'));publishWrites++}
   postRecord={...postRecord,...payload.fields,gdd_version:postRecord.gdd_version+1};
  }
  body=JSON.stringify({data:postRecord});
 }
 else if(pathname==='/api/v1/admin/work/posts/'+postId+'/code-preview'){
  body=JSON.stringify({candidate:'DXCD-BK-00001',version:postRecord.gdd_version,requires_confirmation:true,needs_special_review:false});
 }
 else if(pathname==='/api/v1/admin/work/posts/'+postId+'/assign-code'){
  let raw='';for await(const chunk of req)raw+=chunk;const p=JSON.parse(raw);
  assert.equal(p.confirmed,true);assert.equal(p.version,postRecord.gdd_version);
  postRecord.archive_code=p.code;postRecord.gdd_version++;
  body=JSON.stringify({assigned:true,code:p.code,version:postRecord.gdd_version});
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
  assert.equal(await page.locator('#r2-managed-panel').evaluate(el=>el.open),false);
  assert.equal(await page.locator('#contribution-panel').evaluate(el=>el.open),false);
  assert.equal(await page.locator('#r2-managed-file').isVisible(),false);
  assert.equal(await page.locator('#contribution-refresh').isVisible(),false);
  assert.equal(requests.slice(requests.lastIndexOf('/admin')).includes('/api/v1/admin/contributions'),false);
  assert.equal(requests.slice(requests.lastIndexOf('/admin')).includes('/api/v1/admin/summary'),false);
  await page.locator('#r2-managed-panel > summary').click();
  assert.equal(await page.locator('#r2-managed-file').isVisible(),true);
  await page.locator('#r2-managed-panel > summary').click();
  await page.locator('#contribution-panel > summary').click();
  await page.waitForFunction(()=>!document.getElementById('contribution-status').textContent.startsWith('Đang tải')&&document.getElementById('contribution-status').textContent!=='Chưa tải hộp thư.');
  assert.equal(await page.locator('#contribution-refresh').isVisible(),true);
  await page.locator('#contribution-panel > summary').click();
  console.log('ADMIN_COLLAPSED_UTILITIES_'+label.toUpperCase()+'=PASS');
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
  await page.locator('#work-list').getByRole('button',{name:'Sửa',exact:true}).click();
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
  await page.locator('#work-new').click();
  await page.locator('#work-field-title').fill('BÀI KIỂM TRA ẢNH');
  await page.waitForFunction(()=>!document.getElementById('work-photo-panel').hidden);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6e5F8AAAAASUVORK5CYII=','base64');
  assert.equal(await page.locator('#work-cover-file-cover_url').count(),1);
  assert.equal(await page.locator('#work-field-cover_url').isVisible(),false);
  assert.equal(await page.locator('#work-field-person_id').isVisible(),false);
  await page.locator('.cover-url-details > summary').click();
  assert.equal(await page.locator('#work-field-cover_url').isVisible(),true);
  await page.locator('.cover-url-details > summary').click();
  await page.locator('.work-extra > summary').click();
  assert.equal(await page.locator('#work-field-person_id').isVisible(),true);
  await page.locator('.work-extra > summary').click();
  page.on('dialog',dialog=>dialog.accept());
  await page.locator('#work-cover-file-cover_url').setInputFiles({name:'cover.png',mimeType:'image/png',buffer:png});
  assert.equal(await page.locator('#work-field-cover_url').inputValue(),'');
  // A real page reload must keep the selected cover and unsaved content, without posting/uploading.
  const beforeRecovery=uploaded;
  assert.equal(await page.evaluate(()=>workKeepCoverFiles()),true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#work-status')?.textContent.includes('Đã khôi phục nội dung đang soạn'),null,{timeout:12000});
  assert.equal(await page.locator('#work-field-title').inputValue(),'BÀI KIỂM TRA ẢNH');
  assert.equal(await page.evaluate(()=>workCoverQueue.get('cover_url')?.file?.name),'cover.png');
  assert.equal(uploaded,beforeRecovery);
  await page.locator('#admin-app-refresh').click();
  assert.match(await page.locator('#admin-app-refresh-status').textContent(),/Còn ảnh hoặc tệp chưa lưu/);
  assert.equal(await page.locator('#work-field-title').inputValue(),'BÀI KIỂM TRA ẢNH');
  console.log('COVER_RECOVERY_AFTER_RELOAD_'+label.toUpperCase()+'=PASS');
  await page.getByRole('button',{name:'Xem ảnh đã chọn',exact:true}).first().click();
  await page.locator('.work-cover-upload img').waitFor({state:'visible',timeout:10000});
  assert.equal(await page.locator('#work-photo-files').isEnabled(),true);
  await page.locator('#work-photo-files').setInputFiles(Array.from({length:55},(_,i)=>({name:'test-'+i+'.png',mimeType:'image/png',buffer:png})));
  await page.waitForFunction(()=>document.querySelectorAll('#work-photo-queue li').length===55,null,{timeout:10000});
  assert.equal(await page.locator('#work-photo-queue li').count(),55);
  await page.locator('#work-photo-files').setInputFiles({name:'additional.png',mimeType:'image/png',buffer:png});
  assert.equal(await page.locator('#work-photo-queue li').count(),56);
  for(let i=0;i<56;i++)await page.locator('#work-photo-queue li button').filter({hasText:'Bỏ chọn'}).first().click();
  await page.locator('#work-photo-files').setInputFiles([
   {name:'anh-mot.png',mimeType:'image/png',buffer:png},
   {name:'anh-hai.png',mimeType:'image/png',buffer:png}
  ]);
  assert.equal(await page.locator('#work-photo-queue li').count(),2);
  await page.locator('#work-photo-queue input').first().fill('Hình ảnh 01 – tư liệu');
  const beforeUploads=uploaded;failAttach=true;
  await page.locator('#work-publish').click();
  await page.waitForFunction(()=>document.getElementById('work-submit-status').textContent.includes('simulated_attach_failure'),null,{timeout:17000});
  assert.equal(postRecord.published,0);assert.equal(album.length,0);assert.equal(uploaded,beforeUploads+2);
  await page.locator('#work-publish').click();
  await page.waitForFunction(()=>document.getElementById('work-submit-status').textContent.includes('Đã đăng bài thành công'),null,{timeout:17000});
  await page.waitForFunction(()=>document.getElementById('work-photo-count')?.textContent.includes('2 ảnh'),null,{timeout:17000});
  assert.equal(postRecord.published,true);assert.equal(uploaded,beforeUploads+3);
  assert.equal(await page.locator('#work-photo-album figure').count(),2);
  assert.equal(await page.locator('#work-photo-album figcaption').first().textContent(),'Hình ảnh 01 – tư liệu');
  assert.equal(errors.length,0,errors.join('; '));
  console.log('ADMIN_MULTIPHOTO_IPHONE_DESKTOP_'+label.toUpperCase()+'=PASS',
   JSON.stringify({selected:2,albumVisible:2,storageOriginalsPrivate:true,attachments:album.length}));
  if(label==='iphone'){assert.equal(uploaded,3);assert.equal(previews,3);assert.equal(approvals,3)}
  album.length=0;postRecord=null;
  await page.close();
 }
 assert.equal(creates,2);assert.equal(publishWrites,2);
 assert.equal(requests.some(x=>x.includes('/sandbox')),false,'synthetic sandbox API must not auto-fetch');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
