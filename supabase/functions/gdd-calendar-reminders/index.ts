/* Giữ Đạo Giữa Đời – ICS tự đồng bộ 11 năm, nhắc 09:00 trước ngày qui vị 1 hôm.
 * Dữ liệu chỉ từ các Chức Sắc đã công bố và ngày kỷ niệm được công bố. */
  const INT = Math.floor, PI=Math.PI, DR=PI/180;
  function jdFromDate(d,m,y) {
    const a=INT((14-m)/12),yy=y+4800-a,mm=m+12*a-3;
    let jd=d+INT((153*mm+2)/5)+365*yy+INT(yy/4)-INT(yy/100)+INT(yy/400)-32045;
    if(jd<2299161) jd=d+INT((153*mm+2)/5)+365*yy+INT(yy/4)-32083;
    return jd;
  }
  function newMoon(k) {
    const T=k/1236.85,T2=T*T,T3=T2*T;
    const Jd1=2415020.75933+29.53058868*k+0.0001178*T2-0.000000155*T3;
    const Jd2=0.00033*Math.sin((166.56+132.87*T-0.009173*T2)*DR);
    const M=359.2242+29.10535608*k-0.0000333*T2-0.00000347*T3;
    const Mp=306.0253+385.81691806*k+0.0107306*T2+0.00001236*T3;
    const F=21.2964+390.67050646*k-0.0016528*T2-0.00000239*T3;
    const C1=(0.1734-0.000393*T)*Math.sin(M*DR)+0.0021*Math.sin(2*M*DR)-0.4068*Math.sin(Mp*DR)
      +0.0161*Math.sin(2*Mp*DR)-0.0004*Math.sin(3*Mp*DR)+0.0104*Math.sin(2*F*DR)
      -0.0051*Math.sin((M+Mp)*DR)-0.0074*Math.sin((M-Mp)*DR)+0.0004*Math.sin((2*F+M)*DR)
      -0.0004*Math.sin((2*F-M)*DR)-0.0006*Math.sin((2*F+Mp)*DR)+0.0010*Math.sin((2*F-Mp)*DR)
      +0.0005*Math.sin((2*Mp+M)*DR);
    const dt=T < -11 ? 0.001+0.000839*T+0.0002261*T2-0.00000845*T3-0.000000081*T*T3
      : -0.000278+0.000265*T+0.000262*T2;
    return Jd1+Jd2+C1-dt;
  }
  const newMoonDay=(k)=>INT(newMoon(k)+0.5+7/24);
  function sunLongitude(jdn) {
    const T=(jdn-2451545.0)/36525,T2=T*T;
    const M=(357.52910+35999.05030*T-0.0001559*T2-0.00000048*T*T2)*DR;
    const L0=280.46645+36000.76983*T+0.0003032*T2;
    const DL=(1.914600-0.004817*T-0.000014*T2)*Math.sin(M)
      +(0.019993-0.000101*T)*Math.sin(2*M)+0.000290*Math.sin(3*M);
    let L=(L0+DL)*DR;
    L-=PI*2*INT(L/(PI*2));
    return L;
  }
  const sunSection=day=>INT(sunLongitude(day-0.5-7/24)/PI*6);
  function lunarMonth11(y) {
    const off=jdFromDate(31,12,y)-2415021.076998695;
    const k=INT(off/29.530588853);
    let nm=newMoonDay(k);
    if(sunSection(nm)>=9)nm=newMoonDay(k-1);
    return nm;
  }
  function leapOffset(a11) {
    const k=INT(0.5+(a11-2415021.076998695)/29.530588853);
    let i=1,arc=sunSection(newMoonDay(k+i)),last;
    do{last=arc;i++;arc=sunSection(newMoonDay(k+i))}while(arc!==last&&i<14);
    return i-1;
  }
  function solarToLunar(d,m,y) {
    const jd=jdFromDate(d,m,y),k=INT((jd-2415021.076998695)/29.530588853);
    let start=newMoonDay(k+1);if(start>jd)start=newMoonDay(k);
    let a11=lunarMonth11(y),b11=a11,lYear;
    if(a11>=start){lYear=y;a11=lunarMonth11(y-1)}
    else{lYear=y+1;b11=lunarMonth11(y+1)}
    const lDay=jd-start+1,diff=INT((start-a11)/29);
    let leap=0,lMonth=diff+11;
    if(b11-a11>365){const off=leapOffset(a11);if(diff>=off){lMonth=diff+10;if(diff===off)leap=1}}
    if(lMonth>12)lMonth-=12;
    if(lMonth>=11&&diff<4)lYear--;
    return {day:lDay,month:lMonth,year:lYear,leap:!!leap};
  }

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type"};
const base="https://realmetayninh7649-cmd.github.io/dau-xua-cua-dao/";
const pad=n=>String(n).padStart(2,"0");
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toLowerCase().replace(/\s+/g," ").trim();
const esc=s=>String(s??"").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
const folded=line=>{let out="",part="",n=0;for(const c of line){const p=c.codePointAt(0),k=p<128?1:p<2048?2:p<65536?3:4;if(n+k>73){out+=part+"\r\n ";part="";n=1}part+=c;n+=k}return out+part};
const recPerson=p=>{
 const row={type:"person",id:p.id,name:p.full_name,rank:p.rank||"",source:"Hồ sơ Chức Sắc đã xác minh",slug:p.slug};
 if(p.death_lunar_day&&p.death_lunar_month)return {...row,ld:+p.death_lunar_day,lm:+p.death_lunar_month,leap:!!p.death_lunar_leap};
 if(/^\d{4}-\d{2}-\d{2}$/.test(p.death_solar_date||"")){const [y,m,d]=p.death_solar_date.split("-").map(Number);return {...row,sd:d,sm:m}}
 return null;
};
const recManual=p=>{
 const row={type:"manual",id:p.id,name:p.full_name,rank:p.rank||"",source:p.source_note||"Lịch tưởng niệm Web Đạo",linked:p.linked_person_id||null};
 if(p.calendar_system==="lunar"&&p.lunar_day&&p.lunar_month)return {...row,ld:+p.lunar_day,lm:+p.lunar_month,leap:!!p.lunar_leap};
 if(p.calendar_system==="solar"&&p.solar_day&&p.solar_month)return {...row,sd:+p.solar_day,sm:+p.solar_month};
 return null;
};
function calculate(people,manual,startYear,years){
 const lunarMap=new Map(),solarMap=new Map();
 for(const r of [...people.map(recPerson),...manual.map(recManual)].filter(Boolean)){
   const l=r.ld!=null,map=l?lunarMap:solarMap,key=l?r.ld+"/"+r.lm+"/"+(r.leap?1:0):r.sd+"/"+r.sm;
   if(!map.has(key))map.set(key,[]);map.get(key).push(r);
 }
 const out=[];
 for(let y=startYear;y<startYear+years;y++){
   for(let t=Date.UTC(y,0,1);t<Date.UTC(y+1,0,1);t+=86400000){
     const dt=new Date(t),d=dt.getUTCDate(),m=dt.getUTCMonth()+1,l=solarToLunar(d,m,y);
     const candidates=[...(lunarMap.get(l.day+"/"+l.month+"/"+(l.leap?1:0))||[]),...(solarMap.get(d+"/"+m)||[])];
     const unique=[];
     for(const x of candidates){
       const same=r=>x.type!==r.type&&((x.linked&&x.linked===r.id)||(r.linked&&r.linked===x.id)||norm(r.name)===norm(x.name));
       if(x.type==="manual"&&unique.some(same))continue;
       if(x.type==="person")for(let i=unique.length-1;i>=0;i--)if(same(unique[i]))unique.splice(i,1);
       unique.push(x);
     }
     for(const x of unique)out.push({...x,solar:y+"-"+pad(m)+"-"+pad(d),lunar:pad(l.day)+"/"+pad(l.month)+(l.leap?" nhuận":"")+"/"+l.year,order:t});
   }
 }
 return out.sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name,"vi"));
}
function buildICS(events){
 const created=new Date().toISOString().slice(0,19).replace(/[-:]/g,"")+"Z";
 const lines=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GIU DAO GIUA DOI//LICH KY NIEM QUI VI//VI","CALSCALE:GREGORIAN","METHOD:PUBLISH",
 "X-WR-CALNAME:"+esc("Giữ Đạo Giữa Đời – Lịch kỷ niệm qui vị"),
 "X-WR-TIMEZONE:Asia/Ho_Chi_Minh","REFRESH-INTERVAL;VALUE=DURATION:PT12H","X-PUBLISHED-TTL:PT12H"];
 for(const e of events){
   const dt=e.solar.replace(/-/g,"");
   lines.push("BEGIN:VEVENT","UID:gdd-"+e.type+"-"+e.id+"-"+dt+"@dauxuacuadao.vn","DTSTAMP:"+created,
   "DTSTART:"+dt+"T020000Z","DTEND:"+dt+"T021500Z",
   "SUMMARY:"+esc("Kỷ niệm qui vị – "+e.name),
   "DESCRIPTION:"+esc([e.rank,"Ngày âm: "+e.lunar,"Ngày dương: "+e.solar,"Nguồn: "+e.source].filter(Boolean).join("\n")),
   "URL:"+esc(e.type==="person"&&e.slug?base+"#nhan-vat/"+encodeURIComponent(e.slug):base+"#gdd-archive-dashboard"),
   "STATUS:CONFIRMED","TRANSP:TRANSPARENT",
   "BEGIN:VALARM","ACTION:DISPLAY","TRIGGER:-P1D",
   "DESCRIPTION:"+esc("Ngày mai kỷ niệm qui vị "+e.name),
   "END:VALARM","END:VEVENT");
 }
 lines.push("END:VCALENDAR");
 return lines.map(folded).join("\r\n")+"\r\n";
}
async function readRows(table,columns,conditions){
 const host=Deno.env.get("SUPABASE_URL")||"https://gwpdgubxoquhrfbolftq.supabase.co";
 const key=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!key)throw Error("Missing API key");
 const out=[];
 for(let offset=0;offset<10000;offset+=1000){
   const q=new URLSearchParams({select:columns,...conditions,limit:"1000",offset:String(offset)});
   const resp=await fetch(host+"/rest/v1/"+table+"?"+q,{headers:{"apikey":key,"Authorization":"Bearer "+key}});
   if(!resp.ok)throw Error(table+" returned "+resp.status);
   const rows=await resp.json();if(!Array.isArray(rows))throw Error("Invalid data");
   out.push(...rows);if(rows.length<1000)break;
 }
 return out;
}
Deno.serve(async req=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
 if(req.method!=="GET")return new Response("Method not allowed",{status:405,headers:cors});
 try{
   const url=new URL(req.url);
   const [p,m]=await Promise.all([
     readRows("people","id,slug,full_name,rank,death_lunar_day,death_lunar_month,death_lunar_leap,death_solar_date",
       {"published":"eq.true","verified":"eq.true"}),
     readRows("gdd_calendar_memorials","id,full_name,rank,calendar_system,lunar_day,lunar_month,lunar_leap,solar_day,solar_month,source_note,linked_person_id",
       {"published":"eq.true"})]);
   const year=Number(new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Ho_Chi_Minh",year:"numeric"}).format(new Date()));
   const all=calculate(p,m,year,11);
   const common={...cors,"Cache-Control":"public,max-age=600,stale-while-revalidate=3600","X-Calendar-Events":String(all.length)};
   if(url.searchParams.get("format")==="json"){
     const pts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
     const ymd=Object.fromEntries(pts.filter(p=>p.type!=="literal").map(p=>[p.type,p.value]));
     const today=ymd.year+"-"+ymd.month+"-"+ymd.day;
     const items=all.filter(x=>x.solar>=today).slice(0,8).map(x=>({name:x.name,rank:x.rank,solar:x.solar,lunar:x.lunar}));
     return new Response(JSON.stringify({ok:true,years:[year,year+10],count:all.length,upcoming:items}),{headers:{...common,"Content-Type":"application/json;charset=utf-8"}});
   }
   return new Response(buildICS(all),{headers:{...common,"Content-Type":"text/calendar;charset=utf-8",
     "Content-Disposition":url.searchParams.has("download")?'attachment;filename="lich-ky-niem-qui-vi.ics"':'inline;filename="lich-ky-niem-qui-vi.ics"'}});
 }catch(err){
   console.error("Calendar feed error",String(err));
   return new Response(JSON.stringify({ok:false,error:"Chưa tạo được lịch"}),{status:503,headers:{...cors,"Content-Type":"application/json","Cache-Control":"no-store"}});
 }
});
