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
 // Browser-native image save menus are separate from screenshot privacy.
 // No pointer hit on protected image elements; their containers remain interactive.
 const style=document.createElement('style');style.id='gdd-restricted-image-style';
 style.textContent=`
 body[data-gdd-screen-access="view"] #detail-content :is(.detail-cover,.gdd-album-figure,.detail-body,.gdd-extra-cover-page,.gdd-detail-photo-grid,.gdd-attached-photo-grid),
 body[data-gdd-screen-access="protected"] #detail-content :is(.detail-cover,.gdd-album-figure,.detail-body,.gdd-extra-cover-page,.gdd-detail-photo-grid,.gdd-attached-photo-grid),
 body[data-gdd-screen-access="checking"] #detail-content :is(.detail-cover,.gdd-album-figure,.detail-body,.gdd-extra-cover-page,.gdd-detail-photo-grid,.gdd-attached-photo-grid),
 body[data-gdd-screen-access="view"] #gdd-image-viewer[data-gdd-record-image="yes"] .gdd-image-stage,
 body[data-gdd-screen-access="protected"] #gdd-image-viewer[data-gdd-record-image="yes"] .gdd-image-stage,
 body[data-gdd-screen-access="checking"] #gdd-image-viewer[data-gdd-record-image="yes"] .gdd-image-stage,
 body[data-gdd-screen-access="view"] .r2-reader .reader-stage,
 body[data-gdd-screen-access="protected"] .r2-reader .reader-stage,
 body[data-gdd-screen-access="checking"] .r2-reader .reader-stage {
  -webkit-touch-callout:none!important;
 }
 body:is([data-gdd-screen-access="view"],[data-gdd-screen-access="protected"],[data-gdd-screen-access="checking"]) #detail-content :is(.detail-cover,.gdd-album-figure,.detail-body,.gdd-extra-cover-page,.gdd-detail-photo-grid,.gdd-attached-photo-grid) img,
 body:is([data-gdd-screen-access="view"],[data-gdd-screen-access="protected"],[data-gdd-screen-access="checking"]) #gdd-image-viewer[data-gdd-record-image="yes"] .gdd-image-stage img,
 body:is([data-gdd-screen-access="view"],[data-gdd-screen-access="protected"],[data-gdd-screen-access="checking"]) .r2-reader :is(.reader-stage,.page-list) img {
  pointer-events:none!important;-webkit-touch-callout:none!important;-webkit-user-drag:none!important;
  user-select:none!important;-webkit-user-select:none!important;
 }
 body:is([data-gdd-screen-access="view"],[data-gdd-screen-access="protected"],[data-gdd-screen-access="checking"]) #detail-content .gdd-album-figure a,
 body:is([data-gdd-screen-access="view"],[data-gdd-screen-access="protected"],[data-gdd-screen-access="checking"]) .r2-reader .reader-stage canvas {
  -webkit-touch-callout:none!important;
 }
 `;
 document.head.appendChild(style);
 let key='',active=false,revision=0,blurred=false,until=0,timer=null;
 const restricted=()=>['checking','view','protected'].includes(document.body.dataset.gddScreenAccess);
 function blocksImageMenu(target){
  if(!restricted()||!target?.closest)return false;
  return Boolean(target.closest('#gdd-image-viewer[data-gdd-record-image="yes"] .gdd-image-stage,#detail-content .detail-cover,#detail-content .gdd-album-figure,#detail-content .detail-body img,#detail-content .gdd-extra-cover-page,#detail-content .gdd-detail-photo-grid,#detail-content .gdd-attached-photo-grid,.r2-reader .reader-stage,.r2-reader .page-list'));
 }
 for(const name of ['contextmenu','dragstart'])document.addEventListener(name,event=>{if(blocksImageMenu(event.target))event.preventDefault()},true);
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
  if(!next){delete document.body.dataset.gddScreenAccess;return;}
  document.body.dataset.gddScreenAccess='checking';
  try{
   const response=await fetch(API+'?'+new URLSearchParams({kind:c.kind,slug:c.slug}),{cache:'no-store',credentials:'omit'});
   if(!response.ok)return;
   const data=await response.json();
   const current=context();
   if(seq!==revision||!valid(current)||current.kind!==c.kind||current.slug!==c.slug)return;
   document.body.dataset.gddScreenAccess=['download','view','protected'].includes(data.mode)?data.mode:'checking';
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
