# Giữ Đạo Giữa Đời — ứng dụng iOS và Android

Đây là bản **khởi tạo kỹ thuật**, chưa phải ứng dụng đã được build, kiểm thử thiết bị hay phát hành. Website GitHub Pages tiếp tục hoạt động trên nhánh chính như cũ. Để giảm chi phí bảo trì, bản ứng dụng đóng gói các tài nguyên web hiện có vào Capacitor, dùng lại Supabase để đồng bộ dữ liệu.

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
