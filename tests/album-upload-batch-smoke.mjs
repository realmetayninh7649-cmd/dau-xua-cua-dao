// Batch album upload: browser mock only, NEVER writes to real Supabase/R2.
import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const original=readFileSync('dao-su-albums.js','utf8');
const source=original.replace(
  "import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')",
  "Promise.resolve({createClient:()=>window.__albumTestClient})"
);
assert.notEqual(original,source,'Replace Supabase module only in browser test');
const browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [label,width,limit] of [['iphone',390,2],['desktop',1280,3]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  try{
   await page.setContent('<div class="editor-tabs"><button class="is-selected" data-kind="posts">Biên khảo</button></div>'
     +'<h2 id="editor-heading">Thêm tư liệu</h2><form id="editor-form"><div class="form-actions"></div></form>');
   await page.evaluate(()=>{
     window.SITE_CONFIG={supabaseUrl:'https://example.invalid',supabasePublishableKey:'local-test'};
     window.GDDImageOptimizer={isImage:file=>file.type==='image/jpeg',
       prepare:async file=>{await new Promise(resolve=>setTimeout(resolve,5));return file;}};
     window.GDDTrace={stampedBlob:async()=>new Blob(['stamp'],{type:'image/jpeg'})};
     const rows=[],uploads=[],state={active:0,peak:0,failInsertOnce:false,failed:false};
     window.GDDR2={archive:async (file,supa,options)=>{
       state.active++;state.peak=Math.max(state.peak,state.active);
       uploads.push(file.name);
       await new Promise(resolve=>setTimeout(resolve,file.name==='01.jpg'?55:15));
       state.active--;
       if(options.skipDerivatives!==false)throw Error('private R2 cutover requires derivative variants');
       return{id:'12345678-1234-4123-8123-'+String(uploads.length).padStart(12,'0'),
         previewReady:true,downloadReady:true};
     }};
     window.GDDPrivatePublishing={
       publishArchivedImage:async asset=>({url:'https://r2.example.invalid/v1/public/'+asset.id+'/preview'}),
       previewUrl:id=>'https://r2.example.invalid/v1/public/'+id+'/preview'
     };
     const selectQuery=()=>({
       filters:{},
       eq(key,value){this.filters[key]=value;return this},
       order(){return this},
       limit(){
         const matching=rows.filter(r=>!this.filters.owner_kind||r.owner_kind===this.filters.owner_kind);
         return Promise.resolve({data:matching.sort((a,b)=>b.sort_order-a.sort_order).slice(0,1),error:null});
       },
       maybeSingle(){
         return Promise.resolve({data:rows.find(r=>r.image_url===this.filters.image_url)||null,error:null});
       },
       single(){return Promise.resolve({data:{published:true},error:null});}
     });
     const table={
       select(){return selectQuery()},
       insert(row){return {select(){return {single:async()=>{
         const saved={...row,id:'row-'+(rows.length+1),photo_code:'DXCD-AB-00001/'+String(rows.length+1).padStart(3,'0')};
         rows.push(saved);
         if(state.failInsertOnce&&!state.failed&&rows.length===2){
           state.failed=true;return {data:null,error:Error('Mạng đứt sau khi đã lưu mã ảnh')};
         }
         return {data:saved,error:null};
       }}}}},
       update(data){return {eq:async(key,id)=>{
         const row=rows.find(x=>x.id===id);
         if(row)Object.assign(row,data);
         return {error:null};
       }}}
     };
     window.__albumTestClient={
       auth:{getUser:async()=>({data:{user:{id:'tester'}},error:null})},
       from:()=>table
     };
     window.__albumState={rows,uploads,state};
   });
   await page.addScriptTag({content:source});
   await page.locator('#gdd-album-files').setInputFiles([
     {name:'01.jpg',mimeType:'image/jpeg',buffer:Buffer.from([1,2,3])},
     {name:'02.jpg',mimeType:'image/jpeg',buffer:Buffer.from([4,5,6])},
     {name:'03.jpg',mimeType:'image/jpeg',buffer:Buffer.from([7,8,9])}
   ]);
   await page.evaluate(()=>{window.__albumState.state.failInsertOnce=true});
   const failed=await page.evaluate(async()=>{
     try{await window.GDDAlbums.uploadPending('posts','parent-a');return false}
     catch{return true}
   });
   assert.equal(failed,true,label+' simulated DB response lost');
   const partial=await page.evaluate(()=>({
     rows:window.__albumState.rows.map(x=>({sort:x.sort_order,code:x.photo_code})),
     remaining:window.GDDAlbums.pendingCount()
   }));
   assert.equal(partial.rows.length,2,label+' first and second DB inserts exist');
   assert.equal(partial.remaining,2,label+' two unsaved entries retained');
   await page.evaluate(()=>window.GDDAlbums.uploadPending('posts','parent-a'));
   const result=await page.evaluate(()=>({
     rows:window.__albumState.rows.map(x=>({sort:x.sort_order,code:x.photo_code})),
     uploads:window.__albumState.uploads,
     peak:window.__albumState.state.peak,
     pending:window.GDDAlbums.pendingCount()
   }));
   assert.deepEqual(result.rows.map(x=>x.sort),[1,2,3],label+' order is stable');
   assert.deepEqual(result.rows.map(x=>x.code),[
     'DXCD-AB-00001/001','DXCD-AB-00001/002','DXCD-AB-00001/003'
   ],label+' photo codes remain sorted');
   assert.equal(result.rows.length,3,label+' no duplicate DB row after retry');
   assert.equal(result.uploads.filter(x=>x==='02.jpg').length,1,label+' no duplicate file upload on retry');
   assert.ok(result.peak>=2&&result.peak<=limit,label+' bounded parallel transfers');
   assert.equal(result.pending,0,label+' all uploads done');
   console.log('ALBUM BATCH PASS',label,JSON.stringify(result));
  }catch(error){
   console.error('ALBUM BATCH FAIL',label,error.message);
   throw error;
  }finally{await page.close();}
 }
}finally{await browser.close();}
