/* DẤU XƯA CỬA ĐẠO — private visitor-submitted documents.
 * Store metadata only in private submissions table, never in any public GET.
 * Store optional original only in R2 'contributions/pending' (no public route).
 * Honeypot, exact origin, Cloudflare per-IP rate binding, daily and inbox caps.
 */
const ORIGINS=new Set([
 'https://dauxuacuadao.info.vn',
 'https://www.dauxuacuadao.info.vn',
 'https://gdd-site-d1-preview.realmetayninh7649.workers.dev'
]);
const CATEGORIES=new Set(['Hồ sơ Chức sắc','Video Đạo Sử','Ai Tín',
 'Tài Liệu Được Số Hoá','Biên khảo','Hình ảnh','Khác']);
const FILES=Object.freeze({
 'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'
});
const MAX_FILE=6*1024*1024, MAX_REQUEST=7*1024*1024;
function respond(origin,data,status=200){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff','Vary':'Origin','Referrer-Policy':'no-referrer'};
 if(ORIGINS.has(origin))headers['Access-Control-Allow-Origin']=origin;
 return new Response(JSON.stringify(data),{status,headers});
}
function textField(form,name,max,required=false){
 const value=form.get(name);
 if(typeof value!=='string')throw Error('invalid_'+name);
 const trimmed=value.trim();
 if(trimmed.length>max||(required&&trimmed.length<2))throw Error('invalid_'+name);
 return trimmed;
}
function fileMagic(file,bytes){
 const same=(...s)=>s.every((v,i)=>bytes[i]===v);
 if(file.type==='image/jpeg')return same(255,216,255);
 if(file.type==='image/png')return same(137,80,78,71,13,10,26,10);
 if(file.type==='image/webp')return same(82,73,70,70)&&sameAt(bytes,8,[87,69,66,80]);
 if(file.type==='application/pdf')return same(37,80,68,70,45);
 return false;
}
function sameAt(bytes,start,ints){return ints.every((v,i)=>bytes[start+i]===v)}
export async function handleContribution(request,env){
 const origin=request.headers.get('Origin')||'';
 if(!ORIGINS.has(origin))return respond(origin,{error:'origin_not_allowed'},403);
 if(request.method==='OPTIONS'){
  return new Response(null,{status:204,headers:{
   'Access-Control-Allow-Origin':origin,
   'Access-Control-Allow-Methods':'POST, OPTIONS',
   'Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600',
   'Vary':'Origin'
  }});
 }
 if(request.method!=='POST')return respond(origin,{error:'method_not_allowed'},405);
 if(!env.DB||!env.SUBMISSIONS_BUCKET||!env.CONTRIBUTION_RATE)
  return respond(origin,{error:'inbox_temporarily_unavailable'},503);
 const contentType=request.headers.get('Content-Type')||'';
 if(!/^multipart\/form-data;\s*boundary=/i.test(contentType))
  return respond(origin,{error:'invalid_content_type'},415);
 const length=Number(request.headers.get('Content-Length')||'');
 if(!Number.isSafeInteger(length)||length>MAX_REQUEST||length<0)
  return respond(origin,{error:'attachment_too_large'},413);
 try{
  // Trust CF-provided client IP only for ephemeral per-minute rate control.
  // Never store the IP, its hash, request headers or user agent in D1/R2.
  const ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const {success}=await env.CONTRIBUTION_RATE.limit({key:'gdd-inbox:'+ip});
  if(!success)return respond(origin,{error:'too_many_requests'},429);
  const form=await request.formData();
  if(form.get('website'))return respond(origin,{accepted:true},202);
  if(form.get('consent')!=='on')return respond(origin,{error:'consent_required'},400);
  const senderName=textField(form,'sender_name',120,true);
  const senderEmail=textField(form,'sender_email',240,true);
  if(!/^[^\s@]{1,120}@[^\s@]{1,115}\.[^\s@]{2,30}$/.test(senderEmail))
   return respond(origin,{error:'invalid_email'},400);
  const category=textField(form,'category',90,true);
  if(!CATEGORIES.has(category))return respond(origin,{error:'invalid_category'},400);
  const title=textField(form,'title',200,true);
  const description=textField(form,'description',8000,true);
  const source=textField(form,'source',800);
  const sourceURL=textField(form,'source_url',1200);
  if(sourceURL){
   let u;try{u=new URL(sourceURL)}catch{return respond(origin,{error:'invalid_source_url'},400)}
   if(u.protocol!=='https:'||u.username||u.password)
    return respond(origin,{error:'invalid_source_url'},400);
  }
  const uploaded=form.get('attachment');
  if(uploaded && typeof uploaded==='string'&&uploaded.trim())
   return respond(origin,{error:'invalid_attachment'},400);
  let blob=null,fileBytes=null,mime=null,ext=null;
  if(uploaded && typeof uploaded!=='string' && uploaded.size>0){
   blob=uploaded;
   mime=String(uploaded.type||'').toLowerCase();
   ext=FILES[mime];
   if(!ext)return respond(origin,{error:'unsupported_attachment'},415);
   if(uploaded.size>MAX_FILE)return respond(origin,{error:'attachment_too_large'},413);
   fileBytes=await uploaded.arrayBuffer();
   if(fileBytes.byteLength!==uploaded.size||!fileMagic(uploaded,new Uint8Array(fileBytes.slice(0,12))))
    return respond(origin,{error:'invalid_attachment_signature'},422);
  }
  const day=new Date().toISOString().slice(0,10)+'T00:00:00.000Z';
  const [pending,recent]=await Promise.all([
   env.DB.prepare("SELECT COUNT(*) AS n FROM submissions WHERE status='pending'").first(),
   env.DB.prepare("SELECT COUNT(*) AS n FROM submissions WHERE created_at>=?").bind(day).first()
  ]);
  if(Number(pending?.n)>99||Number(recent?.n)>19)
   return respond(origin,{error:'inbox_capacity_reached'},429);
  const id=crypto.randomUUID(),createdAt=new Date().toISOString();
  const filePath=blob?'contributions/pending/'+id+'/attachment.'+ext:null;
  if(filePath){
   // Never create a public preview or a share URL for unreviewed submissions.
   await env.SUBMISSIONS_BUCKET.put(filePath,fileBytes,{
    httpMetadata:{contentType:mime,cacheControl:'private,no-store'},
    customMetadata:{recordId:id,scope:'private-contribution',published:'false'}
   });
  }
  try{
   await env.DB.prepare(
    'INSERT INTO submissions(id,sender_name,sender_email,category,title,description,source,source_url,file_path,status,created_at) '+
    'VALUES(?,?,?,?,?,?,?,?,?,?,?)'
   ).bind(id,senderName,senderEmail,category,title,description,source||null,
    sourceURL||null,filePath,'pending',createdAt).run();
  }catch(e){
   // Never DELETE the private original even when a D1 insert fails;
   // the orphan remains in the protected contribution inbox for reconciliation.
   console.error('Contribution D1 insert failed',String(e?.name||'unknown'));
   return respond(origin,{error:'contribution_not_confirmed',original_kept_private:!!filePath},503);
  }
  return respond(origin,{accepted:true,reference:id,private:true,
   attachment_saved:Boolean(filePath),message:'Tư liệu đã chuyển đến hộp thư riêng của Ban Biên Tập.'},201);
 }catch(e){
  console.error('Private contribution submission failed',String(e?.name||'unknown'));
  return respond(origin,{error:'inbox_temporarily_unavailable'},503);
 }
}
