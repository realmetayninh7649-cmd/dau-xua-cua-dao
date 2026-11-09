/* GIỮ ĐẠO GIỮA ĐỜI - Lịch âm dương Việt Nam và thống kê kho tư liệu.
 * Tệp độc lập, không sửa app.js hoặc Supabase bảng cũ.
 * Phiên bản 2026-11-04. Không dùng tài khoản bí mật ở trình duyệt.
 */
(() => {
  'use strict';
  if (window.__gddCalendarStats2026) return;
  window.__gddCalendarStats2026 = true;
  const $ = (s, root=document) => root.querySelector(s);
  const pad = n => String(n).padStart(2, '0');
  const html = `
    <section class="gdd-archive-dashboard" id="gdd-archive-dashboard" aria-label="Lịch âm dương và thống kê website">
      <div class="wrap gdd-dash-inner">
        <div class="gdd-dash-heading">
          <span class="gdd-dash-eyebrow">DẤU XƯA CỬA ĐẠO · THÔNG TIN TRA CỨU</span>
          <h2>Lịch Âm – Dương <em>&amp; Thống kê</em></h2>
          <p>Tra cứu ngày tháng theo lịch Việt Nam và theo dõi kho tư liệu đang được gìn giữ.</p>
        </div>
        <div class="gdd-dash-grid">
          <section class="gdd-dash-card gdd-calendar" aria-label="Lịch Dương – Âm Việt Nam">
            <header class="gdd-panel-head"><span class="gdd-panel-mark">01</span><h3>LỊCH ÂM – DƯƠNG</h3><button type="button" class="gdd-cal-toggle" id="gdd-cal-toggle" aria-controls="gdd-cal-days" aria-expanded="false">Xem lịch ↓</button></header>
            <div class="gdd-cal-toolbar">
              <button type="button" id="gdd-cal-prev" aria-label="Tháng trước">‹</button>
              <strong id="gdd-cal-month"></strong>
              <button type="button" id="gdd-cal-next" aria-label="Tháng sau">›</button>
            </div>
            <div class="gdd-calendar-weekdays" aria-hidden="true"><span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span></div>
            <div class="gdd-cal-days" id="gdd-cal-days" aria-label="Các ngày trong tháng"></div>
            <div class="gdd-cal-selected" id="gdd-cal-selected" aria-live="polite"></div>
            <button type="button" class="gdd-today-link" id="gdd-cal-today">Về ngày hôm nay ↗</button>
            <p class="gdd-panel-footnote">Âm lịch Việt Nam theo UTC+7, có ghi tháng nhuận. Niên đại trước 1968 cần đối chiếu thêm nguồn lịch sử.</p>
          </section>
          <section class="gdd-dash-card gdd-statistics" aria-label="Thống kê tư liệu và truy cập">
            <header class="gdd-panel-head"><span class="gdd-panel-mark">02</span><h3>THỐNG KÊ KHO TƯ LIỆU</h3></header>
            <div id="gdd-existing-statistics"></div>
            <div class="gdd-visitor-block">
              <div class="gdd-visitor-unit"><span class="gdd-status-dot" aria-hidden="true"></span><span>Đang trực tuyến</span><strong id="gdd-online-count" aria-live="polite">—</strong></div>
              <div class="gdd-visitor-unit"><span class="gdd-visits-symbol" aria-hidden="true">↗</span><span>Tổng lượt truy cập</span><strong id="gdd-total-visits" aria-live="polite">—</strong></div>
            </div>
            <p class="gdd-visitor-note" id="gdd-visitor-note">Đang kiểm tra bộ đếm lượt truy cập…</p>
            <p class="gdd-panel-footnote">Trực tuyến: số phiên hoạt động trong 5 phút gần nhất. Tổng truy cập: số phiên ghi nhận từ khi bật bộ đếm; không phải lượt xem trang.</p>
          </section>
        </div>
      </div>
    </section>`;

  const css = `
  /* Chỉ tác động vào nhận diện đầu trang và hai khối thống kê cuối trang. */
  .site-header .portal-brand-row {min-height:108px; padding:12px 0; gap:14px}
  .site-header .portal-brand-row .brand {gap:16px; min-width:0; flex:1 1 auto}
  .site-header .portal-brand-row .brand>img {width:84px; height:84px; flex:0 0 84px; object-fit:contain}
  .site-header .portal-brand-row .brand-copy {min-width:0; gap:4px}
  .site-header .portal-brand-row .brand-copy strong {font-size:clamp(21px,2vw,28px);line-height:1.24;letter-spacing:.009em;overflow-wrap:normal}
  .site-header .portal-brand-row .brand-copy small {font-size:clamp(10px,.92vw,12px);line-height:1.45;letter-spacing:.013em}
  @media (max-width:1100px) {
    .site-header .portal-brand-row .brand>img{width:73px;height:73px;flex-basis:73px}
    .site-header .portal-brand-row .brand-copy strong{font-size:clamp(18px,2.3vw,23px)}
  }
  @media (max-width:690px) {
    .site-header .portal-brand-row{min-height:99px;padding:11px 0;gap:8px}
    .site-header .portal-brand-row .brand{gap:10px}
    .site-header .portal-brand-row .brand>img{width:65px;height:65px;flex-basis:65px}
    .site-header .portal-brand-row .brand-copy strong{font-size:clamp(16px,4.5vw,19px);letter-spacing:0}
    .site-header .portal-brand-row .brand-copy small{font-size:clamp(8px,2.25vw,10px);letter-spacing:0;line-height:1.35}
    .site-header .portal-brand-row .nav-actions{gap:5px}
  }
  @media (max-width:385px) {
    .site-header .portal-brand-row{min-height:85px}
    .site-header .portal-brand-row .brand{gap:7px}
    .site-header .portal-brand-row .brand>img{width:55px;height:55px;flex-basis:55px}
    .site-header .portal-brand-row .brand-copy strong{font-size:15px}
    .site-header .portal-brand-row .brand-copy small{font-size:7.6px}
  }
  @media (max-width:335px) {
    .site-header .portal-brand-row .brand>img{width:49px;height:49px;flex-basis:49px}
    .site-header .portal-brand-row .brand-copy strong{font-size:12px}
    .site-header .portal-brand-row .brand-copy small{font-size:7px}
  }
  .gdd-archive-dashboard {background:linear-gradient(145deg,#f7f5ee,#eeeade 65%,#f8f6f0);border-top:1px solid #ddd6c8;border-bottom:1px solid #dad2c1;padding:clamp(48px,5vw,74px) 0 64px;color:#284438}
  .gdd-archive-dashboard * {box-sizing:border-box}
  .gdd-dash-heading {margin-bottom:29px}
  .gdd-dash-eyebrow {font:700 11px/1.6 'Be Vietnam Pro',sans-serif;letter-spacing:.18em;color:#a58149}
  .gdd-dash-heading h2 {font:600 clamp(27px,3.3vw,43px)/1.35 'Noto Serif',Georgia,serif;color:#24463a;margin:10px 0 12px}
  .gdd-dash-heading h2 em{font-weight:400;color:#1d5c50}
  .gdd-dash-heading>p{font:400 13px/1.8 'Be Vietnam Pro',sans-serif;color:#677169;margin:0}
  .gdd-dash-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.16fr);gap:23px;align-items:start}
  .gdd-dash-card{min-width:0;background:#fffdf8;border:1px solid #dfd6c6;border-radius:10px;box-shadow:0 9px 27px rgba(29,57,45,.05);padding:clamp(18px,2.5vw,31px)}
  .gdd-panel-head{display:flex;align-items:center;gap:12px;margin:0 0 19px;border-bottom:1px solid #e7e1d5;padding-bottom:17px}
  .gdd-panel-mark{font:700 11px/1.5 'Be Vietnam Pro',sans-serif;color:#b38d52}
  .gdd-panel-head h3{margin:0;font:700 17px/1.4 'Noto Serif',Georgia,serif;color:#225447;letter-spacing:.035em}
  .gdd-cal-toolbar{display:grid;grid-template-columns:36px 1fr 36px;align-items:center;gap:8px;margin:2px 0 13px}
  .gdd-cal-toolbar strong{text-align:center;font:700 17px/1.5 'Noto Serif',Georgia,serif;color:#245749}
  .gdd-cal-toolbar button{background:#f3f0e7;border:1px solid #ded6c7;border-radius:6px;min-height:37px;color:#276155;font-size:24px;cursor:pointer}
  .gdd-cal-toolbar button:hover,.gdd-cal-toolbar button:focus-visible{background:#e4eadd}
  .gdd-calendar-weekdays,.gdd-cal-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
  .gdd-calendar-weekdays{margin-bottom:6px}
  .gdd-calendar-weekdays span{text-align:center;font:700 11px/1.5 'Be Vietnam Pro',sans-serif;color:#7d796d;padding:6px 0}
  .gdd-cal-day{min-width:0;min-height:53px;padding:6px 2px;border:1px solid #ede9df;border-radius:5px;background:#faf9f5;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer}
  .gdd-cal-day .gdd-solar{font:700 15px/1.25 'Be Vietnam Pro',sans-serif;color:#354d43}
  .gdd-cal-day .gdd-lunar{font:400 10px/1.3 'Be Vietnam Pro',sans-serif;color:#8a795d;white-space:nowrap}
  .gdd-cal-day.other{opacity:.38;background:#f4f2ed}
  .gdd-cal-day.today{border-color:#c0a370;box-shadow:inset 0 0 0 1px #c0a370}
  .gdd-cal-day.selected{background:#1b574d;border-color:#1b574d;opacity:1}
  .gdd-cal-day.selected .gdd-solar,.gdd-cal-day.selected .gdd-lunar{color:#fffdf8}
  .gdd-cal-day:hover:not(.selected){border-color:#b9c9bb;background:#eef2e9}
  .gdd-cal-selected{margin-top:18px;padding:12px 14px;border-left:3px solid #bc985c;background:#f3f0e7;border-radius:0 6px 6px 0;display:grid;gap:4px}
  .gdd-cal-selected strong{font:700 13px/1.5 'Be Vietnam Pro',sans-serif;color:#254e42}
  .gdd-cal-selected span{font:400 12px/1.5 'Be Vietnam Pro',sans-serif;color:#6b7067}
  .gdd-today-link{border:0;background:none;color:#1b594b;cursor:pointer;padding:12px 0 0;font:700 12px/1.4 'Be Vietnam Pro',sans-serif}
  .gdd-panel-footnote{margin:15px 0 0;font:400 10px/1.6 'Be Vietnam Pro',sans-serif;color:#868576}
  .gdd-statistics .number-band{background:none!important;border:0!important;padding:0!important;margin:0!important}
  .gdd-statistics .number-band .wrap{width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
  .gdd-statistics .number-band .number-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;min-height:0!important;gap:0!important}
  .gdd-statistics .number-band .number-grid>div:not(.number-message){display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:5px!important;min-width:0!important;min-height:115px!important;padding:14px 5px!important;border-right:1px solid #e5e0d5!important;text-align:center!important}
  .gdd-statistics .number-band .number-grid>div:nth-child(3n){border-right:0!important}
  .gdd-statistics .number-band .number-grid>div:nth-child(n+4):nth-child(-n+6){border-top:1px solid #e5e0d5!important}
  .gdd-statistics .number-band .number-grid strong{font:600 clamp(28px,2.8vw,37px)/1.25 'Noto Serif',Georgia,serif!important;color:#145749!important}
  .gdd-statistics .number-band .number-grid span{font:400 11px/1.45 'Be Vietnam Pro',sans-serif!important;color:#6c726b!important;overflow-wrap:anywhere}
  .gdd-statistics .number-band .number-message{display:none!important}
  .gdd-visitor-block{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;margin:25px 0 0;border-top:1px solid #e4decf;padding-top:22px}
  .gdd-visitor-unit{min-width:0;border-radius:7px;border:1px solid #e2ddcf;background:#f7f5ec;padding:14px 11px;display:grid;grid-template-columns:auto 1fr;column-gap:8px;row-gap:10px;align-items:center}
  .gdd-visitor-unit>span:nth-child(2){font:600 12px/1.5 'Be Vietnam Pro',sans-serif;color:#55665c}
  .gdd-visitor-unit strong{grid-column:1/-1;font:600 33px/1.25 'Noto Serif',Georgia,serif;color:#195548;text-align:center}
  .gdd-status-dot{display:inline-block;width:9px;height:9px;background:#398570;border-radius:50%;box-shadow:0 0 0 4px #e4ebe4}
  .gdd-visits-symbol{display:inline-block;font-size:21px;color:#af8a51}
  .gdd-visitor-note{font:400 11px/1.6 'Be Vietnam Pro',sans-serif;color:#7d806f;margin:12px 0 0}
  @media(max-width:900px){.gdd-dash-grid{grid-template-columns:1fr;gap:18px}.gdd-archive-dashboard{padding-bottom:46px}}
  @media(max-width:420px){.gdd-dash-card{padding:16px}.gdd-panel-head h3{font-size:15px}.gdd-cal-day{min-height:49px}.gdd-cal-day .gdd-solar{font-size:13px}.gdd-cal-day .gdd-lunar{font-size:9px}.gdd-visitor-unit>span:nth-child(2){font-size:10px}}
  @media(max-width:340px){.gdd-calendar-weekdays,.gdd-cal-days{gap:2px}.gdd-statistics .number-band .number-grid span{font-size:9px!important}.gdd-statistics .number-band .number-grid>div:not(.number-message){padding:10px 2px!important}}
  /* BẢN THU GỌN 2026-11-04: chỉ tinh chỉnh lịch và khung thống kê; giữ nguyên logic. */
  .gdd-archive-dashboard {padding:25px 0 27px;}
  .gdd-archive-dashboard .gdd-dash-inner {max-width:1010px;}
  .gdd-dash-heading {margin-bottom:13px;}
  .gdd-dash-eyebrow {font-size:9px;letter-spacing:.12em;}
  .gdd-dash-heading h2 {font-size:clamp(20px,2.25vw,28px);margin:5px 0 3px;line-height:1.3;}
  .gdd-dash-heading>p {font-size:11px;line-height:1.55;}
  .gdd-dash-grid {grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:13px;}
  .gdd-dash-card {padding:14px 15px;border-radius:7px;box-shadow:0 4px 13px rgba(29,57,45,.035);}
  .gdd-panel-head {gap:8px;margin-bottom:10px;padding-bottom:9px;}
  .gdd-panel-mark {font-size:9px;}
  .gdd-panel-head h3 {font-size:13px;line-height:1.3;}
  .gdd-cal-toolbar {grid-template-columns:29px 1fr 29px;gap:5px;margin:0 0 6px;}
  .gdd-cal-toolbar strong {font-size:14px;}
  .gdd-cal-toolbar button {min-height:29px;font-size:20px;border-radius:4px;padding:0;}
  .gdd-calendar-weekdays,.gdd-cal-days {gap:2px;}
  .gdd-calendar-weekdays {margin-bottom:3px;}
  .gdd-calendar-weekdays span {padding:3px 0;font-size:9px;}
  .gdd-cal-day {min-height:35px;padding:2px 1px;gap:0;border-radius:3px;}
  .gdd-cal-day .gdd-solar {font-size:12px;line-height:1.3;}
  .gdd-cal-day .gdd-lunar {font-size:8px;line-height:1.2;}
  .gdd-cal-selected {margin-top:8px;padding:7px 9px;gap:2px;border-left-width:2px;}
  .gdd-cal-selected strong {font-size:10.5px;line-height:1.45;}
  .gdd-cal-selected span {font-size:10px;line-height:1.4;}
  .gdd-today-link {padding-top:7px;font-size:10px;}
  .gdd-panel-footnote {margin-top:7px;font-size:9px;line-height:1.5;}
  .gdd-statistics .number-band .number-grid>div:not(.number-message) {min-height:65px!important;padding:7px 3px!important;gap:2px!important;}
  .gdd-statistics .number-band .number-grid strong {font-size:clamp(22px,2.15vw,27px)!important;line-height:1.16!important;}
  .gdd-statistics .number-band .number-grid span {font-size:9.5px!important;line-height:1.3!important;}
  .gdd-visitor-block {gap:8px;margin-top:12px;padding-top:11px;}
  .gdd-visitor-unit {border-radius:4px;padding:8px 7px;row-gap:3px;column-gap:6px;}
  .gdd-visitor-unit>span:nth-child(2){font-size:10px;line-height:1.3;}
  .gdd-visitor-unit strong {font-size:23px;line-height:1.1;}
  .gdd-status-dot {width:6px;height:6px;box-shadow:0 0 0 2px #e4ebe4;}
  .gdd-visits-symbol {font-size:14px;}
  .gdd-visitor-note {margin-top:6px;font-size:9.5px;line-height:1.5;}
  @media(max-width:900px){.gdd-dash-grid{grid-template-columns:1fr;gap:12px;}}
  @media(max-width:420px){
    .gdd-archive-dashboard{padding:20px 0 22px;}
    .gdd-dash-card{padding:11px 12px;}
    .gdd-dash-heading{margin-bottom:10px;}
    .gdd-dash-heading h2{font-size:20px;}
    .gdd-dash-heading>p{font-size:10px;}
    .gdd-cal-day{min-height:34px;}
    .gdd-cal-day .gdd-solar{font-size:11.5px;}
    .gdd-cal-day .gdd-lunar{font-size:8px;}
    .gdd-panel-head h3{font-size:12px;}
    .gdd-statistics .number-band .number-grid span{font-size:9px!important;}
  }
  @media(max-width:340px){
    .gdd-cal-day{min-height:30px;}
    .gdd-cal-day .gdd-solar{font-size:10.5px;}
    .gdd-statistics .number-band .number-grid>div:not(.number-message){min-height:59px!important;}
    .gdd-visitor-unit>span:nth-child(2){font-size:9px;}
  }


  /* Khung Lịch Âm – Dương: mây cách điệu nét vàng đồng chìm trên nền kem.
     SVG vector nhỏ, không gọi máy chủ ngoài, không che vùng tương tác. */
  .gdd-archive-dashboard .gdd-calendar{
    background-color:#fffdf8;
    background-image:
      url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20360%20180%22%20fill%3D%22none%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%22360%22%20y2%3D%22160%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23C29A56%22%20stop-opacity%3D%22.09%22%2F%3E%3Cstop%20offset%3D%22.48%22%20stop-color%3D%22%23B58C4C%22%20stop-opacity%3D%22.38%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23C29A56%22%20stop-opacity%3D%22.08%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cg%20stroke%3D%22url(%23g)%22%20stroke-width%3D%222.6%22%20stroke-linejoin%3D%22round%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M5%20137H77c19%200%2030-12%2030-24%200-11-9-20-21-20-10%200-17%206-17%2014%200%207%205%2011%2011%2011%206%200%2010-5%209-9%22%2F%3E%3Cpath%20d%3D%22M94%20137h71c23%200%2037-14%2037-31%200-14-12-26-28-26-14%200-23%208-23%2019%200%208%206%2013%2013%2013%208%200%2013-5%2012-12%22%2F%3E%3Cpath%20d%3D%22M182%20137h86c22%200%2036-11%2036-25%200-12-11-22-24-22-12%200-19%207-19%2016%200%207%206%2011%2012%2010%22%2F%3E%3Cpath%20d%3D%22M26%20154h176m26%200h112%22%2F%3E%3Cpath%20d%3D%22M69%2080c9-18%2027-27%2048-24%208-27%2040-41%2067-27%2013-23%2043-30%2066-14%2011%208%2017%2018%2020%2029%2020-5%2042%209%2045%2029%22%2F%3E%3Cpath%20d%3D%22M106%2076c8-9%2022-14%2035-9%2013-20%2038-28%2058-16%2015-13%2034-12%2047-2%22%2F%3E%3Cpath%20d%3D%22M225%2024c-5-13-20-19-31-12-8%205-9%2015-3%2019%22%2F%3E%3Cpath%20d%3D%22M303%2080c18-6%2039%206%2045%2022%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"),
      url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20360%20180%22%20fill%3D%22none%22%3E%3Cdefs%3E%3ClinearGradient%20id%3D%22g%22%20x1%3D%220%22%20y1%3D%220%22%20x2%3D%22360%22%20y2%3D%22160%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23C29A56%22%20stop-opacity%3D%22.09%22%2F%3E%3Cstop%20offset%3D%22.48%22%20stop-color%3D%22%23B58C4C%22%20stop-opacity%3D%22.38%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23C29A56%22%20stop-opacity%3D%22.08%22%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Cg%20transform%3D%22translate(360%200)%20scale(-1%201)%22%20stroke%3D%22url(%23g)%22%20stroke-width%3D%222.6%22%20stroke-linejoin%3D%22round%22%20stroke-linecap%3D%22round%22%3E%3Cpath%20d%3D%22M5%20137H77c19%200%2030-12%2030-24%200-11-9-20-21-20-10%200-17%206-17%2014%200%207%205%2011%2011%2011%206%200%2010-5%209-9%22%2F%3E%3Cpath%20d%3D%22M94%20137h71c23%200%2037-14%2037-31%200-14-12-26-28-26-14%200-23%208-23%2019%200%208%206%2013%2013%2013%208%200%2013-5%2012-12%22%2F%3E%3Cpath%20d%3D%22M182%20137h86c22%200%2036-11%2036-25%200-12-11-22-24-22-12%200-19%207-19%2016%200%207%206%2011%2012%2010%22%2F%3E%3Cpath%20d%3D%22M26%20154h176m26%200h112%22%2F%3E%3Cpath%20d%3D%22M69%2080c9-18%2027-27%2048-24%208-27%2040-41%2067-27%2013-23%2043-30%2066-14%2011%208%2017%2018%2020%2029%2020-5%2042%209%2045%2029%22%2F%3E%3Cpath%20d%3D%22M106%2076c8-9%2022-14%2035-9%2013-20%2038-28%2058-16%2015-13%2034-12%2047-2%22%2F%3E%3Cpath%20d%3D%22M225%2024c-5-13-20-19-31-12-8%205-9%2015-3%2019%22%2F%3E%3Cpath%20d%3D%22M303%2080c18-6%2039%206%2045%2022%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E"),
      linear-gradient(150deg,#fffefa 0%,#fbf7ec 57%,#fffdf8 100%);
    background-repeat:no-repeat,no-repeat,no-repeat;
    background-position:right -18px top 50px,left -30px bottom 47px,center;
    background-size:clamp(155px,19vw,230px) auto,clamp(170px,22vw,270px) auto,cover;
    background-origin:padding-box;
    border-color:#d8c8a6;
    box-shadow:inset 0 0 0 1px rgba(190,156,94,.10),0 4px 13px rgba(29,57,45,.04);
  }
  .gdd-archive-dashboard .gdd-calendar .gdd-panel-head{border-bottom-color:rgba(178,147,91,.25)}
  @media(max-width:600px){
    .gdd-archive-dashboard .gdd-calendar{
      background-position:right -42px top 40px,left -54px bottom 40px,center;
      background-size:140px auto,155px auto,cover;
    }
  }
  @media(max-width:360px){
    .gdd-archive-dashboard .gdd-calendar{
      background-position:right -58px top 35px,left -62px bottom 30px,center;
      background-size:130px auto,143px auto,cover;
    }
  }

  /* Điện thoại: ban đầu chỉ hiện lịch hôm nay, bấm để xem đủ tháng. */
  .gdd-cal-toggle{display:none;margin-left:auto;cursor:pointer;border:1px solid #d9d1bf;border-radius:5px;padding:5px 8px;background:#f3f0e7;color:#225447;font:600 10px/1.3 'Be Vietnam Pro',sans-serif;white-space:nowrap}
  @media(max-width:600px){
    .gdd-cal-toggle{display:block}
    .gdd-calendar:not(.gdd-calendar-expanded) .gdd-cal-toolbar,
    .gdd-calendar:not(.gdd-calendar-expanded) .gdd-calendar-weekdays,
    .gdd-calendar:not(.gdd-calendar-expanded) .gdd-cal-days,
    .gdd-calendar:not(.gdd-calendar-expanded) .gdd-today-link,
    .gdd-calendar:not(.gdd-calendar-expanded) .gdd-panel-footnote {display:none!important}
    .gdd-calendar:not(.gdd-calendar-expanded) .gdd-cal-selected{margin-top:1px}
  }
  `;

  // Chuyển đổi âm lịch Việt Nam, cách tính thiên văn (Hồ Ngọc Đức), UTC+7.
  // Công thức Meeus rút gọn; không dựa vào lịch âm Trung Quốc UTC+8.
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
  const CAN=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
  const CHI=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
  const canChi = y => CAN[(y+6)%10]+' '+CHI[(y+8)%12];
  const weekdays=['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
  function vnToday() {
    const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(new Date());
    const map=Object.fromEntries(parts.filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
    return {year:map.year,month:map.month,day:map.day};
  }
  function startCalendar() {
    const view=$('#gdd-cal-days'),label=$('#gdd-cal-month'),selectedInfo=$('#gdd-cal-selected');
    if(!view||!label||!selectedInfo)return;
    const current=vnToday();let yy=current.year,mm=current.month,selected={...current};
    const within=(y,m)=>y>=1900&&y<=2100&&m>=1&&m<=12;
    function render() {
      label.textContent='Tháng '+pad(mm)+' / '+yy;
      view.replaceChildren();
      const begin=new Date(Date.UTC(yy,mm-1,1));
      const startOffset=(begin.getUTCDay()+6)%7;
      const daysInMonth=new Date(Date.UTC(yy,mm,0)).getUTCDate();
      const count=Math.ceil((startOffset+daysInMonth)/7)*7;
      for(let i=0;i<count;i++){
        const date=new Date(Date.UTC(yy,mm-1,i-startOffset+1));
        const y=date.getUTCFullYear(),m=date.getUTCMonth()+1,d=date.getUTCDate();
        const lunar=solarToLunar(d,m,y);
        const day=document.createElement('button');day.type='button';day.className='gdd-cal-day';
        if(m!==mm)day.classList.add('other');
        if(y===current.year&&m===current.month&&d===current.day)day.classList.add('today');
        if(y===selected.year&&m===selected.month&&d===selected.day)day.classList.add('selected');
        const a=document.createElement('span');a.className='gdd-solar';a.textContent=d;
        const b=document.createElement('span');b.className='gdd-lunar';b.textContent=lunar.day===1||lunar.leap?lunar.day+'/'+lunar.month+(lunar.leap?'N':''):String(lunar.day);
        day.append(a,b);
        day.title=`${pad(d)}/${pad(m)}/${y} (Dương) · ${pad(lunar.day)}/${pad(lunar.month)} năm ${canChi(lunar.year)} (${lunar.year})${lunar.leap?' · tháng nhuận':''} (Âm)`;
        day.dataset.solarDate=`${y}-${pad(m)}-${pad(d)}`;
        day.dataset.lunarDay=String(lunar.day);
        day.dataset.lunarMonth=String(lunar.month);
         day.dataset.lunarYear=String(lunar.year);
        day.dataset.lunarLeap=lunar.leap?'1':'0';
        day.setAttribute('aria-label',day.title);
        day.addEventListener('click',()=>{selected={year:y,month:m,day:d};if(m!==mm){yy=y;mm=m}render()});
        view.appendChild(day);
      }
      const dt=new Date(Date.UTC(selected.year,selected.month-1,selected.day));
      const lunar=solarToLunar(selected.day,selected.month,selected.year);
      selectedInfo.replaceChildren();
      const name=document.createElement('strong');name.textContent=weekdays[dt.getUTCDay()]+', '+pad(selected.day)+'/'+pad(selected.month)+'/'+selected.year+' (Dương lịch)';
      const info=document.createElement('span');info.textContent='Âm lịch: '+pad(lunar.day)+'/'+pad(lunar.month)+(lunar.leap?' nhuận':'')+' năm '+canChi(lunar.year)+' ('+lunar.year+')';
      selectedInfo.append(name,info);
      window.dispatchEvent(new CustomEvent('gdd:calendar-updated',{detail:{
        solarDate:`${selected.year}-${pad(selected.month)}-${pad(selected.day)}`,
        lunar:{day:lunar.day,month:lunar.month,year:lunar.year,leap:lunar.leap},
        month:mm,year:yy
      }}));
      $('#gdd-cal-prev').disabled=yy===1900&&mm===1;
      $('#gdd-cal-next').disabled=yy===2100&&mm===12;
    }
    function shift(delta){const date=new Date(Date.UTC(yy,mm-1+delta,1));if(within(date.getUTCFullYear(),date.getUTCMonth()+1)){yy=date.getUTCFullYear();mm=date.getUTCMonth()+1;selected={year:yy,month:mm,day:1};render()}}
    $('#gdd-cal-prev').addEventListener('click',()=>shift(-1));
    $('#gdd-cal-next').addEventListener('click',()=>shift(1));
    $('#gdd-cal-today').addEventListener('click',()=>{const today=vnToday();yy=today.year;mm=today.month;selected=today;render()});
    render();
  }
  function startVisitors() {
    const online=$('#gdd-online-count'),total=$('#gdd-total-visits'),note=$('#gdd-visitor-note');
    if(!online||!total||!note)return;
    const cfg=window.SITE_CONFIG||{};
    if(!cfg.supabaseUrl||!cfg.supabasePublishableKey){note.textContent='Chưa kết nối dữ liệu thống kê Supabase.';return;}
    let sessionId='';
    try{sessionId=sessionStorage.getItem('gdd-visit-id-2026')||''}catch{}
    if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(sessionId)){
      sessionId=globalThis.crypto?.randomUUID?.()||'';
      try{if(sessionId)sessionStorage.setItem('gdd-visit-id-2026',sessionId)}catch{}
    }
    if(!sessionId){note.textContent='Trình duyệt không hỗ trợ mã phiên ẩn danh.';return;}
    let loading=false,clientPromise=null;
    async function ping(){
      if(loading||document.visibilityState==='hidden')return;
      loading=true;
      try{
        if(!clientPromise){clientPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm').then(({createClient})=>createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}));}
        const client=await clientPromise;
        const {data,error}=await client.rpc('gdd_record_visit',{p_session_id:sessionId});
        if(error)throw error;
        if(!data||!Number.isFinite(Number(data.online_count))||!Number.isFinite(Number(data.total_visits)))throw Error('Dữ liệu trả về không hợp lệ');
        online.textContent=Number(data.online_count).toLocaleString('vi-VN');
        total.textContent=Number(data.total_visits).toLocaleString('vi-VN');
        note.textContent='Đã kết nối thống kê lượt truy cập · Tự cập nhật khi trang hoạt động.';
      }catch(e){note.textContent='Bộ đếm chưa kích hoạt hoặc kết nối gián đoạn. Cần chạy SQL cấu hình Supabase.';console.warn('[GDD Stats]',e?.message||e);}
      finally{loading=false}
    }
    ping();
    const heartbeat=setInterval(ping,90_000);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')ping()});
    window.addEventListener('pageshow',()=>{if(document.visibilityState==='visible')ping()});
  }
  function init() {
    const footer=$('.footer'),stats=$('.number-band');if(!footer||!stats)return;
    const style=document.createElement('style');style.id='gdd-calendar-stats-styles';style.textContent=css;document.head.appendChild(style);
    const shell=document.createElement('div');shell.innerHTML=html;
    const panel=shell.firstElementChild;
    footer.parentNode.insertBefore(panel,footer);
    // Di chuyển đúng dải sáu thống kê cũ, KHÔNG sao chép số liệu hoặc sửa mã đếm.
    const slot=$('#gdd-existing-statistics');slot.append(stats);stats.hidden=false;
    startCalendar();
    const toggle=$('#gdd-cal-toggle'),calendar=$('.gdd-calendar');
    if(toggle&&calendar){
      toggle.addEventListener('click',()=>{
        const expanded=calendar.classList.toggle('gdd-calendar-expanded');
        toggle.setAttribute('aria-expanded',String(expanded));
        toggle.textContent=expanded?'Thu gọn ↑':'Xem lịch ↓';
      });
    }
    startVisitors();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  // Để kiểm tra riêng ngày âm trên bản thử nghiệm; không can thiệp ứng dụng chính.
  window.GDDVietnameseLunar={solarToLunar};
})();
