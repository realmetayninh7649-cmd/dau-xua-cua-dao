(function(){
'use strict';
if(window.__gddSmartEditorV1)return;
window.__gddSmartEditorV1=true;
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
const clean=s=>String(s||'').replace(/\s+/g,' ').replace(/^[\s•–—:]+|[\s;,.]+$/g,'').trim();
const short=(s,max=180)=>clean(s).slice(0,max);
const ranks=[
'Nữ Chánh Phối Sư','Thượng Chánh Phối Sư','Ngọc Chánh Phối Sư','Thái Chánh Phối Sư','Tiếp Dẫn Đạo Nhơn',
'Giáo Sư Hàm Phong','Ngọc Chưởng Pháp','Thượng Chưởng Pháp','Thái Chưởng Pháp','Quyền Giáo Tông',
'Nữ Đầu Sư','Chánh Phối Sư','Chưởng Pháp','Thượng Phẩm','Thượng Sanh','Bảo Văn Pháp Quân',
'Chơn Nhơn','Hiền Nhơn','Thánh Nhơn','Đạo Nhơn','Giáo Thiện','Đầu Sư','Phối Sư','Giáo Sư',
'Giáo Hữu','Lễ Sanh','Chánh Trị Sự','Phó Trị Sự','Hộ Pháp','Bảo Pháp','Bảo Thế',
'Bảo Đạo','Hiến Đạo','Hiến Pháp','Hiến Thế','Khai Đạo','Khai Pháp','Khai Thế',
'Tiếp Đạo','Tiếp Pháp','Tiếp Thế','Tiếp Sanh','Giáo Tông'
].sort((a,b)=>b.length-a.length);
const priorities={
 people:['biography','full_name','gender','file'],
 posts:['body','title','file'],
 media:['caption','title','file'],
 videos:['body','title','video_url','video_file','file'],
 obituaries:['body','title','file'],
 documents:['body','title','file'],
 memorial:['body','title','person_name','portrait_file']
};
const fullNames={full_name:'Danh xưng',person_name:'Danh xưng',secular_name:'Thế danh',rank:'Phẩm vị',
 rank_title:'Phẩm vị',branch:'Cơ quan Đạo',gender:'Nam/Nữ',years:'Năm sanh – qui vị',
 birthplace:'Nguyên quán',date_notes:'Ngày qui vị',death_lunar_day:'Ngày Âm lịch',death_lunar_month:'Tháng Âm lịch',
 death_lunar_leap:'Tháng nhuận',death_solar_date:'Ngày Dương lịch',death_date:'Ngày qui vị',
 anniversary_date:'Ngày kỷ niệm',summary:'Tóm tắt',sources:'Nguồn',title:'Tiêu đề',
 deceased_name:'Danh xưng',memorial_date:'Ngày qui vị',document_number:'Số hiệu văn kiện',document_date:'Ngày văn kiện'};
function labeled(lines,keys,limit=170){
 const rx=new RegExp('^\\s*(?:[•*-]\\s*)?(?:'+keys+')\\s*(?:[:：]|[–—-])\\s*(.+)$','i');
 const match=lines.map(s=>s.match(rx)).find(Boolean);
 return match?short(match[1],limit):'';
}
function firstTitle(lines,person=false){
 for(const line of lines.slice(0,10)){
  const n=norm(line);
  if(line.length<8||line.length>160||/^(dai dao|toa thanh|nhut ba|bien soan|nguon tu lieu|ho so chuc sac|chuong|muc luc)/.test(n))continue;
  if(person&&!ranks.some(r=>n.includes(norm(r)))&&!/^(duc ba|ba |ong |ngai |hien ty)/.test(n))continue;
  return short(line,150);
 }
 return '';
}
function branchFor(rank){
 const r=norm(rank);
 if(/thuong pham|thuong sanh|ho phap|bao phap|bao the|bao dao|bao van|hien dao|hien phap|hien the|khai dao|khai phap|khai the|tiep dao|tiep phap|tiep the|tiep sanh/.test(r))return 'Hiệp Thiên Đài';
 if(/tiep dan dao nhon|chon nhon|hien nhon|thanh nhon|dao nhon|giao thien/.test(r))return 'Phước Thiện';
 if(/giao tong|chuong phap|dau su|phoi su|giao su|giao huu|le sanh/.test(r))return 'Cửu Trùng Đài';
 return '';
}
function readInfo(text,kind){
 const lines=String(text||'').replace(/\r/g,'').split('\n').map(clean).filter(Boolean);
 if(!lines.length)return {};
 const v={};
 const heading=firstTitle(lines,kind==='people'||kind==='memorial');
 const title=firstTitle(lines,false);
 const name=labeled(lines,'(?:họ\\s*(?:và\\s*)?tên|danh xưng|thánh danh|tên chức sắc)',170)||heading;
 if(kind==='people'&&name)v.full_name=name.replace(/\s*\(\s*\d{4}\s*[–—-]\s*\d{4}\s*\)\s*$/,'').trim();
 if(kind==='memorial'&&name){const cleanName=name.replace(/\s*\(\s*\d{4}\s*[–—-]\s*\d{4}\s*\)\s*$/,'').trim();v.person_name=cleanName;v.title='Tưởng niệm '+cleanName}
 if(!['people','memorial'].includes(kind)&&title)v.title=title;
 let secular=labeled(lines,'(?:thế danh|tên thật|tên tục|húy danh|tục danh)');
 if(!secular){
  const prose=lines.join(' ').match(/(?:thế danh|tên thật|tên tục|tục danh)(?:\s+của\s+(?:ngài|ông|bà))?\s+(?:là|tức|tên là)\s+([A-ZĐÀ-Ỹ][\p{L}]+(?:\s+[A-ZĐÀ-Ỹ][\p{L}]+){1,5})(?=[,.;\s]|$)/iu);
  if(prose)secular=short(prose[1],100);
 }
 if(secular)v.secular_name=secular;
 const rank=labeled(lines,'(?:phẩm vị|phẩm tước|phẩm đạo|chức phẩm)',110)||
   ranks.find(r=>norm(name).includes(norm(r)))||'';
 if(rank){
  if(kind==='people'){
    v.rank=rank;
    const b=branchFor(rank);if(b)v.branch=b;
  }
  if(kind==='memorial')v.rank_title=rank;
 }
 if(kind==='people'){
  const n=norm(name);
  if(/^(?:duc\s+)?(?:ba\s+|nu\s+|hien ty\s+)/.test(n))v.gender='Nữ';
  else if(/^(?:ong\s+|ngai\s+)/.test(n))v.gender='Nam';
  let hometown=labeled(lines,'(?:nguyên quán|quê quán|quê nhà)',140);
  if(!hometown){
   const match=lines.join(' ').match(/(?:nguyên quán|quê quán)\s+(?:ở|tại|là)\s+([^,.;\n]{5,95})/i);
   if(match)hometown=short(match[1],95);
  }
  if(hometown)v.birthplace=hometown;
  const years=(name+' '+lines.slice(0,7).join(' ')).match(/\b((?:18|19|20)\d{2})\s*[–—-]\s*((?:18|19|20)\d{2})\b/);
  if(years)v.years=years[1]+'–'+years[2];
 }
 const deathLine=lines.find(s=>/qui vi|quy vi|tu tran|dang tien|ngay mat|vien tich/.test(norm(s)))||'';
 if(deathLine){
  if(kind==='people'){
   v.date_notes=short(deathLine,190);
   const lunar=deathLine.match(/(?:âm lịch|AL|a\.l\.)\s*[:：-]?\s*(\d{1,2})\s*[\/.-]\s*(\d{1,2})/i)||
    deathLine.match(/(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*(?:nhuận\s*)?(?:[–-]\s*)?(?:Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)(?:\s|[–-])/i)||
    deathLine.match(/ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+âm lịch/i);
   if(lunar&&Number(lunar[1])>=1&&Number(lunar[1])<=30&&Number(lunar[2])>=1&&Number(lunar[2])<=12){
    v.death_lunar_day=String(Number(lunar[1]));
    v.death_lunar_month=String(Number(lunar[2]));
    if(/(?:tháng\s*nhuận|tháng\s*\d{1,2}\s*nhuận)/i.test(deathLine))v.death_lunar_leap=true;
   }
   const solar=deathLine.match(/(?:dương lịch|DL|d\.l\.|nhằm ngày)\s*[:：\-]?\s*(\d{1,2})[\/.-](\d{1,2})[\/.-]((?:18|19|20)\d{2})/i);
   if(solar){
    const y=Number(solar[3]),m=Number(solar[2]),d=Number(solar[1]);
    const dt=new Date(Date.UTC(y,m-1,d));
    if(dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d){
      v.death_solar_date=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
      if(!v.death_lunar_day&&window.GDDVietnameseLunar?.solarToLunar){
       const cal=window.GDDVietnameseLunar.solarToLunar(d,m,y);
       v.death_lunar_day=String(cal.day);v.death_lunar_month=String(cal.month);
       if(cal.leap)v.death_lunar_leap=true;
      }
    }
   }
  }
  if(kind==='memorial'){
   v.death_date=short(deathLine.replace(/^.*?(?:ngày\s+qui\s+vị|ngày\s+quy\s+vị)\s*[:：-]?\s*/i,''),135);
   // Không tự gán ngày tưởng niệm nếu mốc âm lịch chưa xác định rõ.
   const day=v.death_date.match(/(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s+(?:Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)/i);
   if(day&&!/nhuận/i.test(v.death_date))v.anniversary_date=Number(day[1])+' tháng '+Number(day[2])+' âm lịch hằng năm';
  }
  if(kind==='obituaries')v.memorial_date=short(deathLine,160);
 }
 const source=labeled(lines,'(?:nguồn\\s+(?:tư\\s*liệu|sử\\s*liệu|tin)|xuất xứ|tài liệu tham khảo|trích từ)',400);
 if(source)v.sources=source;
 if(kind==='documents'){
  const no=labeled(lines,'(?:số hiệu(?:\\s+văn kiện)?|số văn kiện|ký hiệu văn bản)',95);
  const date=labeled(lines,'(?:ngày văn kiện|ngày ban hành|niên đại)',95);
  if(no)v.document_number=no;
  if(date)v.document_date=date;
 }
 const brief=lines.find(s=>s.length>65&&!/^(?:nguồn|tài liệu|đại đạo tam kỳ|tòa thánh|toà thánh)/i.test(norm(s)));
 if(brief&&kind!=='media')v.summary=short(brief,kind==='memorial'?240:210);
 return v;
}

const states=new WeakMap();
function updateField(form,state,key,value){
 const field=form.elements[key];
 if(!field||field.disabled||value===null||value===undefined||value===''||state.touched.has(key))return false;
 if(field.type==='checkbox'){
  if(value!==true||field.checked)return false;
  field.checked=true;
 }else{
  const present=String(field.value||'').trim();
  if(present&&present!==state.auto.get(key))return false;
  if(present===String(value))return false;
  field.value=String(value);
 }
 state.auto.set(key,String(value));
 field.dataset.smartFilled='yes';
 field.dispatchEvent(new Event('input',{bubbles:true}));
 field.dispatchEvent(new Event('change',{bubbles:true}));
 return true;
}
function scan(form,state,requested=false){
 const main=state.kind==='people'?'biography':state.kind==='media'?'caption':'body';
 const text=form.elements[main]?.value?.trim()||'';
 const note=$('.gdd-smart-feedback',form);
 if(!text){
  if(requested&&note){note.hidden=false;note.textContent='Hãy dán nội dung bài chính rồi nhấn Tự điền.'}
  return;
 }
 const found=readInfo(text,state.kind),changes=[];
 for(const [field,value] of Object.entries(found)){
  if(updateField(form,state,field,value))changes.push(fullNames[field]||field);
 }
 if(note&&(requested||changes.length)){
  note.hidden=false;
  note.textContent=changes.length
   ?'Đã tự điền '+changes.length+' mục: '+[...new Set(changes)].join(', ')+'. Xin kiểm tra trước khi công bố.'
   :'Đã đọc nội dung; giữ nguyên các trường nhập tay, để trống những thông tin chưa đủ căn cứ.';
 }
 const count=$('.gdd-smart-count',form);
 if(count&&state.auto.size)count.textContent=' · '+state.auto.size+' mục gợi ý';
}
function node(tag,cls,text){
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text)e.textContent=text;
 return e;
}
function upgrade(form,kind){
 if($('.gdd-smart-primary',form))return;
 const labels=$$(':scope > label',form);
 if(!labels.length)return;
 const actions=form.querySelector(':scope > .form-actions, :scope > .gdd-memorial-admin-actions');
 if(!actions)return;
 let state=states.get(form);
 if(!state){
  state={kind,touched:new Set(),auto:new Map(),timer:0};
  states.set(form,state);
  form.addEventListener('input',event=>{
   if(event.isTrusted&&event.target?.name)state.touched.add(event.target.name);
   const field=state.kind==='people'?'biography':state.kind==='media'?'caption':'body';
   if(event.target?.name===field){
    if(state.timer)clearTimeout(state.timer);
    state.timer=setTimeout(()=>scan(form,state),550);
   }
  });
  form.addEventListener('change',event=>{
   if(event.isTrusted&&event.target?.name)state.touched.add(event.target.name);
  });
  form.addEventListener('reset',()=>{state.touched.clear();state.auto.clear()});
  // Quét ngay trước khi trình duyệt kiểm tra các trường bắt buộc.
  form.addEventListener('click',event=>{
   if(event.target.closest('button[type="submit"]'))scan(form,state);
  },true);
  form.addEventListener('submit',()=>scan(form,state),true);
 }
 state.kind=kind;state.touched.clear();state.auto.clear();
 const main=node('section','gdd-smart-primary');
 main.append(node('h4','gdd-smart-heading','Nội dung chính'));
 main.append(node('p','gdd-smart-hint',
  'Viết hoặc dán bài một lần. Hệ thống tự nhận thông tin có nhãn rõ như Thế danh, Phẩm vị, Nguyên quán và Ngày qui vị.'));
 const details=node('details','gdd-smart-more');
 const summary=node('summary','', 'Thông tin tự điền và tùy chọn chỉnh sửa');
 summary.append(node('small','gdd-smart-count'));
 details.append(summary);
 const content=node('div','gdd-smart-extra');
 content.append(node('p','gdd-smart-hint',
  'Chỉ điền thông tin có căn cứ, không sửa nội dung đã nhập tay. Mở mục này để kiểm tra và bổ sung nếu cần.'));
 details.append(content);
 const used=new Set();
 for(const field of priorities[kind]||priorities.posts){
  const label=labels.find(l=>l.querySelector('[name="'+field+'"]'));
  if(label&&!used.has(label)){used.add(label);main.append(label)}
 }
 const button=node('button','gdd-smart-scan','✧ Tự điền từ bài viết');
 button.type='button';
 const feedback=node('p','gdd-smart-feedback');
 feedback.hidden=true;feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
 button.addEventListener('click',()=>{scan(form,state,true);details.open=true});
 main.append(button,feedback);
 const publish=node('div','gdd-smart-publish');
 for(const label of labels){
  if(used.has(label))continue;
  if(label.querySelector('input[name="published"]'))publish.append(label);
  else content.append(label);
 }
 if(kind==='memorial'){
  const pair=form.querySelector(':scope > .gdd-two-col');
  if(pair)content.prepend(pair);
  const help=form.querySelector(':scope > p.gdd-muted');
  if(help)content.append(help);
 }else{
  const code=form.querySelector(':scope > #person-code-preview');
  if(code)content.append(code);
  for(const p of $$(':scope > p.help',form))content.append(p);
 }
 form.insertBefore(main,actions);
 form.insertBefore(details,actions);
 form.insertBefore(publish,actions);
 if(kind==='people'){
  const branch=form.elements.branch;
  const editing=$('#editor-heading')?.textContent.trim()==='Sửa tư liệu';
  if(branch&&!editing&&!branch.querySelector('option[value=""]')){
   const empty=node('option','', 'Chưa xác định – tự rút từ bài');
   empty.value='';branch.prepend(empty);branch.value='';branch.dispatchEvent(new Event('change',{bubbles:true}));
  }
 }
}
// Đúng trình tự nhập hồ sơ: bài chính → thông tin thêm → bộ ảnh → công bố → xác nhận mã → lưu.
function arrangeEditorTail(form){
 const actions=form.querySelector(':scope > .form-actions');
 const publish=form.querySelector(':scope > .gdd-smart-publish');
 const primary=form.querySelector(':scope > .gdd-smart-primary');
 if(!actions||!publish||!primary)return;
 const album=form.querySelector(':scope > #gdd-admin-album-panel');
 const confirm=form.querySelector(':scope > #gdd-person-publish-check');
 // Không chuyển tệp ảnh hay dựng lại panel: chỉ dời chính phần tử DOM, giữ trạng thái ảnh đang chọn.
 if(album&&album.nextElementSibling!==publish)form.insertBefore(album,publish);
 if(confirm&&confirm.nextElementSibling!==actions)form.insertBefore(confirm,actions);
}
function init(){
 const form=$('#editor-form');
 if(form){
  const mount=()=>{
   if(form.querySelector(':scope > label')&&!$('.gdd-smart-primary',form)){
    upgrade(form,$('.editor-tabs button.is-selected')?.dataset.kind||'people');
   }
   arrangeEditorTail(form);
  };
  new MutationObserver(mount).observe(form,{childList:true});
  mount();
 }
 const memorial=$('#gdd-memorial-form');
 if(memorial)upgrade(memorial,'memorial');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
