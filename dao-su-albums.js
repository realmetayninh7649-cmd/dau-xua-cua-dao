/* GIỮ ĐẠO GIỮA ĐỜI — Thư viện ảnh tư liệu nhiều ảnh (2026-11-03)
   Bổ sung độc lập: không đổi các bảng hay bộ mã hiện có. Yêu cầu chạy SQL migration.
   Chỉ tài khoản quản trị được tải lên và biên tập. Ảnh lớn được tối ưu trước khi gửi. */
(() => {
  'use strict';
  if (window.__gddAlbumsLoaded) return;
  window.__gddAlbumsLoaded = true;

  const cfg = window.SITE_CONFIG || {};
  const ALBUM_TABLE = 'archive_gallery_images';
  const ALLOWED_KINDS = new Set(['people','posts','media','videos','obituaries','documents']);
  const PREFIX_KIND = {
    'nhan-vat':'people', 'bai-viet':'posts', 'hinh-anh-tu-lieu':'media',
    'video-dao-su':'videos', 'ai-tin':'obituaries', 'tai-lieu-so-hoa':'documents'
  };
  const KIND_LABEL = {
    people:'Hồ sơ Chức sắc', posts:'Biên khảo', media:'Hình ảnh',
    videos:'Video Đạo Sử', obituaries:'Ai Tín', documents:'Tài liệu số hóa'
  };
  const FILE_EXT = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  const MAX_FILES = 30;
  let clientPromise = null;
  let editing = null;
  let editorSeq = 0, detailSeq = 0;
  // Giữ tệp trong bộ nhớ cho đến khi người quản trị bấm Đăng/Lưu MỘT LẦN.
  let pendingFiles = [];
  // Xem ảnh nhỏ ngay khi chọn từ Ảnh/Tệp, trước khi tải lên Supabase.
  // Blob URL không sao chép toàn bộ ảnh thành chuỗi base64 và không giải mã tuần tự
  // bằng canvas gây thiếu RAM với hàng chục ảnh lớn trên Safari iPhone.
  function releaseThumbnails(items){
    for(const item of items){
      if(item.previewUrl){
        try{URL.revokeObjectURL(item.previewUrl);}catch{}
      }
      item.previewUrl='';
      item.previewError='';
      item.thumbnailElement=null;
    }
  }
  function clearPendingFiles(){releaseThumbnails(pendingFiles);pendingFiles=[];}
  function makePreviewUrl(item){
    try{
      item.previewUrl=URL.createObjectURL(item.file);
      item.previewError='';
    }catch(error){
      item.previewUrl='';
      item.previewError='Không tạo được ảnh xem trước. File gốc vẫn giữ để tải lên.';
    }
  }
  function updateThumbnail(item){
    const box=item.thumbnailElement;
    if(!box)return;
    box.replaceChildren();
    const number=document.createElement('span');
    number.className='gdd-album-photo-no';
    number.textContent=String(pendingFiles.indexOf(item)+1).padStart(2,'0');
    if(item.previewUrl){
      const image=document.createElement('img');
      image.alt='Xem trước: '+item.file.name;
      image.decoding='async';
      image.loading=pendingFiles.indexOf(item)<4?'eager':'lazy';
      image.src=item.previewUrl;
      image.addEventListener('error',()=>{
        if(item.thumbnailElement!==box)return;
        image.remove();
        box.classList.add('gdd-album-pending-thumb--empty');
        item.previewError='Ảnh không hiển thị được trên thiết bị này; tệp vẫn được giữ để đăng.';
        box.title=item.previewError;
        const fallback=document.createElement('small');
        fallback.className='gdd-album-preview-error';
        fallback.textContent='Không xem trước';
        box.insertBefore(fallback,box.firstChild);
      },{once:true});
      box.append(image,number);
      box.classList.remove('gdd-album-pending-thumb--empty');
      box.title='Xem trước '+item.file.name;
    }else{
      box.classList.add('gdd-album-pending-thumb--empty');
      box.title=item.previewError||'Không có ảnh xem trước';
      box.append(number);
    }
  }
  let panelContext = '';
  let uploading = false;


  const $ = (selector, root=document) => root.querySelector(selector);
  const escape = v => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = value => {
    if (typeof value !== 'string') return '';
    try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; }
    catch { return ''; }
  };
  async function getClient() {
    if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) throw Error('Chưa kết nối Supabase.');
    if (!clientPromise) clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(({createClient})=>createClient(cfg.supabaseUrl,cfg.supabasePublishableKey));
    return clientPromise;
  }

  const style = document.createElement('style');
  style.id = 'gdd-albums-style';
  style.textContent = `
    .gdd-album { margin:30px 0 35px; padding-top:25px; border-top:1px solid #ddd9cb; }
    .gdd-album-head { display:flex;align-items:baseline;gap:12px;justify-content:space-between;margin:0 0 17px; }
    .gdd-album h3 { font:600 22px/1.5 'Noto Serif',Georgia,serif;color:#1b5047;margin:0; }
    .gdd-album-count { font-size:12px;color:#887954;white-space:nowrap; }
    .gdd-album-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px; }
    .gdd-album-figure { margin:0;min-width:0; }
    #detail-content .gdd-album .gdd-album-tile.detail-cover {
      display:flex; align-items:center;justify-content:center;position:relative;
      width:100%;height:auto;min-height:0;aspect-ratio:4/5;margin:0;padding:9px;
      background:#e9e8df;border:1px solid #dcd9cd;border-radius:5px;overflow:hidden;cursor:zoom-in;
    }
    #detail-content .gdd-album .gdd-album-tile img {
      width:100%;height:100%;max-height:100%;object-fit:contain;object-position:center;
    }
    .gdd-album-figure figcaption {font:400 12px/1.7 'Be Vietnam Pro',sans-serif;color:#5b685f;margin:7px 2px 0;overflow-wrap:anywhere;}
    .gdd-album-page {display:inline-block;font-weight:700;color:#a17e44;margin-right:5px;}
    .gdd-album-trace {display:block;font:500 10px/1.5 'Be Vietnam Pro',sans-serif;color:#68776D;overflow-wrap:anywhere;margin-top:4px;}
    .gdd-album-figure.gdd-trace-match {outline:3px solid #A18A56;outline-offset:3px;border-radius:5px;}
    .gdd-album-open {font-size:11px;color:#20594e;text-decoration:underline;text-underline-offset:3px;}
    #gdd-admin-album-panel {padding:22px;margin:24px 0 30px;background:#f8faf5;border:1px solid #c9d5c7;border-radius:7px;}
    #gdd-admin-album-panel h3 {font:600 20px/1.45 'Noto Serif',Georgia,serif;margin:0 0 7px;color:#1b5047;}
    .gdd-album-note {font:400 12px/1.75 'Be Vietnam Pro',sans-serif;color:#66756a;margin:7px 0 14px;}
    .gdd-album-field {display:block;font:600 12px/1.55 'Be Vietnam Pro',sans-serif;color:#405347;margin-bottom:8px;}
    .gdd-album-field input {box-sizing:border-box;width:100%;padding:10px;border:1px solid #cbd6cd;background:#fff;border-radius:5px;margin-top:6px;font:inherit;}
    .gdd-album-commands {display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:12px 0;}
    .gdd-album-btn {border:1px solid #c0cfc5;border-radius:5px;background:#fff;color:#195047;font:600 12px/1.5 'Be Vietnam Pro',sans-serif;padding:9px 12px;cursor:pointer;min-height:38px;}
    .gdd-album-btn.primary {background:#1a5045;color:#fff;border-color:#1a5045;}
    .gdd-album-btn.danger {color:#95483c;border-color:#e3c6bb;}
    .gdd-album-btn:disabled {opacity:.55;cursor:wait;}
    .gdd-album-status {min-height:22px;font:500 12px/1.7 'Be Vietnam Pro',sans-serif;color:#1e5947;white-space:pre-wrap;overflow-wrap:anywhere;}
    .gdd-admin-photos {display:flex;flex-direction:column;gap:11px;margin-top:15px;}
    .gdd-admin-photo {display:grid;grid-template-columns:68px minmax(0,1fr);gap:12px;background:#fff;border:1px solid #e0e6dd;border-radius:6px;padding:10px;}
    .gdd-admin-photo img {width:68px;height:85px;object-fit:contain;background:#e8ece5;border-radius:4px;}
    .gdd-album-pending-thumb {position:relative;width:68px;height:85px;min-width:0;overflow:hidden;border-radius:5px;background:#eff2ea;}
    .gdd-album-pending-thumb img {display:block;width:100%;height:100%;object-fit:contain;background:#eff2ea;}
    .gdd-album-pending-thumb .gdd-album-photo-no {position:absolute;right:3px;bottom:3px;min-height:0;padding:2px 5px;border-radius:3px;background:#183a31d9;color:#fff;font:700 10px/1.35 'Be Vietnam Pro',sans-serif;}
    .gdd-album-pending-thumb--empty .gdd-album-photo-no {position:static;display:flex;align-items:center;justify-content:center;width:100%;height:100%;background:#eff2ea;color:#7e8b80;font:700 17px Georgia,serif;}
    .gdd-album-preview-error {position:absolute;top:4px;left:2px;right:2px;text-align:center;font:600 9px/1.3 'Be Vietnam Pro',sans-serif;color:#607569;}
    .gdd-admin-photo .gdd-album-field {margin:0 0 8px;}
    .gdd-admin-photo .gdd-album-field input {margin-top:5px;}
    .gdd-admin-photo .gdd-album-commands {margin:0;gap:6px;}
    .gdd-album-photo-no {display:flex;align-items:center;justify-content:center;min-height:70px;font:700 17px Georgia,serif;color:#7e8b80;background:#eff2ea;border-radius:5px;}
    .gdd-album-selection {margin:12px 0 16px;}
    .gdd-album-pdf-tile{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-decoration:none;color:#1b5047;background:#ecf1e9;border:1px solid #d0dcd0;border-radius:5px;min-height:0;aspect-ratio:4/5;padding:12px;text-align:center;overflow-wrap:anywhere}
    .gdd-album-pdf-tile .gdd-album-pdf-label{font:800 23px/1.2 'Be Vietnam Pro',sans-serif;color:#ad463c}
    .gdd-album-pdf-tile small{font:600 11px/1.5 'Be Vietnam Pro',sans-serif;color:#28594d}
    .gdd-album-pdf-tile .gdd-album-word-label{color:#245b82}
    .gdd-admin-pdf-file{width:68px;min-height:85px;display:flex;align-items:center;justify-content:center;background:#ecf1e9;color:#a1453c;font:800 13px/1 'Be Vietnam Pro',sans-serif;border:1px solid #d2ded4;border-radius:4px}
    @media(max-width:530px){.gdd-admin-pdf-file{width:56px;min-height:73px}}
    .gdd-album-empty {font:400 12px/1.75 'Be Vietnam Pro',sans-serif;color:#778279;margin:14px 0 0;}
    @media(max-width:530px){.gdd-album-grid{gap:10px;}.gdd-album h3{font-size:18px;}.gdd-album-figure figcaption{font-size:11px;}#gdd-admin-album-panel{padding:15px 12px;}.gdd-admin-photo{grid-template-columns:56px minmax(0,1fr);gap:8px;}.gdd-admin-photo img,.gdd-album-pending-thumb{width:56px;height:73px;}.gdd-album-btn{font-size:11px;padding:8px 9px;}}
  `;
  document.head.appendChild(style);

  /* Phần công khai: đọc ảnh chỉ khi bản ghi cha đã được công bố (RLS). */
  const details = $('#detail-content');
  let detailsHandle = '';
  function currentDetail() {
    const hash=location.hash.match(/^#([^/]+)\/(.+)$/);
    if (!hash) return null;
    const kind=PREFIX_KIND[hash[1]];
    if (!kind || !ALLOWED_KINDS.has(kind)) return null;
    let slug;
    try { slug=decodeURIComponent(hash[2]); } catch { return null; }
    return {kind,slug};
  }
  async function showPublicAlbum(target, kind, slug, ticket) {
    try {
      const supa=await getClient();
      const {data:parent,error:lookupError}=await supa.from(kind).select('id').eq('slug',slug).maybeSingle();
      if (lookupError) throw lookupError;
      if (!parent || ticket!==detailSeq || !target.isConnected) return;
      const {data, error}=await supa.from(ALBUM_TABLE)
        .select('id,image_url,caption,sort_order,photo_no,photo_code').eq('owner_kind',kind).eq('owner_id',parent.id)
        .order('sort_order',{ascending:true}).order('created_at',{ascending:true}).limit(200);
      if (error) throw error;
      if (!data?.length || ticket!==detailSeq || !target.isConnected) return;
      const rows=data.filter(p=>safeUrl(p.image_url));
      if (!rows.length) return;
      const header=document.createElement('div');header.className='gdd-album-head';
      const h=document.createElement('h3');h.textContent='Hình ảnh và văn kiện đính kèm';
      const count=document.createElement('span');count.className='gdd-album-count';count.textContent=rows.length+(['documents','media'].includes(kind)?' tệp':' ảnh');
      header.append(h,count);target.appendChild(header);
      const grid=document.createElement('div');grid.className='gdd-album-grid';
      rows.forEach((item,i)=>{
        const url=safeUrl(item.image_url);
        const fileExt=(['documents','media'].includes(kind)?(new URL(url).pathname.match(/\.(pdf|docx|doc)$/i)?.[1]||'').toLowerCase():'');
        const isR2Reader=/\/r2-xem\.html$/i.test(new URL(url).pathname)&&new URL(url).origin===location.origin;
        const isDocument=Boolean(fileExt)||isR2Reader,isPdf=fileExt==='pdf';
        const readingUrl=isDocument?(window.GDDDocumentReader?.readerUrl(url)||url):url;
        const docLabel=isR2Reader?'BẢN XEM':isPdf?'PDF':'WORD';
        const figure=document.createElement('figure');figure.className='gdd-album-figure';
        if(item.photo_code)figure.dataset.photoCode=item.photo_code;
        if(isDocument){
          const tile=document.createElement('a');
          tile.href=readingUrl;tile.target='_blank';tile.rel='noopener noreferrer';tile.className='gdd-album-pdf-tile';
          tile.setAttribute('aria-label','Mở '+docLabel+' đính kèm số '+(i+1));
          const pdf=document.createElement('strong');pdf.className='gdd-album-pdf-label'+(isPdf?'':' gdd-album-word-label');pdf.textContent=docLabel;
          const name=document.createElement('small');name.textContent=item.caption?.trim()||('Tài liệu '+docLabel+' số '+(i+1));
          tile.append(pdf,name);figure.appendChild(tile);
        }else{
          const button=document.createElement('button');button.type='button';button.className='gdd-album-tile detail-cover';
          button.setAttribute('aria-label','Xem ảnh tư liệu số '+(i+1));
          const img=document.createElement('img');img.loading='lazy';img.src=window.GDDLegacyImages?.displayUrl(url)||url;
          if(item.photo_code)img.dataset.photoCode=item.photo_code;
          img.alt=item.caption?.trim()||'Ảnh tư liệu số '+(i+1);
          button.appendChild(img);
          button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();img.click();}});
          figure.appendChild(button);
        }
        const caption=document.createElement('figcaption');
        const page=document.createElement('span');page.className='gdd-album-page';page.textContent=String(i+1).padStart(2,'0')+'.';
        caption.append(page,document.createTextNode(item.caption?.trim()||(isDocument?'Tài liệu '+docLabel:'Ảnh tư liệu')));
        if(item.photo_code){
          const trace=document.createElement('span');
          trace.className='gdd-album-trace';
          trace.textContent='dauxuacuadao.info.vn | '+item.photo_code;
          caption.appendChild(trace);
        }
        figure.appendChild(caption);
        // Ảnh đã mở bằng cách chạm trực tiếp vào hình; không thêm link dư thừa.
        // Chỉ giữ đường dẫn đọc PDF/Word và tài liệu R2 dạng bản xem.
        if(isDocument){
          const original=document.createElement('div'),open=document.createElement('a');
          open.href=readingUrl;open.target='_blank';open.rel='noopener noreferrer';open.className='gdd-album-open';
          open.textContent='Đọc tài liệu ↗';original.appendChild(open);
          figure.appendChild(original);
        }
        grid.appendChild(figure);
      });
      target.appendChild(grid);
      // Deep-link tra cứu mã ảnh: quay về đúng album và mở đúng tấm, không đổi slug/QR.
      const wanted=new URLSearchParams(location.search).get('anh');
      if(wanted){
        const match=[...grid.querySelectorAll('figure[data-photo-code]')]
          .find(el=>el.dataset.photoCode===wanted);
        if(match){
          match.classList.add('gdd-trace-match');
          requestAnimationFrame(()=>{
            if(!match.isConnected||ticket!==detailSeq)return;
            match.scrollIntoView({behavior:'auto',block:'center'});
            match.querySelector('.gdd-album-tile img')?.click();
          });
        }
      }
    } catch (error) {
      // Trang chi tiết vẫn dùng được kể cả khi chưa chạy migration hoặc mất mạng.
      console.warn('[GDD albums] Không thể đọc album:',error);
    }
  }
  function handleDetailChange() {
    if (!details) return;
    const d=currentDetail();
    if (!d || !details.querySelector('.detail-body')) { detailsHandle='';detailSeq++;return; }
    const key=d.kind+'/'+d.slug;
    if (key===detailsHandle && details.querySelector('.gdd-album')) return;
    detailsHandle=key;
    const existing=details.querySelector('.gdd-album');existing?.remove();
    detailSeq++;
    const ticket=detailSeq;
    const target=document.createElement('section');target.className='gdd-album';target.setAttribute('aria-label','Thư viện ảnh tư liệu đính kèm');
    const anchor=details.querySelector('.detail-body') || details.querySelector('.detail-source');
    anchor.after(target);
    showPublicAlbum(target,d.kind,d.slug,ticket);
  }
  if(details) {
    // Chỉ quan sát phần tử trực tiếp để tránh vòng lặp khi tự chèn album.
    new MutationObserver(handleDetailChange).observe(details,{childList:true});
    window.addEventListener('hashchange',handleDetailChange);
  }

  /* Phần quản trị: một lần đăng = lưu bài + ảnh bìa + bộ ảnh tư liệu. */
  const editor=$('#editor-form');
  const panel=document.createElement('section');panel.id='gdd-admin-album-panel';
  const getEditorKind=()=>$('.editor-tabs button.is-selected')?.dataset.kind || '';
  function isEditing(){return ($('#editor-heading')?.textContent||'').trim()==='Sửa tư liệu';}
  function setStatus(message){const area=$('#gdd-album-status');if(area)area.textContent=message;}
  let adminRows=[];

  function validatePending(){
    if(pendingFiles.length>MAX_FILES)throw Error(`Mỗi lần đăng chọn tối đa ${MAX_FILES} ảnh.`);
    for(const item of pendingFiles){
      const f=item.file;
      if(!window.GDDImageOptimizer?.isImage(f))throw Error(`Ảnh ${f.name} không đúng định dạng ảnh được hỗ trợ.`);
      if(!f.size)throw Error(`Ảnh ${f.name} là tệp trống.`);
    }
    return true;
  }
  function renderQueue(){
    const target=$('#gdd-album-selection');if(!target)return;
    target.replaceChildren();
    if(!pendingFiles.length){target.textContent='Chưa chọn ảnh đính kèm.';return;}
    const summary=document.createElement('p');summary.className='gdd-album-note';
    summary.textContent=`Đã chọn ${pendingFiles.length} ảnh. Giữ thứ tự bên dưới, hoặc dùng nút ↑ ↓ để đổi vị trí.`;
    target.appendChild(summary);
    pendingFiles.forEach((item,index)=>{
      const row=document.createElement('div');row.className='gdd-admin-photo';
      // Giữ ảnh thu nhỏ đi kèm File/chú thích khi đổi thứ tự.
      const thumbnail=document.createElement('div');
      thumbnail.className='gdd-album-pending-thumb gdd-album-pending-thumb--empty';
      item.thumbnailElement=thumbnail;
      updateThumbnail(item);
      const content=document.createElement('div');
      const fn=document.createElement('p');fn.className='gdd-album-note';fn.style.margin='0 0 5px';
      fn.textContent=item.file.name+' · '+(item.file.size/1024/1024).toFixed(2)+' MB'+(item.saved?' · Đã lưu':'');
      const label=document.createElement('label');label.className='gdd-album-field';label.textContent='Chú thích ảnh '+(index+1);
      const input=document.createElement('input');input.type='text';input.maxLength=400;
      input.placeholder=getEditorKind()==='documents'?'Trang '+String(index+1).padStart(2,'0')+' – số hiệu văn kiện…':'Mô tả, xuất xứ hoặc niên đại (không bắt buộc)';
      input.value=item.caption;
      input.disabled=!!item.saved;
      input.addEventListener('input',()=>{item.caption=input.value;});
      label.appendChild(input);
      const cmds=document.createElement('div');cmds.className='gdd-album-commands';
      const add=(text,action,disabled=false)=>{const btn=document.createElement('button');btn.type='button';btn.className='gdd-album-btn';btn.textContent=text;btn.disabled=disabled||!!item.saved||uploading;btn.addEventListener('click',action);cmds.appendChild(btn);};
      add('↑',()=>{[pendingFiles[index-1],pendingFiles[index]]=[pendingFiles[index],pendingFiles[index-1]];renderQueue();},index===0);
      add('↓',()=>{[pendingFiles[index+1],pendingFiles[index]]=[pendingFiles[index],pendingFiles[index+1]];renderQueue();},index===pendingFiles.length-1);
      add('Gỡ',()=>{const [removed]=pendingFiles.splice(index,1);if(removed)releaseThumbnails([removed]);renderQueue();});
      content.append(fn,label,cmds);row.append(thumbnail,content);target.appendChild(row);
    });
  }
  function renderPanel(){
    if(!editor)return;
    const kind=getEditorKind();
    const owner=isEditing()&&editing&&kind===editing.kind?editing:null;
    const context=kind+':'+(owner?.id||'new');
    // Khi đổi bài hoặc đổi chuyên mục, tệp chọn ở bài cũ không được gắn nhầm.
    if(panelContext!==context){clearPendingFiles();panelContext=context;}
    const actions=editor.querySelector('.form-actions');
    if(actions&&panel.parentElement!==editor)actions.before(panel);
    if(!actions)return;
    // MutationObserver chỉ theo dõi con trực tiếp: tránh dựng lại form khi người dùng đang nhập.
    if(panel.dataset.context===context&&panel.querySelector('#gdd-album-files'))return;
    panel.dataset.context=context;
    panel.innerHTML=`
      <h3>Bộ ảnh tư liệu kèm theo</h3>
      <p class="gdd-album-note">Có thể chọn <b>nhiều ảnh ngay khi soạn bài mới</b> — không cần đăng xong rồi bấm Sửa. Chọn tối đa ${MAX_FILES} ảnh/lượt (JPG/PNG/WebP/HEIC; ảnh lớn tự tối ưu dưới 6 MB trước khi tải), sau đó nhấn <b>Đăng tư liệu</b> một lần. Ảnh bìa chính vẫn chọn riêng ở phía trên.</p>
      <label class="gdd-album-field">Chọn nhiều ảnh từ album iPhone hoặc ứng dụng Tệp
        <input type="file" id="gdd-album-files" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple>
      </label>
      <div id="gdd-album-selection" class="gdd-album-selection"></div>
      <div class="gdd-album-status" id="gdd-album-status" role="status" aria-live="polite"></div>
      ${owner?'<div id="gdd-album-admin-list"><p class="gdd-album-empty">Đang đọc các ảnh đã đính kèm…</p></div>':''}
    `;
    $('#gdd-album-files').addEventListener('change',e=>{
      const files=Array.from(e.target.files||[]);
      clearPendingFiles();
      pendingFiles=files.map(file=>({file,caption:'',saved:false,previewUrl:'',previewError:'',thumbnailElement:null}));
      // Tạo URL cho từng ảnh ngay khi chọn, không đợi FileReader hoặc thao tác đăng bài.
      for(const item of pendingFiles)makePreviewUrl(item);
      if(files.length>MAX_FILES)setStatus('Đã chọn '+files.length+' ảnh; chỉ được tối đa '+MAX_FILES+'.');
      else setStatus(files.length?'Đã chọn '+files.length+' ảnh. Ảnh nhỏ hiển thị bên trái để ghi chú ngay.':'');
      renderQueue();
      // FileList không còn cần: giữ tệp File trong queue để người dùng đổi thứ tự.
    });
    renderQueue();
    if(owner)loadAdminRows(owner,++editorSeq);
  }
  async function loadAdminRows(owner,ticket) {
    try {
      const supa=await getClient();
      const {data,error}=await supa.from(ALBUM_TABLE).select('id,image_url,caption,sort_order,photo_no,photo_code')
        .eq('owner_kind',owner.kind).eq('owner_id',owner.id)
        .order('sort_order',{ascending:true}).order('created_at',{ascending:true}).limit(250);
      if(error)throw error;
      if(ticket!==editorSeq) return;
      adminRows=data||[];
      drawAdminRows(owner,ticket);
    } catch (error) {
      const target=$('#gdd-album-admin-list');
      if(ticket===editorSeq && target)target.textContent='Không tải được bộ ảnh: '+(error.message||error)+'. Hãy kiểm tra SQL đã chạy.';
    }
  }
  function drawAdminRows(owner,ticket) {
    const list=$('#gdd-album-admin-list');if(!list||ticket!==editorSeq)return;
    if(!adminRows.length){list.innerHTML='<p class="gdd-album-empty">Bài này chưa có ảnh đính kèm.</p>';return;}
    list.innerHTML='';
    const wrap=document.createElement('div');wrap.className='gdd-admin-photos';
    adminRows.forEach((row,i)=>{
      const part=document.createElement('div');part.className='gdd-admin-photo';
      if(row.photo_code)part.dataset.photoCode=row.photo_code;
      const fileExt=['documents','media'].includes(owner.kind)?(safeUrl(row.image_url).split('?')[0].match(/\.(pdf|docx|doc)$/i)?.[1]||'').toLowerCase():'';
      const r2Reader=window.GDDDocumentReader?.kind(row.image_url)==='r2';
      const savedDocument=Boolean(fileExt)||r2Reader,fileLabel=r2Reader?'BẢN XEM':fileExt==='pdf'?'PDF':'WORD';
      const img=savedDocument?document.createElement('div'):document.createElement('img');
      if(savedDocument){img.className='gdd-admin-pdf-file';img.textContent=fileLabel;img.title=row.caption||'Tệp '+fileLabel+' đính kèm';}
      else{img.src=safeUrl(row.image_url);img.alt=row.caption||'Ảnh tư liệu';img.loading='lazy';}
      const content=document.createElement('div');
      const label=document.createElement('label');label.className='gdd-album-field';label.textContent=`${savedDocument?'Tệp':'Ảnh'} số ${i+1}${row.photo_code?' · '+row.photo_code:''} — Chú thích`;
      const input=document.createElement('input');input.type='text';input.maxLength=400;input.value=row.caption||'';input.placeholder='Ví dụ: Trang 01 — Thánh Lịnh số…';label.appendChild(input);
      const cmds=document.createElement('div');cmds.className='gdd-album-commands';
      if(savedDocument){const link=document.createElement('a');link.className='gdd-album-btn';link.href=window.GDDDocumentReader?.readerUrl(safeUrl(row.image_url))||safeUrl(row.image_url);link.target='_blank';link.rel='noopener noreferrer';link.textContent='Mở '+fileLabel;cmds.appendChild(link)}
      const make=(caption,run,disabled=false,danger=false)=>{const b=document.createElement('button');b.type='button';b.className='gdd-album-btn'+(danger?' danger':'');b.textContent=caption;b.disabled=disabled;b.addEventListener('click',()=>run(b));cmds.appendChild(b);};
      make('Lưu chú thích',async b=>{b.disabled=true;try{const supa=await getClient();const {error}=await supa.from(ALBUM_TABLE).update({caption:input.value.trim()||null}).eq('id',row.id);if(error)throw error;setStatus('Đã lưu chú thích.');await loadAdminRows(owner,ticket);}catch(e){setStatus('Lỗi: '+e.message);b.disabled=false;}});
      make('↑',()=>shiftImage(i,-1,owner,ticket),i===0);
      make('↓',()=>shiftImage(i,1,owner,ticket),i===adminRows.length-1);
      make('Gỡ ảnh',async b=>{
        if(!confirm('Gỡ ảnh này khỏi bài viết? Tệp gốc trong Storage không bị xóa.'))return;
        b.disabled=true;
        try{const supa=await getClient();const {error}=await supa.from(ALBUM_TABLE).delete().eq('id',row.id);if(error)throw error;setStatus('Đã gỡ ảnh khỏi bài.');await loadAdminRows(owner,ticket);}catch(e){setStatus('Lỗi: '+e.message);b.disabled=false;}
      },false,true);
      content.append(label,cmds);part.append(img,content);wrap.appendChild(part);
    });list.appendChild(wrap);
  }
  async function shiftImage(index,delta,owner,ticket) {
    const target=index+delta;
    if(target<0||target>=adminRows.length)return;
    const a=adminRows[index],b=adminRows[target];
    // Giá trị âm tạm để tránh trùng số thứ tự khi đổi chỗ.
    const temp=-Math.abs(Date.now());
    try{
      const supa=await getClient();
      for(const [id,order] of [[a.id,temp],[b.id,a.sort_order],[a.id,b.sort_order]]){
        const {error}=await supa.from(ALBUM_TABLE).update({sort_order:order}).eq('id',id);
        if(error)throw error;
      }
      setStatus('Đã đổi thứ tự ảnh.');await loadAdminRows(owner,ticket);
    }catch(e){setStatus('Không đổi được thứ tự: '+e.message);await loadAdminRows(owner,ticket);}
  }

  // Giới hạn mạng: 2 ảnh đồng thời trên điện thoại, 3 trên máy tính.
  // Các thao tác canvas luôn nối hàng để tránh cạn RAM trên Safari/iPhone.
  function albumUploadLimit(){
    return window.matchMedia?.('(max-width: 900px)').matches ? 2 : 3;
  }
  async function uploadPending(kind,id,onProgress){
    if(uploading)throw Error('Hệ thống đang tải một bộ ảnh khác.');
    validatePending();
    if(!pendingFiles.some(item=>!item.saved))return;
    if(!ALLOWED_KINDS.has(kind)||!id)throw Error('Không xác định được hồ sơ chứa bộ ảnh.');
    uploading=true;
    const filePicker=$('#gdd-album-files');
    if(filePicker)filePicker.disabled=true;
    renderQueue();
    const files=pendingFiles.filter(item=>!item.saved);
    let done=0,firstError=null,position=0;
    const warnings=[];
    const notify=message=>{
      setStatus(message);
      try{onProgress?.(message)}catch{}
    };
    let cpuTail=Promise.resolve();
    const imageStep=fn=>{
      const task=cpuTail.then(fn);
      cpuTail=task.then(()=>{},()=>{});
      return task;
    };
    // Một lượt lưu theo thứ tự ảnh, dù hai/ba lượt truyền tệp đang chạy song song.
    // Mã ảnh và số thứ tự do CSDL cấp phải không bị đảo theo tốc độ mạng.
    const turns=files.map(()=>{
      let release;
      const ready=new Promise(resolve=>{release=resolve});
      return {ready,release};
    });
    turns[0].release();
    try{
      const supa=await getClient();
      const {data:{user},error:authError}=await supa.auth.getUser();
      if(authError||!user)throw Error('Phiên quản trị hết hạn. Hãy đăng nhập lại.');
      const {data:maxRows,error:maxError}=await supa.from(ALBUM_TABLE).select('sort_order')
        .eq('owner_kind',kind).eq('owner_id',id).order('sort_order',{ascending:false}).limit(1);
      if(maxError)throw maxError;
      position=Math.max(0,maxRows?.[0]?.sort_order??0);
      const {data:albumOwner,error:ownerError}=await supa.from(kind).select('published').eq('id',id).single();
      if(ownerError||!albumOwner)throw Error('Chưa kiểm tra được bài chứa album.');
      const albumPublished=albumOwner.published===true;
      let cursor=0;
      const worker=async()=>{
        while(!firstError&&cursor<files.length){
          const index=cursor++;
          const item=files[index];
          let transferError=null;
          try{
            if(!item.uploadedUrl){
              if(!window.GDDR2?.archive||!window.GDDPrivatePublishing)
                throw Error('Bộ bảo tồn ảnh riêng tư R2 chưa sẵn sàng.');
              if(!item.archivedResult){
                item.archivedResult=await window.GDDR2.archive(item.file,supa,{
                  recordKind:kind,recordId:id,role:'album',skipDerivatives:false,
                  onProgress:()=>notify('Đang bảo tồn và tạo ảnh xem R2 '+(index+1)+'/'+files.length)
                });
              }
              if(item.archivedResult?.previewReady!==true||item.archivedResult?.downloadReady!==true)
                throw Error('Đã lưu bản gốc R2 nhưng chưa tạo đủ ảnh xem và ảnh in.');
              item.uploadedUrl=albumPublished
                ?(await window.GDDPrivatePublishing.publishArchivedImage(item.archivedResult,{
                    allowDownload:kind==='documents'
                  })).url
                :window.GDDPrivatePublishing.previewUrl(item.archivedResult.id);
            }
          }catch(error){transferError=error;}
          // Chỉ khoá bước tạo bản ghi, không khoá công đoạn tải qua mạng.
          await turns[index].ready;
          let linked=null;
          try{
            if(firstError)continue;
            if(transferError)throw transferError;
            // Nếu mất mạng ngay sau khi CSDL đã ghi thành công, dò lại URL
            // trên lần thử kế tiếp để KHÔNG thêm hai dòng cho cùng một ảnh.
            if(item.insertAttempted){
              const {data:existing,error:lookupError}=await supa.from(ALBUM_TABLE)
                .select('id,photo_code,sort_order')
                .eq('owner_kind',kind).eq('owner_id',id)
                .eq('image_url',item.uploadedUrl).maybeSingle();
              if(lookupError)throw lookupError;
              if(existing){
                linked=existing;
                position=Math.max(position,existing.sort_order??position);
              }
            }
            if(!linked){
              const next=position+1;
              const defaultCaption=kind==='documents'
                ?'Trang '+String(next).padStart(2,'0')
                :'Ảnh tư liệu '+String(next).padStart(2,'0');
              item.insertAttempted=true;
              const {data:row,error:dbError}=await supa.from(ALBUM_TABLE).insert({
                owner_kind:kind,owner_id:id,image_url:item.uploadedUrl,
                caption:item.caption.trim()||defaultCaption,sort_order:next
              }).select('id,photo_code').single();
              if(dbError)throw dbError;
              linked=row;
              position=next;
            }
            item.saved=true;
            done++;
          }catch(error){
            firstError=error;
          }finally{
            turns[index+1]?.release();
          }
          if(!linked)continue;
          // Visitor-side trace is applied to the optimized copy; R2 originals remain private.
          // Giải phóng bản đã nén sau khi tải và lưu dấu xong.
          item.optimizedFile=null;
          item.uploadedUrl='';
          notify('Đã lưu '+done+'/'+files.length+' ảnh vào bài…');
        }
      };
      await Promise.all(Array.from({length:Math.min(albumUploadLimit(),files.length)},()=>worker()));
      if(firstError)throw firstError;
      const msg='Đã lưu thành công '+done+' ảnh vào bài. '
        +'Ảnh đã có mã và giữ nguyên thứ tự.'
        +(warnings.length?' Có '+warnings.length+' ảnh cần kiểm tra bản lưu dấu.':'');
      notify(msg);
    }catch(error){
      const remain=pendingFiles.filter(x=>!x.saved).length;
      notify('Đã lưu '+done+' ảnh; còn '+remain
        +' ảnh chưa hoàn tất. Chọn Lưu/Đăng lại để thử tiếp, ảnh đã lưu không tải trùng. Lỗi: '
        +(error?.message||error));
      throw error;
    }finally{
      uploading=false;
      if(filePicker)filePicker.disabled=false;
      renderQueue();
    }
  }
  // Cho app.js gọi sau khi tạo bài; hỗ trợ thử lại ảnh lỗi mà KHÔNG tạo bản ghi mới.
  window.GDDAlbums={
    pendingCount:()=>pendingFiles.filter(item=>!item.saved).length,
    validatePending,
    uploadPending,
    resetAfterSuccess:()=>{clearPendingFiles();editing=null;panelContext='';panel.dataset.context='';}
  };

  if(editor){
    // Ghi nhận ID ngay tại sự kiện click Sửa, trước khi app.js dựng form.
    document.addEventListener('click',e=>{
      const el=e.target instanceof Element?e.target:null;
      if(!el)return;
      const edit=el.closest('[data-list-edit],[data-edit-kind]');
      if(uploading){e.preventDefault();e.stopImmediatePropagation();setStatus('Ảnh đang được tải. Hãy chờ thông báo hoàn tất.');return;}
      if(edit) {
        editing={kind:edit.dataset.listEdit||edit.dataset.editKind,id:edit.dataset.id||edit.dataset.editId};
        // app.js đổi form đồng bộ tại phần bubble; observer bên dưới sẽ cập nhật.
      } else if(el.closest('#editor-new,.editor-tabs button')) {
        editing=null;
      }
    },true);
    new MutationObserver(renderPanel).observe(editor,{childList:true});
    renderPanel();
  }
})();
