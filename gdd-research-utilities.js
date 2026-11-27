(()=>{'use strict';
if(window.__GDDResearchUtilities)return;window.__GDDResearchUtilities=true;
const endpoint='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/research-utilities';
const config=[['quote','THÁNH NGÔN MỖI NGÀY','LỜI ĐẠO MỖI NGÀY'],['history','NGÀY NÀY NĂM XƯA','DẤU ẤN ĐẠO SỬ'],['ritual','KINH ĐẠO – NGHI LỄ','KINH SÁCH'],['featured','TƯ LIỆU NỔI BẬT','GÓC VĂN KHỐ']];
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
function archiveItem(r,kind){
 if(r?.published!==true||!r.slug||!r.title)return null;
 const prefix=kind==='documents'?'tai-lieu-so-hoa':'bai-viet';
 return {id:kind+':'+r.id,title:String(r.title),excerpt:String(r.summary||'').replace(/<[^>]*>/g,' ').trim().slice(0,280),citation:kind==='documents'?'Kho Số Hóa · Dấu Xưa Cửa Đạo':'Kho Biên Khảo · Dấu Xưa Cửa Đạo',source_url:location.origin+'/#'+prefix+'/'+encodeURIComponent(r.slug),source_date:kind==='documents'?String(r.document_date||''):'',archiveKind:kind};
}
function clockParts(now){
 const s=(now.getUTCHours()*3600+now.getUTCMinutes()*60+now.getUTCSeconds()+7*3600)%86400;
 const remaining=21600-s%21600,slot=Math.floor(s/21600),next=(slot+1)%4;
 const fmt=n=>String(n).padStart(2,'0'),time=n=>fmt(Math.floor(n/3600))+':'+fmt(Math.floor(n/60)%60)+':'+fmt(n%60);
 return {slot,next,remaining,now:time(s),countdown:time(remaining)};
}
let clockTimer;
function mountClock(){
 const aside=document.getElementById('gdd-p1-aside');if(!aside||document.getElementById('gdd-tu-thoi'))return;
 const card=make('section','gdd-research-card');card.id='gdd-tu-thoi';
 card.append(make('div','gdd-research-kicker','GIỜ CÚNG HẰNG NGÀY'),make('h3','','ĐỒNG HỒ TỨ THỜI'));
 const time=make('div','gdd-clock-time'),next=make('div','gdd-clock-next'),remaining=make('div','gdd-clock-count'),grid=make('div','gdd-clock-grid');
 const names=['Tý','Mẹo','Ngọ','Dậu'],hours=['00:00','06:00','12:00','18:00'];
 const tiles=names.map((name,i)=>{const n=make('div','gdd-clock-slot');n.append(make('strong','',name),make('small','',hours[i]));grid.append(n);return n});
 card.append(time,make('small','','Giờ Việt Nam (UTC+7)'),next,remaining,grid,make('small','','Mốc cúng thường lệ; giờ hành lễ đặc biệt theo thông báo Hội Thánh.'));
 const anchor=document.getElementById('gdd-p1-calendar-panel')||aside.querySelector('.gdd-p1-side-intro');if(anchor)anchor.after(card);else aside.prepend(card);
 const tick=()=>{const p=clockParts(new Date());time.textContent=p.now;next.textContent='Thời cúng kế tiếp: '+names[p.next]+' · '+hours[p.next];remaining.textContent='Còn '+p.countdown;tiles.forEach((n,i)=>n.classList.toggle('is-next',i===p.next));};
 tick();clearInterval(clockTimer);clockTimer=setInterval(tick,1000);
}
let busy=false,last=0;
async function refresh(){
 const aside=document.getElementById('gdd-p1-aside');if(!aside||busy)return;
 let root=document.getElementById('gdd-research-public');if(!root){root=make('div');root.id='gdd-research-public';root.hidden=true;const calendar=document.getElementById('gdd-tu-thoi')||document.getElementById('gdd-p1-calendar-panel');if(calendar)calendar.after(root);else aside.append(root)}
 busy=true;
 try{
 const [research,archive]=await Promise.allSettled([
 fetch(endpoint,{cache:'no-store',credentials:'omit'}).then(async res=>{if(!res.ok)throw Error('unavailable');const p=await res.json();if(!Array.isArray(p.data))throw Error('invalid');return p.data}),
 window.GDDPublicReadOnly?.utilitySources?.()||Promise.reject(Error('archive unavailable'))
 ]);
 const packet={data:research.status==='fulfilled'?research.value:[]};
 const archiveRows=archive.status==='fulfilled'?archive.value:{documents:[],posts:[]};
 const now=today(),day=Math.floor(Date.parse(now+'T00:00:00Z')/86400000);const fragment=document.createDocumentFragment();
 const [y,m,d]=now.split('-').map(Number);let lunar=null;try{lunar=window.GDDVietnameseLunar?.solarToLunar(d,m,y)}catch{}
 const documents=(archiveRows.documents||[]).map(r=>archiveItem(r,'documents')).filter(Boolean);
 const posts=(archiveRows.posts||[]).map(r=>archiveItem(r,'posts')).filter(Boolean);
 const featured=[...documents,...posts].sort((a,b)=>a.id.localeCompare(b.id));
 const history=documents.filter(r=>documentAnniversary(r.source_date,now,lunar)).map(r=>({...r,excerpt:'Văn kiện có ngày ghi trên hồ sơ trùng ngày hôm nay ('+documentAnniversary(r.source_date,now,lunar)+'). '+r.excerpt}));
 for(const [kind,name,kicker] of config){
 let items=packet.data.filter(r=>r.kind===kind&&r.excerpt&&r.citation&&safeLink(r.source_url));
 if(kind==='history')items=items.filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.source_date||'')&&r.source_date.slice(5)===now.slice(5));
 if(!items.length&&kind==='history')items=history;
 if(!items.length&&kind==='featured')items=featured;
 if(!items.length)continue;
 const row=items[day%items.length],card=make('section','gdd-research-card');
 card.append(make('div','gdd-research-kicker',kicker),make('h3','',name),make('p','gdd-research-title',row.title));if(row.excerpt)card.append(make(row.archiveKind?'p':'blockquote',row.archiveKind?'gdd-archive-summary':'',row.excerpt));
 if(row.speaker)card.append(make('strong','',row.speaker));if(row.source_date)card.append(make('small','',row.source_date));
 card.append(make('small','','Xuất xứ: '+row.citation));const link=make('a','','Xem nguồn tư liệu ↗');link.href=safeLink(row.source_url);if(!row.archiveKind){link.target='_blank';link.rel='noopener noreferrer'}card.append(link);fragment.append(card);
 }
 root.replaceChildren(fragment);root.hidden=!root.children.length;last=Date.now();
 }catch{root.replaceChildren();root.hidden=true;}finally{busy=false}
}
function init(){mountClock();refresh();window.addEventListener('load',()=>{mountClock();refresh()},{once:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-last>60000)refresh()});setInterval(()=>{if(!document.hidden)refresh()},120000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();