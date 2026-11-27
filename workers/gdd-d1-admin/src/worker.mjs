import {MANIFEST,ICON_SVG,iconPng} from './admin-app.mjs';
import {handleResearch,collectResearch} from './research.mjs';
import {RESEARCH_HTML,RESEARCH_CSS,RESEARCH_JS} from './research-ui.mjs';
import {AUDIO_OPTIMIZER_JS,AUDIO_ENCODER_WORKER} from './audio-optimizer-ui.mjs';
import {LAME_JS,LAME_LICENSE} from './audio-encoder-vendor.mjs';
import {uploadAudio} from './audio-upload.mjs';
import {recoverRadio} from './radio-recovery.mjs';
/* DẤU XƯA CỬA ĐẠO — Cloudflare Access administrator preview (STAGING).
 * Authenticated only via trusted Cloudflare ctx.access; never trust client headers.
 * D1 queries SELECT ONLY. No imports, writes, uploads or access to private records.
 * Admin UI is intentionally separate from production R2 and public API Workers.
 */
import {ADMIN_HTML,ADMIN_CSS,ADMIN_JS} from './admin-ui.mjs';
import {PHOTO_JS} from './photo-album-ui.mjs';
import {handleEditorSandbox} from './editor-sandbox.mjs';
import {handleR2Sandbox} from './r2-sandbox.mjs';
import {handleWorkingEditor} from './working-editor.mjs';
import {reviewContribution} from './contribution-review.mjs';
import {handleManagedR2} from './r2-managed.mjs';
import {handleAlbumPhotos} from './working-photo-album.mjs';
import {handleCoverSlots} from './working-cover-slots.mjs';
import {handleAttachments} from './working-attachments.mjs';
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
// Only the Access-validated administrator may request a draft list.
// Derive each statement from an internal allowlist; never interpolate client identifiers.
const DRAFT_SQL_LISTS=Object.freeze(Object.fromEntries(Object.entries(SQL_LISTS)
 .map(([kind,sql])=>[kind,sql.replace('WHERE published=1','WHERE published=0')])));
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

async function r2Inventory(env){
 if(!env.GDD_BUCKET||typeof env.GDD_BUCKET.list!=='function')return null;
 // Keys and ETags are never returned; only aggregate R2 object metadata.
 // Paginate at most 8 requests, stop rather than claiming incomplete data.
 let count=0, bytes=0, cursor;
 const seen=new Set();
 for(let page=0;page<8;page++){
   const response=await env.GDD_BUCKET.list(cursor?{limit:1000,cursor}:{limit:1000});
   if(!response||!Array.isArray(response.objects))throw new Error('invalid_r2_list');
   for(const item of response.objects){
     if(!Number.isSafeInteger(item.size)||item.size<0)throw new Error('invalid_r2_size');
     bytes+=item.size;count++;
   }
   if(!response.truncated){
     return {verified_at_utc:new Date().toISOString(),objects:count,total_bytes:bytes,
       baseline_objects:R2_BASELINE.object_count,baseline_bytes:R2_BASELINE.total_bytes,
       matches_baseline:count===R2_BASELINE.object_count && bytes===R2_BASELINE.total_bytes,
       coverage:'complete_listing_metadata_only',original_bytes_read:false,write_enabled:false};
   }
   if(!response.cursor||response.cursor===cursor||seen.has(response.cursor))throw new Error('r2_cursor_invalid');
   seen.add(response.cursor);cursor=response.cursor;
 }
 throw new Error('r2_listing_incomplete');
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
 async scheduled(event,env,ctx){if(env.ENABLE_WORKING_EDITOR==='enabled')ctx.waitUntil(collectResearch(env).catch(()=>console.warn('Research collection unavailable')))},
 async fetch(request,env,ctx){
   const url=new URL(request.url),path=url.pathname;
   const audioUpload=/^\/api\/v1\/admin\/audio\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i.exec(path);
   if(audioUpload){
     if(!await isAdministrator(env,ctx)||env.ENABLE_WORKING_EDITOR!=='enabled'||env.ENABLE_MANAGED_R2!=='enabled')return json({error:'unauthorized'},403);
     if(request.method!=='PUT')return json({error:'method_not_allowed'},405);
     if(request.headers.get('Origin')!=='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'||(request.headers.get('Sec-Fetch-Site')&&request.headers.get('Sec-Fetch-Site')!=='same-origin'))return json({error:'csrf_rejected'},403);
     return uploadAudio(request,env,audioUpload[1],json);
   }
   // One-time exact-byte recovery for the already-published Radio episode.
   if(path==='/api/v1/admin/recover-radio-hai-muoi-nam'){
     if(!await isAdministrator(env,ctx)||env.ENABLE_WORKING_EDITOR!=='enabled'||env.ENABLE_MANAGED_R2!=='enabled')return json({error:'unauthorized'},403);
     if(request.method!=='PUT')return json({error:'method_not_allowed'},405);
     if(request.headers.get('Origin')!=='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'||(request.headers.get('Sec-Fetch-Site')&&request.headers.get('Sec-Fetch-Site')!=='same-origin'))return json({error:'csrf_rejected'},403);
     return recoverRadio(request,env,json);
   }
   // Managed R2 originals and derivatives use Access identity and no Supabase token.
   if(path.startsWith('/api/v1/admin/r2/managed/')){
     if(!await isAdministrator(env,ctx))
       return json({authenticated:false,error:'unauthorized'},403);
     if(env.ENABLE_MANAGED_R2!=='enabled')
       return json({error:'r2_managed_disabled'},403);
     if(request.method!=='GET'){
       const origin=request.headers.get('Origin');
       const site=request.headers.get('Sec-Fetch-Site');
       if(origin!=='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'
         ||(site&&site!=='same-origin'))
         return json({error:'csrf_rejected'},403);
     }
     return handleManagedR2(request,env,path);
   }
   // Working editorial API: Access + CSRF + a server-set fail-closed feature flag.
   if(path.startsWith('/api/v1/admin/work/')){
     if(!await isAdministrator(env,ctx))
       return json({authenticated:false,error:'unauthorized'},403);
     if(env.ENABLE_WORKING_EDITOR!=='enabled')
       return json({error:'editor_read_only',write_enabled:false},403);
     if(request.method!=='GET'){
       const origin=request.headers.get('Origin');
       const site=request.headers.get('Sec-Fetch-Site');
       if(origin!=='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'
         || (site&&site!=='same-origin')
         || !/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))
         return json({error:'csrf_or_content_type_rejected'},403);
     }
     if(path.endsWith('/covers'))return handleCoverSlots(request,env,path);
     if(path.endsWith('/photos'))return handleAlbumPhotos(request,env,path);
     if(path.includes('/attachments'))return handleAttachments(request,env,path);
     return handleWorkingEditor(request,env.DB,path);
   }
   // Access-only private R2 test uploads. Do not expose original bodies.
   if(path==='/api/v1/admin/r2/staging-uploads'){
     if(!await isAdministrator(env,ctx))
       return json({authenticated:false,error:'unauthorized'},403);
     if(request.method!=='GET'){
       const origin=request.headers.get('Origin');
       const site=request.headers.get('Sec-Fetch-Site');
       if(origin!=='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'
          || (site&&site!=='same-origin'))
         return json({error:'csrf_rejected'},403);
     }
     return handleR2Sandbox(request,env.GDD_BUCKET);
   }
   const review=/^\/api\/v1\/admin\/contributions\/([a-f\d-]{36})\/review$/i.exec(path);
   if(review){
     if(!await isAdministrator(env,ctx))
       return json({authenticated:false,error:'unauthorized'},403);
     if(env.ENABLE_WORKING_EDITOR!=='enabled')
       return json({error:'review_disabled'},403);
     if(request.headers.get('Origin')!=='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'
       ||(request.headers.get('Sec-Fetch-Site')&&request.headers.get('Sec-Fetch-Site')!=='same-origin')
       ||!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))
       return json({error:'csrf_rejected'},403);
     return reviewContribution(request,env.DB,review[1]);
   }
   // Dedicated synthetic editor: validated Cloudflare Access plus same-origin CSRF.
   // The canonical restored D1 binding env.DB is NEVER sent into this handler.
   if(path==='/api/v1/admin/sandbox'||path.startsWith('/api/v1/admin/sandbox/')){
     if(!await isAdministrator(env,ctx))
       return json({authenticated:false,error:'unauthorized'},403);
     if(request.method!=='GET'){
       const origin=request.headers.get('Origin');
       const site=request.headers.get('Sec-Fetch-Site');
       if(origin!=='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'
           || (site&&site!=='same-origin')
           || !/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))
         return json({error:'csrf_or_content_type_rejected'},403);
     }
     return handleEditorSandbox(request,env.EDIT_DB,path);
   }
   if(path.startsWith('/api/v1/admin/research/')){
     if(!await isAdministrator(env,ctx))return json({authenticated:false,error:'unauthorized'},403);
     if(env.ENABLE_WORKING_EDITOR!=='enabled')return json({error:'editor_read_only'},403);
     if(request.method!=='GET'&&(request.headers.get('Origin')!=='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'||(request.headers.get('Sec-Fetch-Site')&&request.headers.get('Sec-Fetch-Site')!=='same-origin')||!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||'')))return json({error:'csrf_rejected'},403);
     return handleResearch(request,env,path,json);
   }
   if(request.method!=='GET')
     return json({error:'read_only',write_enabled:false},405);
   // Health shows no data and no identity. External Access guards the hostname.
   if(path==='/health')
     return json({status:'ok',mode:'admin-staging-read-only',
       access_configured:Boolean(env.ACCESS_AUD&&env.ADMIN_EMAIL_SHA256),
       db_configured:Boolean(env.DB)});
   // Validate runtime identity on EVERY admin page and data endpoint.
   if(!await isAdministrator(env,ctx))
     return json({authenticated:false,error:'unauthorized'},403);
   if(path==='/admin/research')return reply(RESEARCH_HTML,200,'text/html; charset=utf-8',{'Content-Security-Policy':"default-src 'none'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",'X-Frame-Options':'DENY'});
   if(path==='/admin/research.css')return reply(RESEARCH_CSS,200,'text/css; charset=utf-8');
   if(path==='/admin/research.js')return reply(RESEARCH_JS,200,'application/javascript; charset=utf-8');
   if(path==='/api/v1/admin/r2/inventory'){
     if(!env.GDD_BUCKET)return json({error:'r2_binding_unconfigured'},503);
     try {
       const result=await r2Inventory(env);
       return result?json(result):json({error:'r2_binding_unconfigured'},503);
     }catch(e){
       console.error('R2 inventory unavailable',String(e?.name||'unknown'));
       return json({error:'r2_inventory_unavailable'},503);
     }
   }
   // Private visitor contributions: only Access-authorized staff may inspect PII.
   // Never expose inbox metadata or original attachments through public D1 API.
   if(path==='/api/v1/admin/contributions'){
     if(!env.DB)return json({error:'db_unconfigured'},503);
     try{
       const {results}=await env.DB.prepare(
         'SELECT id,sender_name,sender_email,category,title,description,source,source_url,file_path,status,created_at FROM submissions ORDER BY created_at DESC LIMIT 50'
       ).all();
       return json({data:results||[],private:true});
     }catch(e){console.error('Contribution inbox unavailable',String(e?.name||'unknown'));
       return json({error:'inbox_unavailable'},503)}
   }
   const attachment=/^\/api\/v1\/admin\/contributions\/([a-f\d-]{36})\/attachment$/i.exec(path);
   if(attachment){
     if(!env.DB||!env.GDD_BUCKET)return json({error:'inbox_unavailable'},503);
     try{
       const id=attachment[1];
       const row=await env.DB.prepare('SELECT file_path FROM submissions WHERE id=? LIMIT 1')
         .bind(id).first();
       const prefix='contributions/pending/'+id+'/';
       if(!row?.file_path||!String(row.file_path).startsWith(prefix)||
           !/^contributions\/pending\/[a-f\d-]{36}\/attachment\.(?:jpg|png|webp|pdf)$/.test(row.file_path))
         return json({error:'attachment_not_found'},404);
       const object=await env.GDD_BUCKET.get(row.file_path);
       if(!object)return json({error:'attachment_not_found'},404);
       const extension=row.file_path.split('.').pop();
       const mime={jpg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf'}[extension];
       return new Response(object.body,{status:200,headers:{
         'Content-Type':mime,'Content-Disposition':'attachment; filename="tu-lieu-tiep-nhan.'+extension+'"',
         'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff',
         'X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer'
       }});
     }catch(e){console.error('Attachment inbox unavailable',String(e?.name||'unknown'));
       return json({error:'attachment_unavailable'},503)}
   }
   if(path==='/api/v1/admin/session')
     return json({authenticated:true,role:'administrator',write_enabled:false,mode:'staging',
       working_editor_enabled:env.ENABLE_WORKING_EDITOR==='enabled',
       managed_r2_enabled:env.ENABLE_MANAGED_R2==='enabled',
       working_editor_is_separate_database:true});
   if(path==='/'||path==='/admin')
     return reply(ADMIN_HTML,200,'text/html; charset=utf-8',{
       'Content-Security-Policy':"default-src 'none'; manifest-src 'self'; style-src 'self'; script-src 'self' https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/ https://cdn.jsdelivr.net/npm/mammoth@1.13.0/; connect-src 'self' https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/; worker-src 'self' blob:; media-src 'self' blob:; img-src 'self' blob: data: https://gdd-r2-gateway.realmetayninh7649.workers.dev; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
       'X-Frame-Options':'DENY'
     });
   if(path==='/admin/manifest.webmanifest')return reply(JSON.stringify(MANIFEST),200,'application/manifest+json; charset=utf-8');
   if(path==='/admin/icon.svg')return reply(ICON_SVG,200,'image/svg+xml');
   if(['/admin/icon.png','/admin/icon-192.png','/admin/icon-512.png'].includes(path)){
     const size=path.includes('512')?512:path.includes('192')?192:180;
     return reply(iconPng(size),200,'image/png');
   }
   if(path==='/admin/style.css')return reply(ADMIN_CSS,200,'text/css; charset=utf-8');
   if(path==='/admin/app.js')return reply(ADMIN_JS,200,'application/javascript; charset=utf-8');
   if(path==='/admin/photo-album.js')return reply(PHOTO_JS,200,'application/javascript; charset=utf-8');
   if(path==='/admin/audio-optimizer.js')return reply(AUDIO_OPTIMIZER_JS,200,'application/javascript; charset=utf-8');
   if(path==='/admin/audio-encoder-worker.js')return reply(AUDIO_ENCODER_WORKER,200,'application/javascript; charset=utf-8');
   if(path==='/admin/mp3-encoder.js')return reply(LAME_JS||'throw Error("MP3 encoder unavailable")',LAME_JS?200:503,'application/javascript; charset=utf-8');
   if(path==='/admin/mp3-encoder-license')return reply(LAME_LICENSE+'\nSource: https://github.com/zhuker/lamejs\nVersion: 1.2.1 — https://registry.npmjs.org/lamejs/-/lamejs-1.2.1.tgz',200,'text/plain; charset=utf-8');
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
       const view=url.searchParams.get('view')||'published';
       if(view!=='published'&&view!=='draft')
         return json({error:'invalid_view'},400);
       const sql=view==='draft'?DRAFT_SQL_LISTS[kind]:SQL_LISTS[kind];
       const {results}=await env.DB.prepare(sql)
         .bind(paging.limit,paging.offset).all();
       return json({kind,view,data:results||[],limit:paging.limit,offset:paging.offset,
         write_enabled:false});
     }catch(e){
       console.error('Admin preview query error',String(e?.name||'unknown'));
       return json({error:'service_unavailable'},503);
     }
   }
   return json({error:'not_found'},404);
 }
};
