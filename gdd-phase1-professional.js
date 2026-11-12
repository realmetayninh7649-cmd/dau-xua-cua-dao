/* GDD: Giai đoạn 1.2 — bố cục kiểu tạp chí 70/30.
 * Chỉ thêm lớp trình bày; không thay đổi dữ liệu, các nút mở hồ sơ hay liên kết. */
(() => {
 'use strict';
 if(window.__gddProfessionalHome)return;
 window.__gddProfessionalHome=true;
 const get=id=>document.getElementById(id);
 function el(tag,cls,text){
   const node=document.createElement(tag);
   if(cls)node.className=cls;
   if(text)node.textContent=text;
   return node;
 }
 const categories=[
  ['chuc-sac','Hồ sơ Chức sắc'],
  ['video-dao-su','Video Đạo Sử'],
  ['ai-tin','Ai Tín'],
  ['tai-lieu-so-hoa','Tài liệu số hóa'],
  ['bien-khao','Biên khảo'],
  ['hinh-anh','Hình ảnh']
 ];
 function build(){
   const main=get('gdd-p1-main'),side=get('gdd-p1-aside'),directory=get('gdd-directory');
   if(!main||!side||!directory||get('gdd-p1-professional-heading'))return;
   const head=el('header','gdd-p1-professional-heading');
   head.id='gdd-p1-professional-heading';
   head.append(el('span','gdd-p1-professional-kicker','BẢN TIN TƯ LIỆU ĐẠO SỬ'));
   head.append(el('h2','', 'PHẦN CHÍNH'));
   head.append(el('p','','Tưởng niệm tiền nhân và những tư liệu mới được sưu tầm, biên khảo.'));
   main.prepend(head);

   const desc=directory.querySelector('.gdd-directory-desc');
   if(desc)desc.textContent='Sáu chuyên mục dưới đây giới thiệu tư liệu mới nhất. Mở từng chuyên mục để xem toàn bộ hồ sơ, hình ảnh và văn kiện đã công bố.';
   const sidebarNav=el('nav','gdd-p1-sidebar-navigation');
   sidebarNav.id='gdd-p1-sidebar-navigation';
   sidebarNav.setAttribute('aria-label','Danh mục Đạo sử');
   sidebarNav.append(el('h3','','CHUYÊN MỤC TRA CỨU'));
   const list=el('div','gdd-p1-sidebar-links');
   for(const [target,name] of categories){
     const link=el('a','',name);
     link.href='#'+target;
     link.append(el('span','gdd-p1-link-arrow','›'));
     list.append(link);
   }
   sidebarNav.append(list);
   const intro=side.querySelector('.gdd-p1-side-intro');
   if(intro)intro.insertAdjacentElement('afterend',sidebarNav);
   else side.prepend(sidebarNav);

   const audio=get('gdd-p1-audio-panel');
   const calendar=get('gdd-p1-calendar-panel');
   if(audio){
     const summary=audio.querySelector(':scope > summary');
     if(summary){
       summary.textContent='';
       summary.append(el('span','gdd-p1-utility-name','ÂM THANH ĐẠI ĐẠO'));
       summary.append(el('small','gdd-p1-utility-desc','Nghe Radio Đạo Sử và các bài thánh âm'));
     }
     audio.open=false;
   }
   if(calendar){
     const summary=calendar.querySelector(':scope > summary');
     if(summary){
       summary.textContent='';
       summary.append(el('span','gdd-p1-utility-name','LỊCH ÂM – DƯƠNG'));
       summary.append(el('small','gdd-p1-utility-desc','Tra ngày lễ và kỷ niệm qui vị'));
     }
     calendar.open=false;
   }
   const anniversary=el('a','gdd-p1-anniversary-link');
   anniversary.href='#gdd-archive-dashboard';
   anniversary.append(el('span','gdd-p1-anniversary-icon','✦'));
   const copy=el('span','gdd-p1-anniversary-copy');
   copy.append(el('strong','','Ngày kỷ niệm & Lễ Đạo'));
   copy.append(el('small','','Xem các ngày sắp đến trong lịch'));
   anniversary.append(copy,el('span','gdd-p1-link-arrow','›'));
   const panel=calendar||audio;
   if(panel)panel.insertAdjacentElement('afterend',anniversary);
   else side.append(anniversary);

   // Đường dẫn tiện ích hiện có kích hoạt bảng Phụ trên điện thoại.
   anniversary.addEventListener('click',()=>{
     if(calendar)calendar.open=true;
   });
 }
 function ready(){
   build();
   if(!get('gdd-p1-professional-heading')){
     window.addEventListener('load',build,{once:true});
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
})();