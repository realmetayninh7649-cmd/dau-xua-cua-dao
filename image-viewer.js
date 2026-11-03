/* GIỮ ĐẠO GIỮA ĐỜI — trình xem ảnh gốc, 03/11/2026.
   Tệp độc lập: không thay đổi, nén hay tạo bản sao ảnh đã lưu trên Supabase.
   Dùng chung cho Hình ảnh và di ảnh Chức sắc; an toàn khi chi tiết được cập nhật động. */
(() => {
  'use strict';
  if (window.__gddImageViewerLoaded) return;
  window.__gddImageViewerLoaded = true;

  const css = `
    body.gdd-photo-open { overflow:hidden!important; }
    .gallery-visual:has(img), .person-media:has(img), #detail-content .detail-cover:has(img) { cursor:zoom-in; }
    .gallery-visual:has(img)::before, .person-media:has(img)::after {
      content:'⌕'; position:absolute; right:11px; bottom:11px; z-index:2;
      display:grid; place-items:center; width:34px; height:34px; border-radius:50%;
      background:rgba(20,57,51,.85); color:white; font:bold 25px/1 Georgia,serif;
      pointer-events:none; box-shadow:0 2px 10px #0004;
    }
    .gdd-image-actions { display:flex; gap:9px; flex-wrap:wrap; margin:-13px 0 23px; }
    .gdd-image-action { border:1px solid #c5d3ca; background:#f5f7f1; color:#1b5349;
      padding:10px 13px; font:600 12px/1.4 'Be Vietnam Pro',system-ui,sans-serif;
      border-radius:5px; cursor:pointer; }
    .gdd-image-action:hover { background:#e5eee8; }
    .gdd-image-viewer[hidden] { display:none!important; }
    .gdd-image-viewer { position:fixed!important; z-index:10000!important; inset:0;
      display:flex; flex-direction:column; width:100vw!important; max-width:100vw!important; box-sizing:border-box; background:#0d1213; color:#f4f5f1;
      font:500 13px/1.5 'Be Vietnam Pro',system-ui,sans-serif;
      height:100vh; height:100dvh; overscroll-behavior:contain; }
    .gdd-image-head { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between;
      gap:12px; padding:calc(9px + env(safe-area-inset-top)) 15px 10px; background:#151e1e; }
    .gdd-image-head-title { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
      font:600 13px/1.5 'Noto Serif',Georgia,serif; }
    .gdd-image-icon { color:white; background:#ffffff17; border:1px solid #ffffff32;
      padding:0; border-radius:8px; height:42px; min-width:42px; cursor:pointer;
      font:600 22px/1 system-ui,sans-serif; display:inline-flex; align-items:center; justify-content:center; }
    .gdd-image-icon:focus-visible, .gdd-image-download:focus-visible { outline:3px solid #dfbd76; outline-offset:2px; }
    .gdd-image-stage { touch-action:none; user-select:none; -webkit-user-select:none;
      overflow:hidden; position:relative; flex:1 1 auto; min-height:0;
      display:flex; justify-content:center; align-items:center; cursor:grab; }
    .gdd-image-stage:active { cursor:grabbing; }
    .gdd-image-stage img { display:block; max-width:calc(100% - 24px); max-height:calc(100% - 18px);
      width:auto; height:auto; object-fit:contain; transform-origin:center center;
      will-change:transform; -webkit-user-drag:none; user-drag:none;
      pointer-events:none; }
    .gdd-image-stage .gdd-image-loading { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      color:#e3e7e2; background:#000a; padding:8px 13px; border-radius:6px; pointer-events:none; }
    .gdd-image-bottom { flex:0 0 auto; display:flex; align-items:center; justify-content:space-between;
      flex-wrap:wrap; gap:11px; padding:12px 16px calc(13px + env(safe-area-inset-bottom));
      border-top:1px solid #ffffff2b; background:#151e1e; }
    .gdd-image-controls { display:flex; align-items:center; gap:7px; }
    .gdd-image-controls .gdd-image-icon { height:39px; min-width:39px; font-size:20px; }
    .gdd-image-scale { display:inline-block; min-width:48px; text-align:center; font-size:11px; }
    .gdd-image-download { padding:10px 13px; min-height:39px; background:#f0e8d8; color:#183d36;
      border:0; border-radius:6px; cursor:pointer; font-family:inherit; font-weight:700; font-size:12px; line-height:1.5; }
    .gdd-image-caption { color:#b6c3bd; font-size:11px; text-align:center; width:100%; }
    @media (max-width:490px) {
      .gdd-image-head { padding-left:11px; padding-right:11px; }
      .gdd-image-bottom { justify-content:center; gap:8px; padding-left:8px; padding-right:8px; }
      .gdd-image-controls { gap:5px; }
      .gdd-image-caption { font-size:10px; }
      .gdd-image-download { font-size:11px; }
    }
    @media (prefers-reduced-motion:reduce) { .gdd-image-stage img { transition:none!important; } }
  `;
  const st = document.createElement('style');
  st.id = 'gdd-image-viewer-style';
  st.textContent = css;
  document.head.appendChild(st);

  const viewer = document.createElement('div');
  viewer.id = 'gdd-image-viewer';
  viewer.className = 'gdd-image-viewer';
  viewer.hidden = true;
  viewer.setAttribute('role','dialog');
  viewer.setAttribute('aria-modal','true');
  viewer.setAttribute('aria-label','Xem ảnh tư liệu toàn màn hình');
  viewer.innerHTML = `
    <div class="gdd-image-head">
      <div class="gdd-image-head-title" id="gdd-image-title">Ảnh tư liệu</div>
      <button class="gdd-image-icon" type="button" id="gdd-image-close" aria-label="Đóng ảnh">×</button>
    </div>
    <div class="gdd-image-stage" id="gdd-image-stage">
      <img id="gdd-image-full" alt="Ảnh tư liệu nguyên bản">
      <div class="gdd-image-loading" id="gdd-image-loading">Đang mở ảnh…</div>
    </div>
    <div class="gdd-image-bottom">
      <div class="gdd-image-controls">
        <button class="gdd-image-icon" id="gdd-image-minus" type="button" aria-label="Thu nhỏ">−</button>
        <span class="gdd-image-scale" id="gdd-image-scale" aria-live="polite">100%</span>
        <button class="gdd-image-icon" id="gdd-image-plus" type="button" aria-label="Phóng to">+</button>
        <button class="gdd-image-icon" id="gdd-image-reset" type="button" aria-label="Vừa khung" style="font-size:20px">↺</button>
      </div>
      <button class="gdd-image-download" id="gdd-image-download" type="button">↓ Tải ảnh gốc</button>
      <a class="gdd-image-download" id="gdd-image-original" href="#" target="_blank" rel="noopener noreferrer" style="background:#ffffff17;color:white;text-decoration:none">Mở ảnh gốc ↗</a>
      <div class="gdd-image-caption" id="gdd-image-caption">Chụm hai ngón tay để phóng to; kéo để xem chi tiết.</div>
    </div>`;
  document.body.appendChild(viewer);

  const $ = id => document.getElementById(id);
  const stage=$('gdd-image-stage'), full=$('gdd-image-full'), loading=$('gdd-image-loading');
  const caption=$('gdd-image-caption'), download=$('gdd-image-download'), orig=$('gdd-image-original');
  let scale=1, x=0, y=0, source='', title='', previousFocus=null;
  const pointers=new Map();
  let start=null, lastTap=0;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const safeSource=src=>{
    try { const u=new URL(src,location.href);return ['https:','http:'].includes(u.protocol)?u.href:''; }
    catch { return ''; }
  };
  const updateTransform=()=>{
    const b=full.getBoundingClientRect();
    // Dùng kích thước hiển thị không bị biến đổi (offsetWidth/Height).
    const w=full.offsetWidth||b.width/scale||1, h=full.offsetHeight||b.height/scale||1;
    const maxX=Math.max(0,(w*scale-stage.clientWidth)/2)+Math.min(70,stage.clientWidth*.06);
    const maxY=Math.max(0,(h*scale-stage.clientHeight)/2)+Math.min(70,stage.clientHeight*.06);
    if(scale<=1){x=0;y=0;} else {x=clamp(x,-maxX,maxX);y=clamp(y,-maxY,maxY);}
    full.style.transform=`translate3d(${x}px,${y}px,0) scale(${scale})`;
    $('gdd-image-scale').textContent=Math.round(scale*100)+'%';
    $('gdd-image-minus').disabled=scale<=1;
    $('gdd-image-plus').disabled=scale>=8;
  };
  const zoomTo=(next,px=stage.clientWidth/2,py=stage.clientHeight/2)=>{
    const old=scale;scale=clamp(next,1,8);
    if(scale>1){x=(x-(px-stage.clientWidth/2))*(scale/old)+(px-stage.clientWidth/2);
      y=(y-(py-stage.clientHeight/2))*(scale/old)+(py-stage.clientHeight/2);}
    updateTransform();
  };
  const reset=()=>{scale=1;x=0;y=0;updateTransform();};
  const imgTitle=img=>img.alt||img.closest('.person-card,.gallery-card')?.querySelector('h3')?.textContent||'Ảnh tư liệu';
  function openImage(src, name){
    const url=safeSource(src);if(!url)return;
    previousFocus=document.activeElement;
    title=(name||'Ảnh tư liệu').trim();source=url;
    $('gdd-image-title').textContent=title;
    full.alt=title;full.removeAttribute('src');full.src=url;
    orig.href=url;
    loading.hidden=false;loading.textContent='Đang mở ảnh…';
    caption.textContent='Chụm hai ngón tay để phóng to; kéo để xem chi tiết.';
    viewer.hidden=false;document.body.classList.add('gdd-photo-open');reset();
    $('gdd-image-close').focus({preventScroll:true});
    // Ảnh có thể đã ở bộ đệm trước khi onload được gọi.
    if(full.complete&&full.naturalWidth)imageReady();
  }
  function imageReady(){
    loading.hidden=true;reset();
    caption.textContent=`Ảnh gốc: ${full.naturalWidth} × ${full.naturalHeight} px · Chạm hai lần hoặc chụm hai ngón để phóng to.`;
  }
  full.addEventListener('load',imageReady);
  full.addEventListener('error',()=>{loading.hidden=false;loading.textContent='Không thể hiển thị ảnh. Hãy chọn “Mở ảnh gốc”.';});
  function closeImage(){
    if(viewer.hidden)return;
    viewer.hidden=true;document.body.classList.remove('gdd-photo-open');
    pointers.clear();start=null;source='';full.removeAttribute('src');
    if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});
  }
  $('gdd-image-close').addEventListener('click',closeImage);
  $('gdd-image-minus').addEventListener('click',()=>zoomTo(scale/1.5));
  $('gdd-image-plus').addEventListener('click',()=>zoomTo(scale*1.5));
  $('gdd-image-reset').addEventListener('click',reset);
  stage.addEventListener('dblclick',e=>{e.preventDefault();zoomTo(scale>1?1:2.5,e.offsetX,e.offsetY);});
  stage.addEventListener('wheel',e=>{if(viewer.hidden)return;e.preventDefault();
    const box=stage.getBoundingClientRect();zoomTo(scale*(e.deltaY>0?.86:1.15),e.clientX-box.left,e.clientY-box.top);
  },{passive:false});
  const snapshot=()=>{
    const p=[...pointers.values()];
    if(p.length===2){const dx=p[0].x-p[1].x,dy=p[0].y-p[1].y;
      start={count:2,dist:Math.hypot(dx,dy)||1,centerX:(p[0].x+p[1].x)/2,centerY:(p[0].y+p[1].y)/2,
        scale,x,y};
    }else if(p.length===1){start={count:1,px:p[0].x,py:p[0].y,x,y};}
    else start=null;
  };
  stage.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    try{stage.setPointerCapture(e.pointerId)}catch{}
    snapshot();
  });
  stage.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const p=[...pointers.values()];
    if(p.length===1&&start?.count===1&&scale>1){x=start.x+p[0].x-start.px;y=start.y+p[0].y-start.py;updateTransform();}
    if(p.length===2&&start?.count===2){
      const dx=p[0].x-p[1].x,dy=p[0].y-p[1].y;
      const cx=(p[0].x+p[1].x)/2,cy=(p[0].y+p[1].y)/2;
      scale=clamp(start.scale*Math.hypot(dx,dy)/start.dist,1,8);
      x=start.x+(cx-start.centerX);y=start.y+(cy-start.centerY);
      updateTransform();
    }
  });
  const pointerEnd=e=>{
    if(!pointers.has(e.pointerId))return;
    const wasSingle=pointers.size===1;
    pointers.delete(e.pointerId);snapshot();
    if(e.type==='pointerup'&&wasSingle&&e.pointerType==='touch'){
      const now=Date.now();if(now-lastTap<340){reset();zoomTo(2.5);lastTap=0;} else lastTap=now;
    }
  };
  stage.addEventListener('pointerup',pointerEnd);
  stage.addEventListener('pointercancel',pointerEnd);
  stage.addEventListener('lostpointercapture',pointerEnd);
  window.addEventListener('resize',()=>{if(!viewer.hidden)updateTransform()});
  document.addEventListener('keydown',e=>{
    if(viewer.hidden)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeImage();}
    else if(e.key==='+'||e.key==='='){e.preventDefault();zoomTo(scale*1.5);}
    else if(e.key==='-'){e.preventDefault();zoomTo(scale/1.5);}
    else if(e.key==='0'){e.preventDefault();reset();}
  },true);
  
  const filename=(url,label)=>{
    const path=new URL(url).pathname,tail=decodeURIComponent(path.split('/').pop()||'');
    if(/^.{1,100}\.(?:jpe?g|png|webp|gif|avif)$/i.test(tail))return tail;
    const name=(label||'anh-tu-lieu').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||'anh-tu-lieu';
    return name+'.jpg';
  };
  async function downloadImage(url,label,btn){
    if(!url)return;
    const old=btn.textContent;
    btn.disabled=true;btn.textContent='Đang chuẩn bị ảnh…';
    try {
      const response=await fetch(url,{mode:'cors',credentials:'omit'});
      if(!response.ok)throw Error('Không thể tải trực tiếp');
      const blob=await response.blob();
      if(!blob.type.startsWith('image/'))throw Error('Tệp không phải hình ảnh');
      const blobUrl=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=blobUrl;a.download=filename(url,label);document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);
      caption.textContent='Đã yêu cầu lưu ảnh gốc. Trên iPhone, hãy kiểm tra ứng dụng Tệp / Tải về.';
    } catch(err) {
      caption.textContent='Nguồn ảnh không cho tải trực tiếp. Nhấn “Mở ảnh gốc”, rồi chạm giữ ảnh để lưu trên iPhone.';
    } finally {btn.disabled=false;btn.textContent=old;}
  }
  download.addEventListener('click',()=>downloadImage(source,title,download));
  
  // Chạm vào ảnh trong thẻ thư viện hoặc di ảnh Chức sắc thì phóng to ngay.
  document.addEventListener('click',e=>{
    const el=e.target;
    if(!(el instanceof Element)||!viewer.hidden)return;
    const img=el.closest('#gallery-grid .gallery-visual img, #people-grid .person-media img, #detail-content .detail-cover img');
    if(!img)return;
    e.preventDefault();e.stopImmediatePropagation();
    openImage(img.currentSrc||img.src,imgTitle(img));
  },true);

  // Mỗi khi trang chi tiết mở, thêm nút phóng to/tải ảnh, không sửa cấu trúc hồ sơ.
  const detail=document.getElementById('detail-content');
  if(detail){
    const injectControls=()=>{
      const cover=detail.querySelector('.detail-cover');const img=cover?.querySelector('img');
      if(!img||cover.nextElementSibling?.classList.contains('gdd-image-actions'))return;
      const bar=document.createElement('div');bar.className='gdd-image-actions';
      const show=document.createElement('button');show.type='button';show.className='gdd-image-action';show.textContent='⤢ Xem ảnh toàn màn hình';
      show.addEventListener('click',()=>openImage(img.currentSrc||img.src,imgTitle(img)));
      const save=document.createElement('button');save.type='button';save.className='gdd-image-action';save.textContent='↓ Tải ảnh gốc';
      save.addEventListener('click',()=>downloadImage(img.currentSrc||img.src,imgTitle(img),save));
      bar.append(show,save);cover.after(bar);
    };
    const observer=new MutationObserver(injectControls);
    observer.observe(detail,{childList:true});injectControls();
  }
})();
