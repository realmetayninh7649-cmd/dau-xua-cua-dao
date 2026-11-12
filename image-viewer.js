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
    .gdd-person-watermark-status { flex-basis:100%; font-size:11px; color:#386454; line-height:1.5; }
    .gdd-image-viewer[hidden] { display:none!important; }
    #gdd-image-original[hidden] { display:none!important; }
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
    .gdd-image-stamp { position:absolute; z-index:2; pointer-events:none; transform-origin:center center; display:block; }
    .gdd-image-stamp[hidden] { display:none!important; }
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
      <img id="gdd-image-full" alt="Ảnh tư liệu">
      <canvas id="gdd-image-stamp" class="gdd-image-stamp" aria-hidden="true" hidden></canvas>
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
  const stage=$('gdd-image-stage'), full=$('gdd-image-full'), loading=$('gdd-image-loading'),
    stamp=$('gdd-image-stamp');
  const caption=$('gdd-image-caption'), download=$('gdd-image-download'), orig=$('gdd-image-original');
  let scale=1, x=0, y=0, source='', title='', previousFocus=null, personPhoto=false;
  const pointers=new Map();
  let start=null, lastTap=0;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function positionStamp(){
    if(!personPhoto||stamp.hidden||!full.offsetWidth||!full.offsetHeight)return;
    stamp.style.left=((stage.clientWidth-full.offsetWidth)/2)+'px';
    stamp.style.top=((stage.clientHeight-full.offsetHeight)/2)+'px';
    stamp.style.width=full.offsetWidth+'px';
    stamp.style.height=full.offsetHeight+'px';
    stamp.style.transform=full.style.transform||'none';
  }
  function renderStamp(){
    if(!personPhoto){stamp.hidden=true;return true;}
    const maker=window.GDDPersonPhotoWatermark;
    if(!maker||typeof maker.drawSeal!=='function')return false;
    const w=full.naturalWidth,h=full.naturalHeight;
    if(!w||!h)return false;
    const ratio=Math.min(1,2200/Math.max(w,h));
    stamp.width=Math.max(1,Math.round(w*ratio));
    stamp.height=Math.max(1,Math.round(h*ratio));
    const ctx=stamp.getContext('2d',{alpha:true});
    if(!ctx)return false;
    ctx.clearRect(0,0,stamp.width,stamp.height);
    maker.drawSeal(ctx,stamp.width,stamp.height);
    stamp.hidden=false;
    requestAnimationFrame(positionStamp);
    return true;
  }
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
    positionStamp();
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
  function openImage(src, name, isPerson=false){
    const url=safeSource(src);if(!url)return;
    previousFocus=document.activeElement;
    title=(name||'Ảnh tư liệu').trim();source=url;personPhoto=Boolean(isPerson);
    if(personPhoto&&!window.GDDPersonPhotoWatermark?.drawSeal){
      alert('Tem bảo vệ ảnh chưa sẵn sàng. Xin tải lại website rồi thử lại.');
      return;
    }
    stamp.hidden=true;
    $('gdd-image-title').textContent=title;
    full.alt=title;full.removeAttribute('src');full.src=url;
    orig.href=url;orig.hidden=personPhoto;
    download.textContent=personPhoto?'↓ Tải Ảnh':'↓ Tải ảnh gốc';
    loading.hidden=false;loading.textContent='Đang mở ảnh…';
    caption.textContent=personPhoto?
      'Ảnh hiển thị với dấu hologram ánh kim mờ ở góc dưới.':
      'Chụm hai ngón tay để phóng to; kéo để xem chi tiết.';
    viewer.hidden=false;document.body.classList.add('gdd-photo-open');reset();
    $('gdd-image-close').focus({preventScroll:true});
    // Ảnh có thể đã ở bộ đệm trước khi onload được gọi.
    if(full.complete&&full.naturalWidth)imageReady();
  }
  function imageReady(){
    try{
      if(!renderStamp()&&personPhoto){
        full.style.visibility='hidden';loading.hidden=false;
        loading.textContent='Không thể hiện tem bảo vệ. Xin tải lại website.';
        return;
      }
      full.style.visibility='';
      loading.hidden=true;reset();
      caption.textContent=personPhoto?
        `Ảnh: ${full.naturalWidth} × ${full.naturalHeight} px · Tem hologram xuất hiện khi xem và khi tải.`:
        `Ảnh gốc: ${full.naturalWidth} × ${full.naturalHeight} px · Chạm hai lần hoặc chụm hai ngón để phóng to.`;
    }catch(error){
      console.warn('[GDD Watermark Viewer]',error);
      if(personPhoto)full.style.visibility='hidden';
      stamp.hidden=true;loading.hidden=false;
      loading.textContent='Không thể tạo tem hologram cho ảnh này.';
    }
  }
  full.addEventListener('load',imageReady);
  full.addEventListener('error',()=>{loading.hidden=false;loading.textContent=personPhoto?
    'Không thể hiển thị ảnh. Xin kiểm tra đường dẫn tư liệu.':
    'Không thể hiển thị ảnh. Hãy chọn “Mở ảnh gốc”.';});
  function closeImage(){
    if(viewer.hidden)return;
    viewer.hidden=true;document.body.classList.remove('gdd-photo-open');
    pointers.clear();start=null;source='';personPhoto=false;full.removeAttribute('src');
    full.style.visibility='';stamp.hidden=true;stamp.width=0;stamp.height=0;
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
  window.addEventListener('resize',()=>{if(!viewer.hidden){updateTransform();requestAnimationFrame(positionStamp)}});
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
  function noticeWatermark(btn,message){
    const actions=btn.closest('.gdd-image-actions');
    if(actions){
      let note=actions.querySelector('.gdd-person-watermark-status');
      if(!note){
        note=document.createElement('span');
        note.className='gdd-person-watermark-status';
        note.setAttribute('role','status');
        actions.appendChild(note);
      }
      note.textContent=message;
    }
    caption.textContent=message;
  }
  async function downloadImage(url,label,btn,markPerson=false){
    if(!url)return;
    const old=btn.textContent;
    btn.disabled=true;
    btn.textContent=markPerson?'Đang xử lý ảnh…':'Đang chuẩn bị ảnh…';
    try {
      const response=await fetch(url,{mode:'cors',credentials:'omit'});
      if(!response.ok)throw Error('Nguồn ảnh không cho phép tải');
      const original=await response.blob();
      if(!original.type.startsWith('image/'))throw Error('Tệp này không phải hình ảnh');
      let output=original,name=filename(url,label);
      if(markPerson){
        if(!window.GDDPersonPhotoWatermark)throw Error('Bộ tạo dấu ảnh chưa sẵn sàng. Vui lòng tải lại trang.');
        const marked=await window.GDDPersonPhotoWatermark.fromBlob(original);
        output=marked.blob;
        name=window.GDDPersonPhotoWatermark.fileName(url,label,marked.extension);
      }
      const blobUrl=URL.createObjectURL(output),a=document.createElement('a');
      a.href=blobUrl;
      a.download=name;
      document.body.appendChild(a);
      a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(blobUrl),60000);
      noticeWatermark(btn,markPerson?
        'Đã yêu cầu lưu ảnh có dấu bản quyền mờ. Trên iPhone, hãy kiểm tra Tệp / Tải về.':
        'Đã yêu cầu lưu ảnh gốc. Trên iPhone, hãy kiểm tra Tệp / Tải về.');
    } catch(err) {
      console.warn('[GDD Photo Download]',err);
      const message=markPerson?
        'Chưa thể tạo bản có dấu cho ảnh này. Ảnh gốc không được tải thay thế. '+(err?.message||''):
        'Nguồn ảnh không cho tải trực tiếp. Nhấn “Mở ảnh gốc”, rồi chạm giữ ảnh để lưu trên iPhone.';
      noticeWatermark(btn,message);
    } finally {btn.disabled=false;btn.textContent=old;}
  }
  download.addEventListener('click',()=>downloadImage(source,title,download,personPhoto));
  
  // Chỉ ảnh trong khu Hồ sơ Chức sắc, không áp dụng cho Hình ảnh, Video hoặc Biên khảo.
  function isPersonFrame(frame){
    return Boolean(frame.closest('#people-grid, #gdd-people-list, [data-preview-section="chuc-sac"]')||
      frame.closest('#detail-content[data-gdd-kind="people"]'));
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
    openImage(src,imgTitle(img),isPersonFrame(frame));
  },true);

  // Thẻ chi tiết được tạo động: chỉ Chức sắc có nút lưu ảnh kèm dấu mờ.
  const detail=document.getElementById('detail-content');
  if(detail){
    const injectControls=()=>{
      const isPerson=detail.dataset.gddKind==='people';
      // Bộ ảnh liên quan trong hồ sơ Chức sắc: bấm liên kết cũng tải bản có dấu.
      if(isPerson){
        detail.querySelectorAll('.gdd-album-open:not([data-gdd-person-download])').forEach(link=>{
          link.dataset.gddPersonDownload='1';
          link.textContent='↓ Tải Ảnh';
          link.removeAttribute('target');
          link.addEventListener('click',event=>{
            event.preventDefault();
            downloadImage(link.href,link.closest('figure')?.querySelector('figcaption')?.textContent||'Chức sắc',
              link,true);
          });
        });
      }
      const cover=detail.querySelector('.detail-cover');
      const img=cover?.querySelector('img');
      if(!img||cover.nextElementSibling?.classList.contains('gdd-image-actions'))return;
      const bar=document.createElement('div');bar.className='gdd-image-actions';
      const show=document.createElement('button');
      show.type='button';show.className='gdd-image-action';show.textContent='⤢ Xem ảnh toàn màn hình';
      show.addEventListener('click',()=>openImage(img.currentSrc||img.src,imgTitle(img),
        detail.dataset.gddKind==='people'));
      const save=document.createElement('button');
      save.type='button';save.className='gdd-image-action';
      save.textContent=isPerson?'↓ Tải Ảnh':'↓ Tải ảnh gốc';
      save.addEventListener('click',()=>downloadImage(img.currentSrc||img.src,imgTitle(img),
        save,detail.dataset.gddKind==='people'));
      bar.append(show,save);cover.after(bar);
    };
    const observer=new MutationObserver(injectControls);
    observer.observe(detail,{childList:true,subtree:true});
    injectControls();
  }
})();
