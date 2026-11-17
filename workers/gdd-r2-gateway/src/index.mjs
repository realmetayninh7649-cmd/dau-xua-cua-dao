// GDDĐ v2.0.0-DK01.2 — Bảo tồn nguyên mẫu & bản xem nhẹ.
// Bản gốc là R2 PRIVATE; KHÔNG có tuyến GET original hoặc URL tải gốc công khai.
export const VERSION = 'GDDĐ v2.0.0-DK01.4';
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
        published:meta.published,kind:meta.kind,mime:meta.mime,originalName:meta.originalName,
        viewSource:meta.viewSource||null,pageCount:meta.pageCount||0,allowDownload:meta.allowDownload===true},200,cors);
    if(variant&&req.method==='PUT'){
      if(meta.kind!=='image')return failure(400,'Chỉ ảnh mới có bản xem và bản tải',cors);
      // Safari sometimes omits Content-Length in cross-origin PUT requests.
      // Validate actual content and enforce a hard limit even when the header is absent.
      const declared=req.headers.get('content-length');
      if(!req.body)return failure(400,'Ảnh tối ưu trống',cors);
      if(declared!==null&&(!Number.isSafeInteger(Number(declared))||Number(declared)<1||Number(declared)>8*MB))
        return failure(413,'Ảnh tối ưu phải dưới 8 MB',cors);
      const mime=req.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
      if(!(variant==='preview'&&['image/webp','image/jpeg'].includes(mime))&&
         !(variant==='download'&&mime==='image/jpeg'))return failure(415,'Sai định dạng ảnh tối ưu',cors);
      let bytes;
      try{bytes=new Uint8Array(await req.arrayBuffer())}catch{return failure(400,'Không đọc được ảnh',cors)}
      if(bytes.byteLength<16||bytes.byteLength>8*MB|| (declared!==null&&bytes.byteLength!==Number(declared)))
        return failure(413,'Ảnh tối ưu không đúng dung lượng',cors);
      const isJpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
      const isWebp=bytes[0]===82&&bytes[1]===73&&bytes[2]===70&&bytes[3]===70&&
        bytes[8]===87&&bytes[9]===69&&bytes[10]===66&&bytes[11]===80;
      if(!(mime==='image/jpeg'&&isJpeg)&&!(mime==='image/webp'&&isWebp))
        return failure(415,'Ảnh tối ưu không đúng định dạng',cors);
      const key='derivatives/'+id+'/'+variant+(mime==='image/webp'?'.webp':'.jpg');
      try{
        await env.GDD_BUCKET.put(key,bytes,{httpMetadata:{contentType:mime,cacheControl:'public, max-age=86400'}});
        meta[variant]=true;
        meta[variant+'Mime']=mime;
        await saveMeta(env,meta);
        return respond({id,variant,storedBytes:bytes.byteLength,originalUnchanged:true,publiclyAccessible:false},201,cors);
      }catch{return failure(503,'Không lưu được ảnh tối ưu',cors)}
    }
  }
  return failure(404,'Không có đường dẫn này',cors);
}

// DK01.4: chỉ phân phối bản xem đã được Quản trị viên CHỦ ĐỘNG xuất bản.
// Tuyệt đối KHÔNG có GET originals/, GET PDF/Word nguyên mẫu hoặc raw R2 keys.
const VIEW_MAX_PAGES = 120;
const VIEW_PAGE_MAX_BYTES = 3 * MB;
const VIEW_PUBLIC_PATH = /^\/v1\/public\/([a-f0-9-]{36})(?:\/(preview|download|page\/([1-9]\d{0,2})))?$/i;
const VIEW_ADMIN_PATH = /^\/v1\/assets\/([a-f0-9-]{36})\/(page\/([1-9]\d{0,2})|publication)$/i;
const viewPageKey=(id,n)=>'derivatives/'+id+'/pages/'+n+'.jpg';
const viewUrl=id=>'https://realmetayninh7649-cmd.github.io/dau-xua-cua-dao/r2-xem.html?asset='+id;
function imageResponse(object,originAllowed) {
  const headers=new Headers({
    'content-type':object.httpMetadata?.contentType||'image/jpeg',
    'cache-control':'no-store','x-content-type-options':'nosniff',
    'content-disposition':'inline','referrer-policy':'no-referrer',
    'cross-origin-resource-policy':'cross-origin'
  });
  if(originAllowed){headers.set('access-control-allow-origin',ORIGIN);headers.set('vary','Origin')}
  return new Response(object.body,{status:200,headers});
}
async function publicView(req,env,path,originAllowed) {
  if(req.method!=='GET')return failure(405,'Method not allowed',originAllowed);
  const match=VIEW_PUBLIC_PATH.exec(path);
  if(!match||!UUID.test(match[1]))return failure(404,'Không tìm thấy bản xem',originAllowed);
  const id=match[1],variant=match[2]||'',page=Number(match[3]||0);
  let meta;
  try{meta=await getMeta(env,id)}catch{return failure(503,'Chưa đọc được bản xem',originAllowed)}
  if(!meta?.published)return failure(404,'Bản xem chưa công bố',originAllowed);
  if(!variant){
    const data={
      id,kind:meta.kind,
      name:String(meta.originalName||'Tư liệu').slice(0,160),
      pageCount:meta.kind==='document'?meta.pageCount:1,
      viewSource:meta.kind==='document'?meta.viewSource:'image',
      allowDownload:meta.kind==='image'&&meta.allowDownload===true&&meta.download===true,
      version:VERSION
    };
    return respond(data,200,originAllowed);
  }
  if(variant==='download'&&!(meta.kind==='image'&&meta.download&&meta.allowDownload))
    return failure(404,'Bản tải chưa cho phép',originAllowed);
  if(variant==='preview'&&!(meta.kind==='image'&&meta.preview))
    return failure(404,'Không có ảnh xem',originAllowed);
  if(variant.startsWith('page/')){
    if(meta.kind!=='document'||!Number.isInteger(page)||page<1||page>VIEW_MAX_PAGES||page>meta.pageCount)
      return failure(404,'Không có trang này',originAllowed);
  }
  const key=variant==='preview'
    ?'derivatives/'+id+'/preview'+(meta.previewMime==='image/jpeg'?'.jpg':'.webp')
    :variant==='download'?'derivatives/'+id+'/download.jpg':viewPageKey(id,page);
  try{
    const object=await env.GDD_BUCKET.get(key);
    if(!object?.body)return failure(404,'Không có ảnh đã xuất bản',originAllowed);
    return imageResponse(object,originAllowed);
  }catch{return failure(503,'Không đọc được ảnh xem',originAllowed)}
}
async function adminView(req,env,path,cors,user) {
  const match=VIEW_ADMIN_PATH.exec(path);
  if(!match||!UUID.test(match[1]))return failure(404,'Đường dẫn không hợp lệ',cors);
  const id=match[1],operation=match[2],page=Number(match[3]||0);
  const meta=await getMeta(env,id);
  if(!ownsMeta(meta,user,id))return failure(404,'Không tìm thấy tư liệu riêng',cors);
  if(operation.startsWith('page/')&&req.method==='PUT'){
    if(meta.kind!=='document'||!['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(meta.mime))
      return failure(400,'Chỉ PDF/DOCX có thể tạo bản xem từng trang',cors);
    if(!Number.isInteger(page)||page<1||page>VIEW_MAX_PAGES)return failure(400,'Số trang vượt giới hạn',cors);
    if(req.headers.get('content-type')?.split(';')[0]!=='image/jpeg')
      return failure(415,'Bản xem từng trang phải là JPEG',cors);
    const declared=req.headers.get('content-length');
    if(declared!==null&&(!Number.isSafeInteger(Number(declared))||Number(declared)<1||Number(declared)>VIEW_PAGE_MAX_BYTES))
      return failure(413,'Trang xem quá 3 MB',cors);
    if(!req.body)return failure(400,'Trang xem trống',cors);
    let body;
    try{body=new Uint8Array(await req.arrayBuffer())}catch{return failure(400,'Không đọc được trang',cors)}
    if(body.byteLength<32||body.byteLength>VIEW_PAGE_MAX_BYTES
      ||(declared!==null&&body.byteLength!==Number(declared))
      ||body[0]!==255||body[1]!==216||body[2]!==255)
      return failure(415,'Ảnh trang không hợp lệ',cors);
    try{
      await env.GDD_BUCKET.put(viewPageKey(id,page),body,{
        httpMetadata:{contentType:'image/jpeg',contentDisposition:'inline',cacheControl:'no-store'}
      });
      // Never modify original meta or the uploaded original object.
      return respond({id,page,storedBytes:body.byteLength,originalUnchanged:true},201,cors);
    }catch{return failure(503,'Không ghi được trang xem',cors)}
  }
  if(operation==='publication'&&req.method==='POST'){
    let body;
    try{body=await jsonBody(req,2048)}catch{return failure(400,'Thông tin công bố không hợp lệ',cors)}
    if(typeof body?.publish!=='boolean')return failure(400,'Chưa xác nhận trạng thái công bố',cors);
    if(!body.publish){
      meta.published=false;meta.allowDownload=false;
      meta.updatedAt=new Date().toISOString();
      await saveMeta(env,meta);
      return respond({id,published:false,originalPrivate:true},200,cors);
    }
    if(meta.kind==='document'){
      const total=body.pageCount,source=body.viewSource;
      const expected=meta.mime==='application/pdf'?'pdf':'docx_text';
      if(source!==expected||!Number.isInteger(total)||total<1||total>VIEW_MAX_PAGES)
        return failure(400,'Thiếu hoặc sai thông tin bản xem tài liệu',cors);
      try{
        for(let n=1;n<=total;n++){
          const head=await env.GDD_BUCKET.head(viewPageKey(id,n));
          if(!head||head.size<32||head.size>VIEW_PAGE_MAX_BYTES)return failure(409,'Bản xem thiếu trang '+n,cors);
        }
      }catch{return failure(503,'Chưa kiểm tra được đủ trang xem',cors)}
      meta.pageCount=total;meta.viewSource=source;
      meta.allowDownload=false;
    } else if(meta.kind==='image'){
      const mime=meta.previewMime==='image/jpeg'?'jpg':'webp';
      if(!meta.preview||!(await env.GDD_BUCKET.head('derivatives/'+id+'/preview.'+mime)))
        return failure(409,'Chưa có ảnh xem tối ưu',cors);
      meta.allowDownload=body.allowDownload===true&&meta.download===true;
      meta.pageCount=1;meta.viewSource='image';
    } else return failure(400,'Tư liệu không hỗ trợ bản xem',cors);
    meta.published=true;meta.updatedAt=new Date().toISOString();
    await saveMeta(env,meta);
    return respond({id,published:true,pageCount:meta.pageCount,viewSource:meta.viewSource,
      allowDownload:meta.allowDownload===true,viewUrl:viewUrl(id),originalPrivate:true},200,cors);
  }
  return failure(404,'Đường dẫn không tồn tại',cors);
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
    // Public chỉ được đọc bản xem do quản trị viên công bố, không có bản gốc.
    if(path.startsWith('/v1/public/'))return publicView(req,env,path,cors);
    if(!['GET','POST','PUT'].includes(req.method))return failure(405,'Method not allowed',cors);
    const user=await authenticate(req,env);
    if(!user)return failure(403,'Chỉ Quản trị viên hợp lệ được truy cập',cors);
    if(VIEW_ADMIN_PATH.test(path))return adminView(req,env,path,cors,user);
    return api(req,env,url,cors,user);
  }
};
