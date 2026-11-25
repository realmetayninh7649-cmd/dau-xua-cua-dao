import {ownerUUID} from './r2-managed.mjs';
const KINDS=new Set(['people','posts','media','videos','obituaries','documents','gdd_memorials','gdd_audio_programs','gdd_calendar_memorials']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const BASE='https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'}});
export async function handleCoverSlots(request,env,path){
 const parts=path.split('/'),kind=parts.at(-3),id=parts.at(-2);
 if(!KINDS.has(kind)||!UUID.test(id)||!env.DB)return reply({error:'invalid_cover_record'},400);
 const db=env.DB,owner=ownerUUID(env);
 try{
  const parent=await db.prepare('SELECT id FROM "'+kind+'" WHERE id=? LIMIT 1').bind(id).first();
  if(!parent)return reply({error:'record_not_found'},404);
  if(request.method==='GET'){
   const {results=[]}=await db.prepare("SELECT c.slot,c.asset_id FROM gdd_editor_cover_slots c JOIN gdd_r2_assets a ON a.asset_id=c.asset_id WHERE c.kind=? AND c.record_id=? AND a.owner_id=? ORDER BY c.slot").bind(kind,id,owner).all();
   return reply({data:results.map(r=>({...r,image_url:BASE+r.asset_id+'/preview'}))});
  }
  if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
  const raw=await request.text();if(raw.length>1000)return reply({error:'invalid_body'},400);
  let p;try{p=JSON.parse(raw)}catch{return reply({error:'invalid_body'},400)}
  if(!p||!Number.isInteger(p.slot)||![2,3].includes(p.slot)||Object.keys(p).some(k=>!['slot','asset_id'].includes(k))||!(p.asset_id===null||UUID.test(p.asset_id||'')))return reply({error:'invalid_cover_slot'},400);
  if(p.asset_id===null){
   // Unlink only; preserve R2 original and preview.
   await db.prepare('DELETE FROM gdd_editor_cover_slots WHERE kind=? AND record_id=? AND slot=?').bind(kind,id,p.slot).run();
   return reply({removed:true,slot:p.slot});
  }
  const a=await db.prepare('SELECT asset_id,owner_id,record_kind,record_id,role,media_kind,public_view,preview_ready FROM gdd_r2_assets WHERE asset_id=?').bind(p.asset_id).first();
  if(!a||a.owner_id!==owner||a.media_kind!=='image'||Number(a.public_view)!==1||Number(a.preview_ready)!==1)return reply({error:'preview_not_approved'},409);
  const existing=await db.prepare('SELECT kind,record_id,slot FROM gdd_editor_cover_slots WHERE asset_id=?').bind(p.asset_id).first();
  if(existing&&(existing.kind!==kind||existing.record_id!==id||existing.slot!==p.slot))return reply({error:'cover_already_linked'},409);
  if((a.record_id||a.record_kind)&&(!existing||a.record_id!==id||a.record_kind!==kind))return reply({error:'asset_already_linked'},409);
  await db.batch([
   db.prepare("UPDATE gdd_r2_assets SET record_kind=?,record_id=?,role='album' WHERE asset_id=? AND owner_id=? AND media_kind='image' AND public_view=1 AND preview_ready=1 AND (record_id IS NULL OR (record_id=? AND record_kind=?))").bind(kind,id,p.asset_id,owner,id,kind),
   db.prepare("INSERT INTO gdd_editor_cover_slots(kind,record_id,slot,asset_id,updated_at) SELECT ?,?,?,asset_id,? FROM gdd_r2_assets WHERE asset_id=? AND owner_id=? AND record_kind=? AND record_id=? AND role='album' ON CONFLICT(kind,record_id,slot) DO UPDATE SET asset_id=excluded.asset_id,updated_at=excluded.updated_at").bind(kind,id,p.slot,new Date().toISOString(),p.asset_id,owner,kind,id)
  ]);
  const saved=await db.prepare('SELECT asset_id FROM gdd_editor_cover_slots WHERE kind=? AND record_id=? AND slot=?').bind(kind,id,p.slot).first();
  if(saved?.asset_id!==p.asset_id)return reply({error:'cover_not_confirmed'},409);
  return reply({data:{slot:p.slot,asset_id:p.asset_id,image_url:BASE+p.asset_id+'/preview'}});
 }catch(e){console.error('cover slots',e?.name);return reply({error:'cover_slots_unavailable'},503)}
}
