/* DẤU XƯA CỬA ĐẠO — Cloudflare Access administrator preview (STAGING).
 * Authenticated only via trusted Cloudflare ctx.access; never trust client headers.
 * D1 queries SELECT ONLY. No imports, writes, uploads or access to private records.
 * Admin UI is intentionally separate from production R2 and public API Workers.
 */
import {ADMIN_HTML,ADMIN_CSS,ADMIN_JS} from './admin-ui.mjs';
import SOURCE_BASELINE from '../../gdd-d1/source-row-counts-20261123.json' with {type:'json'};
import SOURCE_AUDIT from '../../gdd-d1/source-integrity-audit-20261123.json' with {type:'json'};
import R2_BASELINE from '../../gdd-d1/r2-object-inventory-snapshot-20261123.json' with {type:'json'};
const INVENTORY=Object.freeze([
 'admin_users','archive_gallery_images','documents','gdd_album_photo_counters',
 'gdd_audio_programs','gdd_calendar_memorials','gdd_content_metric_events',
 'gdd_content_metrics','gdd_content_placements','gdd_memorials',
 'gdd_r2_assets','gdd_site_download_events','gdd_site_download_totals',
 'gdd_visit_sessions','gdd_visit_totals','media','obituaries','people',
 'posts','submissions','videos'
]);
const PUBLISHED_TABLES=Object.freeze([
 'people','posts','media','videos','obituaries','documents',
 'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials'
]);
const SQL_LISTS=Object.freeze({
 people:'SELECT id, full_name AS title, rank AS category, archive_code, created_at FROM people WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
 posts:'SELECT id, title, category, archive_code, created_at FROM posts WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
 media:'SELECT id, title, category, archive_code, created_at FROM media WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
 videos:'SELECT id, title, NULL AS category, archive_code, created_at FROM videos WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
 obituaries:'SELECT id, title, memorial_date AS category, archive_code, created_at FROM obituaries WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
 documents:'SELECT id, title, document_number AS category, archive_code, created_at FROM documents WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
 gdd_memorials:'SELECT id, title, rank_title AS category, NULL AS archive_code, created_at FROM gdd_memorials WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
 gdd_audio_programs:'SELECT id, title, category, NULL AS archive_code, created_at FROM gdd_audio_programs WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?',
 gdd_calendar_memorials:'SELECT id, full_name AS title, rank AS category, NULL AS archive_code, created_at FROM gdd_calendar_memorials WHERE published=1 ORDER BY created_at DESC LIMIT ? OFFSET ?'
});
const HEADERS=Object.freeze({
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer',
 'X-Robots-Tag':'noindex, nofollow',
 'Cache-Control':'private, no-store'
});
function reply(body,status=200,type='application/json; charset=utf-8',extra={}){
 return new Response(type.startsWith('application/json')?JSON.stringify(body):body,
   {status,headers:{...HEADERS,'Content-Type':type,...extra}});
}
function json(data,status=200){return reply(data,status)}
async function matchesEditorEmail(email,expectedDigest){
 if(typeof email!=='string'||!email.trim()
    ||typeof expectedDigest!=='string'
    ||!/^[a-f0-9]{64}$/.test(expectedDigest))return false;
 const normalized=email.trim().toLowerCase();
 const bytes=new TextEncoder().encode(normalized);
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 const hex=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
 return hex===expectedDigest;
}
async function isAdministrator(env,ctx){
 if(typeof env.ACCESS_AUD!=='string'
    || !/^[a-f0-9]{64}$/.test(env.ACCESS_AUD)
    || !/^[a-f0-9]{64}$/.test(env.ADMIN_EMAIL_SHA256||'')
    || !ctx?.access
    || ctx.access.aud!==env.ACCESS_AUD
    || typeof ctx.access.getIdentity!=='function')return false;
 try{
   const identity=await ctx.access.getIdentity();
   return await matchesEditorEmail(identity?.email,env.ADMIN_EMAIL_SHA256);
 }catch{return false}
}
function pageParams(url){
 const limit=Number(url.searchParams.get('limit')||15);
 const offset=Number(url.searchParams.get('offset')||0);
 if(!Number.isInteger(limit)||limit<1||limit>50
    ||!Number.isInteger(offset)||offset<0||offset>5000)return null;
 return {limit,offset};
}
async function inventory(env){
 const rows=[];
 // Sequential queries avoid opening many simultaneous D1 connections on the Free tier.
 for(const table of INVENTORY){
   const n=await env.DB.prepare('SELECT COUNT(*) AS n FROM "'+table+'"').first('n');
   rows.push({table,count:Number(n)||0});
 }
 // Full restoration includes unpublished records; count only genuinely published rows.
 let publishedCount=0;
 for(const table of PUBLISHED_TABLES){
   const n=await env.DB.prepare('SELECT COUNT(*) AS n FROM "'+table+'" WHERE published=1').first('n');
   publishedCount+=Number(n)||0;
 }
 const counts=Object.fromEntries(rows.map(x=>[x.table,x.count]));
 const enriched=rows.map(row=>({
   ...row,
   source_count:Number(SOURCE_BASELINE.table_counts[row.table]??0),
   remaining:Math.max(0,Number(SOURCE_BASELINE.table_counts[row.table]??0)-row.count)
 }));
 return {
   mode:'staging-read-only',write_enabled:false,table_count:INVENTORY.length,
   source_snapshot_date:SOURCE_BASELINE.snapshot_date,
   source_integrity_snapshot:SOURCE_AUDIT,
   r2_object_inventory_snapshot:{
     verified_at_utc:R2_BASELINE.verified_at_utc,
     object_count:R2_BASELINE.object_count,
     total_bytes:R2_BASELINE.total_bytes,
     fingerprint_algorithm:'sha256-of-object-list'
   },
   source_total:SOURCE_BASELINE.expected_total,
   total_records:rows.reduce((s,x)=>s+x.count,0),
   remaining_records:enriched.reduce((s,x)=>s+x.remaining,0),
   published_records:publishedCount,
   row_counts_match_snapshot:enriched.every(row=>row.count===row.source_count),
   gallery_images:counts.archive_gallery_images||0,
   r2_asset_records:counts.gdd_r2_assets||0,
   inventory:enriched
 };
}
export default {
 async fetch(request,env,ctx){
   if(request.method!=='GET')
     return json({error:'read_only',write_enabled:false},405);
   const url=new URL(request.url),path=url.pathname;
   // Health shows no data and no identity. External Access guards the hostname.
   if(path==='/health')
     return json({status:'ok',mode:'admin-staging-read-only',
       access_configured:Boolean(env.ACCESS_AUD&&env.ADMIN_EMAIL_SHA256),
       db_configured:Boolean(env.DB)});
   // Validate runtime identity on EVERY admin page and data endpoint.
   if(!await isAdministrator(env,ctx))
     return json({authenticated:false,error:'unauthorized'},403);
   if(path==='/api/v1/admin/session')
     return json({authenticated:true,role:'administrator',write_enabled:false,mode:'staging-read-only'});
   if(path==='/'||path==='/admin')
     return reply(ADMIN_HTML,200,'text/html; charset=utf-8',{
       'Content-Security-Policy':"default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
       'X-Frame-Options':'DENY'
     });
   if(path==='/admin/style.css')return reply(ADMIN_CSS,200,'text/css; charset=utf-8');
   if(path==='/admin/app.js')return reply(ADMIN_JS,200,'application/javascript; charset=utf-8');
   if(path==='/api/v1/admin/summary'||path==='/api/v1/admin/records'){
     if(!env.DB)return json({error:'database_unconfigured'},503);
     try{
       if(path==='/api/v1/admin/summary')return json(await inventory(env));
       const kind=url.searchParams.get('kind');
       // A selected subset of *published* records only. Never expose admin_users/submissions/drafts.
       if(!Object.prototype.hasOwnProperty.call(SQL_LISTS,kind||''))
         return json({error:'not_found'},404);
       const paging=pageParams(url);
       if(!paging)return json({error:'invalid_pagination'},400);
       const {results}=await env.DB.prepare(SQL_LISTS[kind])
         .bind(paging.limit,paging.offset).all();
       return json({kind,data:results||[],limit:paging.limit,offset:paging.offset,
         write_enabled:false});
     }catch(e){
       console.error('Admin preview query error',String(e?.name||'unknown'));
       return json({error:'service_unavailable'},503);
     }
   }
   return json({error:'not_found'},404);
 }
};
