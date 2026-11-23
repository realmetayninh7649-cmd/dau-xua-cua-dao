import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {chromium} from 'playwright-core';
import {ADMIN_HTML,ADMIN_CSS,ADMIN_JS} from '../workers/gdd-d1-admin/src/admin-ui.mjs';
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
const server=createServer((req,res)=>{
 const pathname=new URL(req.url,'http://127.0.0.1').pathname;
 requests.push(pathname);
 let body='',type='application/json; charset=utf-8',status=200;
 if(pathname==='/admin') {type='text/html; charset=utf-8';body=ADMIN_HTML}
 else if(pathname==='/admin/style.css'){type='text/css';body=ADMIN_CSS}
 else if(pathname==='/admin/app.js'){type='text/javascript';body=ADMIN_JS}
 else if(pathname==='/api/v1/admin/session')body=JSON.stringify(session);
 else if(pathname==='/api/v1/admin/summary')body=JSON.stringify(summary);
 else if(pathname.startsWith('/api/v1/admin/work/'))body=JSON.stringify({data:[],kind:'people'});
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
  await page.close();
 }
 assert.equal(requests.some(x=>x.includes('/sandbox')),false,'synthetic sandbox API must not auto-fetch');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
