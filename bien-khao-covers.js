/* GIỮ ĐẠO GIỮA ĐỜI — ảnh bìa chuyên mục Biên khảo (03-11-2026).
   Tệp bổ sung độc lập, không thay đổi app.js, video và trình xem ảnh.
   Chỉ đọc bài đã công bố từ Supabase và hiển thị ảnh bìa / ảnh hồ sơ liên quan.
*/
(() => {
  'use strict';
  if (window.__gddArticleCoversLoaded) return;
  window.__gddArticleCoversLoaded = true;

  const style = document.createElement('style');
  style.id = 'gdd-article-cover-styles';
  style.textContent = `
    #article-list .article-row.gdd-article-with-cover {
      display:grid;grid-template-columns:minmax(0,1fr) auto;
      column-gap:16px;row-gap:15px;align-items:start;
      border-bottom:1px solid #e5e2d8;padding:23px 0 26px;
    }
    #article-list .gdd-article-cover {
      display:flex;grid-column:1 / -1;position:relative;width:100%;aspect-ratio:16/9;
      align-items:center;justify-content:center;overflow:hidden;
      padding:0;border:1px solid #e3dfd6;border-radius:4px;
      background:linear-gradient(130deg,#e0e8df,#efebe0);
      cursor:pointer;color:#60776a;
    }
    #article-list .gdd-article-cover img {
      display:block;width:100%;height:100%;object-fit:contain;
    }
    #article-list .gdd-article-cover-text {
      display:flex;flex-direction:column;align-items:center;gap:7px;
      font:600 12px/1.7 'Noto Serif',Georgia,serif;letter-spacing:.12em;
      padding:18px;text-align:center;
    }
    #article-list .gdd-article-cover-text span { font-size:35px;color:#a88c62; }
    #article-list .gdd-article-cover-text small {font:400 10px/1.5 'Be Vietnam Pro',sans-serif;letter-spacing:.02em;color:#7b8c7f;}
    #article-list .article-row.gdd-article-with-cover > div:not(.gdd-article-cover) {min-width:0;}
    #article-list .article-row.gdd-article-with-cover h3 {margin:8px 0 7px;}
    #article-list .article-row.gdd-article-with-cover p {
      display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:4;
      line-clamp:4;overflow:hidden;line-height:1.85;margin:0;
    }
    #article-list .article-row.gdd-article-with-cover > button:not(.gdd-article-cover) {
      grid-column:2;grid-row:2;align-self:center;
    }
    @media(max-width:550px){
      #article-list .article-row.gdd-article-with-cover {padding:19px 0 23px;gap:12px;}
      #article-list .gdd-article-cover {aspect-ratio:16/10;}
      #article-list .article-row.gdd-article-with-cover h3 {font-size:17px;}
      #article-list .article-row.gdd-article-with-cover p {-webkit-line-clamp:4;line-clamp:4;}
    }
  `;
  document.head.appendChild(style);

  const config = window.SITE_CONFIG || {};
  const articleList = document.getElementById('article-list');
  if (!articleList) return;
  const safeImageURL = (value) => {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  };

  let images = new Map();
  const renderCovers = () => {
    for (const row of articleList.querySelectorAll('.article-row')) {
      const openButton = row.querySelector('button[data-open-kind="posts"][data-id]');
      if (!openButton || row.querySelector('.gdd-article-cover')) continue;
      const id = openButton.getAttribute('data-id');
      const entry = images.get(id);
      // Đợi thông tin ảnh từ Supabase để tránh sinh ra ảnh bìa giả khi tải trang.
      if (!entry) continue;
      const cover = document.createElement('button');
      cover.type = 'button';
      cover.className = 'gdd-article-cover';
      cover.dataset.openKind = 'posts';
      cover.dataset.id = id;
      cover.setAttribute('aria-label', `Đọc bài ${row.querySelector('h3')?.textContent || 'biên khảo'}`);
      if (entry.url) {
        const picture = document.createElement('img');
        picture.src = entry.url;
        picture.alt = `Ảnh bìa bài biên khảo: ${row.querySelector('h3')?.textContent || ''}`;
        picture.loading = 'lazy';
        picture.addEventListener('error', () => {
          picture.remove();
          cover.appendChild(createPlaceholder());
        }, {once:true});
        cover.appendChild(picture);
      } else cover.appendChild(createPlaceholder());
      row.insertBefore(cover, row.firstChild);
      row.classList.add('gdd-article-with-cover');
    }
  };
  const createPlaceholder = () => {
    const placeholder = document.createElement('div');
    placeholder.className = 'gdd-article-cover-text';
    const mark = document.createElement('span');mark.textContent = '✦';
    const label = document.createElement('b');label.textContent = 'BIÊN KHẢO ĐẠO SỬ';
    const help = document.createElement('small');help.textContent = 'Bài chưa có ảnh bìa';
    placeholder.append(mark,label,help);
    return placeholder;
  };

  const observer = new MutationObserver(renderCovers);
  observer.observe(articleList, {childList:true});

  async function loadCovers() {
    if (!config.supabaseUrl || !config.supabasePublishableKey) return;
    const api = config.supabaseUrl.replace(/\/$/,'') + '/rest/v1/';
    const headers = {apikey:config.supabasePublishableKey,Accept:'application/json'};
    const fetchPublic = async (table, fields) => {
      const url = api + table + '?select=' + encodeURIComponent(fields) + '&published=eq.true&limit=500';
      const response = await fetch(url,{headers,credentials:'omit'});
      if (!response.ok) throw new Error('Không thể đọc ảnh bìa ' + table + ': HTTP ' + response.status);
      return response.json();
    };
    try {
      const [posts, people] = await Promise.all([
        fetchPublic('posts','id,cover_url,person_id'),
        fetchPublic('people','id,image_url')
      ]);
      const portraits = new Map(people.map(p=>[p.id,safeImageURL(p.image_url)]));
      images = new Map(posts.map(p => [p.id,{
        url:safeImageURL(p.cover_url)||portraits.get(p.person_id)||''
      }]));
      renderCovers();
    } catch(error) {
      // Nếu yêu cầu bổ sung bị chặn, giữ nguyên bài viết thay vì làm hỏng website.
      console.warn('[GIỮ ĐẠO GIỮA ĐỜI] Không tải được ảnh Biên khảo:',error);
    }
  }
  loadCovers();
  renderCovers();
})();
