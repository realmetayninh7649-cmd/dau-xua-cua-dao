import {handleR2AccessApi,handleR2AccessView} from '../../gdd-r2-gateway/src/index.mjs';
/* Cloudflare Access verified original/derivative R2 routing.
 * Reuses existing gateway core; does NOT authenticate with Supabase.
 * Identical R2 original paths; no public endpoint for original bytes.
 */
const PREFIX='/api/v1/admin/r2/managed';
const ALLOWED=/^\/v1\/(?:uploads\/(?:small|start|part|complete)|assets\/[a-f0-9-]{36}(?:\/(?:preview|download|publication|page\/[1-9]\d{0,2}))?)$/i;
const VIEW=/^\/v1\/assets\/[a-f0-9-]{36}\/(?:publication|page\/[1-9]\d{0,2})$/i;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function ownerUUID(env){
 const x=env.ADMIN_EMAIL_SHA256;
 if(typeof x!=='string'||!/^[a-f0-9]{64}$/.test(x))throw Error('missing_owner');
 const out=x.slice(0,8)+'-'+x.slice(8,12)+'-4'+x.slice(13,16)+'-a'+x.slice(17,20)+'-'+x.slice(20,32);
 if(!UUID.test(out))throw Error('invalid_owner');return out;
}
function json(value,status=200){
 return new Response(JSON.stringify(value),{status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store',
  'X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer'
 }});
}
async function indexAsset(env,id,owner){
 if(!env.DB)throw Error('db_unconfigured');
 const obj=await env.GDD_BUCKET.get('meta/'+id+'.json');
 if(!obj)throw Error('missing_r2_meta');
 const meta=await obj.json();
 if(meta.id!==id||meta.owner!==owner||meta.published!==false)
   throw Error('invalid_r2_meta');
 const time=new Date().toISOString();
 await env.DB.prepare(
  'INSERT OR IGNORE INTO gdd_r2_assets(asset_id,owner_id,record_kind,record_id,role,original_name,original_bytes,media_kind,preview_ready,download_ready,created_at,public_view,allow_download) VALUES(?,?,NULL,NULL,?,?,?, ?,0,0,?,0,0)'
 ).bind(id,owner,'vault',meta.originalName,meta.originalBytes,meta.kind,time).run();
}
export async function handleManagedR2(request,env,path){
 if(!env.GDD_BUCKET)return json({error:'bucket_missing'},503);
 const suffix=path.slice(PREFIX.length), url=new URL(request.url);
 if(!ALLOWED.test(suffix)||url.pathname!==path)
   return json({error:'not_found'},404);
 if(request.method==='DELETE')return json({error:'delete_disabled'},405);
 try{
  const owner=ownerUUID(env),user={id:owner};
  const proxyURL=new URL(request.url);proxyURL.pathname=suffix;
  // Reuse established private R2 handling: multipart, size checks, headers,
  // JPEG/WEBP derivatives, PDF/DOCX individual pages and publication checks.
  const response=VIEW.test(suffix)
    ? await handleR2AccessView(request,env,suffix,null,user)
    : await handleR2AccessApi(request,env,proxyURL,null,user);
  if(response.status===201 && (
     (suffix==='/v1/uploads/small'&&request.method==='PUT')||
     (suffix==='/v1/uploads/complete'&&request.method==='POST'))){
    const payload=await response.clone().json();
    if(!UUID.test(payload.id||''))return json({error:'invalid_asset_response'},503);
    try{await indexAsset(env,payload.id,owner)}catch(e){
      console.error('R2 stored private, D1 index pending',String(e?.name||'error'));
      return json({error:'r2_original_preserved_but_index_pending',
       id:payload.id,original_private:true},503);
    }
  }
  // Update the working D1 index only after metadata is approved/changed.
  const pub=/^\/v1\/assets\/([a-f0-9-]{36})\/publication$/i.exec(suffix);
  if(pub && request.method==='POST' && response.ok){
    const value=await response.clone().json();
    const view=Boolean(value.published);
    const id=pub[1],metaObject=await env.GDD_BUCKET.get('meta/'+id+'.json');
    if(metaObject){
      const m=await metaObject.json();
      if(m.owner===owner){
        await env.DB.prepare("UPDATE gdd_r2_assets SET public_view=?,allow_download=CASE WHEN role='attachment' AND media_kind='document' THEN allow_download ELSE ? END,preview_ready=?,download_ready=? WHERE asset_id=? AND owner_id=?")
          .bind(Number(view),Number(m.allowDownload===true),
            Number(m.preview===true||m.pageCount>0),Number(m.download===true),
            id,owner).run();
      }
    }
  }
  return response;
 }catch(e){
  console.error('Managed R2 Access adapter error',String(e?.name||'unknown'));
  return json({error:'r2_managed_unavailable'},503);
 }
}
