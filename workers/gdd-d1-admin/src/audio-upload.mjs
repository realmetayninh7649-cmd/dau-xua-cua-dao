// Only admin-authenticated requests arrive here. Immutable, record-scoped MP3 assets.
const MAX=24*1024*1024;
const BASE='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/audio/';
function isMp3(bytes){
 let start=0;
 if(bytes.length>=10&&bytes[0]===73&&bytes[1]===68&&bytes[2]===51){
  if(bytes.slice(6,10).some(n=>n>127))return false;
  start=10+bytes[6]*2097152+bytes[7]*16384+bytes[8]*128+bytes[9]+((bytes[5]&16)?10:0);
 }
 // Check an MPEG Layer III header, including version, bitrate and sample rate.
 for(let i=start;i<Math.min(start+4096,bytes.length-3);i++){
  const b=bytes[i+1],c=bytes[i+2];
  if(bytes[i]===255&&(b&224)===224&&(b&24)!==8&&(b&6)===2&&(c&240)!==240&&(c&240)!==0&&(c&12)!==12)return true;
 }
 return false;
}
export async function uploadAudio(request,env,id,json){
 try{
  if(!env.DB||!env.GDD_BUCKET)return json({error:'storage_unavailable'},503);
  if(!/^audio\/mpeg(?:;|$)/i.test(request.headers.get('Content-Type')||''))return json({error:'mp3_required'},415);
  const row=await env.DB.prepare('SELECT id FROM gdd_audio_programs WHERE id=? LIMIT 1').bind(id).first();
  if(!row)return json({error:'record_not_found'},404);
  const declared=request.headers.get('Content-Length');
  if(declared!==null&&(!Number.isSafeInteger(Number(declared))||Number(declared)<4||Number(declared)>MAX))return json({error:'invalid_size'},413);
  if(!request.body)return json({error:'missing_file'},400);
  const bytes=new Uint8Array(MAX),reader=request.body.getReader();let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;if(size+value.length>MAX){await reader.cancel();return json({error:'file_too_large'},413)}bytes.set(value,size);size+=value.length}
  const data=bytes.subarray(0,size);
  if((declared!==null&&size!==Number(declared))||!isMp3(data))return json({error:'invalid_mp3'},400);
  const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)),x=>x.toString(16).padStart(2,'0')).join('');
  const key='audio-records-v1/'+id+'/'+sha+'.mp3';
  let saved=await env.GDD_BUCKET.head(key);
  if(!saved){
   await env.GDD_BUCKET.put(key,data,{onlyIf:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'audio/mpeg'},customMetadata:{sha256:sha,recordId:id}});
   saved=await env.GDD_BUCKET.head(key);
  }
  if(!saved||saved.size!==size||saved.customMetadata?.sha256!==sha||saved.customMetadata?.recordId!==id)return json({error:'r2_verification_failed'},409);
  // The public route stays closed until the editorial record is published AND references this exact URL.
  return json({uploaded:true,url:BASE+id+'/'+sha+'.mp3',bytes:size,sha256:sha});
 }catch{return json({error:'audio_upload_failed'},503)}
}
