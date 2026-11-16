// GDDĐ v2.0.0-DK01.2 — Bảo tồn nguyên mẫu & bản xem nhẹ.
// Bản gốc là R2 PRIVATE; KHÔNG có tuyến GET original hoặc URL tải gốc công khai.
export const VERSION = 'GDDĐ v2.0.0-DK01.2.1';
const PROBE = '__gdd_internal__/dk01_read_probe_only';
const MB = 1024 * 1024;
const PART_BYTES = 8 * MB;
const SMALL_LIMIT = 6 * MB;
const MAX_PARTS = 10000;
const MAX_ASSET_BYTES = PART_BYTES * MAX_PARTS;
const ORIGIN = 'https://realmetayninh7649-cmd.github.io';
const MEDIA = Object.freeze({
  jpg:['image/jpeg','image'],jpeg:['image/jpeg','image'],
  png:['image/png','image'],webp:['image/webp','image'],
  gif:['image/gif','image'],tif:['image/tiff','image'],
  tiff:['image/tiff','image'],heic:['image/heic','image'],
  heif:['image/heif','image'],avif:['image/avif','image'],
  pdf:['application/pdf','document'],
  doc:['application/msword','document'],
  docx:['application/vnd.openxmlformats-officedocument.wordprocessingml.document','document']
});
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function respond(obj, status=200, cors=false) {
  const headers={
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store','x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer','x-frame-options':'DENY'
  };
  if (cors) {
    headers['access-control-allow-origin']=ORIGIN;
    headers['vary']='Origin';
  }
  return new Response(JSON.stringify(obj),{status,headers});
}
function failure(status,msg,cors) {return respond({error:msg,version:VERSION},status,cors)}
function jsonBody(req,max=16384) {
  const n=Number(req.headers.get('content-length')||0);
  if(n>max)return Promise.reject(Error('too_large'));
  return req.text().then(s=>{
    if(s.length>max)throw Error('too_large');
    return JSON.parse(s);
  });
}
function uuid(){return crypto.randomUUID()}
function assetMetaKey(id){return 'meta/'+id+'.json'}
function cleanName(s){return String(s||'').replace(/[\u0000-\u001f\u007f\/\\]/g,'_').slice(0,160)}
function originalKey(owner,id,ext){return 'originals/'+owner+'/'+id+'/original.'+ext}
function validOriginalKey(key,owner) {
  return new RegExp('^originals/'+owner+'/([a-f0-9-]{36})/original\\.(jpg|jpeg|png|webp|gif|tif|tiff|heic|heif|avif|pdf|doc|docx)$','i').test(key);
}
// R2 multipart uploadId is an opaque provider-generated identifier: do not restrict it to base64.
function parseUploadId(value){return typeof value==='string'&&value.length>=4&&value.length<=1024&&/^[\x21-\x7e]+$/.test(value)}
function parseR2Parts(parts,size) {
  const expected=Math.ceil(size/PART_BYTES);
  if (!Array.isArray(parts)||parts.length!==expected||expected<1||expected>MAX_PARTS)throw Error('parts');
  return parts.map((x,i)=>{
    if(!x||x.partNumber!==i+1||typeof x.etag!=='string'||!/^"?[0-9a-fA-F]{32}"?$/.test(x.etag))throw Error('parts');
    return {partNumber:x.partNumber,etag:x.etag};
  });
}
async function authenticate(req,env) {
  const h=req.headers.get('authorization')||'';
  const m=/^Bearer ([A-Za-z0-9_.\-]+)$/.exec(h);
  if(!m||!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)return null;
  const headers={'apikey':env.SUPABASE_PUBLISHABLE_KEY,'authorization':'Bearer '+m[1],'accept':'application/json'};
  let user;
  try{
    const check=await fetch(env.SUPABASE_URL+'/auth/v1/user',{headers,signal:AbortSignal.timeout(10000)});
    if(!check.ok)return null;
    user=await check.json();
    if(!UUID.test(user?.id)||user?.is_anonymous)return null;
    const rows=await fetch(env.SUPABASE_URL+'/rest/v1/admin_users?select=user_id&user_id=eq.'+encodeURIComponent(user.id),{headers,signal:AbortSignal.timeout(10000)});
    if(!rows.ok)return null;
    const admins=await rows.json();
    if(!Array.isArray(admins)||admins.length!==1||admins[0].user_id!==user.id)return null;
    return user;
  }catch{return null}
}
async function getMeta(env,id){
  if(!UUID.test(id))return null;
  const record=await env.GDD_BUCKET.get(assetMetaKey(id));
  if(!record)return null;
  try{return await record.json()}catch{return null}
}
function ownsMeta(meta,user,id){return !!(meta&&meta.id===id&&meta.owner===user.id)}
async function saveMeta(env,meta){await env.GDD_BUCKET.put(assetMetaKey(meta.id),JSON.stringify(meta),{httpMetadata:{contentType:'application/json',cacheControl:'no-store'}})}
async function headR2(env) {
  try{await env.GDD_BUCKET.head(PROBE);return true}catch{return false}
}
function isDerivative(bytes,variant) {
  return variant==='preview'
    ? bytes[0]===82&&bytes[1]===73&&bytes[2]===70&&bytes[3]===70&&bytes[8]===87&&bytes[9]===69&&bytes[10]===66&&bytes[11]===80
    : bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
}
async function api(req,env,url,cors,user) {
  const path=url.pathname;
  // iOS / small files: one authenticated PUT avoids fragile multipart sessions.
  // Never compress or transform source bytes. No public GET endpoint is exposed.
  if(path==='/v1/uploads/small' && req.method==='PUT'){
    const name=cleanName(url.searchParams.get('name'));
    const ext=name.split('.').pop().toLowerCase();
    const definition=MEDIA[ext];
    const declared=Number(url.searchParams.get('size'));
    if(!definition||!Number.isSafeInteger(declared)||declared<1||declared>SMALL_LIMIT)
      return failure(400,'Loại tệp hoặc kích thước không hợp lệ',cors);
    const advertised=req.headers.get('content-length');
    if(advertised!==null&&(Number(advertised)!==declared))
      return failure(400,'Kích thước tệp không khớp',cors);
    if(!req.body)return failure(400,'Tệp trống',cors);
    let bytes;
    try{bytes=await req.arrayBuffer()}catch{return failure(400,'Không đọc được tệp',cors)}
    if(bytes.byteLength!==declared)return failure(400,'Tệp nhận được không nguyên vẹn',cors);
    const id=uuid(),key=originalKey(user.id,id,ext);
    try{
      const obj=await env.GDD_BUCKET.put(key,bytes,{
        httpMetadata:{contentType:definition[0],contentDisposition:'attachment',cacheControl:'private, no-store'},
        customMetadata:{owner:user.id,assetId:id,declaredSize:String(declared),originalName:name,kind:definition[1]}
      });
      if(!obj||obj.size!==declared)return failure(503,'R2 chưa xác nhận đủ dữ liệu',cors);
      const meta={id,owner:user.id,key,kind:definition[1],mime:definition[0],
        originalBytes:declared,originalName:name,originalEtag:obj.etag,
        preview:false,download:false,published:false,createdAt:new Date().toISOString()};
      await saveMeta(env,meta);
      return respond({id,originalBytes:declared,originalPreserved:true,previewReady:false,
        downloadReady:false,publiclyAccessible:false,uploadMode:'single'},201,cors);
    }catch{return failure(503,'Không lưu được tệp nguyên mẫu vào R2',cors)}
  }
  if(path==='/v1/uploads/start' && req.method==='POST') {
    let body;
    try{body=await jsonBody(req)}catch{return failure(400,'Thông tin tệp không hợp lệ',cors)}
    const name=cleanName(body?.name), ext=name.split('.').pop().toLowerCase();
    const definition=MEDIA[ext];
    const size=body?.size;
    if(!definition||!Number.isSafeInteger(size)||size<1||size>MAX_ASSET_BYTES) return failure(400,'Loại tệp hoặc dung lượng không được hỗ trợ',cors);
    const id=uuid(),key=originalKey(user.id,id,ext);
    try{
      const session=await env.GDD_BUCKET.createMultipartUpload(key,{
        httpMetadata:{contentType:definition[0],contentDisposition:'attachment',cacheControl:'private, no-store'},
        customMetadata:{owner:user.id,assetId:id,declaredSize:String(size),originalName:name,kind:definition[1]}
      });
      return respond({id,key,uploadId:session.uploadId,partBytes:PART_BYTES,partCount:Math.ceil(size/PART_BYTES),originalSize:size,status:'awaiting_parts'},201,cors);
    }catch{return failure(503,'Chưa khởi tạo được phiên tải R2',cors)}
  }
  if(path==='/v1/uploads/part' && req.method==='PUT') {
    const key=url.searchParams.get('key')||'',uploadId=url.searchParams.get('uploadId'),part=Number(url.searchParams.get('part'));
    if(!validOriginalKey(key,user.id)||!parseUploadId(uploadId)||!Number.isInteger(part)||part<1||part>MAX_PARTS)return failure(400,'Phiên tải không hợp lệ',cors);
    // Browser/Cloudflare may omit Content-Length; inspect real bytes instead.
    const given=req.headers.get('content-length');
    if(given!==null&&(!Number.isSafeInteger(Number(given))||Number(given)<1||Number(given)>PART_BYTES))
      return failure(413,'Phần tệp vượt 8 MB hoặc không hợp lệ',cors);
    if(!req.body)return failure(400,'Tệp trống',cors);
    try{
      const upload=env.GDD_BUCKET.resumeMultipartUpload(key,uploadId);
      const bytes=await req.arrayBuffer();
      if(bytes.byteLength<1||bytes.byteLength>PART_BYTES)return failure(413,'Phần tệp vượt 8 MB',cors);
      if(given!==null&&bytes.byteLength!==Number(given))return failure(400,'Dung lượng phần tệp không khớp',cors);
      const {etag,partNumber}=await upload.uploadPart(part,bytes);
      return respond({etag,partNumber},200,cors);
    }catch{return failure(503,'Tải phần tệp thất bại; có thể thử lại',cors)}
  }
  if(path==='/v1/uploads/complete' && req.method==='POST'){
    let body;
    try{body=await jsonBody(req,800000)}catch{return failure(400,'Danh sách phần tệp không hợp lệ',cors)}
    const key=body?.key,uploadId=body?.uploadId,size=body?.size;
    if(!validOriginalKey(key,user.id)||!parseUploadId(uploadId)||!Number.isSafeInteger(size)||size<1||size>MAX_ASSET_BYTES)return failure(400,'Phiên tải không hợp lệ',cors);
    let parts;
    try{parts=parseR2Parts(body.parts,size)}catch{return failure(400,'Thiếu hoặc sai thứ tự phần tệp',cors)}
    const id=key.split('/')[2];
    try{
      const upload=env.GDD_BUCKET.resumeMultipartUpload(key,uploadId);
      await upload.complete(parts);
      const record=await env.GDD_BUCKET.head(key);
      if(!record||record.size!==size||record.customMetadata?.declaredSize!==String(size)){
        return failure(409,'Kích thước lưu trữ không khớp; giữ tệp riêng để kiểm tra',cors);
      }
      const type=record.customMetadata.kind;
      const meta={id,owner:user.id,key,kind:type,mime:record.httpMetadata?.contentType||'application/octet-stream',
        originalBytes:size,originalName:record.customMetadata.originalName,originalEtag:record.etag,
        preview:false,download:false,published:false,createdAt:new Date().toISOString()};
      await saveMeta(env,meta);
      return respond({id,originalBytes:size,originalPreserved:true,previewReady:false,downloadReady:false,publiclyAccessible:false},201,cors);
    }catch{return failure(503,'Chưa hoàn tất lưu trữ nguyên mẫu',cors)}
  }
  const match=/^\/v1\/assets\/([a-f0-9-]{36})(?:\/(preview|download))?$/i.exec(path);
  if(match) {
    const id=match[1],variant=match[2];
    const meta=await getMeta(env,id);
    if(!ownsMeta(meta,user,id))return failure(404,'Không tìm thấy tư liệu',cors);
    if(!variant&&req.method==='GET')
      return respond({id,originalBytes:meta.originalBytes,originalPreserved:true,previewReady:meta.preview,downloadReady:meta.download,
        published:meta.published,kind:meta.kind,mime:meta.mime},200,cors);
    if(variant&&req.method==='PUT'){
      if(meta.kind!=='image')return failure(400,'Chỉ ảnh mới có bản xem và bản tải',cors);
      const len=Number(req.headers.get('content-length')||0);
      if(!len||len>8*MB||!req.body)return failure(413,'Ảnh tối ưu phải dưới 8 MB',cors);
      const mime=variant==='preview'?'image/webp':'image/jpeg';
      if(req.headers.get('content-type')?.split(';')[0]!==mime)return failure(415,'Sai định dạng ảnh tối ưu',cors);
      let bytes;
      try{bytes=new Uint8Array(await req.arrayBuffer())}catch{return failure(400,'Không đọc được ảnh',cors)}
      if(bytes.length!==len||bytes.length<16||!isDerivative(bytes,variant))return failure(415,'Ảnh tối ưu không hợp lệ',cors);
      const key='derivatives/'+id+'/'+variant+(variant==='preview'?'.webp':'.jpg');
      try{
        await env.GDD_BUCKET.put(key,bytes,{httpMetadata:{contentType:mime,cacheControl:'public, max-age=86400'}});
        meta[variant]=true;
        await saveMeta(env,meta);
        return respond({id,variant,storedBytes:bytes.byteLength,originalUnchanged:true,publiclyAccessible:false},201,cors);
      }catch{return failure(503,'Không lưu được ảnh tối ưu',cors)}
    }
  }
  return failure(404,'Không có đường dẫn này',cors);
}
export default {
  async fetch(req,env){
    const url=new URL(req.url),path=url.pathname;
    if(path==='/health'){
      if(req.method!=='GET')return failure(405,'Method not allowed',false);
      return await headR2(env)
        ? respond({status:'ok',version:VERSION,r2:'reachable'})
        : respond({status:'not_ready',version:VERSION},503);
    }
    if(!path.startsWith('/v1/'))return failure(404,'Not found',false);
    const cors=req.headers.get('origin')===ORIGIN;
    if(req.method==='OPTIONS'){
      if(!cors)return failure(403,'Origin not allowed',false);
      return new Response(null,{status:204,headers:{
        'access-control-allow-origin':ORIGIN,
        'access-control-allow-methods':'GET, POST, PUT, OPTIONS',
        'access-control-allow-headers':'Authorization, Content-Type',
        'access-control-max-age':'600','vary':'Origin','cache-control':'no-store'}});
    }
    // Không có bất kỳ GET public/original nào trong DK01.2.
    if(!['GET','POST','PUT'].includes(req.method))return failure(405,'Method not allowed',cors);
    const user=await authenticate(req,env);
    if(!user)return failure(403,'Chỉ Quản trị viên hợp lệ được truy cập',cors);
    return api(req,env,url,cors,user);
  }
};
