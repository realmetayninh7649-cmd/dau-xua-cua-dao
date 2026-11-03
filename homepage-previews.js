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
