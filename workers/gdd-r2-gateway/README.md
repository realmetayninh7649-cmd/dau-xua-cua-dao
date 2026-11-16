# GDDĐ v2.0.0-DK01.1 — Kết nối R2 (Bước 1)

**Trạng thái:** Bộ xử lý chỉ kiểm tra đọc R2, chưa kết nối phần đăng bài của Web Đạo.

## Tài nguyên

- Worker hiện có: `gdd-r2-gateway`.
- Bucket riêng tư: `gdd-dau-xua-cua-dao`.
- Binding: `GDD_BUCKET`.
- GitHub Secret: `CLOUDFLARE_API_TOKEN`; GitHub Variable: `CLOUDFLARE_ACCOUNT_ID`.

## Bảo vệ tư liệu

- Chỉ tuyến `GET /health` hoạt động, thăm dò R2 `HEAD` một khóa nội bộ cố định.
- Không có tuyến xem ảnh, liệt kê tệp, tải tệp gốc, tải lên hoặc ghi vào bucket.
- Không mở quyền công khai của bucket; không lưu bí mật vào mã nguồn.
- Mọi đường dẫn khác trả về 404; phương thức khác GET tại `/health` trả về 405.
- Mọi lỗi R2 được trả về trạng thái không sẵn sàng, không lộ nội dung tư liệu.
- Không tác động Web Đạo, dữ liệu Supabase và các ảnh đang lưu.

## Kiểm tra và phục hồi

- Kiểm tra: `node --test workers/gdd-r2-gateway/test/gateway.test.mjs`.
- Triển khai có kiểm tra: `.github/workflows/gdd-dk01-r2-deploy.yml`.
- Đầu cuối kiểm tra: `https://gdd-r2-gateway.realmetayninh7649.workers.dev/health`.
- Khôi phục Worker: mở Cloudflare → Workers → gdd-r2-gateway → Deployments → Roll back, hoặc triển khai lại phiên bản đã kiểm thử.

**Bước 2 (chưa làm):** Xác thực Quản trị viên, lưu tệp nguyên mẫu, tạo bản xem nhẹ và kiểm soát phân phối.
