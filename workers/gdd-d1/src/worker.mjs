import {serveAudio} from './public-audio.mjs';
/* Dấu Xưa Cửa Đạo — Cloudflare D1 public API (STAGING ONLY).
 * No Supabase keys. Never deploy admin writes until Access and restore tests pass.
 * The original data remains unchanged in Supabase and R2. */
import {handleContribution} from './public-contributions.mjs';
import {handleSiteStats} from './public-statistics.mjs';
const PUBLIC_TABLES = Object.freeze(new Set([
  'people','posts','media','videos','obituaries','documents',
  'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials'
]));
const ALBUM_OWNERS = PUBLIC_TABLES;
const BOOL_FIELDS = new Set(['published','verified','death_lunar_leap','lunar_leap']);
const ARRAY_FIELDS = new Set(['archive_code_aliases']);
// Public gallery/placement records have no published flag, so protect them
// with an EXISTS check against a published parent in an explicitly listed table.
const publicOwnerPredicate = alias => [
  ['people','people'],['posts','posts'],['media','media'],['videos','videos'],
  ['obituaries','obituaries'],['documents','documents']
].map(([kind,table]) =>
  `(${alias}.owner_kind='${kind}' AND EXISTS(SELECT 1 FROM "${table}" p WHERE p.id=${alias}.owner_id AND p.published=1))`
).join(' OR ');
const galleryOwnerPredicate=alias=>[...PUBLIC_TABLES].map(kind=>`(${alias}.owner_kind='${kind}' AND EXISTS(SELECT 1 FROM "${kind}" p WHERE p.id=${alias}.owner_id AND p.published=1))`).join(' OR ');
const PUBLIC_GALLERY_SQL='SELECT g.* FROM archive_gallery_images g WHERE ('+
  galleryOwnerPredicate('g')+') ORDER BY g.created_at DESC, g.sort_order ASC LIMIT ? OFFSET ?';
const PUBLIC_PLACEMENTS_SQL='SELECT x.* FROM gdd_content_placements x WHERE ('+
  publicOwnerPredicate('x')+') ORDER BY x.updated_at DESC LIMIT ? OFFSET ?';
const ALLOWED_ORIGINS = new Set([
  'https://dauxuacuadao.info.vn',
  'https://www.dauxuacuadao.info.vn',
  'https://gdd-site-d1-preview.realmetayninh7649.workers.dev'
]);
function castRecord(row) {
  if(!row)return row;
  const result={...row};
  for(const field of BOOL_FIELDS)if(result[field]!==undefined && result[field]!==null)
    result[field]=result[field]===1 || result[field]===true;
  for(const field of ARRAY_FIELDS)if(typeof result[field]==='string'){
    try {result[field]=JSON.parse(result[field])}catch{result[field]=[]}
  }
  return result;
}
function respond(request, data, status=200, opts={}) {
  const origin=request.headers.get('Origin');
  const headers=new Headers({
    'Content-Type':'application/json; charset=utf-8',
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    'Cache-Control':opts.private?'no-store':'public, max-age=60, s-maxage=300',
    'Vary':'Origin'
  });
  if(origin && ALLOWED_ORIGINS.has(origin)) headers.set('Access-Control-Allow-Origin',origin);
  return new Response(JSON.stringify(data),{status,headers});
}
async function isAuthorizedAdmin(ctx,env){
  // Fail closed unless Cloudflare Access is configured and validates the user.
  if(!ctx?.access || !env.ACCESS_AUD || ctx.access.aud!==env.ACCESS_AUD
    || !env.ADMIN_EMAILS)return false;
  try{
    const identity=await ctx.access.getIdentity();
    const user=String(identity?.email||'').toLowerCase().trim();
    const allow=new Set(String(env.ADMIN_EMAILS).toLowerCase().split(',')
      .map(x=>x.trim()).filter(Boolean));
    return Boolean(user&&allow.has(user));
  }catch{return false}
}
function parsePage(url){
  const input=Number(url.searchParams.get('limit')||30),skip=Number(url.searchParams.get('offset')||0);
  if(!Number.isInteger(input)||input<1||input>100||!Number.isInteger(skip)||skip<0||skip>5000)
    return null;
  return {limit:input,offset:skip};
}
export default {
  async fetch(request,env,ctx){
    const incomingPath=new URL(request.url).pathname;
    if(incomingPath==='/api/v1/contributions'){
      return handleContribution(request,env);
    }
    if(incomingPath==='/api/v1/stats'||incomingPath.startsWith('/api/v1/stats/')){
      return handleSiteStats(request,env,incomingPath);
    }
    const docDownload=/^\/api\/v1\/public\/attachments\/([a-z_]+)\/([a-f0-9-]{36})\/([a-f0-9-]{36})\/download$/.exec(incomingPath);
    if(docDownload){
      if(!['GET','HEAD'].includes(request.method))return respond(request,{error:'read_only'},405,{private:true});
      const [,kind,id,asset]=docDownload;
      const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
      const deny=()=>respond(request,{error:'not_found'},404,{private:true});
      if(!PUBLIC_TABLES.has(kind)||!uuid.test(id)||!uuid.test(asset)||!env.DB||!env.SUBMISSIONS_BUCKET)return deny();
      try{
        const row=await env.DB.prepare("SELECT a.asset_id,a.owner_id,a.original_name,a.original_bytes,a.view_source FROM gdd_r2_assets a WHERE a.asset_id=? AND a.record_kind=? AND a.record_id=? AND a.role='attachment' AND a.media_kind='document' AND a.allow_download=1 AND EXISTS(SELECT 1 FROM \""+kind+"\" p WHERE p.id=a.record_id AND p.published=1) LIMIT 1").bind(asset,kind,id).first();
        if(!row||row.asset_id!==asset||!uuid.test(row.owner_id||''))return deny();
        const ext=String(row.original_name||'').split('.').pop().toLowerCase();
        const inline=new URL(request.url).searchParams.get('view')==='1';
        if(inline&&(ext!=='pdf'||row.view_source!=='single_pdf'))return deny();
        const types={pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'};
        if(!Object.hasOwn(types,ext)||!Number.isSafeInteger(Number(row.original_bytes))||Number(row.original_bytes)<1||Number(row.original_bytes)>45*1048576)return deny();
        const key='originals/'+row.owner_id+'/'+asset+'/original.'+ext;
        const info=await env.SUBMISSIONS_BUCKET.get('meta/'+asset+'.json');
        const meta=info?await info.json():null;
        if(!meta||meta.id!==asset||meta.owner!==row.owner_id||meta.key!==key||meta.kind!=='document'||meta.mime!==types[ext])return deny();
        const file=request.method==='HEAD'?await env.SUBMISSIONS_BUCKET.head(key):await env.SUBMISSIONS_BUCKET.get(key);
        if(!file||file.size!==Number(row.original_bytes))return deny();
        const filename=encodeURIComponent(String(row.original_name).slice(0,160)).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16));
        return new Response(request.method==='HEAD'?null:file.body,{headers:{'Content-Type':types[ext],'Content-Length':String(file.size),'Content-Disposition':(inline?'inline':'attachment')+"; filename=\"document."+ext+"\"; filename*=UTF-8''"+filename,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
      }catch{return respond(request,{error:'download_unavailable'},503,{private:true})}
    }
    const managedAudio=/^\/api\/v1\/public\/audio\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/([a-f0-9]{64})\.mp3$/.exec(incomingPath);
    if(managedAudio)return serveAudio(request,env,managedAudio[1],managedAudio[2],respond,ALLOWED_ORIGINS);
    // Only this verified previously public MP3, never a caller-supplied R2 key.
    if(incomingPath==='/api/v1/public/audio/radio-hai-muoi-nam.mp3'){
      if(!['GET','HEAD'].includes(request.method))return respond(request,{error:'read_only'},405,{private:true});
      const key='public-audio/radio-hai-muoi-nam-d19ee4f8.mp3';
      const target='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/audio/radio-hai-muoi-nam.mp3';
      try{
        const row=await env.DB.prepare('SELECT id FROM gdd_audio_programs WHERE id=? AND published=1 AND audio_url=? LIMIT 1').bind('51fb2d6c-8085-4e41-82c6-fc10f9da7553',target).first();
        if(!row||!env.SUBMISSIONS_BUCKET)return respond(request,{error:'not_found'},404,{private:true});
        const total=16116406;
        const range=request.headers.get('Range');
        let start=0,end=total-1,partial=false;
        if(range){
          const m=/^bytes=(\d*)-(\d*)$/.exec(range);
          if(!m||(!m[1]&&!m[2]))return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+total}});
          if(m[1]){start=Number(m[1]);if(m[2])end=Math.min(Number(m[2]),total-1);}
          else {const suffix=Number(m[2]);if(!Number.isSafeInteger(suffix)||suffix<1)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+total}});start=Math.max(0,total-suffix);}
          if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=total||end<start)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+total}});
          partial=true;
        }
        const object=request.method==='HEAD'?await env.SUBMISSIONS_BUCKET.head(key):await env.SUBMISSIONS_BUCKET.get(key,partial?{range:{offset:start,length:end-start+1}}:{});
        if(!object||object.size!==total||object.customMetadata?.sha256!=='d19ee4f882e1c24f17fda53da2e31f44ea4ea9660923778ab8630208601d9122')return respond(request,{error:'not_found'},404,{private:true});
        const h=new Headers({'Content-Type':'audio/mpeg','Content-Length':String(end-start+1),'Accept-Ranges':'bytes','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff','ETag':object.httpEtag});
        if(partial)h.set('Content-Range','bytes '+start+'-'+end+'/'+total);
        const origin=request.headers.get('Origin');if(origin&&ALLOWED_ORIGINS.has(origin))h.set('Access-Control-Allow-Origin',origin);
        h.set('Vary','Origin');
        return new Response(request.method==='HEAD'?null:object.body,{status:partial?206:200,headers:h});
      }catch{return respond(request,{error:'audio_unavailable'},503,{private:true});}
    }
    if(request.method==='OPTIONS'){
      const origin=request.headers.get('Origin');
      if(!origin||!ALLOWED_ORIGINS.has(origin))return respond(request,{error:'forbidden'},403,{private:true});
      const h=new Headers({
        'Access-Control-Allow-Origin':origin,
        'Access-Control-Allow-Methods':'GET, OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type',
        'Access-Control-Max-Age':'600','Vary':'Origin'
      });
      return new Response(null,{status:204,headers:h});
    }
    if(request.method!=='GET')return respond(request,{error:'read_only',message:'Writes remain disabled during migration.'},405,{private:true});
    const url=new URL(request.url),path=url.pathname.split('/').filter(Boolean);
    if(path.length===1&&path[0]==='health')
      return respond(request,{status:env.DB?'ok':'unconfigured',mode:'staging-read-only'},env.DB?200:503,{private:true});
    if(!env.DB)return respond(request,{error:'database_unconfigured'},503,{private:true});
    if(path.length===3&&path[0]==='api'&&path[1]==='v1'&&path[2]==='admin')
      return respond(request,{error:'not_found'},404,{private:true});
    if(path.join('/')==='api/v1/admin/session'){
      const ok=await isAuthorizedAdmin(ctx,env);
      return respond(request,ok?{authenticated:true,write_enabled:false}:{error:'unauthorized'},ok?200:403,{private:true});
    }
    if(path[0]!=='api'||path[1]!=='v1'||path[2]!=='public')
      return respond(request,{error:'not_found'},404,{private:true});
    try{
      if(path[3]==='attachments'&&path.length===4){
        const kind=url.searchParams.get('owner_kind'),id=url.searchParams.get('owner_id');
        if(!PUBLIC_TABLES.has(kind)||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id||''))
          return respond(request,{error:'invalid_attachment_query'},400,{private:true});
        const parent=await env.DB.prepare('SELECT id FROM "'+kind+'" WHERE id=? AND published=1 LIMIT 1').bind(id).first();
        if(!parent)return respond(request,{data:[],has_next:false},200,{private:true});
        const page=parsePage(url);if(!page)return respond(request,{error:'invalid_pagination'},400,{private:true});
        const {results=[]}=await env.DB.prepare("SELECT asset_id,original_name,CASE WHEN public_view=1 AND preview_ready=1 THEN 1 ELSE 0 END AS has_reader,CASE WHEN view_source='single_pdf' AND allow_download=1 THEN 1 ELSE 0 END AS single_pdf,CASE WHEN allow_download=1 THEN 1 ELSE 0 END AS allow_download FROM gdd_r2_assets WHERE record_kind=? AND record_id=? AND role='attachment' AND media_kind='document' AND ((public_view=1 AND preview_ready=1) OR allow_download=1) ORDER BY created_at,asset_id LIMIT ? OFFSET ?").bind(kind,id,page.limit+1,page.offset).all();
        return respond(request,{data:results.slice(0,page.limit),has_next:results.length>page.limit},200,{private:true});
      }
      if(path[3]==='covers'&&path.length===4){
        const kind=url.searchParams.get('owner_kind'),id=url.searchParams.get('owner_id');
        if(!PUBLIC_TABLES.has(kind)||!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id||''))return respond(request,{error:'invalid_cover_query'},400,{private:true});
        const parent=await env.DB.prepare('SELECT id FROM "'+kind+'" WHERE id=? AND published=1 LIMIT 1').bind(id).first();
        if(!parent)return respond(request,{data:[]},200,{private:true});
        const {results=[]}=await env.DB.prepare("SELECT c.slot,c.asset_id FROM gdd_editor_cover_slots c JOIN gdd_r2_assets a ON a.asset_id=c.asset_id WHERE c.kind=? AND c.record_id=? AND a.record_kind=c.kind AND a.record_id=c.record_id AND a.media_kind='image' AND a.public_view=1 AND a.preview_ready=1 ORDER BY c.slot LIMIT 2").bind(kind,id).all();
        return respond(request,{data:results.map(r=>({slot:r.slot,image_url:'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/'+r.asset_id+'/preview'}))},200,{private:true});
      }
      if(path[3]==='albums'&&path.length===4){
        const kind=url.searchParams.get('owner_kind'),id=url.searchParams.get('owner_id');
        if(!ALBUM_OWNERS.has(kind)||!id||!/^[a-f\d-]{36}$/i.test(id))
          return respond(request,{error:'invalid_album_query'},400,{private:true});
        const parent=await env.DB.prepare(`SELECT id FROM "${kind}" WHERE id = ? AND published = 1 LIMIT 1`)
          .bind(id).first();
        if(!parent)return respond(request,{data:[]});
        const page=parsePage(url);if(!page)return respond(request,{error:'invalid_pagination'},400,{private:true});
        const {results}=await env.DB.prepare(
          'SELECT * FROM archive_gallery_images WHERE owner_kind = ? AND owner_id = ? ORDER BY sort_order ASC, created_at ASC LIMIT ? OFFSET ?'
        ).bind(kind,id,page.limit,page.offset).all();
        return respond(request,{data:(results||[]).map(castRecord)});
      }
      if(path.length===4&&(path[3]==='gallery'||path[3]==='placements')){
        const page=parsePage(url);
        if(!page)return respond(request,{error:'invalid_pagination'},400,{private:true});
        const sql=path[3]==='gallery'?PUBLIC_GALLERY_SQL:PUBLIC_PLACEMENTS_SQL;
        const {results}=await env.DB.prepare(sql).bind(page.limit,page.offset).all();
        return respond(request,{data:(results||[]).map(castRecord)});
      }
      const table=path[3];
      if(!PUBLIC_TABLES.has(table)||path.length>5||path.length<4)
        return respond(request,{error:'not_found'},404,{private:true});
      const fields=table==='documents'?`*, (SELECT 'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/' || a.asset_id || '/preview' FROM gdd_r2_assets a WHERE a.record_kind='documents' AND a.record_id=documents.id AND a.role='cover' AND a.media_kind='image' AND a.public_view=1 AND a.preview_ready=1 ORDER BY a.view_updated_at DESC,a.created_at DESC,a.asset_id DESC LIMIT 1) AS cover_url`:'*';
      if(path.length===5){
        const slug=decodeURIComponent(path[4]||'');
        if(!/^[a-z0-9][a-z0-9_-]{0,180}$/.test(slug))
          return respond(request,{error:'invalid_slug'},400,{private:true});
        const row=await env.DB.prepare(`SELECT ${fields} FROM "${table}" WHERE published=1 AND slug=? LIMIT 1`)
          .bind(slug).first();
        return respond(request,row?{data:castRecord(row)}:{error:'not_found'},row?200:404);
      }
      const page=parsePage(url);if(!page)return respond(request,{error:'invalid_pagination'},400,{private:true});
      const {results}=await env.DB.prepare(`SELECT ${fields} FROM "${table}" WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(page.limit,page.offset).all();
      return respond(request,{data:(results||[]).map(castRecord)});
    }catch(e){
      // Do not leak SQL, table details, tokens, or source data.
      console.error('D1 staging query error',String(e?.name||'error'));
      return respond(request,{error:'service_unavailable'},503,{private:true});
    }
  }
};
