/* GIỮ ĐẠO GIỮA ĐỜI — khung phát video tự thích ứng 2026-11-07.
   Chỉ tác động vùng xem VIDEO ĐẠO SỬ; không thay đổi tệp video hoặc dữ liệu. */
(() => {
  'use strict';
  if (window.__GDDResponsiveVideo20261107) return;
  window.__GDDResponsiveVideo20261107 = true;
  const style = document.createElement('style');
  style.id = 'gdd-responsive-video-style';
  style.textContent = `
    #detail-content .detail-video-preview{
      --gdd-video-ratio:16/9;
      display:block!important;position:relative;
      width:100%!important;max-width:900px!important;height:auto!important;
      min-height:0!important;aspect-ratio:var(--gdd-video-ratio)!important;
      margin:0 auto 12px!important;overflow:hidden;background:#111c1a;
      border:1px solid rgba(148,159,140,.3);border-radius:6px;
    }
    #detail-content .detail-video-preview[data-gdd-aspect="portrait"]{
      --gdd-video-ratio:9/16;width:min(100%,430px)!important;
    }
    #detail-content .detail-video-preview[data-gdd-aspect="square"]{
      --gdd-video-ratio:1/1;width:min(100%,560px)!important;
    }
    #detail-content .detail-video-preview iframe,
    #detail-content .detail-video-preview video,
    #detail-content .detail-video-preview .video-poster-button,
    #detail-content .detail-video-preview .video-poster-unavailable{
      display:block;width:100%!important;height:100%!important;
      min-height:0!important;aspect-ratio:auto!important;
    }
    #detail-content .detail-video-preview video{object-fit:contain!important}
    #detail-content .detail-video-preview .video-poster-button,
    #detail-content .detail-video-preview .video-poster-unavailable{
      display:flex;align-items:center;justify-content:center;
    }
    #detail-content .detail-video-preview .video-poster-button img,
    #detail-content .detail-video-preview .video-poster-unavailable img{
      object-fit:contain!important;object-position:center!important;
    }
    #detail-content .gdd-video-ratio-tools{
      display:flex;flex-wrap:wrap;justify-content:center;align-items:center;
      gap:7px;margin:0 0 25px;font:500 11px/1.5 'Be Vietnam Pro',sans-serif;
      color:#5b6b62;
    }
    #detail-content .gdd-video-ratio-tools span{margin-right:3px}
    #detail-content .gdd-video-ratio-tools button{
      padding:8px 11px;min-height:35px;
      border:1px solid #d3d9cd;border-radius:5px;background:#fffdf8;
      color:#285a4b;font:600 11px/1.4 'Be Vietnam Pro',sans-serif;cursor:pointer;
    }
    #detail-content .gdd-video-ratio-tools button[aria-pressed="true"]{
      color:white;background:#185245;border-color:#185245;
    }
    #detail-content .gdd-video-ratio-hint{
      flex-basis:100%;text-align:center;font-size:10px;color:#768277;
    }
    @media(max-width:680px){
      #detail-content .detail-video-preview{border-radius:4px}
      #detail-content .detail-video-preview[data-gdd-aspect="portrait"]{width:min(100%,420px)!important}
      #detail-content .gdd-video-ratio-tools{gap:5px;margin-bottom:21px}
      #detail-content .gdd-video-ratio-tools button{padding:7px 9px}
    }
  `;
  document.head.appendChild(style);
  const detail = document.getElementById('detail-content');
  if (!detail) return;
  const modeNames = {auto:'Tự động',portrait:'Dọc 9:16',landscape:'Ngang 16:9'};
  const keyFor = slot => 'gdd-video-aspect:' + (slot.dataset.videoId || '');
  const storedMode = slot => {
    try {const x=localStorage.getItem(keyFor(slot)); return x in modeNames ? x : 'auto'}
    catch {return 'auto'}
  };
  const storeMode = (slot,mode) => {
    try {if(mode==='auto')localStorage.removeItem(keyFor(slot));else localStorage.setItem(keyFor(slot),mode)}
    catch { /* Trình duyệt riêng tư: vẫn đổi tỷ lệ trong phiên hiện tại. */ }
  };
  const typeFromRatio = (width,height) => {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width<=0 || height<=0) return null;
    const ratio=width/height;
    return ratio<.86?'portrait':ratio>1.15?'landscape':'square';
  };
  const reelFromUrl = raw => {
    try {
      const u=new URL(raw,location.href),path=u.pathname.toLowerCase();
      return /\/(reel|reels)\//.test(path) || /^\/share\/r\//.test(path);
    } catch {return false}
  };
  function detect(slot) {
    const video=slot.querySelector('video');
    if(video && video.videoWidth && video.videoHeight){
      return typeFromRatio(video.videoWidth,video.videoHeight) || 'landscape';
    }
    const iframe=slot.querySelector('iframe[src*="facebook.com/plugins/video.php"]');
    const link=detail.querySelector('.detail-external a[href]');
    if(reelFromUrl(link?.href||''))return 'portrait';
    if(iframe){
      try {if(reelFromUrl(new URL(iframe.src).searchParams.get('href')||''))return 'portrait'}
      catch { /* Giữ kích thước được nhận diện từ ảnh bìa. */ }
    }
    const img=slot.querySelector('.video-poster-button img,.video-poster-unavailable img');
    if(img && img.naturalWidth && img.naturalHeight)
      return typeFromRatio(img.naturalWidth,img.naturalHeight) || 'landscape';
    return slot.dataset.gddDetected || 'landscape';
  }
  function formatFrame(slot,force=false) {
    const frame=slot.querySelector('iframe[src*="facebook.com/plugins/video.php"]');
    if(!frame)return;
    try {
      const u=new URL(frame.src);
      const width=Math.max(220,Math.round(slot.clientWidth||560));
      const format=slot.dataset.gddAspect||'landscape';
      const height=Math.round(width*(format==='portrait'?16/9:format==='square'?1:9/16));
      if(force || u.searchParams.get('width')!==String(width) || u.searchParams.get('height')!==String(height)){
        u.searchParams.set('width',String(width));
        u.searchParams.set('height',String(height));
        if(u.href!==frame.src)frame.src=u.href;
      }
    }catch{ /* Nếu Meta thay đổi URL, vẫn giữ khung xem. */ }
  }
  function setFormat(slot,format,force=false){
    if(!['portrait','landscape','square'].includes(format))format='landscape';
    const previous=slot.dataset.gddAspect;
    slot.dataset.gddAspect=format;
    if(previous!==format||force)formatFrame(slot);
  }
  let watchedSlot=null,watchingImage=null,watchingVideo=null;
  function refresh() {
    const slot=detail.querySelector('.detail-video-preview');
    if(!slot){watchedSlot=null;watchingImage=null;watchingVideo=null;return}
    if(watchedSlot!==slot){
      watchedSlot=slot;watchingImage=null;watchingVideo=null;
      slot.dataset.gddMode=storedMode(slot);
    }
    const poster=slot.querySelector('.video-poster-button img,.video-poster-unavailable img');
    if(poster && watchingImage!==poster){
      watchingImage=poster;
      poster.addEventListener('load',queueRefresh,{once:true});
    }
    const video=slot.querySelector('video');
    if(video && watchingVideo!==video){
      watchingVideo=video;
      video.addEventListener('loadedmetadata',queueRefresh);
      video.addEventListener('resize',queueRefresh);
    }
    const auto=detect(slot);
    slot.dataset.gddDetected=auto;
    const mode=slot.dataset.gddMode||'auto';
    setFormat(slot,mode==='auto'?auto:mode);
    let controls=slot.nextElementSibling;
    if(!controls?.classList.contains('gdd-video-ratio-tools')){
      controls=document.createElement('div');
      controls.className='gdd-video-ratio-tools';
      controls.setAttribute('role','group');
      controls.setAttribute('aria-label','Chọn tỷ lệ khung hình video');
      const label=document.createElement('span');label.textContent='Khung hình:';
      controls.append(label);
      for(const [value,text] of Object.entries(modeNames)){
        const button=document.createElement('button');
        button.type='button';button.dataset.gddVideoRatio=value;button.textContent=text;
        controls.append(button);
      }
      const hint=document.createElement('small');
      hint.className='gdd-video-ratio-hint';
      hint.textContent='Video Facebook có thể cần chọn Dọc hoặc Ngang để khớp bản gốc.';
      controls.append(hint);slot.after(controls);
    }
    for(const b of controls.querySelectorAll('[data-gdd-video-ratio]')){
      b.setAttribute('aria-pressed',String(b.dataset.gddVideoRatio===mode));
    }
  }
  let scheduled=false;
  function queueRefresh(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;refresh()});
  }
  detail.addEventListener('click',event=>{
    const button=event.target.closest('[data-gdd-video-ratio]');
    if(!button || !detail.contains(button))return;
    const slot=detail.querySelector('.detail-video-preview');
    if(!slot)return;
    const mode=button.dataset.gddVideoRatio;
    if(!(mode in modeNames))return;
    slot.dataset.gddMode=mode;storeMode(slot,mode);
    const next=mode==='auto'?detect(slot):mode;
    setFormat(slot,next,true);
    queueRefresh();
  });
  const observer=new MutationObserver(queueRefresh);
  observer.observe(detail,{childList:true,subtree:true});
  window.addEventListener('resize',()=>{const slot=detail.querySelector('.detail-video-preview');if(slot && !slot.querySelector('iframe'))queueRefresh()});
  queueRefresh();
})();