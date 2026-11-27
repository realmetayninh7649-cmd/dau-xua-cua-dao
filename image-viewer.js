/* GIỮ ĐẠO GIỮA ĐỜI — trình xem ảnh gốc, 03/11/2026.
   Tệp độc lập: không thay đổi, nén hay tạo bản sao ảnh đã lưu trên Supabase.
   Dùng chung cho Hình ảnh và di ảnh Chức sắc; an toàn khi chi tiết được cập nhật động. */
(() => {
  'use strict';
  if (window.__gddImageViewerLoaded) return;
  window.__gddImageViewerLoaded = true;

  const css = `
    body.gdd-photo-open { overflow:hidden!important; }
    .gallery-visual:has(img), .person-media:has(img), #gdd-directory .gdd-preview-thumb:has(img), #detail-content .detail-cover:has(img) { cursor:zoom-in; }
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
    .gdd-image-icon:focus-visible { outline:3px solid #dfbd76; outline-offset:2px; }
    .gdd-image-stage { touch-action:none; user-select:none; -webkit-user-select:none; -webkit-touch-callout:default;
      overflow:hidden; position:relative; flex:1 1 auto; min-height:0;
      display:flex; justify-content:center; align-items:center; cursor:grab; }
    .gdd-image-stage:active { cursor:grabbing; }
    .gdd-image-nav { position:absolute; top:50%; transform:translateY(-50%); z-index:4;
      display:grid; place-items:center; width:46px; height:56px; padding:0;
      color:#fff; background:rgba(15,37,35,.78); border:1px solid #ffffff76;
      border-radius:12px; box-shadow:0 3px 14px #0007;
      font:700 35px/1 system-ui,sans-serif; cursor:pointer; touch-action:manipulation;
      -webkit-tap-highlight-color:transparent; }
    .gdd-image-nav--prev { left:12px; }
    .gdd-image-nav--next { right:12px; }
    .gdd-image-nav[hidden] { display:none!important; }
    .gdd-image-nav:disabled { opacity:.32; cursor:not-allowed; }
    .gdd-image-nav:focus-visible { outline:3px solid #dfbd76; outline-offset:3px; }
    @media(max-width:600px) {
      .gdd-image-nav { width:40px; height:52px; font-size:31px; background:#122b29d9; }
      .gdd-image-nav--prev { left:6px; }
      .gdd-image-nav--next { right:6px; }
    }
    .gdd-image-stage img { display:block; max-width:calc(100% - 24px); max-height:calc(100% - 18px);
      width:auto; height:auto; object-fit:contain; transform-origin:center center;
      will-change:transform; -webkit-user-drag:auto; user-drag:auto;
      pointer-events:auto; user-select:auto; -webkit-user-select:auto; -webkit-touch-callout:default; }
    .gdd-image-stage .gdd-image-loading { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      color:#e3e7e2; background:#000a; padding:8px 13px; border-radius:6px; pointer-events:none; }
    .gdd-image-bottom { flex:0 0 auto; display:flex; align-items:center; justify-content:center;
      flex-wrap:wrap; gap:11px; padding:12px 16px calc(13px + env(safe-area-inset-bottom));
      border-top:1px solid #ffffff2b; background:#151e1e; }
    .gdd-image-controls { display:flex; align-items:center; gap:7px; }
    .gdd-image-controls .gdd-image-icon { height:39px; min-width:39px; font-size:20px; }
    .gdd-image-scale { display:inline-block; min-width:48px; text-align:center; font-size:11px; }
    .gdd-image-caption { color:#b6c3bd; font-size:11px; text-align:center; width:100%; }
    @media (max-width:490px) {
      .gdd-image-head { padding-left:11px; padding-right:11px; }
      .gdd-image-bottom { justify-content:center; gap:8px; padding-left:8px; padding-right:8px; }
      .gdd-image-controls { gap:5px; }
      .gdd-image-caption { font-size:10px; }
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
      <img id="gdd-image-full" alt="Ảnh tư liệu">
      <button class="gdd-image-nav gdd-image-nav--prev" type="button" id="gdd-image-prev" aria-label="Ảnh trước" title="Ảnh trước" hidden>‹</button>
      <button class="gdd-image-nav gdd-image-nav--next" type="button" id="gdd-image-next" aria-label="Ảnh tiếp theo" title="Ảnh tiếp theo" hidden>›</button>
      <div class="gdd-image-loading" id="gdd-image-loading">Đang mở ảnh…</div>
    </div>
    <div class="gdd-image-bottom">
      <div class="gdd-image-controls">
        <button class="gdd-image-icon" id="gdd-image-minus" type="button" aria-label="Thu nhỏ">−</button>
        <span class="gdd-image-scale" id="gdd-image-scale" aria-live="polite">100%</span>
        <button class="gdd-image-icon" id="gdd-image-plus" type="button" aria-label="Phóng to">+</button>
        <button class="gdd-image-icon" id="gdd-image-reset" type="button" aria-label="Vừa khung" style="font-size:20px">↺</button>
      </div>
      <div class="gdd-image-caption" id="gdd-image-caption">Chụm hai ngón tay để phóng to; kéo để xem chi tiết.</div>
    </div>`;
  document.body.appendChild(viewer);

  const $ = id => document.getElementById(id);
  const stage=$('gdd-image-stage'), full=$('gdd-image-full'), loading=$('gdd-image-loading');
  const caption=$('gdd-image-caption');
  let scale=1, x=0, y=0, source='', title='', previousFocus=null, personPhoto=false, noImageDownload=false, viewTicket=0;
  let gallery=[], galleryIndex=0, swipeStart=null, hadMultiTouch=false;
  let tracedPreviewURL='';
  const pointers=new Map();
  let start=null, lastTap=0;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  const safeSource=src=>{
    // Generated local display bytes are valid archive images for the viewer.
    if(window.GDDTraceDisplay?.isStampedBlob(src))return String(src);
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
  // Chỉ duyệt các ảnh thuộc cùng một album; không chuyển sang hồ sơ của người khác.
  function imageSequence(img) {
    if(!(img instanceof HTMLImageElement))return [];
    const album=img.closest('.gdd-album-grid');
    const grid=album||img.closest('#gallery-grid');
    if(!grid)return [];
    const selector=album?'.gdd-album-tile img':'.gallery-visual img';
    return [...grid.querySelectorAll(selector)]
      .filter(item=>item instanceof HTMLImageElement)
      .map(item=>({element:item,src:safeSource(item.currentSrc||item.src),title:imgTitle(item),photoCode:item.dataset.photoCode||''}))
      .filter(item=>item.src);
  }
  function refreshArrows(){
    const multi=gallery.length>1;
    const prev=$('gdd-image-prev'), next=$('gdd-image-next');
    prev.hidden=!multi;next.hidden=!multi;
    prev.disabled=galleryIndex<=0;next.disabled=galleryIndex>=gallery.length-1;
    $('gdd-image-title').textContent=title+(multi?' · '+(galleryIndex+1)+'/'+gallery.length:'');
  }
  function showGalleryImage(index){
    if(index<0||index>=gallery.length)return;
    const item=gallery[index],url=safeSource(item.src);if(!url)return;
    galleryIndex=index;
    ++viewTicket;
    const currentTicket=viewTicket;
    title=(item.title||'Ảnh tư liệu').trim();source=url;personPhoto=Boolean(item.isPerson);
    if(tracedPreviewURL){URL.revokeObjectURL(tracedPreviewURL);tracedPreviewURL='';}
    noImageDownload=Boolean(item.noDownload);
    const photoCode=personPhoto?'':(window.GDDTrace?.validCode(item.photoCode)?item.photoCode:'TU-LIEU-CO-LUU-DAU');
    const alreadyTraced=Boolean(window.GDDTrace?.isStampedURL(url)||
      window.GDDTraceDisplay?.isStampedBlob(url));
    const mustTrace=Boolean(photoCode&&window.GDDTrace?.validCode(photoCode)&&!alreadyTraced);
    delete full.dataset.gddTraceFailed;
    full.alt=title;full.removeAttribute('src');
    // Không đưa ảnh CHƯA có mã vào màn hình xem lớn khi đang xử lý bản lưu dấu.
    full.style.visibility=mustTrace?'hidden':'';
    if(!mustTrace)full.src=url;
    // The viewer has no download or separate-image link.
    loading.hidden=false;loading.textContent=mustTrace?'Đang chuẩn bị bản ảnh có lưu dấu…':'Đang mở ảnh…';
    refreshArrows();
    caption.textContent='Vuốt trái/phải để chuyển ảnh; chụm hai ngón để phóng to.';
    if(viewer.hidden){
      // Chỉ tạo một bước History cho toàn bộ buổi xem album.
      history.pushState({...history.state,__gddLayer:'photo'},'',location.href);
    }
    viewer.hidden=false;document.body.classList.add('gdd-photo-open');
    pointers.clear();start=null;swipeStart=null;hadMultiTouch=false;lastTap=0;reset();
    if(full.complete&&full.naturalWidth)imageReady();
    if(mustTrace){
      window.GDDTrace.stampedBlob(url,photoCode).then(blob=>{
        if(viewer.hidden||viewTicket!==currentTicket)return;
        const stampedURL=URL.createObjectURL(blob);
        tracedPreviewURL=stampedURL;
        full.src=stampedURL;full.style.visibility='';
      }).catch(err=>{
        if(viewer.hidden||viewTicket!==currentTicket)return;
        // Không giấu lỗi: nguồn ngoài thiếu CORS thì bản xem còn chưa có dòng lưu dấu.
        full.dataset.gddTraceFailed='1';
        full.style.visibility='';
        full.src=window.GDDLegacyImages?.displayUrl?.(url)||url;
        caption.textContent='Nguồn ảnh chưa hỗ trợ tạo bản lưu dấu tự động.';
        console.info('[GDD Trace] Nguồn ảnh không cho phép tạo bản lưu dấu:',err?.message||err);
      });
    }
  }
  function stepImage(delta){
    if(viewer.hidden||gallery.length<2)return;
    showGalleryImage(galleryIndex+delta);
  }
  function openImage(src, name, isPerson=false, contextImage=null, suppressDownload=false){
    const url=safeSource(src);if(!url)return;
    if(viewer.hidden)previousFocus=document.activeElement;
    const record=contextImage?.closest('#detail-content');
    viewer.dataset.gddRecordImage=record&&['people','documents'].includes(record.dataset.gddKind)?'yes':'no';
    const images=imageSequence(contextImage);
    const ownerCode=contextImage?.closest('#detail-content')?.dataset.gddArchiveCode||'';
    const singleCode=contextImage?.dataset.photoCode||ownerCode;
    gallery=images.length?images.map(item=>({src:item.src,title:item.title,isPerson:Boolean(isPerson),
      noDownload:Boolean(suppressDownload),photoCode:item.photoCode||ownerCode})):
      [{src:url,title:name||'Ảnh tư liệu',isPerson:Boolean(isPerson),
        noDownload:Boolean(suppressDownload),photoCode:singleCode}];
    const found=images.findIndex(item=>item.element===contextImage);
    galleryIndex=found>=0?found:Math.max(0,gallery.findIndex(item=>item.src===url));
    showGalleryImage(galleryIndex);
    $('gdd-image-close').focus({preventScroll:true});
  }
  function imageReady(){
    if(viewer.hidden)return;
    full.style.visibility='';
    loading.hidden=true;
    // Giữ mức phóng đã chọn khi bản ảnh có dòng nguồn được tạo xong.
    if(scale<=1)reset();else updateTransform();
    caption.textContent=`Ảnh: ${full.naturalWidth} × ${full.naturalHeight} px · ${gallery.length>1?'Vuốt trái/phải để chuyển ảnh. ':''}Chạm hai lần hoặc chụm hai ngón để phóng to.`+
      (full.dataset.gddTraceFailed==='1'?' · Nguồn ảnh chưa hỗ trợ lưu dấu tự động.':'');
  }
  full.addEventListener('load',imageReady);
  full.addEventListener('error',()=>{loading.hidden=false;loading.textContent='Không thể hiển thị ảnh tư liệu. Xin thử lại sau.';});
  function closeImage(navigate=true){
    if(viewer.hidden)return;
    viewer.hidden=true;delete viewer.dataset.gddRecordImage;document.body.classList.remove('gdd-photo-open');
    ++viewTicket;
    if(tracedPreviewURL){URL.revokeObjectURL(tracedPreviewURL);tracedPreviewURL='';}
    pointers.clear();start=null;swipeStart=null;hadMultiTouch=false;gallery=[];galleryIndex=0;source='';personPhoto=false;full.removeAttribute('src');
    full.style.visibility='';
    if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});
    if(navigate&&history.state?.__gddLayer==='photo')history.back();
  }
  $('gdd-image-close').addEventListener('click',()=>closeImage());
  $('gdd-image-prev').addEventListener('click',()=>stepImage(-1));
  $('gdd-image-next').addEventListener('click',()=>stepImage(1));
  window.addEventListener('popstate',()=>{
    if(!viewer.hidden&&history.state?.__gddLayer!=='photo')closeImage(false);
  });
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
    if(e.target instanceof Element&&e.target.closest('.gdd-image-nav'))return;
    if(e.pointerType==='mouse'&&e.button!==0)return;
    // Restricted record images are not native hit targets; the stage retains custom gestures.
    const restricted=viewer.dataset.gddRecordImage==='yes'&&['checking','view','protected'].includes(document.body.dataset.gddScreenAccess);
    if(restricted||e.pointerType!=='touch')e.preventDefault();
    if(pointers.size===0){swipeStart={x:e.clientX,y:e.clientY,time:Date.now(),startScale:scale};hadMultiTouch=false;}
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pointers.size>1){hadMultiTouch=true;swipeStart=null;}
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
    const gesture=swipeStart;
    pointers.delete(e.pointerId);snapshot();
    if(e.type==='pointerup'&&wasSingle&&e.pointerType==='touch'&&!hadMultiTouch&&gesture){
      const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
      const elapsed=Date.now()-gesture.time;
      const threshold=Math.max(45,Math.min(85,stage.clientWidth*.12));
      const swiped=gallery.length>1&&gesture.startScale<=1.01&&scale<=1.01&&
        elapsed<1200&&Math.abs(dx)>=threshold&&Math.abs(dx)>Math.abs(dy)*1.25;
      if(swiped){
        lastTap=0;
        stepImage(dx<0?1:-1);
      }else if(Math.hypot(dx,dy)<22){
        const now=Date.now();
        if(now-lastTap<340){reset();zoomTo(2.5);lastTap=0;}else lastTap=now;
      }else lastTap=0;
    }
    if(pointers.size===0){swipeStart=null;hadMultiTouch=false;}
  };
  stage.addEventListener('pointerup',pointerEnd);
  stage.addEventListener('pointercancel',pointerEnd);
  stage.addEventListener('lostpointercapture',pointerEnd);
  window.addEventListener('resize',()=>{if(!viewer.hidden)updateTransform();});
  document.addEventListener('keydown',e=>{
    if(viewer.hidden)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();closeImage();}
    else if(e.key==='ArrowLeft'){e.preventDefault();stepImage(-1);}
    else if(e.key==='ArrowRight'){e.preventDefault();stepImage(1);}
    else if(e.key==='+'||e.key==='='){e.preventDefault();zoomTo(scale*1.5);}
    else if(e.key==='-'){e.preventDefault();zoomTo(scale/1.5);}
    else if(e.key==='0'){e.preventDefault();reset();}
  },true);
  
  
  // Chính sách nút xem/tải ảnh dựa trên mục hiển thị, không thay đổi nguồn ảnh.
  function isPersonFrame(frame){
    return Boolean(frame.closest('#people-grid, #gdd-people-list, [data-preview-section="chuc-sac"]')||
      frame.closest('#detail-content[data-gdd-kind="people"]'));
  }
  
  // Một bài có thể được trưng bày trong Hình ảnh dù loại dữ liệu gốc là Biên khảo.
  const handwritingAlbumSlug='mot-so-thu-but-chu-ky-va-an-moc-cua-chu-vi-tien-boi-dai-dao-l81pg2';
  function isMediaDetail(){
    const detail=document.getElementById('detail-content');
    if(!detail)return false;
    return detail.dataset.gddKind==='media'||detail.dataset.gddDisplayTarget==='media'||
      (detail.dataset.gddKind==='posts'&&location.hash==='#bai-viet/'+handwritingAlbumSlug);
  }
  function isMediaFrame(frame){
    return Boolean(frame?.closest('#gallery-grid,[data-preview-section="hinh-anh"],[data-open-kind="media"]')||
      (frame?.closest('#detail-content')&&isMediaDetail()));
  }
  // Nhấn vào vùng có kính lúp để xem ảnh; hồ sơ/tựa bài vẫn mở qua nút riêng.
  // #gdd-people-list là danh sách Chức sắc Nam/Nữ mới, không nằm trong #people-grid.
  // Các thẻ xem trước ở Trang Chủ cũng được tạo động sau khi tải dữ liệu.
  document.addEventListener('click',e=>{
    const el=e.target;
    if(!(el instanceof Element)||!viewer.hidden)return;
    const frame=el.closest(
      '#gallery-grid .gallery-visual, #people-grid .person-media, '+
      '#gdd-people-list .person-media, #gdd-directory .gdd-preview-thumb, '+
      '#detail-content .detail-cover'
    );
    const img=frame?.querySelector('img');
    if(!img)return;
    const src=img.currentSrc||img.src;
    if(!safeSource(src))return;
    // Bắt click trong capture trước sự kiện mở hồ sơ tại app.js.
    e.preventDefault();
    e.stopImmediatePropagation();
    openImage(src,imgTitle(img),isPersonFrame(frame),img,isMediaFrame(frame));
  },true);

  // Chức Sắc và Hình ảnh không có nút tải gốc; giữ nguyên chức năng xem, phóng to, chuyển ảnh.
  const detail=document.getElementById('detail-content');
  if(detail){
    const injectControls=()=>{
      const isPerson=detail.dataset.gddKind==='people';
      const isImageCollection=isMediaDetail();
      const hideImageActions=isPerson||isImageCollection;
      if(hideImageActions){
        // Chỉ xóa link dư dưới ảnh; không xóa link đọc PDF/Word.
        detail.querySelectorAll('.gdd-album-figure .gdd-album-open').forEach(link=>{
          // Không loại bỏ liên kết Đọc tài liệu (PDF/Word).
          if(!link.closest('figure')?.querySelector('.gdd-album-pdf-tile')) link.remove();
        });
      }
      // Mọi ảnh bìa chỉ có nút xem toàn màn hình; dọn nút tải cũ ở tất cả chuyên mục.
      detail.querySelectorAll('.gdd-image-actions [data-gdd-image-save]').forEach(button=>button.remove());
      const cover=detail.querySelector('.detail-cover');
      const img=cover?.querySelector('img');
      if(!img)return;
      let bar=cover.nextElementSibling?.classList.contains('gdd-image-actions')?cover.nextElementSibling:null;
      if(!bar){
        bar=document.createElement('div');bar.className='gdd-image-actions';
        cover.after(bar);
      }
      if(!bar.querySelector('[data-gdd-image-show]')){
        const show=document.createElement('button');
        show.type='button';show.className='gdd-image-action';
        show.dataset.gddImageShow='1';show.textContent='⤢ Xem ảnh toàn màn hình';
        show.addEventListener('click',()=>openImage(img.currentSrc||img.src,imgTitle(img),
          detail.dataset.gddKind==='people',img,isMediaDetail()));
        bar.append(show);
      }

    };
    const observer=new MutationObserver(injectControls);
    observer.observe(detail,{childList:true,subtree:true});
    injectControls();
  }
})();
