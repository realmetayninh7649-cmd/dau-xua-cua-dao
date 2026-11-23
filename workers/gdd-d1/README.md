# Dấu Xưa Cửa Đạo – kế hoạch thay Supabase bằng Cloudflare D1

**Trạng thái: STAGING – chưa kết nối Cloudflare D1, chưa chuyển dữ liệu riêng tư, chưa bật ghi/quản trị.**

Nhánh chuẩn bị: `cloudflare-d1-migration-20261123`. Trang chính hiện vẫn đang bảo trì;
nhánh `backup-before-cloudflare-maintenance-20261123` chứa giao diện và mã gốc để khôi phục.
Không nâng Supabase lên gói trả phí; không xóa Supabase/R2, không sửa mã QR, đường dẫn ảnh, tài liệu hoặc ID.

## Những gì đã chuẩn bị

- `migrations/0001_supabase_21_tables.sql`: 21 bảng, 215 cột, khóa chính và chỉ mục từ schema Supabase thực tế.
- `source-schema-manifest.json`: tên cột/kiểu dữ liệu/khóa chính để đối soát.
- `src/worker.mjs`: API công khai **chỉ đọc** với kiểm tra `published=1`, danh sách bảng cho phép,
  truy vấn tham số hóa, CORS giới hạn và cache nhẹ.
- `/api/v1/admin/session`: chỉ trả xác thực nếu **Cloudflare Access** xác nhận đúng ứng dụng
  và địa chỉ quản trị thuộc danh sách được cấp phép. Mặc định từ chối; tất cả thao tác ghi đang bị khóa.
- `scripts/build-d1-import.mjs`: bộ chuyển đổi **ngoại tuyến** từ bản xuất đầy đủ 21 bảng sang SQL,
  chống thiếu bảng, cột lạ và trùng khóa chính.

## Những bước cần hoàn tất trước khi đổi hệ thống chính

1. Xác nhận tài khoản Cloudflare có quyền D1 và vẫn ở gói Free; không bật thanh toán tự động.
2. Tạo D1 mới **không đụng đến R2**: `npx wrangler d1 create gdd-dao-su-archive`.
3. Sao chép `wrangler.jsonc.example` thành `wrangler.jsonc`, thay UUID D1 do Cloudflare cấp.
4. Áp dụng schema lên D1 mới bằng `npx wrangler d1 migrations apply gdd-dao-su-archive --remote`.
5. Xuất đầy đủ 21 bảng qua kết nối chủ sở hữu vào vị trí **riêng tư ngoài GitHub**.
   Bao gồm dữ liệu chưa công bố, R2 metadata và bảng thống kê; không xuất `auth.users`/mật khẩu.
6. Chuyển ngoại tuyến: `node scripts/build-d1-import.mjs --input /PRIVATE/full-export.json --output /PRIVATE/d1-import.sql --confirm-private-offline`.
   Tập tin SQL có dữ liệu riêng tư, **không commit hoặc đẩy lên repository công khai**.
7. Kiểm tra số dòng từng bảng, ảnh PDF/Word/R2, mã QR, slug, quyền riêng tư;
   thử phục hồi từ sao lưu độc lập trước khi chuyển giao diện công khai.
8. Cấu hình Cloudflare Access làm đăng nhập quản trị mới; tạo danh sách người quản trị,
   đưa các API sửa/xóa/tải tệp qua quyền Access đã xác thực. R2 gateway cũ vẫn dựa vào JWT Supabase,
   phải thay quy trình xác thực và thử toàn bộ trước khi tắt kết nối Supabase.
9. Chỉ khi tất cả kiểm thử đạt mới đổi frontend sang API D1, tắt bảo trì, theo dõi Free quota.
   Giữ nguyên dự án Supabase như bản dự phòng trong thời gian kiểm chứng.

## Yêu cầu an toàn

- Tài khoản GitHub này là **public**. Không đưa khóa API, secret, email độc giả, tệp gốc,
  danh sách nộp bài chưa công bố, token Access, bản xuất đầy đủ hoặc dữ liệu quản trị vào nhánh.
- Không triển khai Worker mới nếu chưa có Cloudflare Access hoặc chưa xác minh quyền.
- Không cho phép GET thông tin bảng riêng tư qua public API; không để POST/PUT/PATCH/DELETE hoạt động
  trong phiên bản staging này.
- Ảnh gốc vẫn ở Cloudflare R2, không đẩy hình ảnh/âm thanh vào D1 (giới hạn 500 MB/database trên Free).
- Khi còn bảo trì, GitHub Pages chỉ phục vụ trang HTML tĩnh với HTTP 200; không tự giả HTTP 503.
- Supabase Free có thể hạn chế Egress; tuyệt đối không dùng Service Role key trong frontend.

## API thử nghiệm khi D1 đã được cấu hình

- `GET /health`
- `GET /api/v1/public/people?limit=30&offset=0`
- `GET /api/v1/public/posts/{slug}`
- `GET /api/v1/public/albums?owner_kind=people&owner_id={UUID}`
- `GET /api/v1/admin/session` (mặc định 403, chỉ Access xác thực trả 200)

**Chưa có thao tác tạo D1, nhập dữ liệu hay triển khai lên tài khoản Cloudflare trong giai đoạn này.**
