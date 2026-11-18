/* DẤU XƯA CỬA ĐẠO · Dấu lưu trữ, không phải dấu bản quyền.
 * Tạo BẢN SAO có lề nhỏ chứa địa chỉ tra cứu và mã định danh.
 * Không sửa nội dung hoặc ghi đè ảnh/document nguyên mẫu.
 */
(() => {
  'use strict';
  if(window.GDDTrace) return;
  const SITE='dauxuacuadao.info.vn';
  const validCode=code=>/^[\p{L}\p{N}._-]{5,120}(?:\/[0-9]{3,})?$/u.test(String(code||''));
  const textFor=code=>SITE+' | '+String(code||'').trim();
  const isStampedURL=url=>/-trace\.(?:jpe?g|png|webp)(?:\?|$)/i.test(String(url||''));

  async function loadPhoto(source){
    const src=source instanceof Blob?URL.createObjectURL(source):String(source||'');
    if(!src)throw Error('Không tìm thấy nguồn ảnh');
    try{
      const im=new Image();
      im.decoding='async';
      if(!(source instanceof Blob))im.crossOrigin='anonymous';
      await new Promise((resolve,reject)=>{
        im.onload=resolve;
        im.onerror=()=>reject(Error('Nguồn ảnh không cho phép tạo bản lưu dấu'));
        im.src=src;
      });
      if(!im.naturalWidth||!im.naturalHeight)throw Error('Tệp không phải ảnh hợp lệ');
      return im;
    }finally{
      // Do NOT revoke yet for a Blob: image decoding may still need the blob on Safari.
      if(source instanceof Blob)setTimeout(()=>URL.revokeObjectURL(src),60000);
    }
  }

  async function stampedBlob(source,code,{maxDimension=3200}={}){
    if(!validCode(code))throw Error('Chưa có mã định danh hợp lệ để lưu dấu');
    const im=await loadPhoto(source);
    // Tối ưu bộ nhớ iPhone, bản gốc đủ độ phân giải luôn giữ nguyên ở R2.
    const limit=Math.min(4000,Math.max(320,maxDimension));
    const factor=Math.min(1,limit/Math.max(im.naturalWidth,im.naturalHeight));
    const w=Math.max(1,Math.round(im.naturalWidth*factor));
    const h=Math.max(1,Math.round(im.naturalHeight*factor));
    const font=Math.max(10,Math.min(39,Math.round(w*.015)));
    const border=Math.max(2,Math.round(font*.45));
    const footerHeight=Math.round(font*2.85+border*2);
    // A4 portrait, photographs and historical documents preserve all image pixels.
    const canvas=document.createElement('canvas');
    canvas.width=w;
    canvas.height=h+footerHeight;
    const context=canvas.getContext('2d',{alpha:false});
    if(!context)throw Error('Thiết bị không hỗ trợ tạo bản lưu dấu');
    context.fillStyle='#FFFFFF';
    context.fillRect(0,0,canvas.width,canvas.height);
    context.drawImage(im,0,0,w,h);
    context.fillStyle='#F7F4EC';
    context.fillRect(0,h,w,footerHeight);
    context.fillStyle='#68766E';
    context.font='500 '+font+'px Georgia, "Times New Roman", serif';
    context.textAlign='center';
    context.textBaseline='middle';
    const message=textFor(code);
    // Scale typography only if needed, never crop a long archive code.
    const measured=context.measureText(message).width;
    const effectiveFont=measured>w*.94?Math.max(8,Math.floor(font*w*.94/measured)):font;
    if(effectiveFont!==font)context.font='500 '+effectiveFont+'px Georgia, "Times New Roman", serif';
    context.fillText(message,w/2,h+footerHeight*.54);
    const blob=await new Promise((resolve,reject)=>
      canvas.toBlob(x=>x?resolve(x):reject(Error('Không thể xuất ảnh lưu dấu')),'image/jpeg',.93)
    );
    canvas.width=0;canvas.height=0;
    return blob;
  }
  function save(blob,name){
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;
    a.download=String(name||'tu-lieu-luu-dau.jpg');
    a.style.display='none';
    document.body.appendChild(a);
    a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  window.GDDTrace=Object.freeze({site:SITE,validCode,textFor,isStampedURL,stampedBlob,save});
})();