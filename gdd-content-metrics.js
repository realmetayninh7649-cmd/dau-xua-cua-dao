/* Đếm lượt xem/lượt yêu cầu tải của bài công khai qua RPC Supabase.
 * Không thu thập IP, email hoặc thông tin tài khoản của khách.
 * Một trình duyệt ghi tối đa 1 lượt xem/bài/ngày bằng khóa ngẫu nhiên theo ngày.
 * Lượt tải là lượt bấm nút/link tải của website, KHÔNG gồm lưu bằng trình duyệt.
 */
(() => {
  'use strict';
  if(window.__GDDContentMetrics)return;
  window.__GDDContentMetrics=true;
  const allowed=new Set(['people','posts','media','videos','obituaries','documents','memorial']);
  const format=new Intl.NumberFormat('vi-VN');
  let active=null,serial=0,clientPromise=null;
  const randomHex=()=>{
    const v=new Uint8Array(16);
    if(window.crypto?.getRandomValues)window.crypto.getRandomValues(v);
    else for(let i=0;i<v.length;i++)v[i]=Math.floor(Math.random()*256);
    return Array.from(v,x=>x.toString(16).padStart(2,'0')).join('');
  };
  const keyForView=()=>{
    const day=new Date().toISOString().slice(0,10).replace(/-/g,'');
    const cacheKey='gdd_article_view_'+day;
    let token='';
    try{
      token=localStorage.getItem(cacheKey)||'';
      if(!/^[a-f0-9]{32}$/.test(token)){
        token=randomHex();
        localStorage.setItem(cacheKey,token);
      }
    }catch(_){
      token=window.__gddMetricViewToken||(window.__gddMetricViewToken=randomHex());
    }
    return 'v_'+day+'_'+token;
  };
  const loadClient=()=>{
    if(clientPromise)return clientPromise;
    clientPromise=(async()=>{
      const cfg=window.SITE_CONFIG||{};
      if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)return null;
      const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      return createClient(cfg.supabaseUrl,cfg.supabasePublishableKey);
    })();
    return clientPromise;
  };
  async function register(kind,id,type,key){
    try{
      const client=await loadClient();
      if(!client)return null;
      const {data,error}=await client.rpc('gdd_record_content_metric',{
        p_kind:kind,p_record_id:id,p_event_type:type,p_event_key:key
      });
      if(error)throw error;
      const row=Array.isArray(data)?data[0]:data;
      if(!row)return null;
      return {views:Number(row.view_count)||0,downloads:Number(row.download_count)||0};
    }catch(err){
      console.warn('[Dấu Xưa: lượt xem/tải]',err?.message||err);
      return null;
    }
  }
  function show(data,ref){
    if(!data||!ref?.node?.isConnected||!active||active!==ref)return;
    ref.node.querySelector('[data-count-view]').textContent=format.format(data.views);
    ref.node.querySelector('[data-count-download]').textContent=format.format(data.downloads);
  }
  async function countView(ref){
    const data=await register(ref.kind,ref.id,'view',keyForView());
    show(data,ref);
  }
  async function countDownload(ref){
    const data=await register(ref.kind,ref.id,'download','d_'+randomHex());
    show(data,ref);
    if(data)window.dispatchEvent(new Event('gdd:content-download-recorded'));
  }
  function mount(kind,id,published,container){
    if(!allowed.has(kind)||!published||!container||!/^[0-9a-f-]{36}$/i.test(id||''))return;
    const old=container.querySelector(':scope > .gdd-content-metrics');
    if(old)old.remove();
    const box=document.createElement('section');
    box.className='gdd-content-metrics';box.setAttribute('aria-label','Thống kê bài tư liệu');
    const kicker=document.createElement('span');
    kicker.className='gdd-content-metrics-title';kicker.textContent='THỐNG KÊ TƯ LIỆU';
    const group=document.createElement('div');group.className='gdd-content-metrics-pair';
    const seen=document.createElement('span');seen.className='gdd-content-metric';
    seen.innerHTML='◉ Lượt xem: <strong data-count-view aria-live="polite">—</strong>';
    const downloaded=document.createElement('span');downloaded.className='gdd-content-metric';
    downloaded.innerHTML='↓ Lượt tải: <strong data-count-download aria-live="polite">—</strong>';
    group.append(seen,downloaded);
    const note=document.createElement('small');
    note.textContent='Lượt tải chỉ ghi nhận thao tác bấm tải trên website, không gồm lưu ảnh thủ công hoặc tải ngoài trình duyệt.';
    box.append(kicker,group,note);
    container.appendChild(box);
    const ref={kind,id,node:box,serial:++serial};
    active=ref;
    countView(ref);
  }
  window.addEventListener('gdd:content-open',e=>{
    const {kind,id,published,containerId}=e.detail||{};
    if(!kind||!id)return;
    const container=document.getElementById(containerId||'detail-content');
    mount(kind,String(id),published===true,container);
  });
  function claimsDownloadClick(button){
    if(!active?.node?.isConnected||!button||button.hidden||button.disabled)return false;
    const fromArticle=Boolean(button.closest('#detail-content,#gdd-memorial-dialog-body'));
    const fromViewer=button.id==='gdd-image-download'
      &&document.getElementById('detail-overlay')?.hidden===false;
    if(!fromArticle&&!fromViewer)return false;
    if(active.kind!=='memorial'&&document.getElementById('detail-overlay')?.hidden!==false)return false;
    return true;
  }
  // One event per article download action. The site-wide widget sums these
  // records, so its standalone recorder must not count them a second time.
  window.GDDContentMetrics=Object.freeze({claimsDownloadClick});
  document.addEventListener('click',e=>{
    const el=e.target instanceof Element?e.target:null;
    const button=el?.closest('a[download],#gdd-image-download,[data-gdd-image-save],[data-gdd-qr-download]');
    if(!claimsDownloadClick(button))return;
    void countDownload(active);
  },true);
})();
