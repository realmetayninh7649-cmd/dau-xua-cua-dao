/* GIỮ ĐẠO GIỮA ĐỜI · TIỆM PHỤC CHẾ ẢNH
 * Dấu bản quyền mờ giống tem ánh kim, chỉ đóng lên BẢN TẢI XUỐNG của Hồ sơ Chức sắc.
 * Không viết lại, nén hay sửa ảnh gốc trong Supabase.
 * Chỉ sử dụng Canvas API tại trình duyệt, không gửi ảnh cho dịch vụ khác. */
(()=>{
  'use strict';
  if(window.GDDPersonPhotoWatermark)return;
  const LABEL='GIỮ ĐẠO GIỮA ĐỜI • TIỆM PHỤC CHẾ ẢNH';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

  function drawSeal(ctx,width,height){
    const edge=Math.min(width,height);
    const ribbonWidth=Math.min(width*.94,height*.76);
    const ribbonHeight=clamp(edge*.115,32,170);
    const centerX=width*.285;
    const centerY=height*.78;

    ctx.save();
    ctx.translate(centerX,centerY);
    ctx.rotate(Math.PI/4); // dải chéo từ góc trái xuống góc phải dưới
    const left=-ribbonWidth/2,top=-ribbonHeight/2;
    const frame=()=>{ctx.beginPath();ctx.rect(left,top,ribbonWidth,ribbonHeight);};

    // Nền xà cừ xuyên thấu, không có mảng đen và không che chân dung.
    const iridescent=ctx.createLinearGradient(left,top,left+ribbonWidth,top+ribbonHeight);
    iridescent.addColorStop(0,'#b3d8ec');
    iridescent.addColorStop(.17,'#e9bef1');
    iridescent.addColorStop(.33,'#f3e0a1');
    iridescent.addColorStop(.48,'#c8f4e5');
    iridescent.addColorStop(.66,'#c9cbf1');
    iridescent.addColorStop(.82,'#f3cbb9');
    iridescent.addColorStop(1,'#c0e6f1');
    ctx.globalAlpha=.16;
    ctx.fillStyle=iridescent;
    frame();ctx.fill();

    // Hai viền kép và guilloché/đường an ninh sóng mịn.
    ctx.globalAlpha=.31;
    ctx.strokeStyle='#f6faff';
    ctx.lineWidth=Math.max(1,ribbonHeight*.012);
    frame();ctx.stroke();
    ctx.strokeStyle='#b7a3d1';
    ctx.lineWidth=Math.max(.7,ribbonHeight*.008);
    ctx.strokeRect(left+ribbonHeight*.06,top+ribbonHeight*.06,
      ribbonWidth-ribbonHeight*.12,ribbonHeight*.88);

    ctx.save();frame();ctx.clip();
    const waves=22,segments=150;
    for(let line=0;line<waves;line++){
      const y0=top+ribbonHeight*(line+.5)/waves;
      ctx.beginPath();
      ctx.strokeStyle=line%3===0?'#f6f9ff':line%3===1?'#b5ddf8':'#e9bcda';
      ctx.globalAlpha=line%3===0?.31:.24;
      ctx.lineWidth=Math.max(.65,ribbonHeight*.006);
      for(let step=0;step<=segments;step++){
        const frac=step/segments;
        const px=left+frac*ribbonWidth;
        const py=y0+Math.sin(frac*Math.PI*14+line*.63)*ribbonHeight*.19
          +Math.sin(frac*Math.PI*7-line*.39)*ribbonHeight*.065;
        if(step===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.stroke();
    }
    ctx.restore();

    // Chữ nổi xà cừ: đủ nhìn thấy nhưng độ mờ gần mẫu giấy ảnh cổ.
    let fontSize=Math.min(45,ribbonHeight*.38);
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    while(fontSize>10){
      ctx.font='700 '+fontSize+'px Georgia, "Noto Serif", serif';
      if(ctx.measureText(LABEL).width<=ribbonWidth-ribbonHeight*.24)break;
      fontSize-=.5;
    }
    const tint=ctx.createLinearGradient(left,0,left+ribbonWidth,0);
    tint.addColorStop(0,'#f8ebed');
    tint.addColorStop(.25,'#fffef9');
    tint.addColorStop(.53,'#fcf1c8');
    tint.addColorStop(.75,'#f1faff');
    tint.addColorStop(1,'#fae8f9');
    ctx.globalAlpha=.30;
    ctx.strokeStyle='#7b819d';
    ctx.lineJoin='round';
    ctx.lineWidth=Math.max(.7,fontSize*.11);
    ctx.strokeText(LABEL,0,ribbonHeight*.015);
    ctx.globalAlpha=.39;
    ctx.fillStyle=tint;
    ctx.shadowColor='#f3eaf8';
    ctx.shadowBlur=Math.max(1,ribbonHeight*.04);
    ctx.fillText(LABEL,0,0);
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

  window.GDDPersonPhotoWatermark=Object.freeze({fromBlob,fileName,label:LABEL});
})();
