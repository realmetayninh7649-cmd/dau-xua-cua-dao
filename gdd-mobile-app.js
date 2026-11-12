/* Gia cố trải nghiệm PWA; không sửa cơ chế đăng nhập, dữ liệu và bộ định tuyến hiện có. */
(() => {
  'use strict';
  const native = Boolean(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
  const standalone = native || window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const tabs = [
    ['#trang-chu', '⌂', 'Trang chủ'],
    ['#chuc-sac', '♙', 'Chức sắc'],
    ['#bien-khao', '▤', 'Biên khảo'],
    ['#hinh-anh', '▧', 'Hình ảnh'],
    ['#am-thanh-dai-dao', '♫', 'Âm thanh']
  ];

  function setupAppNavigation() {
    if (!standalone || !document.body || document.getElementById('gdd-app-tabs')) return;
    document.body.classList.add('gdd-app-standalone');
    const nav = document.createElement('nav');
    nav.id = 'gdd-app-tabs';
    nav.className = 'gdd-app-tabs';
    nav.setAttribute('aria-label', 'Điều hướng ứng dụng');
    for (const [href, symbol, label] of tabs) {
      const a = document.createElement('a');
      a.href = href;
      const icon = document.createElement('span');
      icon.className = 'gdd-app-tab-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = symbol;
      const text = document.createElement('span');
      text.textContent = label;
      a.append(icon, text);
      nav.appendChild(a);
    }
    document.body.appendChild(nav);
    function updateActive() {
      const current = location.hash || '#trang-chu';
      for (const link of nav.querySelectorAll('a')) {
        if (link.getAttribute('href') === current) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      }
    }
    updateActive();
    window.addEventListener('hashchange', updateActive);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupAppNavigation, {once:true});
  else setupAppNavigation();

  // GitHub Pages: SW phải nằm trong đúng thư mục dự án, không lấy scope của toàn github.io.
  // Capacitor native không dùng service worker để tránh xung đột localhost / WebView.
  if (!native && location.protocol === 'https:' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(new URL('./sw.js', location.href).href)
        .catch(err => console.warn('Không thể bật hỗ trợ ngoại tuyến:', err));
    }, {once:true});
  }
})();
