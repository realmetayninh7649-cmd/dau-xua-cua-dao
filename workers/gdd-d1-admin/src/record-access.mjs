import {LEGACY_PUBLISHED_PATHS} from '../../gdd-r2-gateway/src/legacy-published-paths.mjs';
const GATE='https://gdd-r2-gateway.realmetayninh7649.workers.dev',API='https://gdd-d1-api-staging.realmetayninh7649.workers.dev';
const OLD='https://gwpdgubxoquhrfbolftq.supabase.co',PREFIX='/storage/v1/object/public/dao-su-images/',LP='/v1/legacy-preview/';
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow'};
function reply(value,status=200){return new Response(JSON.stringify(value),{status,headers:{...headers,'Content-Type':'application/json; charset=utf-8'}})}
export function mediaRef(raw){
 try{const u=new URL(raw);if(u.username||u.password||u.hash)return null;
 if(u.origin===GATE&&!u.search){const m=/^\/v1\/public\/([a-f0-9-]{36})(?:\/preview)?$/i.exec(u.pathname);if(m&&ID.test(m[1]))return 'managed:'+m[1];if(u.pathname.startsWith(LP)&&u.pathname.endsWith('.webp')){const name=decodeURIComponent(u.pathname.slice(LP.length,-5));if(LEGACY_PUBLISHED_PATHS.has(name))return 'legacy:'+name}}
 if(u.origin===OLD&&!u.search&&u.pathname.startsWith(PREFIX)){const name=decodeURIComponent(u.pathname.slice(PREFIX.length));if(LEGACY_PUBLISHED_PATHS.has(name))return 'legacy:'+name}
 if(u.origin==='https://dauxuacuadao.info.vn'&&u.pathname==='/r2-xem.html'&&ID.test(u.searchParams.get('asset')||'')&&!u.searchParams.has('attachment')&&!u.searchParams.has('download')&&!u.searchParams.has('source'))return 'managed:'+u.searchParams.get('asset');
 }catch{}return null;
}
export async function protectedKey(ref,variant){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ref));
 return 'protected-view-v1/'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')+'/'+variant.replace('page/','page-')+'.jpg';
}
async function metadata(env,ref){const id=ref.slice(8);if(!ID.test(id))throw Error('Mã ảnh không hợp lệ');const obj=await env.GDD_BUCKET.get('meta/'+id+'.json'),m=obj?await obj.json():null;if(!m||m.id!==id)throw Error('Thiếu metadata tư liệu');return m}
async function sourceKey(env,ref,variant){
 if(ref.startsWith('legacy:')&&LEGACY_PUBLISHED_PATHS.has(ref.slice(7))&&variant==='preview')return 'legacy-private-image-previews-v1/'+ref.slice(7)+'.webp';
 if(!ref.startsWith('managed:'))throw Error('Tư liệu không hợp lệ');
 const m=await metadata(env,ref),id=ref.slice(8);
 if(variant==='preview'&&m.kind==='image'&&m.preview)return 'derivatives/'+id+'/preview'+(m.previewMime==='image/jpeg'?'.jpg':'.webp');
 if(/^page\/(?:[1-9]\d{0,1}|1[01]\d|120)$/.test(variant)&&m.kind==='document')return 'derivatives/'+id+'/pages/'+variant.slice(5)+'.jpg';
 throw Error('Bản xem không hợp lệ');
}
async function inventory(env,kind,id,record,input){
 const urls=[record.image_url,record.cover_url,record.file_url,...(Array.isArray(input.urls)?input.urls:[])].filter(Boolean);
 const {results:gallery=[]}=await env.DB.prepare('SELECT image_url FROM archive_gallery_images WHERE owner_kind=? AND owner_id=? LIMIT 201').bind(kind,id).all();
 const {results:assets=[]}=await env.DB.prepare("SELECT asset_id,media_kind,role FROM gdd_r2_assets WHERE record_kind=? AND record_id=? LIMIT 201").bind(kind,id).all();
 const {results:covers=[]}=await env.DB.prepare('SELECT asset_id FROM gdd_editor_cover_slots WHERE kind=? AND record_id=?').bind(kind,id).all();
 if(gallery.length>200||assets.length>200)throw Error('Bộ tư liệu quá lớn');
 urls.push(...gallery.map(r=>r.image_url).filter(Boolean));const refs=new Set();
 for(const url of urls){const ref=mediaRef(url);if(!ref)throw Error('Có liên kết ngoài kho R2 chưa kiểm soát được; hãy thay bằng tư liệu R2 trước khi khóa tải.');refs.add(ref)}
 for(const a of assets)if(a.media_kind==='image'||a.role==='attachment')refs.add('managed:'+a.asset_id);
 for(const c of covers)refs.add('managed:'+c.asset_id);
 if(refs.size>35)throw Error('Tối đa 35 ảnh/tệp mỗi hồ sơ trong đợt này; hãy chia hồ sơ.');
 const entries=[],plans=Array.isArray(input.plans)?input.plans:[];
 for(const ref of refs){
  if(ref.startsWith('legacy:')){entries.push({ref,variant:'preview'});continue}
  const m=await metadata(env,ref);
  if(m.kind==='image'&&m.preview){entries.push({ref,variant:'preview'});continue}
  if(m.kind!=='document')throw Error('Có ảnh chưa tạo bản xem');
  const plan=plans.find(x=>x.assetId===m.id),n=Number(plan?.total||m.pageCount||0);
  if(!Number.isInteger(n)||n<1||n>120||(!plan&&!m.published))throw Error('PDF/Word chưa có bản đọc từng trang; hãy tạo bản đọc trước.');
  for(let i=1;i<=n;i++)entries.push({ref,variant:'page/'+i});
 }
 if(input.mode==='protected'&&entries.length+[...refs].filter(x=>x.startsWith('managed:')).length>40)throw Error('Tập dài vượt giới hạn tạo watermark của đợt này; chọn Chỉ xem hoặc chia tập.');
 return {refs:[...refs],entries};
}
// Same-account workers.dev calls must use service bindings, not global fetch.
export async function verifyRecordAccessReady(env){
 const checks=[
  ['R2',env.RECORD_GATEWAY,GATE+'/record-access-ready'],
  ['D1',env.RECORD_PUBLIC_API,API+'/api/v1/public/access-ready']
 ];
 const failures=await Promise.all(checks.map(async ([name,binding,url])=>{
  try{
   if(!binding||typeof binding.fetch!=='function')return name+' (chưa kết nối nội bộ)';
   const response=await binding.fetch(new Request(url,{method:'GET',headers:{'Cache-Control':'no-cache'}}));
   if(!response.ok)return name+' (HTTP '+response.status+')';
   return (await response.json()).record_access===true?null:name+' (chưa sẵn sàng)';
  }catch{return name+' (lỗi kết nối)'}
 }));
 if(failures.some(Boolean))throw Error('Máy chủ bảo vệ chưa sẵn sàng: '+failures.filter(Boolean).join(', ')+'; chưa đổi quyền.');
}
export async function handleRecordAccess(req,env,path){
 const match=/^\/api\/v1\/admin\/work\/(people|documents)\/([a-f0-9-]{36})\/record-access(?:\/(source|prepare))?$/.exec(path);
 if(!match||!ID.test(match[2]))return reply({error:'invalid_access_route'},404);
 const [,kind,id,operation]=match;
 try{
  const record=await env.DB.prepare('SELECT * FROM "'+kind+'" WHERE id=?').bind(id).first();if(!record)return reply({error:'record_not_found'},404);
  const row=await env.DB.prepare('SELECT mode FROM gdd_record_access WHERE kind=? AND record_id=?').bind(kind,id).first();
  if(req.method==='GET'&&!operation)return reply({mode:row?.mode||'download'});
  if(req.method==='GET'&&operation==='source'){const q=new URL(req.url).searchParams,key=await sourceKey(env,q.get('ref')||'',q.get('variant')||''),obj=await env.GDD_BUCKET.get(key);if(!obj?.body)return reply({error:'Thiếu bản xem nguồn'},404);return new Response(obj.body,{headers:{...headers,'Content-Type':obj.httpMetadata?.contentType||'image/jpeg'}})}
  if(req.method!=='POST')return reply({error:'method_not_allowed'},405);
  const raw=await req.text();if(raw.length>3_000_000)return reply({error:'body_too_large'},413);const input=JSON.parse(raw);
  if(operation==='prepare'&&input.operation==='upload'){
   const ref=String(input.ref||''),variant=String(input.variant||'');const key=await sourceKey(env,ref,variant);
   if(!await env.GDD_BUCKET.head(key))throw Error('Thiếu bản xem nguồn');
   const bytes=Uint8Array.from(atob(String(input.jpeg||'')),x=>x.charCodeAt(0));if(bytes.length<32||bytes.length>2*1048576||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)throw Error('JPEG bảo vệ không hợp lệ');
   await env.GDD_BUCKET.put(await protectedKey(ref,variant),bytes,{httpMetadata:{contentType:'image/jpeg',cacheControl:'no-store'}});return reply({stored:true});
  }
  if(!['download','view','protected'].includes(input.mode)||!Number.isSafeInteger(input.version)||record.gdd_version!==input.version)return reply({error:'Phiên bản hồ sơ đã thay đổi hoặc quyền không hợp lệ'},409);
  if(input.mode==='download'&&!operation){await env.DB.prepare("INSERT INTO gdd_record_access(kind,record_id,mode) VALUES(?,?,'download') ON CONFLICT(kind,record_id) DO UPDATE SET mode='download',updated_at=CURRENT_TIMESTAMP").bind(kind,id).run();return reply({mode:'download'})}
  if(input.draft===true&&!operation&&Number(record.published)===0){
   await verifyRecordAccessReady(env);
   await env.DB.prepare("INSERT INTO gdd_record_access(kind,record_id,mode) VALUES(?,?,?) ON CONFLICT(kind,record_id) DO UPDATE SET mode=excluded.mode,updated_at=CURRENT_TIMESTAMP").bind(kind,id,input.mode).run();
   return reply({mode:input.mode,draft:true});
  }
  const inv=await inventory(env,kind,id,record,input);
  if(operation==='prepare'){await verifyRecordAccessReady(env);return reply({entries:inv.entries,legacy:inv.refs.some(x=>x.startsWith('legacy:'))});}
  await verifyRecordAccessReady(env);
  if(input.mode==='protected')for(const e of inv.entries)if(!await env.GDD_BUCKET.head(await protectedKey(e.ref,e.variant)))return reply({error:'Thiếu bản xem watermark; chưa đổi quyền'},409);
  await env.DB.batch([env.DB.prepare("INSERT INTO gdd_record_access(kind,record_id,mode) VALUES(?,?,?) ON CONFLICT(kind,record_id) DO UPDATE SET mode=excluded.mode,updated_at=CURRENT_TIMESTAMP").bind(kind,id,input.mode),...inv.refs.map(ref=>env.DB.prepare('INSERT OR IGNORE INTO gdd_access_media(kind,record_id,media_ref) VALUES(?,?,?)').bind(kind,id,ref))]);
  return reply({mode:input.mode,legacy:inv.refs.some(x=>x.startsWith('legacy:'))});
 }catch(e){console.error('Record access',String(e?.name||'Error'));return reply({error:String(e?.message||'Chưa thể lưu quyền').slice(0,200)},409)}
}
