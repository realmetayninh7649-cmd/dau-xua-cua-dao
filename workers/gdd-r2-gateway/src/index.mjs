// GDDĐ v2.0.0-DK01.1 — Giao tiếp R2: giai đoạn kiểm tra chỉ đọc.
// Không mở tuyến đọc/ghi tệp và không cho phép truy cập ảnh nguyên mẫu.
export const VERSION = 'GDDĐ v2.0.0-DK01.1';
const PROBE_OBJECT_KEY = '__gdd_internal__/dk01_read_probe_only';

function reply(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname !== '/health') {
      return reply({ error: 'Not found' }, 404);
    }
    if (request.method !== 'GET') {
      return reply({ error: 'Method not allowed' }, 405);
    }
    if (!env?.GDD_BUCKET || typeof env.GDD_BUCKET.head !== 'function') {
      return reply({ status: 'not_ready', version: VERSION }, 503);
    }
    try {
      // HEAD đúng một khóa nội bộ cố định, không đọc hoặc liệt kê tư liệu.
      // Null = khóa không tồn tại nhưng R2 vẫn phản hồi thành công.
      await env.GDD_BUCKET.head(PROBE_OBJECT_KEY);
      return reply({ status: 'ok', version: VERSION, r2: 'reachable' }, 200);
    } catch {
      // Không công khai thông tin bucket, khóa hoặc lỗi nội bộ.
      return reply({ status: 'not_ready', version: VERSION }, 503);
    }
  },
};
