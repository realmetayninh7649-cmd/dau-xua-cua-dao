/* GIỮ ĐẠO GIỮA ĐỜI · TIỆM PHỤC CHẾ ẢNH
 * Dấu bản quyền mờ giống tem ánh kim, chỉ đóng lên BẢN TẢI XUỐNG của Hồ sơ Chức sắc.
 * Không viết lại, nén hay sửa ảnh gốc trong Supabase.
 * Chỉ sử dụng Canvas API tại trình duyệt, không gửi ảnh cho dịch vụ khác. */
(()=>{
  'use strict';
  if(window.GDDPersonPhotoWatermark)return;
  const LABEL='GIỮ ĐẠO GIỮA ĐỜI • TIỆM PHỤC CHẾ ẢNH';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

  // Tem guilloché xà cừ: nền trong suốt, vân đan nét mảnh, chữ nổi ánh bạc.
  // Cùng một hàm vẽ được dùng cho ảnh tải và ảnh xem toàn màn hình.
  function drawSeal(ctx,width,height){
    const edge=Math.min(width,height);
    const ribbonWidth=Math.min(width*.84,height*.65);
    const ribbonHeight=clamp(edge*.104,27,132);
    const centerX=width*.245, centerY=height*.80;
    const left=-ribbonWidth/2, top=-ribbonHeight/2;
    const frame=()=>{ctx.beginPath();ctx.rect(left,top,ribbonWidth,ribbonHeight);};

    ctx.save();
    ctx.translate(centerX,centerY);
    ctx.rotate(Math.PI*.248);
    ctx.lineCap='round';
    ctx.lineJoin='round';

    // Foil pastel ánh xà cừ, mỏng như dấu in trên ảnh giấy cổ.
    const foil=ctx.createLinearGradient(left,top,left+ribbonWidth,top+ribbonHeight);
    foil.addColorStop(0,'#a9dffb');
    foil.addColorStop(.14,'#f4bbe8');
    foil.addColorStop(.29,'#f9e8b0');
    foil.addColorStop(.45,'#bfe9e7');
    foil.addColorStop(.61,'#cabdfa');
    foil.addColorStop(.79,'#f5d3b5');
    foil.addColorStop(1,'#b4e6f2');
    ctx.globalAlpha=.23;ctx.fillStyle=foil;frame();ctx.fill();

    // Viền an ninh ba lớp, không tạo dải trắng bệt.
    for(let i=0;i<3;i++){
      const pad=ribbonHeight*(.018+i*.058);
      ctx.beginPath();
      ctx.rect(left+pad,top+pad,ribbonWidth-2*pad,ribbonHeight-2*pad);
      ctx.lineWidth=Math.max(.45,ribbonHeight*(i===0?.014:.007));
      ctx.strokeStyle=i===1?'#dfbdea':i===2?'#c2eeea':'#f8f5ff';
      ctx.globalAlpha=i===0?.60:.46;
      ctx.stroke();
    }

    // Những vân guilloché giao thoa như tem bảo an, không dùng ô vuông.
    ctx.save();frame();ctx.clip();
    const segments=180,threads=36;
    for(let n=0;n<threads;n++){
      ctx.beginPath();
      const y0=top+ribbonHeight*(n+.5)/threads;
      ctx.lineWidth=Math.max(.42,ribbonHeight*.005);
      ctx.strokeStyle=['#fbf6ff','#a7d3f9','#dca9dc','#b1eac7','#f4e2a2'][n%5];
      ctx.globalAlpha=.42;
      for(let j=0;j<=segments;j++){
        const t=j/segments;
        const x=left+t*ribbonWidth;
        const y=y0+
          Math.sin(t*Math.PI*23+n*.32)*ribbonHeight*.084+
          Math.sin(t*Math.PI*8.5-n*.57)*ribbonHeight*.041;
        if(j===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }
    // Rosette ẩn, lặp lại đều như dây tem chống hàng giả.
    for(let k=0;k<9;k++){
      const cx=left+(k+.5)*ribbonWidth/9;
      const cy=(k%2===0?-.06:.06)*ribbonHeight;
      for(let m=0;m<3;m++){
        ctx.beginPath();
        const rx=ribbonHeight*(.28+m*.08),ry=ribbonHeight*(.16+m*.065);
        ctx.strokeStyle=['#f7f4ff','#95d5e2','#f8c2ec'][m];
        ctx.globalAlpha=.30;
        ctx.lineWidth=Math.max(.45,ribbonHeight*.004);
        for(let n=0;n<=64;n++){
          const theta=n/64*Math.PI*2;
          const px=cx+rx*Math.cos(theta*5)*Math.cos(theta);
          const py=cy+ry*Math.sin(theta*5)*Math.sin(theta);
          if(n===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        }
        ctx.stroke();
      }
    }
    ctx.restore();

    // Chữ kim tuyến nổi: bóng tím xám và nét ngà làm rõ trên nền sáng/tối.
    const textWidth=ribbonWidth-ribbonHeight*.28;
    let size=Math.min(51,ribbonHeight*.43);
    ctx.textAlign='center';ctx.textBaseline='middle';
    while(size>10){
      ctx.font='700 '+size+'px Georgia, "Noto Serif", serif';
      if(ctx.measureText(LABEL).width<=textWidth)break;
      size-=.5;
    }
    const metallic=ctx.createLinearGradient(left,0,left+ribbonWidth,0);
    metallic.addColorStop(0,'#efe9ff');
    metallic.addColorStop(.19,'#ffffff');
    metallic.addColorStop(.39,'#f4d1e9');
    metallic.addColorStop(.57,'#fff4d6');
    metallic.addColorStop(.76,'#d8f8ff');
    metallic.addColorStop(1,'#fff2ff');
    ctx.globalAlpha=.58;
    ctx.lineWidth=Math.max(.9,size*.095);
    ctx.strokeStyle='#66516b';
    ctx.strokeText(LABEL,0,ribbonHeight*.012,textWidth);
    ctx.globalAlpha=.87;
    ctx.fillStyle=metallic;
    ctx.shadowColor='rgba(255,250,255,.80)';
    ctx.shadowBlur=Math.max(.5,ribbonHeight*.018);
    ctx.fillText(LABEL,0,0,textWidth);
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

  window.GDDPersonPhotoWatermark=Object.freeze({fromBlob,drawSeal,fileName,label:LABEL});
})();
