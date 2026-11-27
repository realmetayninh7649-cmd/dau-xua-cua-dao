/* Keep the current document and media alive when refreshing published data. */
(()=>{'use strict';
 const button=document.getElementById('gdd-app-refresh');if(!button)return;
 const label='Làm mới website';let busy=false;
 function status(message){
  let node=document.getElementById('gdd-refresh-notice');
  if(!node){node=document.createElement('div');node.id='gdd-refresh-notice';node.setAttribute('role','status');node.style.cssText='position:fixed;top:calc(82px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);z-index:66;width:max-content;max-width:88vw;padding:9px 14px;border-radius:7px;border:1px solid #c7b17d;background:#194b42;color:#fffdf5;font:13px/1.5 system-ui;text-align:center;box-shadow:0 3px 10px #0002;pointer-events:none';document.body.append(node)}
  node.textContent=message;node.hidden=false;clearTimeout(status.timer);status.timer=setTimeout(()=>{node.hidden=true},4000);
 }
 button.addEventListener('click',async()=>{
  if(busy)return;
  const radio=document.getElementById('gdd-radio-audio');
  const preserve=!!radio&&((!radio.paused&&!radio.ended)||window.GDDRadioRefresh?.hasSession?.());
  if(!preserve){
   const other=[...document.querySelectorAll('audio,video')].some(media=>!media.paused&&!media.ended);
   if(other&&!confirm('Làm mới sẽ dừng nội dung đang phát. Tiếp tục?'))return;
   button.disabled=true;button.setAttribute('aria-label','Đang làm mới website');location.reload();return;
  }
  busy=true;button.disabled=true;button.setAttribute('aria-label','Đang cập nhật dữ liệu');
  status('Đang cập nhật dữ liệu · Âm thanh vẫn giữ nguyên');
  try{
   if(!window.GDDPublicReadOnly?.refresh||!window.GDDRefreshPublished)throw Error('Chưa có bộ cập nhật tại chỗ');
   const archive=await window.GDDPublicReadOnly.refresh();
   await window.GDDRefreshPublished(archive);
   window.GDDRadioRefresh?.refreshList?.(archive);
   window.dispatchEvent(new Event('gdd:people-anniversary-refresh'));
   window.dispatchEvent(new Event('gdd:soft-refresh'));
   status(archive.backend==='snapshot'?'Đang dùng dữ liệu dự phòng · Vẫn giữ nguyên âm thanh':'Đã cập nhật tư liệu · Vẫn giữ nguyên âm thanh');
  }catch(e){status('Chưa cập nhật được dữ liệu · Âm thanh không bị dừng');console.warn('[GDD Refresh]',e?.message||e)}
  finally{busy=false;button.disabled=false;button.setAttribute('aria-label',label)}
 });
 window.addEventListener('pageshow',()=>{if(!busy){button.disabled=false;button.setAttribute('aria-label',label)}});
})();
