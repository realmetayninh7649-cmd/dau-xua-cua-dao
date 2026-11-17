// Public reader for explicitly published image variants and document PAGE IMAGES.
// Never request original PDFs, Word files, raw R2 keys or authenticated endpoints.
const API='https://gdd-r2-gateway.realmetayninh7649.workers.dev';
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const el=id=>document.getElementById(id);
const query=new URLSearchParams(location.search);
const id=query.get('asset')||'';
let info=null,page=1,zoom=100;
function status(message){el('r2-status').textContent=message}
function pageUrl(n){
  return API+'/v1/public/'+encodeURIComponent(id)+(info.kind==='image'?'/preview':'/page/'+n);
}
function adjust(){
  const previous=el('r2-prev'),next=el('r2-next');
  previous.disabled=page<=1;
  next.disabled=page>=info.pageCount;
  el('r2-counter').textContent=page+' / '+info.pageCount;
  const image=el('r2-page');
  image.style.width=(zoom*0.92)+'%';
}
function show(n){
  if(!info)return;
  page=Math.min(info.pageCount,Math.max(1,n));
  const image=el('r2-page');
  image.style.visibility='hidden';
  image.onload=()=>{image.style.visibility='visible';status('Trang '+page+'/'+info.pageCount+' · Bản xem đã công bố.')};
  image.onerror=()=>{image.style.visibility='visible';status('Chưa tải được trang này. Hãy thử lại hoặc kiểm tra kết nối.')};
  image.src=pageUrl(page);
  image.alt='Trang '+page+' trong '+info.name;
  adjust();
}
async function initialize(){
  if(!UUID.test(id)){status('Đường dẫn bản xem không hợp lệ.');return}
  try{
    const response=await fetch(API+'/v1/public/'+id,{method:'GET',mode:'cors',cache:'no-store'});
    if(!response.ok){status(response.status===404?'Tư liệu chưa được công bố hoặc đã được ẩn.':'Máy chủ chưa cho phép mở bản xem.');return}
    const data=await response.json();
    if(!data||data.id!==id||!['image','document'].includes(data.kind)||
      !Number.isInteger(data.pageCount)||data.pageCount<1||data.pageCount>120)
      throw Error('Thông tin bản xem không hợp lệ');
    info=data;
    el('r2-title').textContent=data.name||'Tư liệu';
    el('r2-desc').textContent=data.viewSource==='pdf'
      ?'PDF được trình bày bằng ảnh từng trang, không cung cấp tệp PDF nguyên mẫu.'
      :data.viewSource==='docx_text'
      ?'BẢN ĐỌC CHỮ TRÍCH TỪ DOCX: không giữ bố cục, bảng hoặc hình của tài liệu gốc.'
      :'Ảnh xem đã được tối ưu; ảnh nguyên mẫu vẫn lưu riêng.';
    el('r2-controls').hidden=false;
    el('r2-scroller').hidden=false;
    if(data.allowDownload===true&&data.kind==='image'){
      const anchor=el('r2-download');anchor.href=API+'/v1/public/'+id+'/download';
      anchor.hidden=false;
    }
    show(1);
  }catch(err){status('Không mở được bản xem. '+(err?.message||String(err)))}
}
el('r2-prev').addEventListener('click',()=>show(page-1));
el('r2-next').addEventListener('click',()=>show(page+1));
el('r2-zoom').addEventListener('change',e=>{zoom=Number(e.target.value)||100;if(info)adjust()});
initialize();
