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
const ATTACH_API='https://gdd-d1-api-staging.realmetayninh7649.workers.dev';
const attachRaw=query.get('attachment')||'';
const nameHint=(query.get('name')||'').slice(0,220);
if(nameHint)el('r2-title').textContent=nameHint;
let positionKey='',continuous=false,observer=null,scrollEpoch=0,scrollFrame=0,stableRatio='3/4';
const warmed=new Map();
let info=null,page=1,zoom=100,pdfDoc=null,renderTask=null,drawSerial=0,mode='r2';
function status(message){el('r2-status').textContent=message}
function retry(message){status(message);el('r2-retry').hidden=false}
function attachmentSource(raw){
  try{const u=new URL(raw);
    if(u.origin!==ATTACH_API||u.username||u.password||u.hash||u.search!=='?view=1')return null;
    const parts=u.pathname.split('/');
    if(parts.length!==9||parts.slice(1,5).join('/')!=='api/v1/public/attachments'||parts[8]!=='download'||!['people','posts','media','videos','obituaries','documents','gdd_memorials','gdd_audio_programs','gdd_calendar_memorials'].includes(parts[5])||!UUID.test(parts[6])||!UUID.test(parts[7]))return null;
    return u;
  }catch{return null}
}
function remember(){try{if(positionKey)localStorage.setItem(positionKey,String(page))}catch{}}
function initialPage(){try{return Math.max(1,Math.min(info.pageCount,Number(localStorage.getItem(positionKey))||1))}catch{return 1}}
function warm(n){
  if(!info||mode!=='r2'||n<1||n>info.pageCount||warmed.has(n))return;
  const img=new Image();img.decoding='async';img.src=pageUrl(n);warmed.set(n,img);
  for(const k of warmed.keys())if(Math.abs(k-page)>3)warmed.delete(k);
}
function ready(){positionKey='gdd-reader-page:'+(id||attachRaw||sourceRaw);el('r2-controls').hidden=false;el('r2-scroller').hidden=false;el('r2-jump').max=String(info.pageCount);show(initialPage());}
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
function jumpWithin(wrap,figure){if(!figure)return;const top=figure.getBoundingClientRect().top-wrap.getBoundingClientRect().top+wrap.scrollTop;wrap.scrollTo({top,behavior:'instant'});}
function adjust(){
  if(!info)return;
  el('r2-prev').disabled=page<=1;
  el('r2-next').disabled=page>=info.pageCount;
  el('r2-counter').textContent=page+' / '+info.pageCount;
  if(document.activeElement!==el('r2-jump'))el('r2-jump').value=String(page);remember();
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
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.ceil(view.width));
    canvas.height=Math.max(1,Math.ceil(view.height));
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw Error('Không tạo được trang vẽ PDF');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    renderTask=p.render({canvasContext:ctx,viewport:view});
    await renderTask.promise;
    if(current!==drawSerial)return;
    const visible=el('r2-canvas');visible.width=canvas.width;visible.height=canvas.height;visible.getContext('2d',{alpha:false}).drawImage(canvas,0,0);visible.hidden=false;
    stableRatio=first.width+'/'+first.height;
    status('Trang '+page+' / '+pdfDoc.numPages+' · '+(attachRaw?'PDF đã được cho phép đọc và tải.':'PDF công khai cũ từ Supabase.'));el('r2-retry').hidden=true;
  }catch(e){
    if(e?.name!=='RenderingCancelledException'&&current===drawSerial)
      retry('Chưa hiển thị được trang PDF. Hãy thử tải lại hoặc mở liên kết dự phòng.');
  }finally{p?.cleanup?.()}
}
function show(n){
  if(!info)return;
  if(continuous){page=Math.min(info.pageCount,Math.max(1,n));adjust();const wrap=el('r2-continuous');jumpWithin(wrap,wrap.querySelector('[data-page="'+page+'"]'));return}
  if(n!==page){const pane=el('r2-scroller');pane.scrollTop=0;pane.scrollLeft=0;}
  if(mode==='legacy-pdf'){showLegacyPdf(n);return}
  page=Math.min(info.pageCount,Math.max(1,n));
  const image=el('r2-page'),current=page,serial=++drawSerial;
  const pending=warmed.get(current)||new Image();pending.decoding='async';
  status('Đang tải trang '+current+' / '+info.pageCount+'…');adjust();
  const display=()=>{if(serial!==drawSerial||continuous)return;image.src=pending.src;image.alt='Trang '+current+' trong '+info.name;image.style.visibility='visible';if(pending.naturalWidth&&pending.naturalHeight)stableRatio=pending.naturalWidth+'/'+pending.naturalHeight;el('r2-retry').hidden=true;status('Trang '+current+' / '+info.pageCount+' · Bản xem đã công bố.');warm(current+1);warm(current+2);warm(current-1);};
  const failed=()=>{if(serial===drawSerial&&!continuous){warmed.delete(current);retry('Chưa tải được trang này. Hãy thử lại.')}};
  if(!pending.src)pending.src=pageUrl(current);
  if(pending.complete&&pending.naturalWidth)display();
  else if(pending.decode)pending.decode().then(display,failed);
  else{pending.onload=display;pending.onerror=failed;}

}
async function initializeLegacy(raw,attachment=false) {
  const source=attachment?attachmentSource(raw):validatePublicSource(raw);
  if(!source){status('Đường dẫn Supabase không hợp lệ. Chỉ nhận tệp công khai từ kho Web Đạo.');return}
  const filename=attachment?(nameHint||'Tài liệu PDF'):decodeURIComponent(source.pathname.split('/').pop()||'Tài liệu số hóa');
  el('r2-title').textContent=filename;
  const backup=el('r2-legacy-open');
  backup.href=source.href;backup.hidden=!attachment; if(attachment){backup.textContent='Mở PDF bằng trình duyệt (dự phòng)';}
  // Explicitly warn: identical UI is NOT private storage migration.
  el('r2-desc').textContent=attachment?'PDF đã được phép công khai · tải theo từng phần.':'TÀI LIỆU CŨ: nguồn PDF/Word vẫn đang công khai trên Supabase.';
  if(/\.(docx|doc)$/i.test(source.pathname)){
    mode='legacy-word';
    status('Tệp Word cũ không có bản xem từng trang trong R2. Hãy dùng liên kết dự phòng hoặc tạo bản xem đã duyệt từ PDF/DOCX trong Quản Trị Viên.');
    return;
  }
  mode='legacy-pdf';
  try{
    const pdfjs=await import(PDF_JS);
    pdfjs.GlobalWorkerOptions.workerSrc=PDF_WORKER;
    const task=pdfjs.getDocument({url:source.href,isEvalSupported:false,useSystemFonts:true,disableAutoFetch:true,disableStream:true,rangeChunkSize:262144});
    task.onProgress=p=>{if(!info&&p.total)status('Đang mở PDF… '+Math.min(99,Math.round(p.loaded/p.total*100))+'%')};
    pdfDoc=await task.promise;
    if(!Number.isInteger(pdfDoc.numPages)||pdfDoc.numPages<1)throw Error('Tệp PDF không có trang đọc');
    info={kind:'legacy-pdf',name:filename,pageCount:pdfDoc.numPages};
    el('r2-controls').hidden=false;
    el('r2-scroller').hidden=false;
    el('r2-page').hidden=true;
    el('r2-canvas').hidden=false;
    if(attachment){const dl=el('r2-pdf-download');const url=new URL(source.href);url.search='';dl.href=url.href;dl.hidden=false;}
    ready();
  }catch(error){
    backup.hidden=false;retry('Chưa mở được PDF trong trình đọc. Có thể thử lại hoặc mở bằng trình duyệt.');
  }
}
async function initializeApproved(){
  if(!UUID.test(id)){status('Đường dẫn bản xem không hợp lệ.');return}
  try{
    const response=await fetch(API+'/v1/public/'+id,{method:'GET',mode:'cors',cache:'no-store',signal:AbortSignal.timeout(20000)});
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
    if(data.kind==='document'&&query.get('download'))void (async()=>{try{const u=new URL(query.get('download'));if(!u.search){u.search='?view=1';const valid=attachmentSource(u.href);if(valid&&valid.pathname.split('/')[7]===id){const parts=valid.pathname.split('/');const check=new URL(ATTACH_API+'/api/v1/public/attachments');check.searchParams.set('owner_kind',parts[5]);check.searchParams.set('owner_id',parts[6]);check.searchParams.set('limit','100');const result=await fetch(check,{cache:'no-store'});if(result.ok&&(await result.json()).data?.some(x=>x.asset_id===id&&Number(x.allow_download)===1&&/\.pdf$/i.test(x.original_name||''))){valid.search='';const dl=el('r2-pdf-download');dl.href=valid.href;dl.hidden=false;}}}}catch{}})();
    ready();
  }catch(err){retry('Không mở được bản xem. Hãy thử tải lại.')}
}
function closeContinuous(){
  continuous=false;scrollEpoch++;observer?.disconnect();observer=null;cancelAnimationFrame(scrollFrame);scrollFrame=0;
  el('r2-continuous').replaceChildren();el('r2-continuous').hidden=true;el('r2-scroller').hidden=false;el('r2-mode').textContent='Cuộn dọc';el('r2-mode').setAttribute('aria-pressed','false');show(page);
}
function openContinuous(){
  if(!info)return;
  continuous=true;const epoch=++scrollEpoch;drawSerial++;try{renderTask?.cancel()}catch{}
  const wrap=el('r2-continuous');wrap.hidden=false;el('r2-scroller').hidden=true;el('r2-mode').textContent='Lật trang';el('r2-mode').setAttribute('aria-pressed','true');
  const frag=document.createDocumentFragment();
  for(let n=1;n<=info.pageCount;n++){
    const figure=document.createElement('figure');figure.dataset.page=n;figure.style.width=zoom+'%';
    const slot=document.createElement('div');slot.className='reader-page-slot';slot.style.setProperty('--page-ratio',stableRatio);
    const view=document.createElement(mode==='legacy-pdf'?'canvas':'img');view.dataset.loaded='0';view.setAttribute('aria-label','Trang '+n);
    if(mode!=='legacy-pdf'){view.alt='Trang '+n;view.decoding='async'}
    const label=document.createElement('figcaption');label.textContent='Trang '+n;slot.append(view);figure.append(slot,label);frag.append(figure);
  }
  wrap.replaceChildren(frag);
  observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      const figure=entry.target,n=Number(figure.dataset.page),view=figure.querySelector('img,canvas');
      if(!entry.isIntersecting||view.dataset.loaded!=='0')continue;
      view.dataset.loaded='1';
      if(mode==='legacy-pdf'){
        (async()=>{try{const p=await pdfDoc.getPage(n);if(epoch!==scrollEpoch)return;
          const first=p.getViewport({scale:1}),v=p.getViewport({scale:Math.min(2,1300/first.width,1800/first.height)});
          view.width=Math.ceil(v.width);view.height=Math.ceil(v.height);
          await p.render({canvasContext:view.getContext('2d',{alpha:false}),viewport:v}).promise;
          view.dataset.loaded='2';p.cleanup();
        }catch{view.dataset.loaded='0'}})();
      }else{view.onload=()=>{view.dataset.loaded='2';el('r2-retry').hidden=true};view.onerror=()=>{view.dataset.loaded='0';retry('Có trang chưa tải được. Hãy thử lại.')};view.src=pageUrl(n)}
    }
  },{root:wrap,rootMargin:'300px 0px',threshold:0});
  for(const figure of wrap.children)observer.observe(figure);
  jumpWithin(wrap,wrap.querySelector('[data-page="'+page+'"]'));
}
el('r2-continuous').addEventListener('scroll',()=>{
  if(!continuous||scrollFrame)return;
  scrollFrame=requestAnimationFrame(()=>{
    scrollFrame=0;if(!continuous)return;
    const wrap=el('r2-continuous'),center=wrap.getBoundingClientRect().top+wrap.clientHeight*.45;
    let nearest=page,distance=Infinity;
    for(const figure of wrap.children){const rect=figure.getBoundingClientRect(),d=Math.abs((rect.top+rect.bottom)/2-center);if(d<distance){distance=d;nearest=Number(figure.dataset.page)}}
    if(nearest!==page){page=nearest;adjust();status('Trang '+page+' / '+info.pageCount);}
    if(mode==='legacy-pdf')for(const figure of wrap.children){const n=Number(figure.dataset.page),view=figure.querySelector('canvas');if(Math.abs(n-page)>6&&view.dataset.loaded==='2'){view.width=1;view.height=1;view.dataset.loaded='0';observer?.unobserve(figure);observer?.observe(figure)}}
  });
},{passive:true});
el('r2-back').addEventListener('click',()=>{try{const raw=sessionStorage.getItem('gdd-reader-return');sessionStorage.removeItem('gdd-reader-return');const target=new URL(raw||document.referrer||'./index.html',location.href);if(target.origin===location.origin&&!target.pathname.endsWith('/r2-xem.html')){location.assign(target.href);return}}catch{}location.assign('./index.html')});
el('r2-full').addEventListener('click',()=>{const active=document.body.classList.toggle('reader-expanded');el('r2-full').setAttribute('aria-pressed',String(active));el('r2-full').textContent=active?'Thu về':'Toàn màn';});
el('r2-retry').addEventListener('click',()=>{if(info){if(continuous){closeContinuous();openContinuous()}else show(page)}else location.reload()});
el('r2-jump').addEventListener('change',e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&info)show(n)});
el('r2-mode').addEventListener('click',()=>continuous?closeContinuous():openContinuous());
el('r2-thumbs').addEventListener('click',()=>{
 const list=el('r2-page-list'),open=list.hidden;list.hidden=!open;el('r2-thumbs').setAttribute('aria-expanded',String(open));if(!open||!info)return;
 list.replaceChildren();for(let n=1;n<=info.pageCount;n++){const b=document.createElement('button');b.type='button';b.setAttribute('aria-current',String(n===page));if(mode==='r2'){const im=document.createElement('img');im.loading='lazy';im.alt='';im.src=pageUrl(n);b.append(im)}const label=document.createElement('span');label.textContent='Trang '+n;b.append(label);b.onclick=()=>{list.hidden=true;el('r2-thumbs').setAttribute('aria-expanded','false');show(n)};list.append(b)}
});
let touch=null;el('r2-scroller').addEventListener('touchstart',e=>{touch=e.touches.length===1?[e.touches[0].clientX,e.touches[0].clientY]:null},{passive:true});el('r2-scroller').addEventListener('touchmove',e=>{if(e.touches.length!==1)touch=null},{passive:true});el('r2-scroller').addEventListener('touchend',e=>{if(!touch||zoom!==100)return;const dx=e.changedTouches[0].clientX-touch[0],dy=e.changedTouches[0].clientY-touch[1];touch=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.8)show(page+(dx<0?1:-1))},{passive:true});
el('r2-prev').addEventListener('click',()=>show(page-1));
el('r2-next').addEventListener('click',()=>show(page+1));
el('r2-zoom').addEventListener('change',e=>{zoom=Number(e.target.value)||100;if(info){if(continuous){const wrap=el('r2-continuous');for(const figure of wrap.children)figure.style.width=zoom+'%';jumpWithin(wrap,wrap.querySelector('[data-page="'+page+'"]'))}else show(page)}});
window.addEventListener('pagehide',()=>pdfDoc?.destroy?.().catch(()=>{}),{once:true});
// Known, verified legacy PDF origins are now served as pre-rendered R2 JPEG pages.
// Shared source= links are redirected too; do not fetch the public PDF itself.
const SAFE_LEGACY_PDF_IDS=Object.freeze({
  'documents/1794684373312-e808f501-1bba-458d-b82f-f5f096479426.pdf':'a4bf8d79-a7a3-51cb-909c-0a4681902c01',
  'documents/1794684462288-fc373424-39bf-4d8d-950c-2195aa01a603.pdf':'203886e9-cd67-58ab-96b3-ee4ff97b401a',
  'media/1794860043784-52816aff-f9f7-4790-9e91-d87d7a86fc96.pdf':'1105db24-e971-5f1a-b632-d3b9f41b3b39'
});
function mappedR2Asset(raw){
  const source=validatePublicSource(raw);
  if(!source||source.search||source.hash)return '';
  const prefix='/storage/v1/object/public/dao-su-documents/';
  if(!source.pathname.startsWith(prefix))return '';
  const key=source.pathname.slice(prefix.length);
  return Object.hasOwn(SAFE_LEGACY_PDF_IDS,key)?SAFE_LEGACY_PDF_IDS[key]:'';
}
if(attachRaw&&!id&&!sourceRaw){initializeLegacy(attachRaw,true)}else if(sourceRaw&&!id){
  const approved=mappedR2Asset(sourceRaw);
  if(approved){const target=new URL(location.href);target.searchParams.delete('source');target.searchParams.set('asset',approved);location.replace(target.href)}
  else initializeLegacy(sourceRaw);
}else initializeApproved();
