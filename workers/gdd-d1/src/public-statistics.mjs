/* D1 statistics gateway: retain historical 21-table metrics after Supabase cutover.
 * Never persist IP, email, user-agent or cookies. Session IDs are random UUIDs.
 * Scoped public writes use a Cloudflare Free ephemeral rate-limit binding.
 */
const BASE='/api/v1/stats';
const ORIGINS=new Set(['https://dauxuacuadao.info.vn',
 'https://www.dauxuacuadao.info.vn',
 'https://gdd-site-d1-preview.realmetayninh7649.workers.dev']);
const KINDS=new Set(['people','posts','media','videos','obituaries','documents']);
const DOWNLOADS=new Set(['image','pdf','word','qr','audio','other']);
const UUID=/^[a-f\d]{8}-[a-f\d]{4}-[1-8][a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;
const EVENT=/^(?:v_[0-9]{8}_[a-f0-9]{32}|d_[a-f0-9]{32})$/i;
function reply(req,data,status=200){
 const origin=req.headers.get('Origin');
 const headers={'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store','Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff','Vary':'Origin'};
 if(ORIGINS.has(origin))headers['Access-Control-Allow-Origin']=origin;
 return new Response(JSON.stringify(data),{status,headers});
}
async function totals(db){
 const recent=new Date(Date.now()-300000).toISOString();
 const [v,o,u,c]=await Promise.all([
  db.prepare('SELECT total_visits FROM gdd_visit_totals WHERE singleton=1').first(),
  db.prepare('SELECT COUNT(*) AS n FROM gdd_visit_sessions WHERE last_seen>=?').bind(recent).first(),
  db.prepare('SELECT total_unlinked FROM gdd_site_download_totals WHERE singleton=1').first(),
  db.prepare('SELECT COALESCE(SUM(download_count),0) AS n FROM gdd_content_metrics').first()
 ]);
 return {online_count:Math.max(0,Number(o?.n)||0),
  total_visits:Math.max(0,Number(v?.total_visits)||0),
  total_downloads:Math.max(0,Number(u?.total_unlinked)||0)+Math.max(0,Number(c?.n)||0),
  source:'cloudflare-d1',online_window_minutes:5};
}
export async function handleSiteStats(request,env,path){
 if(!env.DB)return reply(request,{error:'statistics_unavailable'},503);
 const origin=request.headers.get('Origin');
 if(request.method==='OPTIONS'){
  if(!ORIGINS.has(origin))return reply(request,{error:'forbidden'},403);
  return new Response(null,{status:204,headers:{
   'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
   'Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600','Vary':'Origin'}});
 }
 if(path===BASE&&request.method==='GET'){
  try{return reply(request,await totals(env.DB))}
  catch(e){console.error('D1 aggregate statistics unavailable',String(e?.name||'unknown'));
   return reply(request,{error:'statistics_unavailable'},503)}
 }
 if(![BASE+'/visit',BASE+'/content',BASE+'/download'].includes(path))
  return reply(request,{error:'not_found'},404);
 if(request.method!=='POST')return reply(request,{error:'method_not_allowed'},405);
 if(!ORIGINS.has(origin)||!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))
  return reply(request,{error:'origin_or_content_type_rejected'},403);
 if(!env.STATS_RATE)return reply(request,{error:'rate_limit_unconfigured'},503);
 try{
  const ip=request.headers.get('CF-Connecting-IP');
  if(!ip)return reply(request,{error:'rate_limit_identity_missing'},403);
  if(!(await env.STATS_RATE.limit({key:'gdd-public-statistics:'+ip})).success)
   return reply(request,{error:'too_many_requests'},429);
  const n=Number(request.headers.get('Content-Length')||0);
  if(!Number.isSafeInteger(n)||n>1600)return reply(request,{error:'invalid_body'},400);
  const raw=await request.text();
  if(raw.length>1600)return reply(request,{error:'invalid_body'},400);
  let data;try{data=JSON.parse(raw)}catch{return reply(request,{error:'invalid_json'},400)}
  if(!data||typeof data!=='object'||Array.isArray(data))
   return reply(request,{error:'invalid_json'},400);
  const time=new Date().toISOString();
  if(path===BASE+'/visit'){
   if(Object.keys(data).some(k=>k!=='session_id')||!UUID.test(data.session_id||''))
    return reply(request,{error:'invalid_session_id'},400);
   const row=await env.DB.prepare(
    'INSERT OR IGNORE INTO gdd_visit_sessions(session_id,first_seen,last_seen) VALUES(?,?,?) RETURNING session_id'
   ).bind(data.session_id,time,time).first();
   if(row){
    await env.DB.prepare('INSERT INTO gdd_visit_totals(singleton,total_visits) VALUES(1,1) '+
      'ON CONFLICT(singleton) DO UPDATE SET total_visits=COALESCE(total_visits,0)+1').run();
   }else await env.DB.prepare('UPDATE gdd_visit_sessions SET last_seen=? WHERE session_id=?')
       .bind(time,data.session_id).run();
   return reply(request,{...await totals(env.DB),new_session:!!row});
  }
  if(path===BASE+'/download'){
   if(Object.keys(data).some(k=>!['event_id','session_id','kind'].includes(k))||
      !UUID.test(data.event_id||'')||!UUID.test(data.session_id||'')||
      !DOWNLOADS.has(data.kind))return reply(request,{error:'invalid_download_event'},400);
   const row=await env.DB.prepare(
    'INSERT OR IGNORE INTO gdd_site_download_events(event_id,session_id,download_kind,recorded_at) VALUES(?,?,?,?) RETURNING event_id'
   ).bind(data.event_id,data.session_id,data.kind,time).first();
   if(row)await env.DB.prepare(
    'INSERT INTO gdd_site_download_totals(singleton,total_unlinked) VALUES(1,1) '+
    'ON CONFLICT(singleton) DO UPDATE SET total_unlinked=COALESCE(total_unlinked,0)+1').run();
   return reply(request,{...await totals(env.DB),recorded:!!row});
  }
  if(path===BASE+'/content'){
   if(Object.keys(data).some(k=>!['kind','record_id','event_type','event_key'].includes(k))||
      !KINDS.has(data.kind)||!UUID.test(data.record_id||'')||
      !['view','download'].includes(data.event_type)||!EVENT.test(data.event_key||'')||
      !String(data.event_key).startsWith(data.event_type==='view'?'v_':'d_'))
    return reply(request,{error:'invalid_content_event'},400);
   // The only legal dynamic SQL table value comes from the constant allowlist.
   const owner=await env.DB.prepare('SELECT id FROM "'+data.kind+'" WHERE id=? AND published=1 LIMIT 1')
     .bind(data.record_id).first();
   if(!owner)return reply(request,{error:'not_found'},404);
   const row=await env.DB.prepare(
    'INSERT OR IGNORE INTO gdd_content_metric_events(kind,record_id,event_type,event_key,recorded_at) '+
    'VALUES(?,?,?,?,?) RETURNING event_key'
   ).bind(data.kind,data.record_id,data.event_type,data.event_key,time).first();
   if(row)await env.DB.prepare(
    'INSERT INTO gdd_content_metrics(kind,record_id,view_count,download_count,updated_at) '+
    'VALUES(?,?,?,?,?) ON CONFLICT(kind,record_id) DO UPDATE SET '+
    'view_count=COALESCE(view_count,0)+excluded.view_count,'+
    'download_count=COALESCE(download_count,0)+excluded.download_count,updated_at=excluded.updated_at'
   ).bind(data.kind,data.record_id,Number(data.event_type==='view'),
     Number(data.event_type==='download'),time).run();
   const result=await env.DB.prepare(
    'SELECT view_count,download_count FROM gdd_content_metrics WHERE kind=? AND record_id=?'
   ).bind(data.kind,data.record_id).first();
   return reply(request,{views:Math.max(0,Number(result?.view_count)||0),
    downloads:Math.max(0,Number(result?.download_count)||0),recorded:!!row});
  }
 }catch(e){console.error('D1 visitor statistics failed',String(e?.name||'unknown'));
  return reply(request,{error:'statistics_unavailable'},503)}
 return reply(request,{error:'not_found'},404);
}
