// Use the existing D1 publication routine against the approved working database.
import {publishDailyMemorials} from '../workers/gdd-d1-admin/src/daily-memorial.mjs';
const account=process.env.CLOUDFLARE_ACCOUNT_ID,token=process.env.CLOUDFLARE_API_TOKEN;
const id='56bf9fcc-3f9a-43e5-82f7-8c521f5b370a';
if(!account||!token)throw Error('Missing D1 credentials');
const endpoint='https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(account)+'/d1/database/'+id+'/query';
async function query(sql,params=[]){
 if(!/^(SELECT |INSERT OR IGNORE INTO gdd_memorials |UPDATE gdd_memorials SET portrait_url=\?,updated_at=\?,gdd_version=gdd_version\+1 WHERE slug=\? AND published=1 AND )/.test(sql))throw Error('Unexpected SQL');
 const res=await fetch(endpoint,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({sql,params}),signal:AbortSignal.timeout(30000)});
 const packet=await res.json();
 if(!res.ok||!packet.success||!packet.result?.[0]?.success)throw Error('D1 query failed: '+(packet.errors||[]).map(x=>x.message).join('; '));
 return packet.result[0];
}
const db={prepare(sql){let params=[];return {bind(...values){params=values;return this},all(){return query(sql,params)},run(){return query(sql,params)}}}};
const now=new Date();
const result=await publishDailyMemorials({DB:db},now);
console.log('DAILY_MEMORIAL_CATCHUP',JSON.stringify(result));
const rows=(await query("SELECT person_name,title,slug,anniversary_date,published_at,portrait_url FROM gdd_memorials WHERE published=1 ORDER BY published_at DESC LIMIT 20")).results;
console.log('LATEST_MEMORIALS',JSON.stringify(rows.map(r=>({name:r.person_name,slug:r.slug,anniversary:r.anniversary_date,published_at:r.published_at,has_portrait:!!r.portrait_url}))));
