/* GDDĐ v2.0.0-DK01.5 - One document reader across the entire website.
 * This routes legacy public PDF links into the same UI as approved R2 page viewers.
 * It NEVER claims that a legacy public original has become private. */
(() => {
  'use strict';
  const SUPABASE_HOST='gwpdgubxoquhrfbolftq.supabase.co';
  const READER_PATH='/dau-xua-cua-dao/r2-xem.html';
  const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
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
      target.searchParams.set('source',parse(raw).href);
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
