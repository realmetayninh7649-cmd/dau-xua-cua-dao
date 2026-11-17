# Bổ sung DK01.3 — Tích hợp Quản Trị Viên (17/11/2026)

**Trạng thái:** Giao diện và bộ lưu trữ đã được tích hợp để kiểm thử; không tự chuyển dữ liệu cũ.

- Biểu mẫu đăng ảnh chính (`app.js`) và album đính kèm (`index.html`) **lưu tệp nguyên mẫu vào R2 trước khi tối ưu** và lưu ảnh xem nhẹ trên Supabase như cách website đang dùng. URL hiển thị cũ không bị đổi.
- Bảng `public.gdd_r2_assets` lưu ID bản gốc, kích thước, trạng thái ảnh xem và liên kết bài viết. RLS chỉ cấp SELECT/INSERT/UPDATE cho Quản trị viên, không có DELETE hoặc quyền xem ẩn danh.
- Trong Quản Trị Viên có ô thu gọn **Kho nguyên mẫu R2 (DK01.3)** để lưu riêng ảnh, PDF, Word và xem danh sách ID tài liệu đã bảo tồn. Ô này không nằm trong menu của độc giả.
- Tệp PDF/Word mới tải bằng biểu mẫu chính hoặc album **không có URL công khai**. Bài PDF/Word chính mặc định để nháp; tài liệu album được cất riêng, chưa có trình đọc công khai. Các đường dẫn PDF/Word cũ đã công bố trên Supabase **không bị thay đổi**.
- Mã xử lý ảnh/tệp gốc trong R2 không đổi; việc công bố bản xem PDF/Word, biến ảnh xem R2 thành nguồn phân phối công khai và tự động xử lý các tệp cũ là công việc riêng sau này.
- Các sửa đổi được thử nghiệm bằng `workers/gdd-r2-gateway/test/admin-integration.test.mjs`, `admin-r2-link.test.mjs` và bài thử Chrome `tests/dk013-admin-smoke.mjs` trên kích thước desktop/iPhone.
- Nhánh sao lưu trước DK01.3: `backup/pre-dk013-admin-integration-20261117`.
- Bản thay đổi không xóa tệp Supabase, không dọn dẹp tệp R2 đã tạo và không mở public bucket.

---

# GDDĐ v2.0.0-DK01.2 — Lưu trữ tư liệu nguyên mẫu (Bước 2)

## Trạng thái vận hành (lịch sử DK01.2)
Worker `gdd-r2-gateway` phục vụ API **chỉ dành cho Quản trị viên**. Giai đoạn DK01.2 trước đây thử riêng qua trang tải R2; từ DK01.3, biểu mẫu quản trị đã có bước tự bảo tồn bản gốc. Không tự chuyển ảnh cũ, không ghi đè bài đăng hay sửa QR.

## Quy tắc bảo tồn

- Tệp gốc PDF, Word, TIFF, JPEG, PNG, HEIC... được gửi đến bucket R2 riêng tư theo từng phần 8 MiB, **không thay đổi từng byte**.
- Tệp gốc nằm dưới `originals/<id-quan-tri>/<id-tu-lieu>/original.ext`. Không có tuyến công khai trả về ảnh/tệp nguyên mẫu.
- Dung lượng thực được so với thông tin ghi nhận tại khởi tạo và `HEAD` sau khi ghép phần tải; sai lệch không được xác nhận hoàn thành. Trạng thái metadata ban đầu là `published:false`.
- Ảnh: trình duyệt của Quản trị viên tạo bản xem WebP tối đa cạnh dài 1.500 px, bản tải JPEG tối đa 3.000 px; mỗi bản tối đa 8 MiB. Không phóng lớn ảnh nguồn. Nếu ảnh không thể giải mã hoặc tối ưu, tệp gốc vẫn được giữ riêng, chưa có bản xem/tải.
- PDF/Word: **không tự nén có mất dữ liệu**, không có tuyến tải công khai. Cơ chế đọc từng trang sẽ thực hiện trong bước tích hợp sau; Word cần chuyển sang bản xem an toàn.
- Không sử dụng Cloudflare Images Transformation có thể tính phí. Mọi bản tối ưu được tạo ở trình duyệt và lưu riêng dưới `derivatives/`.

## Xác thực và giới hạn

- Mọi API tải lên/đọc metadata: cần Supabase access token từ phiên đăng nhập.
- Worker kiểm tra token thật tại `/auth/v1/user`, sau đó kiểm tra membership trong `public.admin_users` qua PostgREST với chính token đó; sử dụng RLS `SELECT user_id = auth.uid()`.
- Worker **không dùng service_role**; không lưu Supabase password, email hay secret vào GitHub.
- CORS chỉ cho phép miền GitHub Pages Web Đạo; CORS không thay thế kiểm tra token.
- Bản gốc nằm trong R2 riêng tư, không lộ endpoint GET tệp nguyên mẫu.
- Không có cơ chế xuất bản URL tài liệu công khai trong DK01.2.
- Upload đa phần tự động thử lại mỗi phần; `onSession` giúp ứng dụng lưu thông tin phiên để phục hồi nếu tải dở. Giới hạn của R2 và Cloudflare vẫn áp dụng; không có dịch vụ lưu trữ miễn phí vô hạn.

## API (chỉ Admin)

| Phương thức | Đường dẫn | Mục đích |
|---|---|---|
| GET | `/health` | kiểm tra R2, công khai trạng thái kỹ thuật |
| POST | `/v1/uploads/start` | tạo phiên lưu nguyên mẫu |
| PUT | `/v1/uploads/part` | ghi từng phần có xác thực |
| POST | `/v1/uploads/complete` | ghép và xác nhận kích thước gốc |
| PUT | `/v1/assets/{id}/preview` | bản WebP xem nhanh, chưa công khai |
| PUT | `/v1/assets/{id}/download` | bản JPEG tải chất lượng tốt, chưa công khai |
| GET | `/v1/assets/{id}` | trạng thái lưu trữ cho Quản trị viên |

Thư viện trình duyệt: `workers/gdd-r2-gateway/client/uploader.mjs`, hàm `uploadPreservedAsset(file,{supabase,onProgress,onSession})`. Mỗi lần chỉ tải nội dung của tệp được Quản trị viên chọn; chưa tự tích hợp website.

## Kiểm thử

`node --test workers/gdd-r2-gateway/test/*.test.mjs`

Kiểm tra thông tin bí mật, quyền Admin, lưu trữ PDF đúng byte, hai phiên bản ảnh riêng, không cấp quyền truy cập bản nguyên mẫu, giới hạn định dạng và CORS. GitHub Actions sẽ chỉ triển khai Worker nếu các phép thử đạt.

## Khôi phục

Nhánh sao lưu GitHub: `backup/pre-dk01-2-original-preservation-20261117`.

Worker: Cloudflare → Workers → gdd-r2-gateway → Deployments → chọn bản DK01.1 trước đó để quay lại. Không xóa các tệp gốc.

**Lưu ý:** Bước 2 chưa thực hiện sao lưu Google Drive; dự kiến DK02.
