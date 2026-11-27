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
 if(r.visible&&r.state!=='approved')throw Error('Chỉ được hiển thị nội dung đã duyệt.');
 if(r.state==='approved'&&old?.state!=='approved'&&input.confirmed!==true)throw Error('Cần xác nhận đã đối chiếu nguồn.');
 if(r.visible&&input.confirmed!==true)throw Error('Cần xác nhận cho phép công bố.');
 return r;
}
// Fixed public indexes only. Never fetch arbitrary URLs supplied by a user.
const LESSON_ROOT='https://thanhgiaocaodai.com/doc/thanh-ngon-hiep-tuyen/';
const LESSON_DATES=['31-5-1926','5-6-1926','8-6-1926','27-6-1926','5-7-1926','15-7-1926','17-7-1926','22-7-1926','25-7-1926','30-7-1926','4-8-1926','7-8-1926','9-8-1926','21-8-1926','22-8-1926','27-8-1926','11-9-1926','17-9-1926','18-9-1926','22-9-1926','29-9-1926','1-10-1926','4-10-1926','12-10-1926','24-10-1926','27-10-1926','28-10-1926','29-10-1926','1-11-1926','12-11-1926','20-11-1926','23-11-1926','24-11-1926','28-11-1926'];
const INDEXES=[
 {url:'https://thanhgiaocaodai.com/doc/thanh-ngon-hiep-tuyen/',citation:'Thánh Ngôn Hiệp Tuyển – Quyển 1, cần đối chiếu bản in'},
 {url:'https://caodaiebook.net/tailieusuutap.htm',citation:'Cao Đài E-book – thư mục sưu tầm'},
 {url:'https://thanhgiaocaodai.com/doc/',citation:'Thánh Giáo Cao Đài – cần kiểm tra Hội Thánh và ấn bản'},
 {url:'https://thanhgiaocaodai.com/doc/thanh-giao-cao-dai/',citation:'Thánh Giáo Cao Đài – cần đối chiếu nguyên bản'}
];
const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
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
async function extractLesson(item){
 const u=new URL(item.url);
 if(u.origin!=='https://thanhgiaocaodai.com'||!/^\/doc\/thanh-ngon-hiep-tuyen\/ngay-[a-z0-9-]+\/?$/.test(u.pathname))return null;
 if(!await allowed(item))throw Error('robots');
 const html=await fetchFixed(item.url,600000),paragraphs=[];let current=null;
 const parser=new HTMLRewriter().on('p',{
 element(el){current={text:''};const c=current;el.onEndTag(()=>{paragraphs.push(c.text.trim());if(current===c)current=null})},text(t){if(current&&current.text.length<4000)current.text+=t.text}
 });
 await parser.transform(new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}})).arrayBuffer();
 // Only complete short sentences, not cut-off fragments or navigation metadata.
 const candidates=completeSentences(paragraphs);
 if(!candidates.length)return null;
 return {excerpt:candidates[0],source_date:u.pathname.match(/ngay-(\d{1,2}-\d{1,2}-\d{4})\/?$/)?.[1]||'',note:'Máy trích một câu hoàn chỉnh từ bài riêng; chưa đối chiếu bản in, người ban giáo và quyền sử dụng. Đọc văn cảnh trước khi duyệt.'};
}
async function discover(index){
 if(!await allowed(index))return {links:[],excerpt:'',blocked:true};
 const html=await fetchFixed(index.url,2000000),links=[];let link=null,quote=null,excerpt='';
 const rewrite=new HTMLRewriter().on('a[href]',{
   element(el){link={href:el.getAttribute('href'),label:''};const current=link;el.onEndTag(()=>{if(current.label.length>=8&&current.label.length<=300&&(interestingTitle(current.label)||/^ngay\s+\d/i.test(norm(current.label.trim())))){try{const u=new URL(current.href,index.url),base=new URL(index.url);if(u.origin===base.origin&&u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname!=='/'&&u.href.length<=2000)links.push({title:current.label.trim().replace(/\s+/g,' '),url:u.href,citation:index.citation})}catch{}}if(link===current)link=null})},
   text(t){if(link&&link.label.length<350)link.label+=t.text}
 }).on('blockquote',{
   element(el){quote={text:''};const current=quote;el.onEndTag(()=>{if(!excerpt&&current.text.trim().split(/\s+/).length>=8)excerpt=shortExcerpt(current.text);if(quote===current)quote=null})},
   text(t){if(quote&&quote.text.length<2500)quote.text+=t.text}
 });
 await rewrite.transform(new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8'}})).arrayBuffer();
 return {links:[...new Map(links.map(x=>[x.url,x])).values()].slice(0,30),excerpt,blocked:false};
}
export async function collectResearch(env,mode='all'){
 if(mode!=='all'&&mode!=='seed'&&(!Number.isInteger(mode)||mode<0||mode>=INDEXES.length))throw Error('Nguồn không hợp lệ');
 let inserted=0;const result=[];
 const save=async(s,key,excerpt='',note='',sourceDate='')=>{
   const id=crypto.randomUUID(),res=await env.DB.prepare("INSERT OR IGNORE INTO gdd_research_items(id,kind,title,source_url,citation,discovered_key,excerpt,note,source_date) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,'quote',s.title,s.url,s.citation,key,excerpt,note,sourceDate).run();
   inserted+=res.meta?.changes||0;
 };
 if(mode==='all'||mode==='seed')for(const s of SOURCES){try{await save(s,s.url);result.push({source:s.url,ok:true,kind:'catalog'})}catch(e){result.push({source:s.url,ok:false,reason:String(e?.message||'D1 write failed').slice(0,150)})}}
 const indexes=mode==='all'?INDEXES:mode==='seed'?[]:[INDEXES[mode]];
 for(const index of indexes){
   if(inserted>=10)break;
   try{
     const found=await discover(index);
     if(found.blocked){result.push({source:index.url,ok:false,reason:'robots'});continue}
     // Catalog links are references, not quotations. Never save index blockquotes as review-ready.
     for(const item of found.links){if(inserted>=(mode===0||mode==='all'?6:10))break;await save(item,item.url);}
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
       try{const x=await extractLesson(item);if(x){await save(item,'excerpt:'+item.url,x.excerpt,x.note,x.source_date);outcome='excerpt_saved'}}
       catch(e){outcome=String(e?.message||'unavailable').slice(0,100)}
       await env.DB.prepare("INSERT INTO gdd_research_attempts(source_url,outcome) VALUES(?,?) ON CONFLICT(source_url) DO UPDATE SET attempted_at=CURRENT_TIMESTAMP,outcome=excluded.outcome").bind(item.url,outcome).run();
       result.push({source:item.url,ok:outcome==='excerpt_saved',reason:outcome});
     }
   }catch(e){result.push({source:'lesson_queue',ok:false,reason:String(e?.message||'unavailable').slice(0,150)})}
 }
 await env.DB.prepare('INSERT INTO gdd_research_runs(id,result) VALUES(?,?)').bind(crypto.randomUUID(),JSON.stringify({inserted,result})).run();
 const counts=await env.DB.prepare("SELECT count(*) AS total, sum(CASE WHEN state='pending' AND length(trim(excerpt))=0 THEN 1 ELSE 0 END) AS sources, sum(CASE WHEN state='pending' AND length(trim(excerpt))>0 THEN 1 ELSE 0 END) AS pending, sum(CASE WHEN state='pending' AND length(trim(excerpt))>0 THEN 1 ELSE 0 END) AS excerpts FROM gdd_research_items").first();
 return {inserted,result,counts,indexes:INDEXES.map(s=>s.url)};
}
export async function handleResearch(request,env,path,json){
 const db=env.DB;if(!db)return json({error:'db_unconfigured'},503);
 try{
 if(path===BASE+'/sources'&&request.method==='GET')return json({data:SOURCES});
 if(path===BASE+'/collect'&&request.method==='POST'){
   const input=await request.json();const mode=input.mode==='seed'?'seed':Number.isInteger(input.index)?input.index:'all';
   return json(await collectResearch(env,mode));
 }
 if(path===BASE+'/items'&&request.method==='GET'){
   const q=new URL(request.url).searchParams,search=str(q.get('q'),200),state=q.get('state')||'all',offset=Math.min(10000,Math.max(0,Math.floor(Number(q.get('offset'))||0)));
   const {results}=await db.prepare("SELECT * FROM gdd_research_items WHERE ((?='all') OR (?='sources' AND state='pending' AND length(trim(excerpt))=0) OR (?='pending' AND state='pending' AND length(trim(excerpt))>0) OR (? IN ('approved','rejected') AND state=?)) AND (?='' OR instr(lower(title||' '||excerpt||' '||speaker||' '||citation),lower(?))>0) ORDER BY updated_at DESC,id LIMIT 100 OFFSET ?").bind(state,state,state,state,state,search,search,offset).all();return json({data:results||[],offset});
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
