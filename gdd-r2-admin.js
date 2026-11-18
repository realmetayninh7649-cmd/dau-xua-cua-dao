/* GDDĐ v2.0.0-DK01.4.1 - Trang quản trị: bảo tồn bản gốc trước khi công bố ảnh nhẹ.
   KHÔNG dùng secret/service_role và không cấp đường dẫn tải bản nguyên mẫu. */
(() => {
  'use strict';
  const apiModule = './workers/gdd-r2-gateway/client/uploader.mjs?v=20261118-batch-01';
  const documentModule = './workers/gdd-r2-gateway/client/document-view.mjs?v=20261117-dk014';
  const API = 'https://gdd-r2-gateway.realmetayninh7649.workers.dev';
  const VIEW_PAGE = './r2-xem.html?asset=';
  const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  const kinds = new Set(['people','posts','media','videos','obituaries','documents']);
  const roles = new Set(['primary','album','vault']);
  const $ = id => document.getElementById(id);
  const saved = new WeakMap();
  const vaultFinished = new WeakSet(); // Không tải lại tệp đã lưu khi thử lại cùng lượt chọn.
  let modulePromise, client, bound=false, busy=false;
  const rendering=new Set();

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
  async function archive(file,supabase,{recordKind=null,recordId=null,role='vault',onProgress,skipDerivatives=false}={}) {
    if(!file||!file.name||!Number.isSafeInteger(file.size)||file.size<=0)throw Error('Vui lòng chọn tệp gốc hợp lệ.');
    account(supabase);
    let task=saved.get(file);
    if(!task){
      task=(async()=>{
        const {uploadPreservedAsset}=await getUploader();
        return uploadPreservedAsset(file,{supabase,onProgress,skipDerivatives});
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

  async function requestR2(method,path,body=null,mime=null) {
    if(!client)throw Error('Bạn phải đăng nhập Quản trị viên.');
    const {data,error}=await client.auth.getSession();
    if(error||!data?.session?.access_token)throw Error('Phiên đăng nhập hết hạn.');
    const headers={Authorization:'Bearer '+data.session.access_token};
    if(mime)headers['Content-Type']=mime;
    const response=await fetch(API+path,{method,headers,body,cache:'no-store',mode:'cors',credentials:'omit'});
    const result=await response.json().catch(()=>({error:'Máy chủ không trả JSON'}));
    if(!response.ok)throw Error((result?.error||'R2 từ chối')+' (HTTP '+response.status+')');
    return result;
  }
  async function getRecord(id) {
    if(!UUID.test(id))throw Error('Mã tư liệu không hợp lệ');
    const {data,error}=await client.from('gdd_r2_assets')
      .select('asset_id,record_kind,record_id,role,original_name,original_bytes,media_kind,view_page_count,view_source,public_view,allow_download')
      .eq('asset_id',id).maybeSingle();
    if(error||!data)throw Error('Không tìm thấy tư liệu trong danh mục R2.');
    return data;
  }
  async function prepareDocument(id,file,onProgress) {
    if(rendering.has(id))throw Error('Tư liệu đang được xử lý trang.');
    const record=await getRecord(id);
    if(record.media_kind!=='document'||!file||file.name!==record.original_name||file.size!==record.original_bytes)
      throw Error('Phải chọn lại ĐÚNG tệp PDF/DOCX đã lưu nguyên mẫu (cùng tên và dung lượng).');
    if(record.public_view)throw Error('Hãy Ẩn bản xem trước khi tạo lại trang để tránh thay nội dung đang được độc giả xem.');
    rendering.add(id);
    try{
      const remote=await requestR2('GET','/v1/assets/'+id);
      if(remote.originalName!==file.name||remote.originalBytes!==file.size||remote.kind!=='document')
        throw Error('R2 không xác nhận đúng tệp nguyên mẫu.');
      const {makeDocumentPages}=await import(documentModule);
      const output=await makeDocumentPages(file,async(page,total,blob)=>{
        await requestR2('PUT','/v1/assets/'+id+'/page/'+page,blob,'image/jpeg');
        onProgress?.('Đã tạo '+page+'/'+total+' trang. Giữ trình duyệt mở.');
      });
      const {error}=await client.from('gdd_r2_assets')
        .update({view_page_count:output.pageCount,view_source:output.viewSource,
          public_view:false,allow_download:false,view_updated_at:new Date().toISOString()})
        .eq('asset_id',id);
      if(error)throw Error('Các trang đã cất ở R2 nhưng chỉ mục chưa cập nhật: '+error.message);
      return output;
    }finally{rendering.delete(id)}
  }
  async function setPublication(id,publish,{allowDownload=false,alsoPublishRecord=false,attachToAlbum=false}={}){
    const record=await getRecord(id);
    if(publish&&record.media_kind==='document'&&(!record.view_page_count||!record.view_source))
      throw Error('Tạo các trang xem trước khi công bố PDF/Word.');
    const payload={publish:!!publish};
    if(publish&&record.media_kind==='document'){
      payload.pageCount=record.view_page_count;
      payload.viewSource=record.view_source;
    }
    if(publish&&record.media_kind==='image')payload.allowDownload=allowDownload===true;
    const result=await requestR2('POST','/v1/assets/'+id+'/publication',
      JSON.stringify(payload),'application/json');
    const {error}=await client.from('gdd_r2_assets')
      .update({public_view:!!publish,allow_download:!!result.allowDownload,view_updated_at:new Date().toISOString()})
      .eq('asset_id',id);
    if(error){
      if(publish)await requestR2('POST','/v1/assets/'+id+'/publication',
        JSON.stringify({publish:false}),'application/json').catch(()=>{});
      throw Error('Không ghi được trạng thái công bố vào danh mục: '+error.message);
    }
    const url=location.origin+location.pathname.replace(/[^/]*$/,'')+'r2-xem.html?asset='+encodeURIComponent(id);
    let note='';
    // Unpublishing a R2 reader must also hide its linked document card.
    // Otherwise the public website would retain a broken link.
    if(!publish&&record.record_kind==='documents'&&record.role==='primary'&&record.record_id){
      const {data:documentRow,error:readError}=await client.from('documents')
        .select('id,file_url,published').eq('id',record.record_id).maybeSingle();
      if(readError)throw Error('R2 đã ẩn, nhưng chưa kiểm tra được bài Tài liệu số hóa: '+readError.message);
      if(documentRow?.published&&documentRow.file_url===url){
        const {error:hideError}=await client.from('documents').update({published:false})
          .eq('id',record.record_id);
        if(hideError)throw Error('R2 đã ẩn, nhưng chưa ẩn được bài trên danh mục: '+hideError.message);
        note='Đã ẩn cả bản xem R2 và bài Tài liệu số hóa có liên kết.';
      }
    }
    if(publish&&alsoPublishRecord&&record.record_kind==='documents'&&record.role==='primary'&&record.record_id){
      const {error:docError}=await client.from('documents')
        .update({file_url:url,published:true}).eq('id',record.record_id);
      if(docError)note='Bản xem đã công bố nhưng bài tài liệu vẫn là nháp: '+docError.message;
      else note='Bài Tài liệu số hóa cũng đã được công bố.';
    }
    if(publish&&attachToAlbum&&record.record_id&&record.role==='album'&&
      ['media','documents'].includes(record.record_kind)){
      try{
        const {data:exists,error:checkError}=await client.from('archive_gallery_images')
          .select('id').eq('owner_kind',record.record_kind).eq('owner_id',record.record_id)
          .eq('image_url',url).maybeSingle();
        if(checkError)throw checkError;
        if(!exists){
          const {data:last,error:orderError}=await client.from('archive_gallery_images')
            .select('sort_order').eq('owner_kind',record.record_kind).eq('owner_id',record.record_id)
            .order('sort_order',{ascending:false}).limit(1);
          if(orderError)throw orderError;
          const {error:addError}=await client.from('archive_gallery_images').insert({
            owner_kind:record.record_kind,owner_id:record.record_id,image_url:url,
            caption:record.original_name,sort_order:Number(last?.[0]?.sort_order||0)+1
          });
          if(addError)throw addError;
        }
        note='Đã gắn đường dẫn bản xem vào bộ tư liệu đính kèm.';
      }catch(err){note='Bản xem đã công bố nhưng chưa gắn vào bộ ảnh: '+(err?.message||err)}
    }
    return {...result,url,notice:note};
  }

  function libraryViewerUrl(id){
    if(!UUID.test(id))throw Error('Mã tư liệu R2 không hợp lệ.');
    return 'https://realmetayninh7649-cmd.github.io/dau-xua-cua-dao/r2-xem.html?asset='+id;
  }
  // Library publishing is admin-only and opt-in; never infers unverified provenance.
  async function attachPublishedDocument(id,{title,summary='',date='',sources=''}={}){
    const record=await getRecord(id);
    if(record.media_kind!=='document'||record.public_view!==true)
      throw Error('Chỉ có thể lập hồ sơ từ bản xem tài liệu ĐÃ công bố.');
    if(record.record_id&&record.record_kind==='documents')
      throw Error('Tài liệu này đã được liên kết với hồ sơ Tài liệu số hóa.');
    if(record.record_id||record.role!=='vault')
      throw Error('Tư liệu đang thuộc một bài khác, không thể tạo hồ sơ trùng.');
    const safeTitle=String(title||'').trim().slice(0,200);
    if(safeTitle.length<8)throw Error('Hãy nhập nhan đề tài liệu đầy đủ (ít nhất 8 ký tự).');
    const view=await requestR2('GET','/v1/public/'+id);
    if(view.id!==id||view.kind!=='document'||!Number.isInteger(view.pageCount)||view.pageCount<1)
      throw Error('R2 chưa xác nhận bản xem hợp lệ; không thể đăng bài.');
    const url=libraryViewerUrl(id);
    // Check before insert, so retries after a partial failure never create duplicate entries.
    const {data:previous,error:checkError}=await client.from('documents')
      .select('id,archive_code').eq('file_url',url).limit(1);
    if(checkError)throw Error('Chưa kiểm tra được hồ sơ có sẵn: '+checkError.message);
    let doc=previous?.[0]||null;
    if(!doc){
      const suffix=id.slice(0,8)+'-'+Date.now().toString(36);
      const slug='r2-'+safeTitle.normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/đ/gi,'d').toLowerCase().replace(/[^a-z0-9]+/g,'-')
        .replace(/^-+|-+$/g,'').slice(0,60)+'-'+suffix;
      const defaultSummary=view.viewSource==='docx_text'
        ?'Bản đọc chữ DOCX, không giữ bố cục tài liệu gốc.'
        :'Bản đọc PDF theo từng trang; bản nguyên mẫu lưu riêng trong kho R2.';
      const fields={
        title:safeTitle,slug,summary:String(summary||'').trim().slice(0,900)||defaultSummary,
        document_date:String(date||'').trim().slice(0,140)||null,
        sources:String(sources||'').trim().slice(0,2000)||null,
        file_url:url,published:true
      };
      const {data:created,error:createError}=await client.from('documents').insert(fields)
        .select('id,archive_code').single();
      if(createError||!created?.id)throw Error('Không tạo được hồ sơ Tài liệu số hóa: '+(createError?.message||'không có ID'));
      doc=created;
    }
    const {data:linked,error:linkError}=await client.from('gdd_r2_assets')
      .update({record_kind:'documents',record_id:doc.id,role:'primary'})
      .eq('asset_id',id).is('record_id',null).select('asset_id').maybeSingle();
    if(linkError||!linked)throw Error('Hồ sơ '+(doc.archive_code||doc.id)+
      ' đã được tạo nhưng chưa gắn xong chỉ mục R2. KHÔNG đăng lại; hãy báo quản trị để kiểm tra: '+
      (linkError?.message||'thiếu bản ghi được phép cập nhật'));
    window.dispatchEvent?.(new CustomEvent('gdd-r2-document-added',{detail:{id:doc.id,assetId:id}}));
    return {id:doc.id,archiveCode:doc.archive_code,url};
  }

  function controlButton(text,click,css=''){
    const button=document.createElement('button');
    button.type='button';button.textContent=text;button.className=css;
    button.addEventListener('click',click);
    return button;
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
    const details=document.createElement('details');details.className='gdd-r2-view-actions';
    const summary=document.createElement('summary');
    summary.textContent='Bản xem cho độc giả · '+(entry.public_view?'Đã công bố':'Đang riêng tư');
    details.appendChild(summary);
    const statusLine=document.createElement('p');statusLine.className='gdd-r2-item-status';
    statusLine.textContent=entry.media_kind==='document'
      ?'Tài liệu: '+(entry.view_page_count||0)+' trang xem. Bản gốc không có URL công khai.'
      :'Ảnh xem nhẹ lưu riêng R2; chỉ công bố khi bạn xác nhận.';
    details.appendChild(statusLine);
    const setStatus=message=>{statusLine.textContent=message;note(message)};
    let filePicker=null;
    if(entry.media_kind==='document'){
      const label=document.createElement('label');
      label.textContent='Chọn lại đúng PDF/DOCX để tạo ảnh từng trang:';
      filePicker=document.createElement('input');filePicker.type='file';
      filePicker.accept='.pdf,.docx';
      label.appendChild(filePicker);details.appendChild(label);
      details.appendChild(controlButton('Tạo bản đọc (chưa công khai)',async event=>{
        const button=event.currentTarget;
        if(!filePicker.files?.[0])return setStatus('Hãy chọn lại tệp PDF/DOCX gốc.');
        button.disabled=true;
        try{
          const output=await prepareDocument(entry.asset_id,filePicker.files[0],setStatus);
          setStatus('Đã tạo '+output.pageCount+' trang '+(output.viewSource==='pdf'
            ?'PDF':'đọc chữ DOCX')+'. Chưa công bố. Hãy rà soát trước khi xuất bản.');
          await refresh();
        }catch(error){setStatus('Không tạo được bản đọc: '+(error?.message||error))}
        finally{button.disabled=false}
      }));
    }
    // Normal gallery photos already have an optimized public Supabase copy.
    // Their extra R2 derivatives are generated only if the administrator opts in.
    if(entry.media_kind==='image'&&(!entry.preview_ready||!entry.download_ready)){
      const label=document.createElement('label');
      label.textContent='Chỉ khi cần công bố ảnh trực tiếp từ R2: chọn lại đúng tệp ảnh gốc để tạo bản xem R2.';
      const sourcePicker=document.createElement('input');
      sourcePicker.type='file';
      sourcePicker.accept='.jpg,.jpeg,.png,.webp,.gif,.tif,.tiff,.heic,.heif,.avif';
      label.appendChild(sourcePicker);
      details.appendChild(label);
      details.appendChild(controlButton('Tạo bản xem R2 khi cần',async event=>{
        const button=event.currentTarget;
        if(!sourcePicker.files?.[0])return setStatus('Hãy chọn lại đúng ảnh nguyên mẫu để tạo bản xem R2.');
        button.disabled=true;
        try{
          const {finishOptimizingExisting}=await getUploader();
          const outcome=await finishOptimizingExisting(sourcePicker.files[0],entry.asset_id,{
            supabase:client,
            onProgress:info=>{
              if(info.phase==='optimizing')setStatus('Đang tạo bản '+info.variant+' từ đúng ảnh gốc đã chọn…');
              if(info.phase==='optimized-error')setStatus('Có bản xem cần kiểm tra: '+info.message);
            }
          });
          const {error}=await client.from('gdd_r2_assets').update({
            preview_ready:outcome.previewReady,download_ready:outcome.downloadReady
          }).eq('asset_id',entry.asset_id);
          if(error)throw Error('Bản xem R2 đã lưu nhưng chưa cập nhật danh mục: '+error.message);
          setStatus(outcome.previewReady&&outcome.downloadReady
            ?'Đã tạo đủ hai bản R2. Chỉ công bố khi đã kiểm tra và xác nhận.'
            :'Tệp nguyên mẫu vẫn an toàn. Bản phụ chưa đầy đủ: '+(outcome.optimizationWarnings||[]).join('; '));
          await refresh();
        }catch(error){setStatus('Chưa tạo đủ bản xem R2: '+(error?.message||error))}
        finally{button.disabled=false}
      }));
    }
    const allow=document.createElement('label');allow.className='gdd-r2-allow';
    const checkbox=document.createElement('input');checkbox.type='checkbox';
    checkbox.checked=!!entry.allow_download;
    allow.appendChild(checkbox);
    allow.appendChild(document.createTextNode(' Cho tải bản ảnh JPEG tối ưu (không phải ảnh gốc)'));
    if(entry.media_kind==='image')details.appendChild(allow);
    const publishRecord=document.createElement('label');publishRecord.className='gdd-r2-allow';
    const publishCheckbox=document.createElement('input');publishCheckbox.type='checkbox';
    publishRecord.appendChild(publishCheckbox);
    publishRecord.appendChild(document.createTextNode(' Đồng thời công bố bài Tài liệu số hóa đang ở bản nháp'));
    if(entry.record_kind==='documents'&&entry.record_id&&entry.role==='primary')details.appendChild(publishRecord);
    const attachAlbum=document.createElement('label');attachAlbum.className='gdd-r2-allow';
    const albumCheck=document.createElement('input');albumCheck.type='checkbox';
    attachAlbum.appendChild(albumCheck);
    attachAlbum.appendChild(document.createTextNode(' Gắn đường dẫn bản xem vào bài có bộ tư liệu này'));
    if(entry.role==='album'&&entry.record_id&&['media','documents'].includes(entry.record_kind))details.appendChild(attachAlbum);
    details.appendChild(controlButton('Công bố bản xem',async event=>{
      const button=event.currentTarget;button.disabled=true;
      try{
        const outcome=await setPublication(entry.asset_id,true,{
          allowDownload:entry.media_kind==='image'&&checkbox.checked,
          alsoPublishRecord:publishCheckbox.checked,attachToAlbum:albumCheck.checked
        });
        setStatus('Đã CÔNG BỐ bản xem: '+outcome.url+(outcome.notice?'\n'+outcome.notice:''));
        await refresh();
      }catch(error){setStatus('Chưa thể công bố: '+(error?.message||error))}
      finally{button.disabled=false}
    }));
    details.appendChild(controlButton('Ẩn bản xem',async event=>{
      const button=event.currentTarget;button.disabled=true;
      try{
        await setPublication(entry.asset_id,false);
        setStatus('Đã ẨN bản xem từ R2. Tệp gốc và bản xem vẫn được giữ.');
        await refresh();
      }catch(error){setStatus('Chưa ẩn được: '+(error?.message||error))}
      finally{button.disabled=false}
    },'gdd-r2-secondary'));
    if(entry.media_kind==='document'&&entry.public_view===true&&
       !entry.record_id&&entry.role==='vault'){
      const form=document.createElement('details');
      form.className='gdd-r2-library-form';
      const heading=document.createElement('summary');
      heading.textContent='Đưa bản xem này vào mục Tài liệu số hóa';
      form.appendChild(heading);
      const field=(caption,value='',isLong=false)=>{
        const label=document.createElement('label');
        label.textContent=caption;
        const input=document.createElement(isLong?'textarea':'input');
        if(!isLong)input.type='text';
        input.value=value;input.maxLength=isLong?2000:200;
        label.appendChild(input);form.appendChild(label);return input;
      };
      const candidate=String(entry.original_name||'Tư liệu').replace(/\.(pdf|docx)$/i,'')
        .replace(/^[0-9]+[-_. ]+/,'').replace(/[-_]+/g,' ').trim();
      const titleInput=field('Nhan đề (kiểm tra lại theo tài liệu gốc)',candidate);
      const dateInput=field('Ngày hoặc năm văn kiện (không tự suy đoán)','');
      const summaryInput=field('Lời giới thiệu ngắn','',true);
      const sourcesInput=field('Nguồn tư liệu / xuất xứ (nếu đã xác minh)','',true);
      form.appendChild(controlButton('Đăng vào Tài liệu số hóa',async event=>{
        const button=event.currentTarget;button.disabled=true;
        try{
          const outcome=await attachPublishedDocument(entry.asset_id,{
            title:titleInput.value,date:dateInput.value,
            summary:summaryInput.value,sources:sourcesInput.value
          });
          setStatus('Đã tạo hồ sơ '+(outcome.archiveCode||outcome.id)+
            ' trong mục Tài liệu số hóa. Độc giả chỉ xem bản đã duyệt: '+outcome.url);
          await refresh();
        }catch(error){setStatus('Chưa liên kết được: '+(error?.message||error))}
        finally{button.disabled=false}
      }));
      details.appendChild(form);
    }
    if(entry.public_view){
      const link=document.createElement('a');link.className='gdd-r2-reader-link';
      link.href=VIEW_PAGE+encodeURIComponent(entry.asset_id);
      link.target='_blank';link.rel='noopener noreferrer';
      link.textContent='Mở bản xem như độc giả';
      details.appendChild(link);
    }
    box.appendChild(details);
    return box;
  }
  async function refresh() {
    if(!client)return;
    const list=$('gdd-r2-vault-list');
    if(!list)return;
    const {data,error}=await client.from('gdd_r2_assets').select(
      'asset_id,record_kind,record_id,role,original_name,original_bytes,media_kind,preview_ready,download_ready,view_page_count,view_source,public_view,allow_download,created_at'
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
    const results=new Array(files.length);
    const uploadedBytes=files.map((file)=>vaultFinished.has(file)?file.size:0);
    const totalBytes=files.reduce((sum,file)=>sum+file.size,0);
    const updateProgress=()=>{
      if(p)p.value=Math.min(100,Math.round(uploadedBytes.reduce((a,b)=>a+b,0)/totalBytes*100));
    };
    const errors=[];
    let cursor=0,done=0;
    try{
      // Giới hạn 2/3 tệp để giảm thời gian chờ nhưng không làm đầy RAM iPhone.
      const mobile=window.matchMedia?.('(max-width: 900px)').matches;
      const limit=Math.min(mobile?2:3,files.length);
      const worker=async()=>{
        while(cursor<files.length){
          const i=cursor++,file=files[i];
          if(vaultFinished.has(file)){
            done++;
            results[i]=labelOf(file)+' – đã lưu trong lượt trước.';
            updateProgress();
            continue;
          }
          try{
            note('Đang cất R2: '+(done)+'/'+files.length+' tệp hoàn tất; '+labelOf(file));
            const result=await archive(file,client,{role:'vault',onProgress:status=>{
              if(status.phase==='original'||status.phase==='original-preserved'){
                uploadedBytes[i]=Math.max(uploadedBytes[i],Math.min(file.size,status.bytes||0));
                updateProgress();
              }
              if(status.phase==='optimizing'){
                note('Đã giữ bản gốc '+labelOf(file)+'; đang tạo bản '+status.variant);
              }
            }});
            vaultFinished.add(file);
            uploadedBytes[i]=file.size;
            done++;
            results[i]=labelOf(file)+' – bản gốc đã lưu (ID '+result.id+')'+
              (result.status==='original-and-optimized'?', ảnh xem/tải đã sẵn sàng':', bản xem/tải chưa đầy đủ');
            updateProgress();
          }catch(error){
            errors.push(labelOf(file)+': '+String(error?.message||error));
          }
        }
      };
      await Promise.all(Array.from({length:limit},()=>worker()));
      if(!errors.length)input.value='';
      note('Đã lưu '+done+'/'+files.length+' tệp lên R2. '
        +'Tệp vẫn riêng tư; không tự công bố.'
        +(errors.length?' Còn '+errors.length+' tệp lỗi, giữ danh sách để thử lại:\n'+errors.join('\n')
          :'\n'+results.filter(Boolean).join('\n')));
      await refresh();
    }catch(error){
      note('Đã lưu '+done+'/'+files.length+' tệp. Lỗi: '+String(error?.message||error));
    }finally{busy=false;button.disabled=false;input.disabled=false}
  }
  async function auditLegacyPdf(){
    if(!client)return;
    const out=$('gdd-r2-legacy-results');
    if(!out)return;
    out.textContent='Đang kiểm kê các PDF đang có liên kết công khai cũ…';
    try{
      const {data,error}=await client.from('archive_gallery_images')
        .select('id,owner_kind,owner_id,caption,image_url')
        .ilike('image_url','%.pdf%').order('owner_kind').limit(500);
      if(error)throw Error(error.message);
      out.replaceChildren();
      const intro=document.createElement('p');
      intro.textContent='Có '+(data?.length||0)+' PDF cũ đang mở trực tiếp từ Supabase. Đường đọc đã thống nhất; bản gốc chỉ thật sự riêng tư khi nhập vào R2, đối chiếu đủ trang và ngừng đường public cũ.';
      out.appendChild(intro);
      for(const row of data||[]){
        const p=document.createElement('p');
        p.className='gdd-r2-item';
        const label=document.createElement('strong');
        label.textContent=(row.owner_kind||'')+' · '+(row.caption||'Tư liệu PDF');
        const link=document.createElement('a');
        link.href=window.GDDDocumentReader?.readerUrl(row.image_url)||row.image_url;
        link.rel='noopener noreferrer';link.target='_blank';
        link.textContent='Đọc trong trình xem chung';
        const meta=document.createElement('small');
        meta.textContent='Mã ảnh đính kèm: '+row.id;
        p.append(label,meta,link);out.appendChild(p);
      }
    }catch(error){out.textContent='Chưa kiểm kê được PDF: '+(error?.message||error)}
  }
  function open(supabase){
    client=account(supabase);
    const panel=$('gdd-r2-vault-panel');
    if(panel)panel.hidden=false;
    if(!bound&&panel){
      bound=true;
      $('gdd-r2-vault-upload')?.addEventListener('click',saveInVault);
      $('gdd-r2-vault-refresh')?.addEventListener('click',refresh);
      $('gdd-r2-audit-legacy')?.addEventListener('click',auditLegacyPdf);
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
  window.GDDR2 = Object.freeze({archive,link,refresh,open,close,prepareDocument,setPublication,attachPublishedDocument,auditLegacyPdf});
})();
