(()=>{'use strict';
if(window.__GDDResearchUtilities)return;window.__GDDResearchUtilities=true;
const endpoint='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/research-utilities';
const config=[['quote','THÁNH NGÔN MỖI NGÀY','LỜI ĐẠO MỖI NGÀY'],['history','NGÀY NÀY NĂM XƯA','DẤU ẤN ĐẠO SỬ'],['ritual','KINH ĐẠO – NGHI LỄ','KINH SÁCH'],['featured','TƯ LIỆU NỔI BẬT','GÓC VĂN KHỐ']];
const make=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=value||'';return n};
const style=document.createElement('style');style.textContent='#gdd-research-public{display:grid;gap:12px;min-width:0}#gdd-research-public[hidden]{display:none!important}.gdd-research-card{background:#fffdf8;border:1px solid #ddd4bf;border-radius:10px;padding:14px;min-width:0;overflow-wrap:anywhere}.gdd-research-card .gdd-research-kicker{font:600 10px/1.5 system-ui;letter-spacing:.12em;color:#94794d}.gdd-research-card h3{font:700 16px/1.5 Georgia,serif;color:#194b42;margin:4px 0 10px}.gdd-research-card blockquote{margin:8px 0;padding:10px 0 10px 12px;border-left:2px solid #b6a176;white-space:pre-wrap;color:#244c40;font:15px/1.75 Georgia,serif;max-height:20em;overflow:auto}.gdd-research-card strong{display:block;font:600 13px/1.6 system-ui;color:#244c40}.gdd-research-card small{display:block;color:#806d4e;font:11px/1.6 system-ui;margin-top:6px}.gdd-research-card a{display:inline-block;margin-top:10px;font:600 12px/1.5 system-ui;color:#194b42;text-decoration:underline}.gdd-research-card .gdd-research-title{font:600 14px/1.5 Georgia,serif;color:#194b42;margin:0}';document.head.append(style);
function today(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day}
function safeLink(v){try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}}
let busy=false,last=0;
async function refresh(){
 const aside=document.getElementById('gdd-p1-aside');if(!aside||busy)return;
 let root=document.getElementById('gdd-research-public');if(!root){root=make('div');root.id='gdd-research-public';root.hidden=true;const calendar=document.getElementById('gdd-p1-calendar-panel');if(calendar)calendar.after(root);else aside.append(root)}
 busy=true;
 try{
 const res=await fetch(endpoint,{cache:'no-store',credentials:'omit'});if(!res.ok)throw Error('unavailable');
 const packet=await res.json();if(!Array.isArray(packet.data))throw Error('invalid');
 const now=today(),day=Math.floor(Date.parse(now+'T00:00:00Z')/86400000);const fragment=document.createDocumentFragment();
 for(const [kind,name,kicker] of config){
 let items=packet.data.filter(r=>r.kind===kind&&r.excerpt&&r.citation&&safeLink(r.source_url));
 if(kind==='history')items=items.filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.source_date||'')&&r.source_date.slice(5)===now.slice(5));
 if(!items.length)continue;
 const row=items[day%items.length],card=make('section','gdd-research-card');
 card.append(make('div','gdd-research-kicker',kicker),make('h3','',name),make('p','gdd-research-title',row.title),make('blockquote','',row.excerpt));
 if(row.speaker)card.append(make('strong','',row.speaker));if(row.source_date)card.append(make('small','',row.source_date));
 card.append(make('small','','Xuất xứ: '+row.citation));const link=make('a','','Xem nguồn tư liệu ↗');link.href=safeLink(row.source_url);link.target='_blank';link.rel='noopener noreferrer';card.append(link);fragment.append(card);
 }
 root.replaceChildren(fragment);root.hidden=!root.children.length;last=Date.now();
 }catch{root.replaceChildren();root.hidden=true;}finally{busy=false}
}
function init(){refresh();window.addEventListener('load',refresh,{once:true});document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Date.now()-last>60000)refresh()});setInterval(()=>{if(!document.hidden)refresh()},120000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();