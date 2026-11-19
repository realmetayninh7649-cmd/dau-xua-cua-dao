/* DẤU XƯA CỬA ĐẠO - Public R2 derivatives only; original bytes remain private.
 * This never writes photos to Supabase public Storage.
 */
(()=>{
  'use strict';
  if(window.GDDPrivatePublishing)return;
  const API='https://gdd-r2-gateway.realmetayninh7649.workers.dev';
  const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  function previewUrl(id){
    if(!UUID.test(String(id||'')))throw Error('Mã ảnh R2 chưa hợp lệ.');
    return API+'/v1/public/'+encodeURIComponent(id)+'/preview';
  }
  function printUrl(id){
    if(!UUID.test(String(id||'')))throw Error('Mã ảnh R2 chưa hợp lệ.');
    return API+'/v1/public/'+encodeURIComponent(id)+'/download';
  }
  async function publishArchivedImage(asset,{allowDownload=false}={}){
    if(!asset?.id||!UUID.test(asset.id))throw Error('Bản gốc R2 chưa có mã hợp lệ.');
    if(asset.previewReady!==true||asset.downloadReady!==true){
      throw Error('Bản gốc đã được cất ở R2, nhưng ảnh xem/in chưa tạo đủ. Không công bố liên kết hỏng.');
    }
    if(!window.GDDR2?.setPublication)throw Error('Bộ quản trị R2 chưa sẵn sàng.');
    await window.GDDR2.setPublication(asset.id,true,{allowDownload:allowDownload===true});
    const response=await fetch(API+'/v1/public/'+encodeURIComponent(asset.id),{
      method:'GET',mode:'cors',credentials:'omit',cache:'no-store'
    });
    if(!response.ok)throw Error('R2 chưa mở bản xem công khai (HTTP '+response.status+').');
    const info=await response.json();
    if(info?.id!==asset.id||info?.kind!=='image'||
       info?.allowDownload!==(allowDownload===true))
      throw Error('Trạng thái công bố bản xem/bản in R2 chưa đồng bộ.');
    return {id:asset.id,url:previewUrl(asset.id),printUrl:allowDownload?printUrl(asset.id):'',originalPrivate:true};
  }
  async function archiveAndPublish(file,supabase,{recordKind=null,recordId=null,role='album',allowDownload=false,onProgress}={}){
    if(!window.GDDR2?.archive)throw Error('Bộ bảo tồn R2 chưa tải xong.');
    const asset=await window.GDDR2.archive(file,supabase,{
      recordKind,recordId,role,skipDerivatives:false,onProgress
    });
    const pub=await publishArchivedImage(asset,{allowDownload});
    return {...pub,asset};
  }
  async function publishLinkedImages(supabase,kind,recordId){
    if(!supabase||!['people','posts','media','videos','obituaries','documents'].includes(kind)||!UUID.test(recordId))
      throw Error('Thiếu thông tin công bố ảnh đính kèm.');
    const {data:assets,error}=await supabase.from('gdd_r2_assets')
      .select('asset_id,media_kind,preview_ready,download_ready,public_view')
      .eq('record_kind',kind).eq('record_id',recordId);
    if(error)throw error;
    let count=0;
    for(const asset of assets||[]){
      if(asset.media_kind!=='image'||asset.public_view===true)continue;
      if(asset.preview_ready!==true||asset.download_ready!==true)
        throw Error('Có bản ảnh R2 chưa xử lý xong. Xin kiểm tra kho R2 trước khi công bố.');
      await publishArchivedImage({id:asset.asset_id,previewReady:true,downloadReady:true},
        {allowDownload:kind==='documents'});
      count++;
    }
    return count;
  }
  function isPreviewURL(value){
    try{
      const u=new URL(String(value||''));
      return u.origin===API && /^\/v1\/public\/[a-f0-9-]{36}\/preview$/i.test(u.pathname)
        && !u.search&&!u.hash;
    }catch{return false}
  }
  window.GDDPrivatePublishing=Object.freeze({previewUrl,printUrl,isPreviewURL,
    publishArchivedImage,archiveAndPublish,publishLinkedImages});
})();
