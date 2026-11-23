import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright-core';
import JSZip from 'jszip';
import {ADMIN_HTML,ADMIN_CSS,ADMIN_JS} from '../workers/gdd-d1-admin/src/admin-ui.mjs';
const zip=new JSZip();
zip.file('[Content_Types].xml','<?xml version="1.0" encoding="utf-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
zip.file('_rels/.rels','<?xml version="1.0" encoding="utf-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
zip.file('word/document.xml','<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Văn kiện kiểm thử DOCX - Dấu Xưa Cửa Đạo. Tập này là nội dung giả lập, không phải hồ sơ lịch sử thật và không ghi vào cơ sở dữ liệu.</w:t></w:r></w:p></w:body></w:document>');
const docx=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
const mammoth=readFileSync('node_modules/mammoth/mammoth.browser.min.js');
const summary={source_total:1892,total_records:1892,remaining_records:0,table_count:21,
 published_records:118,gallery_images:615,r2_asset_records:269,row_counts_match_snapshot:true,
 source_integrity_snapshot:{people:{unpublished:2},r2_asset_metadata:{rows:269,preview_ready:0},
  gallery:{rows:615,without_image_url:0,without_photo_code:0}},
 r2_object_inventory_snapshot:{object_count:2512,total_bytes:3156978971},inventory:[]};
const session={authenticated:true,write_enabled:false,working_editor_enabled:true,
 managed_r2_enabled:true,role:'administrator',mode:'staging'};
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const events={privateUpload:0,previewPages:0,publish:0};
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1'),path=url.pathname;
 let payload='',type='application/json; charset=utf-8',status=200;
 if(path==='/admin'){payload=ADMIN_HTML;type='text/html; charset=utf-8'}
 else if(path==='/admin/style.css'){payload=ADMIN_CSS;type='text/css'}
 else if(path==='/admin/app.js'){payload=ADMIN_JS;type='application/javascript'}
 else if(path==='/api/v1/admin/session')payload=JSON.stringify(session);
 else if(path==='/api/v1/admin/summary')payload=JSON.stringify(summary);
 else if(path==='/api/v1/admin/contributions')payload=JSON.stringify({private:true,data:[]});
 else if(path.startsWith('/api/v1/admin/work/'))payload=JSON.stringify({data:[],kind:'people'});
 else if(path==='/api/v1/admin/records')payload=JSON.stringify({data:[],has_next:false});
 else if(path==='/api/v1/admin/r2/managed/v1/uploads/small'&&req.method==='PUT'){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const bytes=Buffer.concat(chunks);
  assert.ok(bytes.length>500&&bytes[0]===80&&bytes[1]===75,'private DOCX bytes intact');
  events.privateUpload++;payload=JSON.stringify({id,originalPreserved:true,publiclyAccessible:false});status=201;
 }else if(path==='/api/v1/admin/r2/managed/v1/assets/'+id+'/page/1'&&req.method==='PUT'){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const bytes=Buffer.concat(chunks);
  assert.ok(bytes.length>1000&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255,'Rendered JPEG required');
  events.previewPages++;payload=JSON.stringify({id,page:1,storedBytes:bytes.length,originalUnchanged:true});status=201;
 }else if(path==='/api/v1/admin/r2/managed/v1/assets/'+id+'/publication'&&req.method==='POST'){
  const chunks=[];for await(const chunk of req)chunks.push(chunk);
  const reqBody=JSON.parse(Buffer.concat(chunks).toString());
  assert.deepEqual(reqBody,{publish:true,pageCount:1,viewSource:'docx_text'});
  events.publish++;payload=JSON.stringify({id,published:true,originalPrivate:true,pageCount:1}); 
 }else {status=404;payload=JSON.stringify({error:'not_found'})}
 res.writeHead(status,{'content-type':type,'cache-control':'no-store'});res.end(payload);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [name,width,height] of [['iphone',390,844],['laptop',1280,900]]){
  const page=await browser.newPage({viewport:{width,height}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
  await page.route('https://cdn.jsdelivr.net/npm/mammoth@1.13.0/mammoth.browser.min.js',
   route=>route.fulfill({status:200,contentType:'application/javascript',headers:{'access-control-allow-origin':'*'},body:mammoth}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/admin',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.getElementById('r2-managed-panel')?.hidden===false,null,{timeout:15000});
  await page.locator('#r2-managed-file').setInputFiles({name:'gdd-synthetic.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:docx});
  await page.locator('#r2-managed-upload').click();
  await page.waitForFunction(()=>document.getElementById('r2-managed-status')?.textContent.includes('Đã bảo tồn nguyên mẫu riêng tư'),null,{timeout:13000});
  assert.equal(await page.locator('#r2-managed-docx-pages').isDisabled(),false);
  await page.locator('#r2-managed-docx-pages').click();
  await page.waitForFunction(()=>document.getElementById('r2-managed-status')?.textContent.includes('Đã tạo 1 trang đọc chữ DOCX'),null,{timeout:25000});
  await page.locator('#r2-managed-public-confirm').check();
  await page.locator('#r2-managed-publish').click();
  await page.waitForFunction(()=>document.getElementById('r2-managed-status')?.textContent.includes('Đã công bố bản xem an toàn'),null,{timeout:12000});
  assert.deepEqual(errors,[],'Browser error '+name);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+4));
  console.log('REAL_MAMMOTH_DOCX_TEXT_TO_JPEG_'+name.toUpperCase()+'=PASS');
  await page.close();
 }
 assert.deepEqual(events,{privateUpload:2,previewPages:2,publish:2});
 console.log('DOCX_LOCAL_PRIVATE_ORIGINAL_ONLY_MOCK_R2=PASS');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
