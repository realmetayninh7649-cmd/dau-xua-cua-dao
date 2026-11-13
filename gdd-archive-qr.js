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
  function renderPersonPNG(panel,qr,code){
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
    return output;
  }
  // Giữ nguyên bố cục QR; trả canvas thay vì giả định rằng link data: đã tải thành công.
  function renderStandardPNG(qr,code){
    const output=document.createElement('canvas'),ctx=output.getContext('2d');
    if(!ctx)throw Error('Thiết bị không hỗ trợ xuất ảnh QR.');
    output.width=1200;output.height=1350;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,output.width,output.height);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(qr,120,120,960,960);
    ctx.fillStyle='#172c24';ctx.textAlign='center';
    ctx.font='bold 34px sans-serif';ctx.fillText('DẤU XƯA CỬA ĐẠO',600,1150);
    ctx.font='28px monospace';ctx.fillText(code,600,1210);
    ctx.font='24px sans-serif';ctx.fillText('Quét để xem hồ sơ tư liệu',600,1260);
    return output;
  }
  function pngFile(canvas,code){
    // Đổi data: sang File/Blob thật NGAY trong thao tác nhấn.
    // iOS Safari/WebView không đáng tin cậy với <a download href="data:...">.
    const data=canvas.toDataURL('image/png');
    if(!data.startsWith('data:image/png;base64,'))throw Error('Không tạo được ảnh PNG.');
    const raw=atob(data.slice(data.indexOf(',')+1));
    const bytes=new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
    const filename=(code||'ma-qr').replace(/[\\/:*?"<>|]/g,'-')+'.png';
    const blob=new Blob([bytes],{type:'image/png'});
    return {blob,filename,file:typeof File==='function'?new File([blob],filename,{type:'image/png'}):null};
  }
  function showSavePreview(panel,blob,filename){
    // Trong trình duyệt nhúng không hỗ trợ chia sẻ File: hiện PNG thật để chạm giữ/lưu.
    document.getElementById('gdd-qr-save-preview')?.remove();
    const blobURL=URL.createObjectURL(blob);
    const view=document.createElement('div');
    view.id='gdd-qr-save-preview';
    view.setAttribute('role','dialog');
    view.setAttribute('aria-modal','true');
    view.setAttribute('aria-label','Lưu hình PNG mã QR');
    view.style.cssText='position:fixed;inset:0;z-index:10050;background:#10201beb;display:flex;align-items:center;justify-content:center;overflow:auto;padding:20px';
    const card=document.createElement('div');
    card.style.cssText='width:min(450px,100%);max-height:100%;overflow:auto;padding:17px;border-radius:12px;background:#fffefa;color:#174d43;text-align:center;box-shadow:0 12px 40px #0005';
    const title=document.createElement('strong');title.textContent='Mã QR PNG đã sẵn sàng';
    title.style.cssText='display:block;font-size:17px;margin-bottom:9px';
    const help=document.createElement('p');
    help.textContent='Trên iPhone: chạm giữ hình bên dưới rồi chọn “Lưu vào Ảnh”. Hoặc nhấn “Mở hình PNG” và dùng nút Chia sẻ để lưu vào Tệp.';
    help.style.cssText='font-size:12px;line-height:1.7;margin:0 0 11px';
    const image=document.createElement('img');image.src=blobURL;image.alt='Ảnh mã QR để lưu: '+filename;
    image.style.cssText='display:block;width:min(100%,360px);height:auto;max-height:55vh;object-fit:contain;margin:auto auto 13px;border:1px solid #d8d8d0;user-select:auto;-webkit-user-select:auto;-webkit-touch-callout:default';
    const actions=document.createElement('div');
    actions.style.cssText='display:flex;justify-content:center;flex-wrap:wrap;gap:8px';
    const open=document.createElement('a');open.href=blobURL;open.target='_blank';open.rel='noopener noreferrer';
    open.textContent='Mở hình PNG';open.style.cssText='display:inline-block;padding:11px 14px;border-radius:6px;background:#154d46;color:#fff;text-decoration:none;font-weight:700;font-size:12px';
    const save=document.createElement('a');save.href=blobURL;save.download=filename;
    save.textContent='Tải PNG';save.style.cssText='display:inline-block;padding:11px 14px;border-radius:6px;border:1px solid #154d46;color:#154d46;text-decoration:none;font-weight:700;font-size:12px';
    const close=document.createElement('button');close.type='button';close.textContent='Đóng';
    close.style.cssText='padding:11px 14px;border:1px solid #ccc;border-radius:6px;background:#eee;color:#263b33;font-weight:700;font-size:12px';
    const dismiss=()=>{
      view.remove();
      setTimeout(()=>URL.revokeObjectURL(blobURL),120000);
    };
    close.addEventListener('click',dismiss,{once:true});
    view.addEventListener('click',event=>{if(event.target===view)dismiss();});
    actions.append(open,save,close);card.append(title,help,image,actions);view.append(card);
    document.body.appendChild(view);
    setStatus(panel,'Đã mở ảnh PNG để lưu. Hãy chạm giữ hình hoặc nhấn Mở hình PNG.');
    close.focus({preventScroll:true});
  }
  function downloadPNG(panel){
    const qr=$('[data-gdd-qr-graphic] canvas',panel);
    if(!qr){setStatus(panel,'QR chưa sẵn sàng. Xin tải lại trang để thử.');return;}
    const code=panel.dataset.archiveCode||'DXCD-TU-LIEU';
    const output=panel.classList.contains('gdd-archive-qr--person')
      ?renderPersonPNG(panel,qr,code):renderStandardPNG(qr,code);
    const {blob,filename,file}=pngFile(output,code);
    // iPhone/iPad: mở bảng chia sẻ hệ thống TRONG lượt chạm, để chọn Lưu hình ảnh hoặc Lưu vào Tệp.
    const apple=/iPad|iPhone|iPod/i.test(navigator.userAgent)||
      (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    let shareSupported=false;
    if(apple&&file&&typeof navigator.share==='function'){
      try{shareSupported=typeof navigator.canShare==='function'&&navigator.canShare({files:[file]});}catch{}
    }
    if(shareSupported){
      try{
        const sharing=navigator.share({files:[file],title:'Mã QR '+code});
        Promise.resolve(sharing).then(()=>{
          setStatus(panel,'Đã mở bảng chia sẻ. Chọn Lưu hình ảnh hoặc Lưu vào Tệp trên iPhone.');
        }).catch(err=>{
          if(err?.name==='AbortError')setStatus(panel,'Đã hủy lưu QR. Nhấn Tải mã QR PNG để thử lại.');
          else showSavePreview(panel,blob,filename);
        });
        return;
      }catch(err){console.warn('[GDD QR share]',err);}
    }
    if(apple){showSavePreview(panel,blob,filename);return;}
    // Máy tính/Android: tải tệp Blob bằng URL tạm, thay cho data URL.
    const tempURL=URL.createObjectURL(blob);
    const link=document.createElement('a');link.download=filename;link.href=tempURL;
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(tempURL),60000);
    setStatus(panel,'Đã yêu cầu tải mã QR PNG. Hãy kiểm tra thư mục Tải về.');
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
