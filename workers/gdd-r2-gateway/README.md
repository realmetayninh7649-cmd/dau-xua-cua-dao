# GDDĐ v2.0.0-DK01.4 — Độc giả xem bản được duyệt, nguyên mẫu vẫn riêng tư

**Đã lập trình và kiểm thử trước triển khai:** Trình đọc `r2-xem.html` mở ảnh tối ưu hoặc ảnh JPEG từng trang của PDF/DOCX **chỉ sau khi Quản Trị Viên nhấn Công bố**. Không có `GET originals/`, không phát PDF/Word nguyên mẫu, không lộ khóa R2.

## Phương thức vận hành

1. Khi đăng tài liệu ở Quản Trị Viên, bản nguyên mẫu lưu riêng trong R2 như DK01.3. PDF/Word chính vẫn là bản nháp.
2. Trong **Kho nguyên mẫu R2 (DK01.4)**, tại đúng tệp PDF/DOCX đã lưu, nhấn **Tạo bản đọc** rồi chọn lại cùng tệp ở iPhone. Bộ xử lý chạy trên điện thoại, lưu ảnh JPEG theo trang vào R2; **chưa công bố**.
3. Rà soát và nhấn **Công bố bản xem**. Có thể chọn thêm **Đồng thời công bố bài Tài liệu số hóa** hoặc **Gắn đường dẫn bản xem vào bộ ảnh**. Những lựa chọn này mặc định bỏ chọn.
4. **Ẩn bản xem** sẽ chặn truy cập qua Worker ngay ở lần yêu cầu mới (không xóa ảnh/tệp nguyên mẫu). Những bản đã lưu trên thiết bị của người xem không thể thu hồi.
5. Ảnh đã lưu R2 có thể được công bố riêng. Nút **tải JPEG tối ưu** mặc định tắt, chỉ hiện khi Quản Trị Viên cho phép. Ảnh nguyên mẫu không thể tải qua Worker.

## Định dạng và giới hạn

- **PDF:** Trình duyệt Quản Trị Viên dùng PDF.js phiên bản 4.10.38 để kết xuất các trang sang JPEG có giới hạn dung lượng, giữ dáng trang giấy. Chỉ tối đa **120 trang và 45 MB** mỗi lần tạo bản xem trên iPhone. Tài liệu lớn cần chia tập hoặc xử lý riêng.
- **DOCX:** Mammoth 1.9.0 **trích xuất chữ** rồi vẽ bản đọc từng trang. *Không giữ được kiểu chữ, ảnh, bảng, khoảng cách hoặc bố cục Word*. Bản đọc này chỉ để tham khảo; bản gốc lưu riêng không đổi.
- **DOC cũ:** Chưa chuyển được nguyên vẹn trong trình duyệt; cần chuẩn bị thêm một bản PDF để độc giả đọc. Không giả vờ chuyển đổi tệp .doc.
- **Ảnh JPEG/PNG/WebP:** Bản xem tối ưu là ảnh riêng trong R2, bản tải chỉ là JPEG tối ưu khi được phép.
- Thư viện PDF/Word được tải phiên bản ghim từ CDN trong phiên Quản Trị Viên khi cần; không truyền nội dung tài liệu tới CDN. Nếu mạng chặn thư viện, chức năng tạo bản đọc không hoạt động, tệp nguyên mẫu vẫn an toàn.
- Không có kỹ thuật ngăn hoàn toàn chụp màn hình hoặc lưu ảnh đang hiển thị; đây là kiểm soát *đường dẫn và bản nguyên mẫu*, không phải bảo vệ chống sao chép tuyệt đối.

## API Worker

- `GET /v1/public/{assetId}` — metadata tối thiểu của bản đã công bố.
- `GET /v1/public/{assetId}/page/{n}` — ảnh JPEG trang PDF/DOCX đã công bố.
- `GET /v1/public/{assetId}/preview` — ảnh xem nhẹ đã công bố.
- `GET /v1/public/{assetId}/download` — chỉ bản JPEG tối ưu khi được admin bật.
- `PUT /v1/assets/{assetId}/page/{n}` — chỉ Quản trị viên có token hợp lệ; ghi ảnh JPEG theo trang, không ghi đè nguyên mẫu.
- `POST /v1/assets/{assetId}/publication` — chỉ Quản trị viên có token hợp lệ; kiểm tra đủ trang rồi công bố hoặc ẩn.

Nhánh sao lưu: `backup/pre-dk014-private-viewer-20261117`. Bản mới không tự xóa hoặc tái xử lý bất kỳ ảnh, bài viết, tài liệu cũ nào.

---

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
