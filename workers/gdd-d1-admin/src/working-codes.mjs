/* DẤU XƯA CỬA ĐẠO — validated archive-code assignment on WORKING D1 only.
 * Never change an existing code. A verified administrator explicitly confirms
 * a server-derived candidate before it is assigned. Assignment increments
 * gdd_version so the existing audit trigger records the action.
 */
const SIMPLE=Object.freeze({
 posts:'DXCD-BK',media:'DXCD-HA',videos:'DXCD-VD',obituaries:'DXCD-AT'
});
const DOCUMENT_GROUPS=new Set(['HCĐ','HTĐ','CTĐ','PT','CQK']);
const KINDS=new Set(['people','posts','media','videos','obituaries','documents']);
const CODE_SUFFIX=/-(\d{5})$/;
function norm(text){
 return String(text??'').toLowerCase().replaceAll('đ','d')
  .normalize('NFD').replace(/\p{M}/gu,'').replace(/\s+/g,' ').trim();
}
function includes(text,term){return norm(text).includes(term)}
function classifyPerson(row){
 const b=norm(row.branch),r=norm(row.rank),g=norm(row.subgroup),name=norm(row.full_name);
 if(!row.full_name||!row.rank||!row.branch)throw Error('classification_incomplete');
 if(b.includes('cuu trung')){
  if(g.includes('ban kien truc')||r.includes('ban kien truc'))return 'CTD.BKT';
  if(r.includes('chanh phoi su'))return 'CTD.CPT';
  if(r.includes('giao tong'))return 'CTD.GT';
  if(r.includes('chuong phap')||name.includes('chuong phap'))return 'CTD.CP';
  if(r.includes('dau su'))return 'CTD.ĐS';
  if(r.includes('phoi su'))return 'CTD.PS';
  if(r.includes('giao su'))return 'CTD.GS';
  if(r.includes('giao huu'))return 'CTD.GH';
  if(r.includes('le sanh'))return 'CTD.LS';
  if(r.includes('chuc viec')||r.includes('pho tri su')||r.includes('chanh tri su'))return 'CTD.CV';
  if(r.includes('dao huu'))return 'CTD.DH';
  return 'CTD.KH';
 }
 if(b.includes('hiep thien')){
  if(g.includes('bo phap chanh')||r.includes('bo phap chanh'))return 'HTD.BPC';
  if(g.includes('bo nhac')||r.includes('bo nhac'))return 'HTD.BN';
  if(g.includes('ban the dao')||r.includes('ban the dao'))return 'HTD.BTD';
  if(r.includes('ho phap'))return 'HTD.HP';
  if(r.includes('thuong pham'))return 'HTD.TP';
  if(r.includes('thuong sanh'))return 'HTD.TS';
  if(r.includes('chon quan')||r.includes('thoi quan'))return 'HTD.TQ';
  return 'HTD.CQK';
 }
 if(b.includes('phuoc thien')){
  for(const [name,code] of [['thanh nhon','TN'],['chon nhon','CN'],['hien nhon','HN'],
   ['dao nhon','DN'],['giao thien','GT'],['chi thien','CT'],['thua su','TT']]){
    if(r.includes(name))return 'PT.'+code;
  }
  return 'PT.KH';
 }
 if(b.includes('hanh chanh')){
  if(g.includes('ban the dao')||r.includes('ban the dao'))return 'HCD.BTD';
  if(r.includes('chuc viec')||r.includes('tri su'))return 'HCD.CV';
  return 'HCD.KH';
 }
 throw Error('classification_not_recognized');
}
function target(kind,row){
 if(kind==='people'){
  const category=classifyPerson(row);
  const series=category.split('.')[0];
  return {displayPrefix:'CS-'+category,
    seriesPrefix:'CS-'+series+'.',
    uncertain:category.endsWith('.KH')||category==='HTD.CQK',
    label:'Cơ quan '+String(row.branch||'')+' · Phẩm vị '+String(row.rank||'')};
 }
 if(kind==='documents'){
  const group=String(row.subfolder_code||'').trim();
  if(!DOCUMENT_GROUPS.has(group))throw Error('document_folder_required');
  const prefix='DXCD-SH.'+group;
  return {displayPrefix:prefix,seriesPrefix:prefix+'-',uncertain:false,
    label:'Thư mục số hóa '+group};
 }
 if(!Object.hasOwn(SIMPLE,kind))throw Error('kind_not_supported');
 const prefix=SIMPLE[kind];
 return {displayPrefix:prefix,seriesPrefix:prefix+'-',uncertain:false,label:'Nhóm tư liệu '+kind};
}
function makeSlug(row,code){
 const input=String(row.full_name||row.title||'tu-lieu');
 const title=norm(input).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,125)||'tu-lieu';
 const suffix=norm(code).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
 return (title+'-'+suffix).slice(0,180).replace(/-+$/,'');
}
function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private,no-store',
 'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'
}})}
export async function handleWorkingCode(request,db,kind,id,operation){
 if(!db||!KINDS.has(kind))return response({error:'not_found'},404);
 if(operation!=='code-preview'&&operation!=='assign-code')return response({error:'not_found'},404);
 if(operation==='code-preview'&&request.method!=='GET')return response({error:'method_not_allowed'},405);
 if(operation==='assign-code'&&request.method!=='POST')return response({error:'method_not_allowed'},405);
 try{
  const table='"'+kind+'"';
  const existing=await db.prepare('SELECT * FROM '+table+' WHERE id=? LIMIT 1').bind(id).first();
  if(!existing)return response({error:'not_found'},404);
  if(existing.archive_code){
   return operation==='code-preview'
     ?response({already_assigned:true,code:existing.archive_code,version:existing.gdd_version})
     :response({error:'archive_code_already_assigned',code_unchanged:true},409);
  }
  if(existing.published===1)return response({error:'published_record_without_code'},409);
  const category=target(kind,existing);
  const {results}=await db.prepare('SELECT archive_code FROM '+table+' WHERE archive_code IS NOT NULL').all();
  let next=1;
  for(const item of results||[]){
    const current=String(item.archive_code||'');
    if(!current.startsWith(category.seriesPrefix))continue;
    const match=CODE_SUFFIX.exec(current);
    if(match)next=Math.max(next,Number(match[1])+1);
  }
  if(next>99999)return response({error:'code_sequence_exhausted'},409);
  const code=category.displayPrefix+'-'+String(next).padStart(5,'0');
  const slug=makeSlug(existing,code);
  if(operation==='code-preview')return response({
   candidate:code,category:category.displayPrefix,slug,version:existing.gdd_version,
   requires_confirmation:true,needs_special_review:category.uncertain,
   classification:category.label,assigned:false
  });
  const raw=await request.text();
  if(raw.length>1024)return response({error:'invalid_request'},400);
  let body;try{body=JSON.parse(raw)}catch{return response({error:'invalid_json'},400)}
  if(!body||Array.isArray(body)||typeof body!=='object'||
     Object.keys(body).some(x=>!['version','code','confirmed'].includes(x))||
     body.confirmed!==true||body.code!==code||
     !Number.isSafeInteger(body.version)||body.version!==existing.gdd_version)
    return response({error:'code_confirmation_or_version_mismatch',expected_code:code},409);
  const newSlug=String(existing.slug||'').startsWith('ban-nhap-')||!existing.slug?slug:existing.slug;
  const now=new Date().toISOString();
  // Atomic compare-and-set, with a second SQL NOT EXISTS guard against simultaneous claims.
  const updated=await db.prepare(
    'UPDATE '+table+' SET archive_code=?,slug=?,updated_at=?,gdd_version=gdd_version+1 '+
    'WHERE id=? AND gdd_version=? AND archive_code IS NULL AND '+
    'NOT EXISTS(SELECT 1 FROM '+table+' WHERE archive_code=?) RETURNING *'
  ).bind(code,newSlug,now,id,body.version,code).first();
  if(!updated)return response({error:'code_taken_or_version_conflict'},409);
  return response({assigned:true,code:updated.archive_code,slug:updated.slug,
    version:updated.gdd_version,audit_trigger:'automatic',published:false});
 }catch(e){
  const reason=String(e?.message||'');
  if(['classification_incomplete','classification_not_recognized','document_folder_required','kind_not_supported'].includes(reason))
    return response({error:reason},409);
  console.error('GDD D1 code assignment failed',String(e?.name||'unknown'));
  return response({error:'code_allocation_unavailable'},503);
 }
}
