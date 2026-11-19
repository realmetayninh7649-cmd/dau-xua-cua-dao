/* DẤU XƯA CỬA ĐẠO — future image-display relay for already-published Supabase image URLs.
 * No live cutover while maintenance. Originals and admin editing always keep original URLs.
 * Existing album codes, QR links, captions, and watermark overlays remain unchanged.
 */
((root)=>{
  'use strict';
  const ENABLED=false; // Must remain false until both Worker and website are independently verified.
  const SOURCE_ORIGIN='https://gwpdgubxoquhrfbolftq.supabase.co';
  const SOURCE_PREFIX='/storage/v1/object/public/dao-su-images/';
  const WORKER_PREFIX='https://gdd-r2-gateway.realmetayninh7649.workers.dev/v1/legacy-preview/';
  const VALID=/^(?:documents|media|people|posts|videos|obituaries|memorials|radio|calendar-qui-vi)\/[A-Za-z0-9_.\/-]{1,110}$/;
  function candidate(original){
    if(typeof original!=='string'||original.length>800)return '';
    let url;
    try{url=new URL(original)}catch{return ''}
    if(url.origin!==SOURCE_ORIGIN || url.protocol!=='https:' ||
      !url.pathname.startsWith(SOURCE_PREFIX) || url.username||url.password||
      url.search||url.hash)return '';
    const tail=url.pathname.slice(SOURCE_PREFIX.length);
    let path;
    try{path=decodeURIComponent(tail)}catch{return ''}
    if(!VALID.test(path)||path.split('/').includes('..')||path.split('/').includes('.'))return '';
    // Worker enforces the authoritative 700-path published allowlist too.
    return WORKER_PREFIX+path+'.webp';
  }
  const api=Object.freeze({
    enabled:ENABLED,
    candidate,
    displayUrl(original){
      return ENABLED?(candidate(original)||original):original;
    }
  });
  root.GDDLegacyImages=api;
})(typeof window==='object'?window:globalThis);
