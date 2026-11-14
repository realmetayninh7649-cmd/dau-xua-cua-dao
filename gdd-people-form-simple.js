/* GIỮ ĐẠO GIỮA ĐỜI — Biểu mẫu Chức Sắc gọn, nhập tay và chuyển lịch an toàn.
   Chỉ đổi giao diện. Giữ các input gốc cho Supabase, mã định danh và nhắc lễ. */
(()=>{
'use strict';
if(window.__gddPeopleSimple2026)return;
window.__gddPeopleSimple2026=true;
const $=(s,r=document)=>r.querySelector(s);
const branches={
 'Cửu Trùng Đài':['Giáo Tông','Quyền Giáo Tông','Chưởng Pháp','Ngọc Chưởng Pháp','Thượng Chưởng Pháp','Thái Chưởng Pháp','Đầu Sư','Quyền Đầu Sư','Nữ Đầu Sư','Chánh Phối Sư','Thượng Chánh Phối Sư','Ngọc Chánh Phối Sư','Thái Chánh Phối Sư','Quyền Chánh Phối Sư','Phối Sư','Giáo Sư','Giáo Hữu','Lễ Sanh'],
 'Hiệp Thiên Đài':['Hộ Pháp','Thượng Phẩm','Thượng Sanh','Bảo Pháp','Bảo Đạo','Bảo Thế','Bảo Văn Pháp Quân','Hiến Pháp','Hiến Đạo','Hiến Thế','Khai Pháp','Khai Đạo','Khai Thế','Tiếp Pháp','Tiếp Đạo','Tiếp Thế','Tiếp Sanh','Thời Quân','Chức Sắc Bộ Pháp Chánh','Chức Sắc Bộ Nhạc','Ban Thế Đạo'],
 'Phước Thiện':['Thánh Nhơn','Chơn Nhơn','Hiền Nhơn','Đạo Nhơn','Giáo Thiện','Chí Thiện','Thừa Sử'],
 'Hành chánh Đạo':['Chánh Trị Sự','Phó Trị Sự','Thông Sự','Chức Việc','Đạo Hữu'],
 'Khác':[]
};
const entries=Object.entries(branches).flatMap(([branch,ranks])=>ranks.map(rank=>({branch,rank})));
const stems=['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];
const chi=['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase().trim();
const pad=n=>String(n).padStart(2,'0');
const element=(tag,options={})=>Object.assign(document.createElement(tag),options);
function setLabel(input,newText){
 const label=input.closest('label');if(!label)return;
 const node=Array.from(label.childNodes).find(n=>n.nodeType===3);
 if(node)node.textContent=newText;
 else label.prepend(document.createTextNode(newText));
}
function getYearFromName(fullName){
 // Chỉ lấy năm qui vị ở cuối danh xưng; không lấy năm sinh hoặc ngày sự kiện khác.
 const match=String(fullName||'').match(/\(\s*(?:1[789]\d{2}|20\d{2})\s*[–—-]\s*((?:1[789]\d{2}|20\d{2}))\s*\)\s*$/);
 return match?Number(match[1]):null;
}
function parseLunarText(value){
 const m=String(value||'').match(/^\s*(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*(nhuận\s*)?(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)\s+(Tý|Sửu|Dần|Mão|Thìn|Tỵ|Ngọ|Mùi|Thân|Dậu|Tuất|Hợi)(?:\s*\(\s*(\d{4})\s*\))?\s*$/i);
 if(!m)return null;
 const day=Number(m[1]),month=Number(m[2]);
 if(day<1||day>30||month<1||month>12)return null;
 return {day,month,leap:Boolean(m[3]),stem:m[4],branch:m[5],year:m[6]?Number(m[6]):null};
}
function canChiValid(year,parsed){
 return normalize(stems[(year+6)%10])===normalize(parsed.stem)&&
   normalize(chi[(year+8)%12])===normalize(parsed.branch);
}
function toSolarISO(day,month,leap,year){
 const convert=window.GDDVietnameseLunar?.solarToLunar;
 if(!convert||!Number.isInteger(year)||year<1800||year>2100)return null;
 const start=Date.UTC(year,0,1),stop=Date.UTC(year+1,2,31);
 for(let ms=start;ms<=stop;ms+=86400000){
  const dt=new Date(ms);
  const lunar=convert(dt.getUTCDate(),dt.getUTCMonth()+1,dt.getUTCFullYear());
  if(lunar.year===year&&lunar.day===day&&lunar.month===month&&Boolean(lunar.leap)===leap){
   return dt.getUTCFullYear()+'-'+pad(dt.getUTCMonth()+1)+'-'+pad(dt.getUTCDate());
  }
 }
 return null;
}
function applyCompact(form){
 if($('.gdd-people-combined',form))return;
 const rank=form.elements.rank,branch=form.elements.branch;
 const notes=form.elements.date_notes,day=form.elements.death_lunar_day,month=form.elements.death_lunar_month;
 const leap=form.elements.death_lunar_leap,solar=form.elements.death_solar_date,name=form.elements.full_name;
 if(!rank||!branch||!notes||!day||!month||!solar||!name)return;
 // Những trường ít cần thiết được bỏ khỏi giao diện, nhưng dữ liệu cũ vẫn nằm trong DB.
 for(const key of ['secular_name','years','birthplace']){
  const field=form.elements[key];
  if(field)field.closest('label')?.remove();
 }
 const rankLabel=rank.closest('label'),branchLabel=branch.closest('label');
 const originalBranch=branch.value,originalRank=rank.value;
 const combined=document.createElement('div');combined.className='gdd-people-combined';
 const selectLabel=document.createElement('label');
 selectLabel.textContent='Cơ quan / Hệ thống / Phẩm vị';
 const select=element('select',{required:true,name:'gdd_people_branch_rank'});
 select.setAttribute('aria-label','Cơ quan Đạo và Phẩm vị');
 const first=element('option',{value:'',textContent:'Chọn Cơ quan và Phẩm vị'});
 select.append(first);
 for(const [section,ranks] of Object.entries(branches)){
  if(!ranks.length)continue;
  const group=element('optgroup',{label:section});
  for(const rank of ranks){
   const index=entries.findIndex(row=>row.branch===section&&row.rank===rank);
   group.append(element('option',{value:String(index),textContent:section+' – '+rank}));
  }
  select.append(group);
 }
 select.append(element('option',{value:'custom',textContent:'Khác / Tự nhập Phẩm vị…'}));
 selectLabel.append(select);combined.append(selectLabel);
 const custom=element('div',{className:'gdd-people-custom',hidden:true});
 const customBranchLabel=element('label',{textContent:'Cơ quan Đạo'});
 const customBranch=element('select',{name:'gdd_custom_branch'});
 for(const option of Array.from(branch.options)){
  const copy=element('option',{value:option.value,textContent:option.textContent});
  customBranch.append(copy);
 }
 customBranchLabel.append(customBranch);
 const customRankLabel=element('label',{textContent:'Phẩm vị (nhập chữ)'});
 const customRank=element('input',{type:'text',name:'gdd_custom_rank',maxLength:140,placeholder:'Nhập nguyên phẩm vị trong tư liệu'});
 customRankLabel.append(customRank);
 custom.append(customBranchLabel,customRankLabel);combined.append(custom);
 rankLabel.before(combined);
 rankLabel.hidden=true;branchLabel.hidden=true;
 function sync(){
  const chosen=select.value;
  custom.hidden=chosen!=='custom';
  customRank.required=chosen==='custom';
  customBranch.disabled=chosen!=='custom';customRank.disabled=chosen!=='custom';
  if(chosen==='custom'){
   branch.value=customBranch.value;rank.value=customRank.value.trim();
  }else if(chosen!==''&&entries[Number(chosen)]){
   branch.value=entries[Number(chosen)].branch;rank.value=entries[Number(chosen)].rank;
  }else{
   branch.selectedIndex=-1;rank.value='';
  }
  branch.dispatchEvent(new Event('change',{bubbles:true}));
  rank.dispatchEvent(new Event('input',{bubbles:true}));
 }
 const matched=entries.findIndex(e=>e.branch===originalBranch&&e.rank===originalRank);
 if(originalRank){
  if(matched>=0)select.value=String(matched);
  else{select.value='custom';customBranch.value=originalBranch||'Khác';customRank.value=originalRank;}
 }else {
  select.value='';
  branch.selectedIndex=-1;
 }
 custom.hidden=select.value!=='custom';
 customRank.required=select.value==='custom';
 customBranch.disabled=select.value!=='custom';customRank.disabled=select.value!=='custom';
 select.addEventListener('change',sync);
 customBranch.addEventListener('change',sync);
 customRank.addEventListener('input',sync);
 // Ngày qui vị một ô nhập chữ; các số Âm lịch được giữ ẩn để hệ thống nhắc ngày kỷ niệm.
 for(const field of [day,month,leap])field.closest('label').hidden=true;
 setLabel(notes,'Ngày qui vị (Âm lịch)');
 notes.placeholder='Thí dụ: 10/12 Bính Ngọ (2026)';
 notes.autocomplete='off';
 setLabel(solar,'Ngày qui vị Dương lịch (tự đổi nếu đủ năm)');
 const help=element('small',{className:'gdd-people-date-help'});
 help.setAttribute('role','status');help.setAttribute('aria-live','polite');
 notes.closest('label').append(help);
 function notice(text,bad=false){
  help.textContent=text;
  help.classList.toggle('gdd-people-date-error',bad);
 }
 let autoValue='';
 let edited=false;
 const clearDerived=()=>{
  if(autoValue&&solar.value===autoValue)solar.value='';
  autoValue='';
  day.value='';month.value='';leap.checked=false;
 };
 function recalc(){
  const raw=notes.value.trim();
  if(!raw){
   if(edited)clearDerived();
   notice('Có thể nhập chữ theo tài liệu gốc; thí dụ 10/12 Bính Ngọ (2026).');
   return;
  }
  const p=parseLunarText(raw);
  if(!p){
   if(edited)clearDerived();
   notice('Đang ghi dạng tự do. Muốn tự đổi Dương lịch, nhập như: 10/12 Bính Ngọ (2026).');
   return;
  }
  day.value=String(p.day);month.value=String(p.month);leap.checked=p.leap;
  const year=p.year||getYearFromName(name.value);
  if(!year){
   if(edited&&autoValue&&solar.value===autoValue){solar.value='';autoValue='';}
   notice('Đã nhận ngày Âm lịch. Để đổi Dương lịch chính xác, thêm năm vào ngoặc: (2026), hoặc ghi (năm sanh–năm qui vị) sau Danh xưng.');
   return;
  }
  if(!canChiValid(year,p)){
   if(edited&&autoValue&&solar.value===autoValue){solar.value='';autoValue='';}
   notice('Năm '+year+' không khớp với '+p.stem+' '+p.branch+'. Xin đối chiếu trước khi đổi Dương lịch.',true);
   return;
  }
  const result=toSolarISO(p.day,p.month,p.leap,year);
  if(!result){
   if(edited&&autoValue&&solar.value===autoValue){solar.value='';autoValue='';}
   notice('Không tìm thấy ngày Âm lịch này trong năm đã chọn. Xin kiểm tra tháng nhuận hoặc ngày 29/30.',true);
   return;
  }
  if(solar.value&&solar.value!==autoValue&&solar.value!==result){
   notice('Dương lịch đang có dữ liệu nhập tay khác kết quả '+result.split('-').reverse().join('/')+'. Không tự ghi đè.',true);
   return;
  }
  solar.value=result;autoValue=result;
  notice('Đã đổi chính xác: '+result.split('-').reverse().join('/')+' (Dương lịch).');
 }
 let debounce=0;
 notes.addEventListener('input',()=>{edited=true;clearTimeout(debounce);debounce=setTimeout(recalc,170)});
 notes.addEventListener('change',()=>{edited=true;recalc()});
 name.addEventListener('input',()=>{if(notes.value.trim())recalc()});
 solar.addEventListener('input',()=>{autoValue=''});
 form.addEventListener('submit',recalc,true);
 // Với hồ sơ đã lưu, chỉ hướng dẫn; không ghi đè ngày Dương lịch cũ khi mở sửa.
 if(notes.value.trim())recalc();
}
function reorderTail(form){
 const album=$('#gdd-admin-album-panel',form),confirm=$('#gdd-person-publish-check',form);
 const actions=$('.form-actions',form);
 if(album&&confirm&&actions&&confirm.nextElementSibling!==actions)actions.before(confirm);
}
function init(){
 const form=$('#editor-form');if(!form)return;
 const update=()=>{
  if(form.elements.full_name&&!$('.gdd-people-combined',form))applyCompact(form);
  reorderTail(form);
 };
 new MutationObserver(update).observe(form,{childList:true});
 update();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();