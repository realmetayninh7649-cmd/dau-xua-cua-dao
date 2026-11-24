export const PHOTO_JS=String.raw`/* Multi-image editor for Access-authenticated working D1.
 * Originals go to the private R2 vault. Only approved optimized previews are linked.
 * No removal of R2 original objects, no old-gallery deletion, no Supabase calls.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const supported=new Set(['image/jpeg','image/png','image/webp']);
const supportedKinds=new Set(['people','posts','media','videos','obituaries','documents','gdd_memorials','gdd_audio_programs','gdd_calendar_memorials']);
const limits={each:24*1048576};
const documentKinds=supportedKinds;
const documentLimit=45*1048576;
let documents=[];
const downloadChanges=new Map();
let queue=[],context=null,busy=false,loadId=0;
function status(message){$('work-photo-status').textContent=message}
function clear(){
 loadId++;
 for(const item of queue)if(item.previewUrl)URL.revokeObjectURL(item.previewUrl);
 queue=[];documents=[];readerPlans.clear();downloadChanges.clear();context=null;busy=false;
 $('work-attachment-files').value='';$('work-attachment-queue').replaceChildren();$('work-attachment-existing').replaceChildren();$('work-attachment-count').textContent=' · 0 tệp';$('work-attachment-status').textContent='';$('work-attachment-panel').hidden=true;
 $('work-photo-files').value='';
 $('work-photo-queue').replaceChildren();$('work-photo-album').replaceChildren();
 $('work-photo-existing').open=false;$('work-photo-count').textContent=' · 0 ảnh';
 $('work-photo-panel').hidden=true;
}
function refresh(){
 const allowed=!!context&&supportedKinds.has(context.kind);
 $('work-photo-panel').hidden=!allowed;
 const docsAllowed=!!context&&documentKinds.has(context.kind);
 $('work-attachment-panel').hidden=!docsAllowed;
 $('work-attachment-files').disabled=busy||workBusy;
 if(!allowed)return;
 $('work-photo-files').disabled=busy||workBusy;
}
function label(container,tag,value,cls){
 const element=document.createElement(tag);
 element.textContent=String(value??'');
 if(cls)element.className=cls;
 container.append(element);return element;
}
function render(){
 const list=$('work-photo-queue');list.replaceChildren();
 for(let i=0;i<queue.length;i++){
  const item=queue[i],li=document.createElement('li');
  const picture=document.createElement('img');picture.loading='lazy';picture.decoding='async';picture.src=item.previewUrl;picture.alt='Ảnh '+(i+1);
  const body=document.createElement('div');
  label(body,'div',(i+1)+'. '+item.file.name+' ('+(item.file.size/1048576).toFixed(1)+' MB)','photo-filename');
  const captionLabel=label(body,'label','Chú thích ảnh '+(i+1));
  const input=document.createElement('input');input.type='text';input.maxLength=600;
  input.value=item.caption;input.disabled=busy||item.done;
  input.addEventListener('input',()=>item.caption=input.value);
  captionLabel.append(input);
  const buttons=document.createElement('div');buttons.className='photo-buttons';
  for(const [name,delta] of [['Lên',-1],['Xuống',1]]){
   const btn=document.createElement('button');btn.type='button';btn.textContent=name;
   btn.disabled=busy||item.done||i+delta<0||i+delta>=queue.length;
   btn.addEventListener('click',()=>{
    queue.splice(i,1);queue.splice(i+delta,0,item);render();
   });
   buttons.append(btn);
  }
  const remove=document.createElement('button');remove.type='button';remove.textContent='Bỏ chọn';
  remove.disabled=busy||item.done;
  remove.addEventListener('click',()=>{
   queue.splice(i,1);URL.revokeObjectURL(item.previewUrl);render();
  });buttons.append(remove);
  label(buttons,'small',item.done?'Đã gắn':item.error||'Chờ tải');
  body.append(buttons);li.append(picture,body);list.append(li);
 }
 refresh();
}
function select(){
 if(!context||busy||workBusy)return;
 const files=Array.from($('work-photo-files').files||[]);
 if(!files.length)return;
 const valid=files.filter(file=>supported.has(file.type)&&file.size>0&&file.size<=limits.each);
 const rejected=files.length-valid.length;
 const known=new Set(queue.map(item=>[item.file.name,item.file.size,item.file.lastModified].join('|')));
 const added=valid.filter(file=>{const key=[file.name,file.size,file.lastModified].join('|');if(known.has(key))return false;known.add(key);return true;});
 queue.push(...added.map(file=>({
  file,caption:file.name.slice(0,file.name.lastIndexOf('.')>0?file.name.lastIndexOf('.'):file.name.length),
  previewUrl:URL.createObjectURL(file),assetId:null,published:false,done:false,error:''
 })));
 $('work-photo-files').value='';
 status('Đã thêm '+added.length+' ảnh; '+queue.filter(x=>!x.done).length+' ảnh chờ tải. '+(rejected?'Bỏ qua '+rejected+' tệp không đúng định dạng hoặc quá 24 MB. ':'')+'Có thể chọn thêm ảnh.');
 render();
}
async function archiveOriginal(file,notify){
 let uploaded;
 if(file.size<=6*1048576){
  notify('Bảo tồn bản gốc riêng tư…');
  uploaded=await managedRequest('/v1/uploads/small?name='+encodeURIComponent(file.name)+'&size='+file.size,{
   method:'PUT',data:file,type:file.type});
 }else{
  notify('Mở phiên tải ảnh lớn…');
  const ticket=await managedRequest('/v1/uploads/start',{
   method:'POST',data:JSON.stringify({name:file.name,size:file.size})});
  if(!ticket?.id||!ticket.key||!ticket.uploadId||ticket.partBytes!==8*1048576)
    throw Error('Phiên tải R2 không hợp lệ');
  const parts=[],count=Math.ceil(file.size/ticket.partBytes);
  for(let i=0;i<count;i++){
   notify('Đang lưu phần '+(i+1)+'/'+count);
   const slice=file.slice(i*ticket.partBytes,Math.min(file.size,(i+1)*ticket.partBytes));
   const part=await managedRequest('/v1/uploads/part?key='+encodeURIComponent(ticket.key)+
      '&uploadId='+encodeURIComponent(ticket.uploadId)+'&part='+(i+1),{
      method:'PUT',data:slice,type:'application/octet-stream'});
   if(part.partNumber!==i+1||typeof part.etag!=='string')
      throw Error('Không xác nhận được một phần ảnh');
   parts.push({partNumber:part.partNumber,etag:part.etag});
  }
  uploaded=await managedRequest('/v1/uploads/complete',{
   method:'POST',data:JSON.stringify({key:ticket.key,uploadId:ticket.uploadId,size:file.size,parts})});
 }
 if(!uploaded?.id||uploaded.originalPreserved!==true||uploaded.publiclyAccessible!==false)
    throw Error('R2 chưa xác nhận đã giữ riêng bản gốc');
 return uploaded.id;
}
async function uploadPreview(item){
 const image=new Image();
 await new Promise((resolve,reject)=>{
  image.onload=resolve;image.onerror=()=>reject(Error('Điện thoại không đọc được ảnh'));
  image.src=item.previewUrl;
 });
 let optimized=await managedImageBlob(image,'image/webp',1800,.83);
 let mime='image/webp';
 const bytes=new Uint8Array(await optimized.slice(0,12).arrayBuffer());
 if(bytes[0]!==82||bytes[1]!==73||bytes[2]!==70||bytes[3]!==70||
    bytes[8]!==87||bytes[9]!==69||bytes[10]!==66||bytes[11]!==80){
   optimized=await managedImageBlob(image,'image/jpeg',1800,.84);
   mime='image/jpeg';
 }
 if(optimized.size<16||optimized.size>8*1048576)
   throw Error('Ảnh xem vượt 8 MB; cần thu nhỏ ảnh');
 await managedRequest('/v1/assets/'+item.assetId+'/preview',{
   method:'PUT',data:optimized,type:mime});
}
async function reloadAlbum(){
 const serial=++loadId;
 if(!context?.id)return;
 const {kind,id}=context;
 try{
  const images=[];
  for(let offset=0;;offset+=100){
   const res=await fetch('/api/v1/admin/work/'+kind+'/'+id+'/photos?limit=100&offset='+offset,{cache:'no-store',credentials:'same-origin'});
   const json=await res.json();
   if(!res.ok||!Array.isArray(json.data))throw Error(json.error||'Không tải được album');
   if(serial!==loadId||!context||context.id!==id)return;
   images.push(...json.data);
   if(json.data.length<100||json.has_next===false)break;
  }
  $('work-photo-count').textContent=' · '+images.length+' ảnh';
  const grid=$('work-photo-album');grid.replaceChildren();
  for(const photo of images){
   const figure=document.createElement('figure');
   try{
    const u=new URL(photo.image_url);
    if(u.protocol==='https:'&&!u.username&&!u.password){
      const image=document.createElement('img');image.src=u.href;image.loading='lazy';
      image.alt=String(photo.caption||'Ảnh tư liệu');figure.append(image);
    }
   }catch{}
   label(figure,'figcaption',photo.caption||photo.photo_code||'Ảnh tư liệu');
   grid.append(figure);
  }
 }catch(error){status('Chưa tải được ảnh đã gắn: '+error.message)}
}
async function uploadBatch(record,notify=()=>{}){
 if(!context||!record?.id||context.kind!==record.kind)throw Error('Chưa có hồ sơ để gắn ảnh');
 if(context.id&&context.id!==record.id)throw Error('Không đúng hồ sơ đang mở');
 context.id=record.id;
 if(!queue.some(photo=>!photo.done))return;
 if(busy)throw Error('Ảnh đang tải');
 busy=true;render();
 const kind=context.kind,id=context.id,activeContext=context;
 let doneCount=0;
 try{
  for(let i=0;i<queue.length;i++){
   if(context!==activeContext)return;
   const photo=queue[i];if(photo.done)continue;
   const progress=message=>{const text='Ảnh '+(i+1)+'/'+queue.length+': '+message;status(text);notify(text)};
   try{
    if(!photo.assetId)photo.assetId=await archiveOriginal(photo.file,progress);
    if(!photo.published){
      progress('Tạo bản xem nhẹ…');
      await uploadPreview(photo);
      progress('Hoàn thiện bản xem…');
      const released=await managedRequest('/v1/assets/'+photo.assetId+'/publication',{
       method:'POST',data:JSON.stringify({publish:true,allowDownload:false})});
      if(released.published!==true||released.originalPrivate!==true)
        throw Error('Bản xem R2 chưa được phê duyệt');
      photo.published=true;
    }
    if(context!==activeContext)return;
    progress('Gắn ảnh vào bộ ảnh D1…');
    const saved=await workWrite('/api/v1/admin/work/'+kind+'/'+id+'/photos','POST',
      {asset_id:photo.assetId,caption:photo.caption.trim().slice(0,600)});
    if(!saved?.data?.image_url||!(saved.attached||saved.already_attached))
      throw Error('Chưa xác nhận ảnh liên kết với bài');
    photo.done=true;photo.error='';doneCount++;
   }catch(error){
     photo.error=String(error.message||'Lỗi');
     status('Ảnh '+(i+1)+' chưa xong: '+photo.error+'. Nhấn Đăng bài để thử tiếp.');
     throw Error('Ảnh '+(i+1)+'/'+queue.length+': '+photo.error);
   }
  }
  await reloadAlbum();
  if(queue.every(photo=>photo.done))
   status('Đã gắn '+queue.length+' ảnh. Bản gốc vẫn riêng tư.');
  else throw Error('Còn ảnh chưa tải xong');
 }finally{if(context===activeContext){busy=false;render()}}
}
function docStatus(message){$('work-attachment-status').textContent=message}
function permissionChoice(li,checked,onChange,disabled=false){
 const wrap=document.createElement('label');wrap.style.cssText='display:flex;align-items:center;gap:8px;flex-basis:100%;font-size:.86rem;';
 const input=document.createElement('input');input.type='checkbox';input.checked=checked;input.disabled=disabled||busy||workBusy;input.style.cssText='width:auto;min-width:0;';
 input.addEventListener('change',()=>onChange(input.checked));
 wrap.append(input,document.createTextNode('Cho phép khách tải tệp gốc'));li.append(wrap);
}
function renderDocuments(){
 const list=$('work-attachment-queue');list.replaceChildren();
 for(const item of documents){
  const li=document.createElement('li');li.className='sandbox-line';
  label(li,'span',item.file.name+' · '+(item.file.size/1048576).toFixed(1)+' MB · '+(item.done?'Đã gắn':item.error||'Chờ tải'));
  const remove=document.createElement('button');remove.type='button';remove.textContent='Bỏ chọn';remove.disabled=busy||workBusy||item.done||!!item.assetId;
  remove.addEventListener('click',()=>{documents=documents.filter(x=>x!==item);renderDocuments()});
  li.append(remove);permissionChoice(li,item.allowDownload===true,value=>{item.allowDownload=value;if(item.assetId)downloadChanges.set(item.assetId,value)},item.done);list.append(li);
 }
 refresh();
}
function selectDocuments(){
 if(!context||busy||workBusy)return;
 const files=Array.from($('work-attachment-files').files||[]);
 const known=new Set(documents.map(x=>[x.file.name,x.file.size,x.file.lastModified].join('|')));
 let added=0,rejected=0;
 for(const file of files){
  if(!/\.(pdf|doc|docx)$/i.test(file.name)||file.size<1||file.size>documentLimit){rejected++;continue}
  const key=[file.name,file.size,file.lastModified].join('|');if(known.has(key))continue;
  known.add(key);documents.push({file,assetId:null,done:false,error:'',allowDownload:false});added++;
 }
 $('work-attachment-files').value='';
 docStatus('Đã chọn '+added+' tài liệu mới. '+(rejected?'Bỏ qua '+rejected+' tệp không hợp lệ. ':'')+'Tự tải khi đăng bài.');
 renderDocuments();
}
async function listDocuments(current){
 const base='/api/v1/admin/work/'+current.kind+'/'+current.id+'/attachments';
 const rows=[];
 for(let offset=0;;offset+=100){
  const data=await api(base+'?limit=100&offset='+offset);
  if(context!==current)throw Error('Hồ sơ đã thay đổi');
  if(!Array.isArray(data.data))throw Error('Danh sách tài liệu không hợp lệ');
  rows.push(...data.data);
  if(!data.has_next)break;
 }
 return rows;
}
async function reloadDocuments(){
 const current=context;if(!current?.id)return;
 const list=$('work-attachment-existing');list.replaceChildren();
 try{
  const base='/api/v1/admin/work/'+current.kind+'/'+current.id+'/attachments';
  const rows=await listDocuments(current);
  $('work-attachment-count').textContent=' · '+rows.length+' tệp';
  for(const row of rows){
   const li=document.createElement('li');li.className='sandbox-line';
   label(li,'span',row.original_name+' · '+(Number(row.original_bytes)/1048576).toFixed(1)+' MB');
   const a=document.createElement('a');a.textContent='Tải tệp gốc (quản trị)';a.href=base+'/'+encodeURIComponent(row.asset_id)+'/download';li.append(a);
   const released=Number(row.public_view)===1&&Number(row.preview_ready)===1;
   label(li,'small',released?'Đã có bản đọc công khai':/\.doc$/i.test(row.original_name||'')?'Bản gốc riêng tư · Word .doc cần chuyển sang PDF hoặc DOCX để độc giả xem':'Chưa có bản đọc · tự xử lý khi Đăng bài / Cập nhật bài');
   permissionChoice(li,downloadChanges.has(row.asset_id)?downloadChanges.get(row.asset_id):Number(row.allow_download)===1,value=>{downloadChanges.set(row.asset_id,value);docStatus('Quyền tải sẽ được lưu khi nhấn Cập nhật bài / Đăng bài.')});
   list.append(li);
  }
 }catch(e){if(context===current)docStatus('Chưa đọc được tài liệu: '+e.message)}
}
const readerPlans=new Map();
async function prepareDocument(row,current,notify){
 if(context!==current)throw Error('Hồ sơ đã thay đổi');
 if(readerPlans.has(row.asset_id))return readerPlans.get(row.asset_id);
 const docx=/\.docx$/i.test(row.original_name||'');
 let pdf=null;
 try{
  const local=documents.find(item=>item.assetId===row.asset_id)?.file;
  let bytes;
  if(local){notify('Đang tạo bản đọc từ tệp đã chọn…');bytes=await local.arrayBuffer()}
  else{
   notify('Đang đọc tài liệu đã lưu R2, không tải lại bản gốc…');
   const base='/api/v1/admin/work/'+current.kind+'/'+current.id+'/attachments';
   const response=await fetch(base+'/'+encodeURIComponent(row.asset_id)+'/download',{credentials:'same-origin',cache:'no-store'});
   if(!response.ok)throw Error('Không đọc được tệp đã lưu');
   bytes=await response.arrayBuffer();
  }
  if(bytes.byteLength!==Number(row.original_bytes)||bytes.byteLength>documentLimit)throw Error('Dung lượng tệp không khớp hoặc vượt giới hạn');
  let total=0;
  async function savedPages(total){
   const pages=new Set();
   if(local)return pages;
   const base='/api/v1/admin/work/'+current.kind+'/'+current.id+'/attachments/'+encodeURIComponent(row.asset_id)+'/pages';
   for(let start=1;start<=total;start+=20){
    const count=Math.min(20,total-start+1);
    const data=await api(base+'?start='+start+'&count='+count);
    if(!Array.isArray(data.pages)||data.pages.some(n=>!Number.isInteger(n)||n<start||n>=start+count))throw Error('Chưa kiểm tra được các trang đã lưu');
    for(const n of data.pages)pages.add(n);
   }
   if(pages.size)notify('Tận dụng '+pages.size+'/'+total+' trang đã lưu.');
   return pages;
  }
  async function storePage(canvas,n){
   let blob=await new Promise((ok,fail)=>canvas.toBlob(b=>b?ok(b):fail(Error('Không tạo được JPEG')),'image/jpeg',.84));
   if(blob.size>3*1048576)blob=await new Promise((ok,fail)=>canvas.toBlob(b=>b?ok(b):fail(Error('Không nén được JPEG')),'image/jpeg',.65));
   if(blob.size<32||blob.size>3*1048576)throw Error('Trang '+n+' vượt dung lượng cho phép');
   await managedRequest('/v1/assets/'+row.asset_id+'/page/'+n,{method:'PUT',data:blob,type:'image/jpeg'});
  }
  if(docx){
   if(bytes.byteLength>35*1048576)throw Error('DOCX vượt 35 MB; nên chuyển sang PDF');
   const reader=await loadMammoth();
   const raw=String((await reader.extractRawText({arrayBuffer:bytes})).value||'').split(String.fromCharCode(0)).join('').trim();
   if(raw.length<20||raw.length>200000)throw Error('Không tạo được bản đọc chữ; nên chuyển sang PDF');
   const canvas=document.createElement('canvas');canvas.width=1400;canvas.height=2000;
   const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Không tạo được bản đọc');
   ctx.font='31px Georgia, serif';const lines=wrapWordText(ctx,raw,1160);
   total=Math.ceil(lines.length/38);if(total<1||total>120)throw Error('Tối đa 120 trang mỗi tập');
   const existing=await savedPages(total);
   for(let n=1;n<=total;n++){
    if(existing.has(n))continue;
    notify('Đang tạo bản đọc chữ '+n+'/'+total);
    ctx.fillStyle='#fff';ctx.fillRect(0,0,1400,2000);ctx.fillStyle='#202c27';ctx.font='31px Georgia, serif';ctx.textBaseline='top';
    lines.slice((n-1)*38,n*38).forEach((line,j)=>ctx.fillText(line,110,122+j*44));
    ctx.font='24px Georgia, serif';ctx.fillText('DẤU XƯA CỬA ĐẠO · BẢN ĐỌC CHỮ DOCX',110,1840);ctx.fillText('Trang '+n+' / '+total,110,1880);
    await storePage(canvas,n);
   }
   canvas.width=0;canvas.height=0;
  }else{
   const lib=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs');
   lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
   pdf=await lib.getDocument({data:new Uint8Array(bytes),isEvalSupported:false}).promise;
   total=pdf.numPages;if(!Number.isInteger(total)||total<1||total>120)throw Error('Tối đa 120 trang mỗi tập');
   const existing=await savedPages(total);
   for(let n=1;n<=total;n++){
    if(existing.has(n))continue;
    notify('Đang tạo bản đọc PDF '+n+'/'+total);
    const page=await pdf.getPage(n),initial=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(2.2,1800/Math.max(initial.width,initial.height))});
    const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(viewport.width));canvas.height=Math.max(1,Math.round(viewport.height));
    const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Không tạo được bản đọc');
    await page.render({canvasContext:ctx,viewport}).promise;
    await storePage(canvas,n);canvas.width=0;canvas.height=0;page.cleanup();
   }
  }
  if(context!==current)throw Error('Hồ sơ đã thay đổi; chưa công bố');
  const plan={assetId:row.asset_id,name:row.original_name,total,source:docx?'docx_text':'pdf'};
  readerPlans.set(row.asset_id,plan);return plan;
 }finally{try{await pdf?.destroy()}catch{}}
}
async function prepareReaders(record,notify=()=>{}){
 if(!context||!documentKinds.has(record.kind))return [];
 if(context.kind!==record.kind||context.id!==record.id)throw Error('Hồ sơ đính kèm không khớp');
 const current=context,rows=await listDocuments(current),plans=[];
 for(const row of rows){
  if(Number(row.public_view)===1&&Number(row.preview_ready)===1)continue;
  if(!/\.(pdf|docx)$/i.test(row.original_name||''))continue;
  try{plans.push(await prepareDocument(row,current,message=>{const text=row.original_name+': '+message;docStatus(text);notify(text)}))}
  catch(e){throw Error(row.original_name+': '+e.message+' · Bản gốc đã lưu; nhấn Đăng bài để thử lại.')}
 }
 return plans;
}
async function releaseReaders(record,plans,notify=()=>{}){
 if(!plans.length)return;
 if(!context||context.kind!==record.kind||context.id!==record.id||!(record.record?.published===true||record.record?.published===1))throw Error('Bài chưa được xác nhận công bố');
 for(const plan of plans){
  notify('Đang công bố bản đọc '+plan.name+'…');
  const out=await managedRequest('/v1/assets/'+plan.assetId+'/publication',{method:'POST',data:JSON.stringify({publish:true,pageCount:plan.total,viewSource:plan.source})});
  if(out.published!==true||out.originalPrivate!==true)throw Error('R2 chưa xác nhận bản đọc '+plan.name);
  readerPlans.delete(plan.assetId);
 }
 await reloadDocuments();docStatus('Đã công bố bản đọc; bản gốc vẫn riêng tư.');
}
async function uploadDocuments(record,notify=()=>{}){
 if(!context||context.kind!==record.kind||!record.id||context.id&&context.id!==record.id)throw Error('Không đúng hồ sơ để gắn tài liệu');
 context.id=record.id;if(busy)throw Error('Đang tải tệp');busy=true;renderDocuments();
 try{
  for(let i=0;i<documents.length;i++){
   const item=documents[i];if(item.done)continue;
   const progress=message=>{const text='Tài liệu '+(i+1)+'/'+documents.length+': '+message;docStatus(text);notify(text)};
   try{
    if(!item.assetId)item.assetId=await archiveOriginal(item.file,progress);
    progress('Gắn tệp vào hồ sơ...');
    const saved=await workWrite('/api/v1/admin/work/'+record.kind+'/'+record.id+'/attachments','POST',{asset_id:item.assetId});
    if(saved?.data?.asset_id!==item.assetId)throw Error('Chưa xác nhận liên kết tài liệu');
    downloadChanges.set(item.assetId,item.allowDownload===true);
    item.done=true;item.error='';
   }catch(e){item.error=String(e.message||'Lỗi');throw Error('Tài liệu '+(i+1)+': '+item.error)}
  }
  await reloadDocuments();docStatus('Đã gắn đủ tài liệu. Bản gốc riêng tư.');
 }finally{busy=false;renderDocuments()}
}
async function saveDownloadPermissions(record,allow,notify=()=>{}){
 if(!downloadChanges.size)return;
 if(!context||context.kind!==record.kind||context.id!==record.id)throw Error('Hồ sơ đính kèm không khớp');
 if(allow&&!(record.record?.published===true||record.record?.published===1))throw Error('Bài chưa được đăng');
 for(const [assetId,value] of [...downloadChanges]){
  if(value!==allow)continue;
  notify(value?'Đang lưu quyền tải tài liệu…':'Đang khóa tải tài liệu…');
  const result=await workWrite('/api/v1/admin/work/'+record.kind+'/'+record.id+'/attachments/'+assetId+'/permission','POST',{allow_download:value});
  if(result?.data?.asset_id!==assetId||Number(result.data.allow_download)!==Number(value))throw Error('Chưa lưu được quyền tải');
  downloadChanges.delete(assetId);
 }
}
$('work-attachment-files').addEventListener('change',selectDocuments);
$('work-photo-files').addEventListener('change',select);
window.GDDPhotoAlbum={reset:clear,refresh,isBusy:()=>busy,hasPending:()=>queue.some(x=>!x.done)||documents.some(x=>!x.done)||downloadChanges.size>0,hasPhotos:()=>queue.some(x=>!x.done),hasDocuments:()=>documents.some(x=>!x.done),uploadDocuments,prepareReaders,releaseReaders,saveDownloadPermissions,bindRecord(record){if(context&&context.kind===record.kind&&(!context.id||context.id===record.id)){context.id=record.id;refresh()}},uploadBatch,async uploadCover(file,notify,item={}){
 if(!supported.has(file.type)||file.size<1||file.size>limits.each)throw Error('Chọn JPEG/PNG/WebP không quá 24 MB.');
 item.file=file;
 if(!item.assetId)item.assetId=await archiveOriginal(file,notify);
 if(!item.published){
  notify('Tạo bản xem nhẹ…');
  item.previewUrl=URL.createObjectURL(file);
  try{await uploadPreview(item)}finally{URL.revokeObjectURL(item.previewUrl);item.previewUrl=null}
  notify('Công bố bản xem ảnh đại diện…');
  const released=await managedRequest('/v1/assets/'+item.assetId+'/publication',{method:'POST',data:JSON.stringify({publish:true,allowDownload:false})});
  if(released.published!==true||released.originalPrivate!==true)throw Error('R2 chưa xác nhận bản xem');
  item.published=true;
 }
 return 'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/'+item.assetId+'/preview';
},show(record){
 clear();
 if(!record||!documentKinds.has(record.kind))return;
 context={kind:record.kind,id:record.id};
 refresh();
 docStatus('PDF/DOCX tự tạo bản đọc khi Đăng bài hoặc Cập nhật bài. Bản gốc giữ riêng.');
 if(record.id)reloadDocuments();
 if(supportedKinds.has(record.kind)){if(record.id){status('Bạn có thể chọn nhiều ảnh và thêm chú thích.');reloadAlbum()}
 else status('Chọn ảnh ngay; hệ thống sẽ tự lưu hồ sơ và gắn ảnh khi đăng bài.');}
}};
})();`;
