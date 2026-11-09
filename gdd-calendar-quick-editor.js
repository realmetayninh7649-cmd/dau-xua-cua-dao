(function GDDCalendarQuickAdd(){
 'use strict';
 if(window.__gddCalendarQuickAdd2026)return;
 window.__gddCalendarQuickAdd2026=true;
 const cfg=window.SITE_CONFIG||{};
 const $=(selector,root=document)=>root.querySelector(selector);
 const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const safeURL=value=>{try{const u=new URL(String(value||''),location.href);return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
 const pad=n=>String(n).padStart(2,'0');
 const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().replace(/\s+/g,' ').trim();
 const TABLE='gdd_calendar_memorials';
 const style=document.createElement('style');
 style.id='gdd-calendar-quick-editor-styles';
 style.textContent=`
 .gdd-cal-quick-toolbar{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:10px 0 5px}
 .gdd-cal-quick-toolbar button{min-height:35px;padding:8px 12px;border:1px solid #c5aa79;border-radius:6px;background:#f9f6e9;color:#285647;cursor:pointer;font:700 11px/1.4 'Be Vietnam Pro',Arial,sans-serif}
 .gdd-cal-quick-toolbar button:hover{background:#eee6d4;border-color:#98763d}
 .gdd-cal-quick-toolbar small{color:#788173;font:400 10px/1.5 'Be Vietnam Pro',Arial,sans-serif}
 #gdd-cal-quick-panel{border:1px solid #d2c3a1;border-radius:9px;padding:13px;margin:8px 0 12px;background:linear-gradient(135deg,#fffcf2,#f6f3e8);box-shadow:0 4px 13px rgba(38,72,51,.07)}
 #gdd-cal-quick-panel[hidden],#gdd-cal-quick-login[hidden],#gdd-cal-quick-form[hidden],#gdd-cal-quick-lunar[hidden],#gdd-cal-quick-solar[hidden]{display:none!important}
 #gdd-cal-quick-panel .gdd-cal-quick-heading{display:flex;justify-content:space-between;gap:8px;align-items:center;margin:0 0 9px}
 #gdd-cal-quick-panel .gdd-cal-quick-heading strong{font:700 14px/1.5 'Noto Serif',Georgia,serif;color:#245443}
 #gdd-cal-quick-panel .gdd-cal-quick-close{border:1px solid #d5cbb7;background:#fffdf7;border-radius:5px;min-width:30px;min-height:30px;color:#35594a;cursor:pointer}
 #gdd-cal-quick-panel form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 #gdd-cal-quick-panel label{display:flex;flex-direction:column;gap:4px;font:600 11px/1.5 'Be Vietnam Pro',Arial,sans-serif;color:#405b4b;min-width:0}
 #gdd-cal-quick-panel label.gdd-cal-quick-wide{grid-column:1/-1}
 #gdd-cal-quick-panel :is(input,select,textarea){width:100%;min-width:0;padding:9px 10px;border:1px solid #cec8b8;border-radius:5px;background:#fffefa;color:#264e40;font:400 12px/1.5 'Be Vietnam Pro',Arial,sans-serif}
 #gdd-cal-quick-panel textarea{resize:vertical;min-height:60px}
 #gdd-cal-quick-panel .gdd-cal-quick-check{display:flex;flex-direction:row;align-items:center;gap:7px}
 #gdd-cal-quick-panel .gdd-cal-quick-check input{width:auto;min-height:auto}
 #gdd-cal-quick-panel .gdd-cal-quick-date{background:#f3eddd;border-radius:6px;padding:10px;font:600 11px/1.6 'Be Vietnam Pro',Arial,sans-serif;color:#52664f;grid-column:1/-1}
 #gdd-cal-quick-panel .gdd-cal-quick-group{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
 #gdd-cal-quick-panel .gdd-cal-quick-advanced{grid-column:1/-1;border:1px solid #ddd2b9;border-radius:6px;background:rgba(255,255,255,.45);padding:9px}
 #gdd-cal-quick-panel .gdd-cal-quick-advanced summary{cursor:pointer;font:700 11px/1.5 'Be Vietnam Pro',Arial,sans-serif;color:#275b4a}
 #gdd-cal-quick-panel .gdd-cal-quick-advanced-fields{display:grid;grid-template-columns:1fr;gap:9px;margin-top:10px}
 #gdd-cal-quick-panel .gdd-cal-quick-group label.gdd-cal-quick-check{grid-column:1/-1}
 #gdd-cal-quick-panel .gdd-cal-quick-actions{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
 #gdd-cal-quick-panel .gdd-cal-quick-actions button{min-height:36px;border-radius:6px;padding:8px 13px;cursor:pointer;border:1px solid #24584a;font:700 11px/1.4 'Be Vietnam Pro',Arial,sans-serif;background:#24584a;color:white}
 #gdd-cal-quick-panel .gdd-cal-quick-actions button.secondary{background:#fffdf7;color:#24584a}
 #gdd-cal-quick-panel .gdd-cal-quick-actions button:disabled{opacity:.55;cursor:wait}
 #gdd-cal-quick-panel .gdd-cal-quick-note{grid-column:1/-1;color:#7a806f;font:400 10px/1.6 'Be Vietnam Pro',Arial,sans-serif;margin:0}
 #gdd-cal-quick-panel .gdd-cal-quick-message{font:500 11px/1.5 'Be Vietnam Pro',Arial,sans-serif;color:#28614c;margin:8px 0 0;overflow-wrap:anywhere}
 #gdd-cal-quick-panel .gdd-cal-quick-message.error{color:#9b3838}
 #gdd-cal-quick-panel button:focus-visible,#gdd-cal-quick-panel :is(input,select,textarea):focus-visible{outline:2px solid #b99252;outline-offset:2px}
 @media(max-width:460px){#gdd-cal-quick-panel{padding:10px}#gdd-cal-quick-panel form{grid-template-columns:1fr}#gdd-cal-quick-panel .gdd-cal-quick-group{grid-template-columns:repeat(2,minmax(0,1fr))}#gdd-cal-quick-panel label.gdd-cal-quick-wide{grid-column:auto}#gdd-cal-quick-panel .gdd-cal-quick-date,#gdd-cal-quick-panel .gdd-cal-quick-actions,#gdd-cal-quick-panel .gdd-cal-quick-note{grid-column:1/-1}}
 `;
 document.head.append(style);

 function init(){
  const selectedInfo=$('#gdd-cal-selected'),grid=$('#gdd-cal-days');
  if(!selectedInfo||!grid)return;
  const toolbar=document.createElement('div');toolbar.className='gdd-cal-quick-toolbar';
  toolbar.innerHTML='<button type="button" id="gdd-cal-quick-add">＋ Thêm ngày kỷ niệm</button>'+
    '<small>Nhập trực tiếp trên lịch · chỉ quản trị viên được lưu</small>';
  selectedInfo.insertAdjacentElement('afterend',toolbar);
  const panel=document.createElement('section');panel.id='gdd-cal-quick-panel';panel.hidden=true;
  panel.setAttribute('aria-label','Thêm và sửa ngày qui vị tại lịch');
  panel.innerHTML=`
   <div class="gdd-cal-quick-heading"><strong id="gdd-cal-quick-title">Thêm ngày kỷ niệm qui vị</strong><button type="button" id="gdd-cal-quick-close" class="gdd-cal-quick-close" aria-label="Đóng">✕</button></div>
   <form id="gdd-cal-quick-login" hidden>
     <p class="gdd-cal-quick-note">Đăng nhập tài khoản quản trị ngay tại Lịch; không cần mở trang Quản trị.</p>
     <label class="gdd-cal-quick-wide">Email quản trị<input type="email" name="email" autocomplete="username" required></label>
     <label class="gdd-cal-quick-wide">Mật khẩu<input type="password" name="password" autocomplete="current-password" required></label>
     <div class="gdd-cal-quick-actions"><button type="submit">Đăng nhập để thêm</button></div>
   </form>
   <form id="gdd-cal-quick-form" hidden>
     <div class="gdd-cal-quick-date" id="gdd-cal-quick-date" role="status"></div>
     <label class="gdd-cal-quick-wide">Thánh danh / Họ tên Chức Sắc *<input name="full_name" required minlength="2" maxlength="240" placeholder="Thượng Thành Thanh"></label>
     <label class="gdd-cal-quick-wide">Phẩm vị<input name="rank" maxlength="160" placeholder="Thượng Chánh Phối Sư"></label>
     <label>Nhắc lại hằng năm theo<select name="calendar_system"><option value="lunar">Âm lịch</option><option value="solar">Dương lịch</option></select></label>
     <label>Năm qui vị (nếu biết)<input type="number" name="death_year" min="1800" max="2100" step="1" inputmode="numeric" placeholder="1937"></label>
     <div class="gdd-cal-quick-group" id="gdd-cal-quick-lunar">
       <label>Ngày âm lịch<input type="number" name="lunar_day" min="1" max="30" step="1" inputmode="numeric" required></label>
       <label>Tháng âm lịch<input type="number" name="lunar_month" min="1" max="12" step="1" inputmode="numeric" required></label>
       <label class="gdd-cal-quick-check"><input type="checkbox" name="lunar_leap"> Ngày thuộc tháng nhuận</label>
     </div>
     <div class="gdd-cal-quick-group" id="gdd-cal-quick-solar" hidden>
       <label>Ngày dương lịch<input type="number" name="solar_day" min="1" max="31" step="1" inputmode="numeric"></label>
       <label>Tháng dương lịch<input type="number" name="solar_month" min="1" max="12" step="1" inputmode="numeric"></label>
     </div>
     <label class="gdd-cal-quick-wide">Nguồn sử liệu / bia mộ *<textarea name="source_note" maxlength="4000" required placeholder="Thí dụ: Bia mộ, ghi ngày mùng 02/10 Đinh Sửu"></textarea></label>
     <details class="gdd-cal-quick-advanced" id="gdd-cal-quick-advanced">
       <summary>＋ Thông tin bổ sung (chân dung, tiểu sử, ghi chú)</summary>
       <div class="gdd-cal-quick-advanced-fields">
         <label>Ghi chú tưởng niệm<textarea name="description" maxlength="4000" placeholder="Ghi chép thêm nếu có…"></textarea></label>
         <label>Liên kết bài tiểu sử (nếu đã đăng)<select name="linked_person_id"><option value="">Chưa có hồ sơ trên Web Đạo</option></select></label>
         <label>Chân dung (ảnh lớn sẽ tự tối ưu dưới 6 MB)<input type="file" name="image_file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif"></label>
         <label>Hoặc liên kết ảnh<input type="url" name="image_url" placeholder="https://..."></label>
       </div>
     </details>
     <p class="gdd-cal-quick-note">Ngày đã chọn được điền sẵn. Chọn âm lịch để năm sau vẫn hiển thị đúng ngày âm. Có thể sửa và xóa các kỷ niệm do quản trị viên tự thêm.</p>
     <div class="gdd-cal-quick-actions"><button type="submit" id="gdd-cal-quick-save">Lưu kỷ niệm vào lịch</button><button type="button" id="gdd-cal-quick-cancel" class="secondary">Hủy</button></div>
   </form>
   <p class="gdd-cal-quick-message" id="gdd-cal-quick-message" role="status" aria-live="polite"></p>`;
  toolbar.insertAdjacentElement('afterend',panel);
  const openButton=$('#gdd-cal-quick-add'),closeButton=$('#gdd-cal-quick-close'),login=$('#gdd-cal-quick-login'),form=$('#gdd-cal-quick-form');
  const message=$('#gdd-cal-quick-message'),save=$('#gdd-cal-quick-save'),dateLabel=$('#gdd-cal-quick-date');
  let selectedDay=null,editingId=null,authorized=false,people=[],busy=false,clientPromise=null,checkInProgress=null;
  function feedback(text,error=false){message.textContent=text||'';message.classList.toggle('error',!!error)}
  function currentSelected(){
    const day=grid.querySelector('.gdd-cal-day.selected');
    if(!day)return selectedDay;
    const parts=String(day.dataset.solarDate||'').split('-').map(Number);
    return {solarDate:day.dataset.solarDate,
      lunar:{day:Number(day.dataset.lunarDay),month:Number(day.dataset.lunarMonth),leap:day.dataset.lunarLeap==='1'},
      solar:{year:parts[0],month:parts[1],day:parts[2]}};
  }
  function setChosen(day){
    selectedDay=day;
    if(!day)return;
    dateLabel.textContent='Ngày chọn: '+pad(day.solar.day)+'/'+pad(day.solar.month)+'/'+day.solar.year+
      ' dương lịch · '+pad(day.lunar.day)+'/'+pad(day.lunar.month)+(day.lunar.leap?' nhuận':'')+' âm lịch';
    if(!editingId){
      form.elements.lunar_day.value=day.lunar.day;
      form.elements.lunar_month.value=day.lunar.month;
      form.elements.lunar_leap.checked=day.lunar.leap;
      form.elements.solar_day.value=day.solar.day;
      form.elements.solar_month.value=day.solar.month;
    }
  }
  async function getClient(){
    if(!clientPromise)clientPromise=import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(({createClient})=>createClient(cfg.supabaseUrl,cfg.supabasePublishableKey));
    return clientPromise;
  }
  async function checkAdmin(){
    if(checkInProgress)return checkInProgress;
    checkInProgress=(async()=>{
      try{
        if(!cfg.supabaseUrl||!cfg.supabasePublishableKey)throw Error('Chưa kết nối dữ liệu.');
        const supa=await getClient();
        const {data:{user},error}=await supa.auth.getUser();
        if(error||!user){authorized=false;return false}
        const check=await supa.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
        authorized=Boolean(check.data&&!check.error);
        return authorized;
      }catch{authorized=false;return false}
      finally{
        window.__gddCalendarQuickAdmin=authorized;
        window.dispatchEvent(new Event('gdd:calendar-quick-admin-changed'));
      }
    })();
    try{return await checkInProgress}finally{checkInProgress=null}
  }
  async function loadPeople(){
    try{
      const supa=await getClient();
      const {data,error}=await supa.from('people')
        .select('id,full_name,rank,death_lunar_day,death_lunar_month,death_lunar_leap,death_solar_date')
        .eq('published',true).eq('verified',true).order('full_name').limit(400);
      if(error)throw error;
      people=data||[];
      const select=form.elements.linked_person_id;
      select.replaceChildren();
      const empty=document.createElement('option');empty.value='';empty.textContent='Chưa có hồ sơ trên Web Đạo';select.append(empty);
      for(const person of people){const option=document.createElement('option');option.value=person.id;option.textContent=person.full_name;select.append(option)}
    }catch{people=[]}
  }
  function dateMode(){
    const lunar=form.elements.calendar_system.value==='lunar';
    $('#gdd-cal-quick-lunar').hidden=!lunar;
    $('#gdd-cal-quick-solar').hidden=lunar;
    for(const key of ['lunar_day','lunar_month'])form.elements[key].required=lunar;
    for(const key of ['solar_day','solar_month'])form.elements[key].required=!lunar;
  }
  function resetForm(){
    editingId=null;form.reset();
    $('#gdd-cal-quick-advanced').open=false;
    form.elements.calendar_system.value='lunar';
    form.elements.linked_person_id.value='';
    $('#gdd-cal-quick-title').textContent='Thêm ngày kỷ niệm qui vị';
    save.textContent='Lưu kỷ niệm vào lịch';
    dateMode();setChosen(currentSelected());feedback('');
  }
  function showEditor(){
    login.hidden=true;form.hidden=false;resetForm();loadPeople();
  }
  async function openNew(){
    panel.hidden=false;feedback('Đang kiểm tra quyền ghi lịch…');
    const ok=await checkAdmin();
    if(ok){showEditor()}
    else{form.hidden=true;login.hidden=false;feedback('Chỉ tài khoản quản trị mới được thêm ngày. Đăng nhập ngay tại đây.')}
    panel.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function closeEditor(){panel.hidden=true;editingId=null;feedback('')}
  openButton.addEventListener('click',openNew);
  closeButton.addEventListener('click',closeEditor);
  $('#gdd-cal-quick-cancel').addEventListener('click',closeEditor);
  form.elements.calendar_system.addEventListener('change',dateMode);
  form.elements.linked_person_id.addEventListener('change',()=>{
    const p=people.find(x=>x.id===form.elements.linked_person_id.value);
    if(!p)return;
    if(!form.elements.full_name.value.trim())form.elements.full_name.value=p.full_name;
    if(!form.elements.rank.value.trim())form.elements.rank.value=p.rank||'';
  });
  login.addEventListener('submit',async e=>{
    e.preventDefault();
    if(busy)return;busy=true;const button=login.querySelector('button[type="submit"]');button.disabled=true;
    feedback('Đang xác thực…');
    try{
      const supa=await getClient();
      const email=login.elements.email.value.trim(),password=login.elements.password.value;
      const {error}=await supa.auth.signInWithPassword({email,password});
      if(error)throw error;
      if(!await checkAdmin()){await supa.auth.signOut();throw Error('Tài khoản này chưa được cấp quyền quản trị.')}
      login.elements.password.value='';showEditor();
    }catch(err){feedback('Không đăng nhập được: '+(err.message||String(err)),true)}
    finally{busy=false;button.disabled=false}
  });
  function checkDatePayload(){
    const lunar=form.elements.calendar_system.value==='lunar';
    const fields=form.elements;
    const payload={
      calendar_system:lunar?'lunar':'solar',
      lunar_day:lunar?Number(fields.lunar_day.value):null,
      lunar_month:lunar?Number(fields.lunar_month.value):null,
      lunar_leap:lunar?fields.lunar_leap.checked:false,
      solar_day:lunar?null:Number(fields.solar_day.value),
      solar_month:lunar?null:Number(fields.solar_month.value)
    };
    if(lunar && (!Number.isInteger(payload.lunar_day)||payload.lunar_day<1||payload.lunar_day>30||
      !Number.isInteger(payload.lunar_month)||payload.lunar_month<1||payload.lunar_month>12))
      throw Error('Ngày/tháng âm lịch không hợp lệ.');
    if(!lunar){
      const days=[31,29,31,30,31,30,31,31,30,31,30,31];
      if(!Number.isInteger(payload.solar_month)||payload.solar_month<1||payload.solar_month>12||
        !Number.isInteger(payload.solar_day)||payload.solar_day<1||payload.solar_day>days[payload.solar_month-1])
        throw Error('Ngày/tháng dương lịch không hợp lệ.');
    }
    return payload;
  }
  function alreadyInPeople(name,choice,linkedId){
    return people.some(p=>{
      const same=(linkedId&&p.id===linkedId)||normalize(p.full_name)===normalize(name);
      if(!same)return false;
      if(choice.calendar_system==='lunar' && p.death_lunar_day!=null&&p.death_lunar_month!=null){
        return Number(p.death_lunar_day)===choice.lunar_day&&Number(p.death_lunar_month)===choice.lunar_month&&Boolean(p.death_lunar_leap)===choice.lunar_leap;
      }
      if(choice.calendar_system==='solar' && p.death_solar_date){
        const parts=String(p.death_solar_date).split('-');
        return Number(parts[2])===choice.solar_day&&Number(parts[1])===choice.solar_month;
      }
      return false;
    });
  }
  async function uploadPhoto(supa,file){
   if(!file)return '';
   if(!window.GDDImageOptimizer)throw Error('Chưa tải bộ tối ưu ảnh. Xin tải lại trang.');
   file=await window.GDDImageOptimizer.prepare(file,{onStatus:message=>feedback(message)});
   const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
   const path='calendar-qui-vi/'+Date.now()+'-'+crypto.randomUUID().replace(/-/g,'').slice(0,12)+'.'+types[file.type];
   const storage=supa.storage.from('dao-su-images');
   const {error}=await storage.upload(path,file,{contentType:file.type,upsert:false,cacheControl:'3600'});
   if(error)throw error;
   return storage.getPublicUrl(path).data.publicUrl;
  }
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(busy)return;
    busy=true;save.disabled=true;feedback('Đang kiểm tra và lưu ngày kỷ niệm…');
    try{
      if(!await checkAdmin())throw Error('Phiên quản trị không còn hiệu lực. Xin đăng nhập lại.');
      const c=checkDatePayload(),fields=form.elements;
      const full_name=fields.full_name.value.trim(),source_note=fields.source_note.value.trim();
      if(full_name.length<2||full_name.length>240)throw Error('Vui lòng nhập đúng Thánh danh / Họ tên.');
      if(!source_note)throw Error('Xin ghi nguồn sử liệu để tránh nhầm lẫn ngày qui vị.');
      const linked_person_id=fields.linked_person_id.value||null;
      if(!editingId&&alreadyInPeople(full_name,c,linked_person_id))
        throw Error('Ngày qui vị này đã có trong Hồ sơ Chức Sắc. Xin dùng bản ghi hiện có để tránh trùng.');
      const death_year=fields.death_year.value?Number(fields.death_year.value):null;
      if(death_year!==null&&(!Number.isInteger(death_year)||death_year<1800||death_year>2100))
        throw Error('Năm qui vị phải là số từ 1800 đến 2100.');
      let image_url=safeURL(fields.image_url.value.trim())||null;
      if(fields.image_url.value.trim()&&!image_url)throw Error('Đường dẫn ảnh không hợp lệ.');
      const supa=await getClient(),photo=fields.image_file.files?.[0];
      if(photo){feedback('Đang tải chân dung…');image_url=await uploadPhoto(supa,photo)}
      const values={full_name,rank:fields.rank.value.trim()||null,source_note,
        description:fields.description.value.trim()||null,
        linked_person_id,death_year,image_url,published:true,
        ...c,updated_at:new Date().toISOString()};
      const query=editingId?
        supa.from(TABLE).update(values).eq('id',editingId):
        supa.from(TABLE).insert(values);
      const {data,error}=await query.select('id').single();
      if(error)throw error;
      const savedId=data?.id;
      feedback('Đã lưu ngày kỷ niệm lên lịch.');
      panel.hidden=true;editingId=null;
      window.dispatchEvent(new Event('gdd:calendar-quick-saved'));
      if(!savedId)throw Error('Không xác nhận được bản ghi.');
    }catch(err){
      feedback('Chưa lưu được: '+(err?.code==='23505'?'Ngày này đã có bản ghi cùng tên.':err.message||String(err)),true);
    }finally{busy=false;save.disabled=false}
  });
  async function openEdit(id){
    if(!id)return;
    if(!await checkAdmin()){feedback('Xin đăng nhập quản trị để sửa.',true);panel.hidden=false;form.hidden=true;login.hidden=false;return}
    try{
      const supa=await getClient();
      const {data,error}=await supa.from(TABLE).select('*').eq('id',id).single();
      if(error||!data)throw Error('Không tìm được ngày kỷ niệm này.');
      panel.hidden=false;login.hidden=true;form.hidden=false;resetForm();
      editingId=data.id;
      $('#gdd-cal-quick-title').textContent='Sửa ngày kỷ niệm qui vị';
      save.textContent='Lưu thay đổi';
      for(const key of ['full_name','rank','calendar_system','death_year','lunar_day','lunar_month','solar_day','solar_month','source_note','description','image_url','linked_person_id']){
        if(form.elements[key])form.elements[key].value=data[key]??'';
      }
      form.elements.lunar_leap.checked=!!data.lunar_leap;
      $('#gdd-cal-quick-advanced').open=Boolean(data.description||data.linked_person_id||data.image_url);
      dateMode();
      feedback('Đang sửa ngày kỷ niệm đã nhập thủ công.');
      await loadPeople();form.elements.linked_person_id.value=data.linked_person_id||'';
      panel.scrollIntoView({behavior:'smooth',block:'nearest'});
    }catch(err){feedback('Không thể sửa: '+(err.message||err),true)}
  }
  async function deleteRecord(id){
    if(!id||!confirm('Xóa ngày kỷ niệm này khỏi Lịch Đạo? Thao tác không xóa bài tiểu sử.'))return;
    if(!await checkAdmin()){feedback('Chỉ quản trị viên được xóa.',true);return}
    const supa=await getClient();
    const {error}=await supa.from(TABLE).delete().eq('id',id);
    if(error){panel.hidden=false;feedback('Xóa không thành công: '+error.message,true);return}
    if(editingId===id)closeEditor();
    window.dispatchEvent(new Event('gdd:calendar-quick-saved'));
  }
  document.addEventListener('click',e=>{
    const edit=e.target.closest?.('[data-gdd-calendar-edit]');
    if(edit){e.preventDefault();openEdit(edit.dataset.gddCalendarEdit);return}
    const remove=e.target.closest?.('[data-gdd-calendar-delete]');
    if(remove){e.preventDefault();deleteRecord(remove.dataset.gddCalendarDelete)}
  });
  window.addEventListener('gdd:calendar-updated',e=>{
    if(!e.detail?.solarDate)return;
    const parts=e.detail.solarDate.split('-').map(Number);
    const next={solarDate:e.detail.solarDate,lunar:e.detail.lunar,
      solar:{year:parts[0],month:parts[1],day:parts[2]}};
    if(selectedDay?.solarDate!==next.solarDate && !panel.hidden && editingId===null && !form.hidden){
      // Day selection is the source of truth for newly created commemorations.
      setChosen(next);
    }else selectedDay=next;
  });
  // Reuse the normal website session: no second user database and no separate admin area.
  getClient().then(supa=>{
    checkAdmin();
    supa.auth.onAuthStateChange((event)=>{
      if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='INITIAL_SESSION')
        Promise.resolve().then(()=>checkAdmin());
    });
  }).catch(()=>{});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();