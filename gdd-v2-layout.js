/* GIỮ ĐẠO GIỮA ĐỜI — V2: chia cột bằng DI CHUYỂN node thật, không chép HTML.
 * Giữ nguyên listener, đường dẫn sâu, QR, thống kê và bản ghi Supabase. */
(() => {
  'use strict';
  if(window.__GDDV2Layout)return;
  window.__GDDV2Layout=true;
  const $ = (s,root=document)=>root.querySelector(s);
  const byId=id=>document.getElementById(id);
  function wrapSection(node,title,detailsClass){
    if(!node||node.closest('.gdd-v2-support-item'))return null;
    const details=document.createElement('details');
    details.className='gdd-v2-support-item '+(detailsClass||'');
    const summary=document.createElement('summary');
    summary.textContent=title;
    details.append(summary,node);
    return details;
  }
  function openTargetFromHash(){
    const hash=location.hash;
    if(hash==='#gui-tu-lieu'||hash==='#chung-nhan'){
      const details=byId(hash.substring(1))?.closest('details');
      if(details)details.open=true;
    }
  }
  function install(){
    const main=$('main'),hero=byId('trang-chu');
    if(!main||!hero||byId('gdd-v2-columns'))return;
    const search=byId('gdd-v2-search');
    if(search)hero.insertAdjacentElement('afterend',search);
    const columns=document.createElement('div');
    columns.id='gdd-v2-columns';columns.className='gdd-v2-columns';
    columns.innerHTML='<div class="gdd-v2-main" id="gdd-v2-main" aria-label="Nội dung chính của kho Đạo sử"></div><aside class="gdd-v2-aside" id="gdd-v2-aside" aria-label="Lịch, âm thanh và ngày kỷ niệm"><div class="gdd-v2-side-heading"><span>TIỆN ÍCH TRA CỨU</span><h2>Lịch &amp; Âm thanh</h2><p>Tra cứu ngày lễ, ngày tưởng niệm và nghe Âm Thanh Đại Đạo.</p></div></aside>';
    (search||hero).insertAdjacentElement('afterend',columns);
    const primary=byId('gdd-v2-main'),aside=byId('gdd-v2-aside');
    const memorial=$('#trang-chu .gdd-memorial-shell');
    if(memorial){memorial.id='gdd-v2-memorial';primary.append(memorial);}
    for(const id of ['chuc-sac','video-dao-su','ai-tin','tai-lieu-so-hoa','bien-khao','hinh-anh']){
      const section=byId(id);if(section)primary.append(section);
    }
    // Đường vào cổng tra cứu luôn thấy trong thanh điều hướng chính.
    const nav=byId('main-nav'),homeLink=nav?.querySelector('a[href="#trang-chu"]');
    if(homeLink&&!nav.querySelector('a[href="#gdd-v2-search"]')){
      const searchLink=document.createElement('a');searchLink.href='#gdd-v2-search';
      searchLink.textContent='Tra cứu';homeLink.insertAdjacentElement('afterend',searchLink);
      searchLink.addEventListener('click',()=>{
        nav.classList.remove('is-open');
        byId('menu-toggle')?.setAttribute('aria-expanded','false');
      });
    }
    const audio=byId('am-thanh-dai-dao');if(audio)aside.append(audio);
    const dashboard=byId('gdd-archive-dashboard');
    let statistics=dashboard?.querySelector('.gdd-statistics')||null;
    if(dashboard){
      const heading=dashboard.querySelector('.gdd-dash-heading h2');
      const subheading=dashboard.querySelector('.gdd-dash-heading p');
      if(heading)heading.textContent='Lịch Âm – Dương';
      if(subheading)subheading.textContent='Xem lịch hôm nay, ngày qui vị và những lễ Đạo sắp đến.';
      aside.append(dashboard);
    }
    const support=document.createElement('div');
    support.id='gdd-v2-support';support.className='gdd-v2-support';
    support.innerHTML='<div class="gdd-v2-end-heading"><span>ĐỒNG HÀNH GÌN GIỮ SỬ LIỆU</span><h2>Góp tư liệu &amp; Bồi dưỡng chuyên môn</h2></div><div id="gdd-v2-support-items" class="gdd-v2-support-items"></div>';
    columns.insertAdjacentElement('afterend',support);
    const supportItems=byId('gdd-v2-support-items');
    const contribute=wrapSection(byId('gui-tu-lieu'),'Gửi tư liệu cho Ban Biên Tập','gdd-v2-support-contribute');
    const cert=wrapSection(byId('chung-nhan'),'Chứng nhận & bồi dưỡng chuyên môn','gdd-v2-support-cert');
    if(contribute)supportItems.append(contribute);
    if(cert)supportItems.append(cert);
    // Không xóa thẻ giới thiệu chứng nhận đã có: chuyển xuống khối bổ sung.
    const certHome=$('.gdd-cert-home');if(certHome){certHome.classList.add('gdd-v2-cert-home');support.append(certHome);}
    const about=byId('gioi-thieu');if(about)support.insertAdjacentElement('afterend',about);
    const statsSection=document.createElement('section');
    statsSection.id='gdd-v2-statistics';
    statsSection.className='gdd-v2-statistics';
    statsSection.innerHTML='<div class="gdd-v2-end-heading"><span>THỐNG KÊ KHO TƯ LIỆU</span><h2>Dấu xưa lưu giữ</h2></div><div class="gdd-v2-stat-inner" id="gdd-v2-stat-inner"></div>';
    if(about)about.insertAdjacentElement('afterend',statsSection);
    else support.insertAdjacentElement('afterend',statsSection);
    if(!statistics)statistics=$('.gdd-statistics');
    if(statistics)byId('gdd-v2-stat-inner').append(statistics);
    else{const band=$('.number-band');if(band)byId('gdd-v2-stat-inner').append(band);}
    // Truy cập nhanh trên điện thoại: cột phụ vẫn nằm sau phần chính, không mất tính năng.
    const quick=$('.gdd-v2-quicklinks');
    if(quick){
      quick.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{
        const details=a.hash==='#gui-tu-lieu'?byId('gui-tu-lieu')?.closest('details'):null;
        if(details)details.open=true;
      }));
    }
    document.body.classList.add('gdd-v2-ready');
    // Bộ điều hướng phiên bản cũ đã ẩn các mục trên Trang Chủ. V2 trả lại toàn bộ.
    for(const section of [hero,...primary.querySelectorAll(':scope > section')])section.hidden=false;
    const oldDirectory=byId('gdd-directory'),oldTrail=byId('gdd-route-path');
    if(oldDirectory)oldDirectory.hidden=true;
    if(oldTrail)oldTrail.hidden=true;
    document.body.classList.remove('gdd-separate-sections');
    openTargetFromHash();
    window.addEventListener('hashchange',openTargetFromHash);
    // Khi tải lại đường dẫn tới chuyên mục, không để màn hình đứng sai vị trí.
    if(['#gui-tu-lieu','#chung-nhan'].includes(location.hash))
      requestAnimationFrame(()=>byId(location.hash.slice(1))?.scrollIntoView({block:'start'}));
  }
  function arrangeQR(){
    const detail=byId('detail-content');
    if(!detail)return;
    const panel=detail.querySelector('.gdd-archive-qr');
    const visual=detail.querySelector('.detail-cover,.detail-video-preview');
    if(panel&&visual&&panel.nextElementSibling!==visual){
      visual.insertAdjacentElement('beforebegin',panel);
    }
  }
  function start(){
    install();
    arrangeQR();
    const detail=byId('detail-content');
    if(detail)new MutationObserver(arrangeQR).observe(detail,{childList:true});
    // Các tiện ích có thể được khởi tạo muộn tùy kết nối; chỉ chuyển node nếu thực sự xuất hiện.
    const late=new MutationObserver(()=>{
      const aside=byId('gdd-v2-aside');
      if(!aside)return;
      const audio=byId('am-thanh-dai-dao'),dash=byId('gdd-archive-dashboard');
      if(audio&&!aside.contains(audio))aside.append(audio);
      if(dash&&!aside.contains(dash))aside.append(dash);
      const stats=$('.gdd-statistics');
      if(stats&&byId('gdd-v2-stat-inner')&&!byId('gdd-v2-stat-inner').contains(stats))
        byId('gdd-v2-stat-inner').append(stats);
      const mem=$('#trang-chu .gdd-memorial-shell');
      if(mem&&byId('gdd-v2-main'))byId('gdd-v2-main').prepend(mem);
    });
    const main=$('main');if(main)late.observe(main,{childList:true});
    const footer=$('.footer');if(footer?.parentNode)late.observe(footer.parentNode,{childList:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
