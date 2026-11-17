# DK01.7 — Đăng bộ ảnh nhanh, giữ nguyên mẫu (17/11/2026)

## Tình trạng trước cải tiến

Video người quản trị quay trên Safari iPhone cho thấy mỗi ảnh của bộ 78 tấm đang đi tuần tự qua nhiều giai đoạn: lưu nguyên mẫu R2 (kho riêng), tạo thêm bản preview 1.500px trên R2, tạo thêm bản tải JPEG 3.000px trên R2, rồi tối ưu ảnh trình bày trên Supabase và ghi hàng album.

Hai biến thể R2 được tạo **dù ảnh album vốn đã được xem bằng tệp tối ưu Supabase**. Việc này giải mã và mã hóa ảnh lặp lại, thêm lượt tải mạng không cần thiết, nhất là với album lớn.

## Luồng DK01.7

**Ảnh album và ảnh chính của bài:**
1. Cất tệp gốc vào R2 PRIVATE như trước, không sửa byte, không cấp đường dẫn tải nguyên mẫu.
2. Ghi chỉ mục R2 có xác thực. Hai cờ `preview_ready`, `download_ready` của R2 để false. Không giả vờ hai bản này đã tồn tại.
3. Tối ưu **một bản hiển thị Supabase** theo thuật toán hiện tại: ảnh <= 6 MB được giữ khi hợp lệ; ảnh lớn giữ độ phân giải trong ngưỡng iPhone, giới hạn < 6 MB. Ảnh gốc R2 không bị ghi đè.
4. Tải bản hiển thị Supabase, ghi album và thứ tự/chú thích như trước. Mỗi mục lưu xong độc lập, không tự tạo bài mới khi gặp lỗi.

**PDF/Word:** giữ nguyên DK01.4, lưu tệp gốc R2 riêng tư và không công bố tệp trực tiếp.

**Kho nguyên mẫu R2 độc lập:** vẫn tạo các bản ảnh phụ ngay như luồng cũ (mặc định `skipDerivatives:false`).

**Khi muốn công bố ảnh từ R2:** vào Quản trị viên → Kho nguyên mẫu R2 → mở bản xem của ảnh → chọn lại **đúng tệp gốc cùng tên và kích thước** → chọn “Tạo bản xem R2 khi cần”. Hệ thống xác minh metadata R2 trước khi tạo, chỉ xử lý biến thể còn thiếu, cập nhật chỉ mục, để trạng thái PRIVATE; người quản trị chủ động công bố sau khi kiểm tra.

## Bảo toàn và giới hạn

- Không đổi ảnh nguyên mẫu, cắt ảnh, thay chú thích, số thứ tự, mã định danh, QR, trạng thái công bố, chính sách RLS, Worker, bucket hoặc file PDF cũ.
- Tệp R2 mới bảo tồn nguyên mẫu hoàn chỉnh; việc chưa tạo preview/download trên R2 **không đồng nghĩa với mất bản gốc**.
- Ảnh đang hiển thị trên website vẫn theo bản tối ưu Supabase với thiết lập chất lượng như trước. Không thể hứa nhanh gấp N lần vì còn phụ thuộc băng thông, kích thước và đời máy.
- Ảnh đã đăng từ trước không tự động bị đổi hoặc tạo lại.
- Không tự động chạy nhiều phiên xử lý nặng song song trên iPhone (tránh tăng RAM, nóng máy, Safari thoát); bước đầu ưu tiên giảm công việc dư thừa.
- Nếu một ảnh lỗi sau khi nguyên mẫu đã lên R2, đường tải tiếp vẫn sử dụng cache theo File trong phiên để hạn chế tải lại bản gốc. Không xóa tệp dang dở.

## Kiểm thử

- `workers/gdd-r2-gateway/test/dk017-fast-safe-album.test.mjs`: khẳng định request R2 mang nguyên File, không gọi 2 API phụ ở chế độ nhanh; kiểm tra album, ảnh chính, tính năng tạo lại khi cần và cache-busting JS.
- Kiểm thử bảo mật DK01.2–DK01.5 và smoke iPhone/Desktop phải giữ kết quả thành công.
- Cần kiểm tra thực tế bằng iPhone với 2–3 ảnh trước, sau đó bộ lớn; không giả định tự động đạt hiệu năng nhất định.
- Khôi phục nếu cần: nhánh sao lưu `backup/stable-2026-11-17-before-further-edits`, hoặc revert commit DK01.7; dữ liệu R2 không phải đổi khi rollback.
