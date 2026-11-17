// GDDĐ DK01.5 — ONE reader shell for approved private-R2 variants and old public Supabase PDFs.
// WARNING: legacy public PDFs are still PUBLIC at their Supabase source URL.
// Viewer routing improves consistency; it does NOT revoke a public source.
const API='https://gdd-r2-gateway.realmetayninh7649.workers.dev';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const PDF_JS='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDF_WORKER='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const SUPABASE_HOST='gwpdgubxoquhrfbolftq.supabase.co';
const el=id=>document.getElementById(id);
const query=new URLSearchParams(location.search);
const id=query.get('asset')||'';
const sourceRaw=query.get('source')||'';
let info=null,page=1,zoom=100,pdfDoc=null,renderTask=null,drawSerial=0,mode='r2';
function status(message){el('r2-status').textContent=message}
function validatePublicSource(raw){
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:'||url.hostname!==SUPABASE_HOST||url.port||
       url.username||url.password||!url.pathname.startsWith('/storage/v1/object/public/'))
      return null;
    if(!/\.(pdf|docx|doc)$/i.test(url.pathname))return null;
    return url;
  }catch{return null}
}
function pageUrl(n){
  return API+'/v1/public/'+encodeURIComponent(id)+(info.kind==='image'?'/preview':'/page/'+n);
}
function adjust(){
  if(!info)return;
  el('r2-prev').disabled=page<=1;
  el('r2-next').disabled=page>=info.pageCount;
  el('r2-counter').textContent=page+' / '+info.pageCount;
  if(mode==='legacy-pdf'){
    el('r2-canvas').style.width=zoom+'%';
  }else{
    el('r2-page').style.width=(zoom*.92)+'%';
  }
}
async function showLegacyPdf(n){
  if(!pdfDoc)return;
  page=Math.max(1,Math.min(n,pdfDoc.numPages));
  const current=++drawSerial;
  if(renderTask){try{renderTask.cancel()}catch{}}
  status('Đang kết xuất trang '+page+'/'+pdfDoc.numPages+' từ PDF công khai cũ…');
  adjust();
  let p=null;
  try{
    p=await pdfDoc.getPage(page);
    if(current!==drawSerial)return;
    const first=p.getViewport({scale:1});
    const ratio=zoom/100;
    const scale=Math.min(3, Math.max(.7,(1700/Math.max(first.width,1))*ratio));
    const v=p.getViewport({scale});
    const maximum=Math.min(1,2800/Math.max(v.width,1),3600/Math.max(v.height,1));
    const view=maximum<1?p.getViewport({scale:scale*maximum}):v;
    const canvas=el('r2-canvas');
    canvas.width=Math.max(1,Math.ceil(view.width));
    canvas.height=Math.max(1,Math.ceil(view.height));
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw Error('Không tạo được trang vẽ PDF');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    renderTask=p.render({canvasContext:ctx,viewport:view});
    await renderTask.promise;
    if(current!==drawSerial)return;
    canvas.hidden=false;
    status('Trang '+page+'/'+pdfDoc.numPages+' · PDF công khai cũ từ Supabase. Chưa chuyển bản nguyên mẫu sang R2.');
  }catch(e){
    if(e?.name!=='RenderingCancelledException'&&current===drawSerial)
      status('Chưa hiển thị được trang PDF: '+(e?.message||e)+' . Có thể mở tệp công khai cũ bằng liên kết dự phòng.');
  }finally{p?.cleanup?.()}
}
function show(n){
  if(!info)return;
  if(mode==='legacy-pdf'){showLegacyPdf(n);return}
  page=Math.min(info.pageCount,Math.max(1,n));
  const image=el('r2-page'),current=page;
  image.style.visibility='hidden';
  image.onload=()=>{image.style.visibility='visible';status('Trang '+current+'/'+info.pageCount+' · Bản xem đã công bố.')};
  image.onerror=()=>{image.style.visibility='visible';status('Chưa tải được trang này. Hãy kiểm tra kết nối.')};
  image.src=pageUrl(page);
  image.alt='Trang '+page+' trong '+info.name;
  adjust();
}
async function initializeLegacy(raw) {
  const source=validatePublicSource(raw);
  if(!source){status('Đường dẫn Supabase không hợp lệ. Chỉ nhận tệp công khai từ kho Web Đạo.');return}
  const filename=decodeURIComponent(source.pathname.split('/').pop()||'Tài liệu số hóa');
  el('r2-title').textContent=filename;
  const backup=el('r2-legacy-open');
  backup.href=source.href;backup.hidden=false;
  // Explicitly warn: identical UI is NOT private storage migration.
  el('r2-desc').textContent='TÀI LIỆU CŨ: nguồn PDF/Word vẫn đang công khai trên Supabase. Trình đọc đã thống nhất giao diện nhưng chưa chuyển bản gốc sang R2.';
  if(/\.(docx|doc)$/i.test(source.pathname)){
    mode='legacy-word';
    status('Tệp Word cũ không có bản xem từng trang trong R2. Hãy dùng liên kết dự phòng hoặc tạo bản xem đã duyệt từ PDF/DOCX trong Quản Trị Viên.');
    return;
  }
  mode='legacy-pdf';
  try{
    const pdfjs=await import(PDF_JS);
    pdfjs.GlobalWorkerOptions.workerSrc=PDF_WORKER;
    pdfDoc=await pdfjs.getDocument({url:source.href,isEvalSupported:false,useSystemFonts:true}).promise;
    if(!Number.isInteger(pdfDoc.numPages)||pdfDoc.numPages<1)throw Error('Tệp PDF không có trang đọc');
    info={kind:'legacy-pdf',name:filename,pageCount:pdfDoc.numPages};
    el('r2-controls').hidden=false;
    el('r2-scroller').hidden=false;
    el('r2-page').hidden=true;
    el('r2-canvas').hidden=false;
    show(1);
  }catch(error){
    status('Không nạp được PDF cũ trong trình đọc: '+(error?.message||error)+
      '. Liên kết mở tệp nguồn công khai cũ được giữ để tránh mất khả năng tra cứu.');
  }
}
async function initializeApproved(){
  if(!UUID.test(id)){status('Đường dẫn bản xem không hợp lệ.');return}
  try{
    const response=await fetch(API+'/v1/public/'+id,{method:'GET',mode:'cors',cache:'no-store'});
    if(!response.ok){status(response.status===404?'Tư liệu chưa được công bố hoặc đã được ẩn.':'Máy chủ chưa cho phép mở bản xem.');return}
    const data=await response.json();
    if(!data||data.id!==id||!['image','document'].includes(data.kind)||
      !Number.isInteger(data.pageCount)||data.pageCount<1||data.pageCount>120)
      throw Error('Thông tin bản xem không hợp lệ');
    info=data;mode='r2';
    el('r2-title').textContent=data.name||'Tư liệu';
    el('r2-desc').textContent=data.viewSource==='pdf'
      ?'PDF được trình bày bằng ảnh từng trang, không cung cấp tệp PDF nguyên mẫu.'
      :data.viewSource==='docx_text'
      ?'BẢN ĐỌC CHỮ TRÍCH TỪ DOCX: không giữ bố cục, bảng hoặc hình của tài liệu gốc.'
      :'Ảnh xem đã được tối ưu; ảnh nguyên mẫu vẫn lưu riêng.';
    el('r2-controls').hidden=false;
    el('r2-scroller').hidden=false;
    if(data.allowDownload===true&&data.kind==='image'){
      const anchor=el('r2-download');anchor.href=API+'/v1/public/'+id+'/download';anchor.hidden=false;
    }
    show(1);
  }catch(err){status('Không mở được bản xem. '+(err?.message||String(err)))}
}
el('r2-prev').addEventListener('click',()=>show(page-1));
el('r2-next').addEventListener('click',()=>show(page+1));
el('r2-zoom').addEventListener('change',e=>{zoom=Number(e.target.value)||100;if(info)show(page)});
window.addEventListener('pagehide',()=>pdfDoc?.destroy?.().catch(()=>{}),{once:true});
if(sourceRaw&&!id)initializeLegacy(sourceRaw);
else initializeApproved();
