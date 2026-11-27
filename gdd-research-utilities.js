(()=>{'use strict';
if(window.__GDDResearchUtilities)return;window.__GDDResearchUtilities=true;
const endpoint='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/research-utilities';
const config=[['quote','THÁNH NGÔN MỖI NGÀY','LỜI ĐẠO MỖI NGÀY'],['history','NGÀY NÀY NĂM XƯA','DẤU ẤN ĐẠO SỬ'],['featured','TƯ LIỆU NỔI BẬT','GÓC VĂN KHỐ']];
const make=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=value||'';return n};
const style=document.createElement('style');style.textContent='#gdd-research-public{display:grid;gap:12px;min-width:0}#gdd-research-public[hidden]{display:none!important}.gdd-research-card{background:#fffdf8;border:1px solid #ddd4bf;border-radius:10px;padding:14px;min-width:0;overflow-wrap:anywhere}.gdd-research-card .gdd-research-kicker{font:600 10px/1.5 system-ui;letter-spacing:.12em;color:#94794d}.gdd-research-card h3{font:700 16px/1.5 Georgia,serif;color:#194b42;margin:4px 0 10px}.gdd-research-card blockquote{margin:8px 0;padding:10px 0 10px 12px;border-left:2px solid #b6a176;white-space:pre-wrap;color:#244c40;font:15px/1.75 Georgia,serif;max-height:20em;overflow:auto}.gdd-research-card strong{display:block;font:600 13px/1.6 system-ui;color:#244c40}.gdd-research-card small{display:block;color:#806d4e;font:11px/1.6 system-ui;margin-top:6px}.gdd-research-card a{display:inline-block;margin-top:10px;font:600 12px/1.5 system-ui;color:#194b42;text-decoration:underline}.gdd-research-card .gdd-research-title{font:600 14px/1.5 Georgia,serif;color:#194b42;margin:0}';document.head.append(style);style.textContent+='#gdd-tu-thoi{text-align:center;background:linear-gradient(150deg,#fffdf8,#f4eedf)}#gdd-tu-thoi h3{margin-bottom:8px}.gdd-clock-time{font:600 clamp(29px,4vw,40px)/1.2 Georgia,serif;font-variant-numeric:tabular-nums;color:#194b42}.gdd-clock-next{font-weight:600;color:#194b42;font-size:13px;margin-top:12px}.gdd-clock-count{font:600 22px/1.5 Georgia,serif;font-variant-numeric:tabular-nums;color:#94794d}.gdd-clock-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;margin-top:10px}.gdd-clock-slot{padding:7px 2px;border:1px solid #ddd4bf;border-radius:6px;background:#fffdf8}.gdd-clock-slot.is-next{border-color:#a48758;background:#e8eee5}.gdd-clock-slot small{margin:2px 0 0;font-variant-numeric:tabular-nums}.gdd-research-card .gdd-archive-summary{font-size:12px;line-height:1.6;color:#425c4f}';
function today(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day}
function safeLink(v){try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}}
// Only exact, unambiguous document dates. Never use upload dates as historical dates.
function documentAnniversary(value,now,lunar){
 const s=String(value||'').trim().normalize('NFC');
 const a=s.match(/^(?:ngày\s+)?(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](\d{4}))?\s*(?:ÂL|AL|âm lịch|âm)\s*$/i);
 if(a){const d=Number(a[1]),m=Number(a[2]);return d>=1&&d<=30&&m>=1&&m<=12&&lunar&&!lunar.leap&&d===lunar.day&&m===lunar.month?'âm lịch':null}
 const iso=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
 const dl=s.match(/^(?:ngày\s+)?(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\s*(?:DL|D\.L\.|dương lịch|dương)$/i);
 if(!iso&&!dl)return null;
 const y=Number(iso?iso[1]:dl[3]),m=Number(iso?iso[2]:dl[2]),d=Number(iso?iso[3]:dl[1]);
 const date=new Date(Date.UTC(y,m-1,d));
 if(y<1800||y>Number(now.slice(0,4))||date.getUTCFullYear()!==y||date.getUTCMonth()+1!==m||date.getUTCDate()!==d)return null;
 return String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0')===now.slice(5)&&y<Number(now.slice(0,4))?'dương lịch':null;
}
// A plain-text excerpt from the published record, never generated commentary.
function clipArchiveText(value,limit=240){
 const s=String(value||'').replace(/\s+/g,' ').trim();
 if(s.length<=limit)return s;
 const cut=s.slice(0,limit+1),space=cut.lastIndexOf(' ');
 return cut.slice(0,space>limit/2?space:limit).replace(/[ ,;:]+$/,'')+'…';
}
function archiveExcerpt(record){
 for(const source of [record.summary,record.body]){
  if(!source)continue;
  const doc=new DOMParser().parseFromString(String(source),'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,nav,figure,table,svg,template,form,button,video,audio').forEach(n=>n.remove());
  const paragraphs=[...doc.querySelectorAll('p,li,blockquote')].map(n=>n.textContent.trim()).filter(Boolean);
  const raw=doc.body.textContent||'';
  const text=(paragraphs.find(s=>s.length>=45&&!/^(?:nhan đề|số hiệu văn kiện|ngày văn kiện|nguồn|xuất xứ)\s*:/i.test(s))||raw).replace(/^\s*(?:nội dung tóm tắt|nội dung|tóm tắt|giới thiệu)\s*:\s*/i,'').trim();
  if(text.length>=24)return clipArchiveText(text);
 }
 return '';
}
function archiveItem(r,kind){
 if(r?.published!==true||!r.slug||!r.title)return null;
 const prefix=kind==='documents'?'tai-lieu-so-hoa':'bai-viet';
 return {id:kind+':'+r.id,title:String(r.title),excerpt:archiveExcerpt(r),citation:kind==='documents'?'Kho Số Hóa · Dấu Xưa Cửa Đạo':'Kho Biên Khảo · Dấu Xưa Cửa Đạo',source_url:location.origin+'/#'+prefix+'/'+encodeURIComponent(r.slug),source_date:kind==='documents'?String(r.document_date||''):'',archiveKind:kind};
}
function clockParts(now){
 const s=(now.getUTCHours()*3600+now.getUTCMinutes()*60+now.getUTCSeconds()+7*3600)%86400;
 const remaining=21600-s%21600,slot=Math.floor(s/21600),next=(slot+1)%4;
 const fmt=n=>String(n).padStart(2,'0'),time=n=>fmt(Math.floor(n/3600))+':'+fmt(Math.floor(n/60)%60)+':'+fmt(n%60);
 return {slot,next,remaining,now:time(s),countdown:time(remaining)};
}
style.textContent+='.gdd-daily-quote{text-align:center;background:#fffdf8;padding:18px 14px}.gdd-daily-quote h3{letter-spacing:.045em;margin:0 0 12px;font-size:16px}.gdd-daily-quote blockquote{border-left:0;border-top:1px solid #ddd4bf;border-bottom:1px solid #ddd4bf;margin:10px 0 13px;padding:14px 4px;font:16px/1.85 Georgia,serif;color:#194b42;max-height:none;overflow:visible}.gdd-daily-quote .gdd-quote-speaker{font:700 14px/1.6 Georgia,serif;color:#194b42}.gdd-daily-quote .gdd-quote-date{font:12px/1.6 Georgia,serif;color:#806d4e;white-space:pre-wrap}';
let clockTimer;
function mountClock(){
 const aside=document.getElementById('gdd-p1-aside');if(!aside||document.getElementById('gdd-tu-thoi'))return;
 const card=make('section','gdd-research-card');card.id='gdd-tu-thoi';
 cardHeader(card,'clock','ĐỒNG HỒ TỨ THỜI','GIỜ CÚNG HẰNG NGÀY');
 const time=make('div','gdd-clock-time'),next=make('div','gdd-clock-next'),remaining=make('div','gdd-clock-count'),grid=make('div','gdd-clock-grid');
 const names=['Tý','Mẹo','Ngọ','Dậu'],hours=['00:00','06:00','12:00','18:00'];
 const tiles=names.map((name,i)=>{const n=make('div','gdd-clock-slot');n.append(make('strong','',name),make('small','',hours[i]));grid.append(n);return n});
 card.append(time,make('small','','Giờ Việt Nam (UTC+7)'),next,remaining,grid,make('small','','Mốc cúng thường lệ; giờ hành lễ đặc biệt theo thông báo Hội Thánh.'));
 const anchor=document.getElementById('gdd-p1-calendar-panel')||aside.querySelector('.gdd-p1-side-intro');if(anchor)anchor.after(card);else aside.prepend(card);
 const tick=()=>{const p=clockParts(new Date());time.textContent=p.now;next.textContent='Thời cúng kế tiếp: '+names[p.next]+' · '+hours[p.next];remaining.textContent='Còn '+p.countdown;tiles.forEach((n,i)=>n.classList.toggle('is-next',i===p.next));};
 tick();clearInterval(clockTimer);clockTimer=setInterval(tick,1000);
}
// Public quotations use only the actual excerpt and verified attribution/date fields.
function quoteReady(r){
 const fields=[r?.excerpt,r?.speaker,r?.source_date];
 return fields.every(v=>typeof v==='string'&&v.trim())&&!/cần đối chiếu|chưa xác định|chưa rõ|không rõ|chờ duyệt|chưa kiểm chứng/i.test(r.speaker+' '+r.source_date);
}
const ornamentPaths={
 quote:'M4 5h6v6H6c0 3-1 5-3 6m11-12h6v6h-4c0 3-1 5-3 6',
 history:'M4 7a9 9 0 1 1-1 8M4 3v5H9M12 7v5l4 2',
 ritual:'M12 5C9 3 5 3 2 5v15c4-2 7-2 10 0 3-2 6-2 10 0V5c-3-2-7-2-10 0zM12 5v15M5 8l4-1m6 0 4 1M5 12l4-1m6 0 4 1',
 featured:'M4 4h11l5 5v12H4zM15 4v5h5M8 12h8M8 16h8',
 clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 6v6l4 2'
};
function ornament(kind){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');path.setAttribute('d',ornamentPaths[kind]||ornamentPaths.featured);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.35');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;
}
function cardHeader(card,kind,name,kicker){
 card.classList.add('gdd-ornate-card','gdd-ornate-'+kind);
 const header=make('div','gdd-ornate-heading'),emblem=make('span','gdd-ornate-emblem'),labels=make('div','gdd-ornate-labels');
 emblem.append(ornament(kind));if(kicker)labels.append(make('div','gdd-research-kicker',kicker));labels.append(make('h3','',name));header.append(emblem,labels);card.append(header,make('div','gdd-ornate-rule'));
}
const quoteMotifs=[
 {name:'lotus',path:'M60 23C43 23 31 15 29 7c13 1 24 6 31 16C48 12 52 5 60 1c8 4 12 11 0 22C67 13 78 8 91 7c-2 8-14 16-31 16ZM35 25h50'},
 {name:'cloud',path:'M5 19h28c9 0 10-10 3-10-5 0-6 5-2 6M115 19H87c-9 0-10-10-3-10 5 0 6 5 2 6M43 19h34M60 4l6 6-6 6-6-6z'},
 {name:'diamond',path:'M5 14h38M77 14h38M60 2l12 12-12 12-12-12zM60 8l6 6-6 6-6-6zM40 14l-4-4m4 4-4 4m44-4 4-4m-4 4 4 4'},
 {name:'scroll',path:'M6 18h32c9 0 8-12 1-12-5 0-7 7-2 8M114 18H82c-9 0-8-12-1-12 5 0 7 7 2 8M49 8h22M49 13h22M54 18h12'},
 {name:'sun',path:'M8 22h104M42 22a18 18 0 0 1 36 0M60 1v5M44 6l3 4M76 6l-3 4M35 14l4 2M85 14l-4 2'},
 {name:'floral',path:'M60 14C52 4 48 10 60 14c-12 4-8 10 0 0 8 10 12 4 0 0 12-4 8-10 0 0zM8 14h31l7-6M112 14H81l-7-6M30 14l7 7m53-7-7 7'}
];
function quoteSlot(now){return Math.floor((now.getTime()+7*3600000)/21600000)}
function quoteMotifIndex(day){return ((day%quoteMotifs.length)+quoteMotifs.length)%quoteMotifs.length}
function quoteDecoration(day){
 const motif=quoteMotifs[quoteMotifIndex(day)],ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');
 svg.setAttribute('viewBox','0 0 120 28');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('class','gdd-quote-decoration');
 path.setAttribute('d',motif.path);path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1');path.setAttribute('fill','none');path.setAttribute('stroke-linejoin','round');path.setAttribute('stroke-linecap','round');svg.append(path);return svg;
}
function renderQuote(card,row,name,day){
 card.classList.add('gdd-daily-quote','gdd-motif-'+quoteMotifs[quoteMotifIndex(day)].name);
 cardHeader(card,'quote',name,'');const rule=card.querySelector('.gdd-ornate-rule');if(rule)rule.replaceWith(quoteDecoration(day));card.append(make('blockquote','',row.excerpt),make('strong','gdd-quote-speaker',row.speaker),make('small','gdd-quote-date',row.source_date));
}
style.textContent+=`
.gdd-research-card.gdd-ornate-card{position:relative;isolation:isolate;overflow:hidden;border:1px solid #d7c9aa;border-radius:11px;background:linear-gradient(145deg,#fffdf8 65%,#f2ead9);padding:17px 15px 15px;box-shadow:0 2px 7px #3a362408}
.gdd-ornate-card:before,.gdd-ornate-card:after{content:"";position:absolute;z-index:-1;pointer-events:none;width:47px;height:47px;opacity:.48;border:1px solid #b8a16f;border-radius:50% 0 50% 0;transform:rotate(45deg)}
.gdd-ornate-card:before{right:-24px;top:-24px;box-shadow:0 0 0 5px #b8a16f22,0 0 0 10px #b8a16f12}
.gdd-ornate-card:after{left:-25px;bottom:-25px;box-shadow:0 0 0 5px #b8a16f22}
.gdd-ornate-heading{display:flex;align-items:center;gap:10px;text-align:left}
.gdd-ornate-emblem{flex:0 0 36px;height:36px;display:grid;place-items:center;color:#917444;background:#eee5d1;border:1px solid #cdb88d;border-radius:50%}
.gdd-ornate-emblem svg{width:22px;height:22px}
.gdd-ornate-labels{min-width:0}.gdd-ornate-card .gdd-ornate-heading h3{font-size:15px;line-height:1.35;margin:2px 0 0;letter-spacing:.025em}
.gdd-ornate-card .gdd-research-kicker{font-size:9px;letter-spacing:.12em}
.gdd-ornate-rule{position:relative;height:12px;margin:7px 0 9px;background:linear-gradient(#d6c6a4,#d6c6a4) left center/46% 1px no-repeat,linear-gradient(#d6c6a4,#d6c6a4) right center/46% 1px no-repeat}
.gdd-ornate-rule:after{content:"";position:absolute;top:3px;left:calc(50% - 3px);width:6px;height:6px;background:#b59a65;transform:rotate(45deg)}
.gdd-ornate-card .gdd-research-title{font-size:15px;line-height:1.55}
.gdd-ornate-card .gdd-archive-summary{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin:10px 0;font-size:13px;line-height:1.65}
.gdd-ornate-card .gdd-ornate-date{font-variant-numeric:tabular-nums;margin-top:5px}
.gdd-ornate-card .gdd-ornate-source{font-size:10px;color:#806d4e}
.gdd-ornate-card .gdd-ornate-link{display:inline-flex;align-items:center;padding:7px 11px;min-height:36px;border:1px solid #d0c09c;background:#eaf0e7;border-radius:6px;text-decoration:none;font-size:12px}
.gdd-ornate-card .gdd-ornate-link:focus-visible{outline:2px solid #194b42;outline-offset:2px}
.gdd-daily-quote .gdd-ornate-heading{justify-content:center}.gdd-daily-quote .gdd-ornate-emblem{flex-basis:30px;height:30px}.gdd-daily-quote .gdd-ornate-emblem svg{width:17px;height:17px}
.gdd-daily-quote blockquote{margin:5px 0 12px;border-top:0;border-bottom:1px solid #d6c6a4;padding:5px 3px 14px;font:italic 17px/1.85 Georgia,serif}
.gdd-daily-quote .gdd-quote-speaker{letter-spacing:.05em}
@media(max-width:600px){.gdd-research-card.gdd-ornate-card{padding:16px 15px}.gdd-ornate-card .gdd-ornate-heading h3{font-size:16px}.gdd-ornate-card .gdd-archive-summary{font-size:14px}.gdd-ornate-card .gdd-ornate-link{min-height:44px}.gdd-daily-quote blockquote{font-size:18px}}
`;
style.textContent+=`
.gdd-daily-quote .gdd-quote-decoration{display:block;width:min(170px,75%);height:36px;color:#a58b56;margin:9px auto 7px;overflow:visible}
.gdd-research-card.gdd-motif-lotus{background:linear-gradient(145deg,#fffdf7 70%,#e9eee4)}
.gdd-research-card.gdd-motif-cloud{background:linear-gradient(145deg,#fffdf8 70%,#e9edf0)}
.gdd-research-card.gdd-motif-diamond{background:linear-gradient(145deg,#fffdf8 70%,#f0e4cc)}
.gdd-research-card.gdd-motif-scroll{background:linear-gradient(145deg,#fffdf8 70%,#efe5d9);border-style:double;border-width:3px}
.gdd-research-card.gdd-motif-sun{background:linear-gradient(145deg,#fffdf8 65%,#f5ead0)}
.gdd-research-card.gdd-motif-floral{background:linear-gradient(145deg,#fffdf8 65%,#eee8db)}
.gdd-motif-cloud:before,.gdd-motif-cloud:after{border-radius:50%}
.gdd-motif-diamond:before,.gdd-motif-diamond:after{border-radius:0}
.gdd-motif-scroll:before,.gdd-motif-scroll:after{border-radius:8px}
.gdd-motif-sun:before,.gdd-motif-sun:after{border-radius:50%;box-shadow:0 0 0 4px #b8a16f22,0 0 0 9px #b8a16f14,0 0 0 14px #b8a16f0b}
.gdd-motif-floral:before,.gdd-motif-floral:after{border-radius:40% 0 40% 0}
`;
let busy=false,last=0;
async function refresh(){
 const aside=document.getElementById('gdd-p1-aside');if(!aside||busy)return;
 let root=document.getElementById('gdd-research-public');if(!root){root=make('div');root.id='gdd-research-public';root.hidden=true;aside.append(root)}
 let quoteRoot=document.getElementById('gdd-daily-quote-slot');if(!quoteRoot){quoteRoot=make('div');quoteRoot.id='gdd-daily-quote-slot';quoteRoot.hidden=true;aside.append(quoteRoot)}
 window.dispatchEvent(new Event('gdd:utility-mounted'));
 busy=true;
 try{
 const [research,archive]=await Promise.allSettled([
 fetch(endpoint,{cache:'no-store',credentials:'omit'}).then(async res=>{if(!res.ok)throw Error('unavailable');const p=await res.json();if(!Array.isArray(p.data))throw Error('invalid');return p.data}),
 window.GDDPublicReadOnly?.utilitySources?.()||Promise.reject(Error('archive unavailable'))
 ]);
 const packet={data:research.status==='fulfilled'?research.value:[]};
 const archiveRows=archive.status==='fulfilled'?archive.value:{documents:[],posts:[]};
 const now=today(),day=Math.floor(Date.parse(now+'T00:00:00Z')/86400000);const fragment=document.createDocumentFragment(),quotes=document.createDocumentFragment(),slot=quoteSlot(new Date());
 const [y,m,d]=now.split('-').map(Number);let lunar=null;try{lunar=window.GDDVietnameseLunar?.solarToLunar(d,m,y)}catch{}
 const documents=(archiveRows.documents||[]).map(r=>archiveItem(r,'documents')).filter(Boolean);
 const posts=(archiveRows.posts||[]).map(r=>archiveItem(r,'posts')).filter(Boolean);
 const featured=[...documents,...posts].sort((a,b)=>a.id.localeCompare(b.id));
 const history=documents.filter(r=>documentAnniversary(r.source_date,now,lunar)).map(r=>({...r,excerpt:'Văn kiện có ngày ghi trên hồ sơ trùng ngày hôm nay ('+documentAnniversary(r.source_date,now,lunar)+'). '+r.excerpt}));
 for(const [kind,name,kicker] of config){
 let items=packet.data.filter(r=>r.kind===kind&&(kind==='quote'?quoteReady(r):r.excerpt&&r.citation&&safeLink(r.source_url)));
 if(kind==='history')items=items.filter(r=>documentAnniversary(r.source_date,now,lunar));
 if(!items.length&&kind==='history')items=history;
 if(!items.length&&kind==='featured')items=featured;
 if(!items.length)continue;
 const row=items[((kind==='quote'?slot:day)%items.length+items.length)%items.length],card=make('section','gdd-research-card');
 if(kind==='quote'){renderQuote(card,row,name,slot);quotes.append(card);continue;}
 cardHeader(card,kind,name,kicker);card.append(make('p','gdd-research-title',row.title));if(row.source_date)card.append(make('small','gdd-ornate-date',row.source_date));if(row.excerpt)card.append(make('p','gdd-archive-summary',row.archiveKind?row.excerpt:clipArchiveText(row.excerpt)));
 if(row.speaker)card.append(make('strong','',row.speaker));
 card.append(make('small','gdd-ornate-source',row.citation));const link=make('a','gdd-ornate-link',kind==='ritual'?'Mở xem kinh / nghi lễ ↗':kind==='history'?'Xem tư liệu lịch sử ↗':'Xem tư liệu ↗');link.href=safeLink(row.source_url);if(!row.archiveKind){link.target='_blank';link.rel='noopener noreferrer'}card.append(link);fragment.append(card);
 }
 quoteRoot.replaceChildren(quotes);quoteRoot.hidden=!quoteRoot.children.length;root.replaceChildren(fragment);root.hidden=!root.children.length;last=Date.now();window.dispatchEvent(new Event('gdd:utility-mounted'));
 }catch{root.replaceChildren();root.hidden=true;quoteRoot.replaceChildren();quoteRoot.hidden=true;}finally{busy=false}
}
function init(){mountClock();refresh();window.addEventListener('load',()=>{mountClock();refresh()},{once:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-last>60000)refresh()});setInterval(()=>{if(!document.hidden)refresh()},120000);let lastSlot=quoteSlot(new Date());setInterval(()=>{const s=quoteSlot(new Date());if(s!==lastSlot&&!document.hidden){lastSlot=s;refresh()}},1000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();