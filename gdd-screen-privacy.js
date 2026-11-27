/* Experimental privacy curtain, not DRM or screenshot prevention.
   Only confirmed protected records in people/documents. No capture or logging. */
(()=>{
 'use strict';
 const API='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/record-access';
 const kinds=new Set(['people','documents']);
 const root=document.getElementById('detail-content'), overlay=document.getElementById('detail-overlay');
 const reader=Boolean(document.querySelector('main.r2-reader'));
 const mask=document.createElement('div');mask.id='gdd-screen-privacy-curtain';mask.hidden=true;mask.setAttribute('aria-hidden','true');
 mask.style.cssText='position:fixed;inset:0;background:#000;z-index:2147483647;pointer-events:none;display:none';
 document.body.appendChild(mask);
 let key='',active=false,revision=0,blurred=false,until=0,timer=null;
 function context(){
  if(reader){
   const q=new URLSearchParams(location.search);
   return {kind:q.get('record_kind'),slug:q.get('record_slug')};
  }
  if(!root||!overlay||overlay.hidden||!root.querySelector('.detail-title'))return null;
  return {kind:root.dataset.gddKind,slug:root.dataset.gddRecordSlug};
 }
 function valid(c){return c&&kinds.has(c.kind)&&typeof c.slug==='string'&&c.slug.length>0&&c.slug.length<=300}
 function render(){
  const show=active&&(document.hidden||blurred||Date.now()<until);
  mask.hidden=!show;mask.style.display=show?'block':'none';
 }
 function deactivate(){active=false;until=0;clearTimeout(timer);render()}
 async function sync(force=false){
  const c=context(),next=valid(c)?c.kind+'\n'+c.slug:'';
  if(next===key&&!force)return;
  key=next;const seq=++revision;deactivate();
  if(!next)return;
  try{
   const response=await fetch(API+'?'+new URLSearchParams({kind:c.kind,slug:c.slug}),{cache:'no-store',credentials:'omit'});
   if(!response.ok)return;
   const data=await response.json();
   const current=context();
   if(seq!==revision||!valid(current)||current.kind!==c.kind||current.slug!==c.slug)return;
   active=data.mode==='protected';render();
  }catch{/* Unknown policy never activates the experiment. Existing server policy is unchanged. */}
 }
 window.addEventListener('blur',()=>{blurred=true;render()});
 window.addEventListener('focus',()=>{blurred=false;render()});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){blurred=false;until=0;clearTimeout(timer);void sync(true)}render()});
 window.addEventListener('pagehide',()=>{blurred=true;render()});
 window.addEventListener('pageshow',()=>{blurred=false;until=0;void sync(true);render()});
 document.addEventListener('pointerdown',()=>{if(!document.hidden&&blurred){blurred=false;render()}},{capture:true,passive:true});
 document.addEventListener('keydown',event=>{
  if(!active||event.key!=='PrintScreen')return;
  until=Date.now()+1800;clearTimeout(timer);render();timer=setTimeout(()=>{until=0;render()},1820);
 },true);
 if(root&&overlay){
  const observer=new MutationObserver(()=>void sync());
  observer.observe(root,{attributes:true,attributeFilter:['data-gdd-kind','data-gdd-record-slug'],childList:true});
  observer.observe(overlay,{attributes:true,attributeFilter:['hidden']});
  window.addEventListener('gdd:content-open',()=>void sync());
 }
 void sync();
})();
