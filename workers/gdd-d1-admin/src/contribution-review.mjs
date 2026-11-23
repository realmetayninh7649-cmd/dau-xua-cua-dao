/* Private contribution review workflow — Access-only, optimistic status CAS,
 * audit trigger on every review state transition. No automatic publication.
 * No R2 file mutations and no deletion of submitted source files.
 */
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const STATES=new Set(['pending','reviewing','approved','rejected']);
const ALLOWED=Object.freeze({
 pending:['reviewing','approved','rejected'],
 reviewing:['approved','rejected'],
 approved:['reviewing'],
 rejected:['reviewing']
});
function respond(data,status=200){
 return new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow',
  'Referrer-Policy':'no-referrer'
 }});
}
export async function reviewContribution(req,db,id){
 if(req.method!=='POST')return respond({error:'method_not_allowed'},405);
 if(!db||!UUID.test(id))return respond({error:'invalid_id'},400);
 try{
  const size=Number(req.headers.get('Content-Length')||0);
  if(!Number.isSafeInteger(size)||size>5000)return respond({error:'invalid_body'},413);
  const raw=await req.text();
  if(raw.length>5000)return respond({error:'invalid_body'},413);
  let payload;try{payload=JSON.parse(raw)}catch{return respond({error:'invalid_json'},400)}
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||
   Object.keys(payload).some(k=>!['expected_status','status'].includes(k)))
   return respond({error:'invalid_fields'},400);
  const old=payload.expected_status,next=payload.status;
  if(!STATES.has(old)||!STATES.has(next)||!ALLOWED[old].includes(next))
   return respond({error:'invalid_transition'},409);
  const row=await db.prepare(
   'UPDATE submissions SET status=? WHERE id=? AND status=? RETURNING id,status'
  ).bind(next,id,old).first();
  if(!row)return respond({error:'status_conflict_or_not_found'},409);
  // The working D1 SQLite trigger logs old/new status in the same transaction.
  return respond({id:row.id,status:row.status,private:true,
    audit_trigger:'gdd_submission_status_audit',published:false});
 }catch(e){
  console.error('Access contribution review unavailable',String(e?.name||'unknown'));
  return respond({error:'review_unavailable'},503);
 }
}
