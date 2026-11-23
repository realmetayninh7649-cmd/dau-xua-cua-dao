/* Offline-safe management preview. All database requests use same-origin Access-protected routes. */
export const ADMIN_HTML=`<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Quản trị tư liệu — Dấu Xưa Cửa Đạo (Thử nghiệm)</title>
<link rel="stylesheet" href="/admin/style.css">
<script src="/admin/app.js" defer></script>
</head><body>
<header class="masthead"><div class="wrap">
<p class="eyebrow">ĐẠI ĐẠO TAM KỲ PHỔ ĐỘ · KHO TƯ LIỆU ĐẠO SỬ</p>
<h1>Quản trị tư liệu</h1>
<p class="lead">Bảng điều khiển D1 · Chế độ thử nghiệm chỉ đọc</p>
</div></header>
<main class="wrap">
<section class="notice" role="status"><strong>Đang kiểm thử an toàn.</strong> Dữ liệu hiển thị lấy từ Cloudflare D1. Chức năng thêm, sửa, xóa, tải tệp vẫn được khóa. Website chính vẫn đang bảo trì.</section>
<section aria-labelledby="state-title"><div class="heading"><h2 id="state-title">Tình trạng dữ liệu</h2><button id="refresh" type="button">Làm mới</button></div>
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
<section aria-labelledby="r2-managed-title" id="r2-managed-panel" hidden>
<div class="heading"><h2 id="r2-managed-title">Bảo tồn ảnh / PDF / Word vào kho R2</h2><small>Cloudflare Access · Nguyên mẫu riêng tư</small></div>
<p class="audit-caution">Ảnh hoặc tài liệu được cất nguyên vẹn dưới dạng bản gốc riêng tư trong R2. Tệp lớn tải thành các phần 8 MB. Chỉ khi chủ động nhấn Công bố bản xem thì ảnh tối ưu mới được mở cho độc giả. PDF/DOCX cần tạo bản đọc từng trang riêng trước khi công bố.</p>
<div class="controls"><input id="r2-managed-file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.tif,.tiff,.heic,.heif,.avif">
<button id="r2-managed-upload" type="button">Bảo tồn bản gốc vào R2</button></div>
<p id="r2-managed-status" role="status" aria-live="polite">Chưa chọn tệp để lưu.</p>
<div id="r2-managed-actions" hidden>
<div class="controls"><button id="r2-managed-derivative" type="button">Tạo bản xem và bản in JPEG của ảnh</button></div>
<div class="controls"><label class="sandbox-checkbox"><input id="r2-managed-public-confirm" type="checkbox"> Tôi đã kiểm tra hình ảnh và đồng ý công bố bản xem</label></div>
<div class="controls"><label class="sandbox-checkbox"><input id="r2-managed-download-confirm" type="checkbox"> Cho phép tải bản JPEG tối ưu (không phải bản gốc)</label>
<button id="r2-managed-publish" type="button">Công bố bản xem</button></div>
</div>
</section>
<section aria-labelledby="r2-sandbox-title">
<div class="heading"><h2 id="r2-sandbox-title">Thử tải ảnh, PDF, Word lên R2 riêng tư</h2><small>Không công bố bản gốc</small></div>
<p class="audit-caution">Chỉ dùng tệp thử nghiệm tối đa 2 MB, giới hạn 20 tệp trong kho thử. Tệp mới nằm trong thư mục nội bộ riêng của R2, không có đường dẫn tải công khai; không xóa hay ghi đè ảnh/PDF tư liệu cũ.</p>
<div class="controls"><input id="r2-sandbox-file" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.docx"><button id="r2-sandbox-upload" type="button">Tải tệp thử nghiệm</button><button id="r2-sandbox-refresh" type="button">Kiểm kê tệp thử</button></div>
<p id="r2-sandbox-status" role="status" aria-live="polite">Chưa kiểm tra kho thử.</p>
</section>
<section aria-labelledby="inventory-title"><div class="heading"><h2 id="inventory-title">Đối chiếu 21 bảng D1</h2><small>Đối chiếu với số liệu Supabase ngày 23/11/2026 (bản chụp)</small></div>
<div class="table-scroll"><table><thead><tr><th scope="col">Bảng dữ liệu</th><th scope="col" class="number">Supabase</th><th scope="col" class="number">D1</th><th scope="col" class="number">Còn thiếu</th></tr></thead><tbody id="inventory"></tbody></table></div>
</section>
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
</section>
<section aria-labelledby="sandbox-title">
<div class="heading"><h2 id="sandbox-title">Thử biên tập — cơ sở D1 riêng</h2><small>KHÔNG sửa tư liệu thật</small></div>
<p class="audit-caution">Mọi nội dung dưới đây chỉ được ghi vào cơ sở thử nghiệm riêng, không xuất bản ra website và không tác động 21 bảng tư liệu đã phục hồi. Có thể tạo bản nháp, sửa, xem lịch sử và khôi phục nội dung cũ. Không có nút xóa vĩnh viễn.</p>
<div class="controls">
<label for="sandbox-kind">Loại bản thử</label>
<select id="sandbox-kind"><option value="people">Hồ sơ Chức sắc</option><option value="posts">Biên khảo</option><option value="documents">Tài liệu</option><option value="media">Hình ảnh</option></select>
</div>
<div class="sandbox-form">
<label for="sandbox-title-input">Nhan đề thử nghiệm</label><input id="sandbox-title-input" type="text" maxlength="160" placeholder="Chỉ ghi nội dung thử nghiệm">
<label for="sandbox-summary">Tóm tắt</label><textarea id="sandbox-summary" maxlength="2000" rows="3"></textarea>
<label for="sandbox-body">Nội dung</label><textarea id="sandbox-body" maxlength="16000" rows="5"></textarea>
<label class="sandbox-checkbox"><input id="sandbox-published" type="checkbox"> Đánh dấu công bố *trong sandbox* (không đưa lên web)</label>
<div class="controls"><button id="sandbox-save" type="button">Tạo bản nháp thử nghiệm</button><button id="sandbox-new" type="button">Tạo bản mới</button><button id="sandbox-refresh" type="button">Làm mới danh sách</button></div>
</div>
<p id="sandbox-status" role="status" aria-live="polite">Đang tải danh sách thử nghiệm…</p>
<ul id="sandbox-list" class="records"></ul>
<h3>Lịch sử phiên bản và phục hồi</h3><ul id="sandbox-history" class="records"></ul>
</section>
<section aria-labelledby="work-title" id="work-editor-panel" hidden>
<div class="heading"><h2 id="work-title">Biên tập tư liệu trên D1 làm việc</h2><small>Cloudflare Access · Có lưu lịch sử sửa</small></div>
<p class="audit-caution">Dữ liệu có mã hồ sơ được giữ nguyên. Hồ sơ mới chỉ tạo bản nháp; không tự cấp mã định danh. Có thể phục hồi phiên bản cũ; không có thao tác xóa vĩnh viễn. Bản sao lưu D1 chuẩn không bị tác động.</p>
<div class="controls"><label for="work-kind">Chuyên mục</label>
<select id="work-kind">
<option value="people">Chức sắc</option><option value="posts">Biên khảo</option>
<option value="media">Hình ảnh</option><option value="videos">Video</option>
<option value="obituaries">Ai tín</option><option value="documents">Tài liệu số</option>
<option value="gdd_memorials">Tưởng niệm</option><option value="gdd_audio_programs">Âm thanh Đại Đạo</option>
<option value="gdd_calendar_memorials">Lịch tưởng niệm</option></select>
<button id="work-list-refresh" type="button">Tải danh sách</button>
<button id="work-new" type="button">Tạo bản nháp mới</button></div>
<p id="work-status" role="status" aria-live="polite">Chưa mở dữ liệu biên tập.</p>
<ul class="records" id="work-list"></ul>
<div class="pagination"><button id="work-prev" type="button">Trang trước</button><span id="work-page">Trang 1</span><button id="work-next" type="button">Trang sau</button></div>
<div id="work-edit-area" hidden><h3 id="work-edit-heading">Chi tiết</h3><p id="work-identity" class="audit-caution"></p>
<div class="sandbox-form" id="work-fields"></div>
<div class="controls"><button id="work-save" type="button">Lưu thay đổi</button><button id="work-cancel" type="button">Đóng biểu mẫu</button></div>
<h3>Lịch sử chỉnh sửa và phục hồi</h3><ul class="records" id="work-revisions"></ul>
</div>
</section>
<footer>Giai đoạn thử nghiệm · Bảo toàn Supabase, Cloudflare R2 và mã định danh tư liệu · Chức năng biên tập chỉ dùng D1 làm việc</footer>
</main></body></html>`;
export const ADMIN_CSS=`
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
.sandbox-form input[type=text],.sandbox-form textarea{font:inherit;width:100%;border:1px solid #aeb9b1;border-radius:8px;padding:10px;background:#fff;color:var(--ink)}
.sandbox-form textarea{resize:vertical}
.sandbox-checkbox{display:flex;gap:8px;align-items:center}
.sandbox-checkbox input{width:18px;height:18px}
.sandbox-line{display:flex;gap:9px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.sandbox-line button{font-size:.84rem;padding:7px 9px}

.safe-list{padding-left:24px;line-height:1.6}.safe-list li{padding:5px 0}.audit-caution{color:#695a41;font-size:.86rem;padding:10px;background:#fff8e8;border-radius:6px}
.records{padding:0;margin:0;list-style:none}
.records li{padding:12px 2px;border-bottom:1px solid var(--line)}
.records strong{display:block;overflow-wrap:anywhere}
.records .detail{display:block;font-size:.83rem;color:var(--muted)}
.pagination{display:flex;gap:12px;justify-content:center;align-items:center;margin-top:15px}
#status{font-size:.91rem;color:#54665b}
footer{font-size:.83rem;color:var(--muted);text-align:center;padding:8px 0}
@media(max-width:440px){.masthead{padding-top:25px}.eyebrow{font-size:.65rem}.wrap{width:calc(100% - 26px)}section:not(.notice){padding:14px}}
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
async function overview(){
 try{
  const [session,summary]=await Promise.all([
   api('/api/v1/admin/session'),api('/api/v1/admin/summary')]);
  if(session.authenticated!==true||session.write_enabled!==false)throw Error('Phiên quản trị chưa hợp lệ');
  $('work-editor-panel').hidden=session.working_editor_enabled!==true;
  $('r2-managed-panel').hidden=session.managed_r2_enabled!==true;
  if(session.working_editor_enabled===true)workList().catch(()=>{});
  const inventory=$('inventory'),cards=$('overview');inventory.replaceChildren();cards.replaceChildren();
  for(const [count,label] of [
    [summary.source_total,'Bản ghi nguồn Supabase'],
    [summary.total_records,'Đã chuyển vào D1'],
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
     ? 'Đã xác thực · D1 phục hồi riêng đủ 21 bảng theo số lượng ngày 23/11/2026 · Chỉ đọc'
     : 'CẢNH BÁO: Số lượng D1 không khớp bản chụp Supabase; chưa được phép mở website.');
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
$('refresh').addEventListener('click',()=>{overview();loadRecords()});
$('r2-audit').addEventListener('click',auditR2);
async function sandboxR2Refresh(){
 const label=$('r2-sandbox-status');
 try{
  const data=await api('/api/v1/admin/r2/staging-uploads');
  if(data.mode!=='private-r2-upload-sandbox')throw Error('Kho dữ liệu không hợp lệ');
  label.textContent='Kho tải lên thử: '+data.count+'/'+data.max_total_objects+' tệp. Bản gốc luôn riêng tư, không công bố.';
 }catch(e){label.textContent='Chưa kiểm tra được kho thử: '+e.message;}
}
async function sandboxR2Upload(){
 const file=$('r2-sandbox-file').files[0];
 const label=$('r2-sandbox-status'),button=$('r2-sandbox-upload');
 if(!file){label.textContent='Hãy chọn một tệp thử nghiệm.';return}
 if(file.size<1||file.size>2*1024*1024){label.textContent='Tệp thử phải có dung lượng tối đa 2 MB.';return}
 button.disabled=true;
 try{
  label.textContent='Đang lưu tệp thử trong kho R2 riêng tư…';
  const res=await fetch('/api/v1/admin/r2/staging-uploads',
   {method:'POST',body:file,credentials:'same-origin',cache:'no-store',
     headers:{'Content-Type':file.type}});
  const info=await res.json();
  if(!res.ok||info.original_private!==true||info.published!==false)
    throw Error(info.error||'Trạng thái riêng tư không hợp lệ');
  label.textContent='Đã lưu tệp thử riêng tư. SHA-256: '+info.sha256.slice(0,16)+'…; không thể tải công khai.';
  $('r2-sandbox-file').value='';
 }catch(e){label.textContent='Không lưu được tệp thử: '+e.message}
 finally{button.disabled=false}
}
$('r2-sandbox-upload').addEventListener('click',sandboxR2Upload);
$('r2-sandbox-refresh').addEventListener('click',sandboxR2Refresh);

// Cloudflare Access R2 originals: use the already tested private R2 gateway.
const managedBase='/api/v1/admin/r2/managed';
let managedFile=null,managedAsset=null,managedPreviewReady=false;
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
 button.disabled=true;managedFile=null;managedAsset=null;managedPreviewReady=false;
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
  $('r2-managed-actions').hidden=false;
  managedStatus('Đã bảo tồn nguyên mẫu riêng tư ('+(file.size/1048576).toFixed(1)+
    ' MB). Mã R2: '+info.id+'. '+(isImage?'Tạo bản xem trước khi công bố.':'Tài liệu vẫn riêng tư; cần bản đọc PDF/DOCX từng trang.'));
 }catch(e){managedStatus('Chưa hoàn tất tải R2: '+e.message)}
 finally{button.disabled=false}
}
async function managedImageBlob(image,type,maxDimension,quality){
 const width=image.naturalWidth,height=image.naturalHeight;
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
  blob=>blob?resolve(blob):reject(Error('Không kết xuất được ảnh xem')),
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
async function managedPublish(){
 const btn=$('r2-managed-publish');
 if(!managedAsset||!managedPreviewReady){managedStatus('Cần tạo bản xem hợp lệ trước khi công bố.');return}
 if(!$('r2-managed-public-confirm').checked){managedStatus('Cần xác nhận đã kiểm tra ảnh trước khi công bố.');return}
 if(!confirm('Công bố ảnh xem tối ưu, không phải bản gốc R2?'))return;
 btn.disabled=true;
 try{
  const out=await managedRequest('/v1/assets/'+managedAsset+'/publication',
    {method:'POST',data:JSON.stringify({publish:true,
      allowDownload:$('r2-managed-download-confirm').checked})});
  if(out.published!==true||out.originalPrivate!==true)throw Error('R2 chưa xác minh công bố');
  managedStatus('Đã công bố bản xem an toàn. Độc giả có thể mở từ trình đọc khi bài đã liên kết mã tài sản '+managedAsset+'.');
 }catch(e){managedStatus('Chưa công bố được bản xem: '+e.message)}
 finally{btn.disabled=false}
}
$('r2-managed-upload').addEventListener('click',managedUpload);
$('r2-managed-derivative').addEventListener('click',managedDerivatives);
$('r2-managed-publish').addEventListener('click',managedPublish);

sandboxR2Refresh();
// Access-protected synthetic D1 editing sandbox; no real data write endpoints.
let sandboxActive=null,sandboxVersion=null,sandboxRecords=[];
const sandboxApi='/api/v1/admin/sandbox';
function sandboxStatus(message){$('sandbox-status').textContent=message;}
function sandboxReset(){
 sandboxActive=null;sandboxVersion=null;
 $('sandbox-kind').disabled=false;$('sandbox-kind').value='people';
 $('sandbox-title-input').value='';$('sandbox-summary').value='';$('sandbox-body').value='';
 $('sandbox-published').checked=false;$('sandbox-published').disabled=true;
 $('sandbox-save').textContent='Tạo bản nháp thử nghiệm';
 $('sandbox-history').replaceChildren();
}
async function sandboxWrite(path,method,payload){
 const r=await fetch(path,{method,credentials:'same-origin',cache:'no-store',
   headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(payload)});
 const data=await r.json().catch(()=>({error:'unknown'}));
 if(!r.ok)throw Error(data.error||('HTTP '+r.status));
 return data;
}
async function sandboxHistory(id){
 const list=$('sandbox-history');list.replaceChildren();
 const json=await api(sandboxApi+'/'+encodeURIComponent(id)+'/history');
 for(const row of json.data||[]){
  const item=document.createElement('li');item.className='sandbox-line';
  appendText(item,'span','Phiên bản '+row.version_from+' → '+row.version_to+' · '+String(row.changed_at||'').slice(0,19));
  const btn=document.createElement('button');btn.type='button';btn.textContent='Khôi phục bản trước';
  btn.addEventListener('click',async()=>{
   if(sandboxActive!==id||!Number.isInteger(sandboxVersion))return;
   if(!confirm('Khôi phục nội dung trước đó trong cơ sở THỬ NGHIỆM?'))return;
   btn.disabled=true;
   try{
    await sandboxWrite(sandboxApi+'/'+encodeURIComponent(id)+'/restore','POST',
      {version:sandboxVersion,audit_id:row.audit_id});
    sandboxStatus('Đã phục hồi phiên bản trong D1 thử nghiệm.');await sandboxRefresh();
   }catch(e){sandboxStatus('Lỗi phục hồi bản thử: '+e.message)}
   finally{btn.disabled=false}
  });
  item.append(btn);list.append(item);
 }
 if(!list.children.length)appendText(list,'li','Chưa có bản sửa nào.');
}
function sandboxChoose(item){
 sandboxActive=item.id;sandboxVersion=item.version;
 $('sandbox-kind').value=item.kind;$('sandbox-kind').disabled=true;
 $('sandbox-title-input').value=item.title||'';
 $('sandbox-summary').value=item.summary||'';
 $('sandbox-body').value=item.body||'';
 $('sandbox-published').checked=item.published===1;
 $('sandbox-published').disabled=false;
 $('sandbox-save').textContent='Lưu thay đổi thử nghiệm';
 sandboxHistory(item.id).catch(e=>sandboxStatus('Không đọc được lịch sử bản thử: '+e.message));
}
async function sandboxRefresh(){
 try{
  const data=await api(sandboxApi);
  if(data.mode!=='synthetic-sandbox-only')throw Error('Nguồn không phải sandbox');
  sandboxRecords=Array.isArray(data.data)?data.data:[];
  const list=$('sandbox-list');list.replaceChildren();
  for(const item of sandboxRecords){
   const row=document.createElement('li');row.className='sandbox-line';
   appendText(row,'span',item.title+' · '+item.kind+' · phiên bản '+item.version);
   const btn=document.createElement('button');btn.type='button';btn.textContent='Sửa bản thử';
   btn.addEventListener('click',()=>sandboxChoose(item));
   row.append(btn);list.append(row);
  }
  if(!sandboxRecords.length)appendText(list,'li','Chưa có bản thử nào.');
  if(sandboxActive){
   const item=sandboxRecords.find(x=>x.id===sandboxActive);
   if(item)sandboxChoose(item);else sandboxReset();
  }
  sandboxStatus('Đang xem '+sandboxRecords.length+' bản ghi giả lập. Dữ liệu gốc không thay đổi.');
 }catch(e){sandboxStatus('Không tải được D1 sandbox: '+e.message)}
}
async function sandboxSave(){
 const button=$('sandbox-save');
 const title=$('sandbox-title-input').value.trim();
 if(!title){sandboxStatus('Cần nhập nhan đề thử nghiệm.');return}
 button.disabled=true;
 try{
  const common={title,summary:$('sandbox-summary').value,body:$('sandbox-body').value};
  if(sandboxActive){
   await sandboxWrite(sandboxApi+'/'+encodeURIComponent(sandboxActive),'PATCH',{
     ...common,published:$('sandbox-published').checked,version:sandboxVersion});
  }else{
   await sandboxWrite(sandboxApi,'POST',{...common,kind:$('sandbox-kind').value,published:false});
  }
  sandboxStatus('Đã lưu bản thử vào D1 riêng.');
  await sandboxRefresh();
 }catch(e){sandboxStatus('Không lưu được bản thử: '+e.message)}
 finally{button.disabled=false}
}
$('sandbox-save').addEventListener('click',sandboxSave);
$('sandbox-new').addEventListener('click',sandboxReset);
$('sandbox-refresh').addEventListener('click',sandboxRefresh);
sandboxReset();sandboxRefresh();

// D1 WORKING EDITOR. All fields use DOM textContent/value; no unsafe HTML insertion.
const workFields={
 people:['full_name','secular_name','rank','branch','subgroup','gender','years','birthplace','summary','biography','date_notes','sources','image_url','verified','published','sort_order','death_lunar_day','death_lunar_month','death_lunar_leap','death_solar_date'],
 posts:['title','category','summary','body','sources','person_id','cover_url','verified','published'],
 media:['title','category','caption','person_id','sources','image_url','published'],
 videos:['title','summary','body','video_url','cover_url','sources','person_id','published'],
 obituaries:['title','deceased_name','memorial_date','summary','body','cover_url','sources','person_id','published'],
 documents:['title','document_number','document_date','summary','body','file_url','sources','person_id','subfolder_code','published'],
 gdd_memorials:['title','person_name','rank_title','death_date','anniversary_date','summary','body','portrait_url','sources','published'],
 gdd_audio_programs:['title','category','summary','body','cover_url','audio_url','episode_number','duration_seconds','published_date','published'],
 gdd_calendar_memorials:['full_name','rank','calendar_system','lunar_day','lunar_month','lunar_leap','solar_day','solar_month','death_year','image_url','source_note','description','linked_person_id','published']
};
const workBool=new Set(['verified','published','death_lunar_leap','lunar_leap']);
const workNums=new Set(['sort_order','death_lunar_day','death_lunar_month','lunar_day','lunar_month','solar_day','solar_month','death_year','episode_number','duration_seconds']);
const workLong=new Set(['summary','body','biography','caption','date_notes','sources','description','source_note']);
const workLabels={
 full_name:'Thánh danh / Họ tên',title:'Nhan đề',secular_name:'Thế danh',rank:'Phẩm vị',branch:'Cơ quan',
 subgroup:'Phân nhóm',gender:'Nam / Nữ',years:'Niên đại',birthplace:'Nguyên quán',summary:'Tóm tắt',
 biography:'Tiểu sử - công nghiệp',body:'Nội dung',sources:'Tư liệu tham khảo',image_url:'Ảnh đại diện (URL)',
 cover_url:'Ảnh bìa (URL)',portrait_url:'Di ảnh (URL)',file_url:'Tài liệu (URL)',audio_url:'Âm thanh (URL)',
 video_url:'Video (URL)',published:'Công bố nội dung',verified:'Đã kiểm chứng',sort_order:'Thứ tự',
 caption:'Chú thích ảnh',category:'Chuyên mục',person_id:'Mã hồ sơ liên quan',
 document_number:'Số hiệu văn kiện',document_date:'Ngày văn kiện',subfolder_code:'Thư mục số hóa',
 death_lunar_day:'Ngày qui vị âm lịch',death_lunar_month:'Tháng qui vị âm lịch',
 death_lunar_leap:'Tháng nhuận',death_solar_date:'Ngày qui vị dương lịch',
 lunar_day:'Ngày âm',lunar_month:'Tháng âm',lunar_leap:'Tháng nhuận',
 solar_day:'Ngày dương',solar_month:'Tháng dương',death_year:'Năm qui vị',date_notes:'Ghi chú niên đại'
};
let workOffset=0,workCurrent=null,workFieldInputs=new Map();
const workRoot='/api/v1/admin/work/';
function workStatus(message){$('work-status').textContent=message;}
function workClose(){workCurrent=null;workFieldInputs.clear();$('work-edit-area').hidden=true;$('work-fields').replaceChildren();$('work-revisions').replaceChildren();}
async function workList(){
 const kind=$('work-kind').value;
 try{
  const data=await api(workRoot+kind+'?limit=20&offset='+workOffset);
  const list=$('work-list');list.replaceChildren();
  const records=Array.isArray(data.data)?data.data:[];
  for(const record of records){
   const item=document.createElement('li');item.className='sandbox-line';
   appendText(item,'span',(record.title||'(Chưa có nhan đề)')+' · '+(record.published===1?'Đã công bố':'Bản nháp')+' · phiên bản '+record.gdd_version);
   const button=document.createElement('button');button.type='button';button.textContent='Biên tập';
   button.addEventListener('click',()=>workOpen(kind,record.id));
   item.append(button);list.append(item);
  }
  if(!records.length)appendText(list,'li','Không còn bản ghi ở trang này.');
  $('work-prev').disabled=workOffset===0;
  $('work-next').disabled=records.length<20;
  $('work-page').textContent='Trang '+(Math.floor(workOffset/20)+1);
  workStatus('D1 làm việc: '+records.length+' bản ghi được tải. Có lưu lịch sử chỉnh sửa.');
 }catch(e){workStatus('Lỗi tải danh sách D1: '+e.message)}
}
function workBuild(kind,record){
 workFieldInputs.clear();
 const fields=$('work-fields');fields.replaceChildren();
 for(const field of workFields[kind]||[]){
  const label=document.createElement('label');
  const input=workLong.has(field)?document.createElement('textarea'):document.createElement('input');
  input.id='work-field-'+field;
  if(workBool.has(field)){
   input.type='checkbox';
   input.checked=record?Boolean(record[field]):false;
   if(!record&&field==='published')input.disabled=true;
  }else if(workNums.has(field)){
   input.type='number';input.min='0';
   input.value=record?.[field]??'';
  }else{
   if(input.tagName==='INPUT')input.type='text';
   input.value=record?.[field]??'';
   if(workLong.has(field))input.rows=field==='body'||field==='biography'?8:3;
  }
  label.htmlFor=input.id;label.textContent=workLabels[field]||field;
  if(workBool.has(field)){
   const wrapper=document.createElement('div');wrapper.className='sandbox-checkbox';
   wrapper.append(input,label);fields.append(wrapper);
  }else{fields.append(label,input);}
  workFieldInputs.set(field,input);
 }
}
function workChanged(){
 const changes={};
 for(const [field,input] of workFieldInputs){
  const old=workCurrent.record?.[field];
  let value;
  if(workBool.has(field))value=Boolean(input.checked);
  else if(workNums.has(field))value=input.value.trim()?Number(input.value):null;
  else value=input.value;
  const unchanged=workCurrent.record!==null && (workBool.has(field)?
      (old===null?value===false:Boolean(old)===value):
      workNums.has(field)?((old??null)===value):String(old??'')===value);
  if(!unchanged && !(workCurrent.record===null&&value===''))changes[field]=value;
 }
 return changes;
}
async function workOpen(kind,id){
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
  await workHistory();
 }catch(e){workStatus('Không đọc được chi tiết: '+e.message)}
}
async function workNew(){
 workClose();const kind=$('work-kind').value;
 workCurrent={kind,id:null,record:null};
 workBuild(kind,null);
 $('work-edit-heading').textContent='Tạo bản nháp '+(names[kind]||kind);
 $('work-identity').textContent='Bản nháp mới chưa được cấp mã hồ sơ. Chỉ người quản trị xem được.';
 $('work-edit-area').hidden=false;
 workStatus('Đang chuẩn bị bản nháp mới trên D1 làm việc.');
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
    await sandboxWrite(workRoot+snapshot.kind+'/'+snapshot.id+'/restore','POST',
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
async function workSave(){
 if(!workCurrent)return;
 const submit=$('work-save');submit.disabled=true;
 const selected={...workCurrent};
 try{
  const fields=workChanged();
  const isCreate=!selected.id;
  if(!Object.keys(fields).length)throw Error('Chưa có nội dung thay đổi');
  if(isCreate){fields.published=false;}
  const result=await sandboxWrite(workRoot+selected.kind+(selected.id?'/'+selected.id:''),
    isCreate?'POST':'PATCH',isCreate?{fields}:{version:selected.record.gdd_version,fields});
  if(!result?.data?.id)throw Error('Máy chủ chưa xác nhận đã lưu');
  workStatus(isCreate?'Đã tạo bản nháp trên D1 làm việc.':'Đã lưu thay đổi và ghi lịch sử phiên bản.');
  await workList();
  await workOpen(selected.kind,result.data.id);
 }catch(e){workStatus('Không thể lưu: '+e.message)}
 finally{submit.disabled=false}
}
$('work-kind').addEventListener('change',()=>{workOffset=0;workClose();workList()});
$('work-list-refresh').addEventListener('click',workList);
$('work-new').addEventListener('click',workNew);
$('work-save').addEventListener('click',workSave);
$('work-cancel').addEventListener('click',workClose);
$('work-prev').addEventListener('click',()=>{workOffset=Math.max(0,workOffset-20);workList()});
$('work-next').addEventListener('click',()=>{workOffset+=20;workList()});


$('kind').addEventListener('change',()=>{offset=0;loadRecords()});
$('view').addEventListener('change',()=>{offset=0;loadRecords()});
$('previous').addEventListener('click',()=>{if(offset>=pageSize){offset-=pageSize;loadRecords()}});
$('next').addEventListener('click',()=>{if(hasNext){offset+=pageSize;loadRecords()}});
overview();loadRecords();
`;
