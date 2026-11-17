// DK01.4 - Convert admin-selected documents to JPEG PAGE IMAGES locally.
// PDF: pages rendered faithfully with pinned PDF.js; DOCX: plain-text reading only.
// .doc legacy cannot be converted safely: requires a separate PDF reading copy.
const MAX_PAGES=120,MAX_DOC_BYTES=45*1024*1024;
const MAX_PAGE_BYTES=3*1024*1024;
const pdfMain='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const pdfWorker='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const mammothCdn='https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.9.0/mammoth.browser.min.js';
let mammothPromise;
function checkFile(file){
  if(!file||!Number.isSafeInteger(file.size)||file.size<1||file.size>MAX_DOC_BYTES)
    throw Error('Bản xem chỉ xử lý tệp đến 45 MB trên iPhone. Tệp nguyên mẫu vẫn lưu riêng.');
}
function imageBlob(canvas,quality=.83){
  return new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?.type==='image/jpeg'?resolve(blob):reject(Error('Không tạo được ảnh trang JPEG')),'image/jpeg',quality);
  });
}
async function makePage(canvas){
  for(const q of [.82,.7,.56]){
    const blob=await imageBlob(canvas,q);
    if(blob.size>=32&&blob.size<=MAX_PAGE_BYTES)return blob;
  }
  throw Error('Trang này vượt giới hạn 3 MB; cần tạo bản xem nhỏ hơn.');
}
function canvas(width,height){
  const c=document.createElement('canvas');c.width=width;c.height=height;
  const g=c.getContext('2d',{alpha:false});
  if(!g)throw Error('Trình duyệt không thể vẽ ảnh trang');
  g.fillStyle='#fff';g.fillRect(0,0,width,height);
  return {c,g};
}
async function loadMammoth(){
  if(globalThis.mammoth?.extractRawText)return globalThis.mammoth;
  if(!mammothPromise)mammothPromise=new Promise((resolve,reject)=>{
    const s=document.createElement('script');s.src=mammothCdn;s.async=true;
    s.referrerPolicy='no-referrer';
    s.onload=()=>globalThis.mammoth?.extractRawText?resolve(globalThis.mammoth):reject(Error('Chưa tải được thư viện đọc DOCX'));
    s.onerror=()=>reject(Error('Không tải được bộ đọc DOCX; cần kết nối mạng'));
    document.head.appendChild(s);
  });
  return mammothPromise;
}
async function renderPdf(file,onPage,onProgress){
  const pdfjs=await import(pdfMain);
  pdfjs.GlobalWorkerOptions.workerSrc=pdfWorker;
  let doc;
  try{
    doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),
      isEvalSupported:false,useSystemFonts:true}).promise;
    const total=doc.numPages;
    if(total<1||total>MAX_PAGES)throw Error('PDF có '+total+' trang; trình xem hiện hỗ trợ tối đa '+MAX_PAGES+' trang cho mỗi tập.');
    for(let i=1;i<=total;i++){
      const pdfPage=await doc.getPage(i);
      try{
        const orig=pdfPage.getViewport({scale:1});
        const scale=Math.min(2,1600/orig.width,2250/orig.height);
        const viewport=pdfPage.getViewport({scale:Math.max(.5,scale)});
        const {c,g}=canvas(Math.max(1,Math.ceil(viewport.width)),Math.max(1,Math.ceil(viewport.height)));
        await pdfPage.render({canvasContext:g,viewport}).promise;
        const blob=await makePage(c);
        await onPage(i,total,blob);
        c.width=0;c.height=0;
        onProgress?.({page:i,total,source:'pdf'});
      }finally{pdfPage.cleanup()}
      await new Promise(resolve=>setTimeout(resolve,0));
    }
    return {pageCount:total,viewSource:'pdf'};
  }finally{await doc?.destroy?.().catch(()=>{})}
}
function splitWords(text,maxWidth,ctx){
  const list=[],words=text.trim().split(/\s+/).filter(Boolean);
  let line='';
  function flush(){if(line)list.push(line);line=''}
  for(const word of words){
    const attempt=line?line+' '+word:word;
    if(ctx.measureText(attempt).width<=maxWidth){line=attempt;continue}
    flush();
    let remain=word;
    while(ctx.measureText(remain).width>maxWidth){
      let left=1,right=remain.length;
      while(left<right){const mid=Math.ceil((left+right)/2);if(ctx.measureText(remain.slice(0,mid)).width<=maxWidth)left=mid;else right=mid-1}
      const size=Math.max(1,left);list.push(remain.slice(0,size));remain=remain.slice(size);
    }
    line=remain;
  }
  flush();
  return list;
}
async function renderDocx(file,onPage,onProgress){
  const mammoth=await loadMammoth();
  const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
  const original=String(result?.value||'').replace(/\r\n?/g,'\n');
  if(!original.trim())throw Error('DOCX không có chữ trích xuất được. Hãy cung cấp bản đọc PDF.');
  const width=1400,height=1980,margin=92,top=160,bottom=130,lineHeight=43;
  const maxLines=Math.floor((height-top-bottom)/lineHeight);
  const {c,g}=canvas(width,height);g.font='30px Georgia, serif';
  const lines=[];
  for(const paragraph of original.split('\n')){
    const wrapped=splitWords(paragraph,width-2*margin,g);
    if(wrapped.length)lines.push(...wrapped);
    else lines.push('');
    if(lines.length>maxLines*MAX_PAGES)throw Error('DOCX quá dài để tạo bản đọc; hãy chia thành nhiều tập.');
  }
  const total=Math.ceil(lines.length/maxLines);
  if(total>MAX_PAGES)throw Error('Bản đọc vượt 120 trang; cần chia thành nhiều tập.');
  for(let i=1;i<=total;i++){
    g.fillStyle='#fff';g.fillRect(0,0,width,height);
    g.fillStyle='#2b3a32';g.textBaseline='top';
    g.font='bold 23px system-ui,sans-serif';
    g.fillText('BẢN ĐỌC CHỮ DOCX – KHÔNG GIỮ BỐ CỤC VĂN BẢN GỐC',margin,46);
    g.font='30px Georgia,serif';
    const segment=lines.slice((i-1)*maxLines,i*maxLines);
    for(const [idx,line] of segment.entries())g.fillText(line,margin,top+idx*lineHeight);
    g.font='20px system-ui,sans-serif';
    g.fillText('Dấu Xưa Cửa Đạo · Trang '+i+'/'+total,margin,height-70);
    const blob=await makePage(c);
    await onPage(i,total,blob);
    onProgress?.({page:i,total,source:'docx_text'});
    await new Promise(resolve=>setTimeout(resolve,0));
  }
  c.width=0;c.height=0;
  return {pageCount:total,viewSource:'docx_text'};
}
export async function makeDocumentPages(file,onPage,onProgress){
  checkFile(file);
  if(typeof onPage!=='function')throw Error('Thiếu trình lưu trang');
  const ext=String(file.name||'').split('.').pop().toLowerCase();
  if(ext==='pdf')return renderPdf(file,onPage,onProgress);
  if(ext==='docx')return renderDocx(file,onPage,onProgress);
  throw Error(ext==='doc'?'Word .doc cũ cần xuất sang PDF để có bản đọc; bản gốc vẫn lưu trong R2.':'Chỉ hỗ trợ bản đọc PDF và DOCX.');
}
