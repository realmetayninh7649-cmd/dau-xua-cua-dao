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
    .gdd-directory{padding:56px 0 76px;background:#f7f5ef}
    .gdd-directory-inner{width:min(1160px,calc(100% - 48px));margin:auto}
    .gdd-directory-eyebrow{font:700 12px/1.5 'Be Vietnam Pro',sans-serif;letter-spacing:.17em;color:#b48b4e}
    .gdd-directory h2{margin:12px 0 10px;font:600 clamp(29px,4vw,41px)/1.3 'Noto Serif',Georgia,serif;color:#224a3e}
    .gdd-directory-desc{margin:0 0 28px;font:400 14px/1.8 'Be Vietnam Pro',sans-serif;color:#66736a}
    .gdd-directory-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
    .gdd-directory-card{display:flex;flex-direction:column;min-width:0;min-height:147px;padding:20px 19px;background:#fffdfa;border:1px solid #e2ded2;border-radius:6px;text-decoration:none;color:#234d42;box-shadow:0 5px 18px rgba(22,49,38,.035)}
    .gdd-directory-card:hover,.gdd-directory-card:focus-visible{border-color:#bda57b;box-shadow:0 12px 27px rgba(22,49,38,.08)}
    .gdd-directory-card strong{font:600 18px/1.5 'Noto Serif',Georgia,serif}
    .gdd-directory-card small{flex:1;font:400 12px/1.7 'Be Vietnam Pro',sans-serif;color:#69766d;margin-top:8px}
    .gdd-directory-card span{margin-top:12px;font:700 12px/1.5 'Be Vietnam Pro',sans-serif;color:#19594f}
    .gdd-directory-links{display:flex;gap:15px;flex-wrap:wrap;margin-top:21px}
    .gdd-directory-links a{color:#1f6559;font:700 13px/1.6 'Be Vietnam Pro',sans-serif;text-underline-offset:4px}
    .gdd-route-path{width:min(1160px,calc(100% - 48px));margin:22px auto 0;padding:0;font:600 12px/1.6 'Be Vietnam Pro',sans-serif;color:#a0804a}
    .gdd-route-path a{color:#35645b;text-decoration:none}
    .gdd-route-path a:hover{text-decoration:underline}
    .gdd-route-path span{margin-left:8px}
    body.gdd-separate-sections main > section.section{padding-top:34px}
    @media(max-width:820px){.gdd-directory-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:560px){.gdd-directory{padding:35px 0 46px}.gdd-directory-inner,.gdd-route-path{width:calc(100% - 32px)}.gdd-directory-grid{gap:10px}.gdd-directory-card{padding:15px 14px;min-height:144px}.gdd-directory-card strong{font-size:15px}.gdd-directory-card small{font-size:11px}.gdd-directory-card span{font-size:11px}}
    @media(max-width:340px){.gdd-directory-grid{grid-template-columns:1fr}}
  `;
  document.head.append(css);

  const directory=document.createElement('section');directory.id='gdd-directory';directory.className='gdd-directory';
  const inner=document.createElement('div');inner.className='gdd-directory-inner';
  inner.innerHTML='<div class="gdd-directory-eyebrow">KHÁM PHÁ KHO TƯ LIỆU</div><h2>Chọn một chuyên mục</h2><p class="gdd-directory-desc">Mỗi chuyên mục được trình bày riêng, thuận tiện tra cứu trên điện thoại và máy tính.</p>';
  const cards=document.createElement('nav');cards.className='gdd-directory-grid';cards.setAttribute('aria-label','Các chuyên mục Đạo sử');
  sectionList.slice(0,6).forEach(([id,name,description])=>{
    const card=document.createElement('a');card.href='#'+id;card.className='gdd-directory-card';
    const heading=document.createElement('strong');heading.textContent=name;
    const small=document.createElement('small');small.textContent=description;
    const label=document.createElement('span');label.textContent='Mở chuyên mục ↗';
    card.append(heading,small,label);cards.append(card);
  });
  const extra=document.createElement('div');extra.className='gdd-directory-links';
  for(const [id,name] of sectionList.slice(6)){
    const a=document.createElement('a');a.href='#'+id;a.textContent=name+' ↗';extra.append(a);
  }
  inner.append(cards,extra);directory.append(inner);
  const stats=main.querySelector('.number-band');
  if(stats)stats.insertAdjacentElement('afterend',directory);else home.insertAdjacentElement('afterend',directory);

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
    const route=getRoute();
    const changed=active!==route;
    active=route;
    const isHome=route==='trang-chu';
    for(const section of main.querySelectorAll(':scope > section')){
      if(section===directory)continue;
      if(section===stats){section.hidden=!isHome;continue;}
      if(section.id){section.hidden=isHome?section.id!=='trang-chu':section.id!==route;continue;}
      // Phần bổ sung không định danh được giữ nguyên để không tác động chức năng khác.
    }
    directory.hidden=!isHome;trail.hidden=isHome;
    const found=sectionList.find(x=>x[0]===route);
    path.textContent=' / '+(found?found[1]:'');
    document.body.classList.toggle('gdd-separate-sections',!isHome);
    if(changed){
      requestAnimationFrame(()=>{
        if(!location.hash.includes('/'))window.scrollTo({top:0,behavior:'instant'});
      });
    }
  };
  window.addEventListener('hashchange',applyRoute);
  applyRoute();
})();
