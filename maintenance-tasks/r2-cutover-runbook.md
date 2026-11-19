# Dấu Xưa Cửa Đạo — R2 WebP: hướng dẫn kiểm tra và phục hồi an toàn

**Trạng thái tại 19/11/2026:** Website đang bảo trì. Không mở cho công chúng chỉ vì các bài thử thành công.

## Đã hoàn tất

- Đã sao lưu 3 PDF nguyên từng byte lên R2 riêng tư và kiểm tra SHA-256. Bản Supabase giữ nguyên.
- 700 ảnh có tham chiếu trong nội dung đã công bố: 700 bản gốc (1.378.424.460 byte) và 700 WebP nhẹ trên R2 riêng tư. Kiểm kê đủ số lượng.
- **131 ảnh chưa công bố hoặc chưa có tham chiếu**: đã được sao lưu nguyên bản và đọc lại SHA-256, tổng 155.381.554 byte, tại R2 private `legacy-unlisted-private-v1/`; không tạo WebP công khai, không đổi URL. Công việc hoàn tất đủ 8/8 nhóm và kiểm kê cuối đạt: https://github.com/realmetayninh7649-cmd/dau-xua-cua-dao/actions/runs/44435201562
- Toàn bộ **831 ảnh gốc (1.533.806.014 byte)** đã có bản dự phòng R2, không xóa bất kỳ ảnh nào trong Supabase. 
- 50/50 mẫu đối chiếu mã băm, hướng ảnh, kích thước và RGB; sai khác RGB chuẩn hóa trung bình 0,0074, lớn nhất 0,0113. Đây không thay thế duyệt chữ nhỏ và dấu niêm trên ảnh tư liệu.
- Giao diện iPhone giả lập 390 × 844 px thử ảnh WebP thật, dòng nguồn/mã ảnh và trình xem toàn màn hình thành công.
- Bộ kiểm thử website phục hồi trong GitHub Actions **không triển khai** đã chạy thành công với bản `index.html` từ nhánh `backup/pre-maintenance-2026-11-19`.
- Worker chạy tại localhost với R2 giả lập được nạp bản WebP thật đã xác minh S3: HTTP 200, Content-Type image/webp, CORS và nội dung 348.948 byte chính xác; ngăn truy cập bản gốc và ảnh không công bố.
- Cloudflare Worker production hiện tại vẫn báo R2 binding hoạt động, đường thử công khai bị chặn (403/404).

## Cấu trúc nhánh thử nghiệm

- Worker: `workers/gdd-r2-gateway/src/index.mjs` chỉ định 700 đường dẫn công khai được phép ở `legacy-published-paths.mjs`.
- Tài nguyên WebP: `legacy-private-image-previews-v1/<đường-dẫn-Supabase>.webp` (R2 private, chưa phát công khai).
- Bản gốc: `legacy-private-images-v1/` (tuyệt đối không thêm tuyến GET public).
- `LEGACY_PREVIEW_ENABLED=false` trong Worker, và `ENABLED=false` trong `gdd-legacy-r2-images.js`; cả hai giữ nguyên khi còn bảo trì.
- Mã nguồn website `app.js` và `dao-su-albums.js` chỉ chuẩn bị thay URL ảnh *hiển thị*. Không UPDATE bảng dữ liệu Supabase, không thay mã QR, không sửa chú thích ảnh.
- `index.html` production vẫn là trang bảo trì. Khi mở lại phải khôi phục từ bản backup và đặt thẻ `<script defer src="gdd-legacy-r2-images.js"></script>` trước `app.js`; chỉ gắn vào lúc phát hành.

## Điều kiện bắt buộc trước khi mở lại

1. Rà lại các lỗi kiểm thử tổng thể cũ bằng bản website phục hồi trên localhost; không đánh đồng lỗi do trang bảo trì với lỗi từ ứng dụng.
2. Trong giai đoạn phát hành, **triển khai Worker lên Cloudflare trước**, vẫn giới hạn chính xác 700 ảnh đã công bố; kiểm tra HTTP 200 cho WebP mẫu, CORS, HTTP 404/403 cho bản gốc, bản nháp, đường dẫn bất hợp lệ, cùng giám sát số request.
3. Chỉ sau bước 2 mới bật mapping trình duyệt và khôi phục trang chủ; nếu mapping bật trước Worker, ảnh sẽ bị 404. Giữ `maintenance-mode.flag` cho tới khi tất cả bài thử hoàn tất.
4. Duyệt thủ công vài chân dung, ảnh nhiều chữ/pháp văn, tranh ảnh có watermark trên Safari iPhone thật; đảm bảo không thay đổi khuôn mặt, con dấu, thư pháp và không bỏ tính năng QR.
5. Kiểm tra sau khi phục hồi số yêu cầu Supabase Storage giảm thực tế và mức sử dụng R2/Workers chưa vượt Free.
6. 131 ảnh đã bảo tồn xong, trong đó có 2 ảnh gắn bài nháp và 129 ảnh không có tham chiếu. **Giữ bí mật danh sách**, không gộp với 700 ảnh được phép phát hành, không tạo tuyến xem chúng trên Worker. Bản danh mục GitHub chỉ có ciphertext OpenPGP; khóa giải mã nằm riêng trong kho R2 không có tuyến GET công khai.
7. **Chỉ gỡ thông báo bảo trì khi người chủ website xác nhận chấp thuận mở lại**.

## Hoàn nguyên nhanh nếu ảnh bị lỗi

- Đầu tiên tắt `ENABLED` ở `gdd-legacy-r2-images.js` để trình duyệt dùng URL Supabase cũ, nhưng lưu ý Supabase có thể đang vượt quota và trả 402.
- Nếu tuyến R2 có lỗi, tắt `LEGACY_PREVIEW_ENABLED` ở Worker và triển khai lại. Giữ nguyên bản gốc trên R2/Supabase.
- Nếu nguồn dữ liệu cũng trả lỗi 402, tiếp tục bảo trì; không tuyên bố đã khôi phục. Không xóa bất cứ tệp nào để cố giảm hạn mức quá khứ.
- Không chuyển file PDF nguyên mẫu hoặc những ảnh chưa công bố ra URL R2 public.

## Phí và quyền truy cập

- Không nâng cấp Supabase Pro, không mua R2 thêm.
- R2 Free vẫn có hạn mức dung lượng và yêu cầu/operations. Đã vượt Supabase quota trong chu kỳ cũ thì giảm lưu lượng không tự xóa số dùng cũ.
- R2 S3 API token có TTL, cần thu hồi khóa cũ từng xuất hiện trong ảnh và cấp lại khóa triển khai khi hết hạn. Không ghi API token vào mã nguồn/GitHub Logs.

## Tham khảo phép thử

- [Kiểm kê R2 700/700 bản gốc và WebP](https://github.com/realmetayninh7649-cmd/dau-xua-cua-dao/actions/runs/44423950718)
- [Kiểm kê R2 131/131 ảnh riêng tư, giải mã danh mục bảo mật](https://github.com/realmetayninh7649-cmd/dau-xua-cua-dao/actions/runs/44435201562)
- [Website phục hồi hoàn chỉnh nhưng chỉ trên GitHub CI](https://github.com/realmetayninh7649-cmd/dau-xua-cua-dao/actions/runs/44430290946)
- [HTTP 200 bản WebP thực qua Worker localhost](https://github.com/realmetayninh7649-cmd/dau-xua-cua-dao/actions/runs/44430468131)
- [Kiểm tra ảnh và khung xem iPhone giả lập](https://github.com/realmetayninh7649-cmd/dau-xua-cua-dao/actions/runs/44428344497)
- [Kiểm tra Worker production không lộ dữ liệu](https://github.com/realmetayninh7649-cmd/dau-xua-cua-dao/actions/runs/44428921731)
