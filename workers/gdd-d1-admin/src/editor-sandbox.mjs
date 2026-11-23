/* Access-protected EDIT-ONLY sandbox. Never pass the real restored D1 as db.
 * All test content is synthetic; no hard-delete, no uploaded files.
 * Audit trigger in sandbox-schema.sql records each optimistic UPDATE atomically.
 */
const PREFIX='/api/v1/admin/sandbox';
const VALID_KIND=new Set(['people','posts','documents','media']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const AUDIT_ID=/^[a-f0-9]{32}$/i;
function result(data,status=200){
 return new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
  'X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer'
 }});
}
async function readBody(req){
 const length=Number(req.headers.get('Content-Length')||0);
 if(!Number.isFinite(length)||length>32768)throw Error('invalid_body');
 const raw=await req.text();
 if(raw.length>32768)throw Error('invalid_body');
 let obj;try{obj=JSON.parse(raw)}catch{throw Error('invalid_json')}
 if(!obj||Array.isArray(obj)||typeof obj!=='object')throw Error('invalid_json');
 return obj;
}
function allowedKeys(obj,keys){
 return Object.keys(obj).every(k=>keys.includes(k));
}
function cleanText(v,max,required=false){
 if(typeof v!=='string'||v.length>max || (required && !v.trim()))throw Error('invalid_text');
 return v.trim();
}
function cleanData(obj,previous=null){
 if(!allowedKeys(obj,['kind','title','summary','body','published','version']))throw Error('invalid_fields');
 const kind=previous?.kind||obj.kind;
 if(!VALID_KIND.has(kind)||(previous&&obj.kind!==undefined&&obj.kind!==kind))throw Error('invalid_kind');
 return {
  kind,
  title:cleanText(obj.title??previous?.title,160,true),
  summary:cleanText(obj.summary??previous?.summary??'',2000),
  body:cleanText(obj.body??previous?.body??'',16000),
  published:obj.published===undefined?Number(previous?.published||0):(typeof obj.published==='boolean'?Number(obj.published):NaN)
 };
}
function noWrite(method){return result({error:'method_not_allowed',hard_delete_disabled:true},405)}
export async function handleEditorSandbox(request,db,path){
 if(!db)return result({error:'sandbox_not_configured'},503);
 const suffix=path.slice(PREFIX.length),segments=suffix.split('/').filter(Boolean);
 if(segments.length>2)return result({error:'not_found'},404);
 try{
  if(segments.length===0){
   if(request.method==='GET'){
    const {results}=await db.prepare(
      'SELECT id,kind,title,summary,body,published,version,updated_at FROM sandbox_items ORDER BY updated_at DESC LIMIT 50'
    ).all();
    return result({mode:'synthetic-sandbox-only',data:results||[],real_archive_unmodified:true});
   }
   if(request.method!=='POST')return noWrite(request.method);
   const body=await readBody(request);
   const entry=cleanData(body);
   const id=crypto.randomUUID(),time=new Date().toISOString();
   await db.prepare('INSERT INTO sandbox_items(id,kind,title,summary,body,published,version,updated_at) VALUES(?,?,?,?,?,?,1,?)')
     .bind(id,entry.kind,entry.title,entry.summary,entry.body,0,time).run();
   return result({id,version:1,mode:'synthetic-sandbox-only',published:false},201);
  }
  const id=segments[0];
  if(!UUID.test(id))return result({error:'invalid_record_id'},400);
  if(segments.length===2&&segments[1]==='history'){
   if(request.method!=='GET')return noWrite(request.method);
   const {results}=await db.prepare(
     'SELECT audit_id,version_from,version_to,changed_at,before_json,after_json FROM sandbox_revisions WHERE record_id=? ORDER BY version_to DESC LIMIT 30'
   ).bind(id).all();
   return result({data:results||[],mode:'synthetic-sandbox-only'});
  }
  if(segments.length===2&&segments[1]!=='restore')return result({error:'not_found'},404);
  if(segments.length===1 && request.method==='GET'){
   const row=await db.prepare('SELECT * FROM sandbox_items WHERE id=?').bind(id).first();
   return result(row?{data:row}:{error:'not_found'},row?200:404);
  }
  const restoring=segments.length===2;
  if(restoring?request.method!=='POST':request.method!=='PATCH')return noWrite(request.method);
  const payload=await readBody(request);
  const before=await db.prepare('SELECT * FROM sandbox_items WHERE id=?').bind(id).first();
  if(!before)return result({error:'not_found'},404);
  if(!Number.isSafeInteger(payload.version)||payload.version<1||payload.version!==before.version)
    return result({error:'version_conflict',current_version:before.version},409);
  let data;
  if(restoring){
   if(!allowedKeys(payload,['version','audit_id'])||!AUDIT_ID.test(payload.audit_id||''))
     return result({error:'invalid_restore_request'},400);
   const revision=await db.prepare(
     'SELECT before_json FROM sandbox_revisions WHERE audit_id=? AND record_id=?'
   ).bind(payload.audit_id,id).first();
   if(!revision)return result({error:'revision_not_found'},404);
   let old;try{old=JSON.parse(revision.before_json)}catch{throw Error('invalid_revision')}
   data=cleanData(old,before);
   data.kind=before.kind;
  }else data=cleanData(payload,before);
  if(!Number.isInteger(data.published)||![0,1].includes(data.published))
    return result({error:'invalid_publication'},400);
  const updated=await db.prepare(
    'UPDATE sandbox_items SET title=?,summary=?,body=?,published=?,version=version+1,updated_at=? WHERE id=? AND version=? RETURNING *'
  ).bind(data.title,data.summary,data.body,data.published,new Date().toISOString(),id,payload.version).first();
  if(!updated)return result({error:'version_conflict'},409);
  return result({data:updated,mode:'synthetic-sandbox-only',audit_trigger:'automatic'});
 }catch(e){
  const msg=String(e?.message||'');
  if(msg.startsWith('invalid_'))return result({error:msg},400);
  console.error('D1 editor sandbox operation error',String(e?.name||'unknown'));
  return result({error:'sandbox_unavailable'},503);
 }
}
