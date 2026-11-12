# Báo cáo rà soát website – Giai đoạn 3 (13/11/2026)

**Website:** GIỮ ĐẠO GIỮA ĐỜI – DẤU XƯA CỬA ĐẠO

**Phạm vi thay đổi:** Thẻ QR Chức sắc theo mẫu tham khảo; không thay đổi cơ sở dữ liệu Supabase, mã định danh, đường dẫn bài viết, nội dung bài hoặc các chức năng quản trị.

## 1. Thẻ QR Chức sắc

- QR hiển thị dưới tên và phẩm vị, trước chơn dung (chỉ mục Chức sắc).
- Thẻ vuông gọn theo màu gốc của website: **ĐẠI ĐẠO TAM KỲ PHỔ ĐỘ / KHO TƯ LIỆU ĐẠO SỬ / QR / Danh xưng Chức sắc / Mã hồ sơ**.
- Giữ hai thao tác Tải QR PNG và Sao chép liên kết; PNG được xuất thành thẻ vuông chứa đầy đủ thông tin.
- Giữ cảnh báo bản nháp, không tự sửa mã định danh đã cấp.
- Dùng bản thư viện QR đặt trong `vendor/qrcode.min.js` có giấy phép nguồn mở, thay vì phụ thuộc CDN.
- QR duy trì mức sửa lỗi M; đã thử giải mã *mẫu QR tương đương* bằng OpenCV ở kích thước 160px với chiều dài URL đến khoảng 143 ký tự; các mẫu thử đọc được. **Đây chưa phải kiểm thử camera iPhone thực tế.**

## 2. Rà soát tĩnh

| Hạng mục | Kết quả |
| --- | --- |
| 25 tệp JS, bao gồm bộ QR và lịch | Đều qua kiểm tra cú pháp |
| 13 tệp CSS | Không phát hiện mất cân bằng dấu ngoặc |
| 31 tham chiếu tài nguyên nội bộ trong `index.html` | Không tìm thấy đường dẫn tới tệp bị thiếu |
| 59 ID tĩnh trong HTML | Không có ID bị trùng |
| Quy trình nạp QR | Thư viện nội bộ được nạp trước `app.js` và `gdd-archive-qr.js` |
| Bố cục Giai đoạn 1.3 và tra cứu Giai đoạn 2 | Giữ nguyên các tệp CSS/JS hiện hành |

## 3. Kiểm tra dữ liệu Supabase (chỉ đọc, vai trò anon)

- 60 bản ghi đã công bố ở 6 chuyên mục có mã: **0 mã trống, 0 slug trống, 0 mã trùng, 0 slug trùng trong cùng chuyên mục**.
- 28 hồ sơ Chức sắc công khai: **0 thiếu tên, 0 thiếu phẩm vị, 0 thiếu cơ quan, 0 thiếu slug và 0 mã không bắt đầu bằng `CS-`**.
- Ngoài 6 chuyên mục trên: 4 bài Tưởng niệm, 2 bài Âm thanh đã công bố.
- 8 chuyên mục công khai: không phát hiện URL ảnh/tệp hoặc MP3 sai định dạng HTTPS theo điều kiện kiểm tra.
- Kho ảnh đính kèm: không phát hiện đường dẫn không dùng HTTPS.

**Kiểm tra bố cục mô phỏng:** Với Chromium và thẻ QR mô phỏng theo CSS Giai đoạn 3, đã kiểm tra chiều rộng 320px, 390px, 768px và 1440px; không tràn ngang. Mẫu QR có URL dài tương đương hồ sơ đang công khai được giải mã thành công ở kích thước hiển thị 160px và kích thước PNG xuất 1400px. Đây là kiểm tra thành phần/mẫu QR, **không phải kiểm thử tích hợp trên GitHub Pages hoặc Safari thực tế**.

## 4. Giới hạn kiểm thử

Các kiểm tra trên **không chứng minh toàn bộ website không còn lỗi**. Chưa thực hiện kiểm thử đầu-cuối trên Safari iPhone thật, Android thật và tài khoản quản trị có quyền đăng/sửa bài. Chưa xác nhận từng URL ảnh/MP3/video/PDF có thể tải thực tế hoặc nội dung của mọi bài viết. Cần kiểm tra thực tế: mở/đóng hồ sơ, quét QR bằng camera, tải PNG, sao chép liên kết, tìm kiếm và bộ lọc, phát radio, chuyển tháng lịch, tải ảnh, quản trị và phiên bản chân trang.

**Nguyên tắc:** Không thay đổi dữ liệu gốc để tạo bài thử.
