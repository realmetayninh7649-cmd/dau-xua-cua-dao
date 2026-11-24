/* Access-protected attachments. Originals private by default; only explicit permission enables public download. */
import {ownerUUID} from './r2-managed.mjs';
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const ROUTE=/^\/api\/v1\/admin\/work\/(people|posts|media|videos|obituaries|documents|gdd_memorials|gdd_audio_programs|gdd_calendar_memorials)\/([a-f0-9-]{36})\/attachments(?:\/([a-f0-9-]{36})\/(download|pages|permission))?$/i;
const MIME={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'};
function reply(data,status=200){return new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}})}
const fields='asset_id,original_name,original_bytes,created_at,public_view,preview_ready,allow_download';
export async function handleAttachments(request,env,path){
 const match=ROUTE.exec(path);
 if(!match||!ID.test(match[2])||(match[3]&&!ID.test(match[3])))return reply({error:'invalid_attachment_route'},404);
 if(!env.DB)return reply({error:'db_unavailable'},503);
 const [,kind,id,downloadId,operation]=match;
 try{
  const owner=ownerUUID(env);
  const parent=await env.DB.prepare('SELECT id FROM "'+kind+'" WHERE id=? LIMIT 1').bind(id).first();
  if(!parent)return reply({error:'record_not_found'},404);
  const where=" WHERE record_kind=? AND record_id=? AND owner_id=? AND role='attachment' AND media_kind='document'";
  if(downloadId){
   if(operation==='permission'){
    if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
    const raw=await request.text();if(raw.length>200)return reply({error:'invalid_body'},400);
    let payload;try{payload=JSON.parse(raw)}catch{return reply({error:'invalid_json'},400)}
    if(!payload||Object.keys(payload).length!==1||typeof payload.allow_download!=='boolean')return reply({error:'invalid_permission'},400);
    const row=await env.DB.prepare('SELECT '+fields+' FROM gdd_r2_assets'+where+' AND asset_id=? LIMIT 1').bind(kind,id,owner,downloadId).first();
    if(!row||!/\.(pdf|doc|docx)$/i.test(row.original_name||''))return reply({error:'attachment_not_found'},404);
    await env.DB.prepare('UPDATE gdd_r2_assets SET allow_download=?'+where+' AND asset_id=?').bind(Number(payload.allow_download),kind,id,owner,downloadId).run();
    const saved=await env.DB.prepare('SELECT '+fields+' FROM gdd_r2_assets'+where+' AND asset_id=? LIMIT 1').bind(kind,id,owner,downloadId).first();
    if(!saved||Number(saved.allow_download)!==Number(payload.allow_download))return reply({error:'permission_not_confirmed'},409);
    return reply({data:saved});
   }
   if(request.method!=='GET')return reply({error:'method_not_allowed'},405);
   const row=await env.DB.prepare('SELECT '+fields+' FROM gdd_r2_assets'+where+' AND asset_id=? LIMIT 1').bind(kind,id,owner,downloadId).first();
   if(!row||!env.GDD_BUCKET)return reply({error:'attachment_not_found'},404);
   const ext=String(row.original_name||'').split('.').pop().toLowerCase();
   if(!Object.hasOwn(MIME,ext))return reply({error:'invalid_document'},409);
   const key='originals/'+owner+'/'+downloadId+'/original.'+ext;
   const metaObject=await env.GDD_BUCKET.get('meta/'+downloadId+'.json');
   const meta=metaObject?await metaObject.json():null;
   if(!meta||meta.id!==downloadId||meta.owner!==owner||meta.kind!=='document'||meta.key!==key||meta.mime!==MIME[ext])return reply({error:'invalid_asset_metadata'},409);
   if(operation==='pages'){
    const q=new URL(request.url).searchParams,start=Number(q.get('start')||1),count=Number(q.get('count')||20);
    if(!Number.isInteger(start)||!Number.isInteger(count)||start<1||count<1||count>20||start+count-1>120)return reply({error:'invalid_page_range'},400);
    const pages=[];
    for(let n=start;n<start+count;n++){
     const head=await env.GDD_BUCKET.head('derivatives/'+downloadId+'/pages/'+n+'.jpg');
     if(head&&head.size>=32&&head.size<=3*1048576&&head.httpMetadata?.contentType==='image/jpeg')pages.push(n);
    }
    return reply({pages});
   }
   const file=await env.GDD_BUCKET.get(key);
   if(!file||file.size!==Number(row.original_bytes))return reply({error:'attachment_not_found'},404);
   const filename=encodeURIComponent(String(row.original_name).slice(0,160)).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16));
   return new Response(file.body,{headers:{...headers,'Content-Type':MIME[ext],'Content-Length':String(file.size),'Content-Disposition':"attachment; filename=\"document."+ext+"\"; filename*=UTF-8''"+filename,'Content-Security-Policy':"default-src 'none'; sandbox"}});
  }
  if(request.method==='GET'){
   const q=new URL(request.url).searchParams,limit=Number(q.get('limit')||100),offset=Number(q.get('offset')||0);
   if(!Number.isSafeInteger(limit)||limit<1||limit>100||!Number.isSafeInteger(offset)||offset<0)return reply({error:'invalid_pagination'},400);
   const {results=[]}=await env.DB.prepare('SELECT '+fields+' FROM gdd_r2_assets'+where+' ORDER BY created_at,asset_id LIMIT ? OFFSET ?').bind(kind,id,owner,limit+1,offset).all();
   return reply({data:results.slice(0,limit),has_next:results.length>limit});
  }
  if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
  if(Number(request.headers.get('Content-Length')||0)>1000)return reply({error:'body_too_large'},413);
  const raw=await request.text();if(raw.length>1000)return reply({error:'body_too_large'},413);
  let input;try{input=JSON.parse(raw)}catch{return reply({error:'invalid_json'},400)}
  if(!input||Object.keys(input).length!==1||!ID.test(input.asset_id||''))return reply({error:'invalid_asset'},400);
  const asset=await env.DB.prepare('SELECT asset_id,record_kind,record_id,role,media_kind,public_view,original_name,original_bytes FROM gdd_r2_assets WHERE asset_id=? AND owner_id=? LIMIT 1').bind(input.asset_id,owner).first();
  if(!asset||asset.media_kind!=='document'||!/\.(pdf|doc|docx)$/i.test(asset.original_name||''))return reply({error:'invalid_document'},409);
  if(asset.record_id===id&&asset.record_kind===kind&&asset.role==='attachment')return reply({data:{asset_id:asset.asset_id},already_attached:true});
  if(asset.record_id||asset.record_kind||asset.role!=='vault'||Number(asset.public_view)!==0)return reply({error:'asset_already_linked_or_published'},409);
  const result=await env.DB.prepare("UPDATE gdd_r2_assets SET record_kind=?,record_id=?,role='attachment' WHERE asset_id=? AND owner_id=? AND record_id IS NULL AND record_kind IS NULL AND role='vault' AND media_kind='document' AND public_view=0").bind(kind,id,input.asset_id,owner).run();
  const confirmed=await env.DB.prepare('SELECT '+fields+' FROM gdd_r2_assets'+where+' AND asset_id=? LIMIT 1').bind(kind,id,owner,input.asset_id).first();
  if(!confirmed)return reply({error:'attachment_not_confirmed'},409);
  return reply({data:confirmed,attached:true},201);
 }catch(e){console.error('Private attachment route',String(e?.name||'error'));return reply({error:'attachment_unavailable'},503)}
}
