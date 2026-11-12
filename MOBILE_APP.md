# Giữ Đạo Giữa Đời — ứng dụng iOS và Android

Đây là bản **khởi tạo kỹ thuật**, chưa phải ứng dụng đã được build, kiểm thử thiết bị hay phát hành. Website GitHub Pages tiếp tục hoạt động trên nhánh chính như cũ. Để giảm chi phí bảo trì, bản ứng dụng đóng gói các tài nguyên web hiện có vào Capacitor, dùng lại Supabase để đồng bộ dữ liệu.

## Dùng iPhone để kiểm thử — không cần máy Mac

### Bản web app (không qua App Store)

1. Sau khi PR đã được **kiểm thử và hợp nhất vào nhánh main**, đợi GitHub Pages xuất bản phiên bản mới.
2. Mở **địa chỉ website đang hoạt động** trong Safari trên iPhone (không dùng trang mã nguồn github.com).
3. Bấm **Chia sẻ → Thêm vào Màn hình chính → Mở dưới dạng ứng dụng web → Thêm**.
4. Chạy biểu tượng ứng dụng và thử 5 tab: Trang chủ, Chức sắc, Biên khảo, Hình ảnh, Âm thanh. Các mục khác vẫn ở menu website.
5. Thử tìm Chức sắc, mở ảnh, phát âm thanh, mở văn kiện và kiểm tra nội dung hiển thị từ Supabase.
6. Tắt Wi-Fi và dữ liệu di động, mở lại trang: nếu Service Worker đã cài thành công thì trang sẽ báo ngoại tuyến; **chưa hỗ trợ lưu toàn bộ bài viết để đọc ngoại tuyến**.
7. Mở lại mạng và thử nút **Thử kết nối lại**. Không dùng dữ liệu mẫu thay cho nội dung thật khi không có mạng.

Chế độ thêm vào Màn hình chính trên iOS 26 **không** tự động biến website thành ứng dụng App Store.

### Kiểm tra mã nguồn và trạng thái GitHub từ iPhone

1. Mở mục Pull Requests của repository, tìm PR #24.
2. Vào **Checks** để xem trạng thái job **Kiểm tra web app (không cần máy tính cá nhân)**.
3. Nếu báo đỏ, **không merge**; xem log để sửa lỗi. Nếu xanh, đây mới là kiểm tra cấu trúc/cú pháp, không thay thế kiểm thử iPhone.
4. Sau khi workflow được hợp nhất vào nhánh mặc định, có thể chạy **Actions → Kiểm tra ứng dụng iPhone / Android → Run workflow** để yêu cầu GitHub build bản cho **iOS Simulator** bằng máy Mac đám mây. File simulator không cài trực tiếp lên iPhone.

### Bản cài thử trên iPhone bằng TestFlight (giai đoạn sau)

Cần tài khoản Apple Developer đang hoạt động, App Store Connect, bundle ID, chứng chỉ ký và provisioning profile đúng. Máy Mac cục bộ không bắt buộc nếu dùng dịch vụ build từ xa trên macOS, nhưng vẫn phải cấu hình ký/phát hành và gửi bản build cho Apple. Không dán mật khẩu Apple ID, mã xác minh, chứng chỉ hoặc khóa bí mật vào GitHub công khai hay nội dung chat.

## Bắt đầu

1. Cài Node.js 22+, npm; cài Android Studio nếu build Android; cần máy Mac và Xcode nếu build iOS (hoặc dịch vụ build iOS trên đám mây).
2. `npm install` — tạo `package-lock.json`; kiểm tra và commit lockfile trước khi dùng trong CI/phát hành.
3. `npm run mobile:prepare` — tạo thư mục `www` chứa bản sao của giao diện web hiện tại.
4. `npm run mobile:add:android` hoặc `npm run mobile:add:ios` (chỉ chạy một lần cho từng nền tảng).
5. Sau khi website thay đổi, chạy `npm run mobile:sync` để cập nhật bản ứng dụng; mở IDE bằng `npm run mobile:open:android` hoặc `npm run mobile:open:ios`.

## Những việc cần hoàn tất trước khi phát hành

- Chốt **App ID** `vn.dauxuacuadao.giudaogiuadoi` trước khi tạo tài khoản và chứng chỉ phát hành; đây mới là mã tạm được đề xuất.
- Thiết kế icon 1024×1024 và splash screen theo bộ nhận diện; chuẩn bị ảnh màn hình cửa hàng.
- Thiết kế điều hướng, thanh menu dưới, trạng thái tải trang/mất mạng, thao tác quay lại Android và vùng safe area iPhone; tránh cảm giác chỉ bọc một website trong WebView.
- Kiểm thử Supabase Auth, session, RLS, upload, tải tài liệu, âm thanh, chia sẻ liên kết, video nhúng và tham quan 3D trong WKWebView/Android WebView.
- Kiểm tra URL chuyển hướng trong Supabase cho môi trường app; tuyệt đối không đưa service_role/secret key vào app. Chỉ sử dụng publishable key với RLS đúng.
- Thêm tính năng có giá trị riêng cho app: lưu bài yêu thích, đọc offline bài được chọn, thông báo lịch Đạo/tưởng niệm (có đồng ý), tìm kiếm tối ưu cho điện thoại.
- Rà soát quyền xuất bản tư liệu, chính sách riêng tư và nội dung trước khi gửi duyệt cửa hàng; Apple có yêu cầu về ứng dụng vượt hơn website đóng gói đơn giản.
- Kiểm thử và phát hành riêng trên App Store/Google Play. GitHub Pages không tự phát hành bản cập nhật ứng dụng điện thoại.

## Phạm vi

Chưa thay đổi `index.html`, `app.js`, database hay trạng thái sản xuất. Tất cả nằm trên nhánh thử nghiệm riêng và cần kiểm thử trên thiết bị trước khi đưa vào nhánh chính.
