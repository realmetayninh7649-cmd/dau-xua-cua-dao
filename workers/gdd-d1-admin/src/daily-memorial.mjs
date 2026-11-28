/* Publish only date-matched public calendar notices. Never alter existing articles or source records. */
import {calculate} from '../../gdd-calendar-static/calendar-core.mjs';
import {mediaRef} from './record-access.mjs';
export const MEMORIAL_CRONS=Object.freeze(['5 17 * * *','5 0 * * *','35 1-16,18-23 * * *']); // midnight, morning and hourly recovery
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/\s+/g,' ').trim();
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const pad=n=>String(n).padStart(2,'0');
export function vietnamDay(now){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));return parts.year+'-'+parts.month+'-'+parts.day}
function published(x){return x.published===1||x.published===true}
const GATE='https://gdd-r2-gateway.realmetayninh7649.workers.dev';
export function portraitPreview(raw){
 const ref=mediaRef(raw);
 if(!ref)return null;
 if(ref.startsWith('managed:'))return GATE+'/v1/public/'+ref.slice(8)+'/preview';
 if(ref.startsWith('legacy:'))return GATE+'/v1/legacy-preview/'+ref.slice(7).split('/').map(encodeURIComponent).join('/')+'.webp';
 return null;
}
function choosePortrait(person,row){
 // Never reuse a restricted person portrait in the independent memorial section.
 if(person&&person.record_access!=='download')return null;
 const owner=person||row;
 return portraitPreview(owner?.image_url)||portraitPreview(owner?.approved_cover_url)||null;
}
export function dailyNotices(people,manual,existing,now){
 const today=vietnamDay(now),year=Number(today.slice(0,4));
 const lookup=new Map([...manual,...people].filter(published).map(r=>[r.id,r]));
 const used=new Set(existing.filter(x=>published(x)&&x.published_at&&vietnamDay(new Date(x.published_at)).startsWith(String(year))||published(x)&&String(x.anniversary_date||'').includes(today.split('-').reverse().join('/'))).map(x=>norm(x.person_name)).filter(Boolean));
 const notices=[];
 for(const e of calculate(people,manual,year,1)){
  if(e.solar!==today||!['person','manual'].includes(e.type)||!uuid.test(e.id||'')||!String(e.name||'').trim())continue;
  const row=lookup.get(e.id);if(!row||!published(row))continue;
  const name=String(e.name).trim(),nameKey=norm(name);
  if(used.has(nameKey))continue;
  used.add(nameKey);
  const rank=String(e.rank||'').trim(),person=e.type==='person'?row:people.find(p=>published(p)&&p.id===row.linked_person_id);
  const date=today.split('-').reverse().join('/');
  const lunar=e.lunar+' ('+e.lunarCanChi+')';
  const annual=e.basis==='solar'?date+' dương lịch':lunar+' âm lịch (DL '+date+')';
  const profile=person?.slug?'https://dauxuacuadao.info.vn/#nhan-vat/'+encodeURIComponent(person.slug):'';
  // No invented dates, years, merits, or unsigned biography. Restricted portraits are not reused.
  const portrait=choosePortrait(person,row);
  notices.push({identity:(person?.id||e.id)+':'+today,slug:'tuong-niem-tu-dong-'+(person?.id||e.id)+'-'+today,
   title:'THÀNH KÍNH TƯỞNG NIỆM NGÀY QUI VỊ '+[rank,name].filter(Boolean).join(' ').toLocaleUpperCase('vi'),
   person_name:name,rank_title:rank||null,death_date:person?.death_solar_date||null,anniversary_date:annual,
   summary:'Thành kính tưởng niệm ngày qui vị của '+[rank,name].filter(Boolean).join(' ')+'.',
   body:'Hôm nay, ngày '+lunar+' âm lịch, nhằm ngày '+date+' dương lịch, thành kính tưởng niệm ngày qui vị của '+[rank,name].filter(Boolean).join(' ')+'.\n\nKính ghi nhớ công nghiệp hành Đạo của bậc tiền bối.\n\n'+(profile?'Xin xem hồ sơ Chức Sắc để đối chiếu tiểu sử và tư liệu: '+profile+'\n\n':'')+'Bài tưởng niệm tự động theo Lịch Đạo.',
   portrait_url:portrait,sources:[e.source,profile].filter(Boolean).join('\n')});
 }
 return notices;
}
async function stableId(key){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('gdd-daily-memorial:'+key))).slice(0,16);
 bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;
 const h=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
 return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
export async function publishDailyMemorials(env,now=new Date()){
 if(!env.DB)throw Error('Working database not configured');
 const db=env.DB;
 const [people,manual,existing]=await Promise.all([
  db.prepare("SELECT p.*,coalesce(a.mode,'download') AS record_access,(SELECT 'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/'||x.asset_id||'/preview' FROM gdd_r2_assets x WHERE x.record_kind='people' AND x.record_id=p.id AND x.role='cover' AND x.media_kind='image' AND x.public_view=1 AND x.preview_ready=1 ORDER BY x.view_updated_at DESC,x.created_at DESC LIMIT 1) AS approved_cover_url FROM people p LEFT JOIN gdd_record_access a ON a.kind='people' AND a.record_id=p.id WHERE p.published=1").all(),
  db.prepare("SELECT m.*,(SELECT 'https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/public/'||x.asset_id||'/preview' FROM gdd_r2_assets x WHERE x.record_kind='gdd_calendar_memorials' AND x.record_id=m.id AND x.role='cover' AND x.media_kind='image' AND x.public_view=1 AND x.preview_ready=1 ORDER BY x.view_updated_at DESC,x.created_at DESC LIMIT 1) AS approved_cover_url FROM gdd_calendar_memorials m WHERE m.published=1").all(),
  db.prepare("SELECT person_name,published,published_at,anniversary_date FROM gdd_memorials WHERE published=1").all()
 ]);
 const notices=dailyNotices(people.results||[],manual.results||[],existing.results||[],now);
 // Repair only missing portraits on today's deterministic, already published automatic notices.
 // Never overwrite an editor's chosen image, never unhide an article.
 const repairs=dailyNotices(people.results||[],manual.results||[],[],now);
 let repaired=0;
 for(const n of repairs){
  if(!n.portrait_url)continue;
  const ref=mediaRef(n.portrait_url);
  const restricted=await db.prepare("SELECT 1 AS blocked FROM gdd_access_media m JOIN gdd_record_access a ON a.kind=m.kind AND a.record_id=m.record_id WHERE m.media_ref=? AND a.mode<>'download' LIMIT 1").bind(ref).all();
  if(restricted.results?.length)continue;
  // The public gateway is authoritative; do not attach an unavailable preview.
  try{
   const response=env.RECORD_GATEWAY?await env.RECORD_GATEWAY.fetch(new Request(n.portrait_url,{method:'HEAD'})):await fetch(n.portrait_url,{method:'HEAD'});
   if(!response.ok||!String(response.headers.get('content-type')||'').startsWith('image/'))continue;
  }catch{continue}
  const result=await db.prepare("UPDATE gdd_memorials SET portrait_url=?,updated_at=?,gdd_version=gdd_version+1 WHERE slug=? AND published=1 AND (portrait_url IS NULL OR trim(portrait_url)='')").bind(n.portrait_url,now.toISOString(),n.slug).run();
  repaired+=Number(result.meta?.changes||0);
 }
 // Check each newly published portrait against the same restrictions.
 for(const n of notices){
  if(!n.portrait_url)continue;
  const ref=mediaRef(n.portrait_url);
  const restricted=await db.prepare("SELECT 1 AS blocked FROM gdd_access_media m JOIN gdd_record_access a ON a.kind=m.kind AND a.record_id=m.record_id WHERE m.media_ref=? AND a.mode<>'download' LIMIT 1").bind(ref).all();
  if(restricted.results?.length){n.portrait_url=null;continue}
  try{const response=env.RECORD_GATEWAY?await env.RECORD_GATEWAY.fetch(new Request(n.portrait_url,{method:'HEAD'})):await fetch(n.portrait_url,{method:'HEAD'});if(!response.ok||!String(response.headers.get('content-type')||'').startsWith('image/'))n.portrait_url=null;}catch{n.portrait_url=null}
 }
 let inserted=0;const stamp=now.toISOString();
 // Deterministic primary key protects against concurrent/repeated cron delivery, even for deleted drafts.
 for(const n of notices){
  const id=await stableId(n.identity);
  const result=await db.prepare("INSERT OR IGNORE INTO gdd_memorials (id,slug,title,person_name,rank_title,death_date,anniversary_date,summary,body,portrait_url,sources,published,published_at,created_at,updated_at,gdd_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?,?,1)")
   .bind(id,n.slug,n.title,n.person_name,n.rank_title,n.death_date,n.anniversary_date,n.summary,n.body,n.portrait_url,n.sources,stamp,stamp,stamp).run();
  inserted+=Number(result.meta?.changes||0);
 }
 return {day:vietnamDay(now),eligible:notices.length,inserted,repaired,portraitCandidates:repairs.map(n=>({name:n.person_name,available:Boolean(n.portrait_url)}))};
}
