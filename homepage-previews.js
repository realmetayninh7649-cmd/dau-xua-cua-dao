/* GIỮ ĐẠO GIỮA ĐỜI — Chỉ giới thiệu một số tư liệu mỗi chuyên mục.
   Bản bổ sung độc lập: KHÔNG sửa app.js, Supabase, tài khoản, video, ảnh gốc.
   Mở thêm theo nhóm 3–6 mục khi khách muốn xem. */
(() => {
  'use strict';
  if (window.__gddHomePreviews) return;
  window.__gddHomePreviews = true;

  const types = {
    people: {id:'people-grid', amount:4, label:'hồ sơ', selector:'.person-card'},
    posts: {id:'article-list', amount:4, label:'bài biên khảo', selector:'.editorial-article'},
    media: {id:'gallery-grid', amount:6, label:'ảnh', selector:'.gallery-card'},
    videos: {id:'video-grid', amount:3, label:'video', selector:'.archive-card'},
    obituaries: {id:'obituary-grid', amount:3, label:'bài Ai Tín', selector:'.archive-card'},
    documents: {id:'document-grid', amount:3, label:'tài liệu', selector:'.archive-card'}
  };
  const visible = Object.fromEntries(Object.entries(types).map(([k,t])=>[k,t.amount]));
  const $ = s => document.querySelector(s);
  const style = document.createElement('style');
  style.textContent = `
    .gdd-home-hide{display:none!important}
    .gdd-home-footer{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;
      gap:14px;padding-top:18px;margin-top:19px;border-top:1px solid #e4e1d7;
      font:400 12px/1.6 'Be Vietnam Pro',sans-serif;color:#788079}
    .gdd-home-more{display:inline-flex;align-items:center;justify-content:center;gap:8px;
      min-height:42px;padding:8px 17px;border:1px solid #becdc2;border-radius:4px;
      background:#f9f8f3;color:#1a564d;font:700 12px/1.4 'Be Vietnam Pro',sans-serif;cursor:pointer}
    .gdd-home-more:focus-visible{outline:3px solid #b58c4e;outline-offset:2px}
    .gdd-home-more:hover{background:#e8eee7}
    @media(max-width:520px){.gdd-home-footer{font-size:11px}.gdd-home-more{font-size:11px;padding:8px 13px}}
  `;
  document.head.append(style);

  const getItems = kind => [...document.querySelectorAll('#'+types[kind].id+' > '+types[kind].selector)];
  const readNumber = (el, fallback) => Number((el?.textContent||'').replace(/\s/g,'').match(/\/(\d+)/)?.[1]) || fallback;
  let internalPeopleClick=false;
  let postsTotal=null, postsLoaded=false, postsLoading=false, postsError='';
  const snapshotPeople=()=>{
    const items=getItems('people');
    return readNumber($('#people-result-count'),items.length);
  };
  const count = kind => {
    if(kind==='people')return snapshotPeople();
    if(kind==='posts')return (postsTotal ?? Number($('#count-posts')?.textContent||'0')) || getItems(kind).length;
    return getItems(kind).length;
  };
  function getFooter(kind){
    if(kind==='people')return {wrap:$('#people-result-count')?.parentElement, info:$('#people-result-count'), button:$('#people-show-more')};
    let wrap=$('#gdd-preview-'+kind);
    if(!wrap){
      wrap=document.createElement('div');wrap.id='gdd-preview-'+kind;wrap.className='gdd-home-footer';
      const info=document.createElement('span');info.className='gdd-preview-info';
      const button=document.createElement('button');button.type='button';button.className='gdd-home-more';button.dataset.gddMore=kind;
      wrap.append(info,button);
      const container=$('#'+types[kind].id);
      // Chèn footer bài Biên khảo SAU khối 2 cột, không tạo ô thứ 3 trong lưới.
      const anchor=kind==='posts'?container?.closest('.article-layout'):container;
      anchor?.insertAdjacentElement('afterend',wrap);
    }
    return {wrap,info:wrap.querySelector('.gdd-preview-info'),button:wrap.querySelector('[data-gdd-more]')};
  }
  function apply(kind){
    const def=types[kind],items=getItems(kind),total=Math.max(count(kind),items.length);
    items.forEach((node,i)=>node.classList.toggle('gdd-home-hide',i>=visible[kind]));
    const {wrap,info,button}=getFooter(kind);
    if(!wrap||!info||!button)return;
    const showing=Math.min(visible[kind],items.length,total);
    info.textContent='Đang hiển thị '+showing+' / '+total+' '+def.label;
    const remaining=Math.max(0,total-showing);
    button.textContent=remaining ? 'Xem thêm '+Math.min(def.amount,remaining)+' '+def.label+' ↗' : 'Thu gọn ↑';
    button.hidden=total<=def.amount;
    if(kind==='people'){
      // Nút cũ đã có style; chỉ thay nhãn, KHÔNG đổi form tìm kiếm/bộ lọc.
      button.style.display=button.hidden?'none':'';
    } else wrap.style.display=total<=def.amount?'none':'';
    if(kind==='posts'&&postsError && remaining>0)button.title=postsError;
  }
  const schedule = kind=>{if(schedule[kind])return;schedule[kind]=true;queueMicrotask(()=>{schedule[kind]=false;apply(kind)});};

  // Bài Biên khảo cũ: app.js cũ chỉ dựng 8 thẻ, nên tải thêm danh sách
  // công khai khi người xem muốn mở tiếp. Không thay đổi, thêm hoặc xóa bài nào.
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeURL=value=>{try{const u=new URL(String(value));return u.protocol==='https:'?u.href:''}catch{return ''}};
  async function ensureAllPosts(){
    if(postsLoaded||postsLoading)return;
    postsLoading=true;
    try{
      const conf=window.SITE_CONFIG||{};
      if(!conf.supabaseUrl||!conf.supabasePublishableKey)throw Error('Chưa kết nối Supabase.');
      const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      const sb=createClient(conf.supabaseUrl,conf.supabasePublishableKey);
      const {data,error}=await sb.from('posts')
        .select('id,title,category,summary,cover_url,created_at')
        .eq('published',true).order('created_at',{ascending:false}).limit(500);
      if(error)throw error;
      const list=$('#article-list');
      if(!list)return;
      const present=new Set([...list.querySelectorAll('[data-open-kind="posts"][data-id]')].map(x=>x.dataset.id));
      for(const p of data||[]){
        if(present.has(p.id))continue;
        const image=safeURL(p.cover_url);
        const artwork=image?`<div class="editorial-placeholder" aria-hidden="true"><span>✦</span><strong>TƯ LIỆU ĐẠO SỬ</strong><small>BIÊN KHẢO</small></div><img src="${esc(image)}" alt="Ảnh bìa ${esc(p.title)}" loading="lazy">`:
          '<div class="editorial-placeholder" aria-hidden="true"><span>✦</span><strong>TƯ LIỆU ĐẠO SỬ</strong><small>BIÊN KHẢO</small></div>';
        const node=document.createElement('article');node.className='article-row editorial-article gdd-post-extra';
        const stamp=p.created_at?new Date(p.created_at).toLocaleDateString('vi-VN') : '';
        node.innerHTML=`<button type="button" class="editorial-image" data-open-kind="posts" data-id="${esc(p.id)}" aria-label="Đọc bài: ${esc(p.title)}">${artwork}</button><div class="editorial-copy"><span class="article-tag">${esc(p.category||'BIÊN KHẢO')} · ${esc(stamp)}</span><h3>${esc(p.title)}</h3><p>${esc(p.summary||'Tư liệu Đạo sử đang được bổ sung.')}</p><button type="button" class="editorial-read" data-open-kind="posts" data-id="${esc(p.id)}">Đọc biên khảo <span aria-hidden="true">↗</span></button></div>`;
        list.append(node);present.add(p.id);
      }
      postsTotal=Math.max((data||[]).length,list.querySelectorAll('.editorial-article').length);
      postsLoaded=true;postsError='';
    }catch(e){postsError='Không tải thêm được bài viết: '+(e?.message||e);console.warn('[Giữ Đạo Giữa Đời] '+postsError);}
    finally{postsLoading=false;apply('posts');}
  }

  async function expand(kind){
    const def=types[kind],n=count(kind);
    if(visible[kind]>=n){
      visible[kind]=def.amount;
      apply(kind);
      $('#'+def.id)?.closest('section')?.scrollIntoView({behavior:'smooth',block:'start'});
      return;
    }
    visible[kind]=Math.min(n,visible[kind]+def.amount);
    if(kind==='people'){
      const shown=getItems(kind).length,button=$('#people-show-more');
      if(visible[kind]>shown&&button){
        internalPeopleClick=true;
        try{button.click();}finally{internalPeopleClick=false;}
      }
    }
    if(kind==='posts' && visible[kind]>getItems(kind).length){
      const btn=getFooter(kind).button;
      btn.disabled=true;btn.textContent='Đang tải bài cũ…';
      await ensureAllPosts();
      btn.disabled=false;
    }
    apply(kind);
  }

  const peopleButton=$('#people-show-more');
  if(peopleButton){
    peopleButton.addEventListener('click',e=>{
      if(internalPeopleClick)return;
      e.preventDefault();e.stopImmediatePropagation();expand('people');
    },true);
  }
  document.addEventListener('click',e=>{
    const button=e.target instanceof Element?e.target.closest('[data-gdd-more]'):null;
    if(button)expand(button.dataset.gddMore);
  });
  ['people-search','branch-filter','subgroup-filter'].forEach(id=>$('#'+id)?.addEventListener('input',()=>{visible.people=types.people.amount;schedule('people');}));
  $('#branch-filter')?.addEventListener('change',()=>{visible.people=types.people.amount;schedule('people');});
  $('#subgroup-filter')?.addEventListener('change',()=>{visible.people=types.people.amount;schedule('people');});
  document.querySelectorAll('[data-branch]').forEach(el=>el.addEventListener('click',()=>{visible.people=types.people.amount;schedule('people');}));

  // Theo dõi đúng khung danh sách; không quan sát attribute để tránh vòng lặp.
  for(const kind of Object.keys(types)){
    const container=$('#'+types[kind].id);
    if(!container)continue;
    new MutationObserver(records=>{
      if(kind==='posts' && records.every(r=>r.removedNodes.length===0 && r.addedNodes.length>0 && [...r.addedNodes].every(x=>x.nodeType!==1||x.classList?.contains('gdd-post-extra'))))return;
      if(kind==='posts') {postsLoaded=false;postsTotal=null;}
      schedule(kind);
    }).observe(container,{childList:true});
    apply(kind);
  }
})();

/* Chế độ chuyên mục độc lập. Trang Chủ = giới thiệu + lối vào kho tư liệu.
   Chỉ thay đổi cách hiển thị; các phần tử, bộ lọc, bài đăng và dữ liệu giữ nguyên. */
(() => {
  'use strict';
  if(window.__gddSectionRouter) return;
  window.__gddSectionRouter=true;

  const sectionList=[
    ['chuc-sac','Hồ sơ Chức sắc','Tiểu sử, phẩm vị và công nghiệp của bậc tiền nhân'],
    ['video-dao-su','Video Đạo Sử','Thước phim, ký sự và lời thuyết minh'],
    ['ai-tin','Ai Tín','Tin tưởng niệm và sử liệu về người qui vị'],
    ['tai-lieu-so-hoa','Tài liệu số hóa','Thánh Lịnh, văn kiện và bản chụp lưu trữ'],
    ['bien-khao','Biên khảo','Những bài khảo cứu, đối chiếu sử liệu'],
    ['hinh-anh','Hình ảnh','Di ảnh, kỷ vật và tư liệu lịch sử'],
    ['gui-tu-lieu','Gửi tư liệu','Góp phần gìn giữ những dấu xưa'],
    ['gioi-thieu','Giới thiệu','Tôn chỉ và phương pháp lưu trữ']
  ];
  const routeIds=new Set(['trang-chu',...sectionList.map(x=>x[0])]);
  const detailKinds={
    'nhan-vat':'chuc-sac','bai-viet':'bien-khao','hinh-anh-tu-lieu':'hinh-anh',
    'video-dao-su':'video-dao-su','ai-tin':'ai-tin','tai-lieu-so-hoa':'tai-lieu-so-hoa'
  };
  const find=s=>document.querySelector(s);
  const main=find('main'),home=find('#trang-chu');
  if(!main||!home)return;
  const css=document.createElement('style');
  css.id='gdd-section-layout-css';
  css.textContent=`
    main > section[hidden], .gdd-directory[hidden], .gdd-route-path[hidden] {display:none!important}
    .gdd-directory{padding:44px 0 74px;background:#f7f5ef}
    .gdd-directory-inner{width:min(1160px,calc(100% - 48px));margin:auto}
    .gdd-directory-eyebrow{font:700 11px/1.5 'Be Vietnam Pro',sans-serif;letter-spacing:.17em;color:#aa8246}
    .gdd-directory h2{margin:10px 0 12px;font:600 clamp(28px,3.5vw,40px)/1.35 'Noto Serif',Georgia,serif;color:#224a3e}
    .gdd-directory-desc{max-width:720px;margin:0 0 23px;font:400 13px/1.95 'Be Vietnam Pro',sans-serif;color:#66736a}
    .gdd-home-quick-nav{display:flex;gap:9px;flex-wrap:wrap;margin:22px 0 32px}
    .gdd-home-quick-nav a{display:inline-block;padding:8px 13px;background:#fffefa;border:1px solid #ddd9ce;border-radius:40px;text-decoration:none;color:#31594e;font:600 11px/1.5 'Be Vietnam Pro',sans-serif}
    .gdd-home-quick-nav a:hover{border-color:#aa8b57;background:#eceee5}
    .gdd-preview-section{padding:26px 0 32px;border-top:1px solid #ddd9cd}
    .gdd-preview-header{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:19px}
    .gdd-preview-heading{font:600 clamp(23px,2.5vw,31px)/1.4 'Noto Serif',Georgia,serif;color:#1d5045;margin:5px 0 4px}
    .gdd-preview-sub{font:400 12px/1.7 'Be Vietnam Pro',sans-serif;color:#788078;margin:0}
    .gdd-preview-index{color:#ac8a57;font:700 12px/1.5 'Be Vietnam Pro',sans-serif;white-space:nowrap;letter-spacing:.1em}
    .gdd-preview-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .gdd-preview-card{min-width:0;width:100%;padding:0;border:1px solid #e2ded4;border-radius:7px;overflow:hidden;display:flex;text-align:left;cursor:pointer;background:#fffefa;box-shadow:0 4px 14px rgba(15,47,35,.05);color:inherit;transition:box-shadow .15s ease,border-color .15s ease}
    .gdd-preview-card:hover{border-color:#bda47c;box-shadow:0 9px 23px rgba(15,47,35,.08)}
    .gdd-preview-thumb{width:135px;min-width:135px;height:154px;min-height:154px;background:#e7e9e2;display:flex;align-items:center;justify-content:center;overflow:hidden;border-right:1px solid #e7e4da}
    .gdd-preview-thumb img{width:100%;height:100%;display:block;object-fit:contain;object-position:center}
    .gdd-preview-fallback{color:#af8d58;font:400 31px/1 Georgia,serif}
    .gdd-preview-copy{display:flex;flex-direction:column;gap:7px;flex:1;min-width:0;padding:14px 16px}
    .gdd-preview-meta{font:700 10px/1.5 'Be Vietnam Pro',sans-serif;color:#aa8550;letter-spacing:.045em}
    .gdd-preview-name{font:600 clamp(15px,1.35vw,19px)/1.55 'Noto Serif',Georgia,serif;color:#24483e;overflow-wrap:anywhere;margin:0}
    .gdd-preview-summary{margin:0;color:#69746d;font:400 11px/1.7 'Be Vietnam Pro',sans-serif;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
    .gdd-preview-hint{margin-top:auto;font:700 10px/1.5 'Be Vietnam Pro',sans-serif;color:#216051}
    .gdd-preview-footer{display:flex;justify-content:flex-end;margin-top:15px}
    .gdd-preview-more{display:inline-flex;align-items:center;gap:9px;justify-content:center;border:1px solid #c7d1c4;border-radius:4px;padding:10px 19px;min-height:42px;background:#fffefa;color:#1c574c;text-decoration:none;font:700 12px/1.5 'Be Vietnam Pro',sans-serif}
    .gdd-preview-more:hover{background:#e5eee8}
    .gdd-preview-empty{grid-column:1/-1;color:#777f76;background:#fbfaf6;border:1px dashed #ddd9cf;border-radius:5px;padding:16px;font:400 12px/1.8 'Be Vietnam Pro',sans-serif}
    .gdd-directory-links{display:flex;gap:15px;flex-wrap:wrap;margin-top:20px}
    .gdd-directory-links a{color:#1f6559;font:700 12px/1.6 'Be Vietnam Pro',sans-serif;text-underline-offset:4px}
    .gdd-route-path{width:min(1160px,calc(100% - 48px));margin:22px auto 0;padding:0;font:600 12px/1.6 'Be Vietnam Pro',sans-serif;color:#a0804a}
    .gdd-route-path a{color:#35645b;text-decoration:none}
    .gdd-route-path a:hover{text-decoration:underline}
    .gdd-route-path span{margin-left:8px}
    body.gdd-separate-sections main > section.section{padding-top:34px}
    @media(max-width:920px){.gdd-preview-cards{grid-template-columns:1fr}.gdd-preview-thumb{width:160px;min-width:160px}}
    @media(max-width:560px){
      .gdd-directory{padding:35px 0 48px}.gdd-directory-inner,.gdd-route-path{width:calc(100% - 32px)}
      .gdd-home-quick-nav{gap:7px;margin:18px 0 26px}.gdd-home-quick-nav a{padding:7px 10px;font-size:10px}
      .gdd-preview-section{padding:21px 0 27px}.gdd-preview-heading{font-size:22px}.gdd-preview-sub{font-size:11px}
      .gdd-preview-header{margin-bottom:13px}.gdd-preview-cards{gap:11px}
      .gdd-preview-thumb{width:116px;min-width:116px;height:133px;min-height:133px}
      .gdd-preview-copy{padding:11px 12px;gap:5px}.gdd-preview-name{font-size:15px;line-height:1.45}
      .gdd-preview-summary{font-size:10px;-webkit-line-clamp:2}.gdd-preview-hint{font-size:10px}
      .gdd-preview-index{font-size:10px}
    }
    @media(max-width:350px){.gdd-preview-thumb{width:94px;min-width:94px}.gdd-preview-summary{-webkit-line-clamp:2}}
    @media(prefers-reduced-motion:reduce){.gdd-preview-card{transition:none}}
  `;
  document.head.append(css);

  // Trang Chủ: chỉ giới thiệu 1–2 tư liệu MỚI của mỗi mục.
  // Bản đầy đủ luôn nằm ở chuyên mục gốc, không nhân đôi dữ liệu trong Supabase.
  const previewSources={
    'chuc-sac':['people-grid','.person-card','Hồ sơ Chức sắc'],
    'video-dao-su':['video-grid','.archive-card','Video Đạo Sử'],
    'ai-tin':['obituary-grid','.archive-card','Ai Tín'],
    'tai-lieu-so-hoa':['document-grid','.archive-card','Tài liệu số hóa'],
    'bien-khao':['article-list','.editorial-article','Biên khảo'],
    'hinh-anh':['gallery-grid','.gallery-card','Hình ảnh']
  };
  const directory=document.createElement('section');directory.id='gdd-directory';directory.className='gdd-directory';
  const inner=document.createElement('div');inner.className='gdd-directory-inner';
  inner.innerHTML='<div class="gdd-directory-eyebrow">TƯ LIỆU MỚI CẬP NHẬT</div><h2>Dấu xưa đang được gìn giữ</h2><p class="gdd-directory-desc">Mỗi chuyên mục giới thiệu hai tư liệu mới nhất; riêng Hồ sơ Chức sắc có hai hồ sơ Hiệp Thiên Đài và hai hồ sơ Cửu Trùng Đài. Nhấn <strong>Xem thêm</strong> để đọc đầy đủ.</p>';
  const quick=document.createElement('nav');quick.className='gdd-home-quick-nav';quick.setAttribute('aria-label','Chuyển đến chuyên mục');
  for(const [id,name] of sectionList.slice(0,6)){
    const a=document.createElement('a');a.href='#'+id;a.textContent=name;quick.append(a);
  }
  inner.append(quick);
  const sectionViews=new Map();
  for(const [index,[id,title,description]] of sectionList.slice(0,6).entries()){
    const block=document.createElement('div');block.className='gdd-preview-section';block.dataset.previewSection=id;
    const header=document.createElement('div');header.className='gdd-preview-header';
    const nameCol=document.createElement('div');
    const heading=document.createElement('h3');heading.className='gdd-preview-heading';heading.textContent=title;
    const hint=document.createElement('p');hint.className='gdd-preview-sub';hint.textContent=description;
    nameCol.append(heading,hint);
    const idx=document.createElement('span');idx.className='gdd-preview-index';idx.textContent=String(index+1).padStart(2,'0')+' / 06';
    header.append(nameCol,idx);
    const cards=document.createElement('div');cards.className='gdd-preview-cards';cards.setAttribute('aria-label','Tư liệu mới: '+title);
    const footer=document.createElement('div');footer.className='gdd-preview-footer';
    const more=document.createElement('a');more.href='#'+id;more.className='gdd-preview-more';more.textContent='Xem thêm '+title+' ↗';
    footer.append(more);block.append(header,cards,footer);inner.append(block);
    sectionViews.set(id,cards);
  }
  const extra=document.createElement('div');extra.className='gdd-directory-links';
  for(const [id,name] of sectionList.slice(6)){
    const a=document.createElement('a');a.href='#'+id;a.textContent=name+' ↗';extra.append(a);
  }
  inner.append(extra);directory.append(inner);
  const stats=main.querySelector('.number-band');
  if(stats)stats.insertAdjacentElement('afterend',directory);else home.insertAdjacentElement('afterend',directory);

  const extractPreview = (source,id) => {
    const title=source.querySelector('h3')?.textContent?.trim()||'Tư liệu Đạo sử';
    const summary=source.querySelector('.person-body p,.editorial-copy p,.archive-card-copy p,.gallery-card p')?.textContent?.trim()||'';
    const meta=source.querySelector('.person-rank,.article-tag,.archive-type,.person-years')?.textContent?.trim()||'';
    const image=source.querySelector('.person-media img,.editorial-image img,.gallery-visual img,.archive-thumb img')?.getAttribute('src')||'';
    const action=source.matches('[data-open-kind][data-id]')?source:source.querySelector('[data-open-kind][data-id]');
    // Khi URL từ nội dung chưa hợp lệ, không nhúng trực tiếp vào DOM.
    const kind=action?.dataset.openKind||'',recordId=action?.dataset.id||'';
    const card=document.createElement('button');card.type='button';card.className='gdd-preview-card';
    if(kind&&recordId){card.dataset.openKind=kind;card.dataset.id=recordId;card.setAttribute('aria-label','Xem: '+title)}
    else{card.disabled=true;card.title='Tư liệu đang cập nhật'}
    const media=document.createElement('span');media.className='gdd-preview-thumb';
    if(image&&/^(https:\/\/|\.\/|\/|[^:/?#]+\.(?:png|jpg|jpeg|webp)(?:\?|$))/i.test(image)){
      const img=document.createElement('img');img.src=image;img.loading='lazy';img.decoding='async';img.alt='Ảnh tư liệu: '+title;media.append(img);
    }else{
      const ph=document.createElement('span');ph.className='gdd-preview-fallback';ph.textContent='✦';media.append(ph);
    }
    const body=document.createElement('span');body.className='gdd-preview-copy';
    if(meta){const info=document.createElement('span');info.className='gdd-preview-meta';info.textContent=meta;body.append(info)}
    const name=document.createElement('strong');name.className='gdd-preview-name';name.textContent=title;body.append(name);
    if(summary){const desc=document.createElement('span');desc.className='gdd-preview-summary';desc.textContent=summary;body.append(desc)}
    const more=document.createElement('span');more.className='gdd-preview-hint';more.textContent='Xem chi tiết ↗';body.append(more);
    card.append(media,body);return card;
  };
  function updateHomePreview(id){
    // Trang Chủ Chức sắc sau khi dữ liệu đã nạp do bộ phân loại hai Đài quản lý.
    if(id==='chuc-sac' && document.body.classList.contains('gdd-people-enhanced'))return;
    const conf=previewSources[id],area=sectionViews.get(id);if(!conf||!area)return;
    const list=find('#'+conf[0]);if(!list)return;
    const items=[...list.querySelectorAll(':scope > '+conf[1])].slice(0,2);
    area.replaceChildren();
    if(items.length){for(const item of items)area.append(extractPreview(item,id))}
    else {const empty=document.createElement('div');empty.className='gdd-preview-empty';empty.textContent='Chuyên mục đang tiếp tục sưu tầm, biên soạn tư liệu.';area.append(empty)}
  }
  // app.js tự nạp lại nội dung sau mỗi lần lưu bài; quan sát danh sách gốc
  // và cập nhật ảnh giới thiệu, tuyệt đối không đụng vào bộ lọc/đăng bài.
  for(const id of Object.keys(previewSources)){
    const conf=previewSources[id],source=find('#'+conf[0]);if(!source)continue;
    let queued=false;
    new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;updateHomePreview(id)})}).observe(source,{childList:true});
    updateHomePreview(id);
  }

  const trail=document.createElement('nav');trail.id='gdd-route-path';trail.className='gdd-route-path';
  trail.setAttribute('aria-label','Đường dẫn chuyên mục');
  const back=document.createElement('a');back.href='#trang-chu';back.textContent='Trang Chủ';
  const path=document.createElement('span');trail.append(back,path);
  directory.insertAdjacentElement('afterend',trail);

  const getRoute=()=>{
    let value='';
    try{value=decodeURIComponent(location.hash.slice(1));}catch{value=location.hash.slice(1);}
    const [name,sub]=value.split('/');
    if(sub&&detailKinds[name])return detailKinds[name];
    return routeIds.has(name)?name:'trang-chu';
  };
  let active='';
  const applyRoute=()=>{
    // V2: Trang Chủ gọn như trước, chỉ hiển thị bản giới thiệu 1–2 tư liệu mỗi mục.
    // Khi chọn một chuyên mục, mở mục đầy đủ ở chiều ngang toàn trang.
    if(document.body.classList.contains('gdd-v2-ready')){
      const route=getRoute(),changed=active!==route;
      active=route;
      const isHome=['trang-chu','gioi-thieu','gui-tu-lieu'].includes(route);
      const full=new Set(['chuc-sac','video-dao-su','ai-tin','tai-lieu-so-hoa','bien-khao','hinh-anh']);
      const columns=find('#gdd-v2-columns'),support=find('#gdd-v2-support');
      for(const section of main.querySelectorAll(':scope > section')){
        if(full.has(section.id))section.hidden=isHome||section.id!==route;
        else if(section.id==='gdd-v2-search'||section.id==='trang-chu'||section.id==='gioi-thieu'||section.id==='gdd-v2-statistics')
          section.hidden=!isHome;
        else if(section===stats)section.hidden=!isHome;
      }
      if(columns)columns.hidden=!isHome;
      if(support)support.hidden=!isHome;
      directory.hidden=!isHome;
      trail.hidden=isHome;
      document.body.classList.toggle('gdd-separate-sections',!isHome);
      const found=sectionList.find(x=>x[0]===route);
      path.textContent=' / '+(found?found[1]:'');
      if(changed){
        requestAnimationFrame(()=>{
          if(route==='gioi-thieu')find('#gioi-thieu')?.scrollIntoView({behavior:'instant',block:'start'});
          else if(!location.hash.includes('/'))window.scrollTo({top:0,behavior:'instant'});
        });
      }
      return;
    }
    const route=getRoute();
    const changed=active!==route;
    active=route;
    const isHome=route==='trang-chu'||route==='gioi-thieu';
    for(const section of main.querySelectorAll(':scope > section')){
      if(section===directory)continue;
      if(section===stats){section.hidden=!isHome;continue;}
      if(section.id){section.hidden=isHome?!['trang-chu','gioi-thieu'].includes(section.id):section.id!==route;continue;}
      // Phần bổ sung không định danh được giữ nguyên để không tác động chức năng khác.
    }
    directory.hidden=!isHome;trail.hidden=isHome;
    const found=sectionList.find(x=>x[0]===route);
    path.textContent=' / '+(found?found[1]:'');
    document.body.classList.toggle('gdd-separate-sections',!isHome);
    if(changed){
      requestAnimationFrame(()=>{
        if(route==='gioi-thieu')find('#gioi-thieu')?.scrollIntoView({behavior:'instant',block:'start'});
        else if(!location.hash.includes('/'))window.scrollTo({top:0,behavior:'instant'});
      });
    }
  };
  window.addEventListener('hashchange',applyRoute);
  applyRoute();
})();
