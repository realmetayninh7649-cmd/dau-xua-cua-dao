// Test luong Số hóa that trong inline index.html. KHÔNG ghi len R2/Supabase that.
import {chromium} from 'playwright-core';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const html=readFileSync('index.html','utf8');
const matched=html.match(/<script id="gdd-album-unlimited-20261104">([\s\S]*?)<\/script>/);
assert.ok(matched,'must locate active unlimited album script');
let script=matched[1];
const dynamicImport="import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')";
assert.ok(script.includes(dynamicImport));
script=script.replace(dynamicImport,"Promise.resolve({createClient:()=>window.__testSupa})");
assert.match(script,/\}\)\(\);\s*$/);
script=script.replace(/\}\)\(\);\s*$/,
  'window.__testQueue=files=>{queue=files.map(file=>makeQueuedImage(file,file.name));};})();');

const browser=await chromium.launch({headless:true,
  executablePath:process.env.CHROME_BIN||'/usr/bin/google-chrome',
  args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [device,width,limit] of [['iphone',390,2],['desktop',1280,3]]){
  const page=await browser.newPage({viewport:{width,height:900}});
  try{
   await page.setContent('<section id="gdd-admin-album-panel" data-context="documents:new">'
     +'<label>Ảnh <input id="gdd-album-files" type="file" multiple></label>'
     +'<div id="gdd-album-selection"></div><div id="gdd-album-status"></div></section>'
     +'<form id="editor-form"><div class="form-actions"></div></form>');
   await page.evaluate(()=>{
     window.SITE_CONFIG={
       supabaseUrl:'https://local.example.invalid',supabasePublishableKey:'sb_publishable_test'
     };
     window.GDDAlbums={resetAfterSuccess:()=>{}};
     const rows=[],archiveCounts={},publicUploads=[],state={active:0,peak:0,failed:false};
     window.GDDImageOptimizer={
       isImage:f=>f.type.startsWith('image/'),
       prepare:async f=>{await new Promise(ok=>setTimeout(ok,5));return f;}
     };
     window.GDDTrace={stampedBlob:async(f,code)=>{
       await new Promise(ok=>setTimeout(ok,5));
       return new Blob(['stamp:'+code],{type:'image/jpeg'});
     }};
     window.GDDR2={
       archive:async(f,supa,options)=>{
         archiveCounts[f.name]=(archiveCounts[f.name]||0)+1;
         state.active++;state.peak=Math.max(state.peak,state.active);
         await new Promise(ok=>setTimeout(ok,f.name==='01.jpg'?45:25));
         state.active--;
         options.onProgress?.({phase:'original',bytes:f.size,total:f.size});
         return {id:'r2-'+f.name,originalBytes:f.size,previewReady:!f.name.endsWith('.pdf'),downloadReady:!f.name.endsWith('.pdf')};
       },refresh:()=>{}
     };
     window.GDDPrivatePublishing={
       publishArchivedImage:async asset=>({url:'https://r2.local.invalid/v1/public/'+asset.id+'/preview'}),
       previewUrl:id=>'https://r2.local.invalid/v1/public/'+id+'/preview'
     };
     const store={
       async upload(path,file){
         await new Promise(ok=>setTimeout(ok,15));
         publicUploads.push({path,name:file.name||'stamp'});
         return {error:null};
       },
       getPublicUrl:p=>({data:{publicUrl:'https://local.example.invalid/'+p}})
     };
     const filterQuery=()=>({
       filter:{},
       eq(name,value){this.filter[name]=value;return this;},
       order(){return this;},
       limit(){return Promise.resolve({
         data:rows.filter(r=>r.owner_kind===this.filter.owner_kind&&
           r.owner_id===this.filter.owner_id).sort((a,b)=>b.sort_order-a.sort_order).slice(0,1),
         error:null
       });},
       maybeSingle(){return Promise.resolve({data:rows.find(r=>
         r.owner_kind===this.filter.owner_kind&&r.owner_id===this.filter.owner_id&&
         r.image_url===this.filter.image_url)||null,error:null});},
       single(){return Promise.resolve({data:{published:true},error:null});}
     });
     const table={
       select:filterQuery,
       insert(entry){return {select:()=>({single:async()=>{
         const row={...entry,id:'row-'+(rows.length+1),
           photo_code:'DXCD-SH-00001/'+String(rows.length+1).padStart(3,'0')};
         rows.push(row);
         if(!state.failed&&rows.length===2){
           state.failed=true;
           return {data:null,error:new Error('Network response lost after DB commit')};
         }
         return {data:row,error:null};
       }})};},
       update(fields){return {eq:async(k,id)=>{
         const row=rows.find(x=>x.id===id);
         if(row)Object.assign(row,fields);
         return {error:null};
       }};}
     };
     window.__testSupa={
       auth:{getUser:async()=>({data:{user:{id:'local-admin'}},error:null})},
       storage:{from:()=>store},from:()=>table
     };
     window.__testState={rows,archiveCounts,publicUploads,state};
   });
   await page.addScriptTag({content:script});
   const initial=await page.evaluate(async()=>{
     window.__testQueue([
       new File(['one'],'01.jpg',{type:'image/jpeg'}),
       new File(['two'],'02.jpg',{type:'image/jpeg'}),
       new File(['three'],'03.jpg',{type:'image/jpeg'}),
       new File(['pdf'],'04.pdf',{type:'application/pdf'})
     ]);
     try{await window.GDDAlbums.uploadPending('documents','article-one');return {failed:false};}
     catch(error){return {failed:true,message:String(error?.message||error)};}
   });
   assert.equal(initial.failed,true,device+' simulated lost DB reply');
   assert.match(initial.message,/Network response lost/);
   await page.evaluate(()=>window.GDDAlbums.uploadPending('documents','article-one'));
   const result=await page.evaluate(()=>({
     rows:window.__testState.rows.map(r=>({sort:r.sort_order,code:r.photo_code,url:r.image_url})),
     archives:window.__testState.archiveCounts,
     uploads:window.__testState.publicUploads,
     peak:window.__testState.state.peak,pending:window.GDDAlbums.pendingCount()
   }));
   assert.equal(result.peak,limit,device+' bounded network concurrency');
   assert.deepEqual(result.rows.map(x=>x.sort),[1,2,3],device+' stable order');
   assert.deepEqual(result.rows.map(x=>x.code),[
     'DXCD-SH-00001/001','DXCD-SH-00001/002','DXCD-SH-00001/003'
   ]);
   assert.ok(result.rows.every(r=>r.url.includes('/v1/public/')&&r.url.endsWith('/preview')),device+' safe R2 derivative URLs');
   assert.equal(result.pending,0,device+' all processed');
   for(const name of ['01.jpg','02.jpg','03.jpg','04.pdf'])
     assert.equal(result.archives[name],1,device+' original R2 only once '+name);
   assert.equal(result.uploads.length,0,device+' no public Supabase Storage uploads');
   console.log('UNLIMITED DOCUMENT UPLOAD PASS',device,JSON.stringify({
     concurrent:result.peak,records:result.rows.length,privatePdf:true,pending:result.pending
   }));
  }finally{await page.close()}
 }
}finally{await browser.close()}
