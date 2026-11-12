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
    if(!/^https:\/\//i.test(url)||!target){setStatus(panel,'Liên kết hồ sơ chưa hợp lệ.');return;}
    if(typeof window.QRCode!=='function'){
      setStatus(panel,'Chưa tải được bộ tạo QR. Hãy kiểm tra Internet hoặc tải lại trang.');
      return;
    }
    try{
      new window.QRCode(target,{
        text:url,width:196,height:196,
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
  function downloadPNG(panel){
    const qr=$('canvas',panel);
    const code=panel.dataset.archiveCode||'DXCD-TU-LIEU';
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
