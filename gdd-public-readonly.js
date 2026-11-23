/* DẤU XƯA CỬA ĐẠO — public read-only Cloudflare D1 staging adapter.
 * Không có route quản trị, không nhận bản nháp, không sử dụng khóa bí mật.
 * Các album và phân loại dùng bản chụp công khai đã kiểm tra tới khi có API D1 riêng.
 */
(() => {
  'use strict';
  if(window.GDDPublicReadOnly)return;
  const KINDS=Object.freeze([
    'people','posts','media','videos','obituaries','documents',
    'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials'
  ]);
  const API='https://gdd-d1-api-staging.realmetayninh7649.workers.dev';
  let pending=null;
  async function staticArchive(){
    const response=await fetch('./public-fallback.json?v=20261123-recovery-01',
      {credentials:'omit',cache:'no-store'});
    if(!response.ok)throw Error('Không có bản dự phòng công khai');
    const data=await response.json();
    if(data?.source!=='public-published-read-only-backup'||
      !['gallery','placements',...KINDS].every(k=>Array.isArray(data[k]))||
      !KINDS.every(k=>data[k].every(row=>row?.published===true)))
      throw Error('Bản dự phòng công khai không hợp lệ');
    return data;
  }
  async function pages(kind){
    if(!KINDS.includes(kind))throw Error('Chuyên mục không được phép');
    const rows=[];
    for(let offset=0;offset<=5000;offset+=100){
      const url=API+'/api/v1/public/'+kind+'?limit=100&offset='+offset;
      const response=await fetch(url,{cache:'no-store',credentials:'omit'});
      if(!response.ok)throw Error('API D1 không khả dụng');
      const data=await response.json();
      if(!Array.isArray(data?.data)||data.data.length>100||
        data.data.some(row=>row?.published!==true))
        throw Error('API D1 trả về dữ liệu không được công bố');
      rows.push(...data.data);
      if(data.data.length<100)return rows;
    }
    throw Error('Phân trang D1 chưa hoàn chỉnh; không hiển thị dữ liệu thiếu');
  }
  async function load(){
    if(!pending){
      pending=(async()=>{
        // Always keep a validated static copy available for media/placement metadata.
        const backup=await staticArchive();
        if(window.SITE_CONFIG?.publicReadProvider!=='d1-staging')
          return {...backup,backend:'snapshot'};
        try {
          const contents=await Promise.all(KINDS.map(async kind=>[kind,await pages(kind)]));
          const combined={...backup,backend:'d1'};
          for(const [kind,rows] of contents)combined[kind]=rows;
          return combined;
        }catch(e){
          console.warn('D1 staging inaccessible; using public snapshot only');
          return {...backup,backend:'snapshot'};
        }
      })().catch(error=>{pending=null;throw error});
    }
    return pending;
  }
  async function rows(kind){
    const data=await load();
    return kind==='archive_gallery_images'?data.gallery:(data[kind]||[]);
  }
  async function find(kind,field,value){
    return (await rows(kind)).find(row=>row?.[field]===value)||null;
  }
  async function album(kind,ownerId){
    const list=await rows('gallery');
    return list.filter(row=>row.owner_kind===kind&&row.owner_id===ownerId)
      .sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)
        ||String(a.created_at||'').localeCompare(String(b.created_at||'')))
      .slice(0,200);
  }
  window.GDDPublicReadOnly=Object.freeze({load,rows,find,album});
})();
