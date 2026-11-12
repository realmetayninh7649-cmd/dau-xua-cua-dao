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
    ],
    videos:[], obituaries:[], documents:[], submissions:[]
  };
  const state = { data:{people:[],posts:[],media:[],videos:[],obituaries:[],documents:[],submissions:[]},supabase:null,admin:false,user:null,editorKind:'people',editingId:null,peopleExpanded:false,detail:null };
  const schema = {
    people:['full_name','secular_name','rank','branch','subgroup','gender','years','birthplace','summary','biography','date_notes','death_lunar_day','death_lunar_month','death_lunar_leap','death_solar_date','sources','image_url','verified','published'],
    posts:['title','category','summary','body','sources','person_id','cover_url','verified','published'],
    media:['title','caption','sources','person_id','image_url','published'],
    videos:['title','summary','body','video_url','cover_url','sources','person_id','published'],
    obituaries:['title','deceased_name','memorial_date','summary','body','cover_url','sources','person_id','published'],
    documents:['title','document_number','document_date','summary','body','file_url','sources','person_id','published']
  };
  const fields = {
    people:[['full_name','Danh xưng / tên Chức sắc','text',1],['secular_name','Thế danh','text'],['rank','Phẩm vị','text'],['branch','Cơ quan / hệ thống','branch'],['subgroup','Phân nhóm Chức sắc','subgroup'],
['gender','Phân loại Chức sắc Nam / Nữ','gender',1],
  ['years','Năm sanh – qui vị','text'],['birthplace','Nguyên quán','text'],['summary','Tóm tắt ngắn','textarea'],['biography','Tiểu sử / công nghiệp (nội dung đầy đủ)','long',1],['date_notes','Ngày tháng Âm – Dương lịch','text'],['death_lunar_day','Ngày qui vị ÂM lịch (1–30)','lunar-day'],['death_lunar_month','Tháng qui vị ÂM lịch (1–12)','lunar-month'],['death_lunar_leap','Ngày qui vị thuộc tháng nhuận','check'],['death_solar_date','Ngày qui vị DƯƠNG lịch (nếu biết)','date'],['sources','Nguồn sử liệu / chú thích','textarea'],['image_url','Địa chỉ ảnh (URL), nếu có','url'],['file','Hoặc tải di ảnh lên','file'],['verified','Đã đối chiếu nguồn sử liệu','check'],['published','Công bố trên website','check']],
    posts:[['title','Tiêu đề bài viết','text',1],['category','Chuyên mục','text'],['summary','Dẫn nhập / tóm tắt','textarea'],['body','Nội dung biên khảo','long',1],['person_id','Hồ sơ Chức sắc liên quan','person'],['sources','Thư mục và nguồn trích dẫn','textarea'],['cover_url','Địa chỉ ảnh bìa (URL)','url'],['file','Hoặc tải ảnh bìa lên','file'],['verified','Đã đối chiếu nguồn sử liệu','check'],['published','Công bố trên website','check']],
    media:[['title','Tên ảnh / văn kiện','text',1],['caption','Mô tả, niên đại, xuất xứ','long'],['person_id','Hồ sơ Chức sắc liên quan','person'],['sources','Người cung cấp / nguồn bản gốc','textarea'],['image_url','Địa chỉ ảnh (URL)','url'],['file','Tải hình ảnh lên','file'],['published','Công bố trên website','check']],
    videos:[['title','Tiêu đề video Đạo Sử','text',1],['summary','Tóm tắt','textarea'],['body','Nội dung / thuyết minh','long'],['video_url','Liên kết Facebook, YouTube hoặc MP4 (nếu có)','url'],['video_file','Hoặc chọn video MP4 từ album / tệp điện thoại','video-file'],['cover_url','Đường dẫn ảnh bìa (nếu có)','url'],['file','Hoặc tải ảnh bìa lên','file'],['person_id','Chức sắc liên quan','person'],['sources','Nguồn video / bản quyền / xuất xứ','textarea'],['published','Công bố trên website','check']],
    obituaries:[['title','Tiêu đề Ai Tín','text',1],['deceased_name','Danh xưng người quy vị','text'],['memorial_date','Ngày quy vị (Âm / Dương lịch)','text'],['summary','Lời dẫn ngắn','textarea'],['body','Nội dung Ai Tín / tưởng niệm','long'],['cover_url','Đường dẫn di ảnh','url'],['file','Hoặc tải di ảnh lên','file'],['person_id','Hồ sơ Chức sắc liên quan','person'],['sources','Nguồn tin / tài liệu xác minh','textarea'],['published','Công bố trên website','check']],
    documents:[['title','Tên tài liệu số hóa','text',1],['document_number','Số hiệu văn kiện','text'],['document_date','Niên đại / ngày tháng văn kiện','text'],['summary','Mô tả ngắn','textarea'],['body','Nội dung giới thiệu / trích yếu','long'],['file_url','Liên kết file PDF hoặc ảnh','url'],['file','Hoặc tải PDF / ảnh tài liệu lên','file'],['person_id','Hồ sơ Chức sắc liên quan','person'],['sources','Xuất xứ bản gốc / nguồn lưu trữ','textarea'],['published','Công bố trên website','check']]
  };
  const subgroupLabels = {
    'Cửu Trùng Đài':['Chức Sắc Đại Thiên Phong Nam/Nữ','Chức Sắc Thiên Phong Nam/Nữ','Chức Việc và Đạo Hữu','Ban Kiến Trúc','Các Cơ Quan Hành Chánh Đạo khác'],
    'Hiệp Thiên Đài':['Chức Sắc Đại Thiên Phong Nam/Nữ','Bộ Pháp Chánh','Chức Sắc Bộ Nhạc','Ban Thế Đạo','Các Cơ Quan Hành Chánh Đạo khác'],
    'Phước Thiện':[], 'Hành chánh Đạo':[], 'Khác':[]
  };
  const allSubgroups = [...new Set(Object.values(subgroupLabels).flat())];
  const sectionNames={people:'Hồ sơ Chức sắc',posts:'Bài biên khảo',media:'Hình ảnh',videos:'Video Đạo Sử',obituaries:'Ai Tín',documents:'Tài liệu số hóa'};
  const prefixNames={people:'nhan-vat',posts:'bai-viet',media:'hinh-anh-tu-lieu',videos:'video-dao-su',obituaries:'ai-tin',documents:'tai-lieu-so-hoa'};
  const kindFromPrefix=Object.fromEntries(Object.entries(prefixNames).map(([kind,prefix])=>[prefix,kind]));
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
  const slugify = s => norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,72) || 'tu-lieu';
  const safeUrl = s => {try{const u=new URL(String(s));return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
  const date = s => {if(!s)return '';try{return new Date(s).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'})}catch{return ''}};
  const statusTag = record => record.verified?'<span class="verification verified">ĐÃ ĐỐI CHIẾU</span>':'<span class="verification">CẦN ĐỐI CHIẾU</span>';
// Chỉ nhúng các dịch vụ video được nhận diện rõ; không chèn HTML tùy ý.
// Facebook dùng iframe Social Plugin và giữ liên kết gốc để xem dự phòng.
function videoSource(raw){
  const url=safeUrl(raw);if(!url)return null;
  let u;try{u=new URL(url)}catch{return null}
  const host=u.hostname.toLowerCase(),path=u.pathname.split('/').filter(Boolean);
  let id='';
  if(host==='youtu.be'||host==='www.youtu.be')id=path[0]||'';
  else if(['youtube.com','www.youtube.com','m.youtube.com','music.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host)){
    if(u.pathname==='/watch')id=u.searchParams.get('v')||'';
    else if(['embed','shorts','live','v'].includes(path[0]))id=path[1]||'';
  }
  if(/^[A-Za-z0-9_-]{11}$/.test(id))return {type:'youtube',url,id,poster:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`};
  // Nhận đường dẫn video và Reels công khai từ facebook.com, fb.watch.
  // fb.watch là URL rút gọn: Meta có thể từ chối nhúng, nên giữ nút mở gốc.
  const facebookHosts=['facebook.com','www.facebook.com','m.facebook.com','web.facebook.com','mbasic.facebook.com'];
  if(u.protocol==='https:' && (host==='fb.watch'||facebookHosts.includes(host))){
    const short=host==='fb.watch'&&path.length===1&&/^[A-Za-z0-9_-]{5,40}$/.test(path[0]);
    const watch=host!=='fb.watch'&&(
      ((path[0]==='watch'||path[0]==='video.php') && /^\d{5,25}$/.test(u.searchParams.get('v')||'')) ||
      (path.length>=2 && ['videos','reels'].includes(path[path.length-2]) && /^[A-Za-z0-9_-]{5,100}$/.test(path[path.length-1])) ||
      (path.length===2 && path[0]==='reel' && /^[A-Za-z0-9_-]{5,100}$/.test(path[1])) ||
      (path.length>=3 && path[0]==='share' && ['v','r'].includes(path[1]) && /^[A-Za-z0-9_-]{5,100}$/.test(path[2]))
    );
    if(short||watch){
      u.hash='';
      // Tránh tham số theo dõi không cần thiết; giữ tham số ID cho watch/video.php.
      if(short||u.searchParams.has('v')){
        const videoId=u.searchParams.get('v');u.search='';if(videoId)u.searchParams.set('v',videoId);
      }else{u.search=''}
      const href=u.href;
      return {type:'facebook',url,embedHref:href,shortLink:Boolean(short)};
    }
  }
  if(u.protocol==='https:' && /\.(mp4|webm)$/i.test(u.pathname))return {type:'file',url};
  return {type:'external',url};
}
  function videoPoster(record){
    const source=videoSource(record.video_url),picture=safeUrl(record.cover_url)||(source?.type==='youtube'?source.poster:'');
    const image=picture?`<img src="${escape(picture)}" alt="" loading="lazy">`:'<span class="video-placeholder-icon" aria-hidden="true">▣</span>';
    if(['youtube','facebook','file'].includes(source?.type)){
      return `<button class="video-poster-button" type="button" data-video-play="${escape(record.id)}" aria-label="Phát video ${escape(record.title)}">${image}<span class="video-play-badge" aria-hidden="true">▶</span><span class="video-play-caption">${source.type==='facebook'?'Video Facebook · Nhấn để xem':'Nhấn để xem ngay'}</span></button>`;
    }
    return `<div class="video-poster-unavailable">${image}<span class="video-play-caption">${source?'Xem video tại nguồn ở phần chi tiết':'Chưa có video để phát'}</span></div>`;
  }
  function playVideo(id,control){
    const record=publicRows('videos').find(x=>x.id===id),source=record&&videoSource(record.video_url);
    if(!source||!['youtube','facebook','file'].includes(source.type))return;
    const slot=control.closest('.video-preview-slot, .detail-video-preview');if(!slot)return;
    // Không để nhiều video cùng phát ở một thời điểm.
    $$('.video-preview-slot video, .detail-video-preview video').forEach(v=>v.pause());
    $$('.video-preview-slot iframe, .detail-video-preview iframe').forEach(f=>{const parent=f.closest('.video-preview-slot, .detail-video-preview');if(parent&&parent!==slot){const other=publicRows('videos').find(x=>x.id===parent.dataset.videoId);parent.innerHTML=other?videoPoster(other):'';}});
    if(source.type==='youtube'){
      const frame=document.createElement('iframe');
      frame.src=`https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&playsinline=1&rel=0`;
      frame.title=`Video Đạo Sử: ${record.title}`;
      frame.loading='eager';frame.referrerPolicy='strict-origin-when-cross-origin';
      frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.setAttribute('allowfullscreen','');slot.replaceChildren(frame);
    }else if(source.type==='facebook'){
      const frame=document.createElement('iframe');
      const embedWidth=Math.max(220,Math.round(slot.clientWidth||560));
      const fmt=slot.dataset.gddAspect||'landscape';
      const embedHeight=Math.round(embedWidth*(fmt==='portrait'?16/9:fmt==='square'?1:9/16));
      frame.src=`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(source.embedHref)}&show_text=false&width=${embedWidth}&height=${embedHeight}`;
      frame.title=`Video Facebook · Đạo Sử: ${record.title}`;
      frame.loading='eager';frame.referrerPolicy='strict-origin-when-cross-origin';
      frame.allow='autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
      frame.setAttribute('allowfullscreen','');slot.replaceChildren(frame);
      // Nếu Facebook chặn iframe, đường dẫn trong bài chi tiết vẫn cho phép xem gốc.
    }else{
      const player=document.createElement('video');
      player.controls=true;player.playsInline=true;player.preload='metadata';
      player.src=source.url;
      if(safeUrl(record.cover_url))player.poster=safeUrl(record.cover_url);
      player.setAttribute('aria-label',`Video Đạo Sử: ${record.title}`);
      slot.replaceChildren(player);player.play().catch(()=>{});
    }
    slot.classList.add('is-playing');
  }
  // Nếu ảnh bìa hỏng hoặc nguồn không cho đọc: hiện bố cục dự phòng,
  // không để trống hoặc làm co khung bài biên khảo.
  document.addEventListener('error',event=>{
    const img=event.target;
    if(img instanceof HTMLImageElement && img.closest('#article-list .editorial-image'))img.hidden=true;
  },true);
  document.addEventListener('load',event=>{
    const img=event.target;
    if(!(img instanceof HTMLImageElement))return;
    const cover=img.closest('#article-list .editorial-image');
    if(!cover||!img.naturalWidth||!img.naturalHeight)return;
    const ratio=img.naturalHeight/img.naturalWidth;
    cover.classList.toggle('is-portrait',ratio>1.12);
    cover.classList.toggle('is-landscape',ratio<.88);
  },true);
  const portrait = p => {const src=safeUrl(p.image_url);return src?`<img src="${escape(src)}" alt="Di ảnh ${escape(p.full_name)}" loading="lazy">`:`<div class="portrait-placeholder"><span class="symbol">${escape((p.secular_name||p.full_name||'Đ').trim().split(/\s+/).slice(-1)[0].charAt(0).toUpperCase())}</span></div>`};
  const toast = message => {const el=$('#toast');el.textContent=message;el.classList.add('is-visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('is-visible'),4500)};
  const publicRows = kind => state.admin?state.data[kind]:state.data[kind].filter(x=>x.published);
  const recordTitle = (kind,x) => kind==='people'?x.full_name:x.title;
  const linkedPerson = personId => state.data.people.find(x=>x.id===personId);

  function render(){
    const people=publicRows('people'),posts=publicRows('posts'),media=publicRows('media');
    $('#count-people').textContent=people.length;$('#count-posts').textContent=posts.length;$('#count-media').textContent=media.length;
    const q=norm($('#people-search').value.trim()),branch=$('#branch-filter').value,subgroup=$('#subgroup-filter').value;
    const matching=people.filter(p=>(branch==='all'||(p.branch||'Khác')===branch)&&(subgroup==='all'||p.subgroup===subgroup)&&norm([p.archive_code,p.archive_legacy_code,p.full_name,p.secular_name,p.rank,p.branch,p.birthplace,p.summary,p.biography].join(' ')).includes(q));
    const shown=state.peopleExpanded?matching:matching.slice(0,6);
    $('#people-grid').innerHTML=shown.length?shown.map(p=>`<article class="person-card"><div class="person-media">${portrait(p)}<span class="card-badge">${escape(p.branch||'TƯ LIỆU ĐẠO SỬ')}</span></div><div class="person-body"><span class="person-rank">${escape(p.rank||'Chức sắc')}</span><h3>${escape(p.full_name)}</h3><span class="person-years">${escape(p.years||'Đang bổ sung niên đại')}</span><p>${escape(p.summary||'Hồ sơ tư liệu đang được biên soạn.')}</p><div class="card-bottom"><span>${p.verified?'Đã đối chiếu':'Đang đối chiếu'}</span><button type="button" class="card-link" data-open-kind="people" data-id="${escape(p.id)}">Xem tiểu sử <span>↗</span></button></div></div></article>`).join(''):'<div class="empty-state"><b>Chưa tìm thấy hồ sơ phù hợp.</b>Thử tên khác hoặc thay đổi bộ lọc.</div>';
    $('#people-result-count').textContent=`Đang hiển thị ${shown.length} / ${matching.length} hồ sơ`;
    const more=$('#people-show-more');more.hidden=matching.length<=6;more.textContent=state.peopleExpanded?'Thu gọn hồ sơ ↑':'Xem thêm hồ sơ ↗';
    $('#article-list').innerHTML=posts.length?posts.slice(0,8).map(p=>{
      // Ưu tiên ảnh bìa bài viết; nếu chưa có, dùng di ảnh Chức sắc đã công bố và có liên hệ.
      const linked=p.person_id?linkedPerson(p.person_id):null;
      const image=safeUrl(p.cover_url)||safeUrl(linked?.published?linked.image_url:'');
      const emptyArtwork='<div class="editorial-placeholder" aria-hidden="true"><span>✦</span><strong>TƯ LIỆU ĐẠO SỬ</strong><small>BIÊN KHẢO</small></div>';
      const artwork=image
        ?emptyArtwork+`<img src="${escape(image)}" alt="Ảnh bìa: ${escape(p.title)}" loading="lazy" decoding="async">`
        :emptyArtwork;
      return `<article class="article-row editorial-article">
        <button type="button" class="editorial-image" data-open-kind="posts" data-id="${escape(p.id)}" aria-label="Đọc bài: ${escape(p.title)}">${artwork}</button>
        <div class="editorial-copy">
          <span class="article-tag">${escape(p.category||'BIÊN KHẢO')} · ${escape(date(p.created_at))}</span>
          <h3>${escape(p.title)}</h3>
          <p>${escape(p.summary||'Bài khảo cứu trong kho tư liệu Đạo sử.')}</p>
          <button type="button" class="editorial-read" data-open-kind="posts" data-id="${escape(p.id)}">Đọc biên khảo <span aria-hidden="true">↗</span></button>
        </div>
      </article>`;
    }).join(''):'<div class="empty-state"><b>Chưa có bài biên khảo.</b>Ban Biên Tập đang sưu tầm tư liệu.</div>';
    $('#gallery-grid').innerHTML=media.length?media.map(m=>{const src=safeUrl(m.image_url);return `<button type="button" class="gallery-card" data-open-kind="media" data-id="${escape(m.id)}"><div class="gallery-visual">${src?`<img src="${escape(src)}" alt="${escape(m.title)}" loading="lazy">`:'<div class="gallery-placeholder"><b>✧</b><span>ẢNH TƯ LIỆU</span></div>'}</div><div><h3>${escape(m.title)}</h3><p>${escape(m.caption||'Bấm để xem thông tin ảnh.')}</p></div></button>`}).join(''):'<div class="empty-state"><b>Chưa có ảnh tư liệu.</b>Tải ảnh từ trang quản trị để lập thư viện ảnh.</div>';
    const groupKinds=[['videos','video-grid','Video Đạo Sử'],['obituaries','obituary-grid','Ai Tín'],['documents','document-grid','Tài liệu số hóa']];
    groupKinds.forEach(([kind,target,label])=>{
      const rows=publicRows(kind),el=$('#'+target);
      if(!el)return;
      el.innerHTML=rows.length?rows.map(x=>{
        const src=safeUrl(x.cover_url || (kind==='documents' && /\.(png|jpe?g|webp)(\?|$)/i.test(x.file_url||'')?x.file_url:''));
        const meta=kind==='obituaries'?x.memorial_date:kind==='documents'?[x.document_number,x.document_date].filter(Boolean).join(' · '):'Video Đạo Sử';
        const preview=kind==='videos'?`<div class="archive-thumb video-preview-slot" data-video-id="${escape(x.id)}">${videoPoster(x)}</div>`:`<div class="archive-thumb">${src?`<img src="${escape(src)}" alt="${escape(x.title)}" loading="lazy">`:`<div aria-hidden="true">${kind==='obituaries'?'✧':'▤'}</div>`}</div>`;
        return `<article class="archive-card ${kind==='videos'?'video-archive-card':''}">${preview}<div class="archive-card-copy"><span class="archive-type">${escape(label)} ${meta?' · '+escape(meta):''}</span><h3>${escape(x.title)}</h3><p>${escape(x.summary||'Tư liệu đang được bổ sung nội dung.')}</p><button type="button" class="link-button" data-open-kind="${kind}" data-id="${escape(x.id)}">${kind==='videos'?'Xem thông tin & nguồn':'Xem chi tiết'} ↗</button></div></article>`
      }).join(''):`<div class="empty-state"><b>Chưa có ${escape(label)}.</b>Ban Biên Tập đang tiếp nhận và sưu tầm tư liệu.</div>`;
    });
    if(state.admin){renderEditorList();renderInbox()}
  }
  // Liên kết QR dùng tuyến hash sẵn có: mở đúng hồ sơ và cả album ảnh liên quan.
  function archiveLink(kind,record){
    const base=location.origin+location.pathname.replace(/index\.html$/,'');
    return base+'#'+prefixNames[kind]+'/'+encodeURIComponent(record.slug);
  }
  function openDetail(kind,record,updateHash=true){
    if(!record)return;
    state.detail={kind,id:record.id};
    const title=recordTitle(kind,record);
    const src=safeUrl(record.cover_url||record.image_url||(kind==='documents'&&/\.(png|jpe?g|webp)(\?|$)/i.test(record.file_url||'')?record.file_url:''));
    const subtitle=kind==='people'?[record.rank,record.branch,record.subgroup,record.years].filter(Boolean).join(' · '):
      kind==='obituaries'?[record.deceased_name,record.memorial_date].filter(Boolean).join(' · '):
      kind==='documents'?[record.document_number,record.document_date].filter(Boolean).join(' · '):
      kind==='posts'?[record.category,date(record.created_at)].filter(Boolean).join(' · '):sectionNames[kind]||'';
    const body=kind==='people'?record.biography:kind==='media'?record.caption:record.body;
    const summary=record.summary||'';
    const person=kind!=='people'&&record.person_id?linkedPerson(record.person_id):null;
    const dateNotes=kind==='people'&&record.date_notes?`<p class="detail-meta">Ngày tháng: ${escape(record.date_notes)}</p>`:'';
    const url=safeUrl(kind==='videos'?record.video_url:kind==='documents'?record.file_url:'');
    const link=url?`<p class="detail-external"><a href="${escape(url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${kind==='videos'?(videoSource(record.video_url)?.type==='facebook'?'Xem trên Facebook':'Xem video gốc'):'Mở tài liệu số'} ↗</a></p>`:'';
    const visual=kind==='videos'?`<div class="detail-video-preview" data-video-id="${escape(record.id)}">${videoPoster(record)}</div>`:`<div class="detail-cover">${src?`<img src="${escape(src)}" alt="${escape(title)}">`:`<div class="portrait-placeholder">${escape(sectionNames[kind])}</div>`}</div>`;
    const archiveCode=record.archive_code||'';
    const archivePanel=archiveCode&&record.slug?`<section class="gdd-archive-qr" data-gdd-archive-qr data-archive-code="${escape(archiveCode)}" data-archive-url="${escape(archiveLink(kind,record))}">
      <div class="gdd-archive-qr-heading"><strong>MÃ ĐỊNH DANH TƯ LIỆU</strong><code>${escape(archiveCode)}</code></div>
      <div class="gdd-archive-qr-layout"><div class="gdd-archive-qr-frame"><div data-gdd-qr-graphic></div></div><div class="gdd-archive-qr-actions">
      <p>Quét mã để mở thẳng hồ sơ này trên website GIỮ ĐẠO GIỮA ĐỜI.</p>
      ${record.published?'':'<p class="gdd-archive-qr-warning">Bản nháp: đồng đạo chưa thể xem cho tới khi công bố.</p>'}
      <button class="btn btn-primary" type="button" data-gdd-qr-download>Tải mã QR PNG</button>
      <button class="btn btn-outline" type="button" data-gdd-qr-copy>Sao chép liên kết</button>
      <small class="gdd-archive-qr-status" data-gdd-qr-status></small></div></div></section>`:'';
    $('#detail-content').innerHTML=`<div class="eyebrow">${escape(sectionNames[kind])}</div><h2 class="detail-title">${escape(title)}</h2><p class="detail-meta">${escape(subtitle)}</p>${dateNotes}${visual}${['people','posts'].includes(kind)?statusTag(record):''}${summary?`<p class="detail-summary">${escape(summary)}</p>`:''}${person?`<p class="detail-meta">Hồ sơ liên quan: ${escape(person.full_name)}</p>`:''}<div class="detail-body">${escape(body||'Nội dung đang được bổ sung.')}</div>${link}<div class="detail-source"><strong>NGUỒN TƯ LIỆU & GHI CHÚ</strong>${escape(record.sources||'Chưa cập nhật nguồn tư liệu.')}</div>${archivePanel}${state.admin?`<p><button class="btn btn-outline" type="button" data-edit-kind="${escape(kind)}" data-edit-id="${escape(record.id)}">Chỉnh sửa tư liệu</button></p>`:''}`;
    $('#detail-overlay').hidden=false;document.body.classList.add('modal-open');$('.detail-panel').scrollTop=0;
    if(updateHash){history.replaceState(null,'',`#${prefixNames[kind]}/${encodeURIComponent(record.slug)}`)}
  }
  function closeDetail(){ $('#detail-overlay').hidden=true;$('#detail-content').replaceChildren();state.detail=null;document.body.classList.remove('modal-open');if(/^#(nhan-vat|bai-viet|hinh-anh-tu-lieu|video-dao-su|ai-tin|tai-lieu-so-hoa)\//.test(location.hash))history.replaceState(null,'','#chuc-sac') }
  function syncHash(){const match=location.hash.match(/^#([^/]+)\/(.+)$/);if(!match)return;const kind=kindFromPrefix[match[1]];if(!kind)return;const slug=decodeURIComponent(match[2]);const row=publicRows(kind).find(x=>x.slug===slug);if(row)openDetail(kind,row,false)}

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
   
if(type==='lunar-day'||type==='lunar-month')return `<label>${escape(label)}<input type="number" name="${name}" min="1" max="${type==='lunar-day'?'30':'12'}" step="1" inputmode="numeric" placeholder="${type==='lunar-day'?'Ngày':'Tháng'}"></label>`;
    if(type==='date')return `<label>${escape(label)}<input type="date" name="${name}"></label>`;
    if(type==='gender')return `<label>${escape(label)}<select name="gender" required><option value="">Chọn Nam hoặc Nữ</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></label>`;
  
     if(type==='branch')return `<label>${escape(label)}<select name="${name}"><option value="Cửu Trùng Đài">Cửu Trùng Đài</option><option value="Hiệp Thiên Đài">Hiệp Thiên Đài</option><option value="Phước Thiện">Phước Thiện</option><option value="Hành chánh Đạo">Hành chánh Đạo</option><option value="Khác">Khác</option></select></label>`;
    if(type==='subgroup')return `<label>${escape(label)}<select name="subgroup"><option value="">Chưa phân loại</option>${allSubgroups.map(g=>`<option value="${escape(g)}">${escape(g)}</option>`).join('')}</select></label>`;
    if(type==='person')return `<label>${escape(label)}<select name="person_id"><option value="">Không liên kết</option>${state.data.people.map(p=>`<option value="${escape(p.id)}">${escape(p.full_name)}</option>`).join('')}</select></label>`;
    if(type==='video-file')return `<label>${escape(label)}<input type="file" name="video_file" accept="video/*,.mp4,.webm"></label><p class="help">Chọn tệp MP4 (H.264 khuyên dùng) hoặc WebM, tối đa 45 MB. Tệp MOV từ iPhone cần xuất thành MP4 trước để xem tốt trên Android và máy tính. Với video lớn đã đăng trên Page, hãy dán đường dẫn Facebook vào ô phía trên. Video tải lên sẽ ở kho công khai khi có đường dẫn.</p>`;
    if(type==='file'){const docs=state.editorKind==='documents';return `<label>${escape(label)}<input type="file" name="file" accept="${docs?'application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif':'image/jpeg,image/png,image/webp,image/heic,image/heif'}"></label><p class="help">${docs?'PDF tối đa 15 MB; ảnh gốc lớn tự tối ưu dưới 6 MB.':'JPG/PNG/WebP và HEIC (nếu hỗ trợ) tự tối ưu trước khi lưu dưới 6 MB.'} Giữ bản gốc ở nơi lưu trữ riêng.</p>`;}
    if(type==='long'||type==='textarea')return `<label>${escape(label)}<textarea name="${name}" class="${type==='long'?'tall':''}"${req}></textarea></label>`;
    return `<label>${escape(label)}<input type="${type==='url'?'url':'text'}" name="${name}"${req}></label>`;
  }

  // Xem trước nhóm mã định danh. Bộ đếm thực tế và việc chống trùng được xử lý trong Supabase.
  function personCodeCategory(branch,rank,subgroup,name){
    const b=norm(branch),r=norm(rank),g=norm(subgroup),n=norm(name);
    const has=(value,term)=>value.includes(term);
    if(has(b,'cuu trung')){
      if(has(g,'ban kien truc')||has(r,'ban kien truc'))return 'CTD.BKT';
      if(has(r,'chanh phoi su'))return 'CTD.CPT';
      if(has(r,'giao tong'))return 'CTD.GT';
      if(has(r,'chuong phap')||has(n,'chuong phap'))return 'CTD.CP';
      if(has(r,'dau su'))return 'CTD.ĐS';
      if(has(r,'phoi su'))return 'CTD.PS';
      if(has(r,'giao su'))return 'CTD.GS';
      if(has(r,'giao huu'))return 'CTD.GH';
      if(has(r,'le sanh'))return 'CTD.LS';
      if(has(r,'chuc viec')||has(r,'pho tri su')||has(r,'chanh tri su'))return 'CTD.CV';
      if(has(r,'dao huu'))return 'CTD.DH';
      return 'CTD.KH';
    }
    if(has(b,'hiep thien')){
      if(has(g,'bo phap chanh')||has(r,'bo phap chanh'))return 'HTD.BPC';
      if(has(g,'bo nhac')||has(r,'bo nhac'))return 'HTD.BN';
      if(has(g,'ban the dao')||has(r,'ban the dao'))return 'HTD.BTD';
      if(has(r,'ho phap'))return 'HTD.HP';
      if(has(r,'thuong pham'))return 'HTD.TP';
      if(has(r,'thuong sanh'))return 'HTD.TS';
      if(has(r,'chon quan')||has(r,'thoi quan'))return 'HTD.TQ';
      return 'HTD.CQK';
    }
    if(has(b,'phuoc thien')){
      for(const [text,code] of [['thanh nhon','TN'],['chon nhon','CN'],['hien nhon','HN'],['dao nhon','DN'],['giao thien','GT'],['chi thien','CT'],['thua su','TT']])
        if(has(r,text))return 'PT.'+code;
      return 'PT.KH';
    }
    if(has(b,'hanh chanh')){
      if(has(g,'ban the dao')||has(r,'ban the dao'))return 'HCD.BTD';
      if(has(r,'chuc viec')||has(r,'tri su'))return 'HCD.CV';
      return 'HCD.KH';
    }
    return 'KH.KH';
  }
  function refreshPersonCodePreview(){
    const form=$('#editor-form'),target=$('#person-code-preview');
    if(!target||state.editorKind!=='people')return;
    const saved=state.editingId?state.data.people.find(p=>p.id===state.editingId):null;
    if(saved?.archive_code){
      target.innerHTML='<b>Mã định danh đã cấp:</b> <code>'+escape(saved.archive_code)+'</code>'+
        '<small>Mã được giữ cố định để tra cứu lâu dài; sửa thông tin không tự đổi mã cũ.</small>';
      return;
    }
    const get=name=>form.elements[name]?.value||'';
    const branch=get('branch'),rank=get('rank');
    if(!branch||!rank){target.textContent='Chọn Cơ quan/Hệ thống và nhập Phẩm vị để xem trước nhóm mã.';return;}
    const category=personCodeCategory(branch,rank,get('subgroup'),get('full_name'));
    const unknown=category.endsWith('.KH')||category==='HTD.CQK';
    target.innerHTML='<b>Nhóm mã sẽ được cấp:</b> <code>CS-'+escape(category)+'-0000X</code>'+
      '<small>Số thứ tự thật sẽ được Supabase tự cấp khi lưu lần đầu; mỗi nhóm bắt đầu từ 00001.'+
      (unknown?' Nhóm chưa xác định chính xác phẩm vị: xin kiểm tra thông tin trước khi đăng.':'')+'</small>';
  }

  function buildEditor(){
    const kind=state.editorKind;$('#editor-heading').textContent=state.editingId?'Sửa tư liệu':'Thêm '+(sectionNames[kind]||'tư liệu');
    $$('.editor-tabs button').forEach(b=>b.classList.toggle('is-selected',b.dataset.kind===kind));
    $('#editor-form').innerHTML=fields[kind].map(labelHTML).join('')+(kind==='people'?'<div class="gdd-person-code-preview" id="person-code-preview" aria-live="polite"></div>':'')+`<div class="form-actions"><button class="btn btn-primary" type="submit">${state.editingId?'Lưu thay đổi':'Đăng tư liệu'}</button>${state.editingId?'<button class="btn-delete" type="button" id="delete-record">Xóa tư liệu</button>':''}</div><p id="form-message" class="small-note" aria-live="polite"></p>`;
    if(state.editingId){const record=state.data[kind].find(x=>x.id===state.editingId);if(record){const form=$('#editor-form');for(const name of schema[kind]){const el=form.elements[name];if(!el)continue;if(el.type==='checkbox')el.checked=Boolean(record[name]);else el.value=record[name]??''}}}
    if(kind==='people')refreshPersonCodePreview();
  }
  function renderEditorList(){if(!state.admin)return;const kind=state.editorKind;$('#editor-list').innerHTML=state.data[kind].length?state.data[kind].map(r=>`<div class="editor-item"><div><b>${escape(recordTitle(kind,r))}</b><span>${r.published?'Đã công bố':'Bản nháp'} · ${escape(date(r.created_at))} · ${escape(r.archive_code||'Chưa có mã')}</span></div><button type="button" data-list-qr="${escape(kind)}" data-id="${escape(r.id)}" aria-label="Xem mã QR">QR</button><button type="button" data-list-edit="${escape(kind)}" data-id="${escape(r.id)}">Sửa</button></div>`).join(''):'<p class="small-note">Chưa có tư liệu.</p>'}
  function editRecord(kind,id){state.editorKind=kind;state.editingId=id;closeDetail();$('#admin-overlay').hidden=false;document.body.classList.add('modal-open');buildEditor();$('.admin-panel').scrollTop=120}
  async function uploadImage(file,kind){
    if(!file)return '';
    if(file.type==='application/pdf'){
      if(kind!=='documents')throw Error('PDF chỉ dành cho mục Tài liệu số hóa.');
      if(file.size>15*1024*1024)throw Error('PDF vượt quá 15 MB.');
    }else{
      if(!window.GDDImageOptimizer)throw Error('Bộ tối ưu ảnh chưa tải xong. Hãy tải lại trang.');
      file=await window.GDDImageOptimizer.prepare(file,{onStatus:message=>{
        const el=$('#form-message');if(el)el.textContent=message;
      }});
    }
    const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
    if(!types[file.type])throw Error('Tệp không đúng định dạng hỗ trợ.');
    const bucket=file.type==='application/pdf'?'dao-su-documents':'dao-su-images';
    const path=`${kind}/${Date.now()}-${Math.random().toString(36).slice(2,11)}.${types[file.type]}`;
    const {error}=await state.supabase.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
    if(error)throw error;
    return state.supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  // Video dưới 6 MB dùng tải thường; video lớn dùng TUS 6 MB/chunk để giảm lỗi mạng.
  async function uploadVideo(file,onProgress){
    if(!file)return '';
    const ext=(file.name||'').split('.').pop().toLowerCase();
    const mime=ext==='mp4'?'video/mp4':ext==='webm'?'video/webm':'';
    if(!mime || (file.type && !['video/mp4','video/webm','application/octet-stream'].includes(file.type))){
      throw new Error('Chỉ hỗ trợ MP4 hoặc WebM. Video MOV của iPhone cần chuyển thành MP4 (H.264) để phát trên mọi thiết bị.');
    }
    if(file.size>45*1024*1024)throw new Error('Video vượt quá 45 MB. Bạn hãy nén video hoặc dùng đường dẫn YouTube.');
    if(file.size===0)throw new Error('Không thể tải tệp video rỗng.');
    const path=`videos/${Date.now()}-${Math.random().toString(36).slice(2,12)}.${ext}`;
    const storage=state.supabase.storage.from('dao-su-videos');
    if(file.size<=6*1024*1024){
      const {error}=await storage.upload(path,file,{contentType:mime,upsert:false,cacheControl:'3600'});
      if(error)throw error;
      onProgress?.(100);
    }else{
      const {data:{session},error:sessionError}=await state.supabase.auth.getSession();
      if(sessionError||!session?.access_token)throw new Error('Phiên đăng nhập quản trị hết hạn. Hãy đăng nhập lại.');
      let tus;
      try{tus=await import('https://cdn.jsdelivr.net/npm/tus-js-client@4/+esm')}catch{throw new Error('Không tải được thư viện tải video từng phần. Hãy kiểm tra kết nối mạng.');}
      const endpoint=new URL(config.supabaseUrl);
      endpoint.hostname=endpoint.hostname.replace(/\.supabase\.co$/i,'.storage.supabase.co');
      endpoint.pathname='/storage/v1/upload/resumable';
      endpoint.search='';
      await new Promise((resolve,reject)=>{
        const upload=new tus.Upload(file,{
          endpoint:endpoint.href,
          retryDelays:[0,3000,5000,10000,20000],
          uploadDataDuringCreation:true,
          removeFingerprintOnSuccess:true,
          chunkSize:6*1024*1024,
          headers:{authorization:`Bearer ${session.access_token}`},
          metadata:{bucketName:'dao-su-videos',objectName:path,contentType:mime,cacheControl:'3600'},
          onError:reject,
          onProgress:(uploaded,total)=>onProgress?.(Math.min(100,Math.round(uploaded/total*100))),
          onSuccess:resolve
        });
        // Tên đường dẫn ngẫu nhiên: luôn bắt đầu phiên mới để tránh nối nhầm
        // phiên tải dở của cùng tệp với đường dẫn khác.
        upload.start();
      });
    }
    return storage.getPublicUrl(path).data.publicUrl;
  }
  async function saveRecord(e){
    e.preventDefault();
    if(!state.admin)return toast('Tài khoản chưa có quyền biên tập.');
    const form=e.currentTarget;
    const btn=$('button[type="submit"]',form);
    const kind=state.editorKind;
    const record=state.data[kind].find(x=>x.id===state.editingId);
    const albums=window.GDDAlbums;
    btn.disabled=true;
    $('#form-message').textContent='Đang kiểm tra và lưu tư liệu…';
    try{
      // Kiểm tra toàn bộ bộ ảnh trước khi ghi một bản ghi mới.
      albums?.validatePending?.();
      const data={};
      for(const name of schema[kind]){
        const el=form.elements[name];
        if(!el)continue;
        data[name]=el.type==='checkbox'?el.checked:el.value.trim()||null;
      }
      if(kind==='people'){
        const d=data.death_lunar_day,m=data.death_lunar_month;
        if(Boolean(d)!==Boolean(m))throw new Error('Ngày kỷ niệm qui vị phải nhập đủ ngày và tháng âm lịch.');
        if(d&&(!Number.isInteger(Number(d))||Number(d)<1||Number(d)>30||
           !Number.isInteger(Number(m))||Number(m)<1||Number(m)>12))
          throw new Error('Ngày qui vị âm lịch phải từ 1–30, tháng từ 1–12.');
        if(data.death_lunar_leap&&!d)throw new Error('Chỉ chọn tháng nhuận khi có ngày và tháng âm lịch.');
      }
      const selectedVideo=kind==='videos'?form.elements.video_file?.files?.[0]:null;
      if(kind==='videos'&&!data.video_url&&!selectedVideo){
        throw new Error('Hãy dán liên kết Facebook/YouTube hoặc chọn video MP4 từ điện thoại.');
      }
      if(selectedVideo){
        data.video_url=await uploadVideo(selectedVideo,progress=>{
          $('#form-message').textContent=`Đang tải video: ${progress}%. Đừng đóng trang khi đang tải.`;
        });
      }
      const file=form.elements.file?.files?.[0];
      if(file){
        const url=await uploadImage(file,kind);
        data[kind==='documents'?'file_url':(['posts','videos','obituaries'].includes(kind)?'cover_url':'image_url')]=url;
      }
      if(!record)data.slug=slugify(data.full_name||data.title)+'-'+Date.now().toString(36).slice(-6);
      // Lấy đúng ID từ câu lệnh insert/update để gắn toàn bộ ảnh vào bài, không cần người dùng bấm Sửa.
      const request=record?state.supabase.from(kind).update(data).eq('id',record.id):state.supabase.from(kind).insert(data);
      const {data:saved,error}=await request.select('id,archive_code').single();
      if(error)throw error;
      const savedId=saved?.id||record?.id;
      if(!savedId)throw new Error('Đã lưu dữ liệu nhưng không lấy được mã bài viết.');
      // Nếu việc tải ảnh thất bại, lần bấm sau cập nhật bài này, KHÔNG tạo thêm bài mới.
      state.editingId=savedId;
      // Giữ lại URL đã tải nếu người dùng phải thử tải album thêm lần nữa.
      for(const name of ['video_url','cover_url','file_url','image_url']){
        if(data[name]&&form.elements[name])form.elements[name].value=data[name];
      }
      if(form.elements.file)form.elements.file.value='';
      if(form.elements.video_file)form.elements.video_file.value='';
      try{
        if(albums?.pendingCount?.()){
          await albums.uploadPending(kind,savedId,message=>{
            $('#form-message').textContent=message;
          });
        }
      }catch(albumError){
        await fetchData();
        $('#form-message').textContent='Bài viết đã được lưu, nhưng một số ảnh chưa tải xong: '+
          (albumError.message||String(albumError))+' Nhấn “Hoàn tất ảnh còn lại” để thử lại, không tạo bài mới.';
        btn.textContent='Hoàn tất ảnh còn lại';
        toast('Đã lưu bài. Một số ảnh chưa tải xong, có thể thử lại.');
        return;
      }
      await fetchData();
      if(kind==='people')window.dispatchEvent(new Event('gdd:people-anniversary-refresh'));
      state.editingId=null;
      albums?.resetAfterSuccess?.();
      buildEditor();
      toast('Đã lưu tư liệu '+(saved?.archive_code||'')+' và bộ ảnh.');
    }catch(err){
      $('#form-message').textContent='Không thể lưu: '+(err.message||'Lỗi không xác định');
      toast('Lỗi lưu tư liệu. Vui lòng xem thông báo dưới nút đăng.');
    }finally{
      btn.disabled=false;
    }
  }
  async function deleteRecord(){
    const kind=state.editorKind,id=state.editingId;if(!id||!state.admin)return;
    if(!window.confirm('Xóa vĩnh viễn mục tư liệu này khỏi cơ sở dữ liệu? Hình đã tải lên Storage sẽ không tự động bị xóa.'))return;
    try{const {error}=await state.supabase.from(kind).delete().eq('id',id);if(error)throw error;state.editingId=null;await fetchData();buildEditor();toast('Đã xóa mục tư liệu.')}catch(err){toast('Không xóa được: '+err.message)}
  }
  async function fetchData(){
    if(!state.supabase)return;
    const kinds=['people','posts','media','videos','obituaries','documents'];
    const results=await Promise.all(kinds.map(async k=>({kind:k,...(await state.supabase.from(k).select('*').order('created_at',{ascending:false}).limit(500))})));
    const errors=[];
    results.forEach(r=>{if(r.error){errors.push(r.kind);state.data[r.kind]=[]} else state.data[r.kind]=r.data||[]});
    if(errors.length){toast('Một số chuyên mục chưa được khởi tạo trên Supabase: '+errors.join(', ')+'. Hãy chạy file SQL nâng cấp.');}
    if(state.admin){
      const {data,error}=await state.supabase.from('submissions').select('*').order('created_at',{ascending:false}).limit(200);
      state.data.submissions=error?[]:data||[];
    } else state.data.submissions=[];
    updateSubgroupFilter();render();syncHash();
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
  function updateSubgroupFilter(preferred='all'){
    const branch=$('#branch-filter').value,select=$('#subgroup-filter');
    const current=preferred==='all'?select.value:preferred;
    const labels=branch==='all'?allSubgroups:subgroupLabels[branch]||[];
    select.innerHTML='<option value="all">Tất cả phân nhóm</option>'+labels.map(s=>`<option value="${escape(s)}">${escape(s)}</option>`).join('');
    select.value=labels.includes(current)?current:'all';
    select.disabled=labels.length===0;
  }
  const fileTypes={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'};
  async function submitContribution(e){
    e.preventDefault();const form=e.currentTarget,notice=$('#submission-status'),btn=form.querySelector('[type="submit"]');
    if(!state.supabase){notice.textContent='Chức năng gửi tư liệu cần kết nối Supabase.';return}
    if(form.elements.website.value)return;
    if(!form.reportValidity())return;
    btn.disabled=true;notice.textContent='Đang tiếp nhận tư liệu…';
    try{
      let file=form.elements.attachment.files[0];let filePath=null;
      if(file){
        if(file.type==='application/pdf'){
          if(file.size>6*1024*1024)throw Error('Tệp PDF gửi đến tối đa 6 MB.');
        }else{
          if(!window.GDDImageOptimizer)throw Error('Chưa có bộ tối ưu ảnh, xin tải lại trang.');
          file=await window.GDDImageOptimizer.prepare(file,{onStatus:msg=>{notice.textContent=msg;}});
        }
        if(!fileTypes[file.type])throw Error('Chỉ nhận ảnh JPEG, PNG, WebP hoặc tệp PDF.');
        filePath=`pending/${Date.now()}-${Math.random().toString(36).slice(2,12)}.${fileTypes[file.type]}`;
        const {error}=await state.supabase.storage.from('dao-su-submissions').upload(filePath,file,{contentType:file.type,upsert:false});
        if(error)throw error;
      }
      const data={sender_name:form.elements.sender_name.value.trim(),sender_email:form.elements.sender_email.value.trim(),category:form.elements.category.value,title:form.elements.title.value.trim(),description:form.elements.description.value.trim(),source:form.elements.source.value.trim()||null,source_url:form.elements.source_url.value.trim()||null,file_path:filePath,status:'pending'};
      const {error}=await state.supabase.from('submissions').insert(data);
      if(error)throw error;
      form.reset();notice.textContent='Đã tiếp nhận tư liệu. Cảm ơn quí Huynh Tỷ Đệ Muội! Ban Biên Tập sẽ xem xét trước khi công bố.';
    }catch(err){notice.textContent='Chưa gửi được: '+(err.message||'Vui lòng thử lại.');}
    finally{btn.disabled=false}
  }
  function renderInbox(){
    if(!state.admin)return;
    const el=$('#submission-inbox'),rows=state.data.submissions||[];
    el.innerHTML=rows.length?rows.map(x=>`<div class="submission-row"><div><b>${escape(x.title)}</b><span>${escape(x.category)} · ${escape(x.sender_name)} · ${escape(date(x.created_at))} · ${x.status==='reviewed'?'Đã xem':'Chưa xem'}</span></div><button type="button" data-submission-open="${escape(x.id)}">Xem</button></div>`).join(''):'<p class="small-muted">Chưa có tư liệu được gửi đến.</p>';
  }
  async function showSubmission(id){
    if(!state.admin)return;
    const item=state.data.submissions.find(x=>x.id===id),el=$('#submission-reader');if(!item)return;
    el.hidden=false;el.textContent='Đang mở tư liệu…';
    let attachment='';
    if(item.file_path&&item.file_path.startsWith('pending/')){
      const {data,error}=await state.supabase.storage.from('dao-su-submissions').createSignedUrl(item.file_path,600);
      if(!error&&data?.signedUrl)attachment=`<p><a href="${escape(safeUrl(data.signedUrl))}" rel="noopener noreferrer" target="_blank" class="btn btn-outline">Mở tệp đính kèm (liên kết 10 phút) ↗</a></p>`;
    }
    el.innerHTML=`<h4>${escape(item.title)}</h4><p><b>Người gửi:</b> ${escape(item.sender_name)} · <b>Email:</b> ${escape(item.sender_email)}</p><p><b>Chuyên mục:</b> ${escape(item.category)}</p><p class="submitted-content">${escape(item.description)}</p><p><b>Xuất xứ:</b> ${escape(item.source||'Chưa có')}</p>${safeUrl(item.source_url)?`<p><a target="_blank" rel="noopener noreferrer" href="${escape(safeUrl(item.source_url))}">Mở liên kết nguồn ↗</a></p>`:''}${attachment}<button type="button" data-mark-reviewed="${escape(item.id)}" ${item.status==='reviewed'?'disabled':''}>${item.status==='reviewed'?'Đã xem':'Đánh dấu đã xem'}</button>`;
  }
  async function markReviewed(id){
    if(!state.admin)return;
    const {error}=await state.supabase.from('submissions').update({status:'reviewed'}).eq('id',id);
    if(error){toast('Không cập nhật được trạng thái: '+error.message);return}
    await fetchData();showSubmission(id);toast('Đã đánh dấu là đã xem.');
  }
  function bindEvents(){
    $('#year').textContent=new Date().getFullYear();
    $('#people-search').addEventListener('input',()=>{state.peopleExpanded=false;render()});
    $('#branch-filter').addEventListener('change',()=>{state.peopleExpanded=false;updateSubgroupFilter();render()});
    $('#subgroup-filter').addEventListener('change',()=>{state.peopleExpanded=false;render()});
    $('#people-show-more').addEventListener('click',()=>{state.peopleExpanded=!state.peopleExpanded;render()});
    $('#menu-toggle').addEventListener('click',()=>{const open=$('#main-nav').classList.toggle('is-open');$('#menu-toggle').setAttribute('aria-expanded',String(open))});
    $$('#main-nav a').forEach(a=>a.addEventListener('click',()=>{
      if(a.hasAttribute('data-branch')){
        $('#branch-filter').value=a.dataset.branch;
        updateSubgroupFilter(a.dataset.subgroup||'all');
        state.peopleExpanded=false;render();
      }
      $('#main-nav').classList.remove('is-open');$('#menu-toggle').setAttribute('aria-expanded','false');
      const deep=$('#nav-chuc-sac');if(deep)deep.open=false;
    }));
    $('#contribute-form').addEventListener('submit',submitContribution);
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
    $('#editor-form').addEventListener('input',refreshPersonCodePreview);
    $('#editor-form').addEventListener('change',refreshPersonCodePreview);
    document.addEventListener('click',e=>{
      const playback=e.target.closest('[data-video-play]');if(playback){playVideo(playback.dataset.videoPlay,playback);return}
      const close=e.target.closest('[data-close]');if(close){if(close.dataset.close==='detail')closeDetail();else closeAdmin();return}
      const open=e.target.closest('[data-open-kind]');if(open){const kind=open.dataset.openKind,record=publicRows(kind).find(x=>x.id===open.dataset.id);openDetail(kind,record);return}
      const edit=e.target.closest('[data-edit-kind]');if(edit){editRecord(edit.dataset.editKind,edit.dataset.editId);return}
      const listEdit=e.target.closest('[data-list-edit]');if(listEdit){editRecord(listEdit.dataset.listEdit,listEdit.dataset.id);return}
      const qr=e.target.closest('[data-list-qr]');if(qr){const kind=qr.dataset.listQr,record=state.data[kind]?.find(x=>x.id===qr.dataset.id);if(record){closeAdmin();openDetail(kind,record)}return}
      const incoming=e.target.closest('[data-submission-open]');if(incoming){showSubmission(incoming.dataset.submissionOpen);return}
      const reviewed=e.target.closest('[data-mark-reviewed]');if(reviewed){markReviewed(reviewed.dataset.markReviewed);return}
      if(e.target.id==='delete-record')deleteRecord();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#detail-overlay').hidden)closeDetail();else if(!$('#admin-overlay').hidden)closeAdmin()}});
    window.addEventListener('hashchange',syncHash);
    const ob=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){$$('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===entry.target.id))}})},{rootMargin:'-25% 0px -55% 0px'});
    $$('.section-anchor').forEach(s=>ob.observe(s));
  }
  bindEvents();initSupabase();
})();
