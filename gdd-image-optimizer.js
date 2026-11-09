(function InstallGDDImageOptimizer(){
 'use strict';
 if(window.GDDImageOptimizer)return;
 const LIMIT=6*1024*1024;
 const TARGET=Math.floor(5.65*1024*1024);
 const EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
 const mimeFor=file=>{
  const type=String(file?.type||'').toLowerCase();
  if(['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(type))return type;
  const ext=String(file?.name||'').split('.').pop().toLowerCase();
  return ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',heic:'image/heic',heif:'image/heif'})[ext]||'';
 };
 const isImage=file=>Boolean(file&&mimeFor(file));
 const mb=n=>(n/1048576).toFixed(2)+' MB';
 const report=(onStatus,message)=>{if(typeof onStatus==='function')try{onStatus(message)}catch{}};
 async function loadPixels(file){
  if(typeof createImageBitmap==='function'){
   try{
    const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
    if(bitmap.width&&bitmap.height)return {image:bitmap,width:bitmap.width,height:bitmap.height,cleanup:()=>bitmap.close?.()};
    bitmap.close?.();
   }catch{}
  }
  const url=URL.createObjectURL(file);
  try{
   const img=await new Promise((resolve,reject)=>{
    const element=new Image();element.onload=()=>resolve(element);
    element.onerror=()=>reject(new Error('Thiết bị không đọc được định dạng ảnh này.'));
    element.src=url;
   });
   if(!(img.naturalWidth&&img.naturalHeight))throw Error('Không lấy được kích thước ảnh.');
   return {image:img,width:img.naturalWidth,height:img.naturalHeight,cleanup:()=>URL.revokeObjectURL(url)};
  }catch(error){URL.revokeObjectURL(url);throw error}
 }
 async function encode(canvas,mime,quality){
  return await new Promise((resolve,reject)=>{
   try{canvas.toBlob(blob=>blob&&blob.size?resolve(blob):reject(Error('Trình duyệt không mã hóa được ảnh.')),mime,quality)}
   catch(error){reject(error)}
  });
 }
 async function prepare(file,options={}){
  if(!file||!file.size)throw Error('Không thể xử lý tệp ảnh rỗng.');
  const inputType=mimeFor(file);
  if(!inputType)throw Error('Chỉ nhận ảnh JPG, PNG, WebP hoặc HEIC/HEIF được thiết bị hỗ trợ.');
  const progress=options.onStatus||options.onProgress;
  if(file.size<=LIMIT&&EXT[inputType]){
   if(file.type===inputType)return file;
   return new File([file],file.name,{type:inputType,lastModified:file.lastModified||Date.now()});
  }
  report(progress,'Đang tối ưu ảnh '+file.name+' ('+mb(file.size)+')...');
  let decoded;
  try{decoded=await loadPixels(file)}
  catch(error){throw Error('Không giải mã được '+file.name+' trên thiết bị này. Hãy thử xuất ảnh sang JPEG rồi chọn lại.')}
  const smallScreen=/iPhone|iPad|Android|Mobile/i.test(navigator.userAgent||'');
  const maxPixels=smallScreen?15000000:28000000;
  const maxSide=smallScreen?5600:7500;
  const originalPixels=decoded.width*decoded.height;
  const ratio=Math.min(1,Math.sqrt(maxPixels/originalPixels),maxSide/Math.max(decoded.width,decoded.height));
  let width=Math.max(1,Math.round(decoded.width*ratio));
  let height=Math.max(1,Math.round(decoded.height*ratio));
  const canvas=document.createElement('canvas');
  let best=null,outputType=inputType==='image/png'?'image/webp':(EXT[inputType]?inputType:'image/jpeg');
  try{
   const context=canvas.getContext('2d',{alpha:true});
   if(!context)throw Error('Trình duyệt không hỗ trợ xử lý ảnh.');
   context.imageSmoothingEnabled=true;
   context.imageSmoothingQuality='high';
   // Work in one canvas at a time to limit iPhone/Android memory use.
   for(let attempt=0;attempt<12;attempt++){
    canvas.width=width;canvas.height=height;
    context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
    context.drawImage(decoded.image,0,0,width,height);
    report(progress,'Đang tối ưu ảnh '+file.name+' – giữ '+width+' × '+height+' px...');
    let previousSize=Infinity;
    for(const q of [0.94,0.88,0.81]){
     let blob=await encode(canvas,outputType,q);
     // Browsers that cannot encode WebP may silently return a PNG. Keep transparency in that case.
     if(blob.type!==outputType){
      if(outputType==='image/webp'){
       outputType='image/png';
       blob=await encode(canvas,outputType,q);
      }else throw Error('Trình duyệt không hỗ trợ định dạng xuất ảnh.');
     }
     if(blob.size<previousSize)previousSize=blob.size;
     if(blob.size<=TARGET){
      const suffix=EXT[outputType]||'jpg';
      const basename=String(file.name||'anh-tu-lieu').replace(/\.[^.]+$/,'')||'anh-tu-lieu';
      const optimized=new File([blob],basename+'.'+suffix,{type:outputType,lastModified:Date.now()});
      report(progress,'Đã tối ưu '+file.name+': '+mb(file.size)+' → '+mb(optimized.size)+' · '+width+' × '+height+' px.');
      return optimized;
     }
     best=blob;
    }
    // Prefer a moderate-quality image with more pixels over an overly compressed image.
    const fit=Math.sqrt(TARGET/Math.max(previousSize,1))*.94;
    const factor=Math.max(.66,Math.min(.86,fit));
    const nextWidth=Math.max(1,Math.floor(width*factor));
    const nextHeight=Math.max(1,Math.floor(height*factor));
    if(width<=480||height<=480||nextWidth===width||nextHeight===height)break;
    width=nextWidth;height=nextHeight;
    await Promise.resolve();
   }
   throw Error('Ảnh quá phức tạp để đạt dưới 6 MB mà vẫn giữ độ nét phù hợp.');
  }finally{
   canvas.width=0;canvas.height=0;
   decoded.cleanup();
   best=null;
  }
 }
 window.GDDImageOptimizer=Object.freeze({prepare,isImage,mimeFor,MAX_UPLOAD_BYTES:LIMIT,describeSize:mb});
})();