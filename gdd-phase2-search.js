/* GIỮ ĐẠO GIỮA ĐỜI — GIAI ĐOẠN 2: cổng tra cứu thống nhứt, không dấu, mã định danh.
 * Chỉ tìm bản ghi đã công bố; không sửa bảng, không dùng secret/service_role. */
(() => {
 'use strict';
 if(window.__GDDPhase2UnifiedSearch)return;window.__GDDPhase2UnifiedSearch=true;
 const $=(s,root=document)=>root.querySelector(s);
 const types=[
  {key:'people',label:'Chức sắc',prefix:'nhan-vat'},
  {key:'posts',label:'Biên khảo',prefix:'bai-viet'},
  {key:'media',label:'Hình ảnh',prefix:'hinh-anh-tu-lieu'},
  {key:'videos',label:'Video Đạo Sử',prefix:'video-dao-su'},
  {key:'obituaries',label:'Ai Tín',prefix:'ai-tin'},
  {key:'documents',label:'Tài liệu số',prefix:'tai-lieu-so-hoa'},
  {key:'gdd_memorials',label:'Tưởng niệm',prefix:'tuong-niem'},
  {key:'gdd_audio_programs',label:'Âm thanh',prefix:'am-thanh-dai-dao'}
 ];
 const branchNames=['Cửu Trùng Đài','Hiệp Thiên Đài','Phước Thiện','Hành chánh Đạo','Khác'];
 const norm=text=>String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/[._\-\/]+/g,' ').replace(/\s+/g,' ').trim();
 const safeUrl=url=>{try{const u=new URL(String(url||''),location.href);return u.protocol==='https:'?u.href:''}catch{return ''}};
 const formatName=(kind,row)=>kind==='people'?row.full_name:kind==='gdd_memorials'?(row.person_name||row.title):row.title;
 const data={rows:[],loaded:false,loading:null,errors:[],limit:12,last:[],timer:null};
 const el=(tag,attrs={},children=[])=>{
   const node=document.createElement(tag);
   for(const [k,v] of Object.entries(attrs)){
     if(v===null||v===undefined)continue;
     if(k==='class')node.className=v;
     else if(k==='text')node.textContent=v;
     else if(k==='hidden')node.hidden=Boolean(v);
     else node.setAttribute(k,String(v));
   }
   for(const c of children){if(c)node.append(c);}
   return node;
 };
 function build(){
   const hero=$('#trang-chu');if(!hero||$('#gdd-p2-search'))return;
   const wrap=el('div',{id:'gdd-p2-search',class:'gdd-p2-search','aria-label':'Tra cứu toàn bộ kho tư liệu'});
   wrap.innerHTML=`
    <div class="gdd-p2-search-top"><span class="gdd-p2-eyebrow">DẤU XƯA CỬA ĐẠO · CỔNG TRA CỨU</span>
    <div class="gdd-p2-search-heading"><div><h2>Tra cứu <em>kho Đạo sử</em></h2><p>Tìm hồ sơ Chức sắc, mã định danh, biên khảo, hình ảnh, video và tài liệu lịch sử.</p></div><span class="gdd-p2-search-icon" aria-hidden="true">⌕</span></div></div>
    <form class="gdd-p2-search-form" id="gdd-p2-search-form" role="search">
      <label class="gdd-p2-search-field" for="gdd-p2-q"><span class="sr-only">Tên nhân vật, số định danh hoặc từ khóa</span><span aria-hidden="true">⌕</span><input id="gdd-p2-q" type="search" autocomplete="off" placeholder="Nhập tên, mã hồ sơ hoặc từ khóa…" maxlength="160"></label>
      <div class="gdd-p2-search-filters">
        <label for="gdd-p2-branch">Cơ quan / Hệ thống<select id="gdd-p2-branch"><option value="all">Tất cả cơ quan</option></select></label>
        <label for="gdd-p2-rank">Phẩm vị<select id="gdd-p2-rank"><option value="all">Tất cả phẩm vị</option></select></label>
        <label for="gdd-p2-kind">Loại tư liệu<select id="gdd-p2-kind"><option value="all">Tất cả tư liệu</option></select></label>
      </div>
      <div class="gdd-p2-search-bottom"><span id="gdd-p2-search-hint">Tra cứu không dấu, không phân biệt chữ hoa và chữ thường.</span>
      <button id="gdd-p2-clear" type="button" hidden>Xóa bộ lọc</button></div>
    </form>
    <div id="gdd-p2-search-results" class="gdd-p2-results" hidden aria-live="polite">
      <div class="gdd-p2-results-head"><h3>Kết quả tra cứu</h3><p id="gdd-p2-result-status" role="status"></p></div>
      <div id="gdd-p2-result-grid" class="gdd-p2-result-grid"></div>
      <button type="button" class="gdd-p2-more" id="gdd-p2-result-more" hidden>Xem thêm kết quả</button>
    </div>
`;
   hero.insertAdjacentElement('afterend',wrap);
   const branch=$('#gdd-p2-branch'),kind=$('#gdd-p2-kind');
   const toggleOnRoute=()=>{
     const part=location.hash.replace(/^#/,'').split('/')[0];
     wrap.hidden=Boolean(part&&!['trang-chu','gioi-thieu','am-thanh-dai-dao','gdd-archive-dashboard','gdd-cal-qui-vi-list'].includes(part));
   };
   window.addEventListener('hashchange',toggleOnRoute);
   toggleOnRoute();
   for(const value of branchNames)branch.append(el('option',{value,text:value}));
   for(const t of types)kind.append(el('option',{value:t.key,text:t.label}));
   const submit=e=>{e.preventDefault();schedule(true);};
   $('#gdd-p2-search-form').addEventListener('submit',submit);
   const query=$('#gdd-p2-q');
   query.addEventListener('input',()=>schedule());
   for(const selector of ['#gdd-p2-branch','#gdd-p2-rank','#gdd-p2-kind'])
     $(selector).addEventListener('change',()=>schedule(true));
   $('#gdd-p2-clear').addEventListener('click',()=>{
     query.value='';branch.value='all';$('#gdd-p2-rank').value='all';kind.value='all';schedule(true);query.focus();
   });
   $('#gdd-p2-result-more').addEventListener('click',()=>{data.limit+=12;renderResults()});
   $('#gdd-p2-result-grid').addEventListener('click',event=>{
     const button=event.target.closest('[data-v2-audio]');
     if(!button)return;
     event.preventDefault();
     const id=button.dataset.v2Audio;
     if(!/^[0-9a-f-]{36}$/i.test(id))return;
     location.hash='#am-thanh-dai-dao';
     document.getElementById('gdd-p1-audio-panel')?.setAttribute('open','');
     window.dispatchEvent(new CustomEvent('gdd:search-open-audio',{detail:{id}}));
   });
 }
 async function fetchTable(client,table){
   const results=[];let offset=0;
   // Duyệt từng trang 250: không dừng ở mặc định 1.000 bản ghi của Supabase.
   while(true){
     const {data:rows,error}=await client.from(table).select('*').eq('published',true).order('created_at',{ascending:false}).range(offset,offset+249);
     if(error)throw error;
     const slice=rows||[];
     for(const row of slice)results.push(row);
     if(slice.length<250)break;
     offset+=slice.length;
   }
   return results;
 }
 async function load(){
   if(data.loaded)return;
   if(data.loading)return data.loading;
   const status=$('#gdd-p2-result-status');
   data.loading=(async()=>{
      data.errors=[];
     const config=window.SITE_CONFIG||{};
     if(!config.supabaseUrl||!config.supabasePublishableKey)throw Error('Chưa kết nối dữ liệu Supabase.');
     const mod=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
     const client=mod.createClient(config.supabaseUrl,config.supabasePublishableKey);
     const collected=await Promise.all(types.map(async t=>{
       try{return {type:t,rows:await fetchTable(client,t.key)}}
       catch(error){data.errors.push(t.label);console.warn('[GDD Search] '+t.key,error);return {type:t,rows:[]}}
     }));
     if(data.errors.length===types.length)throw Error('Không thể đọc dữ liệu công khai. Xin kiểm tra kết nối mạng.');
     const people=new Map((collected.find(x=>x.type.key==='people')?.rows||[]).map(p=>[p.id,p]));
     data.rows=collected.flatMap(({type,rows})=>rows.map(row=>{
       const person=type.key==='people'?row:people.get(row.person_id)||null;
       const name=formatName(type.key,row)||'Tư liệu Đạo sử';
       const rank=type.key==='gdd_memorials'?(row.rank_title||''):(person?.rank||'');
       const branch=person?.branch||'';
       const code=row.archive_code||'';
       const image=safeUrl(row.image_url||row.cover_url||row.portrait_url||(person?.published?person.image_url:'')||(type.key==='documents'&&/\.(png|jpe?g|webp)(\?|$)/i.test(row.file_url||'')?row.file_url:''));
       const meta=[row.category,row.document_number,row.document_date,row.memorial_date,person?.full_name,person?.archive_code].filter(Boolean).join(' ');
       const searchable=norm([name,code,row.archive_legacy_code||'',rank,branch,person?.subgroup,person?.secular_name,person?.full_name,person?.archive_legacy_code,row.deceased_name,row.person_name,row.document_number,row.death_date,row.anniversary_date,row.birthplace,row.years,meta,row.summary,row.caption,row.body,row.biography,row.sources,row.description].filter(Boolean).join(' '));
       const href=type.key==='gdd_audio_programs'?'#am-thanh-dai-dao':'#'+type.prefix+'/'+encodeURIComponent(row.slug||'');
       return {kind:type.key,label:type.label,row,person,name,rank,branch,code,image,href,searchable};
     }));
     const ranks=[...new Set(data.rows.filter(r=>r.kind==='people'||r.kind==='gdd_memorials').map(r=>r.rank).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
     const rankSelect=$('#gdd-p2-rank');
     for(const rank of ranks)rankSelect.append(el('option',{value:rank,text:rank}));
     data.loaded=true;
   })().finally(()=>{data.loading=null});
   return data.loading;
 }
 function computeResults(){
   const q=norm($('#gdd-p2-q').value),tokens=q.split(' ').filter(Boolean);
   const branch=$('#gdd-p2-branch').value,rank=$('#gdd-p2-rank').value,kind=$('#gdd-p2-kind').value;
   const narrowed=data.rows.filter(item=>{
     if(kind!=='all'&&item.kind!==kind)return false;
     if(branch!=='all'&&item.branch!==branch)return false;
     if(rank!=='all'&&item.rank!==rank)return false;
     return tokens.every(token=>item.searchable.includes(token));
   });
   const score=item=>{
     if(!q)return 0;
     const name=norm(item.name),code=norm(item.code);
     if(code===q||name===q)return 0;
     if(code.startsWith(q)||name.startsWith(q))return 1;
     if(name.includes(q)||code.includes(q))return 2;
     return 3;
   };
   return narrowed.sort((a,b)=>score(a)-score(b)||(Date.parse(b.row.created_at||'')||0)-(Date.parse(a.row.created_at||'')||0)||(a.name||'').localeCompare(b.name||'','vi'));
 }
 function renderResults(){
   const grid=$('#gdd-p2-result-grid'),status=$('#gdd-p2-result-status'),more=$('#gdd-p2-result-more');
   if(!grid)return;
   grid.replaceChildren();
   const results=data.last;
   status.textContent=results.length+' kết quả'+(data.errors.length?' · Chưa tải được: '+data.errors.join(', '):'');
   if(!results.length){
     grid.append(el('p',{class:'gdd-p2-empty',text:'Không tìm thấy tư liệu phù hợp. Hãy thử tên không dấu, tên khác hoặc bỏ bớt bộ lọc.'}));
   }
   for(const item of results.slice(0,data.limit)){
     const audio=item.kind==='gdd_audio_programs';
     const card=el(audio?'button':'a',audio?
       {class:'gdd-p2-result',type:'button','aria-label':'Nghe '+item.name}:
       {class:'gdd-p2-result',href:item.href,'aria-label':'Mở '+item.name});
     if(audio)card.dataset.v2Audio=item.row.id;
     const photo=el('div',{class:'gdd-p2-result-photo'});
     if(item.image){const img=el('img',{src:item.image,alt:'',loading:'lazy',decoding:'async'});img.addEventListener('error',()=>{img.remove();photo.textContent='✦';},{once:true});photo.append(img)}
     else photo.textContent=item.kind==='people'?'✧':'✦';
     const copy=el('div',{class:'gdd-p2-result-copy'});
     copy.append(el('span',{class:'gdd-p2-result-type',text:item.label}),el('strong',{text:item.name}));
     const info=[item.branch,item.rank].filter(Boolean).join(' · ')||item.row.category||item.row.document_date||'';
     if(info)copy.append(el('small',{text:info}));
     copy.append(el('span',{class:'gdd-p2-result-code',text:item.code?'Mã hồ sơ: '+item.code:item.kind==='gdd_audio_programs'?'Nghe chương trình':'Mở tư liệu'}));
     card.append(photo,copy,el('span',{class:'gdd-p2-result-arrow','aria-hidden':'true',text:'↗'}));grid.append(card);
   }
   more.hidden=results.length<=data.limit;
   if(!more.hidden)more.textContent='Xem thêm '+Math.min(12,results.length-data.limit)+' kết quả';
 }
 async function apply(){
   const q=$('#gdd-p2-q').value.trim(),branch=$('#gdd-p2-branch').value,rank=$('#gdd-p2-rank').value,kind=$('#gdd-p2-kind').value;
   const active=Boolean(q||branch!=='all'||rank!=='all'||kind!=='all');
   $('#gdd-p2-clear').hidden=!active;
   $('#gdd-p2-search-results').hidden=!active;
   if(!active)return;
   const status=$('#gdd-p2-result-status');
   status.textContent='Đang tra cứu kho tư liệu…';
   try{await load();}
   catch(error){status.textContent='Không tải được dữ liệu: '+(error.message||'Xin thử lại');$('#gdd-p2-result-grid').replaceChildren();return;}
   data.last=computeResults();data.limit=12;renderResults();
 }
 function schedule(immediate=false){
   clearTimeout(data.timer);
   data.timer=setTimeout(apply,immediate?0:180);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();
