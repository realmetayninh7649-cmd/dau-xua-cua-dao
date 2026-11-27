const BASE='/api/v1/admin/research';
export const SOURCES=[
{title:'Lời Thuyết Đạo của Đức Hộ Pháp',url:'https://caodai.com.vn/vn/news-detail/loi-thuyet-dao-cua-duc-ho-phap-1.html',citation:'Hội Thánh Cao Đài Tòa Thánh Tây Ninh'},
{title:'Thánh Ngôn Hiệp Tuyển — Quyển 1',url:'https://thanhgiaocaodai.com/doc/thanh-ngon-hiep-tuyen/',citation:'Bản điện tử, cần đối chiếu ấn bản gốc'},
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
 if(old&&['kind','title','excerpt','speaker','source_url','citation','source_date','rights'].some(k=>r[k]!==old[k])){r.state='pending';r.visible=0;}
 if(r.state==='approved'&&(!r.excerpt||!r.citation||r.rights==='unknown'))throw Error('Phải có nguyên văn, xuất xứ và quyền sử dụng trước khi duyệt.');
 if(r.visible&&r.state!=='approved')throw Error('Chỉ được hiển thị nội dung đã duyệt.');
 if(r.state==='approved'&&old?.state!=='approved'&&input.confirmed!==true)throw Error('Cần xác nhận đã đối chiếu nguồn.');
 if(r.visible&&input.confirmed!==true)throw Error('Cần xác nhận cho phép công bố.');
 return r;
}
export async function collectResearch(env){
 let inserted=0;const result=[];
 for(const s of SOURCES){try{const res=await env.DB.prepare("INSERT OR IGNORE INTO gdd_research_items(id,kind,title,source_url,citation,discovered_key) VALUES(?,?,?,?,?,?)").bind(crypto.randomUUID(),'quote',s.title,s.url,s.citation,s.url).run();inserted+=res.meta?.changes||0;result.push({source:s.url,ok:true})}catch{result.push({source:s.url,ok:false})}}
 await env.DB.prepare('INSERT INTO gdd_research_runs(id,result) VALUES(?,?)').bind(crypto.randomUUID(),JSON.stringify({inserted,result})).run();
 return {inserted,result};
}
export async function handleResearch(request,env,path,json){
 const db=env.DB;if(!db)return json({error:'db_unconfigured'},503);
 try{
 if(path===BASE+'/sources'&&request.method==='GET')return json({data:SOURCES});
 if(path===BASE+'/collect'&&request.method==='POST')return json(await collectResearch(env));
 if(path===BASE+'/items'&&request.method==='GET'){
   const q=new URL(request.url).searchParams,search=str(q.get('q'),200),state=q.get('state')||'all',offset=Math.min(10000,Math.max(0,Math.floor(Number(q.get('offset'))||0)));
   const {results}=await db.prepare("SELECT * FROM gdd_research_items WHERE (?='all' OR state=?) AND (?='' OR instr(lower(title||' '||excerpt||' '||speaker||' '||citation),lower(?))>0) ORDER BY updated_at DESC,id LIMIT 100 OFFSET ?").bind(state,state,search,search,offset).all();return json({data:results||[],offset});
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
