# DK01.6 — Kiểm kê PDF công khai cũ trước khi chuyển sang R2 riêng tư

Ngày kiểm kê: 17/11/2026 (giờ Việt Nam).
Nguồn đối chiếu: Supabase project `dau-xua-cua-dao`, bảng `archive_gallery_images`, `storage.objects`, `gdd_r2_assets`; mã nguồn nhánh `main` tại commit `c7bb03f9bf9673b926838ad7ab00252abf337a95`.

**Đây là kiểm kê chỉ đọc, không phải xác nhận đã di chuyển. Không thay đổi tệp, URL, chính sách truy cập, mã hồ sơ hoặc dữ liệu xuất bản.**

| STT | Đầu mục / tài liệu | Vị trí đính kèm | Dung lượng (byte) | Gallery ID | Trạng thái |
|---|---|---|---:|---|---|
| 1 | SẮC LUẬT PHÁP NHÂN ĐẠI ĐẠO TAM KỲ PHỔ ĐỘ – NĂM 1965 | documents/1794684373312-e808f501-1bba-458d-b82f-f5f096479426.pdf | 10098129 | a4930807-7fc4-45c1-9ea9-213481024ae9 | PDF nguồn công khai, chưa xác nhận bản sao R2 |
| 2 | VI BẰNG HỘI THÁNH HÀM PHONG – NĂM KỶ MÃO (1939) | documents/1794684462288-fc373424-39bf-4d8d-950c-2195aa01a603.pdf | 9932650 | 37548c7a-96a6-49cf-84c9-b795f596cad3 | PDF nguồn công khai, chưa xác nhận bản sao R2 |
| 3 | BÀI TƯỜNG THUẬT THÁNH TANG ĐỨC BÀ NỮ ĐẦU SƯ HƯƠNG HIẾU (thuộc album Thánh tang) | media/1794860043784-52816aff-f9f7-4790-9e91-d87d7a86fc96.pdf | 34412351 | f3314258-5af9-4f6c-8675-d2669fc040df | PDF nguồn công khai, chưa xác nhận bản sao R2 |

Bucket nguồn hiện tại: Supabase Storage `dao-su-documents`. Cả ba tệp đang có liên kết `/storage/v1/object/public/` trong danh mục.
Ngoài `archive_gallery_images`, kiểm tra `documents.file_url` và `media.image_url` không phát hiện thêm URL kết thúc bằng PDF ở thời điểm kiểm kê (0, 0, 3).

## Đối chiếu R2

Bảng `gdd_r2_assets` đang có 81 mục: 80 ảnh, 1 tài liệu PDF khác (`5-lich-su-dao-cao-dai-trong-thoi-ky-phuc-quoc-1941-1946.pdf`, 13 trang, đã công bố bản xem). Không được coi tài liệu này là bản sao của một trong ba PDF bên trên.

## Trình tự tiếp tục DK01.6 (bắt buộc theo thứ tự)

1. Bảo tồn từng tệp PDF nguyên mẫu sang **R2 riêng tư**, không chuyển mã, nén, tái xuất PDF hoặc chỉnh nội dung. Ghi lại liên kết nguồn, byte length và SHA-256 ở nguồn và ở R2, phải khớp tuyệt đối; kiểm tra danh mục admin đã ghi nhận.
2. Tạo **bản đọc riêng** cho từng PDF (nếu trên 120 trang hoặc vượt giới hạn trình duyệt, chia phần bản xem hoặc xử lý qua đường chuyên biệt; KHÔNG chia/đổi bản nguyên mẫu). Đối chiếu số trang, trang đầu/cuối, khả năng phóng to chữ, dấu tiếng Việt, màu sắc và vị trí trang trên iPhone lẫn máy tính.
3. Chỉ sau khi kiểm chứng mới gắn link trình đọc chung vào từng mục tư liệu. Không thay đổi tệp gốc để tạo link đọc.
4. Rà soát liên kết ở Hình ảnh, Tài liệu số hóa, Chức sắc, album, bài viết, QR và link đã chia sẻ; kiểm thử đồng bộ trên toàn site, không sửa riêng lẻ.
5. Chỉ khi chắc chắn không còn link công khai cũ và đã đối chiếu bản sao, mới xem xét tắt quyền truy cập public nguồn cũ. **Không xóa tệp cũ hoặc tệp R2 trong DK01.6.**

## Nguyên tắc an toàn

- Trình đọc DK01.5 giúp thống nhất giao diện nhưng **không làm link PDF nguồn cũ thành riêng tư**.
- Việc sao lưu chỉ được công nhận hoàn tất khi R2 có bản gốc được kiểm chứng; mã nguồn và bảng chỉ mục không chứng minh tệp đã được sao chép.
- Không tự ý bật tải PDF/Word nguyên mẫu cho độc giả; ảnh chỉ có một nút tải JPEG tối ưu khi admin cấp phép.
- Không tự động tạo bài đăng mới, xóa bài mẫu hay đổi `published` trong quá trình kiểm kê.
- Nếu có lỗi, ưu tiên giữ nguyên trang đang hoạt động và đường dẫn cũ, chờ kiểm chứng bản sao.

## Kết quả kiểm thử hạ tầng trước giai đoạn

- GitHub Pages run `43997307122`: success.
- R2 Worker deploy run `43997307555`: success.
- Không chứng nhận việc duyệt đủ trang bằng mắt hoặc kiểm chứng byte/hash cho ba PDF ở lần kiểm kê này.

Tài liệu ghi nhận tiến độ để tiếp tục công việc giữa các cuộc trò chuyện, không thay thế bước nhập và kiểm chứng file thực tế.
