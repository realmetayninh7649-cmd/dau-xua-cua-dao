/* Access-only album upload association, working D1 only.
 * Existing R2 originals remain PRIVATE; this route does not read or write any
 * R2 objects. Preview links must be actively approved via R2 publication first.
 */
import {ownerUUID} from './r2-managed.mjs';
const ROUTE=/^\/api\/v1\/admin\/work\/(people|posts|media|videos|obituaries|documents)\/([a-f0-9-]{36})\/photos$/i;
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const BASE='https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/';
function reply(data,status=200){
 return new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private,no-store',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'
 }});
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
    ||Object.keys(input).some(k=>!['asset_id','caption'].includes(k)))
    return reply({error:'invalid_fields'},400);
  const id=input.asset_id;
  if(!ID.test(id||''))return reply({error:'invalid_asset_id'},400);
  if(typeof input.caption!=='string'||input.caption.length>600)
    return reply({error:'invalid_caption'},400);
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
