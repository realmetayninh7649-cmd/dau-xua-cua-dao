/* GDDĐ v2.0.0-DK01.3 - Trang quản trị: bảo tồn bản gốc trước khi công bố ảnh nhẹ.
   KHÔNG dùng secret/service_role và không cấp đường dẫn tải bản nguyên mẫu. */
(() => {
  'use strict';
  const apiModule = './workers/gdd-r2-gateway/client/uploader.mjs?v=20261117-dk013';
  const kinds = new Set(['people','posts','media','videos','obituaries','documents']);
  const roles = new Set(['primary','album','vault']);
  const $ = id => document.getElementById(id);
  const saved = new WeakMap();
  let modulePromise, client, bound=false, busy=false;

  function getUploader() {
    if (!modulePromise) modulePromise=import(apiModule).catch(error=>{
      modulePromise=null;
      throw Error('Không tải được thư viện R2: '+(error?.message||error));
    });
    return modulePromise;
  }
  function note(message) {
    const status=$('gdd-r2-vault-status');
    if(status) status.textContent=message;
  }
  function labelOf(file){return String(file?.name||'').slice(0,160)}
  function account(supabase){
    if(!supabase?.auth?.getUser || !supabase?.auth?.getSession)throw Error('Chưa có phiên quản trị Supabase');
    return supabase;
  }
  async function indexAsset(result,file,supabase,{recordKind=null,recordId=null,role='vault'}={}) {
    if(recordKind&&!kinds.has(recordKind))throw Error('Chuyên mục liên kết R2 không hợp lệ');
    if(!roles.has(role))throw Error('Loại bản gốc R2 không hợp lệ');
    const {data,error}=await account(supabase).auth.getUser();
    if(error||!data?.user?.id)throw Error('Phiên đăng nhập đã hết hạn khi ghi chỉ mục R2.');
    const row={
      asset_id:result.id,owner_id:data.user.id,record_kind:recordKind,
      record_id:recordId,role,original_name:labelOf(file),
      original_bytes:result.originalBytes,
      media_kind:result.status?.startsWith('document')?'document':'image',
      preview_ready:!!result.previewReady,
      download_ready:!!result.downloadReady
    };
    const {error:dbError}=await supabase.from('gdd_r2_assets').upsert(row,{onConflict:'asset_id'});
    if(dbError)throw Error('Bản gốc đã lưu R2 (ID: '+result.id+'), nhưng không ghi được danh mục: '+dbError.message);
    return result;
  }
  async function archive(file,supabase,{recordKind=null,recordId=null,role='vault',onProgress}={}) {
    if(!file||!file.name||!Number.isSafeInteger(file.size)||file.size<=0)throw Error('Vui lòng chọn tệp gốc hợp lệ.');
    account(supabase);
    let task=saved.get(file);
    if(!task){
      task=(async()=>{
        const {uploadPreservedAsset}=await getUploader();
        return uploadPreservedAsset(file,{supabase,onProgress});
      })();
      saved.set(file,task);
    }
    let result;
    try{result=await task}catch(error){saved.delete(file);throw error}
    await indexAsset(result,file,supabase,{recordKind,recordId,role});
    return result;
  }
  async function link(result,recordKind,recordId,role,supabase) {
    if(!result?.id||!kinds.has(recordKind)||!recordId||!roles.has(role))
      throw Error('Thiếu mã tư liệu hoặc mã bài để liên kết R2.');
    const {data,error}=await account(supabase).from('gdd_r2_assets')
      .update({record_kind:recordKind,record_id:recordId,role})
      .eq('asset_id',result.id)
      .select('asset_id')
      .maybeSingle();
    if(error||!data)throw Error('Ảnh gốc đã lưu tại R2 (ID: '+result.id+'), nhưng chưa liên kết được vào bài: '+(error?.message||'không tìm thấy chỉ mục'));
    return data;
  }
  function makeRow(entry){
    const box=document.createElement('div');
    box.className='gdd-r2-item';
    const header=document.createElement('strong');
    header.textContent=entry.original_name||'Tư liệu không có tên';
    box.appendChild(header);
    const line=document.createElement('small');
    const size=Number(entry.original_bytes||0);
    const unit=size>=1048576?(size/1048576).toFixed(2)+' MB':Math.ceil(size/1024)+' KB';
    line.textContent=unit+' · '+(entry.media_kind==='document'?'Tài liệu':'Ảnh')+
      ' · '+(entry.record_id?'Đã liên kết '+entry.record_kind:'Lưu riêng, chưa gắn vào bài')+
      (entry.media_kind==='image'?' · Bản xem R2: '+(entry.preview_ready?'đã có':'chưa đủ'):'');
    box.appendChild(line);
    const id=document.createElement('code');
    id.textContent=entry.asset_id;
    box.appendChild(id);
    return box;
  }
  async function refresh() {
    if(!client)return;
    const list=$('gdd-r2-vault-list');
    if(!list)return;
    const {data,error}=await client.from('gdd_r2_assets').select(
      'asset_id,record_kind,record_id,original_name,original_bytes,media_kind,preview_ready,download_ready,created_at'
    ).order('created_at',{ascending:false}).limit(24);
    if(error){note('Chưa đọc được danh mục R2: '+error.message);return}
    list.replaceChildren();
    if(!data?.length){const p=document.createElement('p');p.textContent='Chưa có tư liệu R2 trong danh mục quản trị.';list.appendChild(p);return}
    for(const entry of data)list.appendChild(makeRow(entry));
  }
  async function saveInVault(){
    if(busy||!client)return;
    const input=$('gdd-r2-vault-files'),button=$('gdd-r2-vault-upload');
    const files=Array.from(input?.files||[]);
    if(!files.length){note('Hãy chọn ảnh, PDF hoặc Word cần lưu riêng vào R2.');return}
    busy=true;button.disabled=true;input.disabled=true;
    const p=$('gdd-r2-vault-progress');
    if(p){p.hidden=false;p.value=0}
    const results=[];
    try{
      for(const [i,file] of files.entries()){
        note('Đang lưu tệp '+(i+1)+'/'+files.length+': '+labelOf(file));
        const result=await archive(file,client,{role:'vault',onProgress:status=>{
          if(status.phase==='original'&&p) p.value=Math.floor(100*status.bytes/status.total);
          if(status.phase==='optimizing')note('Đã giữ bản gốc '+labelOf(file)+'; đang tạo bản '+status.variant);
        }});
        results.push(labelOf(file)+' – bản gốc đã lưu (ID '+result.id+')'+
          (result.status==='original-and-optimized'?', ảnh xem/tải đã sẵn sàng':', bản xem/tải chưa đầy đủ'));
        if(p)p.value=Math.round((i+1)/files.length*100);
      }
      input.value='';
      note(results.join('\n')+'\nTệp vẫn riêng tư; chưa tự công bố trên website.');
      await refresh();
    }catch(error){
      note(results.join('\n')+(results.length?'\n':'')+'Lỗi: '+String(error?.message||error));
    }finally{busy=false;button.disabled=false;input.disabled=false}
  }
  function open(supabase){
    client=account(supabase);
    const panel=$('gdd-r2-vault-panel');
    if(panel)panel.hidden=false;
    if(!bound&&panel){
      bound=true;
      $('gdd-r2-vault-upload')?.addEventListener('click',saveInVault);
      $('gdd-r2-vault-refresh')?.addEventListener('click',refresh);
    }
    refresh().catch(error=>note('Không thể tải danh mục: '+String(error?.message||error)));
  }
  function close(){
    client=null;
    const panel=$('gdd-r2-vault-panel');
    if(panel)panel.hidden=true;
    const list=$('gdd-r2-vault-list');
    if(list)list.replaceChildren();
    const input=$('gdd-r2-vault-files');
    if(input)input.value='';
  }
  window.GDDR2 = Object.freeze({archive,link,refresh,open,close});
})();
