/* DẤU XƯA CỬA ĐẠO — Tổng lượt tải toàn Website.
 * Gộp các lượt tải đã lưu theo bài với các lượt tải ở ngoài bài.
 * Chỉ ghi khi người dùng yêu cầu tải qua nút/liên kết của Website:
 * không tính lượt xem trang, ảnh hiển thị, bản gốc private hoặc tải trực tiếp ngoài web.
 * Không lưu IP/email, và không đặt lại số liệu đã có.
 */
(()=>{
  'use strict';
  if(window.GDDDownloadStats)return;
  const cfg=window.SITE_CONFIG||{};
  const d1=cfg.publicReadProvider==='d1-staging';
  const statsURL='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/stats';
  const format=new Intl.NumberFormat('vi-VN');
  const allowed=new Set(['image','pdf','word','qr','audio','other']);
  let clientPromise=null,refreshPending=null,refreshAt=0;
  function randomUUID(){
    if(window.crypto?.randomUUID)return window.crypto.randomUUID();
    if(!window.crypto?.getRandomValues)return '';
    const a=window.crypto.getRandomValues(new Uint8Array(16));
    a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;
    return [...a].map((n,i)=>n.toString(16).padStart(2,'0')+
      ([3,5,7,9].includes(i)?'-':'')).join('');
  }
  function sessionId(){
    try{
      let id=sessionStorage.getItem('gdd_site_download_session_v1')||'';
      if(!/^[a-f0-9]{8}-[a-f0-9-]{27,28}$/i.test(id)){
        id=randomUUID();
        if(id)sessionStorage.setItem('gdd_site_download_session_v1',id);
      }
      return id;
    }catch{return window.__gddDownloadSession||(window.__gddDownloadSession=randomUUID())}
  }
  function loadClient(){
    if(clientPromise)return clientPromise;
    clientPromise=(async()=>{
      if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return null;
      const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      return createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,
        {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
    })().catch(err=>{clientPromise=null;throw err});
    return clientPromise;
  }
  function render(n){
    const el=document.getElementById('gdd-total-downloads');
    if(!el)return;
    el.textContent=format.format(n);
    el.setAttribute('aria-label',format.format(n)+' lượt tải tư liệu được ghi nhận');
  }
  async function refresh(force=false){
    if(refreshPending)return refreshPending;
    if(!force&&Date.now()-refreshAt<20000)return;
    refreshPending=(async()=>{
      try{
        if(d1){
          const response=await fetch(statsURL,{cache:'no-store',credentials:'omit'});
          if(!response.ok)throw Error('HTTP '+response.status);
          const totals=await response.json();
          const n=Number(totals.total_downloads);
          if(!Number.isSafeInteger(n)||n<0||totals.source!=='cloudflare-d1')
            throw Error('Tổng lượt tải D1 không hợp lệ');
          refreshAt=Date.now();render(n);return n;
        }
        const client=await loadClient();if(!client)return;
        const {data,error}=await client.rpc('gdd_get_site_download_total');
        if(error)throw error;
        const number=Number(data);
        if(!Number.isSafeInteger(number)||number<0)throw Error('Số lượt tải không hợp lệ');
        refreshAt=Date.now();
        render(number);
        return number;
      }catch(error){
        console.warn('[GDD Site Downloads] Không đọc được bộ đếm:',error?.message||error);
      }finally{refreshPending=null}
    })();
    return refreshPending;
  }
  async function recordStandalone(kind='other'){
    if(!allowed.has(kind))kind='other';
    const eventId=randomUUID(),sid=sessionId();
    if(!eventId||!sid)return;
    try{
      if(d1){
        const response=await fetch(statsURL+'/download',{
          method:'POST',cache:'no-store',credentials:'omit',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({event_id:eventId,session_id:sid,kind})});
        if(!response.ok)throw Error('HTTP '+response.status);
        const totals=await response.json();
        if(Number.isSafeInteger(totals.total_downloads)&&totals.total_downloads>=0){
          refreshAt=Date.now();render(totals.total_downloads);
        }
        return;
      }
      const client=await loadClient();if(!client)return;
      const {data,error}=await client.rpc('gdd_record_site_unlinked_download',{
        p_event_id:eventId,p_session_id:sid,p_download_kind:kind
      });
      if(error)throw error;
      const number=Number(data);
      if(Number.isSafeInteger(number)&&number>=0){refreshAt=Date.now();render(number)}
    }catch(error){console.warn('[GDD Site Downloads] Không lưu được lượt tải:',error?.message||error)}
  }
  function classify(element){
    if(!element||element.closest('[hidden],[aria-disabled="true"]'))return null;
    if(element.matches('button')&&element.disabled)return null;
    if(element.matches('[data-gdd-qr-download]'))return 'qr';
    if(element.matches('#gdd-image-download,[data-gdd-image-save],#r2-download'))return 'image';
    if(!element.matches('a[download]'))return null;
    const name=((element.getAttribute('download')||'')+' '+(element.getAttribute('href')||'')).toLowerCase();
    if(/\.(pdf)(?:\b|[?#])/.test(name))return 'pdf';
    if(/\.(docx?|odt)(?:\b|[?#])/.test(name))return 'word';
    if(/\.(mp3|m4a|ogg|wav|flac)(?:\b|[?#])/.test(name))return 'audio';
    if(/\.(png|jpe?g|gif|webp|avif)(?:\b|[?#])/.test(name))return 'image';
    return 'other';
  }
  document.addEventListener('click',event=>{
    if(event.defaultPrevented)return;
    const target=event.target instanceof Element?event.target.closest('a[download],#r2-download,#gdd-image-download,[data-gdd-image-save],[data-gdd-qr-download]'):null;
    if(!target)return;
    const kind=classify(target);if(!kind)return;
    // The existing per-article metric RPC already records these exact clicks.
    // Its counter is included in gdd_get_site_download_total; do not double-count.
    if(window.GDDContentMetrics?.claimsDownloadClick?.(target))return;
    void recordStandalone(kind);
  },true);
  window.addEventListener('gdd:content-download-recorded',()=>{void refresh(true)});
  window.addEventListener('pageshow',()=>{void refresh(true)});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()});
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',()=>{void refresh(true)},{once:true});
  else void refresh(true);
  window.GDDDownloadStats=Object.freeze({refresh,recordStandalone});
})();
