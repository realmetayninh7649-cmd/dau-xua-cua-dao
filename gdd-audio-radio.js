(function RadioModule(){
'use strict';
if(window.__GDDRadio2026)return;
window.__GDDRadio2026=true;
const cfg=window.SITE_CONFIG||{};
if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return;
const TABLE='gdd_audio_programs',BUCKET='dao-su-audio';
const names={'niem-danh':'Niệm danh hiệu','radio-dao-su':'Radio Đạo Sử','thuyet-minh':'Bài thuyết minh'};
const $=(q,root=document)=>root.querySelector(q);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=v=>{try{const u=new URL(String(v||''),location.href);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
const date=v=>v?String(v).slice(0,10).split('-').reverse().join('/'):'Chưa rõ ngày';
const slug=v=>String(v||'so-radio').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,75)||'so-radio';
const style=document.createElement('style');
style.id='gdd-radio-styles';
style.textContent=`
#am-thanh-dai-dao{background:linear-gradient(135deg,#f9f8f2,#f0f0e8);border-block:1px solid #e3dfd4}
#am-thanh-dai-dao .gdd-radio-kicker{font:700 10px/1.7 'Be Vietnam Pro',sans-serif;letter-spacing:.14em;color:#a1844e}
#am-thanh-dai-dao h2{color:#205146;font:600 clamp(27px,3vw,38px)/1.4 'Noto Serif',Georgia,serif;margin:8px 0}
#am-thanh-dai-dao .gdd-radio-lead{font-size:12px;line-height:1.85;color:#69776e;max-width:740px;margin:4px 0 22px}
#am-thanh-dai-dao .gdd-radio-tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:17px}
#am-thanh-dai-dao .gdd-radio-tabs button{border:1px solid #cfc9ba;border-radius:5px;padding:9px 12px;background:#fffdf8;color:#28564a;font:600 11px/1.4 'Be Vietnam Pro',sans-serif;cursor:pointer}
#am-thanh-dai-dao .gdd-radio-tabs button[aria-pressed=true]{background:#205548;color:white;border-color:#205548}
#am-thanh-dai-dao .gdd-radio-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(265px,.85fr);gap:20px;align-items:start}
#am-thanh-dai-dao .gdd-radio-list{display:grid;grid-template-columns:minmax(0,1fr);gap:11px}
#am-thanh-dai-dao .gdd-radio-item{display:grid;grid-template-columns:94px minmax(0,1fr);width:100%;min-height:116px;padding:0;border:1px solid #dfd9ca;border-radius:7px;background:#fffdf9;overflow:hidden;text-align:left;color:inherit;cursor:pointer}
#am-thanh-dai-dao .gdd-radio-item[data-active=true]{border-color:#b09560;box-shadow:0 0 0 1px #b09560}
#am-thanh-dai-dao .gdd-radio-art{width:94px;height:100%;min-height:116px;object-fit:contain;background:#e6e8e0;display:flex;align-items:center;justify-content:center;color:#a18a60;font:36px/1 Georgia,serif}
#am-thanh-dai-dao .gdd-radio-item-copy{display:block;padding:10px 11px;min-width:0}
#am-thanh-dai-dao .gdd-radio-item-copy small{display:block;font:700 10px/1.5 'Be Vietnam Pro',sans-serif;color:#9b7e4e}
#am-thanh-dai-dao .gdd-radio-item-copy strong{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font:700 15px/1.45 'Noto Serif',Georgia,serif;margin:5px 0;color:#214c40}
#am-thanh-dai-dao .gdd-radio-item-copy em{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;font:400 11px/1.7 'Be Vietnam Pro',sans-serif;color:#68746a}
#am-thanh-dai-dao .gdd-radio-player-box{position:sticky;top:110px;min-width:0;background:#fffef9;border:1px solid #dbd0b8;border-radius:9px;padding:16px;box-shadow:0 8px 28px rgba(28,65,48,.07)}
#am-thanh-dai-dao .gdd-radio-cover{width:100%;height:178px;display:grid;place-items:center;object-fit:contain;border-radius:5px;background:linear-gradient(135deg,#205448,#467c6a);color:#ecd8aa;font:55px/1 Georgia,serif}
#am-thanh-dai-dao .gdd-radio-player-box h3{font:700 19px/1.5 'Noto Serif',Georgia,serif;color:#214e42;margin:10px 0}
#am-thanh-dai-dao .gdd-radio-player-box p{font:400 11px/1.8 'Be Vietnam Pro',sans-serif;color:#68756c}
#am-thanh-dai-dao .gdd-radio-player-box audio{width:100%;height:51px;margin:10px 0}
#am-thanh-dai-dao .gdd-radio-transport{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:2px 0 11px}
#am-thanh-dai-dao .gdd-radio-transport button{display:flex;align-items:center;justify-content:center;gap:5px;min-width:0;min-height:39px;padding:7px 4px;border:1px solid #c9bb98;border-radius:6px;background:#fcfaf2;color:#235245;cursor:pointer;font:700 10px/1.35 'Be Vietnam Pro',Arial,sans-serif;white-space:normal;text-align:center}
#am-thanh-dai-dao .gdd-radio-transport button span{font-size:16px;line-height:1}
#am-thanh-dai-dao .gdd-radio-transport button[aria-pressed="true"]{background:#1f584a;color:#fff;border-color:#1f584a}
#am-thanh-dai-dao .gdd-radio-transport button:disabled{opacity:.40;cursor:not-allowed}
#am-thanh-dai-dao .gdd-radio-transport button:not(:disabled):active{transform:translateY(1px)}
@media(max-width:380px){#am-thanh-dai-dao .gdd-radio-transport button{font-size:9px;gap:3px;padding:6px 2px}}

#am-thanh-dai-dao .gdd-radio-status{color:#6a776d;font:500 11px/1.7 'Be Vietnam Pro',sans-serif}
#am-thanh-dai-dao .gdd-radio-more{margin-top:14px;padding:10px 13px;border:1px solid #b9a275;background:#fffdf8;color:#225348;border-radius:5px;cursor:pointer;font-weight:700}
#am-thanh-dai-dao .gdd-radio-source{color:#2a604e;overflow-wrap:anywhere;font-size:11px}
#am-thanh-dai-dao button:focus-visible{outline:3px solid #bd9964;outline-offset:2px}
.gdd-radio-admin-nav{margin:12px 0}
.gdd-radio-admin-nav button,#gdd-radio-admin .gdd-radio-actions button{border:1px solid #245448;background:#245448;color:white;padding:9px 13px;border-radius:5px;font:700 11px/1.4 'Be Vietnam Pro',sans-serif;cursor:pointer}
#gdd-radio-admin{padding:18px;margin-bottom:25px;background:#fffdf8;border:1px solid #dcd5c5;border-radius:7px}
#gdd-radio-admin[hidden]{display:none!important}
#gdd-radio-admin h3{font:700 19px/1.5 'Noto Serif',Georgia,serif;color:#245346}
#gdd-radio-admin form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
#gdd-radio-admin label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:600;color:#496154;min-width:0}
#gdd-radio-admin .gdd-radio-full{grid-column:1/-1}
#gdd-radio-admin :is(input,textarea,select){min-width:0;width:100%;padding:9px 11px;border:1px solid #cbcbbf;border-radius:4px;background:white;color:#284538;font:400 12px/1.55 'Be Vietnam Pro',sans-serif}
#gdd-radio-admin textarea{min-height:94px;resize:vertical}
#gdd-radio-admin .gdd-radio-check{flex-direction:row;align-items:center;gap:8px}
#gdd-radio-admin .gdd-radio-check input{width:auto}
#gdd-radio-admin .gdd-radio-actions{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}
#gdd-radio-admin .gdd-radio-actions button:last-child,#gdd-radio-admin .gdd-radio-admin-row button{background:#fffdf8;color:#245448}
#gdd-radio-admin .gdd-radio-note{font:400 11px/1.7 'Be Vietnam Pro',sans-serif;color:#788176}
#gdd-radio-admin .gdd-radio-admin-row{display:flex;gap:10px;align-items:center;justify-content:space-between;border-top:1px solid #e1ddce;padding:12px 0;font-size:12px}
#gdd-radio-admin .gdd-radio-admin-row strong{display:block;color:#245448}
#gdd-radio-admin .gdd-radio-admin-row button{padding:8px 11px;border:1px solid #245448;border-radius:5px;cursor:pointer}
#admin-editor-area.gdd-radio-mode>.editor-heading,#admin-editor-area.gdd-radio-mode>#editor-form,#admin-editor-area.gdd-radio-mode>.editor-items,#admin-editor-area.gdd-radio-mode>.incoming-submissions,#admin-editor-area.gdd-radio-mode>.gdd-memorial-admin-link{display:none!important}
@media(max-width:780px){#am-thanh-dai-dao .gdd-radio-layout{grid-template-columns:1fr}#am-thanh-dai-dao .gdd-radio-player-box{position:static;order:-1}#am-thanh-dai-dao .gdd-radio-cover{height:145px}}
@media(max-width:520px){#am-thanh-dai-dao .gdd-radio-item{grid-template-columns:77px minmax(0,1fr)}#am-thanh-dai-dao .gdd-radio-art{width:77px;min-height:110px}#am-thanh-dai-dao .gdd-radio-item-copy strong{font-size:13px}#gdd-radio-admin form{grid-template-columns:1fr}}
`;
document.head.append(style);
const video=$('#video-dao-su'),nav=$('#main-nav');
if(!video||!nav)return;
const section=document.createElement('section');section.id='am-thanh-dai-dao';section.className='section section-anchor';
section.innerHTML=`
 <div class="wrap">
  <div class="gdd-radio-kicker">THÁNH ÂM · GIỌNG NÓI · KÝ ỨC CỬA ĐẠO</div>
  <h2>Âm Thanh <em>Đại Đạo</em></h2>
  <p class="gdd-radio-lead">Nơi lưu giữ những bản niệm danh hiệu, chương trình Radio Đạo Sử và bài thuyết minh để quí Huynh Tỷ Đệ Muội cùng nghe và tìm hiểu nền Đại Đạo.</p>
  <div class="gdd-radio-tabs" role="group" aria-label="Lọc chuyên mục âm thanh">
   <button type="button" data-gdd-radio-filter="all" aria-pressed="true">Tất cả</button>
   <button type="button" data-gdd-radio-filter="niem-danh" aria-pressed="false">Niệm danh hiệu</button>
   <button type="button" data-gdd-radio-filter="radio-dao-su" aria-pressed="false">Radio Đạo Sử</button>
   <button type="button" data-gdd-radio-filter="thuyet-minh" aria-pressed="false">Bài thuyết minh</button>
  </div>
  <div class="gdd-radio-layout">
   <div>
    <div id="gdd-radio-list" class="gdd-radio-list" aria-live="polite"><p>Đang tải chương trình…</p></div>
    <button type="button" class="gdd-radio-more" id="gdd-radio-more" hidden>Xem thêm số Radio</button>
    <p id="gdd-radio-list-status" class="gdd-radio-status" role="status"></p>
   </div>
   <div id="gdd-radio-player-box" class="gdd-radio-player-box">
    <div id="gdd-radio-cover" class="gdd-radio-cover" aria-hidden="true">♫</div>
    <small id="gdd-radio-kind-label" class="gdd-radio-kicker">ĐANG CHỌN CHƯƠNG TRÌNH</small>
    <h3 id="gdd-radio-title">Mời chọn một chương trình</h3>
    <p id="gdd-radio-summary">Chạm vào tên số Radio hoặc bản niệm muốn nghe.</p>
    <audio id="gdd-radio-audio" controls preload="none" aria-label="Trình nghe Âm Thanh Đại Đạo"></audio>
    <div class="gdd-radio-transport" role="group" aria-label="Điều khiển chuyển bài và lặp lại">
      <button type="button" id="gdd-radio-previous" aria-label="Nghe bài trước" title="Nghe bài trước" disabled><span aria-hidden="true">⏮</span> Bài trước</button>
      <button type="button" id="gdd-radio-next" aria-label="Nghe bài tiếp theo" title="Nghe bài tiếp theo" disabled>Bài tiếp <span aria-hidden="true">⏭</span></button>
      <button type="button" id="gdd-radio-repeat-one" aria-label="Lặp lại bài đang nghe" aria-pressed="false" title="Lặp lại bài đang nghe"><span aria-hidden="true">↻</span> Lặp bài</button>
    </div>
    <p id="gdd-radio-play-status" class="gdd-radio-status" role="status" aria-live="polite"></p>
    <div id="gdd-radio-description"></div>
   </div>
  </div>
 </div>`;
video.insertAdjacentElement('afterend',section);
const link=document.createElement('a');link.href='#am-thanh-dai-dao';link.dataset.nav='am-thanh-dai-dao';link.textContent='Âm Thanh Đại Đạo';
const videolink=$('#main-nav a[href="#video-dao-su"]');videolink?.insertAdjacentElement('afterend',link);
link.addEventListener('click',()=>{nav.classList.remove('is-open');$('#menu-toggle')?.setAttribute('aria-expanded','false')});
let clientPromise;
function getClient(){
 if(!clientPromise)clientPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
   .then(m=>m.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey));
 return clientPromise;
}
const state={category:'all',rows:[],page:0,fetching:false,refreshPending:false,selected:null,adminRows:[],adminPage:0,adminLoading:false,editing:null};
const player=$('#gdd-radio-audio'),list=$('#gdd-radio-list'),listStatus=$('#gdd-radio-list-status'),playStatus=$('#gdd-radio-play-status'),more=$('#gdd-radio-more');
const previous=$('#gdd-radio-previous'),next=$('#gdd-radio-next'),repeatOne=$('#gdd-radio-repeat-one');
const REPEAT_KEY='gdd-radio-repeat-one-v1';
let repeatEnabled=false;
try{repeatEnabled=localStorage.getItem(REPEAT_KEY)==='on'}catch{}
player.loop=repeatEnabled;
repeatOne.setAttribute('aria-pressed',String(repeatEnabled));
function syncControls(){
 const current=state.rows.findIndex(r=>r.id===state.selected?.id);
 const canChange=state.rows.length>1&&current>=0;
 previous.disabled=!canChange;next.disabled=!canChange;
 repeatOne.setAttribute('aria-pressed',String(repeatEnabled));
 repeatOne.title=repeatEnabled?'Đang bật lặp lại bài này — chạm để tắt':'Chạm để lặp lại bài đang nghe';
}
const progressKey=id=>'gdd-radio-position-'+id;
const progressFor=id=>{try{return Number(localStorage.getItem(progressKey(id)))||0}catch{return 0}};
function saveProgress(){
 if(!state.selected||!Number.isFinite(player.currentTime))return;
 try{localStorage.setItem(progressKey(state.selected.id),String(Math.floor(player.currentTime)))}catch{}
}
function itemHTML(row){
 const cover=safe(row.cover_url),name=esc(row.title);
 return '<button class="gdd-radio-item" type="button" data-gdd-radio-play="'+esc(row.id)+'" data-active="'+(state.selected?.id===row.id)+'">'+
 (cover?'<img class="gdd-radio-art" src="'+esc(cover)+'" loading="lazy" alt="Ảnh bìa '+name+'">':'<span class="gdd-radio-art" aria-hidden="true">♫</span>')+
 '<span class="gdd-radio-item-copy"><small>'+esc([names[row.category],row.episode_number?'Số '+row.episode_number:'',date(row.published_date)].filter(Boolean).join(' · '))+
 '</small><strong>'+name+'</strong><em>'+esc(row.summary||'Chạm để nghe chương trình.')+'</em></span></button>';
}
function renderList(){
 list.innerHTML=state.rows.length?state.rows.map(itemHTML).join(''):'<p class="gdd-radio-status">Chưa có chương trình công khai trong chuyên mục này.</p>';
 syncControls();
}
function selectProgram(row,autoplay=false){
 if(!row)return;
 const changed=state.selected?.id!==row.id;
 if(changed){
  saveProgress();player.pause();state.selected=row;
  const url=safe(row.audio_url);
  if(!url){playStatus.textContent='Không có đường dẫn MP3 hợp lệ.';return}
  player.src=url;player.load();
  const saved=progressFor(row.id);
  player.addEventListener('loadedmetadata',()=>{
   if(state.selected?.id===row.id&&saved>10&&Number.isFinite(player.duration)&&saved<player.duration-15)
    try{player.currentTime=saved;playStatus.textContent='Nghe tiếp từ '+Math.floor(saved/60)+' phút.'}catch{}
  },{once:true});
 }
 const cover=$('#gdd-radio-cover');
 cover.outerHTML=safe(row.cover_url)?
  '<img id="gdd-radio-cover" class="gdd-radio-cover" src="'+esc(safe(row.cover_url))+'" alt="Ảnh bìa '+esc(row.title)+'">':
  '<div id="gdd-radio-cover" class="gdd-radio-cover" aria-hidden="true">♫</div>';
 $('#gdd-radio-kind-label').textContent=names[row.category]||'Âm Thanh Đại Đạo';
 $('#gdd-radio-title').textContent=row.title;
 $('#gdd-radio-summary').textContent=row.summary||'';
 const detail=$('#gdd-radio-description');detail.replaceChildren();
 const line=document.createElement('p');line.textContent=[row.episode_number?'Số '+row.episode_number:'',date(row.published_date)].filter(Boolean).join(' · ');detail.append(line);
 if(row.body){const p=document.createElement('p');p.textContent=row.body;detail.append(p)}
 if(safe(row.audio_url)){const a=document.createElement('a');a.className='gdd-radio-source';a.href=safe(row.audio_url);a.target='_blank';a.rel='noopener noreferrer';a.textContent='Mở file âm thanh gốc ↗';detail.append(a)}
 renderList();
 if(autoplay){playStatus.textContent='Đang mở chương trình…';player.play().catch(()=>{playStatus.textContent='Chạm ▶ trong trình phát để nghe.'})}
}
async function fetchPublic(reset=true){
 if(state.fetching){if(reset)state.refreshPending=true;return;}
 state.fetching=true;more.disabled=true;
 const requestedCategory=state.category;
 if(reset){state.page=0;state.rows=[];list.textContent='Đang tải danh sách…'}
 try{
  const supa=await getClient(),size=24,offset=state.page*size;
  let query=supa.from(TABLE).select('*').eq('published',true);
  if(requestedCategory!=='all')query=query.eq('category',requestedCategory);
  const {data,error}=await query.order('published_at',{ascending:false,nullsFirst:false})
    .order('created_at',{ascending:false}).range(offset,offset+size-1);
  if(error)throw error;
  if(state.category!==requestedCategory){state.refreshPending=true;return}
  state.rows.push(...(data||[]));state.page++;more.hidden=(data||[]).length<size;
  renderList();listStatus.textContent='';
  if(reset){
   // The visible playlist and the selected song should stay in sync after filtering.
   if(state.rows.length&&!state.rows.some(r=>r.id===state.selected?.id))selectProgram(state.rows[0],false);
   else if(!state.rows.length){
    saveProgress();player.pause();player.removeAttribute('src');player.load();state.selected=null;
    $('#gdd-radio-title').textContent='Chưa có chương trình trong mục này';
    $('#gdd-radio-summary').textContent='Xin chọn chuyên mục khác để nghe.';
    playStatus.textContent='';syncControls();
   }
  }
 }catch(e){listStatus.textContent='Không thể tải kho âm thanh: '+(e.message||e);if(reset)list.textContent='Chưa tải được kho âm thanh.'}
 finally{
  state.fetching=false;more.disabled=false;
  if(state.refreshPending){state.refreshPending=false;fetchPublic(true)}
 }
}
section.addEventListener('click',e=>{
 const filter=e.target.closest('[data-gdd-radio-filter]');
 if(filter){state.category=filter.dataset.gddRadioFilter;section.querySelectorAll('[data-gdd-radio-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===filter)));fetchPublic(true);return}
 const item=e.target.closest('[data-gdd-radio-play]');
 if(item){const row=state.rows.find(r=>r.id===item.dataset.gddRadioPlay);if(row)selectProgram(row,true)}
});
more.addEventListener('click',()=>fetchPublic(false));
function stepTrack(direction){
 if(state.rows.length<2)return;
 const i=state.rows.findIndex(r=>r.id===state.selected?.id);
 if(i<0)return;
 const chosen=state.rows[(i+direction+state.rows.length)%state.rows.length];
 if(chosen)selectProgram(chosen,true);
}
previous.addEventListener('click',()=>stepTrack(-1));
next.addEventListener('click',()=>stepTrack(1));
repeatOne.addEventListener('click',()=>{
 repeatEnabled=!repeatEnabled;player.loop=repeatEnabled;
 try{localStorage.setItem(REPEAT_KEY,repeatEnabled?'on':'off')}catch{}
 syncControls();
 playStatus.textContent=repeatEnabled?
  'Đã bật lặp lại: bài đang nghe sẽ tự phát lại từ đầu.':
  'Đã tắt lặp lại bài.';
});
let lastProgress=0;
player.addEventListener('timeupdate',()=>{if(Date.now()-lastProgress>5000){lastProgress=Date.now();saveProgress()}});
player.addEventListener('pause',saveProgress);
player.addEventListener('ended',()=>{try{if(state.selected)localStorage.removeItem(progressKey(state.selected.id))}catch{};playStatus.textContent='Đã nghe hết số phát thanh.'});
player.addEventListener('play',()=>{
 document.dispatchEvent(new Event('gdd:radio-play'));
 playStatus.textContent='Đang nghe '+(state.selected?.title||'Âm Thanh Đại Đạo');
});
player.addEventListener('error',()=>{playStatus.textContent='Không mở được MP3. Vui lòng kiểm tra kết nối Internet.'});
document.addEventListener('gdd:chant-play',()=>{if(!player.paused)player.pause()});
document.addEventListener('play',e=>{if(e.target instanceof HTMLVideoElement&&!player.paused)player.pause()},true);
document.addEventListener('click',e=>{if(e.target.closest?.('[data-video-play],[data-open-kind="videos"]')&&!player.paused)player.pause()},true);
fetchPublic();
const admin=$('#admin-editor-area'),tabs=admin?.querySelector('.editor-tabs');
if(!admin||!tabs)return;
const navAdmin=document.createElement('div');navAdmin.className='gdd-radio-admin-nav';
const toggle=document.createElement('button');toggle.type='button';toggle.textContent='♫ Quản lý Âm Thanh Đại Đạo';navAdmin.append(toggle);tabs.insertAdjacentElement('afterend',navAdmin);
const panel=document.createElement('section');panel.id='gdd-radio-admin';panel.hidden=true;
panel.innerHTML=`
<h3>Đăng số Radio và tư liệu âm thanh</h3>
<p class="gdd-radio-note">Tải MP3 tối đa 45 MB. Có thể kèm ảnh bìa, số phát hành, ngày, lời giới thiệu. Chương trình chưa công bố sẽ không hiển thị với người đọc.</p>
<form id="gdd-radio-form">
 <label class="gdd-radio-full">Tiêu đề chương trình *<input name="title" maxlength="240" required placeholder="Radio Đạo Sử – Số 01"></label>
 <label>Loại chương trình <select name="category"><option value="radio-dao-su">Radio Đạo Sử</option><option value="niem-danh">Niệm danh hiệu</option><option value="thuyet-minh">Bài thuyết minh</option></select></label>
 <label>Số phát thanh<input name="episode_number" type="number" min="1" step="1"></label>
 <label>Ngày phát hành<input name="published_date" type="date"></label>
 <label>Ảnh bìa (ảnh lớn tự tối ưu dưới 6 MB)<input name="cover_file" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"></label>
 <label class="gdd-radio-full">Hoặc đường dẫn ảnh bìa<input name="cover_url" type="url" placeholder="https://..."></label>
 <label class="gdd-radio-full">Tệp MP3 (tối đa 45 MB)<input name="audio_file" type="file" accept="audio/mpeg,.mp3"></label>
 <p class="gdd-radio-full gdd-radio-note">Khi sửa số Radio đã đăng, không cần chọn lại MP3. Tệp trên 6 MB sẽ tải theo từng phần để hạn chế mất mạng.</p>
 <label class="gdd-radio-full">Lời giới thiệu ngắn<textarea name="summary" maxlength="2000"></textarea></label>
 <label class="gdd-radio-full">Nội dung / lời dẫn / xuất xứ tư liệu<textarea name="body"></textarea></label>
 <label class="gdd-radio-full gdd-radio-check"><input name="published" type="checkbox"> Công bố trên website</label>
 <div class="gdd-radio-full gdd-radio-actions"><button id="gdd-radio-save" type="submit">Đăng chương trình mới</button><button id="gdd-radio-new" type="button">+ Tạo số mới</button></div>
 <p class="gdd-radio-full gdd-radio-note" id="gdd-radio-admin-status" role="status" aria-live="polite"></p>
</form>
<div><h3>Các chương trình đã lưu</h3><div id="gdd-radio-admin-rows"></div><button type="button" id="gdd-radio-admin-more" hidden>Xem thêm</button></div>`;
navAdmin.insertAdjacentElement('afterend',panel);
const form=$('#gdd-radio-form'),notice=$('#gdd-radio-admin-status'),saveButton=$('#gdd-radio-save'),adminList=$('#gdd-radio-admin-rows'),adminMore=$('#gdd-radio-admin-more');
const say=message=>notice.textContent=message;
function switchMode(on){
 admin.classList.toggle('gdd-radio-mode',on);panel.hidden=!on;toggle.setAttribute('aria-pressed',String(on));
 if(on){admin.classList.remove('gdd-memorial-mode');const mem=$('#gdd-memorial-admin');if(mem)mem.hidden=true;$('.gdd-memorial-admin-link button')?.classList.remove('gdd-active')}
}
function resetForm(){state.editing=null;form.reset();saveButton.textContent='Đăng chương trình mới';say('')}
async function verified(){
 if(admin.hidden)throw Error('Hãy đăng nhập trang quản trị.');
 const supa=await getClient(),{data:{user},error}=await supa.auth.getUser();
 if(error||!user)throw Error('Phiên đăng nhập quản trị hết hạn.');
 const check=await supa.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
 if(check.error||!check.data)throw Error('Tài khoản không có quyền quản trị.');
 return supa;
}
async function fetchAdmin(reset=true){
 if(state.adminLoading)return;
 state.adminLoading=true;
 if(reset){state.adminRows=[];state.adminPage=0;adminList.replaceChildren()}
 try{
  const supa=await verified(),count=30,offset=state.adminPage*count;
  const {data,error}=await supa.from(TABLE).select('*').order('created_at',{ascending:false}).range(offset,offset+count-1);
  if(error)throw error;
  const rows=data||[];state.adminRows.push(...rows);state.adminPage++;
  adminMore.hidden=rows.length<count;
  adminList.innerHTML=state.adminRows.length?state.adminRows.map(r=>'<div class="gdd-radio-admin-row"><div><strong>'+esc(r.title)+'</strong><small>'+esc(names[r.category])+' · '+(r.published?'Đã công bố':'Bản nháp')+'</small></div><button type="button" data-gdd-radio-edit="'+esc(r.id)+'">Sửa</button></div>').join(''):'<p>Chưa có chương trình.</p>';
 }catch(e){say('Chưa đọc được chương trình: '+(e.message||e))}
 finally{state.adminLoading=false}
}
function edit(id){
 const row=state.adminRows.find(r=>r.id===id);if(!row)return;
 resetForm();state.editing=id;
 for(const key of ['title','category','episode_number','published_date','cover_url','summary','body'])form.elements[key].value=row[key]??'';
 form.elements.published.checked=!!row.published;saveButton.textContent='Lưu thay đổi';
 say('Đang chỉnh sửa: '+row.title);form.scrollIntoView({behavior:'smooth',block:'start'});
}
toggle.addEventListener('click',async()=>{
 if(admin.hidden)return;switchMode(true);resetForm();say('Đang xác nhận quyền quản trị…');
 try{await verified();say('');await fetchAdmin(true)}catch(e){say(e.message)}
});
tabs.addEventListener('click',e=>{if(e.target.closest('button'))switchMode(false)});
admin.addEventListener('click',e=>{if(e.target.closest('.gdd-memorial-admin-link button'))switchMode(false)});
new MutationObserver(()=>{if(admin.hidden){switchMode(false);resetForm()}}).observe(admin,{attributes:true,attributeFilter:['hidden']});
$('#gdd-radio-new').addEventListener('click',resetForm);
adminMore.addEventListener('click',()=>fetchAdmin(false));
adminList.addEventListener('click',e=>{const b=e.target.closest('[data-gdd-radio-edit]');if(b)edit(b.dataset.gddRadioEdit)});
async function uploadMP3(supa,file){
 if(!/\.mp3$/i.test(file.name||'')||(file.type&&!['audio/mpeg','audio/mp3','application/octet-stream'].includes(file.type)))throw Error('Chỉ hỗ trợ tệp MP3.');
 if(!file.size||file.size>45*1024*1024)throw Error('MP3 phải từ 1 byte đến 45 MB.');
 const path='radio/'+Date.now()+'-'+Math.random().toString(36).slice(2,12)+'.mp3';
 const storage=supa.storage.from(BUCKET);
 if(file.size<=6*1024*1024){
  const {error}=await storage.upload(path,file,{contentType:'audio/mpeg',cacheControl:'3600',upsert:false});
  if(error)throw error;
 }else{
  const {data:{session}}=await supa.auth.getSession();
  if(!session?.access_token)throw Error('Phiên đăng nhập đã hết hạn.');
  const {Upload}=await import('https://cdn.jsdelivr.net/npm/tus-js-client@4/+esm');
  const endpoint=new URL(cfg.supabaseUrl);endpoint.hostname=endpoint.hostname.replace(/\.supabase\.co$/i,'.storage.supabase.co');
  endpoint.pathname='/storage/v1/upload/resumable';endpoint.search='';
  await new Promise((resolve,reject)=>{
   const upload=new Upload(file,{
    endpoint:endpoint.href,chunkSize:6*1024*1024,retryDelays:[0,3000,5000,10000,20000],
    uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,
    headers:{authorization:'Bearer '+session.access_token},
    metadata:{bucketName:BUCKET,objectName:path,contentType:'audio/mpeg',cacheControl:'3600'},
    onError:reject,onSuccess:resolve,onProgress:(sent,total)=>say('Đang tải MP3: '+Math.round(sent/total*100)+'% – đừng đóng trang.')
   });upload.start();
  });
 }
 return storage.getPublicUrl(path).data.publicUrl;
}
async function uploadImage(supa,file){
 if(!file)return '';
 const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
 if(!window.GDDImageOptimizer?.detectType(file))throw Error('Ảnh bìa chỉ nhận JPEG, PNG, WebP hoặc HEIC tương thích.');
 const ready=(await window.GDDImageOptimizer.prepare(file,{onProgress:say})).file;
 const path='radio/'+Date.now()+'-'+Math.random().toString(36).slice(2,12)+'.'+types[ready.type];
 const storage=supa.storage.from('dao-su-images');
 const {error}=await storage.upload(path,ready,{contentType:ready.type,upsert:false,cacheControl:'3600'});
 if(error)throw error;
 return storage.getPublicUrl(path).data.publicUrl;
}
form.addEventListener('submit',async e=>{
 e.preventDefault();saveButton.disabled=true;
 try{
  const supa=await verified(),title=form.elements.title.value.trim(),category=form.elements.category.value;
  if(!title||!names[category])throw Error('Chưa nhập tiêu đề hoặc chuyên mục.');
  const previous=state.adminRows.find(r=>r.id===state.editing)||null;
  const track=form.elements.audio_file.files?.[0],picture=form.elements.cover_file.files?.[0];
  if(!previous&&!track)throw Error('Chọn MP3 trước khi đăng chương trình mới.');
  const episode=form.elements.episode_number.value.trim();
  if(episode&&(!Number.isSafeInteger(Number(episode))||Number(episode)<1))throw Error('Số Radio phải là số nguyên dương.');
  let audio_url=previous?.audio_url||'';
  if(track){say('Đang tải MP3 lên kho riêng…');audio_url=await uploadMP3(supa,track)}
  let cover_url=safe(form.elements.cover_url.value);
  if(picture){say('Đang lưu ảnh bìa…');cover_url=await uploadImage(supa,picture)}
  if(!audio_url)throw Error('Chưa có tệp âm thanh.');
  const published=form.elements.published.checked,now=new Date().toISOString();
  const values={
   category,title,summary:form.elements.summary.value.trim()||null,
   body:form.elements.body.value.trim()||null,audio_url,cover_url:cover_url||null,
   published_date:form.elements.published_date.value||null,
   episode_number:episode?Number(episode):null,published,
   published_at:published?(previous?.published_at||now):null,updated_at:now
  };
  if(!previous)values.slug=slug(title)+'-'+Date.now().toString(36);
  const cmd=previous?supa.from(TABLE).update(values).eq('id',previous.id):supa.from(TABLE).insert(values);
  const {data,error}=await cmd.select('id').single();
  if(error)throw error;
  state.editing=data.id;say('Đã lưu chương trình thành công.');
  await fetchAdmin(true);await fetchPublic(true);
  if(state.editing)edit(state.editing);
 }catch(e){say('Chưa lưu được: '+(e.message||e))}
 finally{saveButton.disabled=false}
});
})();