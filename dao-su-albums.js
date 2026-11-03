/* GIỮ ĐẠO GIỮA ĐỜI — Thư viện ảnh tư liệu nhiều ảnh (2026-11-03)
   Bổ sung độc lập: không đổi các bảng hay bộ mã hiện có. Yêu cầu chạy SQL migration.
   Chỉ tài khoản quản trị được tải lên và biên tập. Ảnh gốc không bị nén. */
(() => {
  'use strict';
  if (window.__gddAlbumsLoaded) return;
  window.__gddAlbumsLoaded = true;

  const cfg = window.SITE_CONFIG || {};
  const ALBUM_TABLE = 'archive_gallery_images';
  const ALLOWED_KINDS = new Set(['people','posts','media','videos','obituaries','documents']);
  const PREFIX_KIND = {
    'nhan-vat':'people', 'bai-viet':'posts', 'hinh-anh-tu-lieu':'media',
    'video-dao-su':'videos', 'ai-tin':'obituaries', 'tai-lieu-so-hoa':'documents'
  };
  const KIND_LABEL = {
    people:'Hồ sơ Chức sắc', posts:'Biên khảo', media:'Hình ảnh',
    videos:'Video Đạo Sử', obituaries:'Ai Tín', documents:'Tài liệu số hóa'
  };
  const FILE_EXT = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
  const MAX_FILES = 30;
  const MAX_SIZE = 6 * 1024 * 1024;
  let clientPromise = null;
  let editing = null;
  let editorSeq = 0, detailSeq = 0;

  const $ = (selector, root=document) => root.querySelector(selector);
  const escape = v => String(v ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = value => {
    if (typeof value !== 'string') return '';
    try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; }
    catch { return ''; }
  };
  async function getClient() {
    if (!cfg.supabaseUrl || !cfg.supabasePublishableKey) throw Error('Chưa kết nối Supabase.');
    if (!clientPromise) clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(({createClient})=>createClient(cfg.supabaseUrl,cfg.supabasePublishableKey));
    return clientPromise;
  }

  const style = document.createElement('style');
  style.id = 'gdd-albums-style';
  style.textContent = `
    .gdd-album { margin:30px 0 35px; padding-top:25px; border-top:1px solid #ddd9cb; }
    .gdd-album-head { display:flex;align-items:baseline;gap:12px;justify-content:space-between;margin:0 0 17px; }
    .gdd-album h3 { font:600 22px/1.5 'Noto Serif',Georgia,serif;color:#1b5047;margin:0; }
    .gdd-album-count { font-size:12px;color:#887954;white-space:nowrap; }
    .gdd-album-grid {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px; }
    .gdd-album-figure { margin:0;min-width:0; }
    #detail-content .gdd-album .gdd-album-tile.detail-cover {
      display:flex; align-items:center;justify-content:center;position:relative;
      width:100%;height:auto;min-height:0;aspect-ratio:4/5;margin:0;padding:9px;
      background:#e9e8df;border:1px solid #dcd9cd;border-radius:5px;overflow:hidden;cursor:zoom-in;
    }
    #detail-content .gdd-album .gdd-album-tile img {
      width:100%;height:100%;max-height:100%;object-fit:contain;object-position:center;
    }
    .gdd-album-figure figcaption {font:400 12px/1.7 'Be Vietnam Pro',sans-serif;color:#5b685f;margin:7px 2px 0;overflow-wrap:anywhere;}
    .gdd-album-page {display:inline-block;font-weight:700;color:#a17e44;margin-right:5px;}
    .gdd-album-open {font-size:11px;color:#20594e;text-decoration:underline;text-underline-offset:3px;}
    #gdd-admin-album-panel {padding:22px;margin:24px 0 30px;background:#f8faf5;border:1px solid #c9d5c7;border-radius:7px;}
    #gdd-admin-album-panel h3 {font:600 20px/1.45 'Noto Serif',Georgia,serif;margin:0 0 7px;color:#1b5047;}
    .gdd-album-note {font:400 12px/1.75 'Be Vietnam Pro',sans-serif;color:#66756a;margin:7px 0 14px;}
    .gdd-album-field {display:block;font:600 12px/1.55 'Be Vietnam Pro',sans-serif;color:#405347;margin-bottom:8px;}
    .gdd-album-field input {box-sizing:border-box;width:100%;padding:10px;border:1px solid #cbd6cd;background:#fff;border-radius:5px;margin-top:6px;font:inherit;}
    .gdd-album-commands {display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:12px 0;}
    .gdd-album-btn {border:1px solid #c0cfc5;border-radius:5px;background:#fff;color:#195047;font:600 12px/1.5 'Be Vietnam Pro',sans-serif;padding:9px 12px;cursor:pointer;min-height:38px;}
    .gdd-album-btn.primary {background:#1a5045;color:#fff;border-color:#1a5045;}
    .gdd-album-btn.danger {color:#95483c;border-color:#e3c6bb;}
    .gdd-album-btn:disabled {opacity:.55;cursor:wait;}
    .gdd-album-status {min-height:22px;font:500 12px/1.7 'Be Vietnam Pro',sans-serif;color:#1e5947;white-space:pre-wrap;overflow-wrap:anywhere;}
    .gdd-admin-photos {display:flex;flex-direction:column;gap:11px;margin-top:15px;}
    .gdd-admin-photo {display:grid;grid-template-columns:68px minmax(0,1fr);gap:12px;background:#fff;border:1px solid #e0e6dd;border-radius:6px;padding:10px;}
    .gdd-admin-photo img {width:68px;height:85px;object-fit:contain;background:#e8ece5;border-radius:4px;}
    .gdd-admin-photo .gdd-album-field {margin:0 0 8px;}
    .gdd-admin-photo .gdd-album-field input {margin-top:5px;}
    .gdd-admin-photo .gdd-album-commands {margin:0;gap:6px;}
    .gdd-album-empty {font:400 12px/1.75 'Be Vietnam Pro',sans-serif;color:#778279;margin:14px 0 0;}
    @media(max-width:530px){.gdd-album-grid{gap:10px;}.gdd-album h3{font-size:18px;}.gdd-album-figure figcaption{font-size:11px;}#gdd-admin-album-panel{padding:15px 12px;}.gdd-admin-photo{grid-template-columns:56px minmax(0,1fr);gap:8px;}.gdd-admin-photo img{width:56px;height:73px;}.gdd-album-btn{font-size:11px;padding:8px 9px;}}
  `;
  document.head.appendChild(style);

  /* Phần công khai: đọc ảnh chỉ khi bản ghi cha đã được công bố (RLS). */
  const details = $('#detail-content');
  let detailsHandle = '';
  function currentDetail() {
    const hash=location.hash.match(/^#([^/]+)\/(.+)$/);
    if (!hash) return null;
    const kind=PREFIX_KIND[hash[1]];
    if (!kind || !ALLOWED_KINDS.has(kind)) return null;
    let slug;
    try { slug=decodeURIComponent(hash[2]); } catch { return null; }
    return {kind,slug};
  }
  async function showPublicAlbum(target, kind, slug, ticket) {
    try {
      const supa=await getClient();
      const {data:parent,error:lookupError}=await supa.from(kind).select('id').eq('slug',slug).maybeSingle();
      if (lookupError) throw lookupError;
      if (!parent || ticket!==detailSeq || !target.isConnected) return;
      const {data, error}=await supa.from(ALBUM_TABLE)
        .select('id,image_url,caption,sort_order').eq('owner_kind',kind).eq('owner_id',parent.id)
        .order('sort_order',{ascending:true}).order('created_at',{ascending:true}).limit(200);
      if (error) throw error;
      if (!data?.length || ticket!==detailSeq || !target.isConnected) return;
      const rows=data.filter(p=>safeUrl(p.image_url));
      if (!rows.length) return;
      const header=document.createElement('div');header.className='gdd-album-head';
      const h=document.createElement('h3');h.textContent='Hình ảnh và văn kiện đính kèm';
      const count=document.createElement('span');count.className='gdd-album-count';count.textContent=rows.length+' ảnh';
      header.append(h,count);target.appendChild(header);
      const grid=document.createElement('div');grid.className='gdd-album-grid';
      rows.forEach((item,i)=>{
        const url=safeUrl(item.image_url);
        const figure=document.createElement('figure');figure.className='gdd-album-figure';
        const button=document.createElement('button');button.type='button';button.className='gdd-album-tile detail-cover';
        button.setAttribute('aria-label',`Xem ảnh tư liệu số ${i+1}`);
        const img=document.createElement('img');img.loading='lazy';img.src=url;
        img.alt=item.caption?.trim()||`Ảnh tư liệu số ${i+1}`;
        button.appendChild(img);
        // Trình xem ảnh gốc đã gắn sự kiện click vào .detail-cover img.
        button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();img.click();}});
        const caption=document.createElement('figcaption');
        const page=document.createElement('span');page.className='gdd-album-page';page.textContent=String(i+1).padStart(2,'0')+'.';
        caption.append(page,document.createTextNode(item.caption?.trim()||'Ảnh tư liệu'));
        const original=document.createElement('div');const open=document.createElement('a');open.href=url;open.target='_blank';open.rel='noopener noreferrer';open.className='gdd-album-open';open.textContent='Mở ảnh gốc ↗';original.appendChild(open);
        figure.append(button,caption,original);grid.appendChild(figure);
      });
      target.appendChild(grid);
    } catch (error) {
      // Trang chi tiết vẫn dùng được kể cả khi chưa chạy migration hoặc mất mạng.
      console.warn('[GDD albums] Không thể đọc album:',error);
    }
  }
  function handleDetailChange() {
    if (!details) return;
    const d=currentDetail();
    if (!d || !details.querySelector('.detail-body')) { detailsHandle='';detailSeq++;return; }
    const key=d.kind+'/'+d.slug;
    if (key===detailsHandle && details.querySelector('.gdd-album')) return;
    detailsHandle=key;
    const existing=details.querySelector('.gdd-album');existing?.remove();
    detailSeq++;
    const ticket=detailSeq;
    const target=document.createElement('section');target.className='gdd-album';target.setAttribute('aria-label','Thư viện ảnh tư liệu đính kèm');
    const anchor=details.querySelector('.detail-body') || details.querySelector('.detail-source');
    anchor.after(target);
    showPublicAlbum(target,d.kind,d.slug,ticket);
  }
  if(details) {
    // Chỉ quan sát phần tử trực tiếp để tránh vòng lặp khi tự chèn album.
    new MutationObserver(handleDetailChange).observe(details,{childList:true});
    window.addEventListener('hashchange',handleDetailChange);
  }

  /* Phần quản trị: lưu bài trước, vào SỬA để chọn nhiều ảnh. */
  const editor=$('#editor-form');
  const panel=document.createElement('section');panel.id='gdd-admin-album-panel';
  if (editor) editor.after(panel);
  const getEditorKind=()=>$('.editor-tabs button.is-selected')?.dataset.kind || '';
  function isEditing() {return ($('#editor-heading')?.textContent||'').trim()==='Sửa tư liệu';}
  function setStatus(message){const area=$('#gdd-album-status');if(area)area.textContent=message;}
  let adminRows=[];
  function renderPanel() {
    if (!editor) return;
    if (!isEditing() || !editing || getEditorKind()!==editing.kind) {
      panel.innerHTML=`<h3>Bộ ảnh tư liệu kèm theo</h3><p class="gdd-album-note">Muốn thêm nhiều ảnh: hãy <b>đăng bài trước</b>, sau đó chọn nút <b>Sửa</b> ở phần “Tư liệu đã đăng / bản nháp” để tải bộ ảnh vào đúng hồ sơ.</p>`;
      return;
    }
    panel.innerHTML=`
      <h3>Bộ ảnh tư liệu kèm theo</h3>
      <p class="gdd-album-note">Đang biên tập: <b>${escape(KIND_LABEL[editing.kind])}</b>. Chọn nhiều ảnh JPEG/PNG/WebP cùng lúc. Tối đa ${MAX_FILES} ảnh/lượt, mỗi ảnh không quá 6 MB; giữ nguyên chất lượng tệp. Ảnh sẽ hiển thị bên dưới nội dung bài theo thứ tự.</p>
      <label class="gdd-album-field">Chọn nhiều ảnh từ album iPhone / ứng dụng Tệp
        <input type="file" id="gdd-album-files" accept="image/jpeg,image/png,image/webp" multiple>
      </label>
      <div class="gdd-album-commands"><button class="gdd-album-btn primary" type="button" id="gdd-album-upload">Tải bộ ảnh vào bài</button></div>
      <div class="gdd-album-status" id="gdd-album-status" aria-live="polite"></div>
      <div id="gdd-album-admin-list"><p class="gdd-album-empty">Đang đọc các ảnh đã đính kèm…</p></div>
      <p class="gdd-album-note">Để đổi vị trí hoặc sửa chú thích, dùng các nút dưới từng ảnh. Gỡ ảnh khỏi bài không xóa tệp gốc trong Storage.</p>`;
    const current={...editing};
    const ticket=++editorSeq;
    $('#gdd-album-upload').addEventListener('click',()=>uploadSelected(current,ticket));
    const input=$('#gdd-album-files');
    input.addEventListener('change',()=>setStatus(input.files?.length?`Đã chọn ${input.files.length} ảnh. Nhấn “Tải bộ ảnh vào bài” để lưu.`:''));
    loadAdminRows(current,ticket);
  }
  async function loadAdminRows(owner,ticket) {
    try {
      const supa=await getClient();
      const {data,error}=await supa.from(ALBUM_TABLE).select('id,image_url,caption,sort_order')
        .eq('owner_kind',owner.kind).eq('owner_id',owner.id)
        .order('sort_order',{ascending:true}).order('created_at',{ascending:true}).limit(250);
      if(error)throw error;
      if(ticket!==editorSeq) return;
      adminRows=data||[];
      drawAdminRows(owner,ticket);
    } catch (error) {
      const target=$('#gdd-album-admin-list');
      if(ticket===editorSeq && target)target.textContent='Không tải được bộ ảnh: '+(error.message||error)+'. Hãy kiểm tra SQL đã chạy.';
    }
  }
  function drawAdminRows(owner,ticket) {
    const list=$('#gdd-album-admin-list');if(!list||ticket!==editorSeq)return;
    if(!adminRows.length){list.innerHTML='<p class="gdd-album-empty">Bài này chưa có ảnh đính kèm.</p>';return;}
    list.innerHTML='';
    const wrap=document.createElement('div');wrap.className='gdd-admin-photos';
    adminRows.forEach((row,i)=>{
      const part=document.createElement('div');part.className='gdd-admin-photo';
      const img=document.createElement('img');img.src=safeUrl(row.image_url);img.alt=row.caption||'Ảnh tư liệu';img.loading='lazy';
      const content=document.createElement('div');
      const label=document.createElement('label');label.className='gdd-album-field';label.textContent=`Ảnh số ${i+1} — Chú thích`;
      const input=document.createElement('input');input.type='text';input.maxLength=400;input.value=row.caption||'';input.placeholder='Ví dụ: Trang 01 — Thánh Lịnh số…';label.appendChild(input);
      const cmds=document.createElement('div');cmds.className='gdd-album-commands';
      const make=(caption,run,disabled=false,danger=false)=>{const b=document.createElement('button');b.type='button';b.className='gdd-album-btn'+(danger?' danger':'');b.textContent=caption;b.disabled=disabled;b.addEventListener('click',()=>run(b));cmds.appendChild(b);};
      make('Lưu chú thích',async b=>{b.disabled=true;try{const supa=await getClient();const {error}=await supa.from(ALBUM_TABLE).update({caption:input.value.trim()||null}).eq('id',row.id);if(error)throw error;setStatus('Đã lưu chú thích.');await loadAdminRows(owner,ticket);}catch(e){setStatus('Lỗi: '+e.message);b.disabled=false;}});
      make('↑',()=>shiftImage(i,-1,owner,ticket),i===0);
      make('↓',()=>shiftImage(i,1,owner,ticket),i===adminRows.length-1);
      make('Gỡ ảnh',async b=>{
        if(!confirm('Gỡ ảnh này khỏi bài viết? Tệp gốc trong Storage không bị xóa.'))return;
        b.disabled=true;
        try{const supa=await getClient();const {error}=await supa.from(ALBUM_TABLE).delete().eq('id',row.id);if(error)throw error;setStatus('Đã gỡ ảnh khỏi bài.');await loadAdminRows(owner,ticket);}catch(e){setStatus('Lỗi: '+e.message);b.disabled=false;}
      },false,true);
      content.append(label,cmds);part.append(img,content);wrap.appendChild(part);
    });list.appendChild(wrap);
  }
  async function shiftImage(index,delta,owner,ticket) {
    const target=index+delta;
    if(target<0||target>=adminRows.length)return;
    const a=adminRows[index],b=adminRows[target];
    // Giá trị âm tạm để tránh trùng số thứ tự khi đổi chỗ.
    const temp=-Math.abs(Date.now());
    try{
      const supa=await getClient();
      for(const [id,order] of [[a.id,temp],[b.id,a.sort_order],[a.id,b.sort_order]]){
        const {error}=await supa.from(ALBUM_TABLE).update({sort_order:order}).eq('id',id);
        if(error)throw error;
      }
      setStatus('Đã đổi thứ tự ảnh.');await loadAdminRows(owner,ticket);
    }catch(e){setStatus('Không đổi được thứ tự: '+e.message);await loadAdminRows(owner,ticket);}
  }
  async function uploadSelected(owner,ticket) {
    const input=$('#gdd-album-files'),btn=$('#gdd-album-upload');
    const files=[...(input?.files||[])];
    if(!files.length){setStatus('Hãy chọn ít nhất một ảnh.');return;}
    if(files.length>MAX_FILES){setStatus(`Một lần chỉ chọn tối đa ${MAX_FILES} ảnh.`);return;}
    for(const file of files){
      if(!FILE_EXT[file.type]){setStatus(`Định dạng không hỗ trợ: ${file.name}. Chỉ nhận JPEG/PNG/WebP.`);return;}
      if(!file.size || file.size>MAX_SIZE){setStatus(`Ảnh ${file.name} phải có dung lượng từ 1 byte đến 6 MB.`);return;}
    }
    btn.disabled=true;input.disabled=true;
    let done=0;
    try{
      const supa=await getClient();
      const {data:{user},error:authError}=await supa.auth.getUser();
      if(authError||!user)throw Error('Phiên đăng nhập đã hết hạn; hãy đăng nhập quản trị lại.');
      const {data:maxRows,error:maxError}=await supa.from(ALBUM_TABLE).select('sort_order')
        .eq('owner_kind',owner.kind).eq('owner_id',owner.id)
        .order('sort_order',{ascending:false}).limit(1);
      if(maxError)throw maxError;
      let position=Math.max(0,maxRows?.[0]?.sort_order??0);
      for (const file of files) {
        if(ticket!==editorSeq)throw Error('Bạn đã chuyển sang bài khác; quá trình tải lên đã dừng để tránh gắn nhầm ảnh.');
        setStatus(`Đang tải ảnh ${done+1}/${files.length}: ${file.name}. Đừng đóng trang.`);
        const suffix=(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));
        const path=`${owner.kind}/${Date.now()}-${suffix}.${FILE_EXT[file.type]}`;
        const {error:upError}=await supa.storage.from('dao-su-images').upload(path,file,{contentType:file.type,cacheControl:'3600',upsert:false});
        if(upError)throw upError;
        const publicUrl=supa.storage.from('dao-su-images').getPublicUrl(path).data.publicUrl;
        const next=++position;
        const {error:dbError}=await supa.from(ALBUM_TABLE).insert({
          owner_kind:owner.kind,owner_id:owner.id,image_url:publicUrl,
          caption:owner.kind==='documents'?`Trang ${String(next).padStart(2,'0')}`:`Ảnh tư liệu ${String(next).padStart(2,'0')}`,
          sort_order:next
        });
        if(dbError)throw dbError;
        done++;
      }
      setStatus(`Đã tải và lưu thành công ${done} ảnh. Ảnh gốc được giữ nguyên.`);
      input.value='';
      await loadAdminRows(owner,ticket);
    }catch(e){setStatus(`Đã lưu ${done}/${files.length} ảnh. Lỗi: ${e.message||e}`);await loadAdminRows(owner,ticket);}
    finally {if(ticket===editorSeq){btn.disabled=false;input.disabled=false;}}
  }

  if(editor){
    // Ghi nhận ID ngay tại sự kiện click Sửa, trước khi app.js dựng form.
    document.addEventListener('click',e=>{
      const el=e.target instanceof Element?e.target:null;
      if(!el)return;
      const edit=el.closest('[data-list-edit],[data-edit-kind]');
      if(edit) {
        editing={kind:edit.dataset.listEdit||edit.dataset.editKind,id:edit.dataset.id||edit.dataset.editId};
        // app.js đổi form đồng bộ tại phần bubble; observer bên dưới sẽ cập nhật.
      } else if(el.closest('#editor-new,.editor-tabs button')) {
        editing=null;
      }
    },true);
    new MutationObserver(renderPanel).observe(editor,{childList:true});
    renderPanel();
  }
})();
