/* DẤU XƯA CỬA ĐẠO — bản sao tư liệu công khai, chỉ đọc khi Supabase bị hạn chế.
 * Không cấp quyền quản trị, không lưu dữ liệu, không can thiệp RLS.
 * Cơ sở dữ liệu gốc và bản gốc ảnh/tài liệu được giữ nguyên. */
(() => {
  'use strict';
  if (window.GDDPublicReadOnly) return;
  const keys = ['people','posts','media','videos','obituaries','documents',
    'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials','gallery','placements'];
  let pending = null;
  function load() {
    if (!pending) {
      pending = fetch('./public-fallback.json?v=20261123-recovery-01', {
        cache: 'no-store', credentials: 'omit'
      }).then(response => {
        if (!response.ok) throw Error('Không tải được bản công khai (' + response.status + ')');
        return response.json();
      }).then(data => {
        if (data?.source !== 'public-published-read-only-backup' ||
            !keys.every(k => Array.isArray(data[k])) ||
            !['people','posts','media','videos','obituaries','documents',
              'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials']
              .every(k => data[k].every(row => row.published === true))) {
          throw Error('Bản dự phòng không hợp lệ');
        }
        return data;
      }).catch(err => {
        pending = null; // cho phép thử lại khi mạng hồi phục
        throw err;
      });
    }
    return pending;
  }
  async function rows(kind) {
    const data = await load();
    return kind === 'archive_gallery_images' ? data.gallery : (data[kind] || []);
  }
  async function find(kind, field, value) {
    return (await rows(kind)).find(row => row?.[field] === value) || null;
  }
  async function album(kind, ownerId) {
    const list = await rows('gallery');
    return list.filter(row => row.owner_kind === kind && row.owner_id === ownerId)
      .sort((a,b) => (a.sort_order ?? 0)-(b.sort_order ?? 0)
        || String(a.created_at || '').localeCompare(String(b.created_at || '')))
      .slice(0,200);
  }
  window.GDDPublicReadOnly = Object.freeze({load,rows,find,album});
})();
