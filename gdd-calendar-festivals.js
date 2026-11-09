(function DaoFestivals(){
 'use strict';
 if(window.__gddDaoFestivals2026)return;
 window.__gddDaoFestivals2026=true;
 const CEREMONIES=[
  {id:'ruoc-than-tien-phat',calendar:'lunar',day:1,month:1,title:'Lễ rước Thần, Thánh, Tiên, Phật',rite:'Tiểu Đàn'},
  {id:'dai-le-duc-chi-ton',calendar:'lunar',day:9,month:1,title:'Đại lễ Đức Chí Tôn',rite:'Đại Đàn'},
  {id:'thuong-nguon',calendar:'lunar',day:15,month:1,title:'Lễ Thượng Ngươn',rite:'Đại Đàn',note:'Tại các Thánh Thất và Điện Thờ Phật Mẫu địa phương, thời gian cúng từ mùng 1 đến hết Rằm tháng Giêng âm lịch, cùng thời điểm với Tòa Thánh.'},
  {id:'thai-thuong-lao-quan',calendar:'lunar',day:15,month:2,title:'Vía Đức Thái Thượng Lão Quân',rite:'Đại Đàn'},
  {id:'quan-am',calendar:'lunar',day:19,month:2,title:'Vía Đức Phật Quan Âm',rite:'Đại Đàn'},
  {id:'thich-ca',calendar:'lunar',day:8,month:4,title:'Vía Đức Phật Thích Ca',rite:'Đại Đàn'},
  {id:'hoi-ky-niem-hiep-thien-dai',calendar:'lunar',day:10,month:4,title:'Kỷ niệm hội ngày qui thiên của Đức Hộ Pháp, Đức Thượng Phẩm, Đức Thượng Sanh và quý Thời Quân Hiệp Thiên Đài',rite:'Tiểu Đàn',note:'Tại địa phương chỉ cúng Tiểu Đàn ở Thánh Thất.'},
  {id:'quan-thanh-de-quan',calendar:'lunar',day:24,month:6,title:'Vía Đức Quan Thánh Đế Quân',rite:'Đại Đàn'},
  {id:'trung-nguon',calendar:'lunar',day:15,month:7,title:'Lễ Trung Ngươn',rite:'Đại Đàn',note:'Tại các Thánh Thất và Điện Thờ Phật Mẫu địa phương, thời gian cúng từ mùng 1 đến hết Rằm tháng Bảy âm lịch, cùng thời điểm với Tòa Thánh.'},
  {id:'hoi-yen-dieu-tri-cung',calendar:'lunar',day:15,month:8,title:'Đại lễ Hội Yến Diêu Trì Cung',rite:'Tiểu Đàn',note:'Các Điện Thờ Phật Mẫu địa phương chỉ cúng đàn theo thông lệ; không lập nghi cúng Hội Yến Diêu Trì Cung.'},
  {id:'ly-dai-tien',calendar:'lunar',day:18,month:8,title:'Vía Đức Lý Đại Tiên kiêm Giáo Tông Đại Đạo Tam Kỳ Phổ Độ',rite:'Đại Đàn'},
  {id:'khong-thanh',calendar:'lunar',day:27,month:8,title:'Vía Đức Khổng Thánh',rite:'Đại Đàn'},
  {id:'hoi-ky-niem-cuu-trung-dai',calendar:'lunar',day:13,month:10,title:'Kỷ niệm hội ngày qui thiên của Đức Quyền Giáo Tông, quý Đầu Sư và chư Chức Sắc hàng Thánh Nam Nữ',rite:'Tiểu Đàn',note:'Tại địa phương chỉ cúng Tiểu Đàn ở Thánh Thất.'},
  {id:'ha-nguon-khai-dao',calendar:'lunar',day:15,month:10,title:'Lễ Hạ Ngươn và kỷ niệm ngày khai Đại Đạo Tam Kỳ Phổ Độ',rite:'Đại Đàn',note:'Tại các Thánh Thất và Điện Thờ Phật Mẫu địa phương, thời gian cúng từ mùng 1 đến hết Rằm tháng Mười âm lịch, cùng thời điểm với Tòa Thánh.'},
  {id:'dua-chu-than-thanh',calendar:'lunar',day:24,month:12,title:'Lễ đưa chư Thần, Thánh, Tiên, Phật triều Thiên',rite:'Tiểu Đàn'},
  {id:'jesus-christ',calendar:'solar',day:25,month:12,title:'Vía Đức Jésus Christ',rite:'Đại Đàn'}
 ];
 const pad=n=>String(n).padStart(2,'0');
 const escapeHTML=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const formatLunar=l=>pad(l.day)+'/'+pad(l.month)+(l.leap?' nhuận':'')+'/'+l.year;
 function ceremoniesOn(date){
  const {lunar,solarDate}=date;
  if(!lunar||!solarDate)return [];
  const [year,month,day]=solarDate.split('-').map(Number);
  const result=[];
  for(const event of CEREMONIES){
   if(event.calendar==='solar' ? (event.day===day&&event.month===month) :
     (!lunar.leap&&event.day===lunar.day&&event.month===lunar.month)){
    result.push({...event,anniversaryYear:year});
   }
  }
  if(lunar.day===1)result.push({id:'soc',calendar:'lunar',day:1,month:lunar.month,title:'Cúng Sóc (mùng 1 âm lịch)',rite:'Tiểu Đàn',monthly:true});
  if(lunar.day===15)result.push({id:'vong',calendar:'lunar',day:15,month:lunar.month,title:'Cúng Vọng (ngày Rằm âm lịch)',rite:'Tiểu Đàn',monthly:true});
  return result;
 }
 const css=document.createElement('style');css.id='gdd-dao-festivals-css';
 css.textContent=`
 .gdd-archive-dashboard .gdd-cal-day.gdd-ceremony-day{position:relative}
 .gdd-archive-dashboard .gdd-cal-day .gdd-ceremony-mark{
  position:absolute;top:1px;left:2px;color:#ad8348;
  font:700 11px/1 'Noto Serif',Georgia,serif;pointer-events:none
 }
 .gdd-archive-dashboard .gdd-cal-day.selected .gdd-ceremony-mark{color:#f2d5a2}
 .gdd-archive-dashboard .gdd-cal-day.gdd-ceremony-day:not(.selected){border-color:#dbc89e}
 .gdd-archive-dashboard .gdd-ceremony-legend{margin:5px 0 0;font:500 10px/1.5 'Be Vietnam Pro',Arial,sans-serif;color:#806c4d}
 .gdd-archive-dashboard #gdd-dao-festival-selected{padding:11px 12px;margin:10px 0;border:1px solid #d9c8a7;border-radius:7px;background:#fffbf1}
 .gdd-archive-dashboard #gdd-dao-festival-selected[hidden]{display:none!important}
 .gdd-archive-dashboard .gdd-festival-header{display:flex;align-items:center;gap:7px;font:700 12px/1.5 'Noto Serif',Georgia,serif;color:#255548}
 .gdd-archive-dashboard .gdd-festival-header span{color:#aa874f;font-size:15px}
 .gdd-archive-dashboard .gdd-festival-date{margin:5px 0 9px;font:400 10px/1.6 'Be Vietnam Pro',Arial,sans-serif;color:#7a775f}
 .gdd-archive-dashboard .gdd-festival-list{display:grid;gap:7px}
 .gdd-archive-dashboard .gdd-festival-item{border-left:2px solid #c49b56;background:#fffdf8;padding:8px 9px;border-radius:0 5px 5px 0}
 .gdd-archive-dashboard .gdd-festival-item strong{display:block;color:#264f42;font:700 12px/1.5 'Noto Serif',Georgia,serif}
 .gdd-archive-dashboard .gdd-festival-item small{display:block;margin-top:3px;color:#98784a;font:700 10px/1.5 'Be Vietnam Pro',Arial,sans-serif}
 .gdd-archive-dashboard .gdd-festival-item p{margin:5px 0 0;font:400 10px/1.6 'Be Vietnam Pro',Arial,sans-serif;color:#6d6b5b}
 .gdd-archive-dashboard #gdd-dao-festival-guidance{margin:9px 0;padding:8px 9px;border:1px solid #e3d7c0;background:#fcfaf4;border-radius:6px;font:400 10px/1.75 'Be Vietnam Pro',Arial,sans-serif;color:#616c60}
 .gdd-archive-dashboard #gdd-dao-festival-guidance summary{font-weight:700;cursor:pointer;color:#245444}
 .gdd-archive-dashboard #gdd-dao-festival-guidance p{margin:8px 0 0}
 .gdd-archive-dashboard #gdd-dao-festival-guidance button:focus-visible,.gdd-archive-dashboard #gdd-dao-festival-guidance summary:focus-visible{outline:2px solid #c09b5d;outline-offset:2px}
 @media(max-width:420px){.gdd-archive-dashboard .gdd-cal-day .gdd-ceremony-mark{top:0;left:1px;font-size:9px}.gdd-archive-dashboard .gdd-ceremony-legend{font-size:9px}}
 `;
 document.head.append(css);
 function init(){
  const calendar=document.querySelector('.gdd-calendar'),grid=document.querySelector('#gdd-cal-days');
  if(!calendar||!grid||document.getElementById('gdd-dao-festival-selected'))return;
  const selected=document.querySelector('#gdd-cal-selected');
  const festival=document.createElement('section');
  festival.id='gdd-dao-festival-selected';
  festival.setAttribute('aria-label','Ngày cúng lễ Đại Đạo tại Tòa Thánh');
  festival.setAttribute('aria-live','polite');
  festival.hidden=true;
  const notes=document.createElement('details');notes.id='gdd-dao-festival-guidance';
  notes.innerHTML=`
   <summary>Quy định cúng lễ tại địa phương và các ngày Sóc Vọng</summary>
   <p><b>Thượng Ngươn, Trung Ngươn, Hạ Ngươn:</b> tại Thánh Thất và Điện Thờ Phật Mẫu địa phương, thời gian cúng từ mùng 1 đến hết Rằm (15) các tháng Giêng, Bảy, Mười âm lịch, cùng thời điểm với Tòa Thánh.</p>
   <p><b>Hội Yến Diêu Trì Cung (15/8 âm lịch):</b> Điện Thờ Phật Mẫu địa phương chỉ cúng đàn theo thông lệ, không được lập nghi cúng Hội Yến Diêu Trì Cung.</p>
   <p><b>Ngày kỷ niệm hội:</b> địa phương chỉ cúng Tiểu Đàn tại Thánh Thất.</p>
   <p><b>Cúng Sóc Vọng:</b> ngày mùng 1 và ngày Rằm (15) mỗi tháng âm lịch, Tiểu Đàn (kể cả tháng nhuận khi có). Những lễ ghi ngày âm lịch được tính theo lịch Việt Nam UTC+7, riêng lễ Vía Đức Jésus Christ theo ngày 25/12 dương lịch.</p>`;
  const legend=document.createElement('p');legend.className='gdd-ceremony-legend';
  legend.textContent='◆ Ngày cúng lễ Tòa Thánh · ✦ Kỷ niệm qui vị Chức Sắc';
  const heading=calendar.querySelector('.gdd-cal-toolbar');
  heading?.insertAdjacentElement('afterend',legend);
  const note=calendar.querySelector('.gdd-cal-qui-vi-month');
  if(note)note.insertAdjacentElement('afterend',festival);
  else selected.insertAdjacentElement('afterend',festival);
  festival.insertAdjacentElement('afterend',notes);
  function dateFromButton(b){
   return {solarDate:b.dataset.solarDate,lunar:{day:+b.dataset.lunarDay,month:+b.dataset.lunarMonth,leap:b.dataset.lunarLeap==='1',year:+b.dataset.lunarYear}};
  }
  function markDates(){
   for(const b of grid.querySelectorAll('.gdd-cal-day')){
    const previous=b.querySelector('.gdd-ceremony-mark');previous?.remove();
    b.classList.remove('gdd-ceremony-day');
    const date=dateFromButton(b),rituals=ceremoniesOn(date);
    if(!rituals.length)continue;
    b.classList.add('gdd-ceremony-day');
    const mark=document.createElement('span');mark.className='gdd-ceremony-mark';
    mark.textContent='◆';mark.setAttribute('aria-hidden','true');b.append(mark);
    const label=b.getAttribute('aria-label')||b.title;
    b.setAttribute('aria-label',label+' · '+rituals.length+' lễ cúng Đạo');
   }
   const chosen=grid.querySelector('.gdd-cal-day.selected');
   if(chosen)showSelected(dateFromButton(chosen));
  }
  function showSelected(date){
   const items=ceremoniesOn(date);
   festival.hidden=!items.length;
   if(!items.length){festival.replaceChildren();return}
   const [year,month,day]=date.solarDate.split('-');
   const CAN=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
   const CHI=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
   const lunar=date.lunar;
   const lunarYearName=CAN[(lunar.year+6)%10]+' '+CHI[(lunar.year+8)%12];
   const lunarDate=pad(lunar.day)+'/'+pad(lunar.month)+(lunar.leap?' nhuận':'')+' năm '+lunarYearName+' ('+lunar.year+')';
   const html=items.map(item=>
    '<article class="gdd-festival-item"><strong>'+escapeHTML(item.title)+'</strong>'+
    '<small>'+escapeHTML(item.rite)+' · '+(item.calendar==='solar'?'Dương lịch':'Âm lịch')+'</small>'+
    (item.note?'<p>'+escapeHTML(item.note)+'</p>':'')+
    '</article>').join('');
   festival.innerHTML='<div class="gdd-festival-header"><span>◆</span> Lễ cúng Đạo tại Tòa Thánh ('+items.length+')</div>'+
    '<p class="gdd-festival-date">Ngày '+day+'/'+month+'/'+year+' dương lịch · Ngày '+escapeHTML(lunarDate)+' âm lịch</p>'+
    '<div class="gdd-festival-list">'+html+'</div>';
  }
  window.addEventListener('gdd:calendar-updated',markDates);
  markDates();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();