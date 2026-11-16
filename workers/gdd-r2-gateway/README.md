# GDDĐ v2.0.0-DK01.2 — Lưu trữ tư liệu nguyên mẫu (Bước 2)

## Trạng thái vận hành
Worker `gdd-r2-gateway` phục vụ API **chỉ dành cho Quản trị viên**. Giao diện đăng bài hiện tại vẫn dùng Supabase; không tự chuyển ảnh cũ, không ghi đè bài đăng hay sửa QR. Giai đoạn tiếp theo mới ghép API này vào biểu mẫu HÌNH ẢNH, kiểm thử bằng vài tư liệu mẫu trước khi bật mặc định.

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
