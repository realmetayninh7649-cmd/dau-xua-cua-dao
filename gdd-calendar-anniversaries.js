(function CalendarMemorials(){
 'use strict';
 if(window.__GDDQuiViCalendar2026)return;
 window.__GDDQuiViCalendar2026=true;
 const cfg=window.SITE_CONFIG||{};
 const $=(s,root=document)=>root.querySelector(s);
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pad=x=>String(x).padStart(2,'0');
 const style=document.createElement('style');
 style.id='gdd-cal-qui-vi-css';
 style.textContent=`
 .gdd-calendar .gdd-cal-day{position:relative}
 .gdd-calendar .gdd-cal-day.gdd-cal-has-qui-vi{border-color:#d3b888}
 .gdd-calendar .gdd-cal-day .gdd-cal-qui-vi-mark{position:absolute;right:2px;top:1px;min-width:10px;height:10px;line-height:10px;text-align:center;border-radius:50%;font:700 10px/1 'Noto Serif',Georgia,serif;color:#ab8147}
 .gdd-calendar .gdd-cal-day.selected .gdd-cal-qui-vi-mark{color:#ffdea1}
 .gdd-cal-qui-vi-list{margin-top:10px;border-top:1px solid #e2dccf;padding-top:10px;display:grid;gap:7px}
 .gdd-cal-qui-vi-list>strong{font:700 12px/1.5 'Noto Serif',Georgia,serif;color:#235344}
 .gdd-cal-qui-vi-list .gdd-cal-qui-vi-sub{font:400 10px/1.5 'Be Vietnam Pro',Arial,sans-serif;color:#788074}
 .gdd-cal-qui-vi-entry{display:flex;align-items:center;gap:9px;width:100%;text-align:left;padding:8px;border:1px solid #e3ddcd;border-radius:6px;background:#fffdf9;cursor:pointer;color:#255446}
 .gdd-cal-qui-vi-entry img,.gdd-cal-qui-vi-photo{flex:0 0 40px;width:40px;height:46px;object-fit:contain;border-radius:4px;background:#e9e8de;display:grid;place-items:center;color:#ae9463}
 .gdd-cal-qui-vi-entry .gdd-cal-qui-vi-copy{flex:1;min-width:0;display:block}
 .gdd-cal-qui-vi-entry .gdd-cal-qui-vi-copy b{display:block;font:700 11px/1.5 'Noto Serif',Georgia,serif;overflow-wrap:anywhere}
 .gdd-cal-qui-vi-entry .gdd-cal-qui-vi-copy small{display:block;margin-top:2px;color:#867956;font:400 10px/1.5 'Be Vietnam Pro',Arial,sans-serif}
 .gdd-cal-qui-vi-entry:hover,.gdd-cal-qui-vi-entry:focus-visible{border-color:#b99664;background:#f7f3e9}
 .gdd-cal-qui-vi-empty{margin:0;color:#7b8075;font:400 10px/1.6 'Be Vietnam Pro',Arial,sans-serif}
 .gdd-cal-qui-vi-month{margin:9px 0 0;font:600 10px/1.65 'Be Vietnam Pro',Arial,sans-serif;color:#9b835b}
 @media(max-width:420px){.gdd-calendar .gdd-cal-day .gdd-cal-qui-vi-mark{font-size:9px;top:0;right:1px}.gdd-cal-qui-vi-list{margin-top:8px;padding-top:8px}.gdd-cal-qui-vi-entry{padding:7px}.gdd-cal-qui-vi-entry img,.gdd-cal-qui-vi-photo{flex-basis:36px;width:36px;height:42px}}
 `;
 document.head.append(style);
 function init(){
  const grid=$('#gdd-cal-days'),calendar=$('.gdd-calendar'),selected=$('#gdd-cal-selected');
  if(!grid||!calendar||!selected)return;
  const list=document.createElement('section');list.id='gdd-cal-qui-vi-list';
  list.className='gdd-cal-qui-vi-list';list.setAttribute('aria-label','Kỷ niệm ngày qui vị Chức Sắc');list.setAttribute('aria-live','polite');
  selected.insertAdjacentElement('afterend',list);
  const monthNote=document.createElement('p');monthNote.className='gdd-cal-qui-vi-month';list.insertAdjacentElement('afterend',monthNote);
  let records=[],loaded=false,selection=null,run=0;
  let requesting=false;
  const validDate=row=>Number.isInteger(Number(row.death_lunar_day)) && Number(row.death_lunar_day)>0&&Number(row.death_lunar_day)<=30&&
    Number.isInteger(Number(row.death_lunar_month))&&Number(row.death_lunar_month)>=1&&Number(row.death_lunar_month)<=12;
  function matches(row,date){
   if(validDate(row)){
     return Number(row.death_lunar_day)===date.lunar.day &&
       Number(row.death_lunar_month)===date.lunar.month &&
       Boolean(row.death_lunar_leap)===Boolean(date.lunar.leap);
   }
   if(typeof row.death_solar_date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(row.death_solar_date)){
     return row.death_solar_date.slice(5)===date.solarDate.slice(5);
   }
   return false;
  }
  const safeImg=v=>{try{const u=new URL(String(v||''),location.href);return /^https?:$/.test(u.protocol)?u.href:''}catch{return ''}};
  function recordHTML(row){
   const image=safeImg(row.image_url);
   const when=validDate(row)?
     'Âm lịch '+pad(row.death_lunar_day)+'/'+pad(row.death_lunar_month)+(row.death_lunar_leap?' (nhuận)':''):
     'Dương lịch '+String(row.death_solar_date||'').slice(8,10)+'/'+String(row.death_solar_date||'').slice(5,7);
   return '<button type="button" class="gdd-cal-qui-vi-entry" data-open-kind="people" data-id="'+esc(row.id)+'" aria-label="Mở tiểu sử '+esc(row.full_name)+'">'+
      (image?'<img loading="lazy" decoding="async" src="'+esc(image)+'" alt="Chơn dung '+esc(row.full_name)+'">':
        '<span class="gdd-cal-qui-vi-photo" aria-hidden="true">✦</span>')+
      '<span class="gdd-cal-qui-vi-copy"><b>'+esc(row.full_name)+'</b><small>'+esc((row.rank||'Chức Sắc')+' · '+when)+' · Xem tiểu sử ↗</small></span></button>';
  }
  function dateFromButton(button){
    return {solarDate:button.dataset.solarDate,
      lunar:{day:Number(button.dataset.lunarDay),month:Number(button.dataset.lunarMonth),leap:button.dataset.lunarLeap==='1'}};
  }
  function decorate(){
   const buttons=[...grid.querySelectorAll('.gdd-cal-day')];
   if(!buttons.length)return;
   let monthDays=0,occurrences=0;
   for(const button of buttons){
     const old=button.querySelector('.gdd-cal-qui-vi-mark');
     old?.remove();button.classList.remove('gdd-cal-has-qui-vi');
     // Re-render the accessible label without accumulating old anniversary suffixes.
     const base=button.dataset.baseAria||button.getAttribute('aria-label')||button.title;
     button.dataset.baseAria=base;
     button.setAttribute('aria-label',base);
     const events=records.filter(row=>matches(row,dateFromButton(button)));
     if(!events.length)continue;
     const marker=document.createElement('span');marker.className='gdd-cal-qui-vi-mark';
     marker.textContent=events.length>1?String(events.length):'✦';marker.setAttribute('aria-hidden','true');
     button.append(marker);button.classList.add('gdd-cal-has-qui-vi');
     button.setAttribute('aria-label',base+' · '+events.length+' kỷ niệm qui vị');
     if(!button.classList.contains('other')){monthDays++;occurrences+=events.length}
   }
   monthNote.textContent=loaded?
     (occurrences?`Trong tháng có ${occurrences} kỷ niệm qui vị trên ${monthDays} ngày. Chạm ngày có dấu ✦ để xem.`:
       'Tháng này chưa ghi nhận ngày kỷ niệm qui vị đã xác định.'):
       'Đang đối chiếu các hồ sơ Chức Sắc đã công bố…';
   const chosen=grid.querySelector('.gdd-cal-day.selected');
   if(chosen)renderSelected(dateFromButton(chosen));
  }
  function renderSelected(date){
   selection=date;
   if(!loaded){
     list.innerHTML='<strong>Kỷ niệm ngày qui vị</strong><p class="gdd-cal-qui-vi-empty">Đang tải các ngày kỷ niệm từ Hồ sơ Chức Sắc…</p>';
     return;
   }
   const events=records.filter(row=>matches(row,date));
   const heading='<strong>Kỷ niệm ngày qui vị'+(events.length?' · '+events.length+' Chức Sắc':'')+'</strong>';
   if(events.length)list.innerHTML=heading+
     '<span class="gdd-cal-qui-vi-sub">Chọn một hồ sơ để xem tiểu sử và nguồn ngày tháng.</span>'+
     events.map(recordHTML).join('');
   else list.innerHTML=heading+'<p class="gdd-cal-qui-vi-empty">Chưa có kỷ niệm qui vị được ghi nhận cho ngày này.</p>';
  }
  async function reload(){
   if(requesting)return;
   requesting=true;
   const task=++run;
   try{
     if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)throw Error('Thiếu cấu hình dữ liệu.');
     const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
     const supa=createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
     const gathered=[];
     for(let offset=0;offset<10000;offset+=500){
       const {data,error}=await supa.from('people')
         .select('id,slug,full_name,rank,branch,image_url,published,verified,death_lunar_day,death_lunar_month,death_lunar_leap,death_solar_date')
         .eq('published',true).eq('verified',true)
         .range(offset,offset+499);
       if(error)throw error;
       gathered.push(...data||[]);
       if(!data||data.length<500)break;
     }
     if(task===run){records=gathered.filter(x=>validDate(x)||/^\d{4}-\d{2}-\d{2}$/.test(x.death_solar_date||''));loaded=true;decorate()}
   }catch(err){
     console.warn('[GDD Qui Vi]',err?.message||err);
     if(!loaded){loaded=true;records=[];decorate();monthNote.textContent='Chưa tải được các ngày kỷ niệm. Xin kiểm tra lại kết nối.'}
   }finally{requesting=false}
  }
  window.addEventListener('gdd:calendar-updated',event=>{
   selection=event.detail?{solarDate:event.detail.solarDate,lunar:event.detail.lunar}:null;
   // The calendar creates a fresh grid on each render. Do not mutate its day numbers.
   decorate();
  });
  window.addEventListener('gdd:people-anniversary-refresh',reload);
  reload();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();