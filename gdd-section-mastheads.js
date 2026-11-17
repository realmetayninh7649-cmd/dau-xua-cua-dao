/* Thống nhứt bìa chuyên mục theo mẫu Biên khảo, không nhân bản nội dung/bộ ảnh. */
(() => {
  'use strict';
  if(window.__GDDSectionMastheads)return;
  window.__GDDSectionMastheads=true;
  const pages=[
    ['chuc-sac','HỒ SƠ CHỨC SẮC','Mỗi chân dung, mỗi trang tiểu sử là một dấu tích về công nghiệp của chư vị tiền nhân.'],
    ['video-dao-su','ÂM THANH & HÌNH BÓNG XƯA','Những thước phim còn lưu giữ giúp hậu thế hình dung cảnh hành Đạo của những năm tháng đã qua.'],
    ['ai-tin','TƯỞNG NIỆM TIỀN NHÂN','Một dòng Ai Tín, một nén tâm hương, ghi nhớ những bậc đã dành trọn đời phụng sự Đại Đạo.'],
    ['tai-lieu-so-hoa','VĂN KHỐ ĐẠO SỬ','Mỗi trang văn kiện còn giữ được là thêm một chứng tích cho công việc biên khảo mai sau.'],
    // Biên khảo đã có nguyên một thẻ xanh "KHẮC GHI ĐẠO SỬ" ở đầu, không thêm khối trùng.
    ['hinh-anh','KHO ẢNH KÝ ỨC','Mỗi tấm hình xưa là một mảnh ký ức, cần được gìn giữ nguyên trạng và ghi rõ nguồn gốc.']
  ];
  function init(){
    pages.forEach(([id,kicker,quote])=>{
      const section=document.getElementById(id);
      const head=section?.querySelector('.section-top');
      if(!head||section.querySelector(':scope > .wrap > .gdd-section-tribute'))return;
      const note=document.createElement('div');
      note.className='gdd-section-tribute';
      note.setAttribute('aria-label','Lời dẫn chuyên mục');
      const label=document.createElement('span');label.className='gdd-section-tribute-label';label.textContent=kicker;
      const text=document.createElement('p');text.className='gdd-section-tribute-quote';text.textContent=quote;
      const foot=document.createElement('span');foot.className='gdd-section-tribute-foot';
      foot.textContent='SƯU TẦM · GÌN GIỮ · ĐỐI CHIẾU';
      note.append(label,text,foot);
      head.after(note);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
