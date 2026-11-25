/* Explicit reload, without closing the installed web app. */
(()=>{'use strict';
 const button=document.getElementById('gdd-app-refresh');
 if(!button)return;
 button.addEventListener('click',()=>{
  const playing=[...document.querySelectorAll('audio,video')].some(media=>!media.paused&&!media.ended);
  if(playing&&!confirm('Làm mới sẽ dừng nội dung đang phát. Tiếp tục?'))return;
  button.disabled=true;button.setAttribute('aria-label','Đang làm mới website');
  location.reload();
 });
 window.addEventListener('pageshow',()=>{button.disabled=false;button.setAttribute('aria-label','Làm mới website')});
})();
