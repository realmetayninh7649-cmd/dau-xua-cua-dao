/* DẤU XƯA CỬA ĐẠO — giao diện công khai và quản trị Supabase.
   Không dùng service_role / secret key trong mã phía trình duyệt. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const config = window.SITE_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabasePublishableKey && !config.supabaseUrl.includes('YOUR_'));
  const demo = {
    people: [
      {id:'demo-p1',slug:'phoi-su-ngoc-ngo-thanh',full_name:'Phối Sư Ngọc Ngọ Thanh',secular_name:'Trần Văn Ngọ',rank:'Phối Sư',branch:'Cửu Trùng Đài',years:'1893–1967',birthplace:'Bình Hòa – Tân An',summary:'Hồ sơ về công nghiệp và dấu mốc hành Đạo của Phối Sư Ngọc Ngọ Thanh.',biography:'Phối Sư Ngọc Ngọ Thanh, thế danh Trần Văn Ngọ (1893–1967). Theo ghi chép đang sưu khảo, Ngài từng trải qua nhiều năm hành Đạo và nhiều biến cố trên đường phụng sự Hội Thánh.\n\nNgày qui vị ghi nhận: 23 tháng 5 năm Đinh Mùi (30-6-1967).\n\nCần đối chiếu các chi tiết này với văn kiện, chiếu sớ và tài liệu gốc trước khi công bố hồ sơ chính thức.',date_notes:'23/05 Đinh Mùi — 30/06/1967',sources:'DỮ LIỆU MẪU — cần bổ sung văn kiện gốc, số hiệu và trang trích dẫn.',verified:false,published:true,image_url:'',created_at:'2026-11-01T10:00:00Z'},
      {id:'demo-p2',slug:'phoi-su-thuong-then-thanh',full_name:'Phối Sư Thượng Then Thanh',secular_name:'Trần Văn Then',rank:'Phối Sư',branch:'Cửu Trùng Đài',years:'1899–1966',birthplace:'Tỉnh Gia Định',summary:'Gợi mở hồ sơ một vị Chức sắc Nam phái từng gánh vác phận sự hành Đạo.',biography:'Phối Sư Thượng Then Thanh, thế danh Trần Văn Then, sinh năm 1899, nguyên quán tỉnh Gia Định.\n\nNhững tư liệu đang tập hợp đề cập đến các phận sự tại Bà Rịa và Tà Mun, cùng đạo hiệu Thiện Lực trong giai đoạn hành Đạo.\n\nĐây là nội dung giới thiệu trong giao diện mẫu; các chức vụ, thời điểm và diễn biến cần được bổ sung chứng cứ nguyên bản.',date_notes:'1899–1966',sources:'DỮ LIỆU MẪU — chờ kiểm tra tài liệu, tiểu sử và niên biểu.',verified:false,published:true,image_url:'',created_at:'2026-11-01T09:00:00Z'},
      {id:'demo-p3',slug:'dao-nhon-le-van-ban',full_name:'Đạo Nhơn Lê Văn Bản',secular_name:'Lê Văn Bản',rank:'Đạo Nhơn',branch:'Phước Thiện',years:'1906–1985',birthplace:'',summary:'Một đời phụng sự cơ quan Phước Thiện và các công việc từ thiện của Đại Đạo.',biography:'Đạo Nhơn Lê Văn Bản (1906–1985). Theo niên biểu đang sưu khảo, Ngài nhập môn ngày 15 tháng 6 Ất Hợi (1935), hiến thân ngày 14 tháng 8 Bính Tý (1936).\n\nCác mốc phẩm vị được ghi nhận: Giáo Thiện (1951), Chí Thiện (1965), Đạo Nhơn (1973).\n\nNgày qui vị: 14 tháng 9 năm Ất Sửu (1985).\n\nCần đối chiếu văn bản Hội Thánh và hồ sơ lưu trữ.',date_notes:'14/09 Ất Sửu (1985)',sources:'DỮ LIỆU MẪU — bổ sung Thánh Lịnh và văn kiện Phước Thiện.',verified:false,published:true,image_url:'',created_at:'2026-11-01T08:00:00Z'},
      {id:'demo-p4',slug:'pho-tri-su-huynh-van-hoi',full_name:'Phó Trị Sự Huỳnh Văn Hỏi',secular_name:'Huỳnh Văn Hỏi',rank:'Phó Trị Sự',branch:'Hành chánh Đạo',years:'1907–1977',birthplace:'Gò Dầu – Tây Ninh',summary:'Tư liệu về một vị Chức việc tiền bối và hoạt động xây dựng cơ sở Đạo tại địa phương.',biography:'Phó Trị Sự Huỳnh Văn Hỏi (1907–1977), gắn bó với vùng Gò Dầu, Tây Ninh. Theo tư liệu gia đình đang được hệ thống hóa, Ông nhập Đạo năm 1926 và góp sức trong công việc vận động Thánh Thất Lông Công.\n\nNgày qui vị: 11 tháng 3 Đinh Tỵ (28-4-1977).\n\nNhững thông tin trên cần được đối chiếu thêm với bằng cấp Đạo và nguồn tư liệu liên hệ.',date_notes:'11/03 Đinh Tỵ — 28/04/1977',sources:'DỮ LIỆU MẪU — tư liệu gia đình, cần bổ sung ảnh chứng từ.',verified:false,published:true,image_url:'',created_at:'2026-11-01T07:00:00Z'}
    ],
    posts: [
      {id:'demo-a1',slug:'moi-doi-tan-tuy-cua-phoi-su-ngoc-ngo-thanh',title:'Một đời tận tụy của Phối Sư Ngọc Ngọ Thanh',category:'Tiểu sử & công nghiệp',summary:'Từ những năm tháng hành Đạo đến các văn kiện ghi nhận công nghiệp, một hồ sơ cần được nghiên cứu tiếp.',body:'Đây là vị trí dành cho bài biên khảo đầy đủ.\n\nKhi biên soạn, nên trình bày: lai lịch, quá trình nhập Đạo, phẩm vị, trách nhiệm đảm nhận, văn kiện minh chứng, những năm cuối đời, nguồn trích dẫn.\n\nĐối với chi tiết có nhiều nguồn khác nhau, xin ghi rõ dị biệt và chưa vội kết luận.',sources:'BÀI VIẾT MẪU — chưa kèm văn kiện kiểm chứng.',person_id:'demo-p1',verified:false,published:true,created_at:'2026-11-01T10:00:00Z'},
      {id:'demo-a2',slug:'phoi-su-thuong-then-thanh-dau-buoc-hanh-dao',title:'Phối Sư Thượng Then Thanh — dấu bước hành Đạo',category:'Chân dung tiền bối',summary:'Những mốc hành Đạo được sưu khảo và câu chuyện cần lần tìm từ văn bản gốc.',body:'Nơi đây dành để đăng toàn văn tiểu sử Phối Sư Thượng Then Thanh (Trần Văn Then, 1899–1966) sau khi đối chiếu nguồn.\n\nCó thể chèn đường dẫn ảnh, đánh số tài liệu tham chiếu và ghi chú từng mốc thời gian.',sources:'BÀI VIẾT MẪU — cần bổ sung nguồn.',person_id:'demo-p2',verified:false,published:true,created_at:'2026-10-31T10:00:00Z'},
      {id:'demo-a3',slug:'dao-nhon-le-van-ban-cong-nghiep-phuoc-thien',title:'Đạo Nhơn Lê Văn Bản và công nghiệp Phước Thiện',category:'Đạo sử Phước Thiện',summary:'Hệ thống niên biểu các phẩm vị và công việc đã trải qua trong cơ quan Phước Thiện.',body:'Nơi đây dành để biên khảo về cơ quan Phước Thiện và cuộc đời Đạo Nhơn Lê Văn Bản.\n\nƯu tiên sử dụng văn kiện nguyên bản, ghi đủ tên tài liệu, ngày tháng Âm – Dương lịch và số hiệu lưu trữ.',sources:'BÀI VIẾT MẪU — chưa xác minh độc lập.',person_id:'demo-p3',verified:false,published:true,created_at:'2026-10-29T10:00:00Z'}
    ],
    media: [
      {id:'demo-m1',slug:'di-anh-chuc-sac-tien-boi',title:'Di ảnh Chức sắc tiền bối',caption:'Vị trí lưu trữ ảnh chân dung và thông tin người lưu giữ bản gốc.',image_url:'',sources:'Ảnh mẫu chưa được tải lên.',published:true,created_at:'2026-10-30T10:00:00Z'},
      {id:'demo-m2',slug:'van-kien-dao-su',title:'Văn kiện Đạo sử',caption:'Lưu trữ bản chụp Chiếu Sớ, Thánh Lịnh, Vi Bằng, bằng cấp.',image_url:'',sources:'Ảnh mẫu chưa được tải lên.',published:true,created_at:'2026-10-28T10:00:00Z'},
      {id:'demo-m3',slug:'anh-thanh-that',title:'Ảnh cơ sở Đạo xưa',caption:'Hình ảnh các Thánh Thất và hoạt động hành Đạo qua các thời kỳ.',image_url:'',sources:'Ảnh mẫu chưa được tải lên.',published:true,created_at:'2026-10-27T10:00:00Z'}
    ]
  };
  const state = { data:{people:[],posts:[],media:[]},supabase:null,admin:false,user:null,editorKind:'people',editingId:null,peopleExpanded:false,detail:null };
  const schema = {
    people:['full_name','secular_name','rank','branch','years','birthplace','summary','biography','date_notes','sources','image_url','verified','published'],
    posts:['title','category','summary','body','sources','person_id','cover_url','verified','published'],
    media:['title','caption','sources','person_id','image_url','published']
  };
  const fields = {
    people:[['full_name','Danh xưng / tên Chức sắc','text',1],['secular_name','Thế danh','text'],['rank','Phẩm vị','text'],['branch','Cơ quan / hệ thống','branch'],['years','Năm sanh – qui vị','text'],['birthplace','Nguyên quán','text'],['summary','Tóm tắt ngắn','textarea'],['biography','Tiểu sử / công nghiệp (nội dung đầy đủ)','long',1],['date_notes','Ngày tháng Âm – Dương lịch','text'],['sources','Nguồn sử liệu / chú thích','textarea'],['image_url','Địa chỉ ảnh (URL), nếu có','url'],['file','Hoặc tải di ảnh lên','file'],['verified','Đã đối chiếu nguồn sử liệu','check'],['published','Công bố trên website','check']],
    posts:[['title','Tiêu đề bài viết','text',1],['category','Chuyên mục','text'],['summary','Dẫn nhập / tóm tắt','textarea'],['body','Nội dung biên khảo','long',1],['person_id','Hồ sơ Chức sắc liên quan','person'],['sources','Thư mục và nguồn trích dẫn','textarea'],['cover_url','Địa chỉ ảnh bìa (URL)','url'],['file','Hoặc tải ảnh bìa lên','file'],['verified','Đã đối chiếu nguồn sử liệu','check'],['published','Công bố trên website','check']],
    media:[['title','Tên ảnh / văn kiện','text',1],['caption','Mô tả, niên đại, xuất xứ','long'],['person_id','Hồ sơ Chức sắc liên quan','person'],['sources','Người cung cấp / nguồn bản gốc','textarea'],['image_url','Địa chỉ ảnh (URL)','url'],['file','Tải hình ảnh lên','file'],['published','Công bố trên website','check']]
  };
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
  const slugify = s => norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,72) || 'tu-lieu';
  const safeUrl = s => {try{const u=new URL(String(s));return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
  const date = s => {if(!s)return '';try{return new Date(s).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}catch{return ''}};
  const statusTag = record => record.verified?'<span class="verification verified">ĐÃ ĐỐI CHIẾU</span>':'<span class="verification">CẦN ĐỐI CHIẾU</span>';
  const portrait = p => {const src=safeUrl(p.image_url);return src?`<img src="${escape(src)}" alt="Di ảnh ${escape(p.full_name)}" loading="lazy">`:`<div class="portrait-placeholder"><span class="symbol">${escape((p.secular_name||p.full_name||'Đ').trim().split(/\s+/).slice(-1)[0].charAt(0).toUpperCase())}</span></div>`};
  const toast = message => {const el=$('#toast');el.textContent=message;el.classList.add('is-visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('is-visible'),4500)};
  const publicRows = kind => state.admin?state.data[kind]:state.data[kind].filter(x=>x.published);
  const recordTitle = (kind,x) => kind==='people'?x.full_name:x.title;
  const linkedPerson = personId => state.data.people.find(x=>x.id===personId);

  function render(){
    const people=publicRows('people'),posts=publicRows('posts'),media=publicRows('media');
    $('#count-people').textContent=people.length;$('#count-posts').textContent=posts.length;$('#count-media').textContent=media.length;
    const q=norm($('#people-search').value.trim()),branch=$('#branch-filter').value;
    const matching=people.filter(p=>(branch==='all'||(p.branch||'Khác')===branch)&&norm([p.full_name,p.secular_name,p.rank,p.branch,p.birthplace,p.summary,p.biography].join(' ')).includes(q));
    const shown=state.peopleExpanded?matching:matching.slice(0,6);
    $('#people-grid').innerHTML=shown.length?shown.map(p=>`<article class="person-card"><div class="person-media">${portrait(p)}<span class="card-badge">${escape(p.branch||'TƯ LIỆU ĐẠO SỬ')}</span></div><div class="person-body"><span class="person-rank">${escape(p.rank||'Chức sắc')}</span><h3>${escape(p.full_name)}</h3><span class="person-years">${escape(p.years||'Đang bổ sung niên đại')}</span><p>${escape(p.summary||'Hồ sơ tư liệu đang được biên soạn.')}</p><div class="card-bottom"><span>${p.verified?'Đã đối chiếu':'Đang đối chiếu'}</span><button type="button" class="card-link" data-open-kind="people" data-id="${escape(p.id)}">Xem tiểu sử <span>↗</span></button></div></div></article>`).join(''):'<div class="empty-state"><b>Chưa tìm thấy hồ sơ phù hợp.</b>Thử tên khác hoặc thay đổi bộ lọc.</div>';
    $('#people-result-count').textContent=`Đang hiển thị ${shown.length} / ${matching.length} hồ sơ`;
    const more=$('#people-show-more');more.hidden=matching.length<=6;more.textContent=state.peopleExpanded?'Thu gọn hồ sơ ↑':'Xem thêm hồ sơ ↗';
    $('#article-list').innerHTML=posts.length?posts.slice(0,8).map(p=>`<article class="article-row"><div><span class="article-tag">${escape(p.category||'BIÊN KHẢO')} · ${escape(date(p.created_at))}</span><h3>${escape(p.title)}</h3><p>${escape(p.summary||'Bài khảo cứu trong kho tư liệu Đạo sử.')}</p></div><button type="button" aria-label="Đọc bài ${escape(p.title)}" data-open-kind="posts" data-id="${escape(p.id)}">↗</button></article>`).join(''):'<div class="empty-state"><b>Chưa có bài biên khảo.</b>Người quản trị có thể đăng bài đầu tiên.</div>';
    $('#gallery-grid').innerHTML=media.length?media.map(m=>{const src=safeUrl(m.image_url);return `<button type="button" class="gallery-card" data-open-kind="media" data-id="${escape(m.id)}"><div class="gallery-visual">${src?`<img src="${escape(src)}" alt="${escape(m.title)}" loading="lazy">`:'<div class="gallery-placeholder"><b>✧</b><span>ẢNH TƯ LIỆU</span></div>'}</div><div><h3>${escape(m.title)}</h3><p>${escape(m.caption||'Bấm để xem thông tin ảnh.')}</p></div></button>`}).join(''):'<div class="empty-state"><b>Chưa có ảnh tư liệu.</b>Tải ảnh từ trang quản trị để lập thư viện ảnh.</div>';
    if(state.admin)renderEditorList();
  }
  function openDetail(kind,record,updateHash=true){
    if(!record)return;
    state.detail={kind,id:record.id};
    const title=recordTitle(kind,record);
    const src=safeUrl(kind==='posts'?record.cover_url:record.image_url);
    const subtitle=kind==='people'?[record.rank,record.branch,record.years].filter(Boolean).join(' · '):kind==='posts'?[record.category,date(record.created_at)].filter(Boolean).join(' · '):'HÌNH ẢNH & TƯ LIỆU';
    const body=kind==='people'?record.biography:kind==='posts'?record.body:record.caption;
    const summary=kind==='people'?record.summary:kind==='posts'?record.summary:'';
    const person=kind!=='people'&&record.person_id?linkedPerson(record.person_id):null;
    const dateNotes=kind==='people'&&record.date_notes?`<p class="detail-meta">Ngày tháng: ${escape(record.date_notes)}</p>`:'';
    $('#detail-content').innerHTML=`<div class="eyebrow">${kind==='people'?'TIỂU SỬ & CÔNG NGHIỆP':kind==='posts'?'BÀI BIÊN KHẢO':'TƯ LIỆU HÌNH ẢNH'}</div><h2 class="detail-title">${escape(title)}</h2><p class="detail-meta">${escape(subtitle)}</p>${dateNotes}<div class="detail-cover">${src?`<img src="${escape(src)}" alt="${escape(title)}">`:`<div class="portrait-placeholder">${kind==='people'?'DI ẢNH ĐANG BỔ SUNG':kind==='posts'?'BÀI BIÊN KHẢO':'ẢNH ĐANG BỔ SUNG'}</div>`}</div>${kind==='media'?'':statusTag(record)}${summary?`<p class="detail-summary">${escape(summary)}</p>`:''}${person?`<p class="detail-meta">Hồ sơ liên quan: ${escape(person.full_name)}</p>`:''}<div class="detail-body">${escape(body||'Nội dung đang được bổ sung.')}</div><div class="detail-source"><strong>NGUỒN TƯ LIỆU & GHI CHÚ</strong>${escape(record.sources||'Chưa cập nhật nguồn tư liệu.')}</div>${state.admin?`<p><button class="btn btn-outline" type="button" data-edit-kind="${escape(kind)}" data-edit-id="${escape(record.id)}">Chỉnh sửa tư liệu</button></p>`:''}`;
    $('#detail-overlay').hidden=false;document.body.classList.add('modal-open');$('.detail-panel').scrollTop=0;
    if(updateHash){const prefix={people:'nhan-vat',posts:'bai-viet',media:'hinh-anh-tu-lieu'}[kind];history.replaceState(null,'',`#${prefix}/${encodeURIComponent(record.slug)}`)}
  }
  function closeDetail(){ $('#detail-overlay').hidden=true;state.detail=null;document.body.classList.remove('modal-open');if(/^#(nhan-vat|bai-viet|hinh-anh-tu-lieu)\//.test(location.hash))history.replaceState(null,'','#chuc-sac') }
  function syncHash(){const match=location.hash.match(/^#(nhan-vat|bai-viet|hinh-anh-tu-lieu)\/(.+)$/);if(!match)return;const kind={'nhan-vat':'people','bai-viet':'posts','hinh-anh-tu-lieu':'media'}[match[1]];const slug=decodeURIComponent(match[2]);const row=publicRows(kind).find(x=>x.slug===slug);if(row)openDetail(kind,row,false)}

  function closeAdmin(){ $('#admin-overlay').hidden=true;document.body.classList.remove('modal-open') }
  async function openAdmin(){
    $('#admin-overlay').hidden=false;document.body.classList.add('modal-open');$('.admin-panel').scrollTop=0;
    if(!state.supabase){$('#login-message').textContent='Chưa kết nối cơ sở dữ liệu trực tuyến. Xem tệp HƯỚNG-DẪN.md để hoàn tất cài đặt.';$('#login-form button').disabled=true;return}
    if(state.user){await verifyAdmin();return}
    $('#admin-login-area').hidden=false;$('#admin-editor-area').hidden=true;
  }
  async function verifyAdmin(){
    if(!state.user)return;
    const {data,error}=await state.supabase.from('admin_users').select('user_id').eq('user_id',state.user.id).maybeSingle();
    state.admin=Boolean(data&&!error);
    $('#admin-login-area').hidden=state.admin;$('#admin-editor-area').hidden=!state.admin;
    if(state.admin){$('#logged-email').textContent=state.user.email||'Người quản trị';buildEditor();renderEditorList()}
    else{$('#login-message').textContent='Tài khoản chưa được cấp quyền biên tập. Xin kiểm tra bảng admin_users.'}
  }
  function labelHTML(field){
    const [name,label,type,required]=field,req=required?' required':'';
    if(type==='check')return `<label class="check-label"><input type="checkbox" name="${name}" ${name==='published'?'checked':''}>${escape(label)}</label>`;
    if(type==='branch')return `<label>${escape(label)}<select name="${name}"><option value="Cửu Trùng Đài">Cửu Trùng Đài</option><option value="Hiệp Thiên Đài">Hiệp Thiên Đài</option><option value="Phước Thiện">Phước Thiện</option><option value="Hành chánh Đạo">Hành chánh Đạo</option><option value="Khác">Khác</option></select></label>`;
    if(type==='person')return `<label>${escape(label)}<select name="person_id"><option value="">Không liên kết</option>${state.data.people.map(p=>`<option value="${escape(p.id)}">${escape(p.full_name)}</option>`).join('')}</select></label>`;
    if(type==='file')return `<label>${escape(label)}<input type="file" name="file" accept="image/jpeg,image/png,image/webp"></label><p class="help">Dùng JPEG, PNG hoặc WebP; tối đa 6 MB mỗi ảnh. Giữ bản gốc ở nơi lưu trữ riêng.</p>`;
    if(type==='long'||type==='textarea')return `<label>${escape(label)}<textarea name="${name}" class="${type==='long'?'tall':''}"${req}></textarea></label>`;
    return `<label>${escape(label)}<input type="${type==='url'?'url':'text'}" name="${name}"${req}></label>`;
  }
  function buildEditor(){
    const kind=state.editorKind;$('#editor-heading').textContent=state.editingId?'Sửa tư liệu':'Thêm '+({people:'hồ sơ Chức sắc',posts:'bài biên khảo',media:'ảnh tư liệu'}[kind]);
    $$('.editor-tabs button').forEach(b=>b.classList.toggle('is-selected',b.dataset.kind===kind));
    $('#editor-form').innerHTML=fields[kind].map(labelHTML).join('')+`<div class="form-actions"><button class="btn btn-primary" type="submit">${state.editingId?'Lưu thay đổi':'Đăng tư liệu'}</button>${state.editingId?'<button class="btn-delete" type="button" id="delete-record">Xóa tư liệu</button>':''}</div><p id="form-message" class="small-note" aria-live="polite"></p>`;
    if(state.editingId){const record=state.data[kind].find(x=>x.id===state.editingId);if(record){const form=$('#editor-form');for(const name of schema[kind]){const el=form.elements[name];if(!el)continue;if(el.type==='checkbox')el.checked=Boolean(record[name]);else el.value=record[name]??''}}}
  }
  function renderEditorList(){if(!state.admin)return;const kind=state.editorKind;$('#editor-list').innerHTML=state.data[kind].length?state.data[kind].map(r=>`<div class="editor-item"><div><b>${escape(recordTitle(kind,r))}</b><span>${r.published?'Đã công bố':'Bản nháp'} · ${escape(date(r.created_at))}</span></div><button type="button" data-list-edit="${escape(kind)}" data-id="${escape(r.id)}">Sửa</button></div>`).join(''):'<p class="small-note">Chưa có tư liệu.</p>'}
  function editRecord(kind,id){state.editorKind=kind;state.editingId=id;closeDetail();$('#admin-overlay').hidden=false;document.body.classList.add('modal-open');buildEditor();$('.admin-panel').scrollTop=120}
  async function uploadImage(file,kind){
    if(!file)return '';
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Chỉ nhận ảnh JPEG, PNG hoặc WebP.');
    if(file.size>6*1024*1024)throw new Error('Ảnh lớn hơn 6 MB. Xin thu nhỏ dung lượng trước khi đăng.');
    const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
    const path=`${kind}/${Date.now()}-${Math.random().toString(36).slice(2,11)}.${ext}`;
    const {error}=await state.supabase.storage.from('dao-su-images').upload(path,file,{contentType:file.type,upsert:false});
    if(error)throw error;
    return state.supabase.storage.from('dao-su-images').getPublicUrl(path).data.publicUrl;
  }
  async function saveRecord(e){
    e.preventDefault();if(!state.admin)return toast('Tài khoản chưa có quyền biên tập.');
    const form=e.currentTarget,btn=$('button[type="submit"]',form),kind=state.editorKind,record=state.data[kind].find(x=>x.id===state.editingId);
    btn.disabled=true;$('#form-message').textContent='Đang lưu tư liệu…';
    try{
      const data={};for(const name of schema[kind]){const el=form.elements[name];if(!el)continue;data[name]=el.type==='checkbox'?el.checked:el.value.trim()||null}
      const file=form.elements.file?.files?.[0];if(file){const url=await uploadImage(file,kind);data[kind==='posts'?'cover_url':'image_url']=url}
      if(!record){data.slug=slugify(data.full_name||data.title)+'-'+Date.now().toString(36).slice(-6)}
      const request=record?state.supabase.from(kind).update(data).eq('id',record.id):state.supabase.from(kind).insert(data);
      const {error}=await request;if(error)throw error;
      await fetchData();state.editingId=null;buildEditor();toast('Đã lưu tư liệu thành công.');
    }catch(err){$('#form-message').textContent='Không thể lưu: '+(err.message||'Lỗi không xác định');toast('Lỗi lưu tư liệu. Xin kiểm tra lại quyền và dữ liệu.')}
    finally{btn.disabled=false}
  }
  async function deleteRecord(){
    const kind=state.editorKind,id=state.editingId;if(!id||!state.admin)return;
    if(!window.confirm('Xóa vĩnh viễn mục tư liệu này khỏi cơ sở dữ liệu? Hình đã tải lên Storage sẽ không tự động bị xóa.'))return;
    try{const {error}=await state.supabase.from(kind).delete().eq('id',id);if(error)throw error;state.editingId=null;await fetchData();buildEditor();toast('Đã xóa mục tư liệu.')}catch(err){toast('Không xóa được: '+err.message)}
  }
  async function fetchData(){
    if(!state.supabase)return;
    const kinds=['people','posts','media'];
    const results=await Promise.all(kinds.map(k=>state.supabase.from(k).select('*').order('created_at',{ascending:false}).limit(500)));
    const errors=results.filter(r=>r.error).map(r=>r.error.message);
    if(errors.length){toast('Lỗi tải dữ liệu: '+errors.join('; '));return}
    kinds.forEach((k,i)=>state.data[k]=results[i].data||[]);
    render();syncHash();
  }
  async function initSupabase(){
    if(!configured){state.data=demo;$('#mode-banner').hidden=false;render();syncHash();return}
    try{
      const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      state.supabase=createClient(config.supabaseUrl,config.supabasePublishableKey);
      const {data:{session}}=await state.supabase.auth.getSession();
      state.user=session?.user||null;
      if(state.user)await verifyAdmin();
      await fetchData();
      if(state.admin)buildEditor();
      state.supabase.auth.onAuthStateChange((_event,session)=>{state.user=session?.user||null;if(!state.user){state.admin=false;$('#admin-login-area').hidden=false;$('#admin-editor-area').hidden=true;fetchData()}});
    }catch(err){toast('Không kết nối được Supabase. Hãy kiểm tra URL, key và kết nối mạng.');console.error(err);state.data=demo;$('#mode-banner').hidden=false;render();syncHash()}
  }
  function bindEvents(){
    $('#year').textContent=new Date().getFullYear();
    $('#people-search').addEventListener('input',()=>{state.peopleExpanded=false;render()});
    $('#branch-filter').addEventListener('change',()=>{state.peopleExpanded=false;render()});
    $('#people-show-more').addEventListener('click',()=>{state.peopleExpanded=!state.peopleExpanded;render()});
    $('#menu-toggle').addEventListener('click',()=>{const open=$('#main-nav').classList.toggle('is-open');$('#menu-toggle').setAttribute('aria-expanded',String(open))});
    $$('#main-nav a').forEach(a=>a.addEventListener('click',()=>{$('#main-nav').classList.remove('is-open');$('#menu-toggle').setAttribute('aria-expanded','false')}));
    $('#admin-open').addEventListener('click',openAdmin);
    $('#login-form').addEventListener('submit',async e=>{
      e.preventDefault();if(!state.supabase)return;
      const form=e.currentTarget,btn=$('button[type="submit"]',form);btn.disabled=true;$('#login-message').textContent='Đang xác thực…';
      const email=form.elements.email.value.trim(),password=form.elements.password.value;
      const {data,error}=await state.supabase.auth.signInWithPassword({email,password});
      if(error){$('#login-message').textContent=error.message}else{state.user=data.user;await verifyAdmin();if(state.admin){$('#login-message').textContent='';form.reset();await fetchData()}else await state.supabase.auth.signOut()}
      btn.disabled=false;
    });
    $('#logout-button').addEventListener('click',async()=>{if(state.supabase)await state.supabase.auth.signOut();state.user=null;state.admin=false;$('#admin-login-area').hidden=false;$('#admin-editor-area').hidden=true;closeAdmin();await fetchData();toast('Đã đăng xuất')});
    $$('.editor-tabs button').forEach(b=>b.addEventListener('click',()=>{state.editorKind=b.dataset.kind;state.editingId=null;buildEditor();renderEditorList()}));
    $('#editor-new').addEventListener('click',()=>{state.editingId=null;buildEditor()});
    $('#editor-form').addEventListener('submit',saveRecord);
    document.addEventListener('click',e=>{
      const close=e.target.closest('[data-close]');if(close){if(close.dataset.close==='detail')closeDetail();else closeAdmin();return}
      const open=e.target.closest('[data-open-kind]');if(open){const kind=open.dataset.openKind,record=publicRows(kind).find(x=>x.id===open.dataset.id);openDetail(kind,record);return}
      const edit=e.target.closest('[data-edit-kind]');if(edit){editRecord(edit.dataset.editKind,edit.dataset.editId);return}
      const listEdit=e.target.closest('[data-list-edit]');if(listEdit){editRecord(listEdit.dataset.listEdit,listEdit.dataset.id);return}
      if(e.target.id==='delete-record')deleteRecord();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#detail-overlay').hidden)closeDetail();else if(!$('#admin-overlay').hidden)closeAdmin()}});
    window.addEventListener('hashchange',syncHash);
    const ob=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){$$('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===entry.target.id))}})},{rootMargin:'-25% 0px -55% 0px'});
    $$('.section-anchor').forEach(s=>ob.observe(s));
  }
  bindEvents();initSupabase();
})();
