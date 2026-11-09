/* GIỮ ĐẠO GIỮA ĐỜI — TƯỞNG NIỆM CHỨC SẮC (bổ sung độc lập, 11/2026).
   Không thay đổi app.js, homepage-previews.js, bảng Ai Tín hoặc các chức năng hiện tại.
   Yêu cầu chạy SUPABASE_TUONG_NIEM.sql một lần trước khi sử dụng. */
(()=>{
  'use strict';
  if (window.__GDD_MEMORIAL_2026) return;
  window.__GDD_MEMORIAL_2026 = true;
  const $=(s,root=document)=>root.querySelector(s);
  const config=window.SITE_CONFIG||{};
  const TABLE='gdd_memorials';
  const BUCKET='dao-su-images'; // Kho ảnh hiện có, không cần tạo bucket mới.
  const PAGE_SIZE=12;
  const escape=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl=(v)=>{try{const u=new URL(v);return u.protocol==='https:'?u.href:''}catch{return ''}};
  const makeSlug=(title)=>String(title||'tuong-niem').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,64)||'tuong-niem';
  const formatDay=(v)=>{if(!v)return '';const d=new Date(v);return Number.isNaN(d.valueOf())?'':new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).format(d)};
  let clientPromise=null;
  const client=()=>{
    if(!config.supabaseUrl||!config.supabasePublishableKey)throw Error('Chưa cấu hình Supabase.');
    if(!clientPromise)clientPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({createClient})=>createClient(config.supabaseUrl,config.supabasePublishableKey));
    return clientPromise;
  };
  let activeEditorId=null;
  let adminRows=[];
  let openArchivePage=0;
  let archiveLoaded=false;
  let loadingArchive=false;
  let modalOpen=false;
  let focusBeforeModal=null;

  const css=document.createElement('style');
  css.id='gdd-memorial-styles';
  css.textContent=`
  /* Không đè CSS các chuyên mục khác. */
  .gdd-memorial-shell{position:relative;isolation:isolate;overflow:hidden;padding:clamp(28px,4.2vw,53px) 0 clamp(37px,5vw,59px);background:linear-gradient(125deg,#f3f1e9,#faf8f2 53%,#efece2);border-block:1px solid #e5dfd2;}
  .gdd-memorial-shell:before{content:'';pointer-events:none;position:absolute;right:max(-40px,calc((100% - 1160px)/2));top:14px;width:min(220px,35vw);height:108px;opacity:.26;background:radial-gradient(circle at 20% 68%,transparent 18px,#bba575 19px,#bba575 20px,transparent 21px),radial-gradient(circle at 44% 47%,transparent 26px,#bba575 27px,#bba575 28px,transparent 29px),radial-gradient(circle at 71% 64%,transparent 20px,#bba575 21px,#bba575 22px,transparent 23px);}
  .gdd-memorial-inner{position:relative;z-index:1;width:min(1110px,calc(100% - 52px));margin:auto;}
  .gdd-memorial-kicker{color:#a07e4b;letter-spacing:.18em;font:700 10px/1.8 'Be Vietnam Pro',sans-serif;}
  .gdd-memorial-heading{font:600 clamp(24px,2.6vw,36px)/1.4 'Noto Serif',Georgia,serif;letter-spacing:-.045em;color:#23483e;margin:8px 0 8px;}
  .gdd-memorial-description{color:#6d746d;font-size:12px;line-height:1.85;margin:0 0 22px;max-width:710px;}
  .gdd-memorial-feature{background:#fffdf8;border:1px solid #ded9c9;border-radius:8px;box-shadow:0 10px 28px rgba(29,60,45,.065);display:grid;grid-template-columns:minmax(170px,250px) minmax(0,1fr);gap:0;overflow:hidden;}
  .gdd-memorial-portrait{background:linear-gradient(155deg,#e5e7df,#ece8df);min-height:260px;display:flex;align-items:center;justify-content:center;border-right:1px solid #e4dfd3;}
  .gdd-memorial-portrait img{width:100%;height:100%;max-height:370px;object-fit:contain;display:block;}
  .gdd-memorial-portrait .gdd-memorial-no-image{font:400 73px/1 'Noto Serif',Georgia,serif;color:#af9a72;}
  .gdd-memorial-feature-copy{padding:clamp(20px,3vw,34px);display:flex;flex-direction:column;justify-content:center;min-width:0;}
  .gdd-memorial-label{font:700 10px/1.7 'Be Vietnam Pro',sans-serif;letter-spacing:.135em;color:#99774d;margin-bottom:12px;}
  .gdd-memorial-name{font:600 clamp(20px,2.4vw,29px)/1.45 'Noto Serif',Georgia,serif;color:#23483e;margin:0 0 8px;overflow-wrap:anywhere;}
  .gdd-memorial-meta{font-size:12px;color:#8b7451;margin:0 0 12px;line-height:1.8;}
  .gdd-memorial-summary{font-size:12px;color:#67716a;line-height:1.9;margin:0 0 16px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;}
  .gdd-memorial-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:8px;}
  .gdd-memorial-primary,.gdd-memorial-more{font:700 12px/1.5 'Be Vietnam Pro',sans-serif;border-radius:4px;min-height:41px;padding:10px 14px;border:1px solid #1a5147;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:7px;}
  .gdd-memorial-primary{background:#194e45;color:white}.gdd-memorial-more{background:#fffdf8;color:#194e45;}
  .gdd-memorial-primary:hover{background:#2a6256}.gdd-memorial-more:hover{background:#f3f0e6}
  .gdd-memorial-empty{padding:25px;min-height:160px;display:flex;align-items:center;justify-content:center;text-align:center;color:#72776d;font-size:13px;line-height:1.8;}
  .gdd-memorial-overlay[hidden],#gdd-memorial-admin[hidden]{display:none!important;}
  .gdd-memorial-overlay{position:fixed;inset:0;z-index:1100;display:flex;align-items:center;justify-content:center;background:rgba(15,30,25,.65);padding:16px;}
  .gdd-memorial-dialog{position:relative;width:min(800px,100%);max-height:min(89vh,900px);overflow:auto;overscroll-behavior:contain;background:#f9f7f0;border:1px solid #d8cdb9;border-radius:10px;padding:clamp(20px,4vw,35px);box-shadow:0 28px 80px rgba(0,0,0,.26);}
  .gdd-memorial-dialog h2{font:600 clamp(24px,3vw,32px)/1.4 'Noto Serif',Georgia,serif;color:#20493e;margin:4px 42px 16px 0;}
  .gdd-memorial-close{position:absolute;top:15px;right:15px;width:38px;height:38px;border:1px solid #dcd7cb;border-radius:50%;background:#fffdf8;color:#22473d;font-size:24px;line-height:1;}
  .gdd-memorial-archive-list{display:grid;gap:12px;}
  .gdd-memorial-archive-item{border:1px solid #dfdacf;background:#fffef9;border-radius:6px;padding:11px;display:grid;grid-template-columns:76px minmax(0,1fr);gap:14px;width:100%;text-align:left;cursor:pointer;color:inherit;}
  .gdd-memorial-archive-item img,.gdd-memorial-archive-fallback{width:76px;height:95px;object-fit:contain;background:#ebebe3;border-radius:3px;display:flex;align-items:center;justify-content:center;color:#af9d79;}
  .gdd-memorial-archive-item strong{display:block;font:600 15px/1.5 'Noto Serif',Georgia,serif;color:#214c40;}
  .gdd-memorial-archive-item small{display:block;color:#897755;font-size:11px;margin:5px 0;}
  .gdd-memorial-archive-item em{display:block;color:#6b756c;font:400 11px/1.65 'Be Vietnam Pro',sans-serif;}
  .gdd-memorial-detail-image{max-width:275px;width:100%;max-height:380px;object-fit:contain;display:block;margin:4px auto 21px;background:#eae9e3;border:1px solid #e6e1d4;}
  .gdd-memorial-detail-meta{font-size:12px;line-height:1.9;color:#8a714b;margin:0 0 20px;}
  .gdd-memorial-detail-content{font:400 14px/2 'Be Vietnam Pro',sans-serif;white-space:pre-wrap;color:#33463c;overflow-wrap:anywhere;}
  .gdd-memorial-detail-sources{border-top:1px solid #e0dccc;margin:27px 0 0;padding-top:17px;color:#6a736c;font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere;}
  .gdd-memorial-back{color:#1c574b;text-decoration:underline;text-underline-offset:4px;display:inline-block;margin-top:22px;font-size:12px;font-weight:700;}
  .gdd-memorial-admin-link{padding:10px 0;}
  .gdd-memorial-admin-link button{border:1px solid #c9b895;background:#f3f0e7;color:#1a4d43;padding:10px 15px;border-radius:4px;font-weight:700;font-size:12px;}
  .gdd-memorial-admin-link button.gdd-active{background:#1a4f45;color:#fff;}
  #admin-editor-area.gdd-memorial-mode > .editor-heading,#admin-editor-area.gdd-memorial-mode > #editor-form,#admin-editor-area.gdd-memorial-mode > .editor-items,#admin-editor-area.gdd-memorial-mode > .incoming-submissions{display:none!important;}
  .gdd-memorial-admin{background:#fffef9;border:1px solid #e1dcce;border-radius:6px;padding:clamp(15px,2.5vw,23px);margin-bottom:22px;}
  .gdd-memorial-admin h3{font:600 19px/1.5 'Noto Serif',Georgia,serif;color:#214e43;}
  .gdd-memorial-admin form{display:grid;gap:12px;}
  .gdd-memorial-admin label{display:grid;gap:5px;color:#46584e;font-size:12px;font-weight:600;}
  .gdd-memorial-admin :is(input,textarea){background:#fff;border:1px solid #d7d4c9;padding:11px;min-width:0;border-radius:4px;width:100%;font:400 13px/1.7 'Be Vietnam Pro',sans-serif;color:#263e34;}
  .gdd-memorial-admin textarea{min-height:110px;resize:vertical;}
  .gdd-memorial-admin textarea[name=body]{min-height:200px;}
  .gdd-memorial-admin .gdd-two-col{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}
  .gdd-memorial-admin .gdd-published{display:flex;align-items:center;gap:8px;}
  .gdd-memorial-admin .gdd-published input{width:auto;}
  .gdd-memorial-admin .gdd-muted{font-size:11px;color:#7a7d71;line-height:1.7;}
  .gdd-memorial-admin-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
  .gdd-memorial-admin-actions button,.gdd-memorial-admin-list button{border:1px solid #1c5146;background:#1c5146;color:#fff;border-radius:4px;padding:9px 14px;font-weight:600;font-size:12px;}
  .gdd-memorial-admin-actions .gdd-secondary,.gdd-memorial-admin-list button{background:#fffdf8;color:#1c5146;}
  .gdd-memorial-admin-list{margin-top:24px;padding-top:16px;border-top:1px solid #dedbcf;}
  .gdd-memorial-admin-list-row{display:flex;gap:12px;align-items:center;justify-content:space-between;border-top:1px solid #e8e3d7;padding:12px 0;font-size:12px;color:#485b50;}
  .gdd-memorial-admin-list-row strong{display:block;color:#23483d;font-size:13px;}
  .gdd-memorial-admin-status{font-size:12px;line-height:1.8;color:#667166;min-height:22px;}
  @media(max-width:700px){
    .gdd-memorial-inner{width:calc(100% - 40px)}
    .gdd-memorial-feature{grid-template-columns:minmax(0,1fr)}
    .gdd-memorial-portrait{border-right:0;border-bottom:1px solid #e4dfd3;min-height:0;max-height:270px;}
    .gdd-memorial-portrait img{height:240px;object-fit:contain;}
    .gdd-memorial-feature-copy{padding:19px;}
    .gdd-memorial-description{margin-bottom:16px;}
    .gdd-memorial-admin .gdd-two-col{grid-template-columns:minmax(0,1fr);}
  }
  @media(max-width:380px){.gdd-memorial-inner{width:calc(100% - 30px)}.gdd-memorial-actions{gap:8px}.gdd-memorial-primary,.gdd-memorial-more{font-size:11px;padding:8px 10px}}
  @media(prefers-reduced-motion:reduce){.gdd-memorial-primary,.gdd-memorial-more{transition:none}}
  `;
  document.head.appendChild(css);

  const hero=$('#trang-chu');
  if(!hero)return;
  const home=document.createElement('div');
  home.className='gdd-memorial-shell';
  home.setAttribute('aria-label','Tưởng niệm Chức sắc');
  home.innerHTML=`
    <div class="gdd-memorial-inner">
      <div class="gdd-memorial-kicker">KÍNH NHỚ TIỀN NHÂN · KỶ NIỆM NGÀY QUI VỊ</div>
      <h2 class="gdd-memorial-heading">Tưởng Niệm Chức Sắc</h2>
      <p class="gdd-memorial-description">Lưu lại chân dung và công nghiệp của chư vị Chức sắc tiền bối nhân ngày tưởng niệm.</p>
      <div class="gdd-memorial-feature" id="gdd-memorial-feature"><div class="gdd-memorial-empty">Đang tra cứu tư liệu tưởng niệm…</div></div>
    </div>`;
  hero.appendChild(home); // Nằm TRONG Trang Chủ: giữ đúng chế độ chia chuyên mục đang có.

  const overlay=document.createElement('div');
  overlay.id='gdd-memorial-overlay';overlay.className='gdd-memorial-overlay';overlay.hidden=true;
  overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Kho Tưởng niệm Chức sắc');
  overlay.innerHTML='<div class="gdd-memorial-dialog"><button class="gdd-memorial-close" type="button" aria-label="Đóng" data-gdd-mem-close>×</button><div id="gdd-memorial-dialog-body"></div></div>';
  document.body.append(overlay);
  const dialogBody=$('#gdd-memorial-dialog-body',overlay);

  function featuredCard(row){
    const portrait=safeUrl(row.portrait_url);
    const img=portrait?`<img loading="lazy" src="${escape(portrait)}" alt="Chân dung ${escape(row.person_name)}">`:'<span class="gdd-memorial-no-image" aria-hidden="true">✧</span>';
    const meta=[row.rank_title,row.anniversary_date&&'Kỷ niệm ngày qui vị: '+row.anniversary_date].filter(Boolean).join(' · ');
    const slug=encodeURIComponent(row.slug);
    return `<div class="gdd-memorial-portrait">${img}</div><div class="gdd-memorial-feature-copy">
      <div class="gdd-memorial-label">BÀI TƯỞNG NIỆM MỚI NHẤT</div>
      <h3 class="gdd-memorial-name">${escape(row.person_name)}</h3>
      ${meta?`<div class="gdd-memorial-meta">${escape(meta)}</div>`:''}
      <p class="gdd-memorial-summary">${escape(row.summary||row.title||'Kính tưởng công nghiệp tiền nhân.')}</p>
      <div class="gdd-memorial-meta">Đăng ngày ${formatDay(row.published_at||row.created_at)}</div>
      <div class="gdd-memorial-actions"><a class="gdd-memorial-primary" href="#tuong-niem/${slug}">Xem chi tiết ↗</a><a class="gdd-memorial-more" href="#tuong-niem">Xem các bài tưởng niệm khác</a></div>
    </div>`;
  }
  async function refreshFeatured(){
    const feature=$('#gdd-memorial-feature');
    if(!feature)return;
    try{
      const supa=await client();
      const {data,error}=await supa.from(TABLE).select('*').eq('published',true).order('published_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}).limit(1);
      if(error)throw error;
      if(data?.[0])feature.innerHTML=featuredCard(data[0]);
      else feature.innerHTML=`<div class="gdd-memorial-feature-copy" style="grid-column:1/-1"><div class="gdd-memorial-label">KHO TƯ LIỆU TƯỞNG NIỆM</div><p class="gdd-memorial-summary">Chuyên mục đang sưu khảo và chuẩn bị những bài tưởng niệm đầu tiên.</p><div class="gdd-memorial-actions"><a class="gdd-memorial-more" href="#tuong-niem">Xem các bài tưởng niệm</a></div></div>`;
    }catch(e){
      feature.innerHTML='<div class="gdd-memorial-empty">Kho tư liệu tưởng niệm đang được chuẩn bị.</div>';
      console.info('[Tưởng niệm] Đang chờ thiết lập bảng riêng:',e.message||e);
    }
  }

  function openModal(){
    if(!modalOpen){focusBeforeModal=document.activeElement;modalOpen=true;overlay.hidden=false;document.body.classList.add('modal-open');}
    $('.gdd-memorial-close',overlay)?.focus();
  }
  function closeModal(){
    modalOpen=false;overlay.hidden=true;
    if($('#admin-overlay')?.hidden!==false && $('#detail-overlay')?.hidden!==false)document.body.classList.remove('modal-open');
    if(focusBeforeModal?.isConnected)focusBeforeModal.focus({preventScroll:true});
  }
  function isMemRoute(){return location.hash==='#tuong-niem'||location.hash.startsWith('#tuong-niem/');}
  function clearMemRoute(){location.hash='#trang-chu';}

  function archiveItem(r){
    const img=safeUrl(r.portrait_url);
    const thumb=img?`<img loading="lazy" src="${escape(img)}" alt="">`:'<span class="gdd-memorial-archive-fallback">✧</span>';
    return `<button class="gdd-memorial-archive-item" type="button" data-gdd-mem-slug="${escape(r.slug)}">${thumb}<span><strong>${escape(r.person_name)}</strong><small>${escape([r.rank_title,r.anniversary_date].filter(Boolean).join(' · ')||'Tưởng niệm Chức sắc')}</small><em>${escape(r.summary||r.title||'Xem bài tưởng niệm')} · Đăng ${formatDay(r.published_at||r.created_at)}</em></span></button>`;
  }
  async function showArchive(reset=true){
    openModal();
    if(reset){openArchivePage=0;archiveLoaded=false;dialogBody.innerHTML='<div class="gdd-memorial-kicker">KHO TƯ LIỆU TƯỞNG NIỆM</div><h2>Các bài tưởng niệm Chức sắc</h2><div id="gdd-memorial-archive-list" class="gdd-memorial-archive-list"></div><div id="gdd-memorial-archive-status" class="gdd-memorial-admin-status" role="status"></div><div class="gdd-memorial-actions"><button id="gdd-memorial-archive-more" class="gdd-memorial-more" type="button" hidden>Xem thêm bài tưởng niệm</button></div>';}
    if(loadingArchive)return;
    loadingArchive=true;
    const list=$('#gdd-memorial-archive-list');const status=$('#gdd-memorial-archive-status'),more=$('#gdd-memorial-archive-more');
    if(status)status.textContent='Đang tải danh sách…';
    try{
      const supa=await client();
      const offset=openArchivePage*PAGE_SIZE;
      const {data,error}=await supa.from(TABLE).select('slug,person_name,title,rank_title,anniversary_date,summary,portrait_url,published_at,created_at').eq('published',true).order('published_at',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false}).range(offset,offset+PAGE_SIZE-1);
      if(error)throw error;
      if(!list?.isConnected)return;
      (data||[]).forEach(r=>list.insertAdjacentHTML('beforeend',archiveItem(r)));
      if(!(data||[]).length && offset===0)list.innerHTML='<p class="gdd-memorial-empty">Chưa có bài tưởng niệm được công bố.</p>';
      archiveLoaded=true;openArchivePage++;
      if(more)more.hidden=(data||[]).length<PAGE_SIZE;
      status.textContent='';
    }catch(e){if(status)status.textContent='Chưa đọc được danh sách tưởng niệm. '+(e.message||'');}
    finally{loadingArchive=false;}
  }
  async function showDetail(slug){
    openModal();
    dialogBody.innerHTML='<p class="gdd-memorial-empty">Đang mở bài tưởng niệm…</p>';
    try{
      const supa=await client();
      const {data,error}=await supa.from(TABLE).select('*').eq('published',true).eq('slug',slug).maybeSingle();
      if(error)throw error;
      if(!data){dialogBody.innerHTML='<p>Không tìm thấy bài tưởng niệm đã công bố.</p><a class="gdd-memorial-back" href="#tuong-niem">Xem các bài khác ↗</a>';return;}
      const img=safeUrl(data.portrait_url);
      dialogBody.innerHTML=`<div class="gdd-memorial-kicker">TƯỞNG NIỆM CHỨC SẮC</div><h2>${escape(data.title)}</h2>
        ${img?`<img class="gdd-memorial-detail-image" src="${escape(img)}" alt="Chân dung ${escape(data.person_name)}">`:''}
        <p class="gdd-memorial-detail-meta">${escape([data.person_name,data.rank_title,data.death_date?'Ngày qui vị: '+data.death_date:'',data.anniversary_date?'Kỷ niệm: '+data.anniversary_date:''].filter(Boolean).join(' · '))}<br>Đăng ngày ${formatDay(data.published_at||data.created_at)}</p>
        <div class="gdd-memorial-detail-content" id="gdd-memorial-text"></div>
        ${data.sources?'<div class="gdd-memorial-detail-sources" id="gdd-memorial-sources"></div>':''}
        <a class="gdd-memorial-back" href="#tuong-niem">Xem các bài tưởng niệm khác ↗</a>`;
      $('#gdd-memorial-text').textContent=data.body||data.summary||'';
      if(data.sources)$('#gdd-memorial-sources').textContent='Nguồn tư liệu: '+data.sources;
    }catch(e){dialogBody.textContent='Không thể tải bài tưởng niệm. '+(e.message||'');}
  }
  function routeMemorial(){
    if(!isMemRoute()){if(modalOpen)closeModal();return;}
    const match=location.hash.match(/^#tuong-niem\/(.+)$/);
    if(match){let slug='';try{slug=decodeURIComponent(match[1]);}catch{};if(slug)showDetail(slug);else showArchive(true);}
    else showArchive(true);
  }
  overlay.addEventListener('click',e=>{
    if(e.target===overlay || e.target.closest('[data-gdd-mem-close]')){clearMemRoute();return;}
    const row=e.target.closest('[data-gdd-mem-slug]');if(row){location.hash='#tuong-niem/'+encodeURIComponent(row.dataset.gddMemSlug);return;}
    if(e.target.closest('#gdd-memorial-archive-more'))showArchive(false);
  });
  document.addEventListener('keydown',e=>{
    if(!modalOpen)return;
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();clearMemRoute();}
    if(e.key==='Tab'){
      const nodes=Array.from(overlay.querySelectorAll('button:not([hidden]):not(:disabled),a[href],input:not(:disabled)')).filter(x=>x.getClientRects().length);
      if(!nodes.length)return;
      const first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  },true);
  window.addEventListener('hashchange',routeMemorial);

  /* Trang quản trị riêng, không gắn vào bộ form cũ để tránh ảnh hưởng lưu bài, album. */
  const adminArea=$('#admin-editor-area');
  const tabs=$('.editor-tabs',adminArea||document);
  let adminPanel=null,btnMode=null;
  if(adminArea&&tabs){
    const nav=document.createElement('div');nav.className='gdd-memorial-admin-link';
    btnMode=document.createElement('button');btnMode.type='button';btnMode.textContent='✧ Quản lý Tưởng niệm Chức sắc';
    nav.append(btnMode);tabs.insertAdjacentElement('afterend',nav);
    adminPanel=document.createElement('section');adminPanel.id='gdd-memorial-admin';adminPanel.className='gdd-memorial-admin';adminPanel.hidden=true;
    adminPanel.innerHTML=`<h3>Đăng bài Tưởng niệm Chức sắc</h3><p class="gdd-muted">Mục độc lập với Ai Tín. Mỗi bài có chân dung, ngày qui vị, bài tưởng niệm và xuất xứ.</p>
      <form id="gdd-memorial-form">
        <label>Tiêu đề bài tưởng niệm *<input name="title" required maxlength="240" placeholder="Kỷ niệm ngày qui vị Đức ..."></label>
        <label>Danh xưng Chức sắc *<input name="person_name" required maxlength="200" placeholder="NGỌC ... THANH"></label>
        <div class="gdd-two-col"><label>Phẩm vị / cơ quan Đạo<input name="rank_title" maxlength="200" placeholder="Phối Sư – Cửu Trùng Đài"></label><label>Ngày qui vị (Âm / Dương lịch)<input name="death_date" maxlength="140" placeholder="23/05 Đinh Mùi – 30/06/1967"></label></div>
        <label>Ngày kỷ niệm tưởng niệm<input name="anniversary_date" maxlength="140" placeholder="23 tháng 5 âm lịch hằng năm"></label>
        <label>Lời giới thiệu ngắn<textarea name="summary" maxlength="1000" placeholder="Dẫn nhập ngắn để hiện trên Trang Chủ"></textarea></label>
        <label>Nội dung bài tưởng niệm *<textarea name="body" required placeholder="Viết nội dung tưởng niệm, công nghiệp, nguồn đối chiếu…"></textarea></label>
        <label>Xuất xứ / nguồn tư liệu<textarea name="sources" placeholder="Sách, Thánh lịnh, bằng cấp, người lưu giữ ảnh…"></textarea></label>
        <label>Đường dẫn ảnh chân dung (nếu có)<input name="portrait_url" type="url" placeholder="https://..."></label>
        <label>Hoặc tải chân dung JPEG, PNG, WebP từ điện thoại<input name="portrait_file" type="file" accept="image/jpeg,image/png,image/webp"></label>
        <p class="gdd-muted">Ảnh lớn tự giảm dưới 6 MB khi tải; bản gốc trên điện thoại không bị thay đổi.</p>
        <label class="gdd-published"><input type="checkbox" name="published" checked> Công bố trên website</label>
        <div class="gdd-memorial-admin-actions"><button type="submit" id="gdd-memorial-save">Đăng bài tưởng niệm</button><button type="button" class="gdd-secondary" id="gdd-memorial-new">+ Soạn bài mới</button></div>
        <div id="gdd-memorial-admin-status" class="gdd-memorial-admin-status" role="status" aria-live="polite"></div>
      </form><div class="gdd-memorial-admin-list"><h3>Các bài tưởng niệm đã đăng / bản nháp</h3><div id="gdd-memorial-admin-rows"></div><button type="button" id="gdd-memorial-admin-more" hidden>Xem thêm</button></div>`;
    nav.insertAdjacentElement('afterend',adminPanel);
    const form=$('#gdd-memorial-form');
    const status=$('#gdd-memorial-admin-status');
    const setStatus=(s)=>{status.textContent=s;};
    const editorMore=$('#gdd-memorial-admin-more');
    let adminOffset=0;
    let adminLoading=false;
    function switchMode(on){
      adminArea.classList.toggle('gdd-memorial-mode',on);
      adminPanel.hidden=!on;
      btnMode.classList.toggle('gdd-active',on);
    }
    tabs.addEventListener('click',e=>{if(e.target.closest('button'))switchMode(false)});
    function newForm(){
      activeEditorId=null;form.reset();form.elements.published.checked=true;
      $('#gdd-memorial-save').textContent='Đăng bài tưởng niệm';setStatus('');
    }
    $('#gdd-memorial-new').addEventListener('click',newForm);
    async function checkRole(){
      const supa=await client();const {data:{user},error:authError}=await supa.auth.getUser();
      if(authError||!user)throw Error('Hãy đăng nhập quản trị trước.');
      const {data,error}=await supa.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
      if(error||!data)throw Error('Tài khoản không có quyền quản trị.');
      return supa;
    }
    async function getAdminRows(reset=true){
      if(adminLoading)return;
      adminLoading=true;
      if(reset){adminOffset=0;adminRows=[];$('#gdd-memorial-admin-rows').replaceChildren();}
      try{
        const supa=await checkRole();
        const {data,error}=await supa.from(TABLE).select('id,slug,title,person_name,rank_title,death_date,anniversary_date,summary,body,sources,portrait_url,published,published_at,created_at,updated_at').order('created_at',{ascending:false}).range(adminOffset,adminOffset+49);
        if(error)throw error;
        const rows=data||[];
        adminRows.push(...rows);adminOffset+=rows.length;
        const list=$('#gdd-memorial-admin-rows');
        if(!adminRows.length)list.textContent='Chưa có bài tưởng niệm.';
        else for(const row of rows){
          const item=document.createElement('div');item.className='gdd-memorial-admin-list-row';
          item.innerHTML=`<div><strong>${escape(row.person_name)}</strong>${escape(row.published?'Đã công bố':'Bản nháp')} · ${formatDay(row.created_at)}</div><button type="button" data-gdd-edit="${escape(row.id)}">Sửa</button>`;
          list.append(item);
        }
        editorMore.hidden=rows.length<50;
      }catch(e){setStatus('Không đọc được danh sách: '+(e.message||e));}
      finally{adminLoading=false;}
    }
    editorMore.addEventListener('click',()=>getAdminRows(false));
    $('#gdd-memorial-admin-rows').addEventListener('click',e=>{
      const b=e.target.closest('[data-gdd-edit]');if(!b)return;
      const row=adminRows.find(r=>r.id===b.dataset.gddEdit);if(!row)return;
      newForm();activeEditorId=row.id;
      for(const key of ['title','person_name','rank_title','death_date','anniversary_date','summary','body','sources','portrait_url'])form.elements[key].value=row[key]||'';
      form.elements.published.checked=!!row.published;
      $('#gdd-memorial-save').textContent='Lưu bài tưởng niệm';
      setStatus('Đang sửa: '+row.person_name);form.scrollIntoView({behavior:'smooth',block:'start'});
    });
    btnMode.addEventListener('click',async()=>{
      if(adminArea.hidden){return;}
      switchMode(true);newForm();
      setStatus('Đang kiểm tra quyền quản trị…');
      try{await checkRole();setStatus('');await getAdminRows(true);}catch(e){setStatus(e.message||String(e));}
    });
    new MutationObserver(()=>{if(adminArea.hidden){switchMode(false);newForm()}}).observe(adminArea,{attributes:true,attributeFilter:['hidden']});
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const save=$('#gdd-memorial-save');save.disabled=true;
      let stagedPath='';
      try{
        const supa=await checkRole();
        const title=form.elements.title.value.trim(),name=form.elements.person_name.value.trim();
        const body=form.elements.body.value.trim();
        if(!title||!name||!body)throw Error('Cần điền tiêu đề, danh xưng và nội dung.');
        const published=form.elements.published.checked;
        const old=adminRows.find(r=>r.id===activeEditorId)||null;
        const now=new Date().toISOString();
        const obj={title,person_name:name,body,published,updated_at:now,
          rank_title:form.elements.rank_title.value.trim()||null,
          death_date:form.elements.death_date.value.trim()||null,
          anniversary_date:form.elements.anniversary_date.value.trim()||null,
          summary:form.elements.summary.value.trim()||null,
          sources:form.elements.sources.value.trim()||null,
          portrait_url:form.elements.portrait_url.value.trim()||null,
          published_at:published?(old?.published_at||now):null};
        const url=obj.portrait_url?safeUrl(obj.portrait_url):'';
        if(obj.portrait_url&&!url)throw Error('Đường dẫn chân dung phải bắt đầu bằng https://');
        const file=form.elements.portrait_file.files?.[0];
        if(file){
          const formats={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
          if(!window.GDDImageOptimizer?.detectType(file))throw Error('Chân dung chỉ nhận JPEG, PNG, WebP hoặc HEIC tương thích.');
          const ready=(await window.GDDImageOptimizer.prepare(file,{onProgress:setStatus})).file;
          setStatus('Đang tải ảnh chân dung…');
          stagedPath='memorials/'+Date.now()+'-'+(crypto.randomUUID?.()||Math.random().toString(36).slice(2))+'.'+formats[ready.type];
          const {error:upError}=await supa.storage.from(BUCKET).upload(stagedPath,ready,{contentType:ready.type,upsert:false});
          if(upError)throw upError;
          obj.portrait_url=supa.storage.from(BUCKET).getPublicUrl(stagedPath).data.publicUrl;
        }
        if(!activeEditorId){
          obj.slug=makeSlug(name)+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
        }
        setStatus('Đang lưu bài tưởng niệm…');
        const req=activeEditorId?supa.from(TABLE).update(obj).eq('id',activeEditorId):supa.from(TABLE).insert(obj);
        const {error}=await req;
        if(error)throw error;
        setStatus('Đã lưu bài tưởng niệm thành công.');
        newForm();setStatus('Đã lưu thành công.');
        await Promise.all([refreshFeatured(),getAdminRows(true)]);
      }catch(e){setStatus('Không thể lưu bài: '+(e.message||e)+'. Nội dung trong form vẫn còn để thử lại.');}
      finally{save.disabled=false;}
    });
  }
  refreshFeatured();
  routeMemorial();
})();
