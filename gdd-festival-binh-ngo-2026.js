/* Dấu Xưa Cửa Đạo — lớp trang trí mùa Lễ Hạ Ngươn Bính Ngọ 2026.
   Không phụ thuộc Supabase/R2; không đụng ảnh, quản trị, QR hay định tuyến dữ liệu. */
(() => {
  'use strict';
  if(window.__GDDFestival2026)return;
  window.__GDDFestival2026=true;

  const shell=document.getElementById('gdd-festival-2026');
  const restore=document.getElementById('gdd-festival-restore');
  const dismiss=document.getElementById('gdd-festival-dismiss');
  if(!shell||!restore||!dismiss)return;

  const key='gdd-festival-binh-ngo-2026-hidden';
  const starts=Date.parse('2026-11-18T00:00:00+07:00');
  // Hạ Ngươn Bính Ngọ: Rằm tháng Mười âm lịch = 23/11/2026.
  // The decorative campaign expires at midnight in Asia/Ho_Chi_Minh.
  // Keep the archival text in source; do not leave a seasonal takeover active.
  const ends=Date.parse('2026-11-24T00:00:00+07:00');
  const isSeason=()=>Date.now()>=starts&&Date.now()<ends;
  const isHomepage=()=>{
    const path=window.location.pathname;
    const root=path==='/'||path.endsWith('/index.html');
    const hash=decodeURIComponent(window.location.hash||'').split('/')[0];
    return root&&(!hash||hash==='#trang-chu'||hash==='#dau-trang');
  };
  const readHidden=()=>{
    try{return window.localStorage.getItem(key)==='1';}
    catch(_){return window.__GDDFestival2026Hidden===true;}
  };
  const saveHidden=value=>{
    window.__GDDFestival2026Hidden=value;
    try{if(value)window.localStorage.setItem(key,'1');
      else window.localStorage.removeItem(key);}catch(_){}
  };
  const render=()=>{
    const active=isSeason()&&isHomepage();
    const hiddenByUser=readHidden();
    shell.hidden=!active||hiddenByUser;
    restore.hidden=!active||!hiddenByUser;
    document.body.classList.toggle('gdd-festival-active',active&&!hiddenByUser);
  };
  dismiss.addEventListener('click',()=>{saveHidden(true);render();});
  restore.addEventListener('click',()=>{
    saveHidden(false);
    render();
    if(!shell.hidden) shell.scrollIntoView({
      behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',
      block:'start'
    });
  });
  window.addEventListener('hashchange',render);
  window.addEventListener('pageshow',render);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)render();});
  // When a tab stays open across midnight, remove the banner automatically.
  const remaining=ends-Date.now();
  if(remaining>0&&remaining<2147483647){
    window.setTimeout(render,remaining+25);
  }
  render();
})();