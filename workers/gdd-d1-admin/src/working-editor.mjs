/* Dấu Xưa Cửa Đạo — real D1 working-copy editor, Access-protected only.
 * All writes target the separated working DB. No DELETE, no R2 original writes.
 * Nine allowed content groups, version-lock on every update, and D1 audit triggers.
 */
import {handleWorkingCode} from './working-codes.mjs';
const ROOT='/api/v1/admin/work';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const REVISION=/^[a-f0-9]{32}$/i;
const LIMIT=110000;
const SCHEMAS=Object.freeze({
 people:{title:'full_name',fields:['full_name','secular_name','rank','branch','subgroup','gender','years','birthplace','summary','biography','date_notes','sources','image_url','verified','published','sort_order','death_lunar_day','death_lunar_month','death_lunar_leap','death_solar_date']},
 posts:{title:'title',fields:['title','category','summary','body','sources','person_id','cover_url','verified','published']},
 media:{title:'title',fields:['title','category','caption','person_id','sources','image_url','published']},
 videos:{title:'title',fields:['title','summary','body','video_url','cover_url','sources','person_id','published']},
 obituaries:{title:'title',fields:['title','deceased_name','memorial_date','summary','body','cover_url','sources','person_id','published']},
 documents:{title:'title',fields:['title','document_number','document_date','summary','body','file_url','sources','person_id','subfolder_code','published']},
 gdd_memorials:{title:'title',fields:['title','person_name','rank_title','death_date','anniversary_date','summary','body','portrait_url','sources','published']},
 gdd_audio_programs:{title:'title',fields:['title','category','summary','body','cover_url','audio_url','episode_number','duration_seconds','published_date','published']},
 gdd_calendar_memorials:{title:'full_name',fields:['full_name','rank','calendar_system','lunar_day','lunar_month','lunar_leap','solar_day','solar_month','death_year','image_url','source_note','description','linked_person_id','published']}
});
const BOOL=new Set(['verified','published','death_lunar_leap','lunar_leap']);
const NUMERIC=new Set(['sort_order','death_lunar_day','death_lunar_month','lunar_day','lunar_month','solar_day','solar_month','death_year','episode_number','duration_seconds']);
const URLS=new Set(['image_url','cover_url','video_url','file_url','portrait_url','audio_url']);
const UUID_FIELDS=new Set(['person_id','linked_person_id']);
// Historical document dates are verbatim text, not Gregorian timestamps.
const DATES=new Set(['death_solar_date','published_date']);
const LENGTHS={full_name:180,title:220,rank:120,branch:100,subgroup:120,gender:40,
  secular_name:160,years:80,birthplace:200,category:120,
  summary:6000,caption:15000,biography:65000,body:65000,description:14000,
  date_notes:16000,sources:15000,source_note:12000};
function response(value,status=200){return new Response(JSON.stringify(value),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex,nofollow'}})}
async function body(req){
 const len=Number(req.headers.get('Content-Length')||0);
 if(!Number.isSafeInteger(len)||len>LIMIT)throw Error('invalid_body_size');
 const raw=await req.text();if(raw.length>LIMIT)throw Error('invalid_body_size');
 let data;try{data=JSON.parse(raw)}catch{throw Error('invalid_json')}
 if(!data||Array.isArray(data)||typeof data!=='object')throw Error('invalid_json');
 return data;
}
function normalizeEditorialDate(value){
 const text=String(value??'').trim();if(!text)return null;
 const iso=/^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text),local=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(text);
 if(!iso&&!local)throw Error('invalid_date');
 const y=Number(iso?iso[1]:local[3]),m=Number(iso?iso[2]:local[2]),d=Number(iso?iso[3]:local[1]);
 if(y<1000||y>9999||m<1||m>12||d<1||d>31)throw Error('invalid_date');
 const dt=new Date(Date.UTC(y,m-1,d));if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)throw Error('invalid_date');
 return String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
function normalValue(field,value){
 if(value===null)return null;
 if(BOOL.has(field)){
   if(typeof value!=='boolean')throw Error('invalid_boolean');
   return Number(value);
 }
 if(NUMERIC.has(field)){
   if(!Number.isSafeInteger(value)||value<0||value>10000000)throw Error('invalid_number');
   if(['lunar_day','solar_day','death_lunar_day'].includes(field)&&value>31)throw Error('invalid_day');
   if(['lunar_month','solar_month','death_lunar_month'].includes(field)&&value>12)throw Error('invalid_month');
   return value;
 }
 if(typeof value!=='string')throw Error('invalid_text');
 if(field==='subfolder_code'&&value&&!['HCĐ','HTĐ','CTĐ','PT','VKNN','VKVN','CQK'].includes(value))throw Error('invalid_document_folder');
 if(value.length>(LENGTHS[field]||1500))throw Error('invalid_text_length');
 if(URLS.has(field)&&value){
   let u;try{u=new URL(value)}catch{throw Error('invalid_url')}
   if(u.protocol!=='https:'||u.username||u.password||value.length>1500)
     throw Error('invalid_url');
 }
 if(UUID_FIELDS.has(field)&&value&&!UUID.test(value))throw Error('invalid_uuid_field');
 if(DATES.has(field))return normalizeEditorialDate(value);
 return value;
}
function normalizeInput(kind,payload,{creation=false}={}){
 const schema=SCHEMAS[kind];
 if(!schema)throw Error('invalid_kind');
 const keys=Object.keys(payload);
 const allowed=creation?['fields']:['fields','version'];
 if(keys.some(k=>!allowed.includes(k)))throw Error('invalid_fields');
 const input=payload.fields;
 if(!input||Array.isArray(input)||typeof input!=='object')throw Error('invalid_fields');
 const names=Object.keys(input);
 if(!names.length||names.some(x=>!schema.fields.includes(x)))throw Error('invalid_fields');
 const clean={};
 for(const k of names)clean[k]=normalValue(k,input[k]);
 if(creation){
   if(typeof clean[schema.title]!=='string'||!clean[schema.title].trim())throw Error('title_required');
   if(clean.published!==undefined&&clean.published!==0)throw Error('drafts_only');
   clean.published=0;
 }
 return clean;
}
function whereKind(kind){return Object.hasOwn(SCHEMAS,kind)}
function trashPredicate(kind,trashed=false){
 return (trashed?'EXISTS':'NOT EXISTS')+"(SELECT 1 FROM gdd_editor_trash t WHERE t.kind='"+kind+"' AND t.record_id=\""+kind+"\".id AND t.trashed=1)";
}
async function setTrash(request,db,kind,id,trashed){
 if(request.method!=='POST')return response({error:'method_not_allowed'},405);
 const payload=await body(request);
 if(Object.keys(payload).length!==1||!Number.isSafeInteger(payload.version)||payload.version<1)return response({error:'invalid_version'},400);
 const table='"'+kind+'"',time=new Date().toISOString(),token=crypto.randomUUID();
 // Both statements commit atomically; version and state are checked before changing the marker.
 const marker=db.prepare("INSERT INTO gdd_editor_trash(kind,record_id,trashed,changed_at,operation_id) SELECT ?,id,?,?,? FROM "+table+" WHERE id=? AND gdd_version=? AND "+trashPredicate(kind,!trashed)+" ON CONFLICT(kind,record_id) DO UPDATE SET trashed=excluded.trashed,changed_at=excluded.changed_at,operation_id=excluded.operation_id")
  .bind(kind,Number(trashed),time,token,id,payload.version);
 const update=db.prepare("UPDATE "+table+" SET published=0,updated_at=?,gdd_version=gdd_version+1 WHERE id=? AND gdd_version=? AND EXISTS(SELECT 1 FROM gdd_editor_trash t WHERE t.kind=? AND t.record_id=? AND t.operation_id=?) RETURNING *")
  .bind(time,id,payload.version,kind,id,token);
 const results=await db.batch([marker,update]);
 const row=results[1]?.results?.[0];
 if(!row)return response({error:'version_or_trash_conflict'},409);
 return response({data:row,trashed});
}
async function list(db,kind,params){
 const limit=Number(params.get('limit')||20),offset=Number(params.get('offset')||0);
 if(!Number.isInteger(limit)||limit<1||limit>50||!Number.isInteger(offset)||offset<0||offset>5000)
   return response({error:'invalid_pagination'},400);
 const title=SCHEMAS[kind].title;
 const trash=params.get('trash')==='1',filter=' WHERE '+trashPredicate(kind,trash)+(!trash&&params.get('draft')==='1'?' AND published=0':'');
 const sql=kind==='gdd_calendar_memorials'
   ? 'SELECT id,NULL AS slug,full_name AS title,published,created_at,updated_at,gdd_version '+
       'FROM gdd_calendar_memorials'+filter+' ORDER BY created_at DESC LIMIT ? OFFSET ?'
   : 'SELECT id,slug,"'+title+'" AS title,published,created_at,updated_at,gdd_version FROM "'+kind+
       '"'+filter+' ORDER BY created_at DESC LIMIT ? OFFSET ?';
 const {results}=await db.prepare(sql).bind(limit,offset).all();
 return response({kind,data:results||[],limit,offset,write_enabled:true});
}
export async function handleWorkingEditor(request,db,path){
 if(!db)return response({error:'working_database_unconfigured'},503);
 const parts=path.slice(ROOT.length).split('/').filter(Boolean);
 if(parts.length<1||parts.length>3)return response({error:'not_found'},404);
 const kind=parts[0];
 if(!whereKind(kind))return response({error:'invalid_kind'},404);
 try{
   if(parts.length===1){
     if(request.method==='GET')return list(db,kind,new URL(request.url).searchParams);
     if(request.method!=='POST')return response({error:'method_not_allowed'},405);
     const payload=await body(request),entry=normalizeInput(kind,payload,{creation:true});
     const id=crypto.randomUUID(),now=new Date().toISOString();
     const cols=['id','created_at','updated_at','published','gdd_version'];
     const values=[id,now,now,0,1];
     if(kind!=='gdd_calendar_memorials'){
       cols.push('slug');values.push('ban-nhap-'+id.replaceAll('-',''));
     }
     for(const [col,val] of Object.entries(entry)){
       if(col==='published')continue;
       cols.push(col);values.push(val);
     }
     const fields=cols.map(x=>'"'+x+'"').join(',');
     const sql='INSERT INTO "'+kind+'" ('+fields+') VALUES('+cols.map(()=>'?').join(',')+') RETURNING *';
     const row=await db.prepare(sql).bind(...values).first();
     return response({data:row,mode:'working-d1',published:false},201);
   }
   const id=parts[1];
   if(!UUID.test(id))return response({error:'invalid_id'},400);
   if(parts.length===3&&['trash','untrash'].includes(parts[2]))return await setTrash(request,db,kind,id,parts[2]==='trash');
   if(parts.length===2&&request.method==='GET'){
     const row=await db.prepare('SELECT * FROM "'+kind+'" WHERE id=? AND '+trashPredicate(kind)+' LIMIT 1').bind(id).first();
     if(row&&kind==='documents'){
       const cover=await db.prepare("SELECT asset_id FROM gdd_r2_assets WHERE record_kind='documents' AND record_id=? AND role='cover' AND media_kind='image' AND public_view=1 AND preview_ready=1 ORDER BY view_updated_at DESC,created_at DESC,asset_id DESC LIMIT 1").bind(id).first();
       if(cover)row.cover_url='https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/'+cover.asset_id+'/preview';
     }
     return response(row?{data:row}:{error:'not_found'},row?200:404);
   }
   if(parts.length===3&&(parts[2]==='code-preview'||parts[2]==='assign-code')){
     const marker=await db.prepare('SELECT 1 FROM gdd_editor_trash WHERE kind=? AND record_id=? AND trashed=1').bind(kind,id).first();
     if(marker)return response({error:'record_in_trash'},409);
     return handleWorkingCode(request,db,kind,id,parts[2]);
   }
   if(parts.length===3&&parts[2]==='history'){
     if(request.method!=='GET')return response({error:'method_not_allowed'},405);
     const {results}=await db.prepare(
       'SELECT revision_id,action,version_from,version_to,changed_at,before_json,after_json '+
       'FROM gdd_v2_editor_revisions WHERE kind=? AND record_id=? ORDER BY version_to DESC LIMIT 40'
     ).bind(kind,id).all();
     return response({kind,id,data:results||[]});
   }
   const isRestore=parts.length===3&&parts[2]==='restore';
   if(parts.length===3&&!isRestore)return response({error:'not_found'},404);
   if(isRestore?request.method!=='POST':request.method!=='PATCH')
     return response({error:'method_not_allowed'},405);
   const payload=await body(request);
   const before=await db.prepare('SELECT * FROM "'+kind+'" WHERE id=? AND '+trashPredicate(kind)+' LIMIT 1').bind(id).first();
   if(!before)return response({error:'not_found'},404);
   if(!Number.isSafeInteger(payload.version)||payload.version<1||payload.version!==before.gdd_version)
     return response({error:'version_conflict',current_version:before.gdd_version},409);
   let fields;
   if(isRestore){
     if(Object.keys(payload).some(x=>!['version','revision_id'].includes(x))||
       !REVISION.test(payload.revision_id||''))return response({error:'invalid_revision_id'},400);
     const old=await db.prepare(
       'SELECT before_json FROM gdd_v2_editor_revisions WHERE kind=? AND record_id=? AND revision_id=?'
     ).bind(kind,id,payload.revision_id).first();
     if(!old||!old.before_json)return response({error:'revision_not_found'},404);
     let parsed;try{parsed=JSON.parse(old.before_json)}catch{throw Error('invalid_revision')}
     const values={};
     for(const field of SCHEMAS[kind].fields){
       if(!Object.hasOwn(parsed,field))continue;
       const v=parsed[field];
       values[field]=BOOL.has(field)&&v!==null?Boolean(v):v;
     }
     fields=normalizeInput(kind,{fields:values});
   }else fields=normalizeInput(kind,payload);
   if(Object.hasOwn(fields,'published')&&fields.published===1){
     // IDs/codes are allocated by the separate canonical registry; never mint or alter archival codes.
     const canonical=['people','posts','media','videos','obituaries','documents'].includes(kind);
     if(canonical && !before.archive_code)return response({error:'archive_code_required_before_publication'},409);
   }
   const keys=Object.keys(fields);
   const sql='UPDATE "'+kind+'" SET '+keys.map(col=>'"'+col+'"=?').join(',')+
     ',updated_at=?,gdd_version=gdd_version+1 WHERE id=? AND gdd_version=? AND '+trashPredicate(kind)+' RETURNING *';
   const row=await db.prepare(sql).bind(...keys.map(k=>fields[k]),new Date().toISOString(),id,payload.version).first();
   if(!row)return response({error:'version_conflict'},409);
   return response({data:row,mode:'working-d1',audit_trigger:'automatic',restore:isRestore});
 }catch(e){
   const msg=String(e?.message||'');
   if(/^(invalid_|title_required|drafts_only)/.test(msg))return response({error:msg},400);
   console.error('D1 working editor failed',String(e?.name||'unknown'));
   return response({error:'editor_unavailable'},503);
 }
}