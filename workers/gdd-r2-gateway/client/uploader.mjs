// GDDĐ v2.0.0-DK01.2 — thư viện tải tư liệu dành cho Quản trị viên.
// Không tự chạy; bước tích hợp vào giao diện Quản trị sẽ tiến hành sau kiểm thử.
const DEFAULT_API = 'https://gdd-r2-gateway.realmetayninh7649.workers.dev';
const MAX_VARIANT_BYTES = 8 * 1024 * 1024;
const UUID=/^[a-f0-9-]{36}$/i;
function emit(callback,info){if(typeof callback==='function')callback(info)}
function asError(status,body){return Error((body?.error||'Lỗi máy chủ')+' (HTTP '+status+')')}
async function call(supabase,endpoint,path,method,body,type){
  const {data,error}=await supabase.auth.getSession();
  if(error||!data?.session?.access_token)throw Error('Phiên đăng nhập đã hết hạn, hãy đăng nhập lại.');
  const headers={authorization:'Bearer '+data.session.access_token};
  if(type)headers['content-type']=type;
  const response=await fetch(endpoint+path,{method,headers,body,cache:'no-store',mode:'cors',credentials:'omit'});
  const payload=await response.json().catch(()=>({error:'Máy chủ không trả về JSON'}));
  if(!response.ok)throw asError(response.status,payload);
  return payload;
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function retry(fn,count=4){
  let err;
  for(let i=0;i<count;i++){
    try{return await fn()}catch(e){
      err=e;
      // Auth không hợp lệ hoặc định dạng bị từ chối thì không thử lại.
      if(/\(HTTP 4(?:00|01|03|04|13|15|22)\)/.test(String(e)))throw e;
      if(i<count-1)await delay(Math.min(8000,600*Math.pow(2,i)));
    }
  }
  throw err;
}
function blobToImage(file) {
  if(typeof createImageBitmap==='function')return createImageBitmap(file);
  // Safari cũ: sử dụng đối tượng URL; KHÔNG sửa nội dung tệp.
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Trình duyệt không hỗ trợ giải mã ảnh này'))};
    img.src=url;
  });
}
function canvasBlob(canvas,mime,quality){
  return new Promise((resolve,reject)=>canvas.toBlob(b=>{
    if(!b||b.type!==mime)reject(Error('Không mã hóa được bản ảnh xem; bản gốc vẫn an toàn.'));
    else resolve(b);
  },mime,quality));
}
export async function createImageVariant(file,variant){
  if(!['preview','download'].includes(variant))throw Error('Loại bản ảnh không hợp lệ');
  const src=await blobToImage(file);
  try{
    const w=src.naturalWidth||src.width,h=src.naturalHeight||src.height;
    if(!w||!h)throw Error('Không nhận dạng được kích thước ảnh.');
    const edge=variant==='preview'?1500:3000;
    const ratio=Math.min(1,edge/Math.max(w,h)); // không phóng lớn ảnh nguồn.
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(w*ratio));
    canvas.height=Math.max(1,Math.round(h*ratio));
    const ctx=canvas.getContext('2d',{alpha:variant==='preview'});
    if(!ctx)throw Error('Trình duyệt không thể mở bộ xử lý ảnh.');
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    if(variant==='download'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height)}
    ctx.drawImage(src,0,0,canvas.width,canvas.height);
    const mime=variant==='preview'?'image/webp':'image/jpeg';
    let blob=await canvasBlob(canvas,mime,variant==='preview'?.85:.93);
    if(blob.size>MAX_VARIANT_BYTES){
      blob=await canvasBlob(canvas,mime,variant==='preview'?.75:.82);
    }
    if(blob.size>MAX_VARIANT_BYTES)throw Error('Ảnh xem lớn hơn 8 MB; cần tạo bản tối ưu khác.');
    return {blob,width:canvas.width,height:canvas.height,kind:variant};
  }finally{
    if(typeof src.close==='function')src.close();
  }
}
const json=body=>JSON.stringify(body);
export async function uploadPreservedAsset(file,{supabase,endpoint=DEFAULT_API,onProgress,onSession,resumeSession}={}){
  if(!file||!file.name||!Number.isSafeInteger(file.size)||file.size<1)throw Error('Chưa chọn tệp hợp lệ');
  if(!supabase?.auth?.getSession)throw Error('Cần phiên Quản trị viên Supabase');
  endpoint=endpoint.replace(/\/$/,'');
  let final;
  if(file.size<=6*1024*1024){
    // iPhone/iPad: upload in a single request, preserving every original byte.
    // Ignore stale localStorage multipart sessions from older versions.
    const qs=new URLSearchParams({name:file.name,size:String(file.size)});
    final=await retry(()=>call(supabase,endpoint,'/v1/uploads/small?'+qs,'PUT',file,'application/octet-stream'));
    emit(onProgress,{phase:'original',finishedParts:1,totalParts:1,bytes:file.size,total:file.size});
  }else{
  let session=resumeSession||await call(supabase,endpoint,'/v1/uploads/start','POST',
    json({name:file.name,size:file.size}), 'application/json');
  if(!session.key||!UUID.test(session.id)||!session.uploadId||!Number.isSafeInteger(session.partBytes))throw Error('Phiên tải lên không hợp lệ');
  if(session.originalSize!==file.size)throw Error('Kích thước tệp không khớp phiên đang tiếp tục');
  const parts=new Map((session.uploadedParts||[]).map(p=>[p.partNumber,p]));
  emit(onSession,{...session,uploadedParts:[...parts.values()]});
  const partBytes=session.partBytes,partCount=Math.ceil(file.size/partBytes);
  for(let n=1;n<=partCount;n++){
    if(parts.has(n))continue;
    const begin=(n-1)*partBytes,end=Math.min(file.size,n*partBytes);
    const blob=file.slice(begin,end);
    const qs=new URLSearchParams({key:session.key,uploadId:session.uploadId,part:String(n)});
    const part=await retry(()=>call(supabase,endpoint,'/v1/uploads/part?'+qs,'PUT',blob,'application/octet-stream'));
    parts.set(n,part);
    emit(onSession,{...session,uploadedParts:[...parts.values()]});
    emit(onProgress,{phase:'original',finishedParts:parts.size,totalParts:partCount,bytes:Math.min(file.size,parts.size*partBytes),total:file.size});
  }
  final=await call(supabase,endpoint,'/v1/uploads/complete','POST',
    json({key:session.key,uploadId:session.uploadId,size:file.size,parts:[...parts.values()].sort((a,b)=>a.partNumber-b.partNumber)}),'application/json');
  }
  emit(onProgress,{phase:'original-preserved',bytes:file.size,total:file.size});
  const ext=file.name.split('.').pop().toLowerCase();
  const images=new Set(['jpeg','jpg','png','webp','gif','tif','tiff','heic','heif','avif']);
  const result={...final,status:'original-preserved',previewReady:false,downloadReady:false,
    originalDownloadPublic:false};
  if(images.has(ext)){
    const problems=[];
    for(const variant of ['preview','download']){
      try{
        emit(onProgress,{phase:'optimizing',variant});
        const output=await createImageVariant(file,variant);
        await retry(()=>call(supabase,endpoint,'/v1/assets/'+final.id+'/'+variant,'PUT',output.blob,output.blob.type));
        result[variant+'Ready']=true;
        emit(onProgress,{phase:'optimized',variant,bytes:output.blob.size});
      }catch(e){problems.push(variant+': '+(e?.message||e));emit(onProgress,{phase:'optimized-error',variant,message:String(e?.message||e)})}
    }
    result.optimizationWarnings=problems;
    result.status=problems.length?'original-preserved-preview-pending':'original-and-optimized';
  } else {
    // PDF/Word không nén gây mất nét, không công khai bản gốc.
    // Xem PDF/Word sẽ được nối với trình đọc ở giai đoạn tích hợp.
    result.status='document-original-preserved-viewer-pending';
  }
  return result;
}
