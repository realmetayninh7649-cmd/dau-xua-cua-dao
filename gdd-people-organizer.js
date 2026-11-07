/* GIỮ ĐẠO GIỮA ĐỜI — Phân mục Nam/Nữ & sắp xếp hồ sơ Chức sắc.
 * Mô-đun bổ sung: không can thiệp các chức năng đăng bài, quản trị hoặc chuyên mục khác.
 * Yêu cầu chạy SUPABASE_PHAN_LOAI_NAM_NU_SAP_XEP.sql trước.
 */
(() => {
  'use strict';
  if (window.__gddPeopleOrganizer20261105) return;
  window.__gddPeopleOrganizer20261105 = true;
  const $=(s,root=document)=>root.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
  const safeURL=v=>{try{const u=new URL(String(v));return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}};
  const cfg=window.SITE_CONFIG||{};
  const root=$('#chuc-sac'),grid=$('#people-grid'),filters=root?.querySelector('.filter-panel');
  if(!root||!grid||!filters||!cfg.supabaseUrl||!cfg.supabasePublishableKey) return;

  const css=document.createElement('style');css.id='gdd-people-organizer-styles';css.textContent=`
  #gdd-sex-tabs{display:flex;flex-wrap:wrap;gap:8px;margin:15px 0 20px;align-items:center}
  #gdd-sex-tabs button{font:600 13px/1.45 'Be Vietnam Pro',sans-serif;background:#fffdf8;color:#29584d;border:1px solid #d4d1c4;border-radius:6px;padding:11px 17px;min-height:43px}
  #gdd-sex-tabs button[aria-pressed="true"]{background:#174d43;color:white;border-color:#174d43}
  #gdd-sex-tabs .gdd-sex-note{font-size:12px;color:#817764;margin-left:4px}
  body.gdd-people-enhanced #chuc-sac #people-grid,body.gdd-people-enhanced #chuc-sac .results-footer{display:none!important}
  #gdd-people-list{display:grid;gap:22px;width:100%;min-width:0}#gdd-people-list .person-card{min-width:0;max-width:100%;box-sizing:border-box;margin-inline:0!important}
  #gdd-people-count{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin:19px 0 30px;color:#637168;font-size:12px}
  .gdd-small-btn{border:1px solid #c9d4c8;color:#174d43;background:#fffdf8;font:600 12px 'Be Vietnam Pro',sans-serif;padding:11px 17px;border-radius:5px;min-height:42px}
  .gdd-small-btn:disabled{opacity:.4;cursor:default}
  .gdd-people-gender{font:700 10px 'Be Vietnam Pro',sans-serif;letter-spacing:.07em;color:#a17f51}
  .gdd-people-manager{margin:25px 0 18px;padding:19px 15px;background:#f5f5ee;border:1px solid #d8d8ca;border-radius:8px}
  .gdd-people-manager h4{margin:0 0 6px;font:600 19px/1.4 'Noto Serif',serif;color:#174d43}
  .gdd-people-manager p{font-size:12px;color:#67746a;line-height:1.7;margin:0 0 16px}
  .gdd-manager-tools{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px}
  .gdd-manager-tools select{flex:1;min-width:125px;max-width:230px;min-height:43px;border:1px solid #d5d6c9;background:#fffdf8;color:#174d43;border-radius:5px;padding:7px}
  .gdd-manage-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:space-between;padding:12px 0;border-top:1px solid #dfdfd5}
  .gdd-manage-name{flex:1 1 165px;min-width:130px}.gdd-manage-name strong{display:block;font-size:13px;color:#25463b}.gdd-manage-name small{font-size:11px;color:#788278}
  .gdd-manage-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
  .gdd-manage-actions select{min-height:40px;padding:6px;border:1px solid #c6d0c1;background:white;border-radius:4px;max-width:145px;color:#264f44;font-size:12px}
  .gdd-manage-actions button{border:1px solid #bdc8b9;background:#fff;color:#174d43;border-radius:4px;padding:7px 11px;min-width:40px;min-height:40px;font-size:15px}
  .gdd-manage-actions button:disabled{opacity:.35;cursor:default}
  #gdd-manager-status{font-size:12px;color:#746a58;margin:8px 0}
  .gdd-menu-gender{font-weight:600!important;color:#174d43!important}
  /* Trang Chủ Chức sắc: 2 cột, 4 thẻ cùng chiều cao; giữ vòng xoay 15 giây. */
  body #gdd-directory [data-preview-section="chuc-sac"] .gdd-preview-cards{display:block!important}
  body #gdd-directory .gdd-home-people-split{
    display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(9px,2vw,18px);
    align-items:stretch;width:100%;min-width:0
  }
  body #gdd-directory .gdd-home-people-branch{
    display:flex;flex-direction:column;align-self:stretch;min-width:0;
    padding:12px;box-sizing:border-box;background:rgba(255,253,247,.4);
    border:1px solid #e0d9ca;border-radius:7px
  }
  body #gdd-directory .gdd-home-people-branch-head{
    display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:5px 7px;
    min-height:47px;box-sizing:border-box;border-bottom:1px solid #e0d8c9;
    margin:0 0 11px;padding:0 0 10px
  }
  body #gdd-directory .gdd-home-people-branch-head h4{
    margin:0;min-width:0;font:700 clamp(14px,1.55vw,18px)/1.4 'Noto Serif',Georgia,serif;color:#205346
  }
  body #gdd-directory .gdd-home-people-branch-head span{
    white-space:nowrap;font:600 10px/1.45 'Be Vietnam Pro',sans-serif;color:#a17d48
  }
  body #gdd-directory .gdd-home-people-cards{
    display:grid;grid-template-columns:minmax(0,1fr);
    grid-template-rows:repeat(2,minmax(0,1fr));gap:11px;flex:1 1 auto;min-width:0
  }
  body #gdd-directory .gdd-home-person-mini{
    display:grid;grid-template-columns:118px minmax(0,1fr);
    grid-template-rows:minmax(0,1fr);align-items:stretch;
    width:100%;height:100%;min-width:0;min-height:183px;box-sizing:border-box
  }
  body #gdd-directory .gdd-home-person-mini .gdd-preview-thumb{
    display:flex;align-items:center;justify-content:center;
    flex:none;width:100%;min-width:0;max-width:none;height:100%;min-height:0;
    overflow:hidden;background:#eeede5;border-right:1px solid #e5e0d6
  }
  body #gdd-directory .gdd-home-person-mini .gdd-preview-thumb img{
    display:block;width:100%;height:100%;object-fit:contain;object-position:center
  }
  body #gdd-directory .gdd-home-person-mini .gdd-preview-copy{
    display:flex;flex-direction:column;flex:1;min-width:0;min-height:0;
    box-sizing:border-box;padding:11px 12px;gap:5px
  }
  body #gdd-directory .gdd-home-person-mini .gdd-preview-meta{
    display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;
    line-height:1.45;min-height:2.9em;max-height:2.9em;overflow:hidden
  }
  body #gdd-directory .gdd-home-person-mini .gdd-preview-name{
    display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;
    font-size:14px;line-height:1.36;min-height:4.08em;max-height:4.08em;
    margin:0;overflow:hidden;overflow-wrap:anywhere
  }
  body #gdd-directory .gdd-home-person-mini .gdd-preview-summary{
    display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;
    font-size:10px;line-height:1.55;min-height:3.1em;max-height:3.1em;
    margin:0;overflow:hidden
  }
  body #gdd-directory .gdd-home-person-mini .gdd-preview-hint{
    display:block;align-self:flex-start;margin-top:auto;font-size:10px;line-height:1.4
  }
  body #gdd-directory .gdd-home-people-branch .gdd-preview-empty{
    grid-column:auto;min-height:183px;box-sizing:border-box;
    display:flex;align-items:center;padding:14px 9px;font-size:11px
  }
  /* iPad và điện thoại: cùng một bố cục ảnh phía trên và nội dung phía dưới. */
  @media(max-width:920px){
    body #gdd-directory .gdd-home-people-branch{padding:9px}
    body #gdd-directory .gdd-home-people-branch-head{min-height:48px}
    body #gdd-directory .gdd-home-person-mini{
      grid-template-columns:minmax(0,1fr);
      grid-template-rows:142px minmax(0,1fr);min-height:322px
    }
    body #gdd-directory .gdd-home-person-mini .gdd-preview-thumb{
      height:142px;min-height:0;border-right:0;border-bottom:1px solid #e5e0d6
    }
    body #gdd-directory .gdd-home-person-mini .gdd-preview-copy{padding:10px;gap:5px}
  }
  @media(max-width:560px){
    body #gdd-directory .gdd-home-people-split{gap:9px}
    body #gdd-directory .gdd-home-people-branch{padding:7px}
    body #gdd-directory .gdd-home-people-branch-head{
      grid-template-columns:minmax(0,1fr) auto;min-height:50px;
      margin-bottom:8px;padding-bottom:7px;align-items:start
    }
    body #gdd-directory .gdd-home-people-branch-head h4{font-size:12px;line-height:1.35}
    body #gdd-directory .gdd-home-people-branch-head span{font-size:9px;line-height:1.35}
    body #gdd-directory .gdd-home-people-cards{gap:8px}
    body #gdd-directory .gdd-home-person-mini{
      grid-template-rows:125px minmax(0,1fr);min-height:305px
    }
    body #gdd-directory .gdd-home-person-mini .gdd-preview-thumb{height:125px;min-height:0}
    body #gdd-directory .gdd-home-person-mini .gdd-preview-copy{padding:8px;gap:4px}
    body #gdd-directory .gdd-home-person-mini .gdd-preview-meta{font-size:10px;line-height:1.35;min-height:2.7em;max-height:2.7em}
    body #gdd-directory .gdd-home-person-mini .gdd-preview-name{
      font-size:12px;line-height:1.35;min-height:4.05em;max-height:4.05em
    }
    body #gdd-directory .gdd-home-person-mini .gdd-preview-summary{
      font-size:9.5px;line-height:1.5;min-height:3em;max-height:3em
    }
    body #gdd-directory .gdd-home-person-mini .gdd-preview-hint{font-size:9.5px}
    body #gdd-directory .gdd-home-people-branch .gdd-preview-empty{min-height:305px}
  }
  @media(max-width:365px){
    body #gdd-directory .gdd-home-people-split{gap:7px}
    body #gdd-directory .gdd-home-people-branch{padding:5px}
    body #gdd-directory .gdd-home-person-mini{grid-template-rows:112px minmax(0,1fr);min-height:288px}
    body #gdd-directory .gdd-home-person-mini .gdd-preview-thumb{height:112px}
    body #gdd-directory .gdd-home-person-mini .gdd-preview-copy{padding:7px}
    body #gdd-directory .gdd-home-person-mini .gdd-preview-name{font-size:11.5px}
    body #gdd-directory .gdd-home-person-mini .gdd-preview-summary{font-size:9px}
    body #gdd-directory .gdd-home-people-branch .gdd-preview-empty{min-height:288px}
  }
  @media(max-width:680px){#gdd-people-list .person-card{width:100%}#gdd-sex-tabs button{flex:1 1 auto} .gdd-manage-row{align-items:stretch}}
  `;
  document.head.append(css);

  const s={client:null,rows:[],selectedSex:'Nam',visible:6,ready:false,busy:false,managerBranch:'all',managerSex:'all',lastFetch:0};
  const tabs=document.createElement('div');tabs.id='gdd-sex-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','Phân loại Chức sắc Nam Nữ');
  const sexOptions=[['Nam','Chức sắc Nam'],['Nữ','Chức sắc Nữ'],['Chưa phân loại','Chưa phân loại']];
  for(const [value,label] of sexOptions){const b=document.createElement('button');b.type='button';b.dataset.gddSex=value;b.textContent=label;b.setAttribute('aria-pressed',value===s.selectedSex?'true':'false');tabs.append(b)}
  const notice=document.createElement('span');notice.className='gdd-sex-note';tabs.append(notice);
  filters.insertAdjacentElement('afterend',tabs);
  const area=document.createElement('div');area.id='gdd-people-list';area.setAttribute('aria-live','polite');tabs.insertAdjacentElement('afterend',area);
  const foot=document.createElement('div');foot.id='gdd-people-count';
  const totalLabel=document.createElement('span'),more=document.createElement('button');more.type='button';more.className='gdd-small-btn';foot.append(totalLabel,more);area.insertAdjacentElement('afterend',foot);
  const branchFilter=$('#branch-filter'),subgroupFilter=$('#subgroup-filter'),searchInput=$('#people-search');
  function cleanSubgroupLabels(){
    for(const opt of subgroupFilter.options)opt.textContent=opt.textContent.replace(/\s+Nam\/Nữ/g,'');
  }
  cleanSubgroupLabels();
  branchFilter.addEventListener('change',()=>queueMicrotask(cleanSubgroupLabels));
  const subObserver=new MutationObserver(cleanSubgroupLabels);
  subObserver.observe(subgroupFilter,{childList:true});
  document.querySelectorAll('#nav-chuc-sac .mega-menu a[data-subgroup]').forEach(a=>{
    for(const n of a.childNodes)if(n.nodeType===Node.TEXT_NODE)n.textContent=n.textContent.replace(/\s+Nam\/Nữ/g,'');
  });

  function sorted(){return [...s.rows].sort((a,b)=>{
    const av=a.sort_order,bv=b.sort_order;
    if(av==null&&bv!=null)return -1;if(bv==null&&av!=null)return 1;
    if(av!=null&&bv!=null&&av!==bv)return av-bv;
    return String(b.created_at||'').localeCompare(String(a.created_at||''))||String(a.id).localeCompare(String(b.id));
  });}
  function matching(){const branch=branchFilter.value,sub=subgroupFilter.value,q=norm(searchInput.value);
    return sorted().filter(p=>(branch==='all'||(p.branch||'Khác')===branch)
      &&(sub==='all'||p.subgroup===sub)
      &&(p.gender||'Chưa phân loại')===s.selectedSex
      &&norm([p.full_name,p.secular_name,p.rank,p.branch,p.subgroup,p.birthplace,p.summary,p.biography].join(' ')).includes(q));}
  const sourceMarkup=p=>{
    const url=safeURL(p.image_url),name=esc(p.full_name),image=url?`<img src="${esc(url)}" alt="Di ảnh ${name}" loading="lazy" decoding="async">`:
      `<div class="portrait-placeholder"><span class="symbol">✦</span></div>`;
    return `<article class="person-card"><div class="person-media">${image}<span class="card-badge">${esc(p.branch||'TƯ LIỆU ĐẠO SỬ')}</span></div>
      <div class="person-body"><span class="person-rank">${esc(p.rank||'Chức sắc')}</span>
      <div class="gdd-people-gender">${esc(p.gender||'Chưa phân loại')}</div><h3>${name}</h3>
      <span class="person-years">${esc(p.years||'Đang bổ sung niên đại')}</span>
      <p>${esc(p.summary||'Hồ sơ tư liệu đang được biên soạn.')}</p>
      <div class="card-bottom"><span>${p.verified?'Đã đối chiếu':'Đang đối chiếu'}</span>
      <button type="button" class="card-link" data-open-kind="people" data-id="${esc(p.id)}">Xem tiểu sử <span>↗</span></button></div></div></article>`;
  };
  function renderList(){if(!s.ready)return;
    const arr=matching(),visible=arr.slice(0,s.visible);
    area.innerHTML=visible.length?visible.map(sourceMarkup).join(''):'<div class="empty-state"><b>Chưa có hồ sơ trong phân mục này.</b>Hãy chọn cơ quan khác hoặc kiểm tra mục Chưa phân loại.</div>';
    totalLabel.textContent=`Đang hiển thị ${visible.length} / ${arr.length} hồ sơ ${s.selectedSex.toLowerCase()}`;
    more.hidden=arr.length<=6;more.textContent=arr.length>s.visible?`Xem thêm ${Math.min(6,arr.length-s.visible)} hồ sơ ↗`:'Thu gọn ↑';
    tabs.querySelectorAll('[data-gdd-sex]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.gddSex===s.selectedSex)));
    const unsure=sorted().filter(p=>(p.gender||'Chưa phân loại')==='Chưa phân loại').length;
    notice.textContent=unsure?`${unsure} hồ sơ chưa phân loại` : '';
    renderHomepagePreview();
  }
  function setSex(sex){if(!sexOptions.some(([v])=>v===sex))return;s.selectedSex=sex;s.visible=6;renderList();}
  tabs.addEventListener('click',e=>{const b=e.target.closest('[data-gdd-sex]');if(b)setSex(b.dataset.gddSex)});
  more.addEventListener('click',()=>{const total=matching().length;s.visible=s.visible>=total?6:s.visible+6;renderList();});
  for(const control of [branchFilter,subgroupFilter,searchInput]){
    control.addEventListener(control===searchInput?'input':'change',()=>{s.visible=6;renderList()});
  }

  // Giữ các phân nhóm phẩm vị cũ; chỉ thêm hai đường dẫn Nam / Nữ trong mỗi cơ quan.
  const nav=$('#nav-chuc-sac .mega-menu');
  if(nav){
    const addLinks=(section,branch)=>{
      const first=section.querySelector('a');if(!first)return;
      let after=first;
      for(const [sex] of sexOptions.slice(0,2)){
        const a=document.createElement('a');a.href='#chuc-sac';a.className='gdd-menu-gender';
        a.textContent=`Chức sắc ${sex}`;a.dataset.gddBranch=branch;a.dataset.gddSexLink=sex;
        after.insertAdjacentElement('afterend',a);after=a;
      }
    };
    nav.querySelectorAll('section').forEach(section=>{
      const first=section.querySelector('a[data-branch]');if(!first)return;
      const b=first.dataset.branch;
      if(b&&b!=='all')addLinks(section,b);
      // Mục "CƠ QUAN KHÁC" có hai cơ quan: mỗi cơ quan chèn hai đường dẫn riêng.
      if(norm(section.querySelector('h3')?.textContent||'').includes('co quan khac')){
        for(const link of [...section.querySelectorAll('a[data-branch]')]){
          if(link===first)continue;
          let after=link;
          for(const sex of ['Nam','Nữ']){
            const a=document.createElement('a');a.href='#chuc-sac';a.className='gdd-menu-gender';a.dataset.gddBranch=link.dataset.branch;a.dataset.gddSexLink=sex;a.textContent=`${sex} · ${link.textContent.trim()}`;
            after.insertAdjacentElement('afterend',a);after=a;
          }
        }
      }
    });
    nav.addEventListener('click',e=>{
      const a=e.target.closest('[data-gdd-sex-link]');if(!a)return;
      e.preventDefault();branchFilter.value=a.dataset.gddBranch;
      branchFilter.dispatchEvent(new Event('change',{bubbles:true}));
      subgroupFilter.value='all';setSex(a.dataset.gddSexLink);
      $('#main-nav')?.classList.remove('is-open');
      $('#menu-toggle')?.setAttribute('aria-expanded','false');
      const details=$('#nav-chuc-sac');if(details)details.open=false;
      location.hash='#chuc-sac';
    });
  }
  // Đường dẫn chung TẤT CẢ cơ quan: Nam/Nữ cũng có thể được chọn trên thanh lọc.

  async function fetchRows(){if(!s.client)return;
    const rows=[];for(let from=0;from<10000;from+=1000){
      const {data,error}=await s.client.from('people').select('*')
        .order('created_at',{ascending:false}).order('id',{ascending:true}).range(from,from+999);
      if(error)throw error;rows.push(...(data||[]));if(!data||data.length<1000)break;
    }
    s.rows=rows;s.ready=true;
    if(s.selectedSex==='Nam' && !rows.some(p=>p.gender==='Nam') && !rows.some(p=>p.gender==='Nữ')
       && rows.some(p=>(p.gender||'Chưa phân loại')==='Chưa phân loại')) s.selectedSex='Chưa phân loại';
    document.body.classList.add('gdd-people-enhanced');renderList();renderManager();
  }
  // Trang Chủ: 2 Chức sắc mỗi Đài, tự động đổi cặp sau mỗi 15 giây.
  // Giữ nguyên cách sắp xếp trong quản trị; chỉ thay những thẻ xem trước.
  let homeRotationTick=0;
  function renderHomepagePreview(){
    const box=document.querySelector('[data-preview-section="chuc-sac"] .gdd-preview-cards');
    if(!box||!s.ready)return;
    const ordered=sorted().filter(p=>p.published);
    const groups=[
      {branch:'Hiệp Thiên Đài',short:'HIỆP THIÊN ĐÀI'},
      {branch:'Cửu Trùng Đài',short:'CỬU TRÙNG ĐÀI'}
    ].map(group=>{
      const candidates=ordered.filter(p=>norm(p.branch)===norm(group.branch));
      const rows=candidates.length<=2?candidates:
        Array.from({length:2},(_,i)=>candidates[(homeRotationTick*2+i)%candidates.length]);
      return {...group,rows};
    });
    const signature=JSON.stringify(groups.map(g=>g.rows.map(p=>[p.id,p.full_name,p.rank,p.summary,p.image_url,p.sort_order])));
    if(box.dataset.gddHomeBranches===signature && box.querySelector('.gdd-home-people-split'))return;
    const card=p=>{
      const image=safeURL(p.image_url);
      return `<button type="button" class="gdd-preview-card gdd-home-person-mini" data-open-kind="people" data-id="${esc(p.id)}" aria-label="Xem tiểu sử ${esc(p.full_name)}">
        <span class="gdd-preview-thumb">${image?`<img src="${esc(image)}" alt="Di ảnh ${esc(p.full_name)}" loading="lazy" decoding="async">`:'<span class="gdd-preview-fallback" aria-hidden="true">✦</span>'}</span>
        <span class="gdd-preview-copy"><span class="gdd-preview-meta">${esc(p.rank||'Chức sắc')}</span>
        <strong class="gdd-preview-name">${esc(p.full_name)}</strong>
        <span class="gdd-preview-summary">${esc(p.summary||'Hồ sơ Chức sắc tiền bối')}</span>
        <span class="gdd-preview-hint">Xem chi tiết ↗</span></span></button>`;
    };
    const html=groups.map(group=>`
      <section class="gdd-home-people-branch" aria-label="Chức sắc ${esc(group.branch)}">
        <div class="gdd-home-people-branch-head"><h4>${esc(group.branch)}</h4><span>${group.rows.length} / 2 hồ sơ</span></div>
        <div class="gdd-home-people-cards">${group.rows.map(card).join('')||
          '<div class="gdd-preview-empty">Đang bổ sung hồ sơ Chức sắc thuộc cơ quan này.</div>'}</div>
      </section>`).join('');
    box.innerHTML='<div class="gdd-home-people-split">'+html+'</div>';
    box.dataset.gddHomeBranches=signature;
  }

  // Quản trị: thêm khu vực quản lý riêng BÊN DƯỚI danh sách bài hiện có.
  const adminArea=$('#admin-editor-area'),editorList=$('#editor-list');
  let manager=null,managerList=null,adminMessage=null;
  if(adminArea&&editorList){
    manager=document.createElement('section');manager.className='gdd-people-manager';manager.id='gdd-people-manager';
    manager.innerHTML=`<h4>Phân loại Nam/Nữ và sắp xếp Chức sắc</h4>
      <p>Chọn đúng Nam hoặc Nữ cho từng hồ sơ. Dùng ↑ / ↓ để đổi thứ tự xuất hiện trong thư mục và Trang Chủ; thứ tự được lưu trực tuyến. Hồ sơ chưa xác định để riêng, không trộn với Nam/Nữ.</p>
      <div class="gdd-manager-tools"><select id="gdd-manager-branch" aria-label="Lọc cơ quan trong quản trị">
      <option value="all">Tất cả cơ quan</option>${['Cửu Trùng Đài','Hiệp Thiên Đài','Phước Thiện','Hành chánh Đạo','Khác'].map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}
      </select><select id="gdd-manager-sex" aria-label="Lọc Nam Nữ trong quản trị">
      <option value="all">Tất cả Nam/Nữ</option>${sexOptions.map(([x])=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}
      </select></div><div id="gdd-manager-status" role="status"></div><div id="gdd-manager-rows"></div>`;
    editorList.parentElement.append(manager);
    managerList=$('#gdd-manager-rows',manager);adminMessage=$('#gdd-manager-status',manager);
    manager.querySelector('#gdd-manager-branch').addEventListener('change',e=>{s.managerBranch=e.target.value;renderManager()});
    manager.querySelector('#gdd-manager-sex').addEventListener('change',e=>{s.managerSex=e.target.value;renderManager()});
    manager.addEventListener('change',async e=>{
      const select=e.target.closest('[data-gdd-assign]');if(!select||s.busy)return;
      const person=s.rows.find(p=>p.id===select.dataset.gddAssign);if(!person)return;
      s.busy=true;select.disabled=true;adminMessage.textContent='Đang lưu phân loại…';
      const previous=person.gender||'Chưa phân loại';
      const {error}=await s.client.from('people').update({gender:select.value}).eq('id',person.id);
      if(error){select.value=previous;adminMessage.textContent='Không thể lưu: '+error.message}
      else{person.gender=select.value;adminMessage.textContent='Đã lưu phân loại '+person.full_name;renderList();}
      s.busy=false;await fetchRows().catch(err=>{adminMessage.textContent=err.message;});
    });
    manager.addEventListener('click',async e=>{
      const b=e.target.closest('[data-gdd-move]');if(!b||s.busy)return;
      const id=b.dataset.id,delta=b.dataset.gddMove==='up'?-1:1;
      const global=sorted(),arr=managerRows(),i=arr.findIndex(p=>p.id===id),other=arr[i+delta];if(i<0||!other)return;
      const a=global.findIndex(p=>p.id===id),z=global.findIndex(p=>p.id===other.id);if(a<0||z<0)return;
      [global[a],global[z]]=[global[z],global[a]];
      s.busy=true;adminMessage.textContent='Đang lưu thứ tự…';manager.querySelectorAll('button,select').forEach(el=>el.disabled=true);
      const {error}=await s.client.rpc('gdd_set_people_order',{p_ids:global.map(p=>p.id)});
      if(error)adminMessage.textContent='Không thể sắp xếp: '+error.message;
      else adminMessage.textContent='Đã lưu thứ tự hồ sơ.';
      s.busy=false;manager.querySelectorAll('button,select').forEach(el=>el.disabled=false);
      await fetchRows().catch(err=>{adminMessage.textContent=err.message;});
    });
    new MutationObserver(()=>renderManager()).observe(adminArea,{attributes:true,attributeFilter:['hidden']});
    new MutationObserver(()=>renderManager()).observe($('.editor-tabs')||adminArea,{subtree:true,attributes:true,attributeFilter:['class']});
  }
  function managerRows(){return sorted().filter(p=>(s.managerBranch==='all'||(p.branch||'Khác')===s.managerBranch)&&
    (s.managerSex==='all'||(p.gender||'Chưa phân loại')===s.managerSex));}
  function renderManager(){if(!manager)return;
    const active=adminArea&&!adminArea.hidden&&$('.editor-tabs button.is-selected')?.dataset.kind==='people';
    manager.hidden=!active;if(!active||!s.ready)return;
    const arr=managerRows();
    managerList.innerHTML=arr.length?arr.map((p,i)=>`<div class="gdd-manage-row"><div class="gdd-manage-name">
      <strong>${esc(p.full_name)}</strong><small>${esc(p.rank||'Chức sắc')} · ${esc(p.branch||'Khác')} ${p.published?'':'· BẢN NHÁP'}</small></div>
      <div class="gdd-manage-actions"><select data-gdd-assign="${esc(p.id)}" aria-label="Phân loại ${esc(p.full_name)}">
      ${sexOptions.map(([sex])=>`<option value="${esc(sex)}" ${(p.gender||'Chưa phân loại')===sex?'selected':''}>${esc(sex)}</option>`).join('')}</select>
      <button type="button" data-gdd-move="up" data-id="${esc(p.id)}" aria-label="Đưa lên: ${esc(p.full_name)}" ${i===0?'disabled':''}>↑</button>
      <button type="button" data-gdd-move="down" data-id="${esc(p.id)}" aria-label="Đưa xuống: ${esc(p.full_name)}" ${i===arr.length-1?'disabled':''}>↓</button></div></div>`).join(''):'<p>Chưa có hồ sơ ở nhóm này.</p>';
  }
  // Khi app.js tải lại nội dung sau khi đăng, cập nhật dữ liệu mới ở mô-đun.
  if(editorList){let timer=0;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{
    if(!adminArea?.hidden)fetchRows().catch(()=>{});
  },350)}).observe(editorList,{childList:true});}
  const preview=$('[data-preview-section="chuc-sac"] .gdd-preview-cards');
  if(preview){
    new MutationObserver(()=>renderHomepagePreview()).observe(preview,{childList:true});
    // Chỉ xoay khi đang xem Trang Chủ. Ngừng tạm thời nếu tab ẩn,
    // đang mở chi tiết, hoặc đang tương tác bằng chuột/bàn phím với thẻ.
    setInterval(()=>{
      if(!s.ready||document.hidden||preview.closest('#gdd-directory')?.hidden)return;
      if(document.querySelector('#detail-overlay')?.hidden===false)return;
      if(preview.contains(document.activeElement)&&document.activeElement?.matches?.(':focus-visible'))return;
      if(window.matchMedia('(hover:hover) and (pointer:fine)').matches&&preview.matches(':hover'))return;
      const published=sorted().filter(p=>p.published);
      if(!['Hiệp Thiên Đài','Cửu Trùng Đài'].some(branch=>
        published.filter(p=>norm(p.branch)===norm(branch)).length>2))return;
      homeRotationTick++;
      renderHomepagePreview();
    },15000);
  }
  async function init(){try{
    const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    s.client=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{autoRefreshToken:true,persistSession:true}});
    await fetchRows();s.client.auth.onAuthStateChange(()=>setTimeout(()=>fetchRows().catch(()=>{}),250));
  }catch(err){console.warn('[GDD People Organizer]',err);notice.textContent='Cần chạy SQL phân loại Chức sắc rồi tải lại trang.';
    // Chưa chạy SQL hoặc lỗi mạng: giữ nguyên trang Chức sắc gốc.
  }}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
