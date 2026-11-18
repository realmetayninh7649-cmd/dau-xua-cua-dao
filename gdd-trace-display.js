/* DẤU XƯA CỬA ĐẠO · Dùng bản ảnh đã có dòng lưu dấu khi khách tự chạm giữ để lưu.
 * Chỉ xử lý ảnh công khai đã có mã, không sửa ảnh nguyên mẫu.
 */
(() => {
  'use strict';
  if(window.GDDTraceDisplay)return;
  const trace=window.GDDTrace;
  if(!trace)return;
  const originals=new WeakMap(), cache=new Map(), inFlight=new Map(), jobs=[];
  const MAX_CACHE=42,MAX_PARALLEL=2;
  let busy=0;
  const managed=new Set();
  const css=document.createElement('style');
  css.id='gdd-trace-native-save-style';
  css.textContent='img.gdd-trace-pending{opacity:0!important;pointer-events:none!important} img.gdd-trace-ready,img.gdd-trace-unavailable{opacity:1}';
  document.head.appendChild(css);

  const isInSight=img=>{
    const r=img.getBoundingClientRect();
    return r.width>0&&r.height>0&&r.bottom>-100&&r.top<innerHeight+240;
  };
  const isHttp=s=>{try{return ['https:','http:'].includes(new URL(s,location.href).protocol)}catch{return false}};
  const visible=img=>img.isConnected&&isInSight(img);

  function prune(){
    if(cache.size<=MAX_CACHE)return;
    // Only recycle offscreen conversions; never interrupt the full-screen viewer.
    if(!document.getElementById('gdd-image-viewer')?.hidden)return;
    for(const [key,entry] of cache){
      if(cache.size<=MAX_CACHE)break;
      if([...entry.refs].some(visible))continue;
      for(const img of entry.refs){
        const state=originals.get(img);
        if(!state||state.key!==key)continue;
        if(img.isConnected){
          img.classList.remove('gdd-trace-ready');
          img.classList.add('gdd-trace-pending');
          img.src=state.source;
          state.stage='observing';
          observer.observe(img);
        }
      }
      managed.delete(entry.url);
      URL.revokeObjectURL(entry.url);
      cache.delete(key);
    }
  }

  function apply(img,state,entry){
    if(!img.isConnected||originals.get(img)!==state)return;
    if(state.stage==='ready')return;
    state.stage='ready';
    entry.refs.add(img);
    img.src=entry.url;
    img.classList.remove('gdd-trace-pending','gdd-trace-unavailable');
    img.classList.add('gdd-trace-ready');
    img.dataset.gddTraceState='ready';
    observer.unobserve(img);
  }
  function failed(img,state,error){
    if(originals.get(img)!==state)return;
    state.stage='unavailable';
    img.classList.remove('gdd-trace-pending');
    img.classList.add('gdd-trace-unavailable');
    img.dataset.gddTraceState='unavailable';
    img.title='Ảnh nguồn chưa hỗ trợ tạo bản lưu dấu tự động';
    observer.unobserve(img);
    console.info('[GDD Trace] Không xử lý được bản hiển thị:',String(error?.message||error));
  }
  function pump(){
    while(busy<MAX_PARALLEL&&jobs.length){
      const state=jobs.shift(),img=state.img;
      if(!img.isConnected||originals.get(img)!==state||state.stage!=='queued')continue;
      state.stage='working';busy++;
      const entry=cache.get(state.key);
      let promise=entry?Promise.resolve(entry):inFlight.get(state.key);
      if(!promise){
        promise=(async()=>{
          const blob=await trace.stampedBlob(state.source,state.code,{maxDimension:3200});
          const url=URL.createObjectURL(blob),record={url,refs:new Set()};
          managed.add(url);cache.set(state.key,record);
          return record;
        })();
        const key=state.key;
        inFlight.set(key,promise);
        promise.finally(()=>{if(inFlight.get(key)===promise)inFlight.delete(key)}).catch(()=>{});
      }
      promise.then(rec=>apply(img,state,rec)).catch(err=>failed(img,state,err))
        .finally(()=>{busy--;prune();pump();});
    }
  }
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting)continue;
      const state=originals.get(entry.target);
      if(!state||state.stage!=='observing')continue;
      state.stage='queued';jobs.push(state);
    }
    pump();
  },{rootMargin:'240px 0px',threshold:0.01});

  function watch(img){
    if(!(img instanceof HTMLImageElement)||originals.has(img))return;
    const code=img.dataset.photoCode?.trim();
    if(!trace.validCode(code))return;
    const source=img.getAttribute('src')||img.src;
    if(!isHttp(source))return;
    if(trace.isStampedURL(source)){
      img.dataset.gddTraceState='ready';
      img.classList.add('gdd-trace-ready');
      return;
    }
    const state={img,source,code,key:code+'|'+source,stage:'observing'};
    originals.set(img,state);
    img.classList.add('gdd-trace-pending');
    img.dataset.gddTraceState='pending';
    const existing=cache.get(state.key);
    if(existing){apply(img,state,existing);return}
    observer.observe(img);
  }
  function decorate(img){
    if(!(img instanceof HTMLImageElement))return;
    if(!img.dataset.photoCode){
      const wrapper=img.closest('[data-gdd-trace-code]');
      const code=wrapper?.dataset.gddTraceCode;
      if(trace.validCode(code))img.dataset.photoCode=code;
    }
    watch(img);
  }
  function scan(root){
    if(!root||root.nodeType!==1)return;
    if(root instanceof HTMLImageElement)decorate(root);
    root.querySelectorAll?.('img[data-photo-code], [data-gdd-trace-code] img').forEach(decorate);
  }
  const mutation=new MutationObserver(records=>{
    for(const r of records){
      if(r.type==='attributes'){scan(r.target);continue}
      for(const node of r.addedNodes)scan(node);
    }
    prune();
  });
  mutation.observe(document.body,{subtree:true,childList:true,
    attributes:true,attributeFilter:['data-photo-code','data-gdd-trace-code']});
  scan(document.body);
  window.GDDTraceDisplay=Object.freeze({
    isStampedBlob:url=>managed.has(String(url)),
    originalFor:img=>originals.get(img)?.source||null,
    scan
  });
})();