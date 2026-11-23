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
<p class="audit-caution">Đã kiểm kê danh sách đối tượng R2 ngày 23/11/2026. Đây chỉ là dấu kiểm kê tệp, chưa phải xác minh nội dung từng tệp hay bản sao lưu độc lập có thể phục hồi.</p></section>
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
<footer>Giai đoạn thử nghiệm · Bảo toàn Supabase, Cloudflare R2 và mã định danh tư liệu · Chưa cho phép chỉnh sửa</footer>
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
  if(session.authenticated!==true||session.write_enabled!==false)throw Error('Phiên chưa đạt trạng thái chỉ đọc');
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
$('kind').addEventListener('change',()=>{offset=0;loadRecords()});
$('view').addEventListener('change',()=>{offset=0;loadRecords()});
$('previous').addEventListener('click',()=>{if(offset>=pageSize){offset-=pageSize;loadRecords()}});
$('next').addEventListener('click',()=>{if(hasNext){offset+=pageSize;loadRecords()}});
overview();loadRecords();
`;
