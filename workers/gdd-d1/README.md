# Dấu Xưa Cửa Đạo — chuyển Supabase sang Cloudflare D1

**Cập nhật: 23/11/2026. Trạng thái: STAGING — chưa mở lại website, chưa bật ghi.**

## Đã triển khai thực tế

- **Cloudflare D1 Free:** database `gdd-dao-su-archive`, đúng 21 bảng theo schema Supabase (215 cột). Có migration SQL và kiểm thử tự động.
- **Nhập dữ liệu công khai:** 741 bản ghi đã xác minh trong D1: 50 hồ sơ đã công bố, 17 bài biên khảo, 21 tài liệu, 13 mục media, 8 video, 2 ai tín, 5 tưởng niệm, 2 âm thanh, 615 ảnh album và 8 phân loại. Không đưa bản nháp hoặc dữ liệu riêng tư lên GitHub.
- **Worker API công khai:** `gdd-d1-api-staging`, chỉ truy vấn bản ghi đã công bố, không hỗ trợ ghi.
- **Cloudflare Access Free:** Self-hosted application bảo vệ duy nhất `gdd-d1-admin-staging.realmetayninh7649.workers.dev`. Đã kiểm tra truy cập chưa xác thực bị chuyển tới Cloudflare Access. Chủ website thử đăng nhập thành công với kết quả `authenticated:true, write_enabled:false`.
- **Worker quản trị:** `gdd-d1-admin-staging`, xác minh `ctx.access`, AUD và vân tay email được cho phép. Không lưu email chủ website dưới dạng chữ thuần trong code GitHub công khai.
- **Giao diện quản trị thử nghiệm:** `/admin` hiển thị kiểm kê 21 bảng, đối chiếu số lượng Supabase và D1, cho xem các danh sách tư liệu **đã công bố**, khóa toàn bộ HTTP POST/PUT/PATCH/DELETE. Giao diện dùng tiếng Việt, phù hợp màn hình iPhone.
- **Số liệu nguồn Supabase:** truy vấn `SELECT count(*)` trực tiếp, không sửa/xóa bảng nguồn. 21 bảng có tổng **1.892 bản ghi** ở thời điểm 23/11/2026; D1 đã có 741, còn **chênh lệch 1.151 bản ghi**. Bản chụp số lượng tại `source-row-counts-20261123.json`. Đây là mốc đối soát, phải đếm lại trước khi chuyển chính thức.
- **Kiểm thử:** GitHub Actions `gdd-access-admin-staging.yml`, `gdd-d1-staging-tests.yml`, `gdd-d1-import-public.yml`, `gdd-d1-worker-staging.yml`. Kiểm tra xác thực, danh sách công khai, trạng thái khóa ghi và bảo vệ URL.

## Dữ liệu còn thiếu trong D1 (chưa được nhập, vẫn ở Supabase)

Đặc biệt có:
- **2 hồ sơ Chức sắc chưa công bố**: không đưa vào API công khai.
- **269 chỉ mục R2** (`gdd_r2_assets`), **55 bộ đếm ảnh** (`gdd_album_photo_counters`).
- **197 sự kiện thống kê, 74 bản ghi tổng hợp thống kê, 550 phiên truy cập**, cùng các bảng tổng cộng.
- **1 bản ghi `admin_users`** và **1 `submissions`** chứa thông tin quản trị/đóng góp cần xử lý riêng tư.

Khác biệt 1.151 là **số bản ghi**, không phải 1.151 hồ sơ Chức sắc và không phản ánh số tệp R2. Lưu trữ ảnh/PDF gốc là chuyện riêng với việc nhập metadata D1.

## Quy tắc không được phá vỡ

1. **Giữ Supabase Free và dữ liệu gốc ở nguyên trạng** cho đến khi có bản sao lưu độc lập, xác nhận khả năng phục hồi và đủ dữ liệu trong D1. Không xóa bảng/ảnh cũ.
2. **Không ghi dữ liệu qua Worker quản trị hiện tại.** Mã chạy không có lệnh SQL INSERT/UPDATE/DELETE và chỉ cho phép HTTP GET.
3. **Tuyệt đối không commit dữ liệu riêng tư, ảnh gốc, token hay mật khẩu** vào repository GitHub công khai. Bản xuất đầy đủ phải chuyển bằng kênh riêng và có checksum.
4. **R2 gateway cũ vẫn phụ thuộc Supabase JWT**, nên hiện chưa thể sử dụng lại tính năng tải/đăng tệp từ giao diện D1 mới. Phải thay xác thực R2 an toàn trước khi cho phép ghi.
5. Cloudflare Access phải giới hạn đúng tài khoản quản trị; cấm `Everyone`, `Bypass` và không được để lộ đường dẫn bản nháp trong API công khai.
6. Không bật gói tính phí, chưa thay DNS, chưa bật website thật, chưa gỡ trang BẢO TRÌ.
7. Mọi thay đổi chỉ lên nhánh `cloudflare-d1-migration-20261123`. Nhánh `backup-before-cloudflare-maintenance-20261123` bảo toàn website trước bảo trì; nhánh `main` hiện có trang bảo trì.

## Công việc tiếp theo để có thể mở website

1. Hoàn thiện bản xuất và **bản sao lưu phục hồi được** của 21 bảng Supabase, gồm bản nháp, tài sản R2 metadata, chứng từ, mã QR, trường định danh.
2. Nhập riêng tư vào D1; so sánh `id`, `slug`, `archive_code`, `photo_code`, `published`, số dòng **từng bảng**; không ghi đè dữ liệu công khai đã chuyển sai cách.
3. Thiết kế backend CRUD có xác thực Access và lịch sử sửa đổi/khả năng rollback; kiểm thử trước khi bật quyền ghi trên staging.
4. Chuyển R2 gateway khỏi Supabase Auth, kiểm tra tải ảnh/PDF/Word và quyền chỉ xem/tải bản hiển thị; bảo toàn bản gốc.
5. Phục hồi giao diện quản trị đầy đủ, kiểm thử trên iPhone, rồi mới nối website và mở lại trang chính.

## Liên kết thử nghiệm

- Admin UI: `https://gdd-d1-admin-staging.realmetayninh7649.workers.dev/admin` (**bắt buộc Cloudflare Access**)
- API public: `https://gdd-d1-api-staging.realmetayninh7649.workers.dev/health`
- Website chính (bảo trì): `https://dauxuacuadao.info.vn/`

**Tất cả tài nguyên vừa tạo đều đang dùng Cloudflare Free, vẫn cần giám sát hạn mức sử dụng thực tế.**
