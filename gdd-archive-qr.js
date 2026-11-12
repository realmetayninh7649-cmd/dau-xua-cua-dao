/* GIỮ ĐẠO GIỮA ĐỜI — QR cho hồ sơ đã cấp mã trong Supabase.
 * Chỉ mã hoá liên kết ngay tại trình duyệt; không đưa thông tin lên dịch vụ QR ngoài. */
(() => {
  'use strict';
  const $ = (selector,root=document) => root.querySelector(selector);
  const setStatus=(panel,text)=>{const el=$('[data-gdd-qr-status]',panel);if(el)el.textContent=text;};
  function initQR(){
    const detail=$('#detail-content');
    if(!detail)return;
    const panel=$('[data-gdd-archive-qr]',detail);
    if(!panel||panel.dataset.gddQrInitialized==='1')return;
    panel.dataset.gddQrInitialized='1';
    const url=panel.dataset.archiveUrl||'';
    const target=$('[data-gdd-qr-graphic]',panel);
    // Website công khai phải là HTTPS; riêng localhost cho phép HTTP để kiểm thử QR.
    let validUrl=false;
    try{
      const parsed=new URL(url);
      validUrl=parsed.protocol==='https:'||
        (parsed.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(parsed.hostname));
    }catch{}
    if(!validUrl||!target){setStatus(panel,'Liên kết hồ sơ chưa hợp lệ.');return;}
    if(typeof window.QRCode!=='function'){
      setStatus(panel,'Chưa tải được bộ tạo QR. Hãy kiểm tra Internet hoặc tải lại trang.');
      return;
    }
    try{
      new window.QRCode(target,{
        text:url,width:panel.classList.contains('gdd-archive-qr--person')?160:196,height:panel.classList.contains('gdd-archive-qr--person')?160:196,
        colorDark:'#10201b',colorLight:'#ffffff',
        correctLevel:window.QRCode.CorrectLevel.M
      });
      setStatus(panel,'Mã QR dẫn đến đúng hồ sơ, không phải ảnh hoặc tệp đính kèm.');
    }catch(err){
      console.warn('[GDD QR]',err);
      setStatus(panel,'Chưa tạo được QR. Có thể sao chép liên kết bên dưới.');
    }
  }
  async function copyUrl(url){
    if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);return;}
    const field=document.createElement('textarea');
    field.value=url;field.style.cssText='position:fixed;left:-9999px';
    document.body.appendChild(field);field.select();
    const ok=document.execCommand('copy');field.remove();
    if(!ok)throw Error('Trình duyệt không hỗ trợ sao chép.');
  }
  function wrappedText(ctx,value,maxWidth,maxLines){
    const words=String(value||'').trim().split(/\s+/).filter(Boolean);
    const lines=[];
    let current='';
    for(const word of words){
      const candidate=current?current+' '+word:word;
      if(ctx.measureText(candidate).width<=maxWidth||!current){current=candidate;continue;}
      lines.push(current);
      current=word;
    }
    if(current)lines.push(current);
    if(lines.length>maxLines){
      const kept=lines.slice(0,maxLines);
      kept[maxLines-1]=lines.slice(maxLines-1).join(' ');
      while(ctx.measureText(kept[maxLines-1]).width>maxWidth&&kept[maxLines-1].length>2)
        kept[maxLines-1]=kept[maxLines-1].slice(0,-2)+'…';
      return kept;
    }
    return lines;
  }
  function downloadPersonPNG(panel,qr,code){
    const name=panel.dataset.archiveName||'Hồ sơ Chức sắc';
    const output=document.createElement('canvas'),ctx=output.getContext('2d');
    if(!ctx)throw Error('Thiết bị không hỗ trợ xuất ảnh QR.');
    output.width=1400;output.height=1400;
    ctx.fillStyle='#fffef9';ctx.fillRect(0,0,1400,1400);
    ctx.lineWidth=5;ctx.strokeStyle='#cabd9c';ctx.strokeRect(50,50,1300,1300);
    ctx.lineWidth=2;ctx.strokeStyle='#e5e2d8';ctx.strokeRect(67,67,1266,1266);
    ctx.textAlign='center';
    ctx.fillStyle='#154d46';
    ctx.font='bold 45px sans-serif';
    ctx.fillText('ĐẠI ĐẠO TAM KỲ PHỔ ĐỘ',700,139);
    ctx.fillStyle='#886d42';ctx.font='bold 37px sans-serif';
    ctx.fillText('KHO TƯ LIỆU ĐẠO SỬ',700,206);
    ctx.fillStyle='#ffffff';ctx.fillRect(282,245,836,836);
    ctx.strokeStyle='#e5e2d8';ctx.lineWidth=2;ctx.strokeRect(282,245,836,836);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(qr,350,313,700,700);
    ctx.fillStyle='#154d46';ctx.font='bold 40px sans-serif';
    const lines=wrappedText(ctx,name.toUpperCase(),1220,2);
    const start=lines.length>1?1142:1172;
    lines.forEach((line,i)=>ctx.fillText(line,700,start+i*49,1220));
    ctx.fillStyle='#52675c';ctx.font='30px sans-serif';
    ctx.fillText('Mã hồ sơ:',700,1273);
    ctx.fillStyle='#154d46';ctx.font='bold 34px sans-serif';
    ctx.fillText(code,700,1320,1210);
    const link=document.createElement('a');
    link.download=code.replace(/[\\/:*?"<>|]/g,'-')+'.png';
    link.href=output.toDataURL('image/png');
    document.body.appendChild(link);link.click();link.remove();
    setStatus(panel,'Đã tạo thẻ QR PNG với tên và mã hồ sơ.');
  }
  function downloadPNG(panel){
    const qr=$('canvas',panel);
    const code=panel.dataset.archiveCode||'DXCD-TU-LIEU';
    if(panel.classList.contains('gdd-archive-qr--person')&&qr){downloadPersonPNG(panel,qr,code);return;}
    if(!qr){setStatus(panel,'QR chưa sẵn sàng. Xin tải lại trang để thử.');return;}
    const output=document.createElement('canvas'),ctx=output.getContext('2d');
    output.width=1200;output.height=1350;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,output.width,output.height);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(qr,120,120,960,960);
    ctx.fillStyle='#172c24';ctx.textAlign='center';
    ctx.font='bold 34px sans-serif';ctx.fillText('DẤU XƯA CỬA ĐẠO',600,1150);
    ctx.font='28px monospace';ctx.fillText(code,600,1210);
    ctx.font='24px sans-serif';ctx.fillText('Quét để xem hồ sơ tư liệu',600,1260);
    const a=document.createElement('a');a.download=code+'.png';a.href=output.toDataURL('image/png');
    document.body.appendChild(a);a.click();a.remove();
    setStatus(panel,'Đã tạo ảnh QR PNG. Trên iPhone, chọn Lưu ảnh hoặc Lưu vào Tệp nếu trình duyệt hỏi.');
  }
  function start(){
    const detail=$('#detail-content');
    if(!detail)return;
    new MutationObserver(initQR).observe(detail,{childList:true,subtree:true});
    initQR();
    document.addEventListener('click',async e=>{
      const button=e.target.closest('[data-gdd-qr-copy],[data-gdd-qr-download]');
      if(!button)return;
      const panel=button.closest('[data-gdd-archive-qr]');
      if(!panel)return;
      e.preventDefault();
      try{
        if(button.hasAttribute('data-gdd-qr-download'))downloadPNG(panel);
        else{await copyUrl(panel.dataset.archiveUrl||'');setStatus(panel,'Đã sao chép liên kết hồ sơ.');}
      }catch(err){setStatus(panel,'Không thực hiện được: '+(err.message||'Vui lòng thử lại.'));}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
