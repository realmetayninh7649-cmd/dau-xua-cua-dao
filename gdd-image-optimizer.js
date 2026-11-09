(function GDDImageOptimizer(){
  "use strict";
  if(window.GDDImageOptimizer)return;
  const MAX_BYTES=5700000; // Below 6 decimal MB and below 6 MiB Supabase bucket limit
  const MAX_EDGE=5200;
  const MAX_PIXELS=15500000; // keep below the ~16 MP canvas ceiling on older iPhone Safari
  const MIME={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
  const IMAGE_TYPES=new Set([...Object.keys(MIME),"image/heic","image/heif"]);
  const HEIC=/\.(?:heic|heif)$/i;
  const MB=n=>(n/1000000).toFixed(2)+" MB";
  const extFromName=n=>String(n||"").toLowerCase().split(".").pop();
  const detectType=file=>{
    if(IMAGE_TYPES.has(file.type))return file.type;
    const ext=extFromName(file.name);
    if(ext==="jpg"||ext==="jpeg")return "image/jpeg";
    if(ext==="png")return "image/png";
    if(ext==="webp")return "image/webp";
    if(ext==="heic")return "image/heic";
    if(ext==="heif")return "image/heif";
    return "";
  };
  const report=(fn,message)=>{if(typeof fn==="function")fn(message)};
  const blobFromCanvas=(canvas,mime,quality)=>new Promise(resolve=>{
    canvas.toBlob(blob=>resolve(blob&&blob.type===mime?blob:null),mime,quality);
  });
  function makeFile(blob,input,name){
    const suffix=MIME[blob.type]||"jpg";
    const raw=String(input.name||name||"anh-tu-lieu").replace(/\.[^.]*$/,"");
    const safe=raw.slice(0,120)+"-toi-uu."+suffix;
    return new File([blob],safe,{type:blob.type,lastModified:input.lastModified||Date.now()});
  }
  async function prepare(file,{onProgress}={}){
    if(!file||typeof file.size!=="number"||file.size===0)throw Error("Ảnh bị trống hoặc không đọc được.");
    const mime=detectType(file);
    if(!mime)throw Error("Chỉ hỗ trợ ảnh JPEG, PNG, WebP. Với ảnh HEIC, trình duyệt cần hỗ trợ đọc ảnh.");
    if(MIME[mime]&&file.type===mime&&file.size<=MAX_BYTES){
      return {file,changed:false,originalBytes:file.size,storedBytes:file.size};
    }
    if(typeof document==="undefined"||typeof Image==="undefined"||typeof URL?.createObjectURL!=="function")
      throw Error("Trình duyệt này chưa hỗ trợ tự tối ưu ảnh.");
    report(onProgress,"Đang đọc ảnh gốc "+MB(file.size)+"…");
    const url=URL.createObjectURL(file),img=new Image();
    let canvas=null;
    try{
      await new Promise((resolve,reject)=>{
        img.onload=resolve;
        img.onerror=()=>reject(Error("Không đọc được định dạng ảnh này. Nếu dùng HEIC, hãy xuất ảnh sang JPEG từ ứng dụng Ảnh rồi thử lại."));
        img.src=url;
      });
      const width=img.naturalWidth,height=img.naturalHeight;
      if(!width||!height)throw Error("Không xác định được độ phân giải ảnh.");
      const limit=Math.min(1,MAX_EDGE/Math.max(width,height),Math.sqrt(MAX_PIXELS/(width*height)));
      let factor=limit;
      // Transparent originals remain transparent in WebP or PNG; never flatten against a white background.
      const hasPossibleAlpha=mime==="image/png"||mime==="image/webp";
      const preferred=hasPossibleAlpha?"image/webp":"image/jpeg";
      const alt=hasPossibleAlpha?"image/png":"image/webp";
      const steps=[0.96,0.93,0.90,0.86,0.81,0.75,0.68,0.60];
      for(let sizeTry=0;sizeTry<9;sizeTry++){
        const w=Math.max(1,Math.round(width*factor)),h=Math.max(1,Math.round(height*factor));
        canvas=document.createElement("canvas");
        canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext("2d",{alpha:hasPossibleAlpha});
        if(!ctx)throw Error("Điện thoại không đủ bộ nhớ để tối ưu ảnh này.");
        ctx.imageSmoothingEnabled=true;
        ctx.imageSmoothingQuality="high";
        ctx.drawImage(img,0,0,w,h);
        report(onProgress,"Đang tối ưu "+w+" × "+h+" px…");
        const availableTypes=[preferred,alt];
        for(const kind of availableTypes){
          if(kind==="image/jpeg"&&hasPossibleAlpha)continue;
          // PNG has no lossy quality knob, so only one PNG encode is needed.
          const qualities=kind==="image/png"?[undefined]:steps;
          for(const q of qualities){
            const blob=await blobFromCanvas(canvas,kind,q);
            if(!blob)continue;
            if(blob.size<=MAX_BYTES){
              const output=makeFile(blob,file,"anh");
              report(onProgress,"Đã tối ưu "+MB(file.size)+" → "+MB(output.size)+" ("+w+" × "+h+" px).");
              return {file:output,changed:true,originalBytes:file.size,storedBytes:output.size,width:w,height:h,sourceWidth:width,sourceHeight:height};
            }
          }
        }
        // Release backing canvas between attempts to protect iPhone memory.
        canvas.width=0;canvas.height=0;canvas=null;
        factor*=0.82;
        if(Math.max(width*factor,height*factor)<950)break;
      }
      throw Error("Ảnh quá phức tạp để giảm dưới 6 MB mà vẫn giữ độ nét. Hãy xuất bản JPEG chất lượng cao và thử lại.");
    }catch(error){
      if(error instanceof Error)throw error;
      throw Error("Không thể tối ưu ảnh trên thiết bị này.");
    }finally{
      if(canvas){canvas.width=0;canvas.height=0}
      img.onload=null;img.onerror=null;
      URL.revokeObjectURL(url);
    }
  }
  window.GDDImageOptimizer=Object.freeze({
    MAX_BYTES,accept:"image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif",
    prepare,detectType,MB
  });
})();