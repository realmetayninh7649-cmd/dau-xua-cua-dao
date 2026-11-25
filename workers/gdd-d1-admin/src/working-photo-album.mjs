/* Access-only album upload association, working D1 only.
 * Existing R2 originals remain PRIVATE; this route does not read or write any
 * R2 objects. Preview links must be actively approved via R2 publication first.
 */
import {ownerUUID} from './r2-managed.mjs';
const ROUTE=/^\/api\/v1\/admin\/work\/(people|posts|media|videos|obituaries|documents|gdd_memorials|gdd_audio_programs|gdd_calendar_memorials)\/([a-f0-9-]{36})\/photos$/i;
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const BASE='https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/';
function reply(data,status=200){
 return new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private,no-store',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'
 }});
}
// Only modify the album index; never delete any R2 object or original.
async function editPhoto(env,kind,recordId,input){
 const db=env.DB,id=input.photo_id,action=input.action;
 const allowed={caption:['caption'],replace:['asset_id'],remove:[],move:['direction']};
 if(!Object.hasOwn(allowed,action)||!ID.test(id||'')||typeof input.expected_url!=='string'||input.expected_url.length>2000||Object.keys(input).some(k=>!['action','photo_id','expected_url',...allowed[action]].includes(k)))return reply({error:'invalid_photo_action'},400);
 const lookup=()=>db.prepare('SELECT id,image_url,caption,sort_order,photo_code FROM archive_gallery_images WHERE owner_kind=? AND owner_id=? AND id=?').bind(kind,recordId,id).first();
 const row=await lookup();
 if(!row)return action==='remove'?reply({removed:true,photo_id:id,original_preserved:true}):reply({error:'photo_not_found'},404);
 if(row.image_url!==input.expected_url){
  if(action==='replace'&&ID.test(input.asset_id||'')&&row.image_url===BASE+input.asset_id+'/preview')return reply({data:row,original_preserved:true});
  return reply({error:'photo_changed_reload'},409);
 }
 if(action==='caption'){
  if(typeof input.caption!=='string'||input.caption.length>600)return reply({error:'invalid_caption'},400);
  const saved=await db.prepare('UPDATE archive_gallery_images SET caption=? WHERE owner_kind=? AND owner_id=? AND id=? AND image_url=? RETURNING id,image_url,caption,sort_order,photo_code').bind(input.caption.trim(),kind,recordId,id,row.image_url).first();
  return saved?reply({data:saved}):reply({error:'photo_changed_reload'},409);
 }
 if(action==='remove'){
  const removed=await db.prepare('DELETE FROM archive_gallery_images WHERE owner_kind=? AND owner_id=? AND id=? AND image_url=? RETURNING id').bind(kind,recordId,id,row.image_url).first();
  return removed?reply({removed:true,photo_id:id,original_preserved:true}):reply({error:'photo_changed_reload'},409);
 }
 if(action==='move'){
  if(![-1,1].includes(input.direction))return reply({error:'invalid_direction'},400);
  // Stable ranking also handles migrated rows with null or duplicate sort positions.
  const sql='WITH ordered AS MATERIALIZED (SELECT id,ROW_NUMBER() OVER (ORDER BY sort_order ASC,created_at ASC,id ASC) AS pos FROM archive_gallery_images WHERE owner_kind=? AND owner_id=?), target AS MATERIALIZED (SELECT pos FROM ordered WHERE id=?) UPDATE archive_gallery_images SET sort_order=(SELECT CASE WHEN o.pos=t.pos THEN t.pos+? WHEN o.pos=t.pos+? THEN t.pos ELSE o.pos END FROM ordered o CROSS JOIN target t WHERE o.id=archive_gallery_images.id) WHERE owner_kind=? AND owner_id=? AND EXISTS(SELECT 1 FROM ordered o CROSS JOIN target t WHERE o.pos=t.pos+?) AND EXISTS(SELECT 1 FROM archive_gallery_images x WHERE x.id=? AND x.owner_kind=? AND x.owner_id=? AND x.image_url=?)';
  await db.prepare(sql).bind(kind,recordId,id,input.direction,input.direction,kind,recordId,input.direction,id,kind,recordId,row.image_url).run();
  return reply({data:await lookup()});
 }
 if(!ID.test(input.asset_id||''))return reply({error:'invalid_asset_id'},400);
 const owner=ownerUUID(env),assetId=input.asset_id,url=BASE+assetId+'/preview';
 const asset=await db.prepare('SELECT asset_id,owner_id,record_kind,record_id,media_kind,public_view,preview_ready FROM gdd_r2_assets WHERE asset_id=?').bind(assetId).first();
 if(!asset||asset.owner_id!==owner||asset.media_kind!=='image'||Number(asset.public_view)!==1||Number(asset.preview_ready)!==1)return reply({error:'preview_not_approved'},409);
 if(asset.record_id||asset.record_kind)return reply({error:'asset_already_linked_elsewhere'},409);
 const results=await db.batch([
  db.prepare("UPDATE gdd_r2_assets SET record_kind=?,record_id=?,role='album' WHERE asset_id=? AND owner_id=? AND record_id IS NULL AND record_kind IS NULL AND public_view=1 AND preview_ready=1 AND EXISTS(SELECT 1 FROM archive_gallery_images WHERE owner_kind=? AND owner_id=? AND id=? AND image_url=?) AND NOT EXISTS(SELECT 1 FROM archive_gallery_images WHERE owner_kind=? AND owner_id=? AND image_url=?)").bind(kind,recordId,assetId,owner,kind,recordId,id,row.image_url,kind,recordId,url),
  db.prepare("UPDATE archive_gallery_images SET image_url=? WHERE owner_kind=? AND owner_id=? AND id=? AND image_url=? AND EXISTS(SELECT 1 FROM gdd_r2_assets WHERE asset_id=? AND owner_id=? AND record_kind=? AND record_id=? AND role='album') AND NOT EXISTS(SELECT 1 FROM archive_gallery_images WHERE owner_kind=? AND owner_id=? AND image_url=?) RETURNING id,image_url,caption,sort_order,photo_code").bind(url,kind,recordId,id,row.image_url,assetId,owner,kind,recordId,kind,recordId,url)
 ]);
 const saved=results[1]?.results?.[0];
 return saved?reply({data:saved,original_preserved:true}):reply({error:'photo_changed_reload'},409);
}
export async function handleAlbumPhotos(request,env,path){
 const match=ROUTE.exec(path);
 if(!match||!ID.test(match[2]))return reply({error:'invalid_album'},404);
 if(!env.DB)return reply({error:'working_database_unavailable'},503);
 const kind=match[1],recordId=match[2];
 if(!['GET','POST'].includes(request.method))return reply({error:'method_not_allowed'},405);
 try{
  const owner=await env.DB.prepare('SELECT id FROM "'+kind+'" WHERE id=? LIMIT 1').bind(recordId).first();
  if(!owner)return reply({error:'record_not_found'},404);
  if(request.method==='GET'){
   const params=new URL(request.url).searchParams;
   const limit=Number(params.get('limit')||100),offset=Number(params.get('offset')||0);
   if(!Number.isSafeInteger(limit)||limit<1||limit>100||!Number.isSafeInteger(offset)||offset<0)
     return reply({error:'invalid_pagination'},400);
   const {results}=await env.DB.prepare(
    'SELECT id,image_url,caption,sort_order,photo_code FROM archive_gallery_images '+
    'WHERE owner_kind=? AND owner_id=? ORDER BY sort_order ASC,created_at ASC,id ASC LIMIT ? OFFSET ?'
   ).bind(kind,recordId,limit+1,offset).all();
   return reply({data:(results||[]).slice(0,limit),kind,record_id:recordId,limit,offset,has_next:(results||[]).length>limit});
  }
  const len=Number(request.headers.get('Content-Length')||0);
  if(!Number.isSafeInteger(len)||len>2500)return reply({error:'invalid_body_size'},413);
  const raw=await request.text();
  if(raw.length>2500)return reply({error:'invalid_body_size'},413);
  let input;try{input=JSON.parse(raw)}catch{return reply({error:'invalid_json'},400)}
  if(!input||Array.isArray(input)||typeof input!=='object'
    )return reply({error:'invalid_fields'},400);
  if(Object.hasOwn(input,'action'))return await editPhoto(env,kind,recordId,input);
  if(Object.keys(input).some(k=>!['asset_id','caption','role'].includes(k)))return reply({error:'invalid_fields'},400);
  const id=input.asset_id;
  if(!ID.test(id||''))return reply({error:'invalid_asset_id'},400);
  if(typeof input.caption!=='string'||input.caption.length>600)
    return reply({error:'invalid_caption'},400);
  if(input.role!==undefined&&(input.role!=='cover'||kind!=='documents'))return reply({error:'invalid_role'},400);
  const caption=input.caption.trim();
  const accessOwner=ownerUUID(env);
  const asset=await env.DB.prepare(
   'SELECT asset_id,owner_id,record_kind,record_id,media_kind,public_view,preview_ready '+
   'FROM gdd_r2_assets WHERE asset_id=? LIMIT 1'
  ).bind(id).first();
  if(!asset||asset.owner_id!==accessOwner||asset.media_kind!=='image'
     ||Number(asset.public_view)!==1||Number(asset.preview_ready)!==1)
    return reply({error:'preview_not_approved'},409);
  if(asset.record_id&&(asset.record_id!==recordId||asset.record_kind!==kind))
    return reply({error:'asset_already_linked_elsewhere'},409);
  const url=BASE+id+'/preview';
  if(input.role==='cover'){
   await env.DB.prepare("UPDATE gdd_r2_assets SET record_kind=?,record_id=?,role='cover',view_updated_at=? WHERE asset_id=? AND owner_id=? AND media_kind='image' AND public_view=1 AND preview_ready=1 AND (record_id IS NULL OR (record_id=? AND record_kind=?))").bind(kind,recordId,new Date().toISOString(),id,accessOwner,recordId,kind).run();
   const saved=await env.DB.prepare("SELECT asset_id FROM gdd_r2_assets WHERE asset_id=? AND record_kind=? AND record_id=? AND role='cover' LIMIT 1").bind(id,kind,recordId).first();
   if(!saved)return reply({error:'cover_not_confirmed'},409);
   return reply({data:{image_url:url,asset_id:id},attached:true},201);
  }
  const existing=await env.DB.prepare(
   'SELECT id,image_url,caption,sort_order FROM archive_gallery_images '+
   'WHERE owner_kind=? AND owner_id=? AND image_url=? LIMIT 1'
  ).bind(kind,recordId,url).first();
  if(existing)return reply({data:existing,already_attached:true});
  const aggregate=await env.DB.prepare(
   'SELECT COUNT(*) AS n,MAX(sort_order) AS last_position '+
   'FROM archive_gallery_images WHERE owner_kind=? AND owner_id=?'
  ).bind(kind,recordId).first();
  const position=Math.max(0,Number(aggregate?.last_position||0))+1;
  if(!Number.isSafeInteger(position))
    return reply({error:'invalid_sort_order'},409);
  const photoId=crypto.randomUUID();
  await env.DB.prepare(
   'INSERT INTO archive_gallery_images (id,owner_kind,owner_id,image_url,caption,sort_order,created_at) '+
   'SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS ('+
     'SELECT 1 FROM archive_gallery_images WHERE owner_kind=? AND owner_id=? AND image_url=?)'
  ).bind(photoId,kind,recordId,url,caption,position,new Date().toISOString(),kind,recordId,url).run();
  await env.DB.prepare(
   "UPDATE gdd_r2_assets SET record_kind=?,record_id=?,role='album' "+
   "WHERE asset_id=? AND owner_id=? AND (record_id IS NULL OR record_id=?)"
  ).bind(kind,recordId,id,accessOwner,recordId).run();
  const inserted=await env.DB.prepare(
    'SELECT id,image_url,caption,sort_order FROM archive_gallery_images '+
    'WHERE owner_kind=? AND owner_id=? AND image_url=? LIMIT 1'
  ).bind(kind,recordId,url).first();
  if(!inserted)return reply({error:'album_index_unconfirmed'},503);
  return reply({data:inserted,attached:true,original_preserved:true},201);
 }catch(e){
  console.error('D1 album attachment failed',String(e?.name||'unknown'));
  return reply({error:'album_unavailable'},503);
 }
}
