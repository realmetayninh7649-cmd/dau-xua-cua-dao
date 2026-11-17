# Biên bản kiểm tra ổn định Web Đạo — ngày 17/11/2026

**Dự án:** Giữ Đạo Giữa Đời – Dấu Xưa Cửa Đạo.

**Kết luận kỹ thuật:** mã website và các luồng đã được kiểm thử tự động đạt; mã có thể đóng băng tính năng. **Chưa tuyên bố đóng hồ sơ bảo tồn 3 PDF cũ** và **chưa xác nhận bản sao lưu toàn bộ PostgreSQL**. Không đổi link cũ khi chưa đối chiếu.

## 1. Mốc khôi phục và vận hành

- Sao lưu mã DK01.7 trước đợt kiểm tra: nhánh `backup/stable-dk017-pre-v20-freeze-20261117`, commit `185aeb1ffe1e28b19a47a8565fe6d32d673c608d`.
- Bản `main` sau kiểm tra: giữ nguyên tính năng website; bổ sung quy trình kiểm thử, sao lưu PDF và biên bản; không đổi API công khai hoặc dữ liệu người đọc.
- R2 gateway: GitHub Actions triển khai Worker và kiểm tra không công khai tệp gốc đạt ở DK01.7.
- Không đánh đồng nhánh sao lưu **mã nguồn** với bản sao lưu **CSDL hoặc ảnh/PDF**.
- Từ mốc này, dừng thêm chức năng không thiết yếu. Chỉ sửa lỗi thực tế và tiếp tục công tác tư liệu.

## 2. Đối chiếu dữ liệu Supabase (chỉ đọc)

| Danh mục | Tổng | Đã công bố |
|---|---:|---:|
| Chức sắc | 44 | 42 |
| Biên khảo | 15 | 15 |
| Hình ảnh | 11 | 11 |
| Video Đạo Sử | 8 | 8 |
| Ai Tín | 2 | 2 |
| Tài liệu số hóa | 11 | 11 |
| Tệp album trong `archive_gallery_images` | 451 | tùy hồ sơ cha |
| Chỉ mục nguyên mẫu R2 | 81 | 2 bản xem đã công bố |

Kiểm tra quan hệ chủ sở hữu bộ ảnh: **0** hàng `archive_gallery_images` trỏ đến hồ sơ chủ không tồn tại (đối chiếu 6 bảng nội dung).

Kiểm tra bảo mật: toàn bộ 16 bảng trong schema `public` đã bật RLS. Hai bảng đếm lượt truy cập cố ý không có policy trực tiếp, được cập nhật qua RPC. Quyền `EXECUTE` công khai cho `public.rls_auto_enable()` đã bị thu hồi và xác nhận `anon`/ `authenticated` không thể gọi. Các RPC `gdd_record_visit`, `is_site_admin`, `gdd_set_people_order` còn có cảnh báo security-definer; các đường quyền này cần được duy trì đúng công năng. Supabase Auth vẫn cảnh báo tắt tính năng kiểm tra mật khẩu rò rỉ: phải xem trong dashboard Auth, không tự sửa bằng SQL.

## 3. Kiểm thử đạt

- 40/40 kiểm thử `workers/gdd-r2-gateway/test/*.test.mjs`: quyền truy cập, lưu nguyên mẫu byte-for-byte, upload nhỏ/multipart, bản xem và PDF.
- Smoke desktop/iPhone: DK01.3 Quản trị viên R2, DK01.4 PDF/DOCX reader, DK01.5 trình đọc thống nhất, Phase 1 bố cục đang hoạt động và Phase 2 tìm kiếm/điều hướng.
- Quy trình `GDD v2.0 - Kiem thu tong the truoc chot phien ban` chạy trên PR và `main`; bằng chứng tại GitHub Actions.
- Test `tests/v2-smoke.mjs` cũ là của giao diện thử nghiệm `gdd-v2` **không được trang chính nạp**, không phải bộ kiểm thử nghiệm thu của trang hiện hành; thay bằng `tests/v20-active-site-smoke.mjs`.

Giới hạn: smoke dùng Chromium giả lập độ rộng iPhone, **không phải kiểm thử thủ công trên iOS Safari của thiết bị thật**. Cần kiểm tra một lần bằng máy của quản trị viên khi vận hành.

## 4. Ba PDF cũ — chưa chuyển đổi liên kết

Ba tệp nguyên mẫu đang ở bucket Supabase công khai `dao-su-documents`:

1. `documents/1794684373312-e808f501-1bba-458d-b82f-f5f096479426.pdf` — **10.098.129 bytes**, nguồn đã tải và SHA-256: `62507da3177a132d21384e037cf26d55037585ec4b9258e101fc3c9bfe8a4d3e`.
2. `documents/1794684462288-fc373424-39bf-4d8d-950c-2195aa01a603.pdf` — **9.932.650 bytes**.
3. `media/1794860043784-52816aff-f9f7-4790-9e91-d87d7a86fc96.pdf` — **34.412.351 bytes**.

Workflow ghi trực tiếp R2 dùng token triển khai Worker hiện có đã **dừng bởi Cloudflare 403**, không có xác nhận ghi file nào. Không được coi PDF 1 đã sao lưu chỉ vì tải được từ nguồn. **Không xóa PDF Supabase, không đóng bucket công khai toàn cục, không thay gallery URL.**

### Đường sao lưu an toàn đã chuẩn bị

Lệnh `scripts/dk016_preserve_legacy_pdfs.py` chỉ xử lý đúng 3 đường dẫn trên, so sánh kích thước và SHA-256 từ nguồn và bản tải lại từ R2. Đích là bucket private `gdd-dau-xua-cua-dao` dưới tiền tố **`legacy-private-dk016/<sha256>/<original-name>`**. Chỉ ghi object chưa có; với object đã có, đọc và xác minh; không đè khi dữ liệu khác. Đây là **bản sao lưu nguồn**, chưa phải bản đọc đã công bố hoặc mục `gdd_r2_assets`.

Để không mở quyền toàn bộ tài khoản Cloudflare, chỉ cần chủ tài khoản thực hiện **một lần**, không gởi bí mật vào cuộc trò chuyện:

1. Cloudflare → **Storage & databases → R2 → Overview → Manage API Tokens → Create API Token**. Quyền **Object Read & Write**, chọn **Apply to specific buckets** và chỉ chọn `gdd-dau-xua-cua-dao`. Lưu **Access Key ID** và **Secret Access Key** (không dùng token triển khai Worker).
2. GitHub repository → **Settings → Secrets and variables → Actions → New repository secret**, thêm:
   - `GDD_R2_ARCHIVE_ACCESS_KEY_ID` = Access Key ID.
   - `GDD_R2_ARCHIVE_SECRET_ACCESS_KEY` = Secret Access Key.
3. GitHub → **Actions** → workflow **GDD DK01.6 - Sao luu ba PDF goc vao R2 PRIVATE** → **Run workflow** trên `main`.
4. Chỉ ghi nhận xong sao lưu khi workflow hiện **success** và log có đủ **ba** dòng `R2 PRIVATE BACKUP VERIFIED` với cùng số byte và SHA-256 của nguồn.
5. Sau sao lưu: tạo bản xem từng trang, **duyệt mắt** trang đầu/cuối và các trang quan trọng, iPhone/desktop, rồi mới đổi URL tài liệu; chỉ sau khi mọi link được kiểm chứng mới xem xét đóng truy cập cũ. Không xóa PDF cũ trong đợt này.

Tài liệu tham chiếu gốc: `docs/dk016-kiem-ke-pdf-cu-an-toan-20261117.md`.

## 5. Điều kiện nghiệm thu cuối và chính sách sau đó

- Bộ kiểm thử website/R2 đạt; website không cần phát triển tính năng mới.
- Sao lưu nguồn 3 PDF được xác thực hash và có bản đọc đã duyệt.
- Sau khi kiểm thử đường dẫn mới, quyết định xử lý nguồn Supabase cũ một cách có kiểm soát.
- Xác nhận chính sách sao lưu database Supabase trên dashboard; nhánh GitHub không thay thế bản sao dữ liệu.
- Khi các hạng mục đó được xác nhận: chốt **V2.0 chính thức**, kết thúc nâng cấp liên tục, chuyển sang vận hành và biên khảo.

**Không có chuyện tiếp tục DK01.8, DK02... chỉ vì số phiên bản.**
