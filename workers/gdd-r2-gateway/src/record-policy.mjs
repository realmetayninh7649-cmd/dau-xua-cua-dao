// The most restrictive record wins, including assets shared across records.
export async function mediaMode(env,ref){
 if(!env.POLICY_DB){
  if(env.RECORD_POLICY_REQUIRED==='yes')throw Error('policy unavailable');
  return 'download';
 }
 const id=ref.startsWith('managed:')?ref.slice(8):'';
 const row=await env.POLICY_DB.prepare("SELECT max(CASE p.mode WHEN 'protected' THEN 2 WHEN 'view' THEN 1 ELSE 0 END) AS level FROM gdd_record_access p WHERE EXISTS(SELECT 1 FROM gdd_access_media m WHERE m.kind=p.kind AND m.record_id=p.record_id AND m.media_ref=?) OR EXISTS(SELECT 1 FROM gdd_r2_assets a WHERE a.asset_id=? AND a.record_kind=p.kind AND a.record_id=p.record_id)").bind(ref,id).first();
 if(!row)throw Error('policy unavailable');
 return Number(row.level)===2?'protected':Number(row.level)===1?'view':'download';
}
export async function protectedKey(ref,variant){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ref));
 return 'protected-view-v1/'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')+'/'+variant.replace('page/','page-')+'.jpg';
}
