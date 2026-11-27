const BASE='/api/v1/admin/research';
export const SOURCES=[
{title:'Lời Thuyết Đạo của Đức Hộ Pháp',url:'https://caodai.com.vn/vn/news-detail/loi-thuyet-dao-cua-duc-ho-phap-1.html',citation:'Hội Thánh Cao Đài Tòa Thánh Tây Ninh'},
{title:'Thánh Ngôn Hiệp Tuyển — Quyển 1',url:'https://thanhgiaocaodai.com/doc/thanh-ngon-hiep-tuyen/',citation:'Bản điện tử, cần đối chiếu ấn bản gốc'},
{title:'Thi văn dạy Đạo – Thánh Ngôn Hiệp Tuyển quyển 1',url:'https://thanhgiaocaodai.com/doc/thanh-ngon-hiep-tuyen/thi-van-day-dao',citation:'Hội Thánh Tòa Thánh Tây Ninh – bản điện tử cần đối chiếu ấn bản'},
{title:'Thư mục tư liệu Cao Đài E-book',url:'https://caodaiebook.net/tailieusuutap.htm',citation:'Thư mục bản chụp và tài liệu sưu tầm'},
{title:'Thư viện Thánh giáo, kinh sách',url:'https://thanhgiaocaodai.com/doc/',citation:'Nhiều nguồn Hội Thánh, cần phân biệt xuất xứ'}
];
const kinds=new Set(['quote','history','ritual','featured']),states=new Set(['pending','approved','rejected']),rights=new Set(['unknown','permitted','public_domain','licensed']);
const str=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
const cleanURL=v=>{try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<=2000?u.href:''}catch{return ''}};
const keys=['kind','title','excerpt','speaker','source_url','citation','source_date','note','rights','state','visible'];
export function validateResearch(input,old){
 const r={kind:str(input.kind,20),title:str(input.title,300),excerpt:str(input.excerpt,12000),speaker:str(input.speaker,250),source_url:cleanURL(input.source_url),citation:str(input.citation,1500),source_date:str(input.source_date,150),note:str(input.note,4000),rights:str(input.rights,30),state:str(input.state,20),visible:input.visible===true||input.visible===1?1:0};
 if(!kinds.has(r.kind)||!r.title||!r.source_url||!rights.has(r.rights)||!states.has(r.state))throw Error('Thiếu hoặc sai thông tin nguồn, loại, nhan đề.');
 if((r.state==='approved'&&old?.state!=='approved'||r.visible)&&input.confirmed!==true)throw Error('Cần xác nhận đã đối chiếu nguồn và quyền sử dụng.');
 if(old&&['kind','title','excerpt','speaker','source_url','citation','source_date','rights'].some(k=>r[k]!==old[k])&&!(old.state==='pending'&&r.state==='approved'&&input.confirmed===true)){r.state='pending';r.visible=0;}
 if(r.state==='approved'&&(!r.excerpt||!r.citation||r.rights==='unknown'))throw Error('Phải có nguyên văn, xuất xứ và quyền sử dụng trước khi duyệt.');
 if(r.visible&&r.kind==='quote'&&(!r.speaker||!r.source_date||/cần đối chiếu|chưa xác định|chưa rõ|không rõ|chờ duyệt|chưa kiểm chứng/i.test(r.speaker+' '+r.source_date)))throw Error('Cần ghi rõ đấng ban giáo hoặc người dạy và ngày tháng / đàn cơ trước khi hiển thị. Có thể duyệt nội bộ nếu chưa đủ dữ kiện.');
 if(r.visible&&r.kind==='history'&&!/^(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}(?:\/\d{4})?\s*ÂL)$/i.test(r.source_date))throw Error('Ngày sự kiện phải ghi YYYY-MM-DD (DL) hoặc DD/MM/YYYY ÂL, theo nguồn đã đối chiếu.');
 if(r.visible&&r.state!=='approved')throw Error('Chỉ được hiển thị nội dung đã duyệt.');
 if(r.state==='approved'&&old?.state!=='approved'&&input.confirmed!==true)throw Error('Cần xác nhận đã đối chiếu nguồn.');
 if(r.visible&&input.confirmed!==true)throw Error('Cần xác nhận cho phép công bố.');
 return r;
}
// Fixed public indexes only. Never fetch arbitrary URLs supplied by a user.
const LESSON_ROOT='https://thanhgiaocaodai.com/doc/thanh-ngon-hiep-tuyen/';
const LESSON_DATES=['31-5-1926','5-6-1926','8-6-1926','27-6-1926','5-7-1926','15-7-1926','17-7-1926','22-7-1926','25-7-1926','30-7-1926','4-8-1926','7-8-1926','9-8-1926','21-8-1926','22-8-1926','27-8-1926','11-9-1926','17-9-1926','18-9-1926','22-9-1926','29-9-1926','1-10-1926','4-10-1926','12-10-1926','24-10-1926','27-10-1926','28-10-1926','29-10-1926','1-11-1926','12-11-1926','20-11-1926','23-11-1926','24-11-1926','28-11-1926'];
const HISTORY_INDEX='https://www.caodai.com.vn/vn/news/tin-tuc-dao-su/page-118.html';
const INDEXES=[
 {url:'https://thanhgiaocaodai.com/doc/thanh-ngon-hiep-tuyen/',citation:'Thánh Ngôn Hiệp Tuyển – Quyển 1, cần đối chiếu bản in'},
 {url:'https://caodaiebook.net/tailieusuutap.htm',citation:'Cao Đài E-book – thư mục sưu tầm'},
 {url:'https://thanhgiaocaodai.com/doc/',citation:'Thánh Giáo Cao Đài – cần kiểm tra Hội Thánh và ấn bản'},
 {url:'https://thanhgiaocaodai.com/doc/thanh-giao-cao-dai/',citation:'Thánh Giáo Cao Đài – cần đối chiếu nguyên bản'},
 {url:HISTORY_INDEX,citation:'Hội Thánh Cao Đài Tòa Thánh Tây Ninh – tin tức và hồi cố Đạo sử',kind:'history'}
];
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
export function historyTitle(v){return /khai dao|cau dao|lap tich|tich dao|lap dao|khai tich|tan kinh|phong thanh|tho nan|luu day|hoi huong|dao su|lich su|khoi cong|khanh thanh|thanh lap|dang tien|qui vi|quy vi/.test(norm(v))}
export function interestingTitle(v){return /thanh ngon|thanh giao|thuyet dao|huan tu|giao huan|loi day|kinh thien dao|kinh the dao|nghi le|nghi tiet/.test(norm(v))}
export function shortExcerpt(v){return String(v||'').trim().split(/\s+/).slice(0,20).join(' ')}
async function boundedText(res,max){
 if(!res.ok)throw Error('HTTP '+res.status);
 const declared=Number(res.headers.get('content-length')||0);if(declared>max)throw Error('source_too_large');
 const reader=res.body?.getReader();if(!reader)throw Error('empty_source');
 const decoder=new TextDecoder();let total=0,out='';
 try{while(true){const part=await reader.read();if(part.done)break;total+=part.value.length;if(total>max)throw Error('source_too_large');out+=decoder.decode(part.value,{stream:true})}return out+decoder.decode()}finally{try{await reader.cancel()}catch{}}
}
async function fetchFixed(url,max,robots=false){
 const res=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'GDD-Research/1.0 (+https://dauxuacuadao.info.vn/)','Accept':robots?'text/plain':'text/html'}});
 if(robots&&res.status===404)return '';
 if(!robots&&!/text\/html|application\/xhtml/i.test(res.headers.get('content-type')||''))throw Error('not_html');
 return boundedText(res,max);
}
async function allowed(index){
 const u=new URL(index.url),robots=await fetchFixed(u.origin+'/robots.txt',64000,true);
 // Conservative: honor any matching disallow; no attempts to circumvent crawl restrictions.
 for(const line of robots.split(/\r?\n/)){
   const rule=line.replace(/#.*$/,'').match(/^\s*disallow\s*:\s*(\S+)/i)?.[1];
   if(rule&&(rule.includes('*')||rule.includes('$')||u.pathname.startsWith(rule)))return false;
 }
 return true;
}
// Read specific lesson pages rather than treating their table of contents as quotations.
export function completeSentences(paragraphs){
 return paragraphs.flatMap(s=>s.split(/(?<=[.!?])\s+/)).map(s=>s.trim()).filter(s=>/^(?:THẦY|Các con|Đạo THẦY|Ấy vậy|Phải|Chư đạo hữu|TA|Ai|Con|Nhơn sanh|Chúng sanh|Người|Đạo|Muốn|Làm|Cả thảy)\b/i.test(s)&&/[.!?]$/.test(s)&&!/\.\.\.|…|https?:|tải app|đọc bài|xem toàn bộ/i.test(s)&&s.split(/\s+/).length>=8&&s.split(/\s+/).length<=23);
}
export function lessonCandidates(blocks){
 let speaker='',date='',inside=false,header='';const out=[];
 for(const b of blocks){
  const s=String(b.text||'').replace(/\s+/g,' ').trim();if(!s)continue;
  if(b.tag==='h1'){inside=true;speaker='';date='';header='';continue}
  if(!inside)continue;
  if(/^Bài khác trong quyển|^Xem toàn bộ mục lục/i.test(s))break;
  if(b.tag==='h2'||b.tag==='h3'){
   header=s;
   if(/^NGỌC HOÀNG THƯỢNG ĐẾ\s+VIẾT CAO ĐÀI/i.test(s)||/^CAO ĐÀI,?\s*(?:LE TRÈS-HAUT\.?)?$/i.test(s)||/^ĐỨC CHÍ TÔN$/i.test(s))speaker='Đức Chí Tôn';
   else if(/^THÍCH CA (?:NHƯ LAI|MÂU NI)/i.test(s))speaker='Đức Thích Ca Như Lai';
   else if(/^(?:ĐỨC )?LÝ THÁI BẠCH(?:\s*[:.]|\s*$)/i.test(s))speaker='Đức Lý Thái Bạch';
   else if(/^(?:ĐỨC )?(?:THÁI THƯỢNG (?:LÃO QUÂN|NGƯƠN THỈ)|QUAN ÂM (?:NHƯ LAI|BỒ TÁT))(?:\s*[:.]|\s*$)/i.test(s))speaker=s.replace(/[.:]$/,'');
   else speaker='';
   continue;
  }
  if(b.tag!=='p')continue;
  if(!header&&s.length<=220&&/\b(?:18|19)\d{2}\b/.test(s)&&(/\d{1,2}\s+(?:Janvier|Février|Mars|Avril|Mai|Juin|Juillet|Août|Septembre|Octobre|Novembre|Décembre)\s+\d{4}/i.test(s)||/\d{1,2}[\/.-]\d{1,2}[\/.-]\d{4}/.test(s))&&!/Thánh Ngôn Hiệp Tuyển|ấn bản|Đọc bài|bản dịch/i.test(s)){date=s;continue}
  for(const excerpt of completeSentences([s]))out.push({excerpt,speaker,source_date:date,note:'Trích câu hoàn chỉnh từ bài riêng. '+(header?'Đề mục nguyên văn: '+header+'. ':'')+'Cần đối chiếu văn cảnh, bản in và quyền sử dụng.'});
 }
 return out;
}
async function readLesson(item){
 const u=new URL(item.url);
 if(u.origin!=='https://thanhgiaocaodai.com'||!/^\/doc\/thanh-ngon-hiep-tuyen\/ngay-[a-z0-9-]+\/?$/.test(u.pathname)||u.search||u.hash)return [];
 if(!await allowed(item))throw Error('robots');
 const html=await fetchFixed(item.url,600000),blocks=[];let current=null;
 const parser=new HTMLRewriter().on('h1,h2,h3,p',{
 element(el){current={tag:el.tagName.toLowerCase(),text:''};const c=current;el.onEndTag(()=>{blocks.push(c);if(current===c)current=null})},text(t){if(current&&current.text.length<12000)current.text+=t.text}
 });
 await parser.transform(new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}})).arrayBuffer();
 return lessonCandidates(blocks);
}
async function extractLesson(item){
 const candidates=await readLesson(item);
 return candidates.find(x=>x.speaker&&x.source_date)||candidates[0]||null;
}
// Extract only a short, dated event sentence from a specific approved source domain.
// Dates without explicit calendar indication stay internal for editorial verification.
export function historicalCandidate(paragraphs){
 for(const para of paragraphs){
  const sentences=para.split(/(?<=[.!?])\s+/);
  for(const raw of sentences){
   const s=raw.trim().replace(/\s+/g,' ');
   if(!historyTitle(s)||s.split(/\s+/).length<8||s.split(/\s+/).length>24||!/[.!?]$/.test(s))continue;
   const date=s.match(/(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})\s*(ÂL|AL|âm lịch|DL|D\.L\.|dương lịch)\b/i);
   if(!date)continue;
   const d=+date[1],m=+date[2],y=+date[3],isLunar=/^(ÂL|AL|âm lịch)$/i.test(date[4]);
   if(d<1||d>(isLunar?30:31)||m<1||m>12||y<1800||y>new Date().getUTCFullYear())continue;
   const check=new Date(Date.UTC(y,m-1,d));if(!isLunar&&(check.getUTCDate()!==d||check.getUTCMonth()+1!==m))continue;
   return {excerpt:s,source_date:isLunar?d+'/'+m+'/'+y+' ÂL':y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0'),note:'Máy tìm câu có sự kiện và ngày ghi rõ loại lịch; cần xác nhận đây là ngày sự kiện gốc, không phải ngày lễ kỷ niệm hoặc ngày đăng bài.'};
  }
 }
 return null;
}
async function extractHistory(item){
 const u=new URL(item.url);
 if(!['https://www.caodai.com.vn','https://caodai.com.vn'].includes(u.origin)||!/^\/vn\/news-detail\/[a-z0-9-]+\.html$/i.test(u.pathname)||u.search||u.hash)return null;
 if(!await allowed(item))throw Error('robots');
 const html=await fetchFixed(item.url,600000),paragraphs=[];let current=null;
 const parser=new HTMLRewriter().on('p',{element(el){current={text:''};const c=current;el.onEndTag(()=>{paragraphs.push(c.text.trim());if(current===c)current=null})},text(t){if(current&&current.text.length<4000)current.text+=t.text}});
 await parser.transform(new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}})).arrayBuffer();
 return historicalCandidate(paragraphs);
}
async function discover(index){
 if(!await allowed(index))return {links:[],excerpt:'',blocked:true};
 const html=await fetchFixed(index.url,2000000),links=[];let link=null,quote=null,excerpt='';
 const rewrite=new HTMLRewriter().on('a[href]',{
   element(el){link={href:el.getAttribute('href'),label:''};const current=link;el.onEndTag(()=>{if(current.label.length>=8&&current.label.length<=300&&(index.kind==='history'?historyTitle(current.label):(interestingTitle(current.label)||/^ngay\s+\d/i.test(norm(current.label.trim()))))){try{const u=new URL(current.href,index.url),base=new URL(index.url);if(u.origin===base.origin&&u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname!=='/'&&u.href.length<=2000)links.push({title:current.label.trim().replace(/\s+/g,' '),url:u.href,citation:index.citation,kind:index.kind||'quote'})}catch{}}if(link===current)link=null})},
   text(t){if(link&&link.label.length<350)link.label+=t.text}
 }).on('blockquote',{
   element(el){quote={text:''};const current=quote;el.onEndTag(()=>{if(!excerpt&&current.text.trim().split(/\s+/).length>=8)excerpt=shortExcerpt(current.text);if(quote===current)quote=null})},
   text(t){if(quote&&quote.text.length<2500)quote.text+=t.text}
 });
 await rewrite.transform(new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}})).arrayBuffer();
 return {links:[...new Map(links.map(x=>[x.url,x])).values()].slice(0,30),excerpt,blocked:false};
}
export async function collectResearch(env,mode='all'){
 if(mode!=='all'&&mode!=='seed'&&mode!=='enrich'&&(!Number.isInteger(mode)||mode<0||mode>=INDEXES.length))throw Error('Nguồn không hợp lệ');
 let inserted=0;const result=[];
 const save=async(s,key,excerpt='',note='',sourceDate='',speaker='')=>{
   const id=crypto.randomUUID(),res=await env.DB.prepare("INSERT OR IGNORE INTO gdd_research_items(id,kind,title,source_url,citation,discovered_key,excerpt,note,source_date,speaker) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(id,s.kind||'quote',s.title,s.url,s.citation,key,excerpt,note,sourceDate,speaker).run();
   inserted+=res.meta?.changes||0;
 };
 if(mode==='all'||mode==='seed')for(const s of SOURCES){try{await save(s,s.url);result.push({source:s.url,ok:true,kind:'catalog'})}catch(e){result.push({source:s.url,ok:false,reason:String(e?.message||'D1 write failed').slice(0,150)})}}
 const indexes=mode==='all'?INDEXES:mode==='seed'||mode==='enrich'?[]:[INDEXES[mode]];
 for(const index of indexes){
   if(inserted>=10)break;
   try{
     const found=await discover(index);
     if(found.blocked){result.push({source:index.url,ok:false,reason:'robots'});continue}
     // Catalog links are references, not quotations. Never save index blockquotes as review-ready.
     for(const item of found.links){if(inserted>=(mode===0||mode==='all'?6:index.kind==='history'?7:10))break;await save(item,index.kind==='history'?'history-source:'+item.url:item.url);}
     result.push({source:index.url,ok:true,links:found.links.length});
   }catch(e){result.push({source:index.url,ok:false,reason:String(e?.message||'unavailable').slice(0,100)})}
 }
 // Extraction is a separate queue, not conditional on successful catalog discovery.
 if(mode==='all'||mode===0){
   try{
     const {results:stored}=await env.DB.prepare("SELECT source_url,discovered_key FROM gdd_research_items WHERE discovered_key LIKE 'excerpt:%'").all();
     const {results:attempted}=await env.DB.prepare("SELECT source_url FROM gdd_research_attempts WHERE attempted_at>datetime('now','-1 day')").all();
     const seen=new Set([...(stored||[]),...(attempted||[])].map(r=>r.source_url));
     const queue=LESSON_DATES.map(d=>({title:'Ngày '+d,url:LESSON_ROOT+'ngay-'+d,citation:'Thánh Ngôn Hiệp Tuyển — Quyển 1, bản điện tử; cần đối chiếu ấn bản gốc'})).filter(x=>!seen.has(x.url));
     for(const item of queue.slice(0,4)){
       if(inserted>=10)break;
       let outcome='no_complete_short_excerpt';
       try{const x=await extractLesson(item);if(x){await save(item,'excerpt:'+item.url,x.excerpt,x.note,x.source_date,x.speaker);outcome='excerpt_saved'}}
       catch(e){outcome=String(e?.message||'unavailable').slice(0,100)}
       await env.DB.prepare("INSERT INTO gdd_research_attempts(source_url,outcome) VALUES(?,?) ON CONFLICT(source_url) DO UPDATE SET attempted_at=CURRENT_TIMESTAMP,outcome=excluded.outcome").bind(item.url,outcome).run();
       result.push({source:item.url,ok:outcome==='excerpt_saved',reason:outcome});
     }
   }catch(e){result.push({source:'lesson_queue',ok:false,reason:String(e?.message||'unavailable').slice(0,150)})}
 }
 if(mode==='all'||INDEXES[mode]?.kind==='history'){
   try{
    const {results:todo}=await env.DB.prepare("SELECT title,source_url AS url,citation FROM gdd_research_items s WHERE s.kind='history' AND s.state='pending' AND length(trim(s.excerpt))=0 AND NOT EXISTS(SELECT 1 FROM gdd_research_items x WHERE x.discovered_key='history:'+s.source_url) AND NOT EXISTS(SELECT 1 FROM gdd_research_attempts a WHERE a.source_url=s.source_url AND a.attempted_at>datetime('now','-1 day')) ORDER BY s.created_at,s.id LIMIT 3").all();
    for(const item of todo||[]){if(inserted>=10)break;let outcome='no_dated_event';
     try{const x=await extractHistory(item);if(x){await save({...item,kind:'history'},'history:'+item.url,x.excerpt,x.note,x.source_date);outcome='event_saved'}}catch(e){outcome=String(e?.message||'unavailable').slice(0,100)}
     await env.DB.prepare("INSERT INTO gdd_research_attempts(source_url,outcome) VALUES(?,?) ON CONFLICT(source_url) DO UPDATE SET attempted_at=CURRENT_TIMESTAMP,outcome=excluded.outcome").bind(item.url,outcome).run();
     result.push({source:item.url,ok:outcome==='event_saved',reason:outcome});
    }
   }catch(e){result.push({source:'history_queue',ok:false,reason:String(e?.message||'unavailable').slice(0,150)})}
 }
 let enriched=0;
 if(mode==='enrich'||mode==='all'){
  try{
   const {results:todo}=await env.DB.prepare("SELECT * FROM gdd_research_items s WHERE state='pending' AND kind='quote' AND length(trim(excerpt))>0 AND (length(trim(speaker))=0 OR length(trim(source_date))=0) AND source_url LIKE 'https://thanhgiaocaodai.com/doc/thanh-ngon-hiep-tuyen/ngay-%' AND NOT EXISTS(SELECT 1 FROM gdd_research_attempts a WHERE a.source_url='metadata:'||s.id AND a.attempted_at>datetime('now','-1 day')) ORDER BY created_at,id LIMIT 4").all();
   for(const item of todo||[]){
    let outcome='no_exact_attribution';
    try{
     const candidates=await readLesson({url:item.source_url});
     const match=candidates.filter(x=>x.excerpt.replace(/\s+/g,' ').trim()===item.excerpt.replace(/\s+/g,' ').trim()&&x.speaker&&x.source_date);
     if(match.length===1&&(!item.speaker||item.speaker===match[0].speaker)){
      const x=match[0],snapshot={...item,speaker:item.speaker||x.speaker,source_date:item.source_date&&!/^\d{1,2}-\d{1,2}-\d{4}$/.test(item.source_date)?item.source_date:x.source_date,note:(item.note+'\n'+x.note).trim().slice(0,4000),version:item.version+1};
      const changed=await env.DB.batch([env.DB.prepare("UPDATE gdd_research_items SET speaker=?,source_date=?,note=?,version=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=? AND state='pending' AND visible=0").bind(snapshot.speaker,snapshot.source_date,snapshot.note,snapshot.version,item.id,item.version),env.DB.prepare("INSERT INTO gdd_research_revisions(id,item_id,version,snapshot) SELECT ?,id,version,? FROM gdd_research_items WHERE id=? AND version=? AND changes()=1").bind(crypto.randomUUID(),JSON.stringify(snapshot),item.id,snapshot.version)]);
      if(changed[0].meta?.changes===1){enriched++;outcome='metadata_saved'}
     }
    }catch(e){outcome=String(e?.message||'unavailable').slice(0,100)}
    await env.DB.prepare("INSERT INTO gdd_research_attempts(source_url,outcome) VALUES(?,?) ON CONFLICT(source_url) DO UPDATE SET attempted_at=CURRENT_TIMESTAMP,outcome=excluded.outcome").bind('metadata:'+item.id,outcome).run();
    result.push({source:item.source_url,ok:outcome==='metadata_saved',reason:outcome});
   }
  }catch(e){result.push({source:'metadata_queue',ok:false,reason:String(e?.message||'unavailable').slice(0,150)})}
 }
 await env.DB.prepare('INSERT INTO gdd_research_runs(id,result) VALUES(?,?)').bind(crypto.randomUUID(),JSON.stringify({inserted,result})).run();
 const counts=await env.DB.prepare("SELECT count(*) AS total, sum(CASE WHEN state='pending' AND length(trim(excerpt))=0 THEN 1 ELSE 0 END) AS sources, sum(CASE WHEN state='pending' AND length(trim(excerpt))>0 AND NOT (kind='quote' AND (length(trim(speaker))=0 OR length(trim(source_date))=0 OR lower(speaker||' '||source_date) LIKE '%chưa xác định%' OR lower(speaker||' '||source_date) LIKE '%cần đối chiếu%' OR lower(speaker||' '||source_date) LIKE '%chưa rõ%' OR lower(speaker||' '||source_date) LIKE '%không rõ%' OR lower(speaker||' '||source_date) LIKE '%chờ duyệt%' OR lower(speaker||' '||source_date) LIKE '%chưa kiểm chứng%')) THEN 1 ELSE 0 END) AS pending, sum(CASE WHEN state='pending' AND length(trim(excerpt))>0 AND (kind='quote' AND (length(trim(speaker))=0 OR length(trim(source_date))=0 OR lower(speaker||' '||source_date) LIKE '%chưa xác định%' OR lower(speaker||' '||source_date) LIKE '%cần đối chiếu%' OR lower(speaker||' '||source_date) LIKE '%chưa rõ%' OR lower(speaker||' '||source_date) LIKE '%không rõ%' OR lower(speaker||' '||source_date) LIKE '%chờ duyệt%' OR lower(speaker||' '||source_date) LIKE '%chưa kiểm chứng%')) THEN 1 ELSE 0 END) AS incomplete, sum(CASE WHEN state='pending' AND length(trim(excerpt))>0 THEN 1 ELSE 0 END) AS excerpts FROM gdd_research_items").first();
 return {inserted,enriched,result,counts,indexes:INDEXES.map(s=>s.url)};
}
export async function handleResearch(request,env,path,json){
 const db=env.DB;if(!db)return json({error:'db_unconfigured'},503);
 try{
 if(path===BASE+'/sources'&&request.method==='GET')return json({data:SOURCES});
 if(path===BASE+'/collect'&&request.method==='POST'){
   const input=await request.json();const mode=['seed','enrich'].includes(input.mode)?input.mode:Number.isInteger(input.index)?input.index:'all';
   return json(await collectResearch(env,mode));
 }
 if(path===BASE+'/items'&&request.method==='GET'){
   const q=new URL(request.url).searchParams,search=str(q.get('q'),200),state=q.get('state')||'all',offset=Math.min(10000,Math.max(0,Math.floor(Number(q.get('offset'))||0)));
   const {results}=await db.prepare("SELECT * FROM gdd_research_items WHERE ((?='all') OR (?='sources' AND state='pending' AND length(trim(excerpt))=0) OR (?='pending' AND state='pending' AND length(trim(excerpt))>0 AND NOT (kind='quote' AND (length(trim(speaker))=0 OR length(trim(source_date))=0 OR lower(speaker||' '||source_date) LIKE '%chưa xác định%' OR lower(speaker||' '||source_date) LIKE '%cần đối chiếu%' OR lower(speaker||' '||source_date) LIKE '%chưa rõ%' OR lower(speaker||' '||source_date) LIKE '%không rõ%' OR lower(speaker||' '||source_date) LIKE '%chờ duyệt%' OR lower(speaker||' '||source_date) LIKE '%chưa kiểm chứng%'))) OR (?='incomplete' AND state='pending' AND length(trim(excerpt))>0 AND (kind='quote' AND (length(trim(speaker))=0 OR length(trim(source_date))=0 OR lower(speaker||' '||source_date) LIKE '%chưa xác định%' OR lower(speaker||' '||source_date) LIKE '%cần đối chiếu%' OR lower(speaker||' '||source_date) LIKE '%chưa rõ%' OR lower(speaker||' '||source_date) LIKE '%không rõ%' OR lower(speaker||' '||source_date) LIKE '%chờ duyệt%' OR lower(speaker||' '||source_date) LIKE '%chưa kiểm chứng%'))) OR (? IN ('approved','rejected') AND state=?)) AND (?='' OR instr(lower(title||' '||excerpt||' '||speaker||' '||citation),lower(?))>0) ORDER BY updated_at DESC,id LIMIT 100 OFFSET ?").bind(state,state,state,state,state,state,search,search,offset).all();return json({data:results||[],offset});
 }
 if(path===BASE+'/runs'&&request.method==='GET'){const {results}=await db.prepare('SELECT * FROM gdd_research_runs ORDER BY created_at DESC LIMIT 20').all();return json({data:results||[]})}
 if(path===BASE+'/items'&&request.method==='POST'){
   const raw=await request.text();if(raw.length>100000)return json({error:'Dữ liệu quá lớn'},413);
   const input=JSON.parse(raw),id=crypto.randomUUID(),r=validateResearch({...input,state:'pending',visible:false});
   await db.batch([db.prepare('INSERT INTO gdd_research_items(id,'+keys.join(',')+') VALUES('+Array(keys.length+1).fill('?').join(',')+')').bind(id,...keys.map(k=>r[k])),db.prepare('INSERT INTO gdd_research_revisions(id,item_id,version,snapshot) VALUES(?,?,1,?)').bind(crypto.randomUUID(),id,JSON.stringify(r))]);return json({id,state:'pending'},201);
 }
 const match=/^\/api\/v1\/admin\/research\/items\/([a-f0-9-]{36})(\/history)?$/i.exec(path);
 if(match&&match[2]&&request.method==='GET'){const {results}=await db.prepare('SELECT version,snapshot,created_at FROM gdd_research_revisions WHERE item_id=? ORDER BY version DESC LIMIT 100').bind(match[1]).all();return json({data:results||[]})}
 if(match&&!match[2]&&request.method==='PUT'){
   const raw=await request.text();if(raw.length>100000)return json({error:'Dữ liệu quá lớn'},413);
   const input=JSON.parse(raw),old=await db.prepare('SELECT * FROM gdd_research_items WHERE id=?').bind(match[1]).first();
   if(!old)return json({error:'not_found'},404);if(input.version!==old.version)return json({error:'Dữ liệu đã thay đổi. Hãy tải lại.'},409);
   const r=validateResearch(input,old),version=old.version+1;
   const result=await db.batch([db.prepare('UPDATE gdd_research_items SET '+keys.map(k=>k+'=?').join(',')+',version=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND version=?').bind(...keys.map(k=>r[k]),version,old.id,old.version),db.prepare('INSERT INTO gdd_research_revisions(id,item_id,version,snapshot) SELECT ?,id,version,? FROM gdd_research_items WHERE id=? AND version=? AND changes()=1').bind(crypto.randomUUID(),JSON.stringify(r),old.id,version)]);
   if(result[0].meta?.changes!==1)return json({error:'Dữ liệu đã thay đổi. Hãy tải lại.'},409);return json({id:old.id,state:r.state,visible:r.visible,version});
 }
 return json({error:'not_found'},404);
 }catch(e){return json({error:e instanceof SyntaxError?'Dữ liệu JSON không hợp lệ':String(e?.message||'Không xử lý được').startsWith('D1_')?'Kho khảo chứng chưa khả dụng':String(e?.message||'Không xử lý được')},400)}
}
