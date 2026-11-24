// Published audio is accessible only via its owning published D1 record.
export async function serveAudio(request,env,id,sha,respond,origins){
 if(!['GET','HEAD'].includes(request.method))return respond(request,{error:'read_only'},405,{private:true});
 try{
  const target='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/audio/'+id+'/'+sha+'.mp3';
  const row=await env.DB.prepare('SELECT id FROM gdd_audio_programs WHERE id=? AND published=1 AND audio_url=? LIMIT 1').bind(id,target).first();
  if(!row||!env.SUBMISSIONS_BUCKET)return respond(request,{error:'not_found'},404,{private:true});
  const key='audio-records-v1/'+id+'/'+sha+'.mp3';
  const head=await env.SUBMISSIONS_BUCKET.head(key);
  if(!head||head.customMetadata?.sha256!==sha||head.customMetadata?.recordId!==id||head.size<4||head.size>24*1024*1024)return respond(request,{error:'not_found'},404,{private:true});
  const total=head.size;let start=0,end=total-1,partial=false;
  const bad=()=>new Response(null,{status:416,headers:{'Content-Range':'bytes */'+total,'Cache-Control':'no-store'}});
  const range=request.headers.get('Range');
  if(range){
   const m=/^bytes=(\d*)-(\d*)$/.exec(range);
   if(!m||(!m[1]&&!m[2]))return bad();
   if(m[1]){start=Number(m[1]);if(m[2])end=Math.min(Number(m[2]),total-1)}
   else {const n=Number(m[2]);if(!Number.isSafeInteger(n)||n<1)return bad();start=Math.max(0,total-n)}
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=total||end<start)return bad();
   partial=true;
  }
  const object=request.method==='HEAD'?head:await env.SUBMISSIONS_BUCKET.get(key,partial?{range:{offset:start,length:end-start+1}}:{});
  if(!object)return respond(request,{error:'not_found'},404,{private:true});
  const h=new Headers({'Content-Type':'audio/mpeg','Content-Length':String(end-start+1),'Accept-Ranges':'bytes','Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff','Vary':'Origin'});
  if(head.httpEtag)h.set('ETag',head.httpEtag);
  if(partial)h.set('Content-Range','bytes '+start+'-'+end+'/'+total);
  const origin=request.headers.get('Origin');if(origin&&origins.has(origin))h.set('Access-Control-Allow-Origin',origin);
  return new Response(request.method==='HEAD'?null:object.body,{status:partial?206:200,headers:h});
 }catch{return respond(request,{error:'audio_unavailable'},503,{private:true})}
}
