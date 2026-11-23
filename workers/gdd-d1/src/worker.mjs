/* Dấu Xưa Cửa Đạo — Cloudflare D1 public API (STAGING ONLY).
 * No Supabase keys. Never deploy admin writes until Access and restore tests pass.
 * The original data remains unchanged in Supabase and R2. */
import {handleContribution} from './public-contributions.mjs';
import {handleSiteStats} from './public-statistics.mjs';
const PUBLIC_TABLES = Object.freeze(new Set([
  'people','posts','media','videos','obituaries','documents',
  'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials'
]));
const ALBUM_OWNERS = Object.freeze(new Set([
  'people','posts','media','videos','obituaries','documents'
]));
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
const PUBLIC_GALLERY_SQL='SELECT g.* FROM archive_gallery_images g WHERE ('+
  publicOwnerPredicate('g')+') ORDER BY g.created_at DESC, g.sort_order ASC LIMIT ? OFFSET ?';
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
      if(path.length===5){
        const slug=decodeURIComponent(path[4]||'');
        if(!/^[a-z0-9][a-z0-9_-]{0,180}$/.test(slug))
          return respond(request,{error:'invalid_slug'},400,{private:true});
        const row=await env.DB.prepare(`SELECT * FROM "${table}" WHERE published=1 AND slug=? LIMIT 1`)
          .bind(slug).first();
        return respond(request,row?{data:castRecord(row)}:{error:'not_found'},row?200:404);
      }
      const page=parsePage(url);if(!page)return respond(request,{error:'invalid_pagination'},400,{private:true});
      const {results}=await env.DB.prepare(`SELECT * FROM "${table}" WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .bind(page.limit,page.offset).all();
      return respond(request,{data:(results||[]).map(castRecord)});
    }catch(e){
      // Do not leak SQL, table details, tokens, or source data.
      console.error('D1 staging query error',String(e?.name||'error'));
      return respond(request,{error:'service_unavailable'},503,{private:true});
    }
  }
};
