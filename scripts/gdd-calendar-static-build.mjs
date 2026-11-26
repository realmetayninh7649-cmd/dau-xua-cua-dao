import {mkdir,writeFile} from 'node:fs/promises';
import {calculate,buildICS,selectCalendarSources} from '../workers/gdd-calendar-static/calendar-core.mjs';
const API='https://gdd-d1-api-staging.realmetayninh7649.workers.dev';
const ROOT=new URL('../',import.meta.url);
async function pages(kind){
 if(!['people','gdd_calendar_memorials'].includes(kind))throw Error('Invalid public kind');
 let records=[];
 for(let offset=0;offset<=1000;offset+=100){
  const url=API+'/api/v1/public/'+kind+'?limit=100&offset='+offset;
  const response=await fetch(url,{headers:{Accept:'application/json'}});
  if(!response.ok)throw Error('Public D1 '+kind+' returned '+response.status);
  const packet=await response.json();
  if(!Array.isArray(packet.data)||packet.data.length>100||
   packet.data.some(row=>row.published!==true))throw Error('Unexpected unpublished D1 row');
  records.push(...packet.data);
  if(packet.data.length<100)return records;
 }
 throw Error('Calendar D1 pagination incomplete');
}
const [allPeople,manual]=await Promise.all([pages('people'),pages('gdd_calendar_memorials')]);
const selected=selectCalendarSources(allPeople,manual);
const caMinhChuong=allPeople.find(x=>x.slug==='bao-dao-ca-minh-chuong-67sgj4');
if(caMinhChuong)console.log('CA_MINH_CHUONG_PUBLIC_DATE',JSON.stringify({day:caMinhChuong.death_lunar_day??null,month:caMinhChuong.death_lunar_month??null,leap:caMinhChuong.death_lunar_leap??null,solar:caMinhChuong.death_solar_date??null,calendar:!!selected.people.find(x=>x.id===caMinhChuong.id)}));
if(allPeople.length<40||selected.people.length<1)throw Error('No published dated source');
const now=new Date();
const dateParts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{
 timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'
}).formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
const currentYear=Number(dateParts.year),today=dateParts.year+'-'+dateParts.month+'-'+dateParts.day;
if(!Number.isInteger(currentYear)||currentYear<2026)throw Error('Invalid publication year');
const events=calculate(allPeople,manual,currentYear,11);
if(events.length<250)throw Error('Unexpectedly few calendar events');
if(events.some(x=>!/^\d{4}-\d{2}-\d{2}$/.test(x.solar)))throw Error('Malformed dates');
const ics=buildICS(events);
if(!ics.startsWith('BEGIN:VCALENDAR')||!ics.endsWith('END:VCALENDAR\r\n')||ics.includes('undefined'))throw Error('Invalid ICS');
const upcoming=events.filter(x=>x.solar>=today).slice(0,10)
 .map(x=>({name:x.name,rank:x.rank,solar:x.solar,lunar:x.lunar,
   lunarYear:x.lunarYear,lunarCanChi:x.lunarCanChi,type:x.type,verified:x.verified}));
const json={ok:true,source:'public-published-dated-D1-only',
 generated_at:now.toISOString(),years:[currentYear,currentYear+10],
 people_records:selected.people.length,manual_records:selected.manual.length,
 count:events.length,upcoming};
await writeFile(new URL('../lich-ky-niem-qui-vi.ics',import.meta.url),ics);
await writeFile(new URL('../lich-ky-niem-qui-vi.json',import.meta.url),JSON.stringify(json,null,2)+'\n');
console.log('GDD_CALENDAR_D1_BUILD_PASS',JSON.stringify({people:selected.people.length,manual:selected.manual.length,
 year:currentYear,events:events.length,upcoming:upcoming.length,ics_bytes:Buffer.byteLength(ics)}));
