/* Giữ Đạo Giữa Đời — Giai đoạn 1: CHỈ thay đổi cách trình bày Trang Chủ.
   Không sửa các bản ghi, ảnh, QR, biểu mẫu hay đường dẫn chuyên mục. */
(() => {
  'use strict';
  if (window.__GDDPhase1Layout) return;
  window.__GDDPhase1Layout = true;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const id = name => document.getElementById(name);
  const homeRoute = () => {
    const raw = location.hash.replace(/^#/, '').split('/')[0];
    return !raw || [
      'trang-chu', 'gioi-thieu', 'am-thanh-dai-dao',
      'gdd-archive-dashboard', 'gdd-cal-qui-vi-list'
    ].includes(raw);
  };
  let layout, support, statistics, switcher;
  const mobileLayout = window.matchMedia('(max-width: 900px)');
  let currentView = 'main';

  function setView(view, scrollToContent = false) {
    currentView = view === 'aside' ? 'aside' : 'main';
    if (!layout || !switcher) return;
    const compact = mobileLayout.matches;
    const main = id('gdd-p1-main'), aside = id('gdd-p1-aside');
    main.hidden = compact && currentView !== 'main';
    aside.hidden = compact && currentView !== 'aside';
    layout.dataset.view = currentView;
    for (const button of switcher.querySelectorAll('[data-p1-view]')) {
      const active = button.dataset.p1View === currentView;
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    }
    if (scrollToContent) requestAnimationFrame(() => {
      switcher.scrollIntoView({behavior: 'smooth', block: 'start'});
    });
  }

  function createPanel(name, label, node, description) {
    if (!node) return null;
    let panel = id(name);
    if (!panel) {
      panel = document.createElement('details');
      panel.id = name;
      panel.className = 'gdd-p1-panel';
      panel.open = false; // Gọn trang chủ, chỉ mở khi khách chọn hoặc theo đường dẫn.
      const heading = document.createElement('summary');
      const title = document.createElement('span');
      title.className = 'gdd-p1-utility-name';
      title.textContent = label;
      const subtitle = document.createElement('small');
      subtitle.className = 'gdd-p1-utility-desc';
      subtitle.textContent = description || '';
      heading.append(title, subtitle);
      panel.append(heading);
      id('gdd-p1-aside').append(panel);
    }
    if (node.parentElement !== panel) panel.append(node);
    return panel;
  }

  function putModules() {
    if (!layout) return;
    const mainColumn = id('gdd-p1-main');
    const memorial = $('#trang-chu .gdd-memorial-shell');
    if (memorial && memorial.parentElement !== mainColumn) mainColumn.prepend(memorial);
    const directory = id('gdd-directory');
    // Đưa đúng khối giới thiệu Ai Tín hiện có xuống ngay sau Tưởng Niệm Chức Sắc.
    // Không nhân bản dữ liệu và không thay đổi trang chuyên mục Ai Tín.
    const aiTinPreview = directory?.querySelector('[data-preview-section="ai-tin"]')
      || mainColumn.querySelector('[data-preview-section="ai-tin"]');
    if (memorial && aiTinPreview && aiTinPreview.previousElementSibling !== memorial) {
      memorial.insertAdjacentElement('afterend', aiTinPreview);
    }
    if (directory && directory.parentElement !== mainColumn) mainColumn.append(directory);

    const audio = id('am-thanh-dai-dao');
    createPanel('gdd-p1-audio-panel', 'Âm Thanh Đại Đạo', audio, 'Radio Đạo Sử · Thánh âm');
    const dashboard = id('gdd-archive-dashboard');
    if (dashboard) {
      const title = $('.gdd-dash-heading h2', dashboard);
      const introduction = $('.gdd-dash-heading > p', dashboard);
      if (title) title.textContent = 'Lịch Âm – Dương';
      if (introduction) introduction.textContent = 'Tra cứu ngày tháng, lễ Đạo và những ngày kỷ niệm qui vị.';
      createPanel('gdd-p1-calendar-panel', 'Lịch Âm – Dương', dashboard, 'Đổi ngày · Lễ Đạo · Kỷ niệm qui vị');
    }
    const statCard = $('.gdd-statistics');
    const target = id('gdd-p1-stat-content');
    if (statCard && target && statCard.parentElement !== target) target.append(statCard);
    syncRoute();
  }

  function syncRoute() {
    if (!layout) return;
    const isHome = homeRoute();
    layout.hidden = !isHome;
    if (switcher) switcher.hidden = !isHome;
    support.hidden = !isHome;
    statistics.hidden = !isHome;

    const section = location.hash.slice(1).split('/')[0];
    const panelId = section === 'am-thanh-dai-dao'
      ? 'gdd-p1-audio-panel'
      : (section === 'gdd-archive-dashboard' || section === 'gdd-cal-qui-vi-list')
        ? 'gdd-p1-calendar-panel' : null;
    if (mobileLayout.matches) {
      if (panelId) setView('aside');
      else if (!section || section === 'trang-chu') setView('main');
    } else setView('main');
    if (panelId) {
      const panel = id(panelId);
      if (panel) panel.open = true;
      requestAnimationFrame(() => id(section)?.scrollIntoView({block: 'start'}));
    }
  }

  function init() {
    const hero = id('trang-chu');
    const about = id('gioi-thieu');
    if (!hero || !about || id('gdd-p1-layout')) return;

    // Khung Ai Tín được chuyển lên Trang Chủ; các mục và chức năng khác giữ nguyên.
    const aiTinStyle = document.createElement('style');
    aiTinStyle.id = 'gdd-p1-ai-tin-placement-style';
    aiTinStyle.textContent = `
      #gdd-p1-main > [data-preview-section="ai-tin"] {
        min-width:0; max-width:100%; border:1px solid var(--p1-line,#ded9ce);
        border-radius:12px; background:var(--p1-cream,#f7f5ef);
        padding:24px 18px;
      }
      @media(max-width:560px) {
        #gdd-p1-main > [data-preview-section="ai-tin"] {padding:20px 13px;}
      }
    `;
    document.head.append(aiTinStyle);

    layout = document.createElement('div');
    layout.id = 'gdd-p1-layout';
    layout.className = 'gdd-p1-layout';
    layout.innerHTML = '<div id="gdd-p1-main" class="gdd-p1-main" aria-label="Tư liệu Đạo sử mới cập nhật"></div>' +
      '<aside id="gdd-p1-aside" class="gdd-p1-aside" aria-label="Âm Thanh Đại Đạo và Lịch Âm – Dương">' +
      '<div class="gdd-p1-side-intro"><span>KHO TƯ LIỆU ĐẠO SỬ</span><h2>TIỆN ÍCH ĐẠO SỬ</h2>' +
      '<p>Tra cứu lịch, thánh âm và các nghi lễ.</p></div></aside>';

    // Mục tra cứu gói trong một khung đóng/mở để tiết kiệm chiều cao cột phụ.
    const nav = document.createElement('nav');
    nav.id = 'gdd-p1-sidebar-navigation';
    nav.className = 'gdd-p1-sidebar-navigation';
    nav.setAttribute('aria-label', 'Chuyên mục tra cứu Đạo sử');
    const navDetails = document.createElement('details');
    navDetails.className = 'gdd-p1-sidebar-details';
    const navSummary = document.createElement('summary');
    navSummary.className = 'gdd-p1-sidebar-summary';
    const navTitle = document.createElement('span');
    navTitle.className = 'gdd-p1-utility-name';
    navTitle.textContent = 'CHUYÊN MỤC TRA CỨU';
    const navDesc = document.createElement('small');
    navDesc.className = 'gdd-p1-utility-desc';
    navDesc.textContent = 'Hồ sơ · Biên khảo · Hình ảnh · Số hóa';
    navSummary.append(navTitle, navDesc);
    const navLinks = document.createElement('div');
    navLinks.className = 'gdd-p1-sidebar-links';
    for (const [route, title] of [
      ['chuc-sac', 'Hồ sơ Chức sắc'],
      ['video-dao-su', 'Video Đạo Sử'],
      ['ai-tin', 'Ai Tín'],
      ['tai-lieu-so-hoa', 'Tài liệu số hóa'],
      ['bien-khao', 'Biên khảo'],
      ['hinh-anh', 'Hình ảnh']
    ]) {
      const link = document.createElement('a');
      link.href = '#' + route;
      link.textContent = title;
      const arrow = document.createElement('span');
      arrow.className = 'gdd-p1-link-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '›';
      link.append(arrow);
      navLinks.append(link);
    }
    navDetails.append(navSummary, navLinks);
    nav.append(navDetails);
    layout.querySelector('#gdd-p1-aside').append(nav);
    switcher = document.createElement('div');
    switcher.id = 'gdd-p1-switch';
    switcher.className = 'gdd-p1-switch';
    switcher.setAttribute('role', 'tablist');
    switcher.setAttribute('aria-label', 'Chọn khu vực Trang Chủ');
    switcher.innerHTML = '<button type="button" role="tab" data-p1-view="main" aria-controls="gdd-p1-main" aria-selected="true"><span>01</span> NỘI DUNG CHÍNH</button>' +
      '<button type="button" role="tab" data-p1-view="aside" aria-controls="gdd-p1-aside" aria-selected="false"><span>02</span> CỘT PHỤ · TIỆN ÍCH</button>';
    hero.insertAdjacentElement('afterend', switcher);
    switcher.insertAdjacentElement('afterend', layout);
    switcher.addEventListener('click', event => {
      const button = event.target.closest('[data-p1-view]');
      if (button) setView(button.dataset.p1View, true);
    });
    switcher.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const next = currentView === 'main' ? 'aside' : 'main';
      setView(next);
      switcher.querySelector('[data-p1-view="'+next+'"]').focus();
    });

    support = document.createElement('div');
    support.id = 'gdd-p1-support';
    support.className = 'gdd-p1-support';
    support.innerHTML = '<div class="gdd-p1-section-inner">' +
      '<p class="gdd-p1-kicker">ĐỒNG HÀNH GÌN GIỮ ĐẠO SỬ</p>' +
      '<h2>Góp tư liệu &amp; Bồi dưỡng chuyên môn</h2>' +
      '<div class="gdd-p1-support-links">' +
      '<a href="#gui-tu-lieu"><strong>Gửi tư liệu cho Ban Biên Tập</strong><small>Gởi ảnh, văn kiện, tiểu sử và tư liệu xưa để đối chiếu.</small><span aria-hidden="true">↗</span></a>' +
      '<a href="chung-nhan.html"><strong>Chứng nhận &amp; bồi dưỡng</strong><small>Xem quá trình học tập và ứng dụng kỹ thuật số.</small><span aria-hidden="true">↗</span></a>' +
      '</div><div id="gdd-p1-cert-note"></div></div>';
    layout.insertAdjacentElement('afterend', support);
    // Chuyển khối giới thiệu chứng nhận đã có, không sao chép nội dung.
    const certNote = $('.gdd-cert-home');
    if (certNote) {
      const details = document.createElement('details');
      details.className = 'gdd-p1-cert-details';
      const summary = document.createElement('summary');
      summary.textContent = 'Xem giới thiệu chương trình bồi dưỡng chuyên môn';
      details.append(summary, certNote);
      id('gdd-p1-cert-note').append(details);
    }

    statistics = document.createElement('div');
    statistics.id = 'gdd-p1-statistics';
    statistics.className = 'gdd-p1-statistics';
    statistics.innerHTML = '<div class="gdd-p1-section-inner"><p class="gdd-p1-kicker">LƯU DẤU CHO MAI SAU</p>' +
      '<h2>Thống kê kho tư liệu</h2><div id="gdd-p1-stat-content"></div></div>';
    about.insertAdjacentElement('afterend', statistics);

    document.body.classList.add('gdd-p1-ready');
    putModules();
    // Có module được dựng sau DOMContentLoaded: chỉ thử gắn thêm một lần khi trang nạp xong.
    window.addEventListener('load', putModules, {once: true});
    window.addEventListener('hashchange', syncRoute);
    const breakpoint = mobileLayout;
    breakpoint.addEventListener?.('change', event => {
      setView('main');
      for (const name of ['gdd-p1-audio-panel', 'gdd-p1-calendar-panel']) {
        const panel = id(name);
        if (panel) panel.open = false;
      }
      syncRoute();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
