/* R2 isolated Access-protected test upload, never release original content.
 * Only new objects under a fixed internal staging prefix; originals remain intact.
 * No GET object body, public URL, delete, overwrite or metadata publication route.
 */
const PREFIX='__gdd_internal__/access-staging-uploads-v1/';
const LIMIT=20, MAX_BYTES=2*1024*1024;
const TYPES=Object.freeze({
 'image/jpeg':{ext:'jpg',kind:'jpeg'},
 'image/png':{ext:'png',kind:'png'},
 'image/webp':{ext:'webp',kind:'webp'},
 'application/pdf':{ext:'pdf',kind:'pdf'},
 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':{ext:'docx',kind:'docx'}
});
function json(value,status=200){
 return new Response(JSON.stringify(value),{status,headers:{
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'
 }});
}
function validMagic(bytes,kind){
 const at=(...values)=>values.every((v,i)=>bytes[i]===v);
 if(kind==='jpeg')return at(0xff,0xd8,0xff);
 if(kind==='png')return at(0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a);
 if(kind==='webp')return at(0x52,0x49,0x46,0x46)&&
   bytes[8]===0x57&&bytes[9]===0x45&&bytes[10]===0x42&&bytes[11]===0x50;
 if(kind==='pdf')return at(0x25,0x50,0x44,0x46,0x2d);
 if(kind==='docx')return at(0x50,0x4b,0x03,0x04);
 return false;
}
async function inventory(bucket){
 const list=await bucket.list({prefix:PREFIX,limit:LIMIT+1});
 if(!list||!Array.isArray(list.objects)||list.truncated ||list.objects.length>LIMIT)
   throw Error('sandbox_upload_quota_reached');
 return list;
}
export async function handleR2Sandbox(request,bucket){
 if(!bucket)return json({error:'r2_binding_unavailable'},503);
 if(request.method!=='GET'&&request.method!=='POST')
   return json({error:'method_not_allowed',delete_disabled:true},405);
 try{
  const list=await inventory(bucket);
  if(request.method==='GET'){
   return json({mode:'private-r2-upload-sandbox',count:list.objects.length,
     objects:list.objects.map(o=>({
       size:o.size,
       uploaded_at:o.uploaded?.toISOString?.()||null,
       sha256:o.customMetadata?.sha256||null
     })),
     originals_public:false,write_enabled:true,delete_enabled:false,
     max_total_objects:LIMIT,max_bytes_per_object:MAX_BYTES});
  }
  if(list.objects.length>=LIMIT)return json({error:'sandbox_upload_quota_reached'},429);
  const mime=(request.headers.get('Content-Type')||'').toLowerCase().trim();
  if(!Object.prototype.hasOwnProperty.call(TYPES,mime))
    return json({error:'unsupported_file_type'},415);
  const declared=Number(request.headers.get('Content-Length')||'');
  if(!Number.isSafeInteger(declared)||declared<=0||declared>MAX_BYTES)
    return json({error:'invalid_file_size'},413);
  const buffer=await request.arrayBuffer();
  if(buffer.byteLength!==declared||buffer.byteLength>MAX_BYTES)
    return json({error:'invalid_file_size'},413);
  const bytes=new Uint8Array(buffer),type=TYPES[mime];
  if(!validMagic(bytes,type.kind))
    return json({error:'invalid_file_signature'},422);
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
    x=>x.toString(16).padStart(2,'0')).join('');
  const id=crypto.randomUUID();
  const key=PREFIX+id+'/source.'+type.ext;
  if(await bucket.head(key))return json({error:'collision_retry'},409);
  // The key cannot match existing originals, published previews or metadata.
  await bucket.put(key,buffer,{
   httpMetadata:{contentType:mime,cacheControl:'private, no-store'},
   customMetadata:{sha256:hash,scope:'Access-protected staging',published:'false'}
  });
  return json({id,sha256:hash,bytes:bytes.byteLength,mime,
    mode:'private-r2-upload-sandbox',
    original_private:true,published:false,download_enabled:false},201);
 }catch(e){
  if(String(e?.message||'')==='sandbox_upload_quota_reached')
    return json({error:'sandbox_upload_quota_reached'},429);
  console.error('R2 staging upload error',String(e?.name||'unknown'));
  return json({error:'r2_upload_unavailable'},503);
 }
}
