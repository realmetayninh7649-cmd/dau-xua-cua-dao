/* Shared read-only attachment display for every published content group. */
(()=>{
'use strict';
const api='https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/public/';
const kinds=new Set(['people','posts','media','videos','obituaries','documents','gdd_memorials','gdd_audio_programs','gdd_calendar_memorials']);
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
async function fetchRows(type,kind,id){
 const rows=[];
 for(let offset=0;offset<=5000;offset+=100){
  const url=new URL(api+type);url.searchParams.set('owner_kind',kind);url.searchParams.set('owner_id',id);url.searchParams.set('limit','100');url.searchParams.set('offset',String(offset));
  const res=await fetch(url,{credentials:'omit',cache:'no-store'});
  if(!res.ok)throw Error('Không đọc được tư liệu đính kèm');
  const json=await res.json();if(!Array.isArray(json.data))throw Error('Danh sách không hợp lệ');
  rows.push(...json.data);
  if(type==='attachments'?!json.has_next:json.data.length<100)return rows;
 }
 throw Error('Danh sách tư liệu vượt giới hạn');
}
function el(tag,text,cls){const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node}
function attach(target,kind,id,{before=null,photos=false,lazy=false}={}){
 if(!target||!kinds.has(kind)||!uuid.test(id||'')||window.SITE_CONFIG?.publicReadProvider!=='d1-staging')return;
 const section=el(lazy?'details':'section','','gdd-public-attachments detail-source');section.hidden=!lazy;
 if(lazy)section.append(el('summary','Ảnh và tài liệu đính kèm'));
 if(before?.parentElement===target)before.before(section);else target.append(section);
 let started=false;
 async function load(){
  if(started)return;started=true;
  const results=await Promise.allSettled([fetchRows('attachments',kind,id),photos?fetchRows('albums',kind,id):Promise.resolve([])]);
  if(!section.isConnected)return;
  const docs=results[0].status==='fulfilled'?results[0].value.filter(row=>uuid.test(row.asset_id||'')):[];
  const images=results[1].status==='fulfilled'?results[1].value.filter(row=>{try{const u=new URL(row.image_url);return u.protocol==='https:'&&!u.username&&!u.password&&!/\/r2-xem\.html$/i.test(u.pathname)&&!/\.pdf$|\.docx?$/i.test(u.pathname)}catch{return false}}):[];
  if(!docs.length&&!images.length){if(results.some(x=>x.status==='rejected')&&lazy){section.append(el('small','Chưa tải được danh sách tư liệu. Mở lại mục để thử lại.'));started=false;return}section.remove();return}
  if(!lazy)section.append(el('strong',photos?'TƯ LIỆU ĐÍNH KÈM':'TÀI LIỆU ĐÍNH KÈM ('+docs.length+')'));
  if(images.length){
   const grid=el('div');grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;margin:10px 0;';
   for(const row of images){const figure=el('figure');figure.style.margin='0';const img=el('img');img.loading='lazy';img.decoding='async';img.src=window.GDDLegacyImages?.displayUrl(row.image_url)||row.image_url;img.alt=row.caption||'Ảnh tư liệu';img.style.cssText='width:100%;height:auto;object-fit:contain;border-radius:4px;';figure.append(img);if(row.caption)figure.append(el('figcaption',row.caption));grid.append(figure)}
   section.append(grid);
  }
  for(const row of docs){
   const line=el('div');line.style.cssText='display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin:8px 0;';
   const name=el('span',row.original_name||'Tài liệu');name.style.cssText='flex:1;min-width:100px;overflow-wrap:anywhere';line.append(name);
   if(Number(row.single_pdf)===1&&Number(row.allow_download)===1){
    const link=el('a','Xem PDF ↗','btn btn-outline');link.href=api+'attachments/'+encodeURIComponent(kind)+'/'+encodeURIComponent(id)+'/'+encodeURIComponent(row.asset_id)+'/download?view=1';link.target='_blank';link.rel='noopener noreferrer';line.append(link);
   }else if(row.has_reader===undefined||Number(row.has_reader)===1){
    const link=el('a','Đọc tài liệu ↗','btn btn-outline');const url=new URL('r2-xem.html',new URL('.',location.href));url.searchParams.set('asset',row.asset_id);link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';line.append(link);
   }
   if(Number(row.allow_download)===1){
    const ext=String(row.original_name||'').split('.').pop().toLowerCase();
    const link=el('a',ext==='pdf'?'↓ Tải PDF':'↓ Tải Word','btn btn-outline');link.href=api+'attachments/'+encodeURIComponent(kind)+'/'+encodeURIComponent(id)+'/'+encodeURIComponent(row.asset_id)+'/download';link.rel='noopener noreferrer';line.append(link);
   }
   section.append(line);
  }
  section.hidden=false;
 }
 if(lazy)section.addEventListener('toggle',()=>{if(section.open)load()});else load();
}
// Secondary cover pages have independent slots, never enter the ordinary album.
function attachCovers(target,kind,id,{after=null,before=null,lazy=false}={}){
 if(!target||!kinds.has(kind)||!uuid.test(id||'')||window.SITE_CONFIG?.publicReadProvider!=='d1-staging')return;
 const section=el(lazy?'details':'section');section.className='gdd-extra-covers';
 section.setAttribute('aria-label','Ảnh bìa bổ sung');
 if(lazy)section.append(el('summary','Xem ảnh bìa bổ sung'));else section.hidden=true;
 if(after?.parentElement===target)after.after(section);
 else if(before?.parentElement===target)before.before(section);
 else target.append(section);
 let started=false;
 async function load(){
  if(started)return;started=true;
  try{
   const url=new URL(api+'covers');url.searchParams.set('owner_kind',kind);url.searchParams.set('owner_id',id);
   const response=await fetch(url,{cache:'no-store',credentials:'omit'});
   if(!response.ok)throw Error('cover read failed');
   const json=await response.json();
   if(!section.isConnected)return;
   const rows=(Array.isArray(json.data)?json.data:[]).filter(row=>[2,3].includes(row.slot)&&/^https:\/\/gdd-r2-gateway\.realmetayninh7649\.workers\.dev\/v1\/public\/[a-f0-9-]{36}\/preview$/i.test(row.image_url||'')).sort((a,b)=>a.slot-b.slot).slice(0,2);
   if(!rows.length){if(lazy)section.append(el('small','Không có ảnh bìa bổ sung.'));else section.remove();return}
   for(const row of rows){
    const figure=el('figure');figure.className='gdd-extra-cover-page';
    const a=el('a');a.href=row.image_url;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','Xem toàn ảnh bìa '+row.slot);
    const img=el('img');img.src=row.image_url;img.alt='Ảnh bìa '+row.slot;img.loading='lazy';img.decoding='async';a.append(img);
    figure.append(a,el('figcaption','Ảnh bìa '+row.slot+' · Xem toàn ảnh ↗'));section.append(figure);
   }
   section.hidden=false;
  }catch{if(!section.isConnected)return;if(lazy){section.append(el('small','Chưa tải được ảnh bìa bổ sung.'));}else section.remove()}
 }
 if(lazy)section.addEventListener('toggle',()=>{if(section.open)load()});else load();
}
window.GDDPublicAttachments=Object.freeze({attach,attachCovers});
})();
