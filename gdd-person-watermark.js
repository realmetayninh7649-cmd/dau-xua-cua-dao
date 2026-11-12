/* GIỮ ĐẠO GIỮA ĐỜI · TIỆM PHỤC CHẾ ẢNH
 * Dấu bản quyền mờ giống tem ánh kim, chỉ đóng lên BẢN TẢI XUỐNG của Hồ sơ Chức sắc.
 * Không viết lại, nén hay sửa ảnh gốc trong Supabase.
 * Chỉ sử dụng Canvas API tại trình duyệt, không gửi ảnh cho dịch vụ khác. */
(()=>{
  'use strict';
  if(window.GDDPersonPhotoWatermark)return;
  const LABEL='GIỮ ĐẠO GIỮA ĐỜI • TIỆM PHỤC CHẾ ẢNH';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

  // Ảnh tem do chủ kho tư liệu cung cấp, tách nền và lưu ngay trong GitHub Pages.
  // Không vẽ chữ hoặc đường vân bằng Canvas: dùng đúng chi tiết của tem mẫu.
  const sealURL=new URL('assets/gdd-guilloche-hologram-7m.svg?v=20261113-foil06',document.baseURI).href;
  let sealImage=null,sealPending=null;
  function ensureSeal(){
    if(sealImage&&sealImage.complete&&sealImage.naturalWidth)return Promise.resolve(sealImage);
    if(sealPending)return sealPending;
    sealPending=new Promise((resolve,reject)=>{
      const image=new Image();
      image.decoding='async';
      image.onload=()=>{
        if(!image.naturalWidth||!image.naturalHeight){reject(new Error('Tài nguyên tem bảo vệ không hợp lệ.'));return;}
        sealImage=image;resolve(image);
      };
      image.onerror=()=>reject(new Error('Không tải được tem hologram bảo vệ. Xin tải lại trang.'));
      image.src=sealURL;
    }).catch(error=>{sealPending=null;throw error;});
    return sealPending;
  }
  function drawSeal(ctx,width,height){
    if(!sealImage?.naturalWidth)throw new Error('Tem hologram chưa sẵn sàng.');
    // Chức Sắc: hai mép tem BÁM THEO MÉP TRÁI và MÉP DƯỚI ẢNH THẬT
    // (không phụ thuộc kích thước màn hình). Dùng CHUNG cho Xem ảnh và Tải ảnh.
    // Độ dài tính theo cạnh ảnh: tem lớn/nhỏ tự thích ứng, không lơ lửng.
    const angle=Math.PI/4;
    const leg=Math.min(width*.45,height*.37);
    const span=leg/Math.SQRT1_2;
    const bandHeight=span*(sealImage.naturalHeight/sealImage.naturalWidth);
    // Cố ý để đầu tem tràn qua khung ảnh vài pixel rồi Canvas tự cắt:
    // hai mép nhìn thấy luôn chạm đúng viền TRÁI và ĐÁY (không có khoảng hở).
    // Hiệu chỉnh theo kích thước ảnh gốc, không theo viewport hoặc px cố định.
    const bleed=Math.max(2,Math.min(width,height)*.006);
    const left=-bleed+bandHeight*.5*Math.sin(angle);
    const top=height+bleed-leg-bandHeight*.5*Math.cos(angle);
    ctx.save();
    ctx.translate(left,top);
    ctx.rotate(angle);
    // SVG Guilloché nền trong suốt, nét màu phản quang 7 sắc; không có mảng xám bẩn.
    ctx.globalAlpha=.90;
    ctx.imageSmoothingEnabled=true;
    if('imageSmoothingQuality' in ctx)ctx.imageSmoothingQuality='high';
    ctx.drawImage(sealImage,0,-bandHeight/2,span,bandHeight);
    ctx.restore();
  }
  async function decodeImage(blob){
    if(!blob||!/^image\/(?:png|jpe?g|webp|avif|gif|bmp)$/i.test(blob.type))
      throw new Error('Tệp này không phải ảnh thông dụng để đóng dấu.');
    const blobUrl=URL.createObjectURL(blob);
    try{
      const image=new Image();
      image.decoding='async';
      image.src=blobUrl;
      await new Promise((resolve,reject)=>{
        if(image.complete){
          if(image.naturalWidth)resolve();
          else reject(new Error('Không giải mã được ảnh gốc.'));
        }else{
          image.onload=resolve;
          image.onerror=()=>reject(new Error('Không giải mã được ảnh gốc.'));
        }
      });
      return image;
    }finally{
      // Đã nạp ảnh vào Image; revoke sau lượt vẽ để Safari giữ tài nguyên.
      setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);
    }
  }

  async function fromBlob(blob){
    await ensureSeal();
    const image=await decodeImage(blob);
    const width=image.naturalWidth,height=image.naturalHeight;
    if(width<1||height<1)throw new Error('Ảnh không có kích thước hợp lệ.');
    const canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;
    const ctx=canvas.getContext('2d',{alpha:true});
    if(!ctx)throw new Error('Thiết bị không hỗ trợ xuất ảnh có dấu ở độ phân giải này.');
    ctx.drawImage(image,0,0,width,height);
    drawSeal(ctx,width,height);
    const type=/^image\/jpe?g$/i.test(blob.type)?'image/jpeg':'image/png';
    const output=await new Promise((resolve,reject)=>{
      try{canvas.toBlob(result=>result?.size?resolve(result):reject(new Error('Không thể xuất ảnh có dấu trên thiết bị này.')),
        type,.95);
      }catch(error){reject(error);}
    });
    canvas.width=0;canvas.height=0;
    return {blob:output,extension:type==='image/jpeg'?'jpg':'png',width,height};
  }

  function fileName(original,label,extension){
    let name='';
    try{ name=decodeURIComponent(new URL(original,location.href).pathname.split('/').pop()||''); }catch{}
    name=name.replace(/\.(?:jpe?g|png|webp|gif|avif|bmp)$/i,'');
    if(!name)name=label||'chuc-sac';
    name=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase()
      .replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90)||'chuc-sac';
    return name+'-giu-dao-giua-doi.'+extension;
  }

  window.GDDPersonPhotoWatermark=Object.freeze({fromBlob,drawSeal,ensureSeal,fileName,label:LABEL});
})();
