/* GDDĐ v2.0.0-DK01.5 - One document reader across the entire website.
 * This routes legacy public PDF links into the same UI as approved R2 page viewers.
 * It NEVER claims that a legacy public original has become private. */
(() => {
  'use strict';
  const SUPABASE_HOST='gwpdgubxoquhrfbolftq.supabase.co';
  const READER_PATH=window.location.hostname==='realmetayninh7649-cmd.github.io'
    ?'/dau-xua-cua-dao/r2-xem.html':'/r2-xem.html';
  const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  const LEGACY_DOCS_PREFIX='/storage/v1/object/public/dao-su-documents/';
  // Only three already-published PDFs have private R2 page-image viewer derivatives.
  // No raw PDF download, no R2 original keys, and no conversion for other documents.
  const LEGACY_PDF_PAGES=Object.freeze({
    'documents/1794684373312-e808f501-1bba-458d-b82f-f5f096479426.pdf':'a4bf8d79-a7a3-51cb-909c-0a4681902c01',
    'documents/1794684462288-fc373424-39bf-4d8d-950c-2195aa01a603.pdf':'203886e9-cd67-58ab-96b3-ee4ff97b401a',
    'media/1794860043784-52816aff-f9f7-4790-9e91-d87d7a86fc96.pdf':'1105db24-e971-5f1a-b632-d3b9f41b3b39'
  });
  function migratedPageAsset(url){
    if(!url||url.hostname!==SUPABASE_HOST||url.search||url.hash||
       !url.pathname.startsWith(LEGACY_DOCS_PREFIX))return '';
    let relative;
    try{relative=decodeURIComponent(url.pathname.slice(LEGACY_DOCS_PREFIX.length))}
    catch{return ''}
    return Object.prototype.hasOwnProperty.call(LEGACY_PDF_PAGES,relative)?LEGACY_PDF_PAGES[relative]:'';
  }

  function parse(raw) {
    try {
      const u=new URL(String(raw||''),window.location.href);
      return u.protocol==='https:'&&!u.username&&!u.password?u:null;
    }catch{return null}
  }
  function kind(raw) {
    const url=parse(raw);
    if(!url)return 'other';
    if(url.origin===window.location.origin&&url.pathname===READER_PATH
      &&UUID.test(url.searchParams.get('asset')||''))return 'r2';
    if(url.origin===window.location.origin&&url.pathname===READER_PATH
      &&url.searchParams.has('source'))return 'reader';
    if(url.hostname!==SUPABASE_HOST||url.port||!url.pathname.startsWith('/storage/v1/object/public/'))
      return 'other';
    if(/\.pdf$/i.test(url.pathname))return 'legacy-pdf';
    if(/\.(?:docx|doc)$/i.test(url.pathname))return 'legacy-word';
    return 'other';
  }
  function readerUrl(raw){
    const type=kind(raw);
    if(type==='r2'||type==='reader')return parse(raw).href;
    if(type==='legacy-pdf'||type==='legacy-word'){
      const target=new URL(READER_PATH,window.location.origin);
      const pdfSource=parse(raw);
      const pageAsset=type==='legacy-pdf'?migratedPageAsset(pdfSource):'';
      if(pageAsset)target.searchParams.set('asset',pageAsset);
      else target.searchParams.set('source',pdfSource.href);
      return target.href;
    }
    return String(raw||'');
  }
  // Delegated capture also covers any dynamically inserted links that an older
  // component still writes with a direct legacy URL.
  function routeClick(event){
    if(event.defaultPrevented||event.button>0||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return;
    const anchor=event.target?.closest?.('a[href]');
    if(!anchor)return;
    const raw=anchor.getAttribute('href');
    const type=kind(raw);
    if(!type.startsWith('legacy-'))return;
    const to=readerUrl(raw);
    if(to===raw)return;
    event.preventDefault();
    if(anchor.target==='_blank')window.open(to,'_blank','noopener,noreferrer');
    else window.location.assign(to);
  }
  window.GDDDocumentReader=Object.freeze({kind,readerUrl});
  document.addEventListener('click',routeClick,true);
})();
