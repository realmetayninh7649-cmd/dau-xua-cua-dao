export const PHOTO_JS=String.raw`/* Multi-image editor for Access-authenticated working D1.
 * Originals go to the private R2 vault. Only approved optimized previews are linked.
 * No removal of R2 original objects, no old-gallery deletion, no Supabase calls.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const supported=new Set(['image/jpeg','image/png','image/webp']);
const supportedKinds=new Set(['people','posts','media','videos','obituaries','documents']);
const limits={each:24*1048576};
let queue=[],context=null,busy=false,loadId=0;
function status(message){$('work-photo-status').textContent=message}
function clear(){
 loadId++;
 for(const item of queue)if(item.previewUrl)URL.revokeObjectURL(item.previewUrl);
 queue=[];context=null;busy=false;
 $('work-photo-files').value='';$('work-photo-confirm').checked=false;
 $('work-photo-queue').replaceChildren();$('work-photo-album').replaceChildren();
 $('work-photo-existing').open=false;$('work-photo-count').textContent=' · 0 ảnh';
 $('work-photo-panel').hidden=true;
}
function refresh(){
 const allowed=!!context&&supportedKinds.has(context.kind);
 $('work-photo-panel').hidden=!allowed;
 if(!allowed)return;
 const active=!!context.id&&!busy;
 $('work-photo-files').disabled=!active;
 $('work-photo-confirm').disabled=!active;
 $('work-photo-upload').disabled=!active||!$('work-photo-confirm').checked||!queue.some(x=>!x.done);
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
 if(!context?.id||busy){status('Hãy lưu bản nháp trước khi chọn ảnh.');return}
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
 $('work-photo-confirm').checked=false;
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
async function uploadBatch(){
 if(!context?.id){status('Hãy lưu bản nháp trước.');return}
 if(!queue.some(photo=>!photo.done)||busy)return;
 if(!$('work-photo-confirm').checked){status('Xin xác nhận việc công bố bản xem ảnh.');return}
 if(!confirm('Xác nhận công bố BẢN XEM ảnh và gắn vào bài này? Bản gốc R2 vẫn riêng tư.'))return;
 busy=true;render();
 const kind=context.kind,id=context.id,activeContext=context;
 let doneCount=0;
 try{
  for(let i=0;i<queue.length;i++){
   if(context!==activeContext)return;
   const photo=queue[i];if(photo.done)continue;
   const progress=message=>status('Ảnh '+(i+1)+'/'+queue.length+': '+message);
   try{
    if(!photo.assetId)photo.assetId=await archiveOriginal(photo.file,progress);
    if(!photo.published){
      progress('Tạo bản xem nhẹ…');
      await uploadPreview(photo);
      progress('Công bố bản xem đã xác nhận…');
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
     status('Ảnh '+(i+1)+' chưa xong: '+photo.error+'. Nhấn tải lại để thử tiếp, không tải lại bản gốc đã lưu.');
     break;
   }
  }
  await reloadAlbum();
  if(queue.every(photo=>photo.done))
   status('Đã gắn '+queue.length+' ảnh vào bài. Bộ ảnh hiển thị khi bài công bố; bản gốc vẫn riêng tư.');
  else if(doneCount)status('Đã gắn '+doneCount+' ảnh; còn ảnh chưa xong. Có thể tải tiếp.');
 }finally{if(context===activeContext){busy=false;render()}}
}
$('work-photo-files').addEventListener('change',select);
$('work-photo-confirm').addEventListener('change',refresh);
$('work-photo-upload').addEventListener('click',uploadBatch);
window.GDDPhotoAlbum={reset:clear,isBusy:()=>busy,async uploadCover(file,notify,item={}){
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
 if(!record||!supportedKinds.has(record.kind))return;
 context={kind:record.kind,id:record.id};
 refresh();
 if(record.id){status('Bạn có thể chọn nhiều ảnh và thêm chú thích.');reloadAlbum()}
 else status('Lưu bản nháp rồi chọn nhiều ảnh để gắn đúng hồ sơ.');
}};
})();`;
