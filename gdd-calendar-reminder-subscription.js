(function CalendarRemindersUI(){
 'use strict';
 if(window.__gddCalendarRemindersUI2026)return;
 window.__gddCalendarRemindersUI2026=true;
 const cfg=window.SITE_CONFIG||{};
 const endpoint=(cfg.supabaseUrl||"https://gwpdgubxoquhrfbolftq.supabase.co").replace(/\/+$/,"")+"/functions/v1/gdd-calendar-reminders";
 const subscriptionURL=endpoint;
 const $=(q,root=document)=>root.querySelector(q);
 const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;',"'":'&#39;'}[c]));
 const pad=n=>String(n).padStart(2,"0");
 const css=document.createElement('style');
 css.id='gdd-calendar-reminder-css';
 css.textContent=`
 #gdd-calendar-reminder-panel{margin-top:12px;background:linear-gradient(130deg,#fffcf3,#f6f2e5);border:1px solid #dbcaa7;border-radius:8px;padding:12px 11px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.8);color:#2c5546}
 #gdd-calendar-reminder-panel .gdd-remind-heading{display:flex;align-items:center;gap:7px;font:700 12px/1.5 'Noto Serif',Georgia,serif;color:#235548}
 #gdd-calendar-reminder-panel .gdd-remind-heading>span:first-child{font:20px/1 Georgia,serif;color:#b19259}
 #gdd-calendar-reminder-panel .gdd-remind-description{margin:7px 0;font:400 10px/1.65 'Be Vietnam Pro',Arial,sans-serif;color:#66746a}
 #gdd-calendar-reminder-panel .gdd-remind-actions{display:flex;gap:7px;align-items:stretch;flex-wrap:wrap;margin:10px 0 7px}
 #gdd-calendar-reminder-panel .gdd-remind-actions button{display:flex;align-items:center;justify-content:center;gap:5px;flex:1;min-width:115px;min-height:38px;border-radius:6px;padding:7px 9px;border:1px solid #c4b28b;background:#fffefa;color:#245548;cursor:pointer;font:700 10px/1.35 'Be Vietnam Pro',Arial,sans-serif}
 #gdd-calendar-reminder-panel .gdd-remind-actions button:first-child{background:#235548;color:#fff;border-color:#235548}
 #gdd-calendar-reminder-panel .gdd-remind-actions button:focus-visible{outline:3px solid #ba9658;outline-offset:2px}
 #gdd-calendar-reminder-panel .gdd-remind-status{min-height:18px;font:500 10px/1.6 'Be Vietnam Pro',Arial,sans-serif;color:#496453;margin:5px 0}
 #gdd-calendar-reminder-panel .gdd-remind-coming{margin-top:9px;padding-top:9px;border-top:1px solid rgba(169,145,101,.24)}
 #gdd-calendar-reminder-panel .gdd-remind-coming strong{display:block;font:700 10px/1.6 'Be Vietnam Pro',Arial,sans-serif;color:#8e754b}
 #gdd-calendar-reminder-panel .gdd-remind-coming ul{margin:5px 0 0;padding:0;list-style:none;display:grid;gap:5px}
 #gdd-calendar-reminder-panel .gdd-remind-coming li{font:400 10px/1.65 'Be Vietnam Pro',Arial,sans-serif;color:#54665b;overflow-wrap:anywhere}
 #gdd-calendar-reminder-panel .gdd-remind-coming time{font-weight:700;color:#255647}
 #gdd-calendar-reminder-panel details{margin-top:9px;border-top:1px solid rgba(169,145,101,.24);padding-top:8px;font:400 10px/1.7 'Be Vietnam Pro',Arial,sans-serif;color:#606f60}
 #gdd-calendar-reminder-panel summary{cursor:pointer;font-weight:700;color:#315c4d}
 #gdd-calendar-reminder-panel details p{margin:5px 0 0}
 #gdd-calendar-reminder-panel .gdd-remind-smalllink{color:#245548;text-decoration:underline;overflow-wrap:anywhere;cursor:pointer}
 @media(max-width:420px){#gdd-calendar-reminder-panel{padding:10px}#gdd-calendar-reminder-panel .gdd-remind-actions button{min-width:105px;min-height:39px}}
 `;
 document.head.append(css);
 function start(){
  const calendar=$('.gdd-calendar'),selected=$('#gdd-cal-selected');
  if(!calendar||!selected||$('#gdd-calendar-reminder-panel'))return;
  const box=document.createElement('section');box.id='gdd-calendar-reminder-panel';
  box.setAttribute('aria-label','Nhận nhắc lễ cúng và ngày kỷ niệm qui vị trước một ngày');
  box.innerHTML=`
   <div class="gdd-remind-heading"><span aria-hidden="true">♧</span><span>Lịch cúng lễ &amp; tưởng niệm</span></div>
   <p class="gdd-remind-description">Lịch cúng lễ tại Tòa Thánh và ngày kỷ niệm qui vị tự quy đổi ngày âm sang ngày dương của <strong>từng năm</strong>. Khi đã thêm lịch vào điện thoại, có thể nhận nhắc <strong>09:00 sáng trước 1 ngày</strong> (giờ Việt Nam), tùy cài đặt thông báo của ứng dụng Lịch.</p>
   <div class="gdd-remind-actions">
     <button type="button" id="gdd-remind-subscribe">＋ Theo dõi lịch tự cập nhật</button>
     <button type="button" id="gdd-remind-download">↓ Tải lịch có lời nhắc</button>
     <button type="button" id="gdd-remind-copy">⧉ Sao chép liên kết lịch</button>
   </div>
   <p class="gdd-remind-status" id="gdd-remind-status" role="status" aria-live="polite">Bản theo dõi sẽ nhận ngày lễ và ngày kỷ niệm mới khi ứng dụng Lịch đồng bộ.</p>
   <div class="gdd-remind-coming" id="gdd-remind-coming">
     <strong>Những ngày lễ cúng và kỷ niệm sắp tới (theo dương lịch)</strong>
     <ul><li>Đang tải ngày lễ và ngày tưởng niệm…</li></ul>
   </div>
   <details id="gdd-remind-help">
     <summary>Cách bật lời nhắc trên iPhone và Android</summary>
     <p><b>iPhone:</b> Chạm “Theo dõi lịch”, xác nhận thêm lịch; sau đó mở ứng dụng <b>Lịch → Lịch → (i)</b> cạnh lịch “Giữ Đạo Giữa Đời” và bật <b>Thông báo sự kiện</b>. Trong <b>Cài đặt → Thông báo → Lịch</b>, bật Cho phép thông báo.</p>
     <p><b>Android / Google Calendar:</b> Sao chép liên kết, mở Google Calendar trên máy tính → <b>Lịch khác → Thêm lịch → Từ URL</b>, dán liên kết; bật thông báo cho lịch đó. Hoặc tải tệp .ics để nhập từ máy tính. Việc đồng bộ và thông báo tùy ứng dụng lịch.</p>
     <p><b>Lưu ý:</b> Tệp .ics là bản chụp lịch cho 11 năm (năm hiện tại và 10 năm kế); nhập lại để cập nhật ngày mới. “Theo dõi lịch” cho phép ứng dụng lịch tự đồng bộ theo lịch làm mới của riêng ứng dụng. Không tự gửi thông báo khi người đọc chưa đăng ký hoặc chưa cấp quyền cho ứng dụng Lịch.</p>
   </details>`;
  const note=$('.gdd-cal-qui-vi-month',calendar);
  if(note)note.insertAdjacentElement('afterend',box);
  else selected.insertAdjacentElement('afterend',box);
  const message=$('#gdd-remind-status',box),list=$('#gdd-remind-coming ul',box);
  function status(text){message.textContent=text}
  async function copyLink(){
    try{
      if(!navigator.clipboard?.writeText)throw Error('Clipboard not available');
      await navigator.clipboard.writeText(subscriptionURL);
      status('Đã sao chép liên kết. Bạn có thể dán vào ứng dụng Lịch để theo dõi.');
    }catch{
      const field=document.createElement('input');field.type='text';field.readOnly=true;field.value=subscriptionURL;
      field.style.cssText='position:absolute;left:-9999px';box.append(field);field.select();
      let ok=false;try{ok=document.execCommand('copy')}catch{}
      field.remove();
      if(ok)status('Đã sao chép liên kết lịch.');
      else window.prompt('Sao chép liên kết lịch này:',subscriptionURL);
    }
  }
  $('#gdd-remind-copy',box).addEventListener('click',copyLink);
  $('#gdd-remind-subscribe',box).addEventListener('click',()=>{
    if(/iPad|iPhone|iPod|Macintosh/i.test(navigator.userAgent)){
      status('Đang mở ứng dụng Lịch. Bạn cần xác nhận Theo dõi và bật Thông báo sự kiện.');
      window.location.href=subscriptionURL.replace(/^https:/,'webcal:');
    }else{
      status('Dùng nút “Sao chép liên kết lịch”, rồi thêm từ URL trong Google Calendar hoặc ứng dụng lịch tương thích.');
      $('#gdd-remind-help',box).open=true;
    }
  });
  $('#gdd-remind-download',box).addEventListener('click',()=>{
    status('Đang tải tệp lịch .ics. Nhập tệp vào ứng dụng Lịch và bật cảnh báo sự kiện.');
    const anchor=document.createElement('a');anchor.href=endpoint+'?download=1';anchor.target='_blank';
    anchor.rel='noopener noreferrer';anchor.download='lich-ky-niem-qui-vi.ics';
    box.append(anchor);anchor.click();anchor.remove();
  });
  function dateVN(iso){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return iso;
    const [y,m,d]=iso.split('-');return d+'/'+m+'/'+y;
  }
  async function upcoming(){
    try{
      const response=await fetch(endpoint+'?format=json',{cache:'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      const json=await response.json();
      if(!json.ok||!Array.isArray(json.upcoming))throw Error('Unexpected calendar');
      list.replaceChildren();
      for(const e of json.upcoming.slice(0,5)){
        const li=document.createElement('li');
        const date=document.createElement('time');date.dateTime=e.solar;date.textContent=dateVN(e.solar);
        const summary=document.createTextNode(' · '+String(e.name||'Chức Sắc')+' (âm '+String(e.lunar||'')+')');
        li.append(date,summary);list.append(li);
      }
      if(!json.upcoming.length){const li=document.createElement('li');li.textContent='Chưa có ngày lễ hoặc kỷ niệm sắp tới được ghi nhận.';list.append(li)}
    }catch{
      list.replaceChildren();
      const li=document.createElement('li');li.textContent='Chưa tải được danh sách sắp tới. Vẫn có thể đăng ký hoặc tải lịch ở trên.';list.append(li);
    }
  }
  window.addEventListener('gdd:calendar-quick-saved',upcoming);
  window.addEventListener('gdd:people-anniversary-refresh',upcoming);
  upcoming();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();