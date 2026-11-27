/* Offline-safe management preview. All database requests use same-origin Access-protected routes. */
export const ADMIN_HTML=`<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Quản trị tư liệu — Dấu Xưa Cửa Đạo </title>
<meta name="theme-color" content="#214c3d">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Quản trị Đạo sử">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="/admin/manifest.webmanifest">
<link rel="apple-touch-icon" href="/admin/icon.png">
<link rel="icon" href="/admin/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/admin/style.css">
<script src="/admin/app.js" defer></script>
<script src="/admin/photo-album.js" defer></script>
<script src="/admin/audio-optimizer.js" defer></script>
</head><body>
<header class="masthead"><div class="wrap">
<p class="eyebrow">ĐẠI ĐẠO TAM KỲ PHỔ ĐỘ · KHO TƯ LIỆU ĐẠO SỬ</p>
<h1>Quản trị tư liệu</h1>
<p class="lead">Dấu Xưa Cửa Đạo</p>
</div></header>
<main class="wrap">
<section class="notice" role="status"><strong>Website công khai đã hoạt động.</strong> · Bản gốc được giữ riêng.</section>
 <nav class="quick-links" aria-label="Liên kết"><button id="admin-app-refresh" type="button" class="admin-app-refresh"><span aria-hidden="true">↻</span> Làm mới ứng dụng</button><a href="/admin/research">Trung tâm Sưu tầm &amp; Khảo chứng</a><a href="https://dauxuacuadao.info.vn/" target="_blank" rel="noopener noreferrer">Mở website công khai</a></nav><p id="admin-app-refresh-status" role="status" aria-live="polite"></p>
<section aria-labelledby="work-title" id="work-editor-panel" hidden>
<div class="heading"><h2 id="work-title">Soạn bài &amp; quản lý tư liệu</h2></div>
<div class="admin-home" aria-label="Lối tắt quản trị">
 <div class="admin-home-grid" id="admin-home-grid">
  <button type="button" data-admin-kind="people"><span aria-hidden="true">♙</span>Chức Sắc</button>
  <button type="button" data-admin-kind="posts"><span aria-hidden="true">▤</span>Biên Khảo</button>
  <button type="button" data-admin-kind="media"><span aria-hidden="true">▧</span>Hình Ảnh</button>
  <button type="button" data-admin-kind="documents"><span aria-hidden="true">▱</span>Số Hóa</button>
  <button type="button" data-admin-kind="obituaries"><span aria-hidden="true">✧</span>Ai Tín</button>
  <button type="button" data-admin-kind="gdd_audio_programs"><span aria-hidden="true">♫</span>Âm Thanh</button>
  <button type="button" data-admin-kind="gdd_memorials"><span aria-hidden="true">✿</span>Tưởng Niệm</button>
  <button type="button" data-admin-kind="gdd_calendar_memorials"><span aria-hidden="true">▦</span>Lịch Đạo</button>
  <button type="button" data-admin-kind="videos"><span aria-hidden="true">▷</span>Video</button>
 </div>
 <div class="admin-home-tools">
  <button id="admin-home-drafts" type="button">Bản nháp</button>
  <button id="admin-home-trash" type="button">Thùng rác</button>
  <button id="admin-home-r2" type="button">Dung lượng R2</button>
 </div>
 <p id="admin-home-storage" role="status" aria-live="polite"></p>
 <details class="admin-install-help"><summary>Ghim ứng dụng trên iPhone</summary><p>Safari → Chia sẻ → Thêm vào màn hình chính. Đặt tên Quản trị Đạo sử. Dùng cùng một biểu tượng cho mọi bản cập nhật. Đăng nhập Cloudflare Access khi được yêu cầu.</p></details>
</div>
<div class="controls work-actions"><label for="work-kind">Chuyên mục</label>
<select id="work-kind">
<option value="people">Chức sắc</option><option value="posts">Biên khảo</option>
<option value="media">Hình ảnh</option><option value="videos">Video</option>
<option value="obituaries">Ai tín</option><option value="documents">Tài liệu số</option>
<option value="gdd_memorials">Tưởng niệm</option><option value="gdd_audio_programs">Âm thanh Đại Đạo</option>
<option value="gdd_calendar_memorials">Lịch tưởng niệm</option></select>
<button id="work-new" class="work-primary" type="button">Soạn bài mới</button></div>
<p id="work-status" role="status" aria-live="polite">Đang kết nối D1 làm việc…</p>
<details id="work-archive-batch" class="work-record-panel" hidden>
<summary>KIỂM KÊ VĂN KIỆN · Nhập và quản lý hàng loạt</summary>
<div id="archive-inventory-panel"><h4>1. Kiểm kê văn kiện</h4><p>Chọn PDF, Word hoặc ảnh để kiểm tra SHA-256, sửa nhan đề, niên đại và nguồn. Tệp chỉ được đọc trên thiết bị trong bước này, không gửi lên máy chủ.</p>
<label for="archive-inventory-files">Chọn tệp (có thể chọn nhiều lần)</label><input id="archive-inventory-files" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.tif,.tiff" multiple>
<small>45 MB/tệp. PDF/Word có thể chuyển sang bước tạo bản nháp; ảnh có thể kiểm kê và xuất CSV.</small>
<div class="controls"><button id="archive-inventory-export" type="button" disabled>Xuất CSV</button><button id="archive-inventory-clear" type="button" disabled>Xóa danh sách</button></div>
<p id="archive-inventory-status" role="status" aria-live="polite">Chưa chọn tệp.</p><div id="archive-inventory-rows"></div>
<button id="archive-inventory-transfer" class="work-primary" type="button" disabled>Chuyển PDF/Word đã duyệt sang bước 2</button></div>
<hr><h4>2. Kiểm tra danh mục và tạo bản nháp</h4>
<p>Dùng danh mục vừa kiểm kê ở trên hoặc nhập CSV đã duyệt từ Colab. Chỉ tạo hồ sơ nháp, chưa đính kèm tệp, chưa cấp mã, chưa công bố. Kiểm tra nhan đề trùng trong D1, không xác nhận trùng nội dung R2.</p>
<label for="work-archive-csv">Danh mục CSV đã duyệt</label><input id="work-archive-csv" type="file" accept=".csv,text/csv">
<label for="work-archive-folder">Thư mục gốc cho đợt này</label><select id="work-archive-folder"><option value="">Chọn thư mục</option><option value="HCĐ">Hành Chánh Đạo</option><option value="HTĐ">Hiệp Thiên Đài</option><option value="CTĐ">Cửu Trùng Đài</option><option value="PT">Phước Thiện</option><option value="VKNN">Văn Khố Ngoại Quốc</option><option value="VKVN">Văn Khố Việt Nam</option><option value="CQK">Các Cơ Quan Khác</option></select>
<p>Chỉ tối đa 30 bản nháp mỗi lần. Niên đại và nguồn là thông tin đã duyệt trong CSV, cần đối chiếu bản scan. Hãy đóng biểu mẫu đang sửa trước khi nhập.</p>
<div class="controls"><button id="work-archive-prepare" type="button">Kiểm tra danh mục</button><button id="work-archive-create" type="button" disabled>Tạo bản nháp đã chọn</button></div>
<p id="work-archive-status" role="status" aria-live="polite"></p><ul id="work-archive-rows" class="records"></ul>
<hr><h4>3. Gắn bản gốc và nội dung OCR vào từng bản nháp</h4>
<p>Chọn PDF/Word nguyên mẫu và các tệp OCR .txt đặt tên theo SHA-256 từ Colab. Đối chiếu toàn bộ kho R2 trước khi tải. OCR sẽ hiện trong bài sau khi công bố, dưới nhãn chưa kiểm chứng. Không tự công bố, không mở quyền tải, không sửa bản scan.</p>
<label for="work-archive-originals">Chọn tối đa 30 tệp gốc PDF/Word, 45 MB/tệp</label><input id="work-archive-originals" type="file" accept=".pdf,.doc,.docx" multiple>
<label for="work-archive-ocr">Chọn tệp OCR đã đối chiếu (không bắt buộc)</label><input id="work-archive-ocr" type="file" accept=".txt,text/plain" multiple>
<div class="controls"><button id="work-archive-link" type="button">Đối chiếu R2 và gắn vào bản nháp</button></div>
<p id="work-archive-link-status" role="status" aria-live="polite"></p>
</details>

<div id="work-edit-area" class="work-editor-form" hidden><h3 id="work-edit-heading">Chi tiết</h3><p id="work-identity" class="audit-caution"></p>
<div id="work-code-area" class="audit-caution" hidden>
<p id="work-code-preview">Mã định danh sẽ được xác định sau khi lưu bản nháp và thông tin phân loại.</p>
<div class="controls"><label class="sandbox-checkbox"><input id="work-code-confirm" type="checkbox"> Tôi đã đối chiếu Cơ quan, Phẩm vị và xác nhận mã định danh</label>
<button id="work-code-assign" type="button" disabled>Cấp mã cho bản nháp</button></div>
</div>
<div class="sandbox-form" id="work-fields"></div>
<div id="work-photo-panel" class="work-photo-panel" hidden>
<h4>Ảnh đính kèm</h4>
<p class="work-photo-explain">Chọn ảnh, thêm chú thích và sắp xếp. Bản gốc giữ riêng; chỉ công bố bản xem.</p>
<label for="work-photo-files"><strong>Chọn nhiều ảnh từ điện thoại hoặc máy tính</strong></label>
<input id="work-photo-files" type="file" accept="image/jpeg,image/png,image/webp" multiple>
<small id="work-photo-size-note">JPEG/PNG/WebP · 24 MB/ảnh · Không giới hạn số ảnh.</small>
<ol id="work-photo-queue" class="work-photo-queue"></ol>
<p id="work-photo-status" role="status" aria-live="polite">Chọn ảnh đính kèm, hệ thống tự tải khi đăng bài.</p>
<details id="work-photo-existing"><summary>Bộ ảnh đã gắn vào bài <span id="work-photo-count">· 0 ảnh</span></summary><div id="work-photo-album" class="work-photo-grid"></div></details>
</div>
<div id="work-attachment-panel" class="work-photo-panel" hidden>
<h4>Tài liệu đính kèm</h4>
<label for="work-attachment-files"><strong>Chọn nhiều tệp tài liệu</strong></label>
<input id="work-attachment-files" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple>
<small>PDF, Word · tối đa 45 MB/tệp. Tự xử lý khi đăng bài.</small><details class="admin-help"><summary>Lưu ý định dạng và quyền tải</summary><small>PDF đính kèm mới: chỉ một tệp giữ nguyên chất lượng, xem và tải cùng tệp khi bài công bố và được phép tải. DOCX: bản đọc chữ (không giữ ảnh và bố cục). DOC: chỉ tải nếu được cấp quyền. Tệp gốc mặc định riêng tư.</small></details>
<ul id="work-attachment-queue" class="records"></ul>
<p id="work-attachment-status" role="status" aria-live="polite"></p>
<details><summary>Tài liệu đã gắn vào bài <span id="work-attachment-count">· 0 tệp</span></summary><ul id="work-attachment-existing" class="records"></ul></details>
</div>
<div class="work-submit-actions"><p id="work-submit-status" role="status" aria-live="polite"></p><button id="work-publish" class="work-primary" type="button">Đăng bài lên website</button><div class="controls"><button id="work-save" type="button">Lưu bản nháp</button><button id="work-cancel" type="button">Đóng biểu mẫu</button></div><small>Ảnh và tài liệu tự xử lý trong một lần đăng bài. Tệp gốc chỉ tải công khai khi được cho phép.</small></div>
<details class="work-history"><summary>Lịch sử chỉnh sửa và phục hồi</summary><ul class="records" id="work-revisions"></ul></details>
</div>
<details id="work-list-details" class="work-record-panel">
<summary>Danh sách bài viết và hồ sơ <span id="work-list-count" class="work-muted">· Đang tải</span></summary>
<div class="work-record-inner">
<p class="work-list-note">Tìm trong 10 kết quả của trang hiện tại. Mở trang tiếp theo để xem thêm.</p>
<div class="controls work-list-controls"><label for="work-search">Tìm nhanh</label><input id="work-search" type="search" placeholder="Nhập tên hồ sơ hoặc nhan đề" autocomplete="off" />
<button id="work-list-refresh" type="button">Làm mới danh sách</button><button id="work-trash-toggle" type="button" aria-pressed="false">Thùng rác</button></div>
<ul class="records work-compact-records" id="work-list"></ul>
<div class="pagination"><button id="work-prev" type="button">Trang trước</button><span id="work-page">Trang 1</span><button id="work-next" type="button">Trang sau</button></div>
</div>
</details>
</section>
<details class="admin-fold" id="radio-recovery-panel"><summary>Khôi phục Radio HAI MƯƠI NĂM <small>Tệp MP3 gốc</small></summary><div class="admin-fold-body"><p>Chọn tệp Radio dai dao.mp3 đã xác minh (16.116.406 byte). Hệ thống tự kiểm tra và cập nhật bài cũ, không tạo bài mới.</p><input id="radio-recovery-file" type="file" accept=".mp3,audio/mpeg"><button class="work-primary" id="radio-recovery-submit" type="button" disabled>Khôi phục âm thanh</button><p id="radio-recovery-status" role="status" aria-live="polite"></p></div></details>
<details class="admin-fold" id="r2-managed-panel" hidden><summary id="r2-managed-title">Kho tư liệu R2 <small>Ảnh · PDF · Word</small></summary><div class="admin-fold-body">
<details class="admin-help"><summary>Hướng dẫn bảo tồn và công bố</summary><p class="audit-caution">Ảnh hoặc tài liệu được cất nguyên vẹn dưới dạng bản gốc riêng tư trong R2. Tệp lớn tải thành các phần 8 MB. Chỉ khi chủ động nhấn Công bố bản xem thì ảnh tối ưu mới được mở cho độc giả. PDF được chuyển thành ảnh từng trang. DOCX có thể tạo bản đọc **chữ** từng trang (không bảo toàn ảnh nhúng hoặc định dạng Word phức tạp); với DOCX chứa hình ảnh, xin xuất PDF để giữ nguyên bố cục trước khi công bố. Bản gốc luôn được giữ riêng.</p></details>
<div class="controls"><input id="r2-managed-file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.tif,.tiff,.heic,.heif,.avif">
<button id="r2-managed-upload" type="button">Bảo tồn bản gốc vào R2</button></div>
<p id="r2-managed-status" role="status" aria-live="polite">Chưa chọn tệp để lưu.</p>
<div id="r2-managed-actions" hidden>
<div class="controls"><button id="r2-managed-derivative" type="button">Tạo bản xem và bản in JPEG của ảnh</button>
<button id="r2-managed-pdf-pages" type="button">Tạo bản đọc PDF từng trang</button>
<button id="r2-managed-docx-pages" type="button">Tạo bản đọc chữ DOCX</button></div>
<div class="controls"><label class="sandbox-checkbox"><input id="r2-managed-public-confirm" type="checkbox"> Tôi đã kiểm tra hình ảnh và đồng ý công bố bản xem</label></div>
<div class="controls"><label class="sandbox-checkbox"><input id="r2-managed-download-confirm" type="checkbox"> Cho phép tải bản JPEG tối ưu (không phải bản gốc)</label>
<button id="r2-managed-publish" type="button">Công bố bản xem</button></div>
</div>
</div></details>
<details class="admin-fold" id="contribution-panel"><summary id="contribution-title">Hộp thư tư liệu <small>Độc giả gửi về</small></summary><div class="admin-fold-body">
<p class="work-help">Tư liệu và thông tin liên hệ chỉ quản trị viên được xem.</p>
<div class="controls"><button type="button" id="contribution-refresh">Kiểm tra hộp thư tư liệu</button></div>
<p id="contribution-status" role="status" aria-live="polite">Chưa tải hộp thư.</p>
<ul class="records" id="contribution-list"></ul>
</div></details>
<details class="admin-technical work-archive-lookup"><summary>Tra cứu tư liệu (chỉ xem)</summary>
<section aria-labelledby="records-title"><div class="heading"><h2 id="records-title">Xem tư liệu đã công bố và bản nháp</h2><small>Bản nháp chỉ mở cho người quản trị đã xác thực; không hiển thị hồ sơ tài khoản hoặc tư liệu độc giả gửi về</small></div>
<div class="controls"><label for="kind">Chuyên mục</label><select id="kind">
<option value="people">Hồ sơ Chức sắc</option>
<option value="posts">Biên khảo</option>
<option value="documents">Tài liệu số hóa</option>
<option value="media">Hình ảnh</option>
<option value="videos">Video</option>
<option value="obituaries">Ai tín</option>
<option value="gdd_memorials">Tưởng niệm</option>
<option value="gdd_audio_programs">Âm thanh Đại Đạo</option>
<option value="gdd_calendar_memorials">Lịch tưởng niệm</option>
</select><label for="view">Trạng thái</label><select id="view">
<option value="published">Đã công bố</option>
<option value="draft">Bản nháp (riêng tư)</option>
</select></div>
<ul id="record-list" class="records"></ul>
<div class="pagination"><button id="previous" type="button">Trang trước</button><span id="page">Trang 1</span><button id="next" type="button">Trang sau</button></div>
</section></details>
<details class="admin-technical"><summary>Kiểm kê &amp; kỹ thuật</summary><div class="technical-content">
<section aria-labelledby="state-title"><div class="heading"><h2 id="state-title">Thống kê và đối chiếu dữ liệu</h2><button id="refresh" type="button">Làm mới</button></div>
<p id="status" role="status" aria-live="polite">Đang kiểm tra phiên quản trị và dữ liệu D1…</p>
<div id="overview" class="summary" aria-live="polite"></div>
</section>
<section aria-labelledby="safety-title"><div class="heading"><h2 id="safety-title">Kiểm tra bảo toàn tư liệu gốc</h2><small>Đối chiếu từ Supabase ngày 23/11/2026</small></div>
<ul class="safe-list" id="safety-report">
<li>Đang tải kết quả kiểm tra…</li>
</ul>
<p class="audit-caution">Đã kiểm kê danh sách đối tượng R2 ngày 23/11/2026. Đây chỉ là dấu kiểm kê tệp, chưa phải xác minh nội dung từng tệp hay bản sao lưu độc lập có thể phục hồi.</p>
<div class="controls"><button id="r2-audit" type="button">Kiểm kê R2 trực tiếp (chỉ đọc)</button></div>
<p id="r2-live-status" role="status" aria-live="polite">Chưa quét kho R2 trong phiên này.</p></section>
<section aria-labelledby="inventory-title"><div class="heading"><h2 id="inventory-title">Đối chiếu 21 bảng D1</h2><small>Đối chiếu với số liệu Supabase ngày 23/11/2026 (bản chụp)</small></div>
<div class="table-scroll"><table><thead><tr><th scope="col">Bảng dữ liệu</th><th scope="col" class="number">Supabase</th><th scope="col" class="number">D1</th><th scope="col" class="number">Còn thiếu</th></tr></thead><tbody id="inventory"></tbody></table></div>
</section>
</div></details>
<footer>Dấu Xưa Cửa Đạo · Quản trị tư liệu</footer>
</main></body></html>`;
export const ADMIN_CSS=`
#archive-inventory-panel{border:1px solid #d8cdb3;background:#fffdf7;border-radius:10px;padding:12px;margin:12px 0}#archive-inventory-rows{display:grid;gap:10px;max-height:460px;overflow:auto;overscroll-behavior:contain}#archive-inventory-rows .archive-inv-row{display:grid;gap:6px;min-width:0;border:1px solid #ddd3bc;border-radius:8px;padding:10px}#archive-inventory-rows .archive-inv-row input:not([type=checkbox]),#archive-inventory-rows .archive-inv-row select{box-sizing:border-box;width:100%;min-width:0}#archive-inventory-rows small{overflow-wrap:anywhere}#archive-inventory-panel button{white-space:normal}#archive-inventory-transfer{margin-top:12px;width:100%}

.saved-photo-tools{margin-top:6px;font-size:.8rem}.saved-photo-tools summary{cursor:pointer;color:#214c3d;font-weight:650;padding:6px 0}.saved-photo-tools label{display:block;font-size:.76rem;margin-top:6px}.saved-photo-tools textarea,.saved-photo-tools input{width:100%;min-width:0;box-sizing:border-box;font-size:.78rem}.saved-photo-tools button{font-size:.75rem;padding:5px 7px;margin:3px 3px 0 0;min-height:36px}.saved-photo-tools small{display:block;overflow-wrap:anywhere}.saved-photo-tools .saved-photo-remove{color:#9b2828;border-color:#cfa4a4}

.work-cover-group{display:grid;gap:8px;margin:0 0 10px}.work-cover-group>small{color:#637168}.work-cover-group .work-cover-upload>strong{display:block;font-size:.85rem;margin-bottom:5px;color:#214c3d}

.admin-app-refresh{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:#214c3d;color:#fff;font-weight:650;border-color:#214c3d;min-height:44px}
.admin-app-refresh span{font-size:1.45rem;line-height:1}
#admin-app-refresh-status{font-size:.85rem;color:#637168;margin:0 0 10px;overflow-wrap:anywhere}#admin-app-refresh-status:empty{display:none}
@media(max-width:500px){.admin-app-refresh{width:100%}}

.admin-home{padding:10px 0 12px;border-bottom:1px solid #e2e5dc;margin-bottom:12px}
.admin-home-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.admin-home-grid button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-width:0;min-height:70px;padding:7px 3px;font-size:.82rem;font-weight:650;line-height:1.25;border-color:#d4ded3;background:#f8faf5}
.admin-home-grid button span{font-size:1.6rem;line-height:1;color:#997a44}
.admin-home-grid button[aria-pressed=true],.admin-home-tools button[aria-pressed=true]{border-color:#214c3d;background:#e3eee5;box-shadow:inset 0 0 0 1px #214c3d}
.admin-home-tools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:9px}
.admin-home-tools button{padding:7px 3px;font-size:.78rem;font-weight:600;min-height:44px}
#admin-home-storage{font-size:.84rem;margin:6px 0;overflow-wrap:anywhere}#admin-home-storage:empty{display:none}
.admin-install-help{font-size:.81rem;color:#637168;margin-top:8px}.admin-install-help summary{cursor:pointer}.admin-install-help p{margin:6px 0}
@media(min-width:700px){.admin-home-grid{grid-template-columns:repeat(5,minmax(0,1fr))}}

.work-photo-panel{margin:16px 0;padding:13px;background:#f8fbf6;border:1px solid #cddccf;border-radius:12px}
.work-photo-panel h4{margin:0 0 7px;font:600 1.15rem Georgia,serif}
.work-photo-explain{font-size:.89rem;color:#53695b;margin:0 0 10px}
.work-photo-panel>label:not(.sandbox-checkbox){display:block;margin:8px 0 4px}
.work-photo-panel input[type=file]{display:block;max-width:100%;width:100%;font:inherit;margin:6px 0}
.work-photo-panel small{color:var(--muted)}
.work-photo-queue{list-style:none;padding:0;margin:10px 0;display:grid;gap:8px}
.work-photo-queue li{display:grid;grid-template-columns:65px minmax(0,1fr);gap:10px;padding:8px;border:1px solid #d4e0d5;border-radius:8px;background:#fff}
.work-photo-queue img{width:65px;height:65px;object-fit:cover;border-radius:5px}
.work-photo-queue label{display:block;min-width:0;font-size:.85rem;font-weight:600}
.work-photo-queue input{display:block;width:100%;min-width:0;padding:6px;border:1px solid #b3c1b4;border-radius:6px;font:inherit}
.work-photo-queue .photo-filename{font-size:.8rem;overflow-wrap:anywhere}
.work-photo-queue .photo-buttons{display:flex;flex-wrap:wrap;gap:5px;margin-top:5px}
.work-photo-queue .photo-buttons button{min-height:29px;padding:2px 8px;font-size:.78rem}
.work-photo-consent{margin:12px 0;font-size:.88rem}
#work-photo-upload{width:100%;margin:6px 0}
#work-photo-status{font-size:.85rem;overflow-wrap:anywhere}
.work-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px;padding:8px 0}
.work-photo-grid figure{margin:0;min-width:0}
.work-photo-grid img{width:100%;height:125px;object-fit:cover;border-radius:6px}
.work-photo-grid figcaption{font-size:.79rem;overflow-wrap:anywhere}
@media(max-width:500px){.work-photo-panel{padding:10px}.work-photo-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}

.work-help{margin:0 0 15px;color:var(--muted);font-size:.94rem}
.work-actions{align-items:center;margin:10px 0 4px}
.work-actions select{max-width:100%;min-width:145px;flex:1}
button.work-primary{background:#1e5648;color:#fff;font-weight:700;border-color:#1e5648;padding:11px 17px}
button.work-primary:hover{background:#164237}
.work-editor-form{border:1px solid #c6d8ca;background:#fbfdfb;padding:14px;border-radius:12px;margin:14px 0}
.work-editor-form h3{margin:0 0 10px}
.work-record-panel{margin-top:14px;border:1px solid #d5ddd4;border-radius:11px;background:#fafbf8}
.work-record-panel>summary{padding:15px 13px;cursor:pointer;font-weight:700;list-style:revert}
.work-record-inner{padding:0 12px 14px}
.work-muted{font-weight:400;color:var(--muted);font-size:.9rem}
.work-trash-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.work-trash-actions .work-trash-delete{color:#9b2828;border-color:#cfa4a4}.work-list-note{font-size:.82rem;color:var(--muted);margin:3px 0 10px}
.work-list-controls input{flex:1;min-width:160px;max-width:100%;padding:10px;border:1px solid #aeb9b1;border-radius:8px;font:inherit;color:var(--ink);background:#fff}
.work-compact-records li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 3px}
.work-row-text{min-width:0;flex:1}
.work-row-title{display:block;overflow-wrap:anywhere;line-height:1.35;font-weight:650}
.work-row-meta{display:block;font-size:.8rem;color:var(--muted);margin-top:3px}
.work-compact-records li button{flex-shrink:0;font-size:.88rem;padding:7px 10px;min-height:38px}
.work-history{margin-top:16px;border-top:1px solid var(--line);padding-top:10px}
.work-history summary{cursor:pointer;font-weight:650;padding:6px 0}
@media(max-width:540px){
 .work-actions{display:grid;grid-template-columns:minmax(0,1fr);gap:8px}
 .work-actions select,.work-actions .work-primary{width:100%}
 .work-editor-form{padding:10px}
 .work-record-inner{padding:0 9px 11px}
 .work-compact-records li button{padding:7px 9px}
 .work-list-controls{display:grid;grid-template-columns:1fr}
 .work-list-controls input{width:100%}
}

:root{color-scheme:light;--ink:#233e35;--gold:#ac8548;--muted:#637168;--line:#deddd3;--bg:#f6f5ef}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.55}
.wrap{width:min(990px,calc(100% - 34px));margin-inline:auto}
.masthead{background:linear-gradient(145deg,#244137,#38594d);color:#f8f4e8;padding:32px 0 28px;border-bottom:4px solid #be985a}
.eyebrow{font-size:.76rem;letter-spacing:.17em;color:#dfcda5;margin:0 0 8px}
h1{font:600 clamp(2.1rem,6vw,3.3rem)/1.2 Georgia,serif;margin:0}
.lead{color:#e4e8df;margin:10px 0 0}
main{padding-bottom:55px}
.notice{margin:24px 0;padding:15px 17px;background:#f1e8d3;border-left:4px solid var(--gold);border-radius:5px;font-size:.96rem}
section:not(.notice){background:#fff;border:1px solid var(--line);border-radius:12px;padding:18px;margin:20px 0;box-shadow:0 3px 13px #1c352510}
.heading{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:12px}
h2{font:600 clamp(1.24rem,3.8vw,1.55rem) Georgia,serif;margin:0}
small{color:var(--muted)}
button,select{font:inherit;border:1px solid #aeb9b1;border-radius:8px;background:#fff;color:var(--ink);padding:10px 13px;min-height:43px}
button{cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}
button:focus-visible,select:focus-visible{outline:3px solid #ba9455;outline-offset:2px}
.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
.stat{background:#f6f7f4;border:1px solid #e2e7df;border-radius:10px;padding:12px}
.stat b{display:block;font-size:1.65rem;line-height:1.4;font-variant-numeric:tabular-nums}
.stat span{color:var(--muted);font-size:.88rem}
.table-scroll{overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:.94rem}
th,td{text-align:left;border-bottom:1px solid var(--line);padding:9px 7px}
th{color:var(--muted);font-size:.85rem}
.number{text-align:right;font-variant-numeric:tabular-nums}
.controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
.controls label{font-weight:600}
.sandbox-form{display:grid;gap:10px}
.sandbox-form label{font-size:.91rem;font-weight:600}
.sandbox-form input[type=text],.sandbox-form textarea,.sandbox-form select{font:inherit;width:100%;border:1px solid #aeb9b1;border-radius:8px;padding:10px;background:#fff;color:var(--ink)}
.sandbox-form textarea{resize:vertical}
.work-cover-upload{display:grid;gap:8px;padding:10px;border:1px solid #cddccf;border-radius:8px;min-width:0}.work-cover-upload input{max-width:100%;width:100%;font:inherit}.work-cover-upload small{overflow-wrap:anywhere}.work-cover-upload img{width:100%;max-height:180px;object-fit:contain}
.sandbox-form [hidden]{display:none!important}.sandbox-form .work-date-help{font-size:.82rem;line-height:1.5;color:var(--ink);overflow-wrap:anywhere}.sandbox-form select{min-width:0;max-width:100%;font-size:16px}
.sandbox-checkbox{display:flex;gap:8px;align-items:center}
.sandbox-checkbox input{width:18px;height:18px}
.sandbox-line{display:flex;gap:9px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.sandbox-line button{font-size:.84rem;padding:7px 9px}
#work-attachment-panel .sandbox-line span,#work-attachment-status{min-width:0;overflow-wrap:anywhere;word-break:break-word}
#work-attachment-panel .sandbox-line{display:grid;grid-template-columns:minmax(0,1fr);gap:6px}#work-attachment-panel .sandbox-line button{justify-self:start}#work-attachment-panel small{font-size:.82rem;line-height:1.45}#work-attachment-panel .sandbox-line a{justify-self:start;overflow-wrap:anywhere}

.safe-list{padding-left:24px;line-height:1.6}.safe-list li{padding:5px 0}.audit-caution{color:#695a41;font-size:.86rem;padding:10px;background:#fff8e8;border-radius:6px}
.records{padding:0;margin:0;list-style:none}
.records li{padding:12px 2px;border-bottom:1px solid var(--line)}
.records strong{display:block;overflow-wrap:anywhere}
.records .detail{display:block;font-size:.83rem;color:var(--muted)}
.pagination{display:flex;gap:12px;justify-content:center;align-items:center;margin-top:15px}
#status{font-size:.91rem;color:#54665b}
footer{font-size:.83rem;color:var(--muted);text-align:center;padding:8px 0}
@media(max-width:440px){.masthead{padding-top:25px}.eyebrow{font-size:.65rem}.wrap{width:calc(100% - 26px)}section:not(.notice){padding:14px}}

.quick-links{margin:-3px 0 22px;display:flex;flex-wrap:wrap;gap:10px}
.quick-links a{display:inline-flex;align-items:center;border:1px solid #b4c5b9;border-radius:10px;padding:9px 13px;background:#fff;color:#244137;text-decoration:none;font-weight:650}
.quick-links a:focus-visible{outline:3px solid #b38c52;outline-offset:2px}
.admin-technical{border:1px solid #d8dcd4;border-radius:12px;background:#fff;margin:18px 0 25px}
.admin-technical>summary{cursor:pointer;font-weight:700;padding:16px 18px;list-style:revert}
.admin-technical .technical-content{padding:0 12px 15px}
.admin-technical .technical-content>section{margin:15px 0}
@media(max-width:500px){.admin-technical .technical-content{padding:0 7px 12px}.quick-links a{width:100%;justify-content:center}}
.admin-fold{border:1px solid #d8dcd4;border-radius:12px;background:#fff;margin:10px 0;box-shadow:0 2px 8px #1c352508}.admin-fold>summary,.admin-technical>summary{cursor:pointer;padding:13px 15px;font-weight:650;line-height:1.4}.admin-fold>summary small{display:block;margin-left:18px;font-weight:400;font-size:.78rem}.admin-fold-body{padding:0 13px 13px}.admin-help{border:1px solid #d8dcd4;border-radius:8px;padding:8px 10px;margin:5px 0}.admin-help>summary{font-size:.86rem;cursor:pointer;font-weight:600}.admin-help[open]>summary{margin-bottom:8px}.work-extra[open]{display:grid;gap:8px}.work-extra input{max-width:100%}.cover-url-details{margin-top:-4px}.admin-technical{margin:10px 0}.masthead{padding:18px 0 15px}.masthead h1{font-size:clamp(1.7rem,5vw,2.4rem)}.eyebrow{letter-spacing:.07em;margin-bottom:4px}.lead{margin:4px 0 0;font-size:.86rem}.notice{margin:12px 0;padding:9px 11px;font-size:.82rem}.quick-links{margin:0 0 10px}.quick-links a{padding:6px 10px;font-size:.85rem}section:not(.notice){margin:12px 0}.heading{margin-bottom:8px}#work-status{font-size:.82rem;color:var(--muted);margin:6px 0}.sandbox-form{gap:8px}.sandbox-form input[type=text],.sandbox-form textarea,.sandbox-form select{font-size:16px}.work-cover-upload{padding:8px}.work-cover-upload small{font-size:.78rem}.work-photo-explain{font-size:.82rem}.work-submit-actions{margin:14px 0;display:grid;gap:8px}.work-submit-actions .controls{margin:0}.work-submit-actions #work-publish{width:100%;min-height:48px}.work-submit-actions #work-submit-status{margin:0;font-size:.88rem;overflow-wrap:anywhere}.work-submit-actions #work-submit-status:empty{display:none}main{padding-bottom:20px}
`;
export const ADMIN_JS=`
'use strict';
const $=id=>document.getElementById(id);
const names={
 people:'Hồ sơ Chức sắc',posts:'Bài biên khảo',media:'Hình ảnh',videos:'Video',
 obituaries:'Ai tín',documents:'Tài liệu số hóa',gdd_memorials:'Tưởng niệm',
 gdd_audio_programs:'Âm thanh Đại Đạo',gdd_calendar_memorials:'Lịch tưởng niệm',
 archive_gallery_images:'Ảnh trong album',gdd_content_placements:'Phân loại tư liệu',
 gdd_r2_assets:'Chỉ mục tài sản R2',admin_users:'Tài khoản cũ',submissions:'Tư liệu gửi về',
 gdd_album_photo_counters:'Bộ đếm ảnh',gdd_content_metrics:'Thống kê bài',
 gdd_content_metric_events:'Lượt xem/tải',gdd_site_download_events:'Lượt tải website',
 gdd_site_download_totals:'Tổng lượt tải',gdd_visit_sessions:'Phiên truy cập',
 gdd_visit_totals:'Tổng lượt truy cập'
};
const pageSize=15;
let offset=0,hasNext=false;
async function api(path){
 const res=await fetch(path,{credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'});
 if(!res.ok)throw Error(res.status===403?'Phiên truy cập không được phép':('Lỗi máy chủ ('+res.status+')'));
 return res.json();
}
function setStatus(msg){$('status').textContent=msg;}
function appendText(parent,tag,value,cls){
 const node=document.createElement(tag);node.textContent=String(value??'');
 if(cls)node.className=cls;parent.append(node);return node;
}
async function initAdmin(){
 try{
  const session=await api('/api/v1/admin/session');
  if(session.authenticated!==true||session.write_enabled!==false)throw Error('Phiên quản trị chưa hợp lệ');
  $('work-editor-panel').hidden=session.working_editor_enabled!==true;
  $('r2-managed-panel').hidden=session.managed_r2_enabled!==true;
  if(session.working_editor_enabled===true){workList().catch(()=>{});await workRestorePhotoDraft();}
 }catch(e){workStatus('Không thể kết nối quản trị: '+e.message);$('work-editor-panel').hidden=false;$('work-new').disabled=true;}
}
async function overview(){
 try{
  const summary=await api('/api/v1/admin/summary');
  const inventory=$('inventory'),cards=$('overview');inventory.replaceChildren();cards.replaceChildren();
  for(const [count,label] of [
    [summary.source_total,'Bản ghi nguồn (bản chụp 23/11)'],
    [summary.total_records,'Bản ghi D1 làm việc'],
    [summary.remaining_records,'Chênh lệch còn lại'],
    [summary.table_count,'Bảng dữ liệu'],
    [summary.published_records,'Bản ghi công khai (9 nhóm)'],
    [summary.gallery_images,'Ảnh album'],
    [summary.r2_asset_records,'Chỉ mục R2 trong D1']
   ]){
    const div=document.createElement('div');div.className='stat';
    appendText(div,'b',Number(count).toLocaleString('vi-VN'));appendText(div,'span',label);cards.append(div);
   }
   const audit=summary.source_integrity_snapshot;
   const auditList=$('safety-report');auditList.replaceChildren();
   for(const message of [
     'Hồ sơ Chức sắc chưa công bố: '+audit.people.unpublished+' — giữ riêng, không phát hành.',
     'Chỉ mục tài sản R2: '+audit.r2_asset_metadata.rows
       +' — '+audit.r2_asset_metadata.preview_ready+' đã đánh dấu sẵn bản xem.',
     'Ảnh album có đầy đủ liên kết và mã ảnh: '
       +(audit.gallery.rows-audit.gallery.without_image_url-audit.gallery.without_photo_code)
       +'/'+audit.gallery.rows+' (số liệu kiểm tra metadata).',
     'Hồ sơ quản trị và tư liệu độc giả gửi về đã được phục hồi trong D1 riêng; nội dung nhạy cảm không hiển thị tại giao diện.',
     'Đối tượng vật lý hiện diện trong kho R2 tại bản chụp: '
       +summary.r2_object_inventory_snapshot.object_count.toLocaleString('vi-VN')
       +' ('+(summary.r2_object_inventory_snapshot.total_bytes/1073741824).toFixed(2)+' GiB).'
       +' Đây không phải số chỉ mục tài sản đã nhập D1.'
   ])appendText(auditList,'li',message);
   for(const item of summary.inventory){
    const tr=document.createElement('tr');appendText(tr,'td',names[item.table]||item.table);
    appendText(tr,'td',Number(item.source_count).toLocaleString('vi-VN'),'number');
    appendText(tr,'td',Number(item.count).toLocaleString('vi-VN'),'number');
    appendText(tr,'td',Number(item.remaining).toLocaleString('vi-VN'),'number');inventory.append(tr);
   }
   setStatus(summary.row_counts_match_snapshot===true
     ? 'Đã xác thực · D1 làm việc đang hoạt động · Đối chiếu 21 bảng với bản chụp ngày 23/11/2026'
     : 'Đã có thay đổi so với bản chụp 23/11/2026 · Kiểm tra các bản ghi mới hoặc chỉnh sửa trong D1 làm việc.');
 }catch(err){setStatus('Không thể đối chiếu D1: '+err.message)}
}
async function auditR2(){
 const button=$('r2-audit'),status=$('r2-live-status');
 button.disabled=true;status.textContent='Đang kiểm kê trực tiếp từ Cloudflare R2…';
 try{
   const result=await api('/api/v1/admin/r2/inventory');
   if(result.coverage!=='complete_listing_metadata_only'||result.original_bytes_read!==false||
       result.write_enabled!==false)throw Error('Kết quả không hợp lệ');
   const count=Number(result.objects).toLocaleString('vi-VN');
   const size=(Number(result.total_bytes)/1073741824).toFixed(2)+' GiB';
   status.textContent='R2 trực tiếp: '+count+' đối tượng, '+size+
     '. '+(result.matches_baseline?'Khớp bản chụp ngày 23/11/2026.':'Khác bản chụp ngày 23/11/2026; cần đối chiếu thay đổi.')+
     ' Không đọc nội dung hay sửa tệp gốc.';
 }catch(e){status.textContent='Chưa xác minh được kho R2: '+e.message;}
 finally{button.disabled=false;}
}
async function loadRecords(){
 const kind=$('kind').value,view=$('view').value,records=$('record-list');
 records.replaceChildren();appendText(records,'li','Đang tải tư liệu…');
 try{
  const result=await api('/api/v1/admin/records?kind='+encodeURIComponent(kind)+'&view='+encodeURIComponent(view)+'&limit='+pageSize+'&offset='+offset);
  records.replaceChildren();
  const rows=Array.isArray(result.data)?result.data:[];
  hasNext=rows.length===pageSize;
  for(const r of rows){
   const item=document.createElement('li');
   appendText(item,'strong',r.title||'(Chưa có tiêu đề)');
   appendText(item,'span',[r.category,r.archive_code,r.created_at?.slice(0,10)].filter(Boolean).join(' · '),'detail');
   records.append(item);
  }
  if(!rows.length)appendText(records,'li','Không có bản ghi trong trạng thái được chọn.');
  $('page').textContent='Trang '+(Math.floor(offset/pageSize)+1);
  $('previous').disabled=offset===0;$('next').disabled=!hasNext;
 }catch(e){
  records.replaceChildren();appendText(records,'li','Lỗi tải danh sách: '+e.message);
  $('previous').disabled=true;$('next').disabled=true;
 }
}
$('refresh').addEventListener('click',overview);
$('r2-audit').addEventListener('click',auditR2);
// Cloudflare Access R2 originals: use the already tested private R2 gateway.
const managedBase='/api/v1/admin/r2/managed';
let managedFile=null,managedAsset=null,managedPreviewReady=false,managedPdfPageCount=0;
function managedStatus(message){$('r2-managed-status').textContent=message}
async function managedRequest(path,{method='GET',data=null,type='application/json'}={}){
 const h={};
 if(data!==null)h['Content-Type']=type;
 const r=await fetch(managedBase+path,{method,body:data,headers:h,
  credentials:'same-origin',cache:'no-store'});
 const json=await r.json().catch(()=>({error:'invalid_response'}));
 if(!r.ok)throw Error(json.error||('HTTP '+r.status));
 return json;
}
async function managedUpload(){
 const file=$('r2-managed-file').files[0],button=$('r2-managed-upload');
 if(!file){managedStatus('Hãy chọn ảnh/PDF/Word cần lưu.');return}
 if(file.size<1||file.size>1024*1024*1024){managedStatus('Chỉ nhận tệp tối đa 1 GiB trong lần tải này.');return}
 button.disabled=true;managedFile=null;managedAsset=null;managedPreviewReady=false;managedPdfPageCount=0;
 $('r2-managed-actions').hidden=true;
 try{
  let info;
  if(file.size<=6*1024*1024){
   managedStatus('Đang lưu nguyên mẫu R2…');
   info=await managedRequest('/v1/uploads/small?name='+encodeURIComponent(file.name)+
     '&size='+file.size,{method:'PUT',data:file,type:file.type||'application/octet-stream'});
  }else{
   managedStatus('Đang tạo phiên tải nhiều phần…');
   const started=await managedRequest('/v1/uploads/start',{method:'POST',
     data:JSON.stringify({name:file.name,size:file.size})});
   if(!started.id||!started.key||!started.uploadId||started.partBytes!==8*1024*1024)
     throw Error('Phiên tải nhiều phần không hợp lệ');
   const parts=[];
   const total=Math.ceil(file.size/started.partBytes);
   for(let i=0;i<total;i++){
    managedStatus('Đang lưu phần '+(i+1)+'/'+total+' vào R2…');
    const slice=file.slice(i*started.partBytes,Math.min(file.size,(i+1)*started.partBytes));
    const done=await managedRequest('/v1/uploads/part?key='+encodeURIComponent(started.key)+
      '&uploadId='+encodeURIComponent(started.uploadId)+'&part='+(i+1),
      {method:'PUT',data:slice,type:'application/octet-stream'});
    if(done.partNumber!==i+1||typeof done.etag!=='string')throw Error('Phần tệp không xác minh được');
    parts.push({partNumber:done.partNumber,etag:done.etag});
   }
   info=await managedRequest('/v1/uploads/complete',{method:'POST',
     data:JSON.stringify({key:started.key,uploadId:started.uploadId,size:file.size,parts})});
  }
  if(!info?.originalPreserved||!info.id||info.publiclyAccessible!==false)
   throw Error('Máy chủ chưa xác nhận bản gốc riêng tư');
  managedFile=file;managedAsset=info.id;
  $('r2-managed-public-confirm').checked=false;$('r2-managed-download-confirm').checked=false;
  const isImage=file.type.startsWith('image/');
  $('r2-managed-derivative').disabled=!isImage;
  $('r2-managed-pdf-pages').disabled=file.type!=='application/pdf';
  $('r2-managed-docx-pages').disabled=file.type!=='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  $('r2-managed-actions').hidden=false;
  managedStatus('Đã bảo tồn nguyên mẫu riêng tư ('+(file.size/1048576).toFixed(1)+
    ' MB). Mã R2: '+info.id+'. '+(isImage?'Tạo bản xem trước khi công bố.':'Tài liệu vẫn riêng tư; cần bản đọc PDF/DOCX từng trang.'));
 }catch(e){managedStatus('Chưa hoàn tất tải R2: '+e.message)}
 finally{button.disabled=false}
}
async function managedImageBlob(image,type,maxDimension,quality){
 const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
 if(!width||!height)throw Error('Không đọc được kích thước ảnh');
 const scale=Math.min(1,maxDimension/Math.max(width,height));
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(width*scale));
 canvas.height=Math.max(1,Math.round(height*scale));
 const ctx=canvas.getContext('2d');
 if(!ctx)throw Error('Không thể tạo ảnh xem trên thiết bị');
 if(type==='image/jpeg'){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height)}
 ctx.drawImage(image,0,0,canvas.width,canvas.height);
 return new Promise((resolve,reject)=>canvas.toBlob(
  blob=>{canvas.width=1;canvas.height=1;blob?resolve(blob):reject(Error('Không kết xuất được ảnh xem'))},
  type,quality));
}
async function managedDerivatives(){
 if(!managedFile||!managedAsset||!managedFile.type.startsWith('image/')){
  managedStatus('Chỉ ảnh mới hỗ trợ tạo bản xem tự động.');return
 }
 const btn=$('r2-managed-derivative');btn.disabled=true;
 const src=URL.createObjectURL(managedFile);
 try{
  managedStatus('Đang tạo ảnh xem tối ưu trên điện thoại…');
  const image=new Image();
  await new Promise((resolve,reject)=>{
   image.onload=resolve;image.onerror=()=>reject(Error('Không đọc được ảnh'));
   image.src=src;
  });
  let preview=await managedImageBlob(image,'image/webp',1800,0.8);
  let type='image/webp';
  const header=new Uint8Array(await preview.slice(0,12).arrayBuffer());
  if(header[0]!==82||header[1]!==73||header[8]!==87){
   preview=await managedImageBlob(image,'image/jpeg',1800,0.83);type='image/jpeg';
  }
  if(preview.size>8*1024*1024)throw Error('Ảnh xem vượt mức 8 MB');
  await managedRequest('/v1/assets/'+managedAsset+'/preview',
    {method:'PUT',data:preview,type});
  managedStatus('Đã tạo ảnh xem. Đang tạo bản in JPEG tối ưu…');
  const print=await managedImageBlob(image,'image/jpeg',3600,0.88);
  if(print.size>8*1024*1024)throw Error('Ảnh bản in vượt 8 MB; cần giảm kích thước.');
  await managedRequest('/v1/assets/'+managedAsset+'/download',
    {method:'PUT',data:print,type:'image/jpeg'});
  managedPreviewReady=true;
  managedStatus('Đã lưu bản xem và bản JPEG tối ưu. Nguyên mẫu vẫn riêng tư. Chỉ công bố khi đã kiểm tra và xác nhận.');
 }catch(e){managedStatus('Chưa tạo xong bản xem: '+e.message)}
 finally{btn.disabled=false;URL.revokeObjectURL(src)}
}
async function managedPdfPages(){
 if(!managedFile||!managedAsset||managedFile.type!=='application/pdf'){
   managedStatus('Chức năng này chỉ dành cho PDF, không tác động DOCX gốc.');return
 }
 if(managedFile.size>45*1024*1024){
   managedStatus('PDF trên 45 MB cần chia tài liệu thành tập nhỏ trước khi tạo bản đọc trên điện thoại.');return
 }
 const button=$('r2-managed-pdf-pages');button.disabled=true;
 let pdf=null;
 try{
  managedStatus('Đang mở PDF bằng bộ đọc tài liệu trên máy, không gửi bản gốc đến CDN…');
  const url='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs';
  const lib=await import(url);
  lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
  const source=new Uint8Array(await managedFile.arrayBuffer());
  pdf=await lib.getDocument({data:source}).promise;
  if(!Number.isInteger(pdf.numPages)||pdf.numPages<1||pdf.numPages>120)
    throw Error('Bản đọc chỉ hỗ trợ tối đa 120 trang mỗi tập.');
  for(let n=1;n<=pdf.numPages;n++){
   managedStatus('Đang tạo bản xem trang '+n+'/'+pdf.numPages+'…');
   const page=await pdf.getPage(n);
   const initial=page.getViewport({scale:1});
   const scale=Math.min(2.2,1800/Math.max(initial.width,initial.height));
   const viewport=page.getViewport({scale});
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(viewport.width));
   canvas.height=Math.max(1,Math.round(viewport.height));
   const ctx=canvas.getContext('2d',{alpha:false});
   if(!ctx)throw Error('Thiết bị không tạo được ảnh trang');
   await page.render({canvasContext:ctx,viewport}).promise;
   let jpeg=await new Promise((resolve,reject)=>canvas.toBlob(
     blob=>blob?resolve(blob):reject(Error('Không tạo được JPEG trang '+n)),
     'image/jpeg',0.84));
   if(jpeg.size>3*1024*1024)jpeg=await new Promise((resolve,reject)=>canvas.toBlob(
     blob=>blob?resolve(blob):reject(Error('Không nén được trang '+n)),
     'image/jpeg',0.65));
   if(jpeg.size<32||jpeg.size>3*1024*1024)
     throw Error('Trang '+n+' không đạt dung lượng bản xem');
   await managedRequest('/v1/assets/'+managedAsset+'/page/'+n,
     {method:'PUT',data:jpeg,type:'image/jpeg'});
   canvas.width=0;canvas.height=0;
   page.cleanup();
  }
  managedPdfPageCount=pdf.numPages;managedPreviewReady=true;
  managedStatus('Đã lưu đủ '+pdf.numPages+' trang JPEG vào R2. Xin kiểm tra chất lượng rồi xác nhận công bố bản đọc.');
 }catch(e){managedPdfPageCount=0;managedPreviewReady=false;
   managedStatus('Chưa tạo xong bản đọc PDF: '+e.message)}
 finally{button.disabled=false;try{await pdf?.destroy()}catch{}}
}

// Browser-only DOCX text rendition. No DOCX source bytes leave the user's browser
// except for the separately Access-authenticated private R2 original upload.
const MAMMOTH_BROWSER='https://cdn.jsdelivr.net/npm/mammoth@1.13.0/mammoth.browser.min.js';
let mammothPromise=null;
function loadMammoth(){
 if(window.mammoth?.extractRawText)return Promise.resolve(window.mammoth);
 if(mammothPromise)return mammothPromise;
 mammothPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src=MAMMOTH_BROWSER;
  script.async=true;
  script.onload=()=>window.mammoth?.extractRawText?resolve(window.mammoth):
    reject(Error('Không mở được thư viện bản đọc DOCX'));
  script.onerror=()=>reject(Error('Không tải được bộ đọc Word'));
  document.head.append(script);
 });
 return mammothPromise;
}
function wrapWordText(ctx,value,maxWidth){
 // Render via Canvas text only, never use raw DOCX HTML or execute macros.
 const lines=[];
 for(const para of value.split(String.fromCharCode(13)).join('').split(String.fromCharCode(10))){
  const words=para.trim().replaceAll(String.fromCharCode(9),' ').split(' ').filter(Boolean);
  if(!words.length){lines.push('');continue}
  let line='';
  for(let word of words){
   if(!line && ctx.measureText(word).width>maxWidth){
    while(word.length){
     let n=1;
     while(n<word.length&&ctx.measureText(word.slice(0,n+1)).width<=maxWidth)n++;
     lines.push(word.slice(0,n));word=word.slice(n);
    }
    continue;
   }
   if(line&&ctx.measureText(line+' '+word).width>maxWidth){
    lines.push(line);line=word;
   }else line=line?line+' '+word:word;
  }
  if(line)lines.push(line);
 }
 return lines;
}
async function managedDocxPages(){
 const mime='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 if(!managedFile||!managedAsset||managedFile.type!==mime){
  managedStatus('Vui lòng chọn DOCX và lưu bản gốc riêng tư trước.');return;
 }
 if(managedFile.size>35*1024*1024){
  managedStatus('DOCX vượt 35 MB: xin tạo PDF và gửi bản đọc theo từng tập.');return;
 }
 const button=$('r2-managed-docx-pages');button.disabled=true;
 try{
  managedStatus('Đang đọc chữ trong DOCX cục bộ (không tải lên dịch vụ chuyển đổi)…');
  const reader=await loadMammoth();
  const result=await reader.extractRawText({arrayBuffer:await managedFile.arrayBuffer()});
  const raw=String(result.value||'').split(String.fromCharCode(0)).join('').trim();
  if(raw.length<20)throw Error('Tài liệu không có đủ chữ. Hãy xuất DOCX có hình ảnh thành PDF để giữ nguyên nội dung.');
  if(raw.length>200000)throw Error('Tài liệu quá dài; xin chia thành nhiều tập rồi tải lại.');
  const canvas=document.createElement('canvas');
  canvas.width=1400;canvas.height=2000;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw Error('Thiết bị không tạo được ảnh bản đọc');
  ctx.font='31px Georgia, serif';
  const lines=wrapWordText(ctx,raw,1160);
  const perPage=38;
  const pageCount=Math.ceil(lines.length/perPage);
  if(pageCount<1||pageCount>120)throw Error('Bản đọc chỉ hỗ trợ tối đa 120 trang mỗi tập.');
  for(let i=0;i<pageCount;i++){
   managedStatus('Đang tạo bản đọc chữ DOCX trang '+(i+1)+'/'+pageCount+'…');
   ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.fillStyle='#202c27';ctx.font='31px Georgia, serif';ctx.textBaseline='top';
   const pageLines=lines.slice(i*perPage,(i+1)*perPage);
   pageLines.forEach((line,j)=>ctx.fillText(line,110,122+j*44));
   ctx.fillStyle='#52665b';ctx.font='24px Georgia, serif';
   ctx.fillText('DẤU XƯA CỬA ĐẠO  ·  BẢN ĐỌC CHỮ DOCX',110,1840);
   ctx.fillText('Trang '+(i+1)+' / '+pageCount,110,1880);
   const image=await new Promise((resolve,reject)=>canvas.toBlob(
    blob=>blob?resolve(blob):reject(Error('Không tạo được trang '+(i+1))),
    'image/jpeg',0.85));
   if(image.size>3*1024*1024||image.size<32)throw Error('Ảnh trang vượt mức lưu trữ.');
   await managedRequest('/v1/assets/'+managedAsset+'/page/'+(i+1),
     {method:'PUT',data:image,type:'image/jpeg'});
  }
  canvas.width=0;canvas.height=0;
  managedPdfPageCount=pageCount;managedPreviewReady=true;
  managedStatus('Đã tạo '+pageCount+' trang đọc chữ DOCX. Hình ảnh nhúng và bố cục phức tạp không được chuyển; xin đối chiếu trước khi công bố.');
 }catch(e){
  managedPdfPageCount=0;managedPreviewReady=false;
  managedStatus('Chưa tạo xong bản đọc DOCX: '+e.message);
 }finally{button.disabled=false}
}

async function managedPublish(){
 const btn=$('r2-managed-publish');
 if(!managedAsset||!managedPreviewReady){managedStatus('Cần tạo bản xem hợp lệ trước khi công bố.');return}
 if(!$('r2-managed-public-confirm').checked){managedStatus('Cần xác nhận đã kiểm tra ảnh trước khi công bố.');return}
 if(!confirm('Công bố ảnh xem tối ưu, không phải bản gốc R2?'))return;
 btn.disabled=true;
 try{
  const isPdf=managedFile?.type==='application/pdf';
  const isDocx=managedFile?.type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const payload=isPdf
    ?{publish:true,pageCount:managedPdfPageCount,viewSource:'pdf'}
    :isDocx
    ?{publish:true,pageCount:managedPdfPageCount,viewSource:'docx_text'}
    :{publish:true,allowDownload:$('r2-managed-download-confirm').checked};
  const out=await managedRequest('/v1/assets/'+managedAsset+'/publication',
    {method:'POST',data:JSON.stringify(payload)});
  if(out.published!==true||out.originalPrivate!==true)throw Error('R2 chưa xác minh công bố');
  managedStatus('Đã công bố bản xem an toàn. Độc giả có thể mở từ trình đọc khi bài đã liên kết mã tài sản '+managedAsset+'.');
 }catch(e){managedStatus('Chưa công bố được bản xem: '+e.message)}
 finally{btn.disabled=false}
}
$('r2-managed-upload').addEventListener('click',managedUpload);
$('r2-managed-derivative').addEventListener('click',managedDerivatives);
$('r2-managed-pdf-pages').addEventListener('click',managedPdfPages);
$('r2-managed-docx-pages').addEventListener('click',managedDocxPages);
$('r2-managed-publish').addEventListener('click',managedPublish);


async function loadContributions(){
 const label=$('contribution-status'),list=$('contribution-list');
 label.textContent='Đang tải hộp thư riêng từ D1…';
 try{
  const res=await api('/api/v1/admin/contributions');
  if(res.private!==true||!Array.isArray(res.data))throw Error('Hộp thư trả về dữ liệu không hợp lệ');
  list.replaceChildren();
  for(const record of res.data){
   const item=document.createElement('li');
   item.className='sandbox-line';
   const detail=document.createElement('div');
   appendText(detail,'strong',String(record.title||'(Không có tiêu đề)'));
   appendText(detail,'p','Người gửi: '+String(record.sender_name||'')+' · '+String(record.sender_email||''));
   appendText(detail,'p',[record.category,record.status,record.created_at?.slice(0,10)].filter(Boolean).join(' · '));
   appendText(detail,'p',String(record.description||''));
   if(record.source)appendText(detail,'p','Xuất xứ: '+String(record.source));
   if(record.source_url){
     try{
       const url=new URL(record.source_url);
       if(url.protocol==='https:'&&!url.username&&!url.password){
         const link=document.createElement('a');link.href=url.href;
         link.target='_blank';link.rel='noopener noreferrer';
         link.textContent='Mở liên kết tư liệu';detail.append(link);
       }
     }catch{}
   }
   const filePath=String(record.file_path||'');
   const prefix='contributions/pending/'+String(record.id||'')+'/attachment.';
   const ext=filePath.startsWith(prefix)?filePath.slice(prefix.length):'';
   if(['jpg','png','webp','pdf'].includes(ext)){
     const download=document.createElement('a');
     download.href='/api/v1/admin/contributions/'+encodeURIComponent(record.id)+'/attachment';
     download.textContent='Tải tệp đính kèm riêng tư';
     download.rel='nofollow';detail.append(download);
   }
   const choices=document.createElement('div');choices.className='controls';
   for(const [status,label] of [
     ['reviewing','Đang thẩm định'],['approved','Đã tiếp nhận vào kho'],['rejected','Không tiếp nhận']
   ]){
     if(status===record.status)continue;
     const button=document.createElement('button');button.type='button';
     button.textContent=label;
     button.addEventListener('click',async()=>{
       if(!confirm('Chuyển tư liệu sang trạng thái: '+label+'? Tệp đính kèm vẫn được bảo tồn riêng tư.'))return;
       button.disabled=true;
       try{
         const response=await workWrite('/api/v1/admin/contributions/'+encodeURIComponent(record.id)+'/review',
           'POST',{expected_status:record.status,status});
         if(response.status!==status||response.private!==true)throw Error('Trạng thái chưa được xác nhận');
         await loadContributions();
       }catch(error){$('contribution-status').textContent='Chưa thay đổi được: '+error.message}
       finally{button.disabled=false}
     });
     choices.append(button);
   }
   detail.append(choices);
   item.append(detail);list.append(item);
  }
  if(!res.data.length)appendText(list,'li','Chưa có tư liệu mới.');
  label.textContent='Đang hiển thị '+res.data.length+' tư liệu đã tiếp nhận; chỉ quản trị viên có quyền truy cập.';
 }catch(e){
  label.textContent='Không tải được hộp thư: '+e.message;
 }
}
$('contribution-refresh').addEventListener('click',loadContributions);
$('contribution-panel').addEventListener('toggle',()=>{if($('contribution-panel').open)loadContributions()});

// A single secure writer used by the real, versioned D1 editorial panel.
async function workWrite(path,method,payload){
 const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(payload)});
 const data=await response.json().catch(()=>({error:'invalid_response'}));
 if(!response.ok)throw Error(data.error||('HTTP '+response.status));
 return data;
}
// D1 WORKING EDITOR. All fields use DOM textContent/value; no unsafe HTML insertion.
const workFields={
 people:['full_name','branch','rank','subgroup','gender','date_notes','death_lunar_day','death_lunar_month','death_lunar_leap','death_solar_date','summary','biography','sources','image_url','verified','published','sort_order'],
 posts:['title','category','summary','body','sources','person_id','cover_url','verified','published'],
 media:['title','category','caption','sources','image_url','person_id','published'],
 videos:['title','summary','body','video_url','cover_url','sources','person_id','published'],
 obituaries:['title','deceased_name','memorial_date','summary','body','cover_url','sources','person_id','published'],
 documents:['title','subfolder_code','document_number','document_date','summary','body','sources','cover_url','file_url','person_id','published'],
 gdd_memorials:['title','person_name','rank_title','death_date','anniversary_date','summary','body','portrait_url','sources','published'],
 gdd_audio_programs:['title','category','summary','body','cover_url','audio_url','episode_number','duration_seconds','published_date','published'],
 gdd_calendar_memorials:['full_name','rank','calendar_system','lunar_day','lunar_month','lunar_leap','solar_day','solar_month','death_year','image_url','source_note','description','linked_person_id','published']
};
const workBool=new Set(['verified','published','death_lunar_leap','lunar_leap']);
const workNums=new Set(['sort_order','death_lunar_day','death_lunar_month','lunar_day','lunar_month','solar_day','solar_month','death_year','episode_number','duration_seconds']);
const workDateFields=new Set(['published_date','death_solar_date']);
function normalizeEditorialDate(value){
 const text=String(value??'').trim();if(!text)return null;
 const iso=/^(\\d{4})-(\\d{1,2})-(\\d{1,2})$/.exec(text),local=/^(\\d{1,2})[\\/.-](\\d{1,2})[\\/.-](\\d{4})$/.exec(text);
 if(!iso&&!local)throw Error('invalid_date');
 const y=Number(iso?iso[1]:local[3]),m=Number(iso?iso[2]:local[2]),d=Number(iso?iso[3]:local[1]);
 if(y<1000||y>9999||m<1||m>12||d<1||d>31)throw Error('invalid_date');
 const dt=new Date(Date.UTC(y,m-1,d));if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==m-1||dt.getUTCDate()!==d)throw Error('invalid_date');
 return String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}
const workLong=new Set(['summary','body','biography','caption','date_notes','sources','description','source_note']);
const workLabels={
 full_name:'Thánh danh / Họ tên',title:'Nhan đề',secular_name:'Thế danh',rank:'Phẩm vị',branch:'Cơ quan',
 subgroup:'Phân nhóm',gender:'Nam / Nữ',years:'Niên đại',birthplace:'Nguyên quán',summary:'Tóm tắt',
 biography:'Tiểu sử - công nghiệp',body:'Nội dung',sources:'Tư liệu tham khảo',image_url:'Ảnh đại diện (URL)',
 cover_url:'Ảnh bìa (URL)',portrait_url:'Di ảnh (URL)',file_url:'Tài liệu (URL)',audio_url:'Âm thanh (URL)',
 video_url:'Video (URL)',published:'Công bố nội dung',verified:'Đã kiểm chứng',sort_order:'Thứ tự',
 caption:'Chú thích ảnh',category:'Chuyên mục',person_id:'Mã hồ sơ liên quan',
 document_number:'Số hiệu văn kiện',document_date:'Ngày văn kiện',subfolder_code:'Danh mục lưu trữ',
 death_lunar_day:'Ngày qui vị âm lịch',death_lunar_month:'Tháng qui vị âm lịch',
 death_lunar_leap:'Tháng nhuận',death_solar_date:'Ngày qui vị dương lịch',
 person_name:'Danh xưng',rank_title:'Phẩm vị',death_date:'Ngày qui vị',anniversary_date:'Ngày tưởng niệm',deceased_name:'Danh xưng người qui vị',memorial_date:'Ngày qui vị / ngày lễ',published_date:'Ngày phát hành',episode_number:'Số chương trình',duration_seconds:'Thời lượng (giây)',calendar_system:'Loại lịch',description:'Nội dung',source_note:'Tư liệu tham khảo',linked_person_id:'Hồ sơ Chức sắc liên quan',
 lunar_day:'Ngày âm',lunar_month:'Tháng âm',lunar_leap:'Tháng nhuận',
 solar_day:'Ngày dương',solar_month:'Tháng dương',death_year:'Năm qui vị',date_notes:'Ghi chú niên đại'
};
let workOffset=0,workCurrent=null,workFieldInputs=new Map();
let workBusy=false;const workCoverQueue=new Map();const workCoverControls=new Map();let workAudioFile=null,workAudioPrepared=null;
function workClearCovers(){for(const item of workCoverQueue.values())if(item.localUrl)URL.revokeObjectURL(item.localUrl);workCoverQueue.clear();workCoverControls.clear();workAudioFile=null;workAudioPrepared=null}
const photoDraftKey='gdd-admin-photo-draft-v1';
let workDraftToken=null,workCoverDb=null;
const workCoverRecoveryLimit=24*1048576;
function workCoverStorage(){
 if(!workCoverDb)workCoverDb=new Promise((resolve,reject)=>{
  const req=indexedDB.open('gdd-admin-cover-recovery-v1',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('covers');
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 }).catch(()=>{workCoverDb=null;return null});
 return workCoverDb;
}
async function workCoverDisk(mode,key,value){
 if(!key)return null;
 try{
  const db=await workCoverStorage();if(!db)return null;
  return await new Promise((resolve,reject)=>{
   const tx=db.transaction('covers',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('covers');
   const req=mode==='get'?store.get(key):mode==='put'?store.put(value,key):store.delete(key);
   tx.oncomplete=()=>resolve(mode==='get'?req.result:true);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
 }catch{return null}
}
function workForgetPhotoDraft(){
 const token=workDraftToken;workDraftToken=null;
 try{sessionStorage.removeItem(photoDraftKey)}catch{}
 if(token)void workCoverDisk('delete',token);
}
function workKeepPhotoDraft(){
 if(!workCurrent||$('work-edit-area').hidden)return;
 try{
  if(!workDraftToken)workDraftToken=crypto.randomUUID();
  const fields={};
  for(const [key,input] of workFieldInputs)if(key!=='published')fields[key]=input.type==='checkbox'?input.checked:input.value;
  sessionStorage.setItem(photoDraftKey,JSON.stringify({kind:workCurrent.kind,id:workCurrent.id||null,version:workCurrent.record?.gdd_version??null,token:workDraftToken,fields,date:$('work-death-date')?.value??null,at:Date.now()}));
 }catch{}
}
async function workKeepCoverFiles(){
 workKeepPhotoDraft();
 const token=workDraftToken;
 if(!token)return false;
 const covers=[];
 for(const [field,item] of workCoverQueue){
  if(item.file.size>workCoverRecoveryLimit)continue;
  covers.push({field,file:item.file,assetId:item.assetId||null,previewReady:!!item.previewReady,published:!!item.published,linked:!!item.linked});
 }
 return !!await workCoverDisk('put',token,{covers,at:Date.now()});
}
async function workRestorePhotoDraft(){
 let draft;
 try{draft=JSON.parse(sessionStorage.getItem(photoDraftKey)||'null')}catch{return}
 if(!draft||!Object.hasOwn(workFields,draft.kind)||!draft.fields||typeof draft.fields!=='object'||workCurrent)return;
 if(draft.id&&!/^[a-f0-9-]{36}$/i.test(draft.id))return;
 if(draft.at&&Date.now()-draft.at>86400000){workDraftToken=draft.token||null;workForgetPhotoDraft();return}
 $('work-kind').value=draft.kind;
 if(draft.id)await workOpen(draft.kind,draft.id);else await workNew();
 if(workCurrent?.kind!==draft.kind||(workCurrent.id||null)!==draft.id)return;
 if(draft.id&&workCurrent.record?.gdd_version!==draft.version){workStatus('Bản trên máy chủ đã thay đổi; không tự ghi đè nội dung.');return}
 // Rebuild classification/date controls from the saved field values, retaining the server version for edits.
 const snapshot={...workCurrent.record};
 for(const key of workFields[draft.kind])if(key!=='published'&&Object.hasOwn(draft.fields,key))snapshot[key]=draft.fields[key];
 workBuild(draft.kind,snapshot);
 if(draft.date!==null&&typeof draft.date==='string'&&$('work-death-date')){$('work-death-date').value=draft.date;$('work-death-date').dispatchEvent(new Event('input'))}
 workDraftToken=draft.token||crypto.randomUUID();
 const cached=await workCoverDisk('get',workDraftToken);
 let recovered=0;
 for(const item of cached?.covers||[]){
  if(!workCoverControls.has(item.field)||!(item.file instanceof Blob))continue;
  const file=item.file instanceof File?item.file:new File([item.file],'anh-bia.'+(item.file.type==='image/png'?'png':item.file.type==='image/webp'?'webp':'jpg'),{type:item.file.type});
  if(window.GDDPhotoAlbum.imageError(file,draft.kind))continue;
  const chooser=workCoverControls.get(item.field)?.choose;
  if(!chooser)continue;
  workCoverQueue.set(item.field,{...item,file,localUrl:URL.createObjectURL(file)});
  workCoverControls.get(item.field).render();
  recovered++;
 }
 await workLoadExtraCovers();adminMarkKind();workUpdateIdentity();workKeepPhotoDraft();
 workStatus('Đã khôi phục nội dung đang soạn'+(recovered?' và '+recovered+' ảnh bìa':'')+'. Kiểm tra tệp đính kèm trước khi đăng.');
}
async function workLoadExtraCovers(){
 const active=workCurrent;if(!active?.id)return;
 try{
  const result=await api(workRoot+active.kind+'/'+active.id+'/covers');
  if(workCurrent!==active)return;
  for(const row of result.data||[]){
   if(![2,3].includes(row.slot))continue;
   const control=[...workCoverControls.values()].find(c=>c.slot===row.slot);if(!control)continue;
   control.saved=row.image_url;control.render();
  }
 }catch{if(workCurrent===active)for(const c of workCoverControls.values())if(c.slot>1&&!workCoverQueue.has(c.key))c.msg.textContent='Chưa đọc được ảnh bìa đã lưu. Có thể thử mở lại bài.'}
}
function workHasLocalFiles(){return !!workAudioFile||workCoverQueue.size>0||!!window.GDDPhotoAlbum?.hasPending()}
let workCachedPage=[],workTrashMode=false,workTrashBusy=false,workDraftMode=false;
const workPageSize=10;
const workRoot='/api/v1/admin/work/';
function workRenderList(){
 const query=$('work-search').value.trim().toLocaleLowerCase('vi');
 const items=workCachedPage.filter(row=>String(row.title||'').toLocaleLowerCase('vi').includes(query));
 const list=$('work-list');list.replaceChildren();
 for(const record of items){
  const item=document.createElement('li'),texts=document.createElement('div');
  texts.className='work-row-text';
  appendText(texts,'span',record.title||'(Chưa có nhan đề)').className='work-row-title';
  appendText(texts,'span',(workTrashMode?'Trong thùng rác':record.published===1?'Đã công bố':'Bản nháp')+' · v'+record.gdd_version).className='work-row-meta';
  const button=document.createElement('button');
  button.type='button';button.textContent=workTrashMode?'Khôi phục':'Sửa';
  button.addEventListener('click',()=>workTrashMode?workMoveTrash(record,false):workOpen($('work-kind').value,record.id));
  const actions=document.createElement('div');actions.className='work-trash-actions';actions.append(button);
  if(!workTrashMode){const remove=document.createElement('button');remove.type='button';remove.textContent='Xóa';remove.className='work-trash-delete';remove.setAttribute('aria-label','Xóa '+(record.title||'bài viết'));remove.addEventListener('click',()=>workMoveTrash(record,true));actions.append(remove)}
  item.append(texts,actions);list.append(item);
 }
 if(!items.length)appendText(list,'li',query?'Không có kết quả trong trang này.':'Chưa có bản ghi.');
 $('work-list-count').textContent=' · '+workCachedPage.length+' bản ghi ở trang '+(Math.floor(workOffset/workPageSize)+1);
}

async function workMoveTrash(record,trashed){
 if(workBusy||workTrashBusy)return;
 const kind=$('work-kind').value;
 if(workHasLocalFiles()){workStatus('Hãy lưu hoặc bỏ tệp đang chọn trước khi thao tác Thùng rác.');return}
 if(!confirm((trashed?'Đưa bài vào Thùng rác và ẩn khỏi website?':'Khôi phục về bản nháp?')+'\\n'+(record.title||record.id)))return;
 workTrashBusy=true;
 try{
  const result=await workWrite(workRoot+kind+'/'+record.id+'/'+(trashed?'trash':'untrash'),'POST',{version:record.gdd_version});
  if(result?.data?.id!==record.id||result.trashed!==trashed)throw Error('Chưa xác nhận thao tác');
  if(workCurrent?.id===record.id&&workCurrent.kind===kind)workClose();
  workOffset=0;await workList();
  workStatus(trashed?'Đã đưa bài vào Thùng rác. Có thể khôi phục.':'Đã khôi phục về bản nháp. Kiểm tra và Đăng bài nếu muốn công bố.');
 }catch(e){workStatus('Chưa hoàn tất: '+e.message)}
 finally{workTrashBusy=false}
}
function adminSetListMode(mode){
 workTrashMode=mode==='trash';workDraftMode=mode==='draft';workOffset=0;
 $('work-trash-toggle').textContent=workTrashMode?'Về danh sách bài':'Thùng rác';
 $('work-trash-toggle').setAttribute('aria-pressed',String(workTrashMode));
 $('admin-home-drafts').setAttribute('aria-pressed',String(workDraftMode));
 $('admin-home-trash').setAttribute('aria-pressed',String(workTrashMode));
 $('work-search').value='';$('work-list-details').open=true;
 return workList();
}
function adminMarkKind(){for(const button of $('admin-home-grid').querySelectorAll('[data-admin-kind]'))button.setAttribute('aria-pressed',String(button.dataset.adminKind===$('work-kind').value));$('work-archive-batch').hidden=$('work-kind').value!=='documents';}
function workStatus(message){$('work-status').textContent=message;$('work-submit-status').textContent=message;}
function workClose(){if(workCurrent)workForgetPhotoDraft();workClearCovers();window.GDDPhotoAlbum?.reset();workCurrent=null;workFieldInputs.clear();$('work-edit-area').hidden=true;$('work-fields').replaceChildren();$('work-revisions').replaceChildren();$('work-code-area').hidden=true;}
async function workList(){
 const kind=$('work-kind').value,trash=workTrashMode,draft=workDraftMode,offset=workOffset;
 try{
  const data=await api(workRoot+kind+'?limit='+workPageSize+'&offset='+offset+(trash?'&trash=1':draft?'&draft=1':''));
  // Discard delayed responses when the category is changed while loading.
  if(kind!==$('work-kind').value||trash!==workTrashMode||draft!==workDraftMode||offset!==workOffset)return;
  workCachedPage=Array.isArray(data.data)?data.data:[];
  workRenderList();
  $('work-prev').disabled=workOffset===0;
  $('work-next').disabled=workCachedPage.length<workPageSize;
  $('work-page').textContent='Trang '+(Math.floor(workOffset/workPageSize)+1);
  workStatus(trash?'Thùng rác của chuyên mục hiện tại. Khôi phục bài về bản nháp.':draft?'Bản nháp của chuyên mục hiện tại.':'Đã kết nối D1 làm việc · Chọn Soạn bài mới để viết hoặc mở danh sách để sửa.');
 }catch(e){workStatus('Lỗi tải danh sách D1: '+e.message)}
}
const workPersonRanks={
 'Cửu Trùng Đài':['Giáo Tông','Quyền Giáo Tông','Chưởng Pháp','Ngọc Chưởng Pháp','Thượng Chưởng Pháp','Thái Chưởng Pháp','Đầu Sư','Quyền Đầu Sư','Nữ Đầu Sư','Chánh Phối Sư','Thượng Chánh Phối Sư','Ngọc Chánh Phối Sư','Thái Chánh Phối Sư','Quyền Chánh Phối Sư','Phối Sư','Giáo Sư','Giáo Hữu','Lễ Sanh'],
 'Hiệp Thiên Đài':['Hộ Pháp','Thượng Phẩm','Thượng Sanh','Bảo Pháp','Bảo Đạo','Bảo Thế','Bảo Văn Pháp Quân','Hiến Pháp','Hiến Đạo','Hiến Thế','Khai Pháp','Khai Đạo','Khai Thế','Tiếp Pháp','Tiếp Đạo','Tiếp Thế','Tiếp Sanh','Thời Quân','Chức Sắc Bộ Pháp Chánh','Chức Sắc Bộ Nhạc','Ban Thế Đạo'],
 'Phước Thiện':['Thánh Nhơn','Chơn Nhơn','Hiền Nhơn','Đạo Nhơn','Giáo Thiện','Chí Thiện','Thừa Sử'],
 'Hành chánh Đạo':['Chánh Trị Sự','Phó Trị Sự','Thông Sự','Chức Việc','Đạo Hữu'],
 'Khác':[]
};
const workPersonGroups={
 'Cửu Trùng Đài':['Chức Sắc Đại Thiên Phong Nam/Nữ','Chức Sắc Thiên Phong Nam/Nữ','Chức Việc và Đạo Hữu','Ban Kiến Trúc','Các Cơ Quan Hành Chánh Đạo khác'],
 'Hiệp Thiên Đài':['Chức Sắc Đại Thiên Phong Nam/Nữ','Bộ Pháp Chánh','Chức Sắc Bộ Nhạc','Ban Thế Đạo','Các Cơ Quan Hành Chánh Đạo khác'],
 'Phước Thiện':[],'Hành chánh Đạo':[],'Khác':[]
};
const workDocumentFolders={'HCĐ':'Tài Liệu Hành Chánh Đạo','HTĐ':'Tài Liệu Chức Sắc Hiệp Thiên Đài','CTĐ':'Tài Liệu Chức Sắc Cửu Trùng Đài','PT':'Tài Liệu Chức Sắc Phước Thiện','VKNN':'Văn Khố Ngoại Quốc','VKVN':'Văn Khố Việt Nam','CQK':'Tài Liệu Các Cơ Quan Khác'};
const workArchiveNorm=s=>String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
  const archiveSourceGroups=[
    ['foreign',/\\b(?:cia|nara|anom|gallica|pentagon papers|frus|texas tech|hoa ky|van kho phap|archives nationales|bibliotheque nationale|ecpad|service historique|national archives|reading room|history\\.state\\.gov|vietnam archive)\\b/],
    ['vietnam',/\\b(?:trung tam luu tru quoc gia|van kho viet nam|luu tru quoc gia|nac2|luutru\\.gov\\.vn)\\b/]
  ];
  const archiveSourceMatches=(r,source)=>{
    // Explicit provenance in the existing source field takes precedence; no database mutation.
    if(r.subfolder_code==='VKNN'||r.subfolder_code==='VKVN')return source===(r.subfolder_code==='VKNN'?'foreign':'vietnam');
    const provenance=workArchiveNorm(r.sources);
    const taggedForeign=/(?:\\[vknn\\]|\\bvan kho ngoai quoc\\b)/.test(provenance);
    const taggedVietnam=/(?:\\[vkvn\\]|\\bvan kho viet nam\\b)/.test(provenance);
    const t=workArchiveNorm([r.sources,r.document_number].filter(Boolean).join(' '));
    const title=workArchiveNorm(r.title);
    const foreign=taggedForeign||(!taggedVietnam&&(archiveSourceGroups[0][1].test(t)||/\\b(?:cia|pentagon papers|anom|gallica|frus|nara)\\b/.test(title)));
    const vietnam=taggedVietnam||(!taggedForeign&&archiveSourceGroups[1][1].test(t));
    return source==='foreign'?foreign:source==='vietnam'?vietnam:!foreign&&!vietnam;
  };
function workEffectiveFolder(record){
  const group=record?.subfolder_code||'';
  if(!record||group!=='CQK')return group;
  if(archiveSourceMatches(record,'foreign'))return 'VKNN';
  if(archiveSourceMatches(record,'vietnam'))return 'VKVN';
  return 'CQK';
}
const workGalleryCategories=['Tòa Thánh Tây Ninh xưa','Tang lễ Chức sắc','Hành đạo và Sinh hoạt Đạo','Dấu tích Đạo sử xưa và nay','Chơn Dung Tiền Bối','Tư liệu hình ảnh khác'];
function workSelectFill(select,choices,current,placeholder){
 select.replaceChildren();
 const option=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);};
 option('',placeholder);
 for(const value of choices)option(value,select.id==='work-field-subfolder_code'?workDocumentFolders[value]||value:value);
 if(current&&!choices.includes(current))option(current,current+' (giá trị đã lưu)');
 select.value=current||'';
}
function workInvalidateCode(){
 workCodeCandidate=null;
 $('work-code-confirm').checked=false;$('work-code-assign').disabled=true;
 if(!$('work-code-area').hidden)$('work-code-preview').textContent='Phân loại đã thay đổi. Lưu thay đổi để kiểm tra lại mã dự kiến.';
}

const workDateCalendar=(()=>{
  const INT = Math.floor, PI=Math.PI, DR=PI/180;
  function jdFromDate(d,m,y) {
    const a=INT((14-m)/12),yy=y+4800-a,mm=m+12*a-3;
    let jd=d+INT((153*mm+2)/5)+365*yy+INT(yy/4)-INT(yy/100)+INT(yy/400)-32045;
    if(jd<2299161) jd=d+INT((153*mm+2)/5)+365*yy+INT(yy/4)-32083;
    return jd;
  }
  function newMoon(k) {
    const T=k/1236.85,T2=T*T,T3=T2*T;
    const Jd1=2415020.75933+29.53058868*k+0.0001178*T2-0.000000155*T3;
    const Jd2=0.00033*Math.sin((166.56+132.87*T-0.009173*T2)*DR);
    const M=359.2242+29.10535608*k-0.0000333*T2-0.00000347*T3;
    const Mp=306.0253+385.81691806*k+0.0107306*T2+0.00001236*T3;
    const F=21.2964+390.67050646*k-0.0016528*T2-0.00000239*T3;
    const C1=(0.1734-0.000393*T)*Math.sin(M*DR)+0.0021*Math.sin(2*M*DR)-0.4068*Math.sin(Mp*DR)
      +0.0161*Math.sin(2*Mp*DR)-0.0004*Math.sin(3*Mp*DR)+0.0104*Math.sin(2*F*DR)
      -0.0051*Math.sin((M+Mp)*DR)-0.0074*Math.sin((M-Mp)*DR)+0.0004*Math.sin((2*F+M)*DR)
      -0.0004*Math.sin((2*F-M)*DR)-0.0006*Math.sin((2*F+Mp)*DR)+0.0010*Math.sin((2*F-Mp)*DR)
      +0.0005*Math.sin((2*Mp+M)*DR);
    const dt=T < -11 ? 0.001+0.000839*T+0.0002261*T2-0.00000845*T3-0.000000081*T*T3
      : -0.000278+0.000265*T+0.000262*T2;
    return Jd1+Jd2+C1-dt;
  }
  const newMoonDay=(k)=>INT(newMoon(k)+0.5+7/24);
  function sunLongitude(jdn) {
    const T=(jdn-2451545.0)/36525,T2=T*T;
    const M=(357.52910+35999.05030*T-0.0001559*T2-0.00000048*T*T2)*DR;
    const L0=280.46645+36000.76983*T+0.0003032*T2;
    const DL=(1.914600-0.004817*T-0.000014*T2)*Math.sin(M)
      +(0.019993-0.000101*T)*Math.sin(2*M)+0.000290*Math.sin(3*M);
    let L=(L0+DL)*DR;
    L-=PI*2*INT(L/(PI*2));
    return L;
  }
  const sunSection=day=>INT(sunLongitude(day-0.5-7/24)/PI*6);
  function lunarMonth11(y) {
    const off=jdFromDate(31,12,y)-2415021.076998695;
    const k=INT(off/29.530588853);
    let nm=newMoonDay(k);
    if(sunSection(nm)>=9)nm=newMoonDay(k-1);
    return nm;
  }
  function leapOffset(a11) {
    const k=INT(0.5+(a11-2415021.076998695)/29.530588853);
    let i=1,arc=sunSection(newMoonDay(k+i)),last;
    do{last=arc;i++;arc=sunSection(newMoonDay(k+i))}while(arc!==last&&i<14);
    return i-1;
  }
  function solarToLunar(d,m,y) {
    const jd=jdFromDate(d,m,y),k=INT((jd-2415021.076998695)/29.530588853);
    let start=newMoonDay(k+1);if(start>jd)start=newMoonDay(k);
    let a11=lunarMonth11(y),b11=a11,lYear;
    if(a11>=start){lYear=y;a11=lunarMonth11(y-1)}
    else{lYear=y+1;b11=lunarMonth11(y+1)}
    const lDay=jd-start+1,diff=INT((start-a11)/29);
    let leap=0,lMonth=diff+11;
    if(b11-a11>365){const off=leapOffset(a11);if(diff>=off){lMonth=diff+10;if(diff===off)leap=1}}
    if(lMonth>12)lMonth-=12;
    if(lMonth>=11&&diff<4)lYear--;
    return {day:lDay,month:lMonth,year:lYear,leap:!!leap};
  }

 return {solarToLunar};
})();
const workCan=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
const workChi=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
const workYearName=y=>workCan[(y+6)%10]+' '+workChi[(y+8)%12];
const workDateNorm=s=>String(s||'').normalize('NFD').replace(/\\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase().replace(/\\s+/g,' ').trim();
const workISO=(y,m,d)=>String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
function workParseDeath(value,fullName){
 let raw=value.trim(),mode='lunar';
 if(!raw)return {clear:true};
 if(/^(?:DL|Dương lịch)\\s*[: ]\\s*/i.test(raw)){mode='solar';raw=raw.replace(/^(?:DL|Dương lịch)\\s*[: ]\\s*/i,'')}
 else raw=raw.replace(/^(?:AL|Âm lịch)\\s*[: ]\\s*/i,'');
 let d,m,y,leap=false;
 const iso=/^(\\d{4})-(\\d{1,2})-(\\d{1,2})$/.exec(raw);
 const numeric=/^(\\d{1,2})[\\/.-](\\d{1,2})\\s*(nhuận)?[\\/ .-]\\s*(\\d{4})$/i.exec(raw);
 const traditional=/^(\\d{1,2})[\\/.-](\\d{1,2})\\s*(nhuận\\s*)?(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)\\s+(Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)(?:\\s*\\(\\s*(\\d{4})\\s*\\))?$/i.exec(raw);
 if(iso){mode='solar';y=+iso[1];m=+iso[2];d=+iso[3]}
 else if(numeric){d=+numeric[1];m=+numeric[2];leap=!!numeric[3];y=+numeric[4]}
 else if(traditional&&mode==='lunar'){
  d=+traditional[1];m=+traditional[2];leap=!!traditional[3];
  const yearInName=String(fullName||'').match(/\\(\\s*\\d{4}\\s*[–—-]\\s*(\\d{4})\\s*\\)\\s*$/);
  y=+(traditional[6]||yearInName?.[1]||0);
  if(!y)throw Error('Thêm năm vào ngoặc để xác định chính xác Âm lịch.');
  if(workDateNorm(workYearName(y))!==workDateNorm(traditional[4]+' '+traditional[5]))throw Error('Năm và Can Chi không khớp.');
 }else throw Error('Nhập AL: 10/12 Bính Ngọ (2026), AL: 10/12/2026 hoặc DL: 17/01/2027.');
 if(y<1800||y>2100||m<1||m>12||d<1||d>(mode==='solar'?31:30))throw Error('Ngày hoặc năm không hợp lệ (1800–2100).');
 const solarToLunar=workDateCalendar.solarToLunar;
 if(mode==='solar'){
  if(leap)throw Error('Dương lịch không có tháng nhuận kiểu Âm lịch.');
  const dt=new Date(Date.UTC(y,m-1,d));
  if(dt.getUTCDate()!==d||dt.getUTCMonth()!==m-1)throw Error('Ngày Dương lịch không hợp lệ.');
  const l=solarToLunar(d,m,y);return {...l,solar:workISO(y,m,d)};
 }
 for(let t=Date.UTC(y,0,1);t<Date.UTC(y+1,3,1);t+=86400000){
  const dt=new Date(t),l=solarToLunar(dt.getUTCDate(),dt.getUTCMonth()+1,dt.getUTCFullYear());
  if(l.year===y&&l.month===m&&l.day===d&&l.leap===leap)return {...l,solar:workISO(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate())};
 }
 throw Error('Ngày Âm lịch không tồn tại; kiểm tra ngày 29/30 và tháng nhuận.');
}
let workDeathValidate=null;

function workBuild(kind,record){
 workDeathValidate=null;
 workClearCovers();workFieldInputs.clear();
 const fields=$('work-fields');fields.replaceChildren();
 if(['people','documents'].includes(kind)){
  const label=document.createElement('label');label.textContent='Quyền sử dụng tư liệu';const select=document.createElement('select');select.id='work-record-access';
  for(const [value,name] of [['download','Cho phép xem và tải về'],['view','Chỉ cho phép xem'],['protected','Chỉ xem – Bảo vệ tăng cường (watermark)']]){const opt=document.createElement('option');opt.value=value;opt.textContent=name;select.append(opt)}
  const note=document.createElement('small');note.textContent='Chỉ xem: khóa PDF/Word và bản in. Tăng cường: chữ chìm trực tiếp trên bản xem. Không thể thu hồi ảnh đã tải hoặc ngăn chụp màn hình.';
  fields.append(label,select,note);select.value='download';
  if(record){select.disabled=true;select.dataset.ready='no';api(workRoot+kind+'/'+record.id+'/record-access').then(x=>{if(!select.isConnected)return;select.value=x.mode;select.dataset.ready='yes';select.disabled=false}).catch(()=>{note.textContent='Chưa đọc được quyền tư liệu; không cập nhật bài khi chưa xác minh.'})}else select.dataset.ready='yes';
 }
 for(const field of workFields[kind]||[]){
  const label=document.createElement('label');
  const choices=kind==='people'&&field==='branch'?Object.keys(workPersonRanks):
    kind==='people'&&field==='subgroup'?(workPersonGroups[record?.branch]||[]):
    kind==='people'&&field==='gender'?['Nam','Nữ']:
    kind==='media'&&field==='category'?workGalleryCategories:
    kind==='gdd_audio_programs'&&field==='category'?['radio-dao-su','niem-danh','thuyet-minh','nhac-dao']:
    kind==='documents'&&field==='subfolder_code'?Object.keys(workDocumentFolders):null;
  const input=document.createElement(choices?'select':workLong.has(field)?'textarea':'input');
  input.id='work-field-'+field;
  if(choices){
   workSelectFill(input,choices,kind==='documents'&&field==='subfolder_code'?workEffectiveFolder(record):record?.[field]||'',field==='subgroup'?'Chưa phân nhóm':'Chọn '+(workLabels[field]||field));
   if(kind==='media'&&field==='category'){input.setAttribute('aria-required','true');input.options[0].textContent='Chọn chuyên mục Hình ảnh';}
   if(kind==='gdd_audio_programs'&&field==='category'){const labels={'radio-dao-su':'Radio Đạo Sử','niem-danh':'Niệm danh hiệu','thuyet-minh':'Bài thuyết minh','nhac-dao':'Nhạc Đạo'};for(const option of input.options)if(labels[option.value])option.textContent=labels[option.value]}
  }else if(workBool.has(field)){
   input.type='checkbox';
   input.checked=record?Boolean(record[field]):false;
   if(!record&&field==='published')input.disabled=true;
   if(record&&field==='published'&&workCanonicalKinds.has(kind)&&!record.archive_code)input.disabled=true;
  }else if(workNums.has(field)){
   input.type='number';input.min='0';
   input.value=record?.[field]??'';
  }else{
   if(input.tagName==='INPUT')input.type='text';
   input.value=record?.[field]??'';
   if(workLong.has(field))input.rows=field==='body'||field==='biography'?8:3;
  }
  label.htmlFor=input.id;label.textContent=kind==='media'&&field==='category'?'Chuyên mục Hình ảnh *':(workLabels[field]||field);
  if(workBool.has(field)){
   const wrapper=document.createElement('div');wrapper.className='sandbox-checkbox';
   wrapper.append(input,label);fields.append(wrapper);
  }else{fields.append(label,input);}
  workFieldInputs.set(field,input);
  if(workDateFields.has(field)){input.placeholder='DD/MM/YYYY hoặc YYYY-MM-DD';input.autocomplete='off';}
  if(kind==='documents'&&field==='document_date'){input.placeholder='Ví dụ: 15 tháng 10 năm Bính Dần (1926)';input.maxLength=1500;input.autocomplete='off';}
  if(kind==='documents'&&field==='file_url'){
   const extra=document.createElement('details');extra.className='admin-help';const heading=document.createElement('summary');heading.textContent='Liên kết tài liệu có sẵn (không bắt buộc)';extra.append(heading);label.before(extra);extra.append(label,input);
  }
  if(field==='published')input.parentElement.hidden=true;
  if(kind==='gdd_audio_programs'&&field==='audio_url'){
   label.textContent='Tệp âm thanh (MP3)';
   const advanced=document.createElement('details');advanced.className='admin-help';
   const heading=document.createElement('summary');heading.textContent='Nhập liên kết âm thanh thủ công';
   advanced.append(heading);input.before(advanced);advanced.append(input);
   const upload=document.createElement('div');upload.className='work-cover-upload';
   const choose=document.createElement('input');choose.type='file';choose.accept='.mp3,audio/mpeg';choose.id='work-audio-file';
   const msg=document.createElement('small');msg.setAttribute('role','status');msg.textContent=input.value?'Đã có liên kết âm thanh. Chọn MP3 nếu muốn thay thế.':'Chọn MP3 từ điện thoại hoặc máy tính. Tự nén khi đăng, chỉ lưu bản nghe (tối đa 24 MB).';
   const remove=document.createElement('button');remove.type='button';remove.textContent='Bỏ tệp đã chọn';remove.hidden=true;
   choose.addEventListener('change',()=>{
    if(workBusy)return;const file=choose.files?.[0];if(!file)return;
    if(!/\\.mp3$/i.test(file.name)||file.size<4||file.size>60*1048576){choose.value='';workAudioFile=null;workAudioPrepared=null;remove.hidden=true;msg.textContent='Chọn MP3 gốc không quá 60 MB.';return}
    workAudioFile=file;workAudioPrepared=null;remove.hidden=false;msg.textContent='Đã chọn '+file.name+' · '+(file.size/1000000).toFixed(2)+' MB · Tự tối ưu khi đăng bài.';
   });
   remove.addEventListener('click',()=>{if(!workBusy){workAudioFile=null;workAudioPrepared=null;choose.value='';remove.hidden=true;msg.textContent='Chọn tệp MP3.'}});
   const note=document.createElement('small');note.textContent='Không tải bản gốc lên R2. Giữ bản gốc trên thiết bị hoặc Google Drive.';
   const license=document.createElement('a');license.href='/admin/mp3-encoder-license';license.target='_blank';license.rel='noopener';license.textContent='Giấy phép bộ nén MP3';
   upload.append(choose,msg,remove,note,license);advanced.before(upload);
  }
  if(['image_url','cover_url','portrait_url'].includes(field)){
   label.textContent=kind==='people'?'Ảnh chân dung':kind==='gdd_calendar_memorials'||kind==='gdd_memorials'||kind==='obituaries'?'Di ảnh / ảnh bìa':'Ảnh bìa bài viết';
   const advanced=document.createElement('details');advanced.className='admin-help cover-url-details';
   const advancedTitle=document.createElement('summary');advancedTitle.textContent='Nhập liên kết ảnh thủ công';
   advanced.append(advancedTitle);input.before(advanced);advanced.append(input);
   if(kind==='documents'){advanced.hidden=true;input.readOnly=true;}
   label.textContent+=' (tối đa 3 ảnh)';
   const coverGroup=document.createElement('div');coverGroup.className='work-cover-group';
   const coverHint=document.createElement('small');coverHint.textContent='Ảnh 1 là ảnh đại diện; ảnh 2 và 3 hiện ngay sau ảnh 1 khi mở bài.';coverGroup.append(coverHint);
   for(const slot of [1,2,3]){
   const key=slot===1?field:field+'#'+slot;
   const upload=document.createElement('div');upload.className='work-cover-upload';
   const heading=document.createElement('strong');heading.textContent='Ảnh bìa '+slot+(slot===1?' · Đại diện':' · Bổ sung (không bắt buộc)');upload.append(heading);
   const choose=document.createElement('input');choose.type='file';choose.accept='image/jpeg,image/png,image/webp';choose.id='work-cover-file-'+(slot===1?field:field+'-'+slot);choose.setAttribute('aria-label','Chọn ảnh bìa '+slot);
   const msg=document.createElement('small');msg.setAttribute('role','status');
   const preview=document.createElement('img');preview.alt='Bản xem ảnh đã chọn';preview.hidden=true;
   const showPreview=document.createElement('button');showPreview.type='button';showPreview.textContent='Xem ảnh đã chọn';showPreview.hidden=true;
   const remove=document.createElement('button');remove.type='button';remove.textContent='Bỏ ảnh đã chọn';remove.hidden=true;
   const unlink=document.createElement('button');unlink.type='button';unlink.textContent='Gỡ ảnh bìa '+slot+' đã lưu';unlink.hidden=true;
   const control={slot,key,choose,msg,saved:slot===1?input.value:'',render(){
    const item=workCoverQueue.get(key);
    preview.hidden=true;preview.removeAttribute('src');
    showPreview.hidden=!(item?.localUrl||control.saved);remove.hidden=!item;
    unlink.hidden=slot===1||!control.saved||!!item;
    msg.textContent=item?'Đã chọn '+item.file.name+' · Sẵn sàng đăng bài.':control.saved?'Đã lưu ảnh bìa '+slot+'.':'Chọn ảnh; hệ thống tự tải khi đăng bài.';
    if(slot===1&&!item&&control.saved){try{const u=new URL(control.saved);if(u.protocol==='https:'){preview.src=u.href;preview.hidden=false;showPreview.hidden=true}}catch{}}
   }};
   workCoverControls.set(key,control);
   showPreview.addEventListener('click',()=>{const url=workCoverQueue.get(key)?.localUrl||control.saved;if(url){preview.src=url;preview.hidden=false;showPreview.hidden=true}});
   function clearSelection(){const previous=workCoverQueue.get(key);if(previous?.localUrl)URL.revokeObjectURL(previous.localUrl);workCoverQueue.delete(key);choose.value='';control.render();void workKeepCoverFiles()}
   choose.addEventListener('change',()=>{
    if(workBusy)return;
    const file=choose.files?.[0];if(!file)return;
    const error=window.GDDPhotoAlbum.imageError(file,kind);if(error){choose.value='';msg.textContent=error;return}
    const previous=workCoverQueue.get(key);if(previous?.localUrl)URL.revokeObjectURL(previous.localUrl);
    const localUrl=URL.createObjectURL(file);workCoverQueue.set(key,{file,localUrl});control.render();
    void workKeepCoverFiles().then(saved=>{if(workCoverQueue.get(key)?.file!==file)return;if(!saved||file.size>workCoverRecoveryLimit)msg.textContent+=' (Nếu tải lại trang, có thể cần chọn lại ảnh.)'});
   });
   remove.addEventListener('click',()=>{if(!workBusy)clearSelection()});
   unlink.addEventListener('click',async()=>{
    const active=workCurrent;if(workBusy||!active?.id||!confirm('Gỡ ảnh bìa '+slot+' khỏi bài? Tệp nguyên mẫu vẫn giữ.'))return;
    workBusy=true;unlink.disabled=true;
    try{const r=await workWrite(workRoot+active.kind+'/'+active.id+'/covers','POST',{slot,asset_id:null});if(!r.removed)throw Error('Chưa xác nhận');control.saved='';control.render()}
    catch(e){msg.textContent='Chưa gỡ được ảnh: '+e.message}
    finally{workBusy=false;unlink.disabled=false}
   });
   upload.append(choose,msg,showPreview,preview,remove,unlink);coverGroup.append(upload);control.render();
   }
   advanced.before(coverGroup);
  }
 }
 if(kind==='people'){
  const branch=workFieldInputs.get('branch'),rank=workFieldInputs.get('rank'),group=workFieldInputs.get('subgroup');
  const labelFor=field=>fields.querySelector('label[for="work-field-'+field+'"]');
  const branchLabel=labelFor('branch'),rankLabel=labelFor('rank'),groupLabel=labelFor('subgroup');
  const picker=document.createElement('select');picker.id='work-branch-rank-picker';
  const label=document.createElement('label');label.htmlFor=picker.id;label.textContent='Cơ quan / Phẩm vị';
  branchLabel.before(label,picker);
  const add=(parent,value,title)=>{const o=document.createElement('option');o.value=value;o.textContent=title;parent.append(o);};
  add(picker,'','Chọn Cơ quan và Phẩm vị');
  const entries=[];
  for(const [b,ranks] of Object.entries(workPersonRanks)){
   if(!ranks.length)continue;
   const optgroup=document.createElement('optgroup');optgroup.label=b;
   for(const r of ranks){entries.push({branch:b,rank:r});add(optgroup,String(entries.length-1),b+' – '+r)}
   picker.append(optgroup);
  }
  const CUSTOM='custom';add(picker,CUSTOM,'Khác / Tự nhập Phẩm vị…');
  const found=entries.findIndex(e=>e.branch===branch.value&&e.rank===rank.value);
  picker.value=found>=0?String(found):(branch.value||rank.value?CUSTOM:'');
  rank.placeholder='Nhập nguyên phẩm vị theo tư liệu';
  function toggleCustom(){const show=picker.value===CUSTOM;branch.hidden=branchLabel.hidden=rank.hidden=rankLabel.hidden=!show}
  function toggleGroup(){const show=(workPersonGroups[branch.value]||[]).length>0||!!group.value;group.hidden=groupLabel.hidden=!show}
  function refreshGroup(previous){
   const groups=workPersonGroups[branch.value]||[];
   workSelectFill(group,groups,groups.includes(previous)?previous:'','Chưa phân nhóm');
   toggleGroup();
  }
  toggleCustom();toggleGroup();
  picker.addEventListener('change',()=>{
   const prevBranch=branch.value,prevGroup=group.value;
   if(picker.value!==''){
    if(picker.value!==CUSTOM){
     const choice=entries[Number(picker.value)];if(!choice)return;
     branch.value=choice.branch;rank.value=choice.rank;
    }
   }else{branch.value='';rank.value=''}
   if(branch.value!==prevBranch)refreshGroup(prevGroup);
   toggleCustom();workInvalidateCode();
  });
  branch.addEventListener('change',()=>{refreshGroup('');workInvalidateCode()});
  rank.addEventListener('input',workInvalidateCode);group.addEventListener('change',workInvalidateCode);
  workFieldInputs.get('full_name').addEventListener('input',workInvalidateCode);
  // Original field values remain untouched until the single date input is edited.
  const notes=workFieldInputs.get('date_notes'),day=workFieldInputs.get('death_lunar_day'),month=workFieldInputs.get('death_lunar_month'),leap=workFieldInputs.get('death_lunar_leap'),solar=workFieldInputs.get('death_solar_date');
  const dateInput=document.createElement('input');dateInput.type='text';dateInput.id='work-death-date';dateInput.placeholder='AL: 10/12 Bính Ngọ (2026)';dateInput.autocomplete='off';
  const dateLabel=labelFor('date_notes');dateLabel.textContent='Ngày qui vị (Âm / Dương lịch)';dateLabel.htmlFor=dateInput.id;
  notes.before(dateInput);notes.hidden=true;
  for(const key of ['death_lunar_day','death_lunar_month','death_solar_date']){workFieldInputs.get(key).hidden=true;labelFor(key).hidden=true}
  leap.parentElement.hidden=true;
  const help=document.createElement('small');help.className='work-date-help';help.setAttribute('role','status');dateInput.after(help);
  const initial=notes.value|| (solar.value?'DL: '+solar.value:'');
  dateInput.value=initial;
  const oldValues={notes:notes.value,day:day.value,month:month.value,leap:leap.checked,solar:solar.value};
  const guide='Nhập AL: ngày/tháng năm Can Chi (năm số) hoặc DL: ngày/tháng/năm. Lịch Việt Nam UTC+7.';
  function restoreDate(){notes.value=oldValues.notes;day.value=oldValues.day;month.value=oldValues.month;leap.checked=oldValues.leap;solar.value=oldValues.solar}
  function savedDateText(){return [oldValues.day&&oldValues.month?'Âm lịch: '+oldValues.day+'/'+oldValues.month+(oldValues.leap?' nhuận':''):'',oldValues.solar?'Dương lịch: '+oldValues.solar.split('-').reverse().join('/'):''].filter(Boolean).join(' · ')}
  function recalc(){
   if(dateInput.value===initial){restoreDate();help.textContent=savedDateText()||guide;return true}
   try{
    const p=workParseDeath(dateInput.value,workFieldInputs.get('full_name').value);
    if(p.clear){notes.value='';day.value='';month.value='';leap.checked=false;solar.value='';help.textContent='Đã bỏ ngày qui vị; lưu thay đổi để xác nhận.';return true}
    notes.value=dateInput.value.trim();day.value=String(p.day);month.value=String(p.month);leap.checked=p.leap;solar.value=p.solar;
    help.textContent='Âm lịch: '+p.day+'/'+p.month+(p.leap?' nhuận':'')+' '+workYearName(p.year)+' ('+p.year+') · Dương lịch: '+p.solar.split('-').reverse().join('/');
    return true;
   }catch(e){restoreDate();help.textContent='Chưa đổi được: '+e.message;return false}
  }
  dateInput.addEventListener('input',recalc);dateInput.addEventListener('change',recalc);
  workFieldInputs.get('full_name').addEventListener('input',()=>{if(dateInput.value!==initial)recalc()});
  workDeathValidate=recalc;recalc();
 }
 if(kind==='documents')workFieldInputs.get('subfolder_code').addEventListener('change',workInvalidateCode);
 const optional=['verified','sort_order','person_id','linked_person_id'].filter(k=>workFieldInputs.has(k));
 if(optional.length){
  const extra=document.createElement('details');extra.className='admin-help work-extra';const summary=document.createElement('summary');summary.textContent='Thông tin bổ sung';extra.append(summary);
  for(const key of optional){const input=workFieldInputs.get(key);const label=fields.querySelector('label[for="'+input.id+'"]');if(workBool.has(key))extra.append(input.parentElement);else if(label)extra.append(label,input);}
  if(record?.published){const withdraw=document.createElement('button');withdraw.type='button';withdraw.textContent='Chuyển về bản nháp';withdraw.addEventListener('click',()=>{if(confirm('Ẩn bài khỏi website và giữ lại bản nháp?'))workSave('withdraw')});extra.append(withdraw)}
  fields.append(extra);
 }else if(record?.published){const extra=document.createElement('details');extra.className='admin-help';const title=document.createElement('summary');title.textContent='Tùy chọn khác';const withdraw=document.createElement('button');withdraw.type='button';withdraw.textContent='Chuyển về bản nháp';withdraw.addEventListener('click',()=>{if(confirm('Ẩn bài khỏi website và giữ lại bản nháp?'))workSave('withdraw')});extra.append(title,withdraw);fields.append(extra)}
}
function workChanged(){
 const changes={};
 for(const [field,input] of workFieldInputs){
  if(workCurrent.kind==='documents'&&field==='cover_url')continue;
  const old=workCurrent.record?.[field];
  let value;
  if(workBool.has(field))value=Boolean(input.checked);
  else if(workNums.has(field))value=input.value.trim()?Number(input.value):null;
  else value=input.value;
  const unchanged=workCurrent.record!==null && (workBool.has(field)?
      (old===null?value===false:Boolean(old)===value):
      workNums.has(field)?((old??null)===value):String(old??'')===value);
  if(!unchanged && !(workCurrent.record===null&&value==='')){
   if(workDateFields.has(field)){try{value=normalizeEditorialDate(value)}catch{throw Error((workLabels[field]||field)+': nhập ngày hợp lệ theo DD/MM/YYYY (ví dụ 29/09/1926).')}}
   changes[field]=value;
  }
 }
 return changes;
}
const workCanonicalKinds=new Set(['people','posts','media','videos','obituaries','documents']);
let workCodeCandidate=null;
async function workCodePreview(){
 const panel=$('work-code-area');
 const record=workCurrent?.record;
 workCodeCandidate=null;$('work-code-confirm').checked=false;$('work-code-assign').disabled=true;
 if(!record||record.archive_code||!workCanonicalKinds.has(workCurrent.kind)){
   panel.hidden=true;return;
 }
 panel.hidden=false;
 $('work-code-preview').textContent='Đang kiểm tra nhóm mã và số tiếp theo trên D1…';
 try{
  const result=await api(workRoot+workCurrent.kind+'/'+record.id+'/code-preview');
  if(!result?.requires_confirmation||!result?.candidate)throw Error('Không thể xác định nhóm mã');
  workCodeCandidate={code:result.candidate,version:result.version};
  $('work-code-preview').textContent='Mã dự kiến: '+result.candidate+' · '+result.classification+
    ' · đường dẫn '+result.slug+
    (result.needs_special_review?' · Nhóm đặc biệt: phải đối chiếu kỹ Cơ quan và Phẩm vị.':'')+
    '. Cần lưu mọi thông tin phân loại trước khi bấm cấp mã.';
 }catch(e){
  $('work-code-preview').textContent='Chưa thể cấp mã: '+e.message+
    '. Hãy nhập đủ thông tin phân loại, lưu bản nháp rồi thử lại.';
 }
}
async function workAssignCode(){
 const record=workCurrent?.record,kind=workCurrent?.kind;
 if(!record||!workCodeCandidate||!$('work-code-confirm').checked)return;
 if(Object.keys(workChanged()).some(key=>['full_name','branch','rank','subgroup','subfolder_code'].includes(key))){
  workInvalidateCode();workStatus('Lưu thông tin phân loại trước khi cấp mã.');return;
 }
 if(!confirm('Xác nhận cấp MÃ ĐỊNH DANH '+workCodeCandidate.code+
   ' cho bản nháp này? Mã đã cấp sẽ được giữ nguyên và ghi lịch sử.'))return;
 const btn=$('work-code-assign');btn.disabled=true;
 try{
  const result=await workWrite(workRoot+kind+'/'+record.id+'/assign-code','POST',
   {code:workCodeCandidate.code,version:workCodeCandidate.version,confirmed:true});
  if(!result.assigned||result.code!==workCodeCandidate.code)throw Error('Chưa xác nhận cấp mã');
  workStatus('Đã cấp mã '+result.code+' và lưu lịch sử phiên bản. Có thể tiếp tục công bố.');
  await workOpen(kind,record.id);await workList();
 }catch(e){workStatus('Chưa cấp được mã: '+e.message);await workCodePreview()}
 finally{btn.disabled=false}
}
$('work-code-confirm').addEventListener('change',()=>{
 $('work-code-assign').disabled=!$('work-code-confirm').checked||!workCodeCandidate;
});
$('work-code-assign').addEventListener('click',workAssignCode);
async function workOpen(kind,id,{scroll=true}={}){
 if(workBusy)return;
 workClose();
 try{
  const response=await api(workRoot+kind+'/'+encodeURIComponent(id));
  const record=response.data;
  if(!record||record.id!==id)throw Error('Không đúng mã hồ sơ');
  workCurrent={kind,id,record};
  workBuild(kind,record);
  $('work-edit-heading').textContent='Đang sửa '+(record.full_name||record.title||id);
  $('work-identity').textContent='Mã định danh: '+(record.archive_code||'Chưa có mã')+
   ' · phiên bản '+record.gdd_version+' · trạng thái '+(record.published?'Công bố':'Nháp');
  $('work-edit-area').hidden=false;
  $('work-list-details').open=false;
  if(scroll)$('work-edit-area').scrollIntoView({behavior:'smooth',block:'start'});
  $('work-code-area').hidden=true;
  workUpdateIdentity();
  await workHistory();
  await workLoadExtraCovers();
  window.GDDPhotoAlbum?.show(workCurrent);
 }catch(e){workStatus('Không đọc được chi tiết: '+e.message)}
}
async function workNew(){
 if(workBusy)return;if(workHasLocalFiles()&&!confirm('Tệp đang chọn chưa được lưu. Mở bài mới?'))return;
 workClose();const kind=$('work-kind').value;
 workCurrent={kind,id:null,record:null};
 workBuild(kind,null);
 $('work-edit-heading').textContent='Tạo bản nháp '+(names[kind]||kind);
 $('work-code-area').hidden=true;workCodeCandidate=null;
 $('work-identity').textContent='Bản nháp mới chưa được cấp mã hồ sơ. Chỉ người quản trị xem được.';
 $('work-edit-area').hidden=false;
 $('work-list-details').open=false;
 $('work-edit-area').scrollIntoView({behavior:'smooth',block:'start'});
 workUpdateIdentity();
 workStatus('Nhập nội dung, chọn ảnh rồi nhấn Đăng bài.');
 window.GDDPhotoAlbum?.show(workCurrent);
}
async function workHistory(){
 const list=$('work-revisions');list.replaceChildren();
 if(!workCurrent?.id)return;
 const snapshot={...workCurrent};
 const data=await api(workRoot+snapshot.kind+'/'+snapshot.id+'/history');
 for(const rev of data.data||[]){
  const item=document.createElement('li');item.className='sandbox-line';
  appendText(item,'span','Lưu lúc '+rev.changed_at+' · phiên bản '+rev.version_from+' → '+rev.version_to);
  const button=document.createElement('button');button.type='button';
  button.textContent=rev.before_json?'Khôi phục trước lần sửa':'Tạo mới';
  button.disabled=!rev.before_json;
  button.addEventListener('click',async()=>{
   if(!workCurrent||workCurrent.id!==snapshot.id)return;
   if(!confirm('Khôi phục phiên bản trong D1 làm việc? Có ghi lại lịch sử mới.'))return;
   button.disabled=true;
   try{
    await workWrite(workRoot+snapshot.kind+'/'+snapshot.id+'/restore','POST',
      {version:workCurrent.record.gdd_version,revision_id:rev.revision_id});
    workStatus('Đã khôi phục phiên bản trước và ghi lịch sử mới.');
    await workOpen(snapshot.kind,snapshot.id);await workList();
   }catch(e){workStatus('Không thể khôi phục: '+e.message)}
   finally{button.disabled=false}
  });
  item.append(button);list.append(item);
 }
 if(!list.children.length)appendText(list,'li','Chưa có lịch sử sửa.');
}
function workUpdateIdentity(){
 const record=workCurrent?.record;
 $('work-save').textContent=record?.published?'Lưu nội dung':'Lưu bản nháp';
 $('work-save').hidden=!!record?.published;
 $('work-publish').textContent=record?.published?'Cập nhật bài trên website':'Đăng bài lên website';
 if(record)$('work-identity').textContent='Mã định danh: '+(record.archive_code||'Chưa có mã')+' · phiên bản '+record.gdd_version+' · '+(record.published?'Đã đăng':'Nháp');
}
async function workApplyRecordAccess(active,plans,progress){
 const select=$('work-record-access');if(!select)return;if(select.dataset.ready!=='yes')throw Error('Chưa đọc được quyền tư liệu');
 const mode=select.value,base=workRoot+active.kind+'/'+active.id+'/record-access',urls=['image_url','cover_url','file_url'].map(k=>workFieldInputs.get(k)?.value||'').filter(Boolean);
 const payload={mode,version:active.record.gdd_version,plans,urls};
 if(mode==='protected'){
  const plan=await workWrite(base+'/prepare','POST',payload);
  for(const [index,item] of plan.entries.entries()){
   progress('Đang đóng watermark '+(index+1)+'/'+plan.entries.length+'…');
   const response=await fetch(base+'/source?'+new URLSearchParams({ref:item.ref,variant:item.variant}),{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw Error('Không đọc được ảnh xem nguồn');
   const url=URL.createObjectURL(await response.blob()),image=new Image(),canvas=document.createElement('canvas');
   try{image.src=url;await image.decode();const max=active.kind==='people'?1000:1800,scale=Math.min(1,max/Math.max(image.naturalWidth,image.naturalHeight));
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Không tạo được ảnh bảo vệ');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
    const font=Math.max(10,Math.round(canvas.width*.016)),dx=Math.max(125,font*18),dy=Math.max(42,font*5),d=Math.hypot(canvas.width,canvas.height);
    ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(-Math.PI/7);ctx.font=font+'px sans-serif';ctx.fillStyle='rgba(28,43,37,.18)';ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1;
    for(let y=-d;y<d;y+=dy)for(let x=-d+(Math.round(y/dy)%2)*dx/2;x<d;x+=dx){ctx.strokeText('dauxuacuadao.info.vn',x,y);ctx.fillText('dauxuacuadao.info.vn',x,y)}
    const jpeg=canvas.toDataURL('image/jpeg',.84).split(',')[1];const saved=await workWrite(base+'/prepare','POST',{operation:'upload',...item,jpeg});if(!saved.stored)throw Error('Chưa lưu được ảnh watermark');
   }finally{canvas.width=canvas.height=0;URL.revokeObjectURL(url)}
  }
 }
 const saved=await workWrite(base,'POST',payload);if(saved.mode!==mode)throw Error('Chưa xác nhận quyền sử dụng tư liệu');
}
async function workSave(mode='draft'){
 if(!workCurrent||workBusy)return;
 const active=workCurrent,kind=active.kind,publish=mode==='publish';
 if(mode!=='publish'&&active.record?.published&&mode!=='withdraw')return;
 const inputs=Array.from(document.querySelectorAll('#work-editor-panel input,#work-editor-panel select,#work-editor-panel textarea,#work-editor-panel button'));
 const disabled=inputs.map(el=>[el,el.disabled]);
 workBusy=true;for(const el of inputs)el.disabled=true;
 let completed=false;
 const progress=message=>workStatus(message);
 async function patch(fields){
  if(!Object.keys(fields).length)return;
  const result=await workWrite(workRoot+kind+'/'+active.id,'PATCH',{version:active.record.gdd_version,fields});
  if(result?.data?.id!==active.id)throw Error('Máy chủ chưa xác nhận đã lưu');
  active.record=result.data;workUpdateIdentity();workKeepPhotoDraft();
 }
 try{
  if(kind==='people'&&workDeathValidate&&!workDeathValidate())throw Error('Xin kiểm tra ngày qui vị trước khi lưu.');
  const title=workFieldInputs.get(kind==='people'||kind==='gdd_calendar_memorials'?'full_name':'title')?.value.trim();
  if(!title)throw Error('Nhập danh xưng hoặc nhan đề trước.');
  if(publish&&kind==='people'&&(!workFieldInputs.get('branch')?.value||!workFieldInputs.get('rank')?.value.trim()))throw Error('Chọn Cơ quan và Phẩm vị trước.');
  if(publish&&kind==='documents'&&!Object.hasOwn(workDocumentFolders,workFieldInputs.get('subfolder_code')?.value||''))throw Error('Chọn một danh mục lưu trữ trước.');
  if(publish&&kind==='media'&&!workGalleryCategories.includes(workFieldInputs.get('category')?.value))throw Error('Chọn một trong 6 chuyên mục Hình ảnh trước khi đăng bài.');
  if(publish&&kind==='gdd_audio_programs'){
   if(!workFieldInputs.get('category')?.value)throw Error('Chọn chuyên mục âm thanh.');
   if(!workAudioFile&&!workFieldInputs.get('audio_url')?.value.trim())throw Error('Chọn tệp MP3 trước khi đăng bài.');
  }
  const changes=workChanged();delete changes.published;
  if(mode==='withdraw'){
   if(workHasLocalFiles())throw Error('Còn tệp đang chọn. Hãy bỏ chọn hoặc cập nhật bài trước.');
   await patch({published:false});completed=true;return;
  }
  progress('Đang lưu nội dung…');
  if(workCoverQueue.size)await workKeepCoverFiles();else workKeepPhotoDraft();
  if(!active.id){
   const result=await workWrite(workRoot+kind,'POST',{fields:{...changes,published:false}});
   if(!result?.data?.id)throw Error('Máy chủ chưa xác nhận bản nháp');
   active.id=result.data.id;active.record=result.data;
   window.GDDPhotoAlbum?.bindRecord(active);workUpdateIdentity();workKeepPhotoDraft();
  }else if(!active.record.published)await patch(changes);
  if(!publish){
   progress(workHasLocalFiles()?'Đã lưu bản nháp. Tệp đang chọn còn ở trang này; nhấn Đăng bài để tải lên.':'Đã lưu bản nháp.');
   return;
  }
  if(workCanonicalKinds.has(kind)&&!active.record.archive_code){
   progress('Đang cấp mã định danh…');
   const candidate=await api(workRoot+kind+'/'+active.id+'/code-preview');
   if(!candidate.candidate||!candidate.requires_confirmation)throw Error('Chưa xác định được mã định danh');
   if(candidate.needs_special_review&&!confirm('Phẩm vị đặc biệt: '+candidate.classification+'. Xác nhận mã '+candidate.candidate+'?'))throw Error('Chưa xác nhận nhóm mã đặc biệt');
   const result=await workWrite(workRoot+kind+'/'+active.id+'/assign-code','POST',{code:candidate.candidate,version:candidate.version,confirmed:true});
   if(!result.assigned||result.code!==candidate.candidate)throw Error('Chưa cấp được mã định danh');
   const saved=await api(workRoot+kind+'/'+active.id);
   if(saved?.data?.id!==active.id||saved.data.archive_code!==result.code)throw Error('Chưa xác nhận hồ sơ sau cấp mã');
   active.record=saved.data;workUpdateIdentity();workKeepPhotoDraft();
  }
  if(kind==='gdd_audio_programs'&&workAudioFile){
   const category=workFieldInputs.get('category').value;
   if(!window.GDDAudioOptimizer)throw Error('Bộ tối ưu MP3 chưa tải. Vui lòng tải lại trang.');
   if(!workAudioPrepared||workAudioPrepared.file!==workAudioFile||workAudioPrepared.category!==category){
    const result=await window.GDDAudioOptimizer.optimize(workAudioFile,category,progress);
    workAudioPrepared={file:workAudioFile,category,...result};
   }
   const prepared=workAudioPrepared;
   progress('Đang tải bản nghe '+(prepared.blob.size/1000000).toFixed(2)+' MB lên R2…');
   const response=await fetch('/api/v1/admin/audio/'+active.id,{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'audio/mpeg'},body:prepared.blob});
   const uploaded=await response.json();
   if(!response.ok||!uploaded.uploaded||!uploaded.url)throw Error('Không tải được MP3: '+(uploaded.error||response.status));
   workFieldInputs.get('audio_url').value=uploaded.url;
   if(workFieldInputs.has('duration_seconds'))workFieldInputs.get('duration_seconds').value=String(prepared.duration);
  }
  for(const [field,item] of workCoverQueue){
   progress('Đang tải ảnh bìa…');
   item.checkpoint=workKeepCoverFiles;
   const url=await window.GDDPhotoAlbum.uploadCover(item.file,progress,item,kind);
   const slot=workCoverControls.get(field)?.slot||1;
   if(slot>1){
    if(!item.linked){const result=await workWrite(workRoot+kind+'/'+active.id+'/covers','POST',{slot,asset_id:item.assetId});if(result?.data?.image_url!==url)throw Error('Chưa xác nhận ảnh bìa '+slot);item.linked=true}
    await workKeepCoverFiles();continue;
   }
   if(kind==='documents'&&field==='cover_url'&&!item.linked){
    const result=await workWrite(workRoot+kind+'/'+active.id+'/photos','POST',{asset_id:item.assetId,caption:'Ảnh bìa bài viết',role:'cover'});
    if(result?.data?.image_url!==url)throw Error('Chưa xác nhận ảnh bìa tài liệu');
    item.linked=true;
   }
   workFieldInputs.get(field).value=url;
   if(!active.record.published&&!(kind==='documents'&&field==='cover_url'))await patch({[field]:url});
   await workKeepCoverFiles();
  }
  if(window.GDDPhotoAlbum?.hasPhotos())await window.GDDPhotoAlbum.uploadBatch(active,progress);
  if(window.GDDPhotoAlbum?.hasDocuments())await window.GDDPhotoAlbum.uploadDocuments(active,progress);
  await window.GDDPhotoAlbum?.saveDownloadPermissions(active,false,progress);
  const restricted=$('work-record-access')&&$('work-record-access').value!=='download';
  const readerPlans=await window.GDDPhotoAlbum?.prepareReaders(active,progress,!!restricted)||[];
  await workApplyRecordAccess(active,readerPlans,progress);
  const finalFields=workChanged();delete finalFields.published;
  if(!active.record.published)finalFields.published=true;
  progress('Đang đưa bài lên website…');
  await patch(finalFields);
  if(!active.record.published)throw Error('Máy chủ chưa xác nhận trạng thái đã đăng');
  await window.GDDPhotoAlbum?.releaseReaders(active,readerPlans,progress);
  await window.GDDPhotoAlbum?.saveDownloadPermissions(active,true,progress);
  completed=true;
 }catch(e){
  progress('Chưa hoàn tất: '+e.message+(active.id?(active.record?.published?' · Bài cũ vẫn đang hiển thị; ảnh đã gắn có thể đã xuất hiện.':' · Bản nháp đã được giữ. Có thể nhấn Đăng bài để thử tiếp.'):''));
 }finally{
  workBusy=false;for(const [el,was] of disabled)if(el.isConnected)el.disabled=was;
  window.GDDPhotoAlbum?.refresh();
  workUpdateIdentity();
  if(!completed)workKeepPhotoDraft();
  if(completed){workForgetPhotoDraft();const id=active.id;await workOpen(kind,id,{scroll:false});await workList();workStatus(mode==='withdraw'?'Đã chuyển về bản nháp.':'Đã đăng bài thành công lên website.');}
 }
}
$('work-kind').addEventListener('change',()=>{
 if(workBusy)return;
 if(workHasLocalFiles()&&!confirm('Tệp đang chọn chưa được lưu. Chuyển chuyên mục?')){$('work-kind').value=workCurrent.kind;return}
 workOffset=0;$('work-search').value='';workCachedPage=[];
 workClose();adminMarkKind();adminSetListMode('all')
});
$('admin-home-grid').addEventListener('click',event=>{
 const button=event.target.closest('[data-admin-kind]');if(!button||workBusy||workTrashBusy)return;
 if($('work-kind').value!==button.dataset.adminKind){
  $('work-kind').value=button.dataset.adminKind;$('work-kind').dispatchEvent(new Event('change'));
 }else if(!workCurrent)adminSetListMode('all');
 adminMarkKind();
});
$('admin-home-drafts').addEventListener('click',()=>{if(!workBusy&&!workTrashBusy)adminSetListMode(workDraftMode?'all':'draft')});
$('admin-home-trash').addEventListener('click',()=>{if(!workBusy&&!workTrashBusy)adminSetListMode(workTrashMode?'all':'trash')});
$('admin-home-r2').addEventListener('click',async()=>{
 const btn=$('admin-home-r2'),status=$('admin-home-storage');btn.disabled=true;status.textContent='Đang kiểm kê R2…';
 try{const r=await api('/api/v1/admin/r2/inventory');if(!Number.isFinite(r.total_bytes)||!Number.isFinite(r.objects))throw Error('Dữ liệu không hợp lệ');status.textContent=(r.total_bytes/1e9).toFixed(2)+' GB · '+r.objects+' tệp · Kiểm tra trực tiếp.'}
 catch(e){status.textContent='Chưa đọc được dung lượng: '+e.message}finally{btn.disabled=false}
});
adminMarkKind();

function archiveParseCSV(raw){
 const rows=[];let row=[],cell='',quoted=false,closed=false;const str=String(raw).replace(/^\\uFEFF/,'');
 for(let i=0;i<str.length;i++){const ch=str[i];
  if(quoted){if(ch==='"'){if(str[i+1]==='"'){cell+='"';i++}else{quoted=false;closed=true}}else cell+=ch;continue}
  if(ch===','||ch==='\\n'||ch==='\\r'){row.push(cell);cell='';closed=false;if(ch!==','){if(ch==='\\r'&&str[i+1]==='\\n')i++;rows.push(row);row=[]}continue}
  if(ch==='"'&&!cell&&!closed){quoted=true;continue}
  if(closed||ch==='"')throw Error('CSV sai định dạng');
  cell+=ch;
 }
 if(quoted)throw Error('CSV thiếu dấu ngoặc kép');
 if(row.length||cell||closed){row.push(cell);rows.push(row)}
 return rows.filter(r=>r.some(v=>v.trim()));
}
const archiveBatchNorm=value=>String(value??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/đ/gi,'d').toLocaleLowerCase('vi').replace(/\\s+/g,' ').trim();
function archiveBatchCandidates(raw){
 const [head,...rows]=archiveParseCSV(raw);
 const required=['ten_tep','nhan_de_goi_y','nam_goi_y','nhom_nguon','xuat_xu_so_hieu','sha256','da_duyet'];
 if(!head||required.some(key=>!head.includes(key))||new Set(head).size!==head.length)throw Error('CSV không đúng mẫu kiểm kê');
 if(rows.length>1000)throw Error('Tối đa 1.000 dòng trong danh mục');
 const items=[],hashes=new Set(),titles=new Set();
 for(const row of rows){
  if(row.length!==head.length)throw Error('Một dòng CSV không đúng số cột');
  const r=Object.fromEntries(head.map((k,i)=>[k,row[i]]));
  if(archiveBatchNorm(r.da_duyet)!=='co')continue;
  const title=r.nhan_de_goi_y.trim(),hash=r.sha256.trim().toLowerCase(),year=r.nam_goi_y.trim(),source=r.nhom_nguon.trim(),notes=r.xuat_xu_so_hieu.trim();
  let problem='';
  if(!title||title.length>220||!/^[a-f0-9]{64}$/.test(hash)||year.length>1500||notes.length>14980)problem='Nhan đề, mã SHA-256 hoặc thông tin vượt giới hạn';
  else if(hashes.has(hash)||titles.has(archiveBatchNorm(title)))problem='Trùng trong danh mục';
  if(!problem){hashes.add(hash);titles.add(archiveBatchNorm(title))}
  items.push({file:r.ten_tep,title,year,source,notes,hash,problem,selected:!problem,done:false,id:null,assetId:null,linked:false});
 }
 return items;
}
let archiveBatchRows=[],archiveBatchReady=false,archiveInventoryCSV=null,archiveInventoryOriginals=[];
function archiveBatchRender(){
 const list=$('work-archive-rows');list.replaceChildren();
 for(const r of archiveBatchRows){
  const li=document.createElement('li'),label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.checked=r.selected;box.disabled=!!r.problem||r.done;box.onchange=()=>{r.selected=box.checked;archiveBatchButton()};
  label.append(box,document.createTextNode(' '+r.title));li.append(label);appendText(li,'small',r.file+' · '+(r.year||'Chưa rõ năm')+' · '+(r.source||'Chưa rõ nguồn')+' · '+(r.linked?'Đã gắn tệp':r.done?'Có bản nháp · '+r.id:r.problem||'Chờ tạo nháp'));list.append(li);
 }
 archiveBatchButton();
}
function archiveBatchButton(){
 const n=archiveBatchRows.filter(r=>r.selected&&!r.problem&&!r.done).length;
 $('work-archive-create').disabled=!archiveBatchReady||n<1||n>30||!$('work-archive-folder').value;
}
async function archiveBatchExisting(){
 const existing=new Map();
 for(const trash of [false,true]){
  let complete=false;
  for(let offset=0;offset<=5000;offset+=50){
   const response=await api(workRoot+'documents?limit=50&offset='+offset+(trash?'&trash=1':''));
   if(!Array.isArray(response.data)||response.data.length>50)throw Error('Không đọc đủ danh mục D1');
   for(const row of response.data){const key=archiveBatchNorm(row.title),matches=existing.get(key)||[];matches.push({...row,trash});existing.set(key,matches)}
   if(response.data.length<50){complete=true;break}
  }
  if(!complete)throw Error('Kho lớn hơn giới hạn kiểm tra, không tự tạo bản nháp');
 }
 return existing;
}
$('work-archive-folder').addEventListener('change',archiveBatchButton);
$('work-archive-csv').addEventListener('change',()=>{archiveInventoryCSV=null;archiveInventoryOriginals=[];archiveBatchReady=false;archiveBatchRows=[];archiveBatchRender();$('work-archive-status').textContent='Chọn Kiểm tra danh mục.'});
async function archiveBatchRun(create){
 if(workBusy||workTrashBusy||$('work-kind').value!=='documents')return;
 if(workCurrent){$('work-archive-status').textContent='Đóng biểu mẫu đang sửa trước khi nhập danh mục.';return}
 const status=$('work-archive-status'),folder=$('work-archive-folder').value;
 if(create&&(!archiveBatchReady||!Object.hasOwn(workDocumentFolders,folder)))return;
 const files=$('work-archive-csv').files;
 if(!create&&archiveInventoryCSV===null&&(!files.length||files[0].size>2*1048576)){status.textContent='Chọn CSV tối đa 2 MB.';return}
 const selected=archiveBatchRows.filter(r=>r.selected&&!r.problem&&!r.done);
 if(create&&(selected.length<1||selected.length>30||!confirm('Tạo '+selected.length+' bản nháp riêng trong '+workDocumentFolders[folder]+'? Nếu chọn Các Cơ Quan Khác, dòng đã nhận diện văn khố sẽ vào danh mục tương ứng. Không đăng bài, không tải tệp, không cấp mã.')))return;
 const controls=Array.from(document.querySelectorAll('#work-editor-panel input,#work-editor-panel select,#work-editor-panel button'));
 const disabled=controls.map(el=>[el,el.disabled]);workBusy=true;controls.forEach(el=>el.disabled=true);
 try{
  const session=await api('/api/v1/admin/session');if(session.authenticated!==true||session.working_editor_enabled!==true)throw Error('Phiên quản trị không hợp lệ');
  if(!create){archiveBatchReady=false;archiveBatchRows=archiveBatchCandidates(archiveInventoryCSV!==null?archiveInventoryCSV:await files[0].text());}
  status.textContent='Đối chiếu nhan đề với D1…';
  const existing=await archiveBatchExisting();
  for(const r of archiveBatchRows)if(!r.done&&!r.problem&&existing.has(archiveBatchNorm(r.title))){
   const matches=existing.get(archiveBatchNorm(r.title));
   if(matches.length===1&&!matches[0].trash&&Number(matches[0].published)===0){r.id=matches[0].id;r.done=true;r.selected=false;}
   else{r.problem='Nhan đề đã có trong D1 hoặc thùng rác';r.selected=false}
  }
  if(!create){archiveBatchReady=true;status.textContent='Đã kiểm tra '+archiveBatchRows.length+' dòng được duyệt. Chọn tối đa 30 dòng hợp lệ và thư mục gốc.';return}
  let count=0;
  for(const r of selected){
   if(r.problem||r.done)continue;
   status.textContent='Đang tạo nháp '+(count+1)+' · '+r.title;
   const tag=r.source==='VKNN'?'[VKNN]':r.source==='VKVN'?'[VKVN]':'';
   const actualFolder=folder==='CQK'&&['VKNN','VKVN'].includes(r.source)?r.source:folder;
    const fields={title:r.title,subfolder_code:actualFolder,document_date:r.year,sources:[tag,r.notes].filter(Boolean).join(' '),published:false};
   const result=await workWrite(workRoot+'documents','POST',{fields});
   if(!result?.data?.id||result.published!==false||Number(result.data.published)!==0)throw Error('Chưa xác nhận bản nháp; dừng để đối chiếu');
   r.id=result.data.id;r.done=true;r.selected=false;count++;
  }
  status.textContent='Đã tạo '+count+' bản nháp. Mở từng bản để đính kèm tài liệu, đối chiếu rồi đăng.';
  workOffset=0;await adminSetListMode('draft');
 }catch(e){archiveBatchReady=false;status.textContent='Đã dừng: '+e.message+'. Các bản nháp đã tạo vẫn được giữ; hãy kiểm tra danh mục lại trước khi thử tiếp.'}
 finally{workBusy=false;for(const [el,was] of disabled)if(el.isConnected)el.disabled=was;archiveBatchRender()}
}
$('work-archive-prepare').addEventListener('click',()=>archiveBatchRun(false));
$('work-archive-create').addEventListener('click',()=>archiveBatchRun(true));

async function archiveFileHash(file){
 const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
const archiveAuditPath='/api/v1/admin/r2/managed/v1/duplicate-audit';
async function archiveAudit(files,notify){
 const sizes=[...new Set(files.map(x=>x.file.size))],wanted=new Set(files.map(x=>x.hash)),hits=new Set(),seen=new Set();
 let cursor=null,pages=0;
 do{
  if(++pages>100)throw Error('Kho vượt giới hạn kiểm tra; chưa thể kết luận không trùng');
  notify('Đối chiếu danh mục R2 · lượt '+pages);
  const result=await workWrite(archiveAuditPath,'POST',{action:'list',sizes,...(cursor?{cursor}:{})});
  if(!Array.isArray(result.candidates)||result.candidates.length>1000||!(result.cursor===null||typeof result.cursor==='string'))throw Error('Danh mục R2 không hợp lệ');
  for(const object of result.candidates){
   if(!sizes.includes(object.size))throw Error('Dung lượng đối chiếu không hợp lệ');
   const checked=await workWrite(archiveAuditPath,'POST',{action:'hash',key:object.key,size:object.size,etag:object.etag});
   if(!/^[a-f0-9]{64}$/.test(checked.sha256||''))throw Error('Chưa xác nhận được SHA-256 R2');
   if(wanted.has(checked.sha256))hits.add(checked.sha256);
  }
  cursor=result.cursor;if(cursor){if(seen.has(cursor))throw Error('Phân trang R2 bị lặp');seen.add(cursor)}
 }while(cursor);
 return hits;
}
async function archiveBatchLink(){
 if(workBusy||workTrashBusy||workCurrent||$('work-kind').value!=='documents')return;
 const status=$('work-archive-link-status'),chosenOriginals=Array.from($('work-archive-originals').files||[]),targetHashes=new Set(archiveBatchRows.filter(r=>r.id&&!r.problem&&!r.linked).map(r=>r.hash)),originals=chosenOriginals.length?chosenOriginals:archiveInventoryOriginals.filter(r=>targetHashes.has(r.hash)).map(r=>r.original),ocrFiles=Array.from($('work-archive-ocr').files||[]);
 if(!archiveBatchRows.length||!originals.length||originals.length>30||ocrFiles.length>30){status.textContent='Nhập và kiểm tra CSV trước, tạo bản nháp, rồi chọn 1–30 tệp gốc.';return}
 if(originals.some(f=>!/\\.(pdf|doc|docx)$/i.test(f.name)||f.size<1||f.size>45*1048576)){status.textContent='Chỉ PDF/Word, tối đa 45 MB mỗi tệp.';return}
 const controls=Array.from(document.querySelectorAll('#work-editor-panel input,#work-editor-panel select,#work-editor-panel button'));
 const disabled=controls.map(el=>[el,el.disabled]);workBusy=true;controls.forEach(el=>el.disabled=true);
 const say=message=>status.textContent=message;
 try{
  const session=await api('/api/v1/admin/session');if(session.authenticated!==true||session.working_editor_enabled!==true||session.managed_r2_enabled!==true)throw Error('Phiên quản trị hoặc R2 không hợp lệ');
  const targets=new Map(archiveBatchRows.filter(r=>r.id&&!r.problem&&!r.linked).map(r=>[r.hash,r]));
  const matched=[],localHashes=new Set();
  for(const file of originals){
   say('Đọc SHA-256: '+file.name);const hash=await archiveFileHash(file),r=targets.get(hash);
   if(!r)throw Error('Không có bản nháp khớp SHA-256: '+file.name);
   if(localHashes.has(hash))throw Error('Tệp được chọn trùng nhau: '+file.name);
   localHashes.add(hash);matched.push({file,hash,r});
  }
  const texts=new Map();
  for(const file of ocrFiles){
   const name=file.name.toLowerCase(),match=/^([a-f0-9]{64})\\.txt$/.exec(name);
   if(!match||!localHashes.has(match[1])||texts.has(match[1])||file.size>256*1024)throw Error('OCR không khớp SHA-256 hoặc vượt giới hạn: '+file.name);
   const value=(await file.text()).trim();if(!value||value.length>58000)throw Error('OCR trống hoặc quá dài: '+file.name);
   texts.set(match[1],value);
  }
  const check=matched.filter(x=>!x.r.assetId);
  const duplicates=check.length?await archiveAudit(check,say):new Set();
  const eligible=[];
  for(const x of matched){
   if(duplicates.has(x.hash)){x.r.problem='SHA-256 đã tồn tại trong R2; không tải lại';continue}
   const saved=await api(workRoot+'documents/'+x.r.id);
   const row=saved.data;
   if(row?.id!==x.r.id||Number(row.published)!==0||archiveBatchNorm(row.title)!==archiveBatchNorm(x.r.title))throw Error('Bản nháp đã thay đổi: '+x.r.title);
   if(texts.has(x.hash)){
    const marker='BẢN NHẬN DẠNG OCR — CHƯA KIỂM CHỨNG';
    const old=String(row.body||'');
    const next=(old?old+'\\n\\n':'')+marker+'\\n'+texts.get(x.hash);
    if(!old.includes(marker)&&next.length>65000)throw Error('OCR vượt dung lượng nội dung: '+x.r.title);
   }
   eligible.push(x);
  }
  if(!eligible.length){say('Tất cả tệp đã có trong R2; không tải lại.');return}
  if(!confirm('Đã đối chiếu R2. Gắn '+eligible.length+' tệp vào các bản nháp đúng nhan đề và SHA-256; bỏ qua '+duplicates.size+' tệp trùng. OCR đã chọn sẽ trở thành nội dung có thể tìm kiếm khi công bố. Không đăng bài?')){say('Đã hủy; không tải tệp.');return}
  let count=0;
  for(const x of eligible){
   const r=x.r;let record=(await api(workRoot+'documents/'+r.id)).data;
   if(record?.id!==r.id||Number(record.published)!==0||archiveBatchNorm(record.title)!==archiveBatchNorm(r.title))throw Error('Bản nháp đã thay đổi: '+r.title);
   say('Đang gắn '+(count+1)+'/'+eligible.length+': '+r.title);
   if(!r.assetId)r.assetId=await window.GDDPhotoAlbum.archiveBatchDocument(x.file,say);
   const link=await workWrite(workRoot+'documents/'+r.id+'/attachments','POST',{asset_id:r.assetId});
   if(link?.data?.asset_id!==r.assetId)throw Error('Chưa xác nhận liên kết R2');
   const marker='BẢN NHẬN DẠNG OCR — CHƯA KIỂM CHỨNG';
   if(texts.has(x.hash)&&!String(record.body||'').includes(marker)){
    const body=[record.body,marker+'\\n'+texts.get(x.hash)].filter(Boolean).join('\\n\\n');
    if(body.length>65000)throw Error('OCR vượt giới hạn');
    const saved=await workWrite(workRoot+'documents/'+r.id,'PATCH',{version:record.gdd_version,fields:{body}});
    if(saved?.data?.id!==r.id||Number(saved.data.published)!==0)throw Error('Chưa xác nhận lưu OCR');
   }
   r.linked=true;count++;
  }
  say('Đã gắn '+count+' văn kiện vào bản nháp. Bản trùng đã bỏ qua. Kiểm tra từng hồ sơ trước khi công bố.');
  await workList();
 }catch(e){say('Dừng an toàn: '+e.message+'. Những tệp đã gắn vẫn giữ nguyên; không tự công bố.')}
 finally{workBusy=false;for(const [el,was] of disabled)if(el.isConnected)el.disabled=was;archiveBatchRender()}
}
$('work-archive-link').addEventListener('click',archiveBatchLink);

const invRows=[],invHashes=new Map();let invBusy=false;
const invDoc=r=>/\\.(pdf|doc|docx)$/i.test(r.file);
const invEligible=r=>!!r.hash&&!r.duplicate;
function invCSV(onlyDocs=false){
 const rows=onlyDocs?invRows.filter(r=>r.approved&&invEligible(r)&&invDoc(r)):invRows;
 const cell=value=>{let v=String(value??'');if(/^[\\s\\uFEFF]*[=+@-]/.test(v)||/^[\\t\\r\\n]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"'};
 return [['ten_tep','dung_luong_byte','nhan_de_goi_y','nam_goi_y','nhom_nguon','xuat_xu_so_hieu','sha256','kiem_tra','da_duyet'],...rows.map(r=>[r.file,r.size,r.title,r.year,r.source,r.notes,r.hash,r.status,r.approved?'co':'chua'])].map(row=>row.map(cell).join(',')).join('\\r\\n');
}
function invButtons(){
 const approved=invRows.filter(r=>r.approved&&invEligible(r)),docs=approved.filter(invDoc);
 $('archive-inventory-export').disabled=invBusy||workBusy||!invRows.length;
 $('archive-inventory-clear').disabled=invBusy||workBusy||!invRows.length;
 $('archive-inventory-transfer').disabled=invBusy||workBusy||docs.length<1||docs.length>30;
 $('archive-inventory-status').textContent=invRows.length+' tệp · '+invRows.filter(r=>r.duplicate).length+' trùng · '+approved.length+' đã duyệt · '+docs.length+' PDF/Word'+(docs.length>30?' · Chỉ duyệt tối đa 30 PDF/Word để chuyển mỗi lượt.':'');
}
function invRender(){
 const root=$('archive-inventory-rows');root.replaceChildren();
 for(const r of invRows){
  const row=document.createElement('div');row.className='archive-inv-row';
  appendText(row,'strong',r.file+' · '+(r.size/1048576).toFixed(2)+' MB');appendText(row,'small',r.status);
  for(const [field,title] of [['title','Nhan đề'],['year','Niên đại'],['source','Nguồn'],['notes','Xuất xứ / số hiệu']]){
   const label=document.createElement('label');label.textContent=title;
   const input=document.createElement(field==='source'?'select':'input');
   if(field==='source')for(const [value,text] of [['','Chưa rõ'],['VKNN','Văn Khố Ngoại Quốc'],['VKVN','Văn Khố Việt Nam'],['other','Khác']]){const o=document.createElement('option');o.value=value;o.textContent=text;input.append(o)}
   input.value=r[field];input.disabled=!invEligible(r);input.addEventListener('input',()=>r[field]=input.value);label.append(input);row.append(label);
  }
  const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=r.approved;check.disabled=!invEligible(r);check.addEventListener('change',()=>{r.approved=check.checked;invButtons()});label.append(check,document.createTextNode(' Đã đối chiếu, duyệt văn kiện'));row.append(label);root.append(row);
 }
 invButtons();
}
$('archive-inventory-files').addEventListener('change',async()=>{
 if(invBusy||workBusy||workCurrent){$('archive-inventory-status').textContent='Đóng biểu mẫu đang sửa trước khi kiểm kê.';return}
 const input=$('archive-inventory-files'),files=Array.from(input.files||[]);
 if(invRows.length+files.length>1000){$('archive-inventory-status').textContent='Tối đa 1.000 tệp trong danh mục.';input.value='';return}
 invBusy=true;workBusy=true;const controls=Array.from(document.querySelectorAll('#work-editor-panel input,#work-editor-panel select,#work-editor-panel button')),disabled=controls.map(el=>[el,el.disabled]);controls.forEach(el=>el.disabled=true);
 try{
  for(const file of files){
   $('archive-inventory-status').textContent='Đang tính SHA-256: '+file.name;
   const title=file.name.replace(/\\.[^.]+$/,'').replace(/_/g,' ').trim(),key=archiveBatchNorm(title),year=(title.match(/(?:^|[^0-9])((?:18|19|20)\\d{2})(?=[^0-9]|$)/)||[])[1]||'';
   const source=/\\b(?:cia|nara|anom|gallica|frus|pentagon|texas tech|archives)\\b/.test(key)?'VKNN':/\\b(?:nac2|luu tru quoc gia)\\b/.test(key)?'VKVN':'';
   const row={file:file.name,original:file,size:file.size,title,year,source,notes:'',hash:'',status:'',duplicate:false,approved:false};
   if(!/\\.(pdf|doc|docx|jpe?g|png|webp|tiff?)$/i.test(file.name)||file.size<1||file.size>45*1048576)row.status='Tệp không hợp lệ hoặc vượt 45 MB';
   else try{row.hash=await archiveFileHash(file);row.duplicate=invHashes.has(row.hash);row.status=row.duplicate?'Trùng với '+invHashes.get(row.hash):'Chưa trùng trong danh sách này';if(!row.duplicate)invHashes.set(row.hash,row.file)}catch{row.status='Không đọc được SHA-256'}
   invRows.push(row);
  }
 }finally{invBusy=false;workBusy=false;for(const [el,was] of disabled)if(el.isConnected)el.disabled=was;input.value='';invRender()}
});
$('archive-inventory-clear').addEventListener('click',()=>{if(workBusy||invBusy||!confirm('Xóa danh sách kiểm kê trên màn hình? Tệp gốc và bản nháp không bị xóa.'))return;invRows.length=0;invHashes.clear();invRender()});
$('archive-inventory-export').addEventListener('click',()=>{if(workBusy||invBusy||!invRows.length)return;const url=URL.createObjectURL(new Blob(['\\uFEFF',invCSV()],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='Van_kho_Dao_Su_kiem_ke.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)});
$('archive-inventory-transfer').addEventListener('click',async()=>{
 if(workBusy||invBusy||workCurrent||$('work-kind').value!=='documents')return;
 const chosen=invRows.filter(r=>r.approved&&invEligible(r)&&invDoc(r));
 if(chosen.length<1||chosen.length>30)return;
 if(archiveBatchRows.some(r=>r.id||r.assetId)&&!confirm('Thay danh mục đang làm trên màn hình? Bản nháp và tệp đã lưu vẫn giữ nguyên.'))return;
 archiveInventoryCSV=invCSV(true);archiveInventoryOriginals=chosen.map(r=>({hash:r.hash,original:r.original}));
 $('work-archive-csv').value='';$('work-archive-originals').value='';
 archiveBatchRows=[];archiveBatchReady=false;
 $('work-archive-link-status').textContent='Đã giữ '+chosen.length+' tệp gốc đã kiểm kê trong phiên hiện tại. Không cần chọn lại nếu chưa tải lại trang.';
 await archiveBatchRun(false);
});



$('work-search').addEventListener('input',workRenderList);
$('work-list-refresh').addEventListener('click',workList);
$('work-trash-toggle').addEventListener('click',()=>{
 if(workBusy||workTrashBusy)return;
 adminSetListMode(workTrashMode?'all':'trash');
});
$('work-new').addEventListener('click',workNew);
$('work-save').addEventListener('click',()=>workSave('draft'));
$('work-publish').addEventListener('click',()=>workSave('publish'));
$('work-cancel').addEventListener('click',()=>{if(workBusy)return;if(workHasLocalFiles()&&!confirm('Tệp đang chọn chưa được lưu. Đóng biểu mẫu?'))return;workClose()});
$('work-prev').addEventListener('click',()=>{workOffset=Math.max(0,workOffset-workPageSize);$('work-search').value='';workList()});
$('work-next').addEventListener('click',()=>{workOffset+=workPageSize;$('work-search').value='';workList()});


$('kind').addEventListener('change',()=>{offset=0;loadRecords()});
$('view').addEventListener('change',()=>{offset=0;loadRecords()});
$('previous').addEventListener('click',()=>{if(offset>=pageSize){offset-=pageSize;loadRecords()}});
$('next').addEventListener('click',()=>{if(hasNext){offset+=pageSize;loadRecords()}});
const lookupPanel=document.querySelector('.work-archive-lookup');
lookupPanel.addEventListener('toggle',()=>{if(lookupPanel.open)loadRecords()});
const techPanel=$('inventory').closest('details.admin-technical');
techPanel.addEventListener('toggle',()=>{if(techPanel.open)overview()});
const recoveryFile=$('radio-recovery-file'),recoverySubmit=$('radio-recovery-submit'),recoveryStatus=$('radio-recovery-status');
recoveryFile.addEventListener('change',()=>{recoverySubmit.disabled=!recoveryFile.files?.[0];recoveryStatus.textContent=''});
recoverySubmit.addEventListener('click',async()=>{
 const file=recoveryFile.files?.[0];if(!file)return;
 if(file.size!==16116406){recoveryStatus.textContent='Không đúng dung lượng bản gốc.';return}
 recoverySubmit.disabled=true;recoveryFile.disabled=true;recoveryStatus.textContent='Đang lưu MP3 vào R2 và kiểm tra toàn vẹn…';
 try{
  const response=await fetch('/api/v1/admin/recover-radio-hai-muoi-nam',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'audio/mpeg'},body:file});
  const result=await response.json();if(!response.ok||!result.restored)throw Error(result.error||'Chưa khôi phục');
  recoveryStatus.textContent='Đã khôi phục MP3, kiểm tra SHA-256 và cập nhật bài cũ. Hãy mở website để nghe.';
  recoveryFile.value='';
 }catch(e){recoveryStatus.textContent='Chưa hoàn tất: '+e.message+' · Có thể thử lại.'}
 finally{recoveryFile.disabled=false;recoverySubmit.disabled=!recoveryFile.files?.[0]}
});
function adminRefreshBlockReason(){
 if(workBusy||workTrashBusy||window.GDDPhotoAlbum?.isBusy())return 'Đang xử lý bài hoặc tải tệp. Hoàn tất thao tác trước khi làm mới.';
 if(workHasLocalFiles())return 'Còn ảnh hoặc tệp chưa lưu. Hãy đăng bài hoặc bỏ tệp trước khi làm mới.';
 if(document.querySelector('#radio-recovery-file')?.files?.length||document.querySelector('#r2-managed-file')?.files?.length)return 'Còn tệp đang chọn trong công cụ R2 hoặc Radio. Hoàn tất và bỏ chọn tệp trước khi làm mới.';
 if(workCurrent){
  try{const fields=workChanged();delete fields.published;
   if(Object.keys(fields).length||!workCurrent.id)return 'Bài đang soạn chưa lưu. Hãy lưu bản nháp hoặc đăng bài trước khi làm mới.';
  }catch{return 'Bài đang soạn có thông tin chưa hoàn chỉnh. Hãy kiểm tra và lưu trước.'}
 }
 return '';
}
$('admin-app-refresh').addEventListener('click',()=>{
 const msg=$('admin-app-refresh-status'),reason=adminRefreshBlockReason();
 if(reason){msg.textContent=reason;return}
 if(workCurrent)workForgetPhotoDraft();
 $('admin-app-refresh').disabled=true;msg.textContent='Đang làm mới ứng dụng…';
 location.reload();
});
$('work-fields').addEventListener('input',workKeepPhotoDraft);
$('work-fields').addEventListener('change',workKeepPhotoDraft);
$('work-edit-area').addEventListener('pointerdown',workKeepPhotoDraft,true);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')workKeepPhotoDraft()});
window.addEventListener('pagehide',workKeepPhotoDraft);
initAdmin();
`;
