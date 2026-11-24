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
  const state = { data:{people:[],posts:[],media:[],videos:[],obituaries:[],documents:[],submissions:[]},supabase:null,admin:false,user:null,editorKind:'people',editingId:null,peopleExpanded:false,editorListExpanded:false,galleryCategory:'all',documentSubfolder:'browse',placements:[],galleryImages:[],transferSelection:null,detail:null,usingFallback:false };
  const schema = {
    people:['full_name','secular_name','rank','branch','subgroup','gender','years','birthplace','summary','biography','date_notes','death_lunar_day','death_lunar_month','death_lunar_leap','death_solar_date','sources','image_url','verified','published'],
    posts:['title','category','summary','body','sources','person_id','cover_url','verified','published'],
    media:['title','category','caption','sources','person_id','image_url','published'],
    videos:['title','summary','body','video_url','cover_url','sources','person_id','published'],
    obituaries:['title','deceased_name','memorial_date','summary','body','cover_url','sources','person_id','published'],
    documents:['title','subfolder_code','document_number','document_date','summary','body','file_url','sources','person_id','published']
  };
  const fields = {
    people:[['full_name','Danh xưng / tên Chức sắc','text',1],['secular_name','Thế danh','text'],['rank','Phẩm vị','text'],['branch','Cơ quan / hệ thống','branch'],['subgroup','Phân nhóm Chức sắc','subgroup'],
['gender','Phân loại Chức sắc Nam / Nữ','gender',1],
  ['years','Năm sanh – qui vị','text'],['birthplace','Nguyên quán','text'],['summary','Tóm tắt ngắn','textarea'],['biography','Tiểu sử / công nghiệp (nội dung đầy đủ)','long',1],['date_notes','Ngày tháng Âm – Dương lịch','text'],['death_lunar_day','Ngày qui vị ÂM lịch (1–30)','lunar-day'],['death_lunar_month','Tháng qui vị ÂM lịch (1–12)','lunar-month'],['death_lunar_leap','Ngày qui vị thuộc tháng nhuận','check'],['death_solar_date','Ngày qui vị DƯƠNG lịch (nếu biết)','date'],['sources','Nguồn sử liệu / chú thích','textarea'],['image_url','Địa chỉ ảnh (URL), nếu có','url'],['file','Hoặc tải di ảnh lên','file'],['verified','Đã đối chiếu nguồn sử liệu','check'],['published','Công bố trên website','check']],
    posts:[['title','Tiêu đề bài viết','text',1],['category','Chuyên mục','text'],['summary','Dẫn nhập / tóm tắt','textarea'],['body','Nội dung biên khảo','long',1],['person_id','Hồ sơ Chức sắc liên quan','person'],['sources','Thư mục và nguồn trích dẫn','textarea'],['cover_url','Địa chỉ ảnh bìa (URL)','url'],['file','Hoặc tải ảnh bìa lên','file'],['verified','Đã đối chiếu nguồn sử liệu','check'],['published','Công bố trên website','check']],
    media:[['title','Tên ảnh / văn kiện','text',1],['category','Chuyên mục Hình ảnh','gallery-category',1],['caption','Mô tả, niên đại, xuất xứ','long'],['person_id','Hồ sơ Chức sắc liên quan','person'],['sources','Người cung cấp / nguồn bản gốc','textarea'],['image_url','Địa chỉ ảnh (URL)','url'],['file','Tải hình ảnh lên','file'],['published','Công bố trên website','check']],
    videos:[['title','Tiêu đề video Đạo Sử','text',1],['summary','Tóm tắt','textarea'],['body','Nội dung / thuyết minh','long'],['video_url','Liên kết Facebook, YouTube hoặc MP4 (nếu có)','url'],['video_file','Hoặc chọn video MP4 từ album / tệp điện thoại','video-file'],['cover_url','Đường dẫn ảnh bìa (nếu có)','url'],['file','Hoặc tải ảnh bìa lên','file'],['person_id','Chức sắc liên quan','person'],['sources','Nguồn video / bản quyền / xuất xứ','textarea'],['published','Công bố trên website','check']],
    obituaries:[['title','Tiêu đề Ai Tín','text',1],['deceased_name','Danh xưng người quy vị','text'],['memorial_date','Ngày quy vị (Âm / Dương lịch)','text'],['summary','Lời dẫn ngắn','textarea'],['body','Nội dung Ai Tín / tưởng niệm','long'],['cover_url','Đường dẫn di ảnh','url'],['file','Hoặc tải di ảnh lên','file'],['person_id','Hồ sơ Chức sắc liên quan','person'],['sources','Nguồn tin / tài liệu xác minh','textarea'],['published','Công bố trên website','check']],
    documents:[['title','Tên tài liệu số hóa','text',1],['subfolder_code','Thư mục con Số hóa (bắt buộc)','document-subfolder',1],['document_number','Số hiệu văn kiện','text'],['document_date','Niên đại / ngày tháng văn kiện','text'],['summary','Mô tả ngắn','textarea'],['body','Nội dung giới thiệu / trích yếu','long'],['file_url','Liên kết file PDF hoặc ảnh','url'],['file','Hoặc tải PDF / ảnh tài liệu lên','file'],['person_id','Hồ sơ Chức sắc liên quan','person'],['sources','Xuất xứ bản gốc / nguồn lưu trữ','textarea'],['published','Công bố trên website','check']]
  };
  const subgroupLabels = {
    'Cửu Trùng Đài':['Chức Sắc Đại Thiên Phong Nam/Nữ','Chức Sắc Thiên Phong Nam/Nữ','Chức Việc và Đạo Hữu','Ban Kiến Trúc','Các Cơ Quan Hành Chánh Đạo khác'],
    'Hiệp Thiên Đài':['Chức Sắc Đại Thiên Phong Nam/Nữ','Bộ Pháp Chánh','Chức Sắc Bộ Nhạc','Ban Thế Đạo','Các Cơ Quan Hành Chánh Đạo khác'],
    'Phước Thiện':[], 'Hành chánh Đạo':[], 'Khác':[]
  };
  const allSubgroups = [...new Set(Object.values(subgroupLabels).flat())];
  const galleryCategories=["Tòa Thánh Tây Ninh xưa","Tang lễ Chức sắc","Hành đạo và Sinh hoạt Đạo","Dấu tích Đạo sử xưa và nay","Tư liệu hình ảnh khác"];

  const documentSubfolders=[
    {code:'HCĐ',title:'Tài Liệu Hành Chánh Đạo'},
    {code:'HTĐ',title:'Tài Liệu Chức Sắc Hiệp Thiên Đài'},
    {code:'CTĐ',title:'Tài Liệu Chức Sắc Cửu Trùng Đài'},
    {code:'PT',title:'Tài Liệu Chức Sắc Phước Thiện'},
    {code:'CQK',title:'Tài Liệu Các Cơ Quan Khác'}
  ];
  const documentSubfolderTitle=code=>documentSubfolders.find(f=>f.code===code)?.title||'Tài Liệu Các Cơ Quan Khác';
  const documentSubfolderOf=(kind,record)=>kind==='documents'&&documentSubfolders.some(f=>f.code===record.subfolder_code)?record.subfolder_code:'CQK';
  const galleryCategoryOf=record=>galleryCategories.includes(record?.category)?record.category:'Tư liệu hình ảnh khác';
  const sectionNames={people:'Hồ sơ Chức sắc',posts:'Bài biên khảo',media:'Hình ảnh',videos:'Video Đạo Sử',obituaries:'Ai Tín',documents:'Tài liệu số hóa'};
  const prefixNames={people:'nhan-vat',posts:'bai-viet',media:'hinh-anh-tu-lieu',videos:'video-dao-su',obituaries:'ai-tin',documents:'tai-lieu-so-hoa'};
  const kindFromPrefix=Object.fromEntries(Object.entries(prefixNames).map(([kind,prefix])=>[prefix,kind]));
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').toLowerCase();
  const slugify = s => norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,72) || 'tu-lieu';
  const safeUrl = s => {try{const u=new URL(String(s));return ['https:','http:'].includes(u.protocol)?u.href:''}catch{return ''}};
  // Switch to R2 lightweight previews only after the independently gated release.
  // The archived source URL is never rewritten in Supabase; admin always sees the original.
  const displayImageUrl=raw=>{
    const source=safeUrl(raw);
    if(!source)return source;
    return safeUrl(window.GDDLegacyImages?.displayUrl(source)||source);
  };
  // Old unpublished records are not part of the public R2 allowlist.
  // Only a verified admin may request a short-lived signed Supabase URL,
  // and only after a private-bucket image cannot be displayed.
  document.addEventListener('error',async event=>{
    const img=event.target;
    if(!state.admin||!(img instanceof HTMLImageElement)||!state.supabase||img.dataset.gddSignedRetry)return;
    const url=safeUrl(img.currentSrc||img.src);
    const prefix=config.supabaseUrl+'/storage/v1/object/public/';
    if(!url.startsWith(prefix))return;
    let parsed;try{parsed=new URL(url)}catch{return}
    const rel=parsed.pathname.slice('/storage/v1/object/public/'.length);
    const bucket=rel.split('/')[0];
    if(!['dao-su-images','dao-su-documents'].includes(bucket))return;
    const key=decodeURIComponent(rel.slice(bucket.length+1));
    if(!key||key.includes('..')||key.length>600)return;
    img.dataset.gddSignedRetry='1';
    try{
      const {data,error}=await state.supabase.storage.from(bucket).createSignedUrl(key,600);
      if(error||!data?.signedUrl)throw error||Error('Chưa ký được liên kết riêng tư');
      if(img.isConnected&&state.admin)img.src=data.signedUrl;
    }catch(e){console.warn('[GDD Admin private image] Không đọc được ảnh cũ:',e?.message||e)}
  },true);

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
    const source=videoSource(record.video_url),picture=displayImageUrl(record.cover_url)||(source?.type==='youtube'?source.poster:'');
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
      if(displayImageUrl(record.cover_url))player.poster=displayImageUrl(record.cover_url);
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
  // Free-tier bandwidth emergency mode: limit full-resolution images loaded in public lists.
  // The source URL remains intact in Supabase and full detail pages continue showing it.
  const portrait = (p,showPreview=true) => {const src=showPreview?displayImageUrl(p.image_url):'';return src?`<img src="${escape(src)}" alt="Di ảnh ${escape(p.full_name)}" loading="lazy">`:`<div class="portrait-placeholder"><span class="symbol">${escape((p.secular_name||p.full_name||'Đ').trim().split(/\s+/).slice(-1)[0].charAt(0).toUpperCase())}</span></div>`};
  const toast = message => {const el=$('#toast');el.textContent=message;el.classList.add('is-visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('is-visible'),4500)};
  const publicRows = kind => state.admin?state.data[kind]:state.data[kind].filter(x=>x.published);
  const recordTitle = (kind,x) => kind==='people'?x.full_name:x.title;
  const linkedPerson = personId => state.data.people.find(x=>x.id===personId);
  // Chỉ đổi mục hiển thị. Bài gốc, ảnh, mã định danh và liên kết QR không bị chuyển.
  const movableKinds=['posts','media','videos','obituaries','documents'];
  const placementOf=(kind,record)=>state.placements.find(p=>p.owner_kind===kind&&p.owner_id===record.id);
  const displayTarget=(kind,record)=>placementOf(kind,record)?.target_kind||kind;
  const displayGalleryCategory=(kind,record)=>{
    const placement=placementOf(kind,record);
    return placement?.target_kind==='media'&&galleryCategories.includes(placement.target_category)
      ?placement.target_category:galleryCategoryOf(record);
  };
  const displayedEntries=target=>movableKinds.flatMap(originKind=>
    publicRows(originKind).filter(record=>displayTarget(originKind,record)===target)
      .map(record=>({record,originKind}))
  ).sort((a,b)=>{
    const newest=e=>new Date(placementOf(e.originKind,e.record)?.updated_at||e.record.created_at||0).getTime();
    return newest(b)-newest(a);
  });
  const imageFromRecord=(x,kind='')=>{
    const original=x.cover_url||x.image_url||
      ((/\.(png|jpe?g|webp)(\?|$)/i.test(x.file_url||'')||window.GDDPrivatePublishing?.isPreviewURL?.(x.file_url))?x.file_url:'');
    if(original)return displayImageUrl(original);
    if(!kind||!x?.id)return '';
    const album=state.galleryImages.filter(item=>
      item.owner_kind===kind&&item.owner_id===x.id&&item.image_url)
      .sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
    return displayImageUrl(album[0]?.image_url||'');
  };


  // R2 public viewer: only an explicit approved page reader, never a raw PDF URL.
  function isR2DocumentViewer(raw){
    if(!raw)return false;
    try{
      const u=new URL(raw,location.href);
      const id=u.searchParams.get('asset')||'';
      return u.protocol==='https:' &&
        u.origin==='https://realmetayninh7649-cmd.github.io' &&
        u.pathname==='/dau-xua-cua-dao/r2-xem.html' &&
        /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id);
    }catch{return false}
  }

  function render(){
    const people=publicRows('people'),posts=displayedEntries('posts'),media=displayedEntries('media');
    $('#count-people').textContent=people.length;$('#count-posts').textContent=posts.length;$('#count-media').textContent=media.length;
    const q=norm($('#people-search').value.trim()),branch=$('#branch-filter').value,subgroup=$('#subgroup-filter').value;
    const matching=people.filter(p=>(branch==='all'||(p.branch||'Khác')===branch)&&(subgroup==='all'||p.subgroup===subgroup)&&norm([p.archive_code,p.archive_legacy_code,...(p.archive_code_aliases||[]),p.full_name,p.secular_name,p.rank,p.branch,p.birthplace,p.summary,p.biography].join(' ')).includes(q));
    const shown=state.peopleExpanded?matching:matching.slice(0,6);
    $('#people-grid').innerHTML=shown.length?shown.map((p,i)=>`<article class="person-card"><div class="person-media" data-gdd-trace-code="${escape(p.archive_code||'')}">${portrait(p,true)}<span class="card-badge">${escape(p.branch||'TƯ LIỆU ĐẠO SỬ')}</span></div><div class="person-body"><span class="person-rank">${escape(p.rank||'Chức sắc')}</span><h3>${escape(p.full_name)}</h3><span class="person-years">${escape(p.years||'Đang bổ sung niên đại')}</span>${p.archive_code?'<span class="gdd-person-archive-code">Mã định danh: <code>'+escape(p.archive_code)+'</code></span>':''}<p>${escape(p.summary||'Hồ sơ tư liệu đang được biên soạn.')}</p><div class="card-bottom"><span>${p.verified?'Đã đối chiếu':'Đang đối chiếu'}</span><button type="button" class="card-link" data-open-kind="people" data-id="${escape(p.id)}">Xem tiểu sử <span>↗</span></button></div></div></article>`).join(''):'<div class="empty-state"><b>Chưa tìm thấy hồ sơ phù hợp.</b>Thử tên khác hoặc thay đổi bộ lọc.</div>';
    $('#people-result-count').textContent=`Đang hiển thị ${shown.length} / ${matching.length} hồ sơ`;
    const more=$('#people-show-more');more.hidden=matching.length<=6;more.textContent=state.peopleExpanded?'Thu gọn hồ sơ ↑':'Xem thêm hồ sơ ↗';
    $('#article-list').innerHTML=posts.length?posts.slice(0,8).map(({record:p,originKind},i)=>{
      const linked=p.person_id?linkedPerson(p.person_id):null;
      const image=imageFromRecord(p,originKind)||displayImageUrl(linked?.published?linked.image_url:'');
      const emptyArtwork='<div class="editorial-placeholder" aria-hidden="true"><span>✦</span><strong>TƯ LIỆU ĐẠO SỬ</strong><small>BIÊN KHẢO</small></div>';
      const artwork=image
        ?emptyArtwork+`<img src="${escape(image)}" data-photo-code="${escape(imageFromRecord(p)?p.archive_code:linked?.archive_code||'')}" alt="Ảnh bìa: ${escape(p.title)}" loading="lazy" decoding="async">`
        :emptyArtwork;
      const summary=p.summary||p.caption||p.body||'Bài khảo cứu trong kho tư liệu Đạo sử.';
      const excerpt=String(summary).replace(/\s+/g,' ').slice(0,350);
      const category=originKind==='posts'?(p.category||'BIÊN KHẢO'):(sectionNames[originKind]||'TƯ LIỆU');
      return `<article class="article-row editorial-article">
        <button type="button" class="editorial-image" data-open-kind="${originKind}" data-id="${escape(p.id)}" aria-label="Đọc bài: ${escape(p.title)}">${artwork}</button>
        <div class="editorial-copy">
          <span class="article-tag">${escape(category)} · ${escape(date(p.created_at))}</span>
          <h3>${escape(p.title)}</h3>
          <p>${escape(excerpt)}</p>
          <button type="button" class="editorial-read" data-open-kind="${originKind}" data-id="${escape(p.id)}">Xem tư liệu <span aria-hidden="true">↗</span></button>
        </div>
      </article>`;
    }).join(''):'<div class="empty-state"><b>Chưa có bài biên khảo.</b>Ban Biên Tập đang sưu tầm tư liệu.</div>';
    const activeGallery=galleryCategories.includes(state.galleryCategory)?state.galleryCategory:'all';
    const visibleMedia=activeGallery==='all'?media:media.filter(({record,originKind})=>displayGalleryCategory(originKind,record)===activeGallery);
    $$('#gallery-category-filters [data-gallery-category]').forEach(btn=>{
      const category=btn.dataset.galleryCategory;
      const selected=category===activeGallery;
      btn.classList.toggle('is-selected',selected);
      btn.setAttribute('aria-pressed',String(selected));
      const amount=btn.querySelector('.gdd-gallery-cat-count');
      if(amount)amount.textContent=String(category==='all'?media.length:media.filter(({record,originKind})=>displayGalleryCategory(originKind,record)===category).length);
    });
    const counter=$('#gallery-category-count');
    if(counter)counter.textContent=activeGallery==='all'
      ?'Đang hiển thị '+media.length+' bộ ảnh tư liệu.'
      :'Đang hiển thị '+visibleMedia.length+' bộ ảnh trong chuyên mục “'+activeGallery+'”.';
    $('#gallery-grid').innerHTML=visibleMedia.length?visibleMedia.map(({record:m,originKind})=>{
      // Public list: thumbnails appear on individual detail pages, not automatically on every visit.
      const src=imageFromRecord(m,originKind);
      const full=String(m.caption||m.summary||m.body||'Bấm để xem thông tin bộ ảnh.').replace(/\s+/g,' ').trim();
      const excerpt=full.length>150?full.slice(0,147).replace(/\s+\S*$/,'')+'…':full;
      return `<button type="button" class="gallery-card" data-open-kind="${originKind}" data-id="${escape(m.id)}"><div class="gallery-visual" data-gdd-trace-code="${escape(m.archive_code||'')}">${src?`<img src="${escape(src)}" alt="${escape(m.title)}" data-photo-code="${escape(m.archive_code||'')}" loading="lazy">`:'<div class="gallery-placeholder"><b>✧</b><span>ẢNH TƯ LIỆU</span></div>'}</div><div class="gdd-gallery-card-copy"><h3>${escape(m.title)}</h3><p class="gdd-gallery-excerpt">${escape(excerpt)}</p><span class="gdd-gallery-open" aria-hidden="true">Xem bộ ảnh ↗</span></div></button>`;
    }).join(''):media.length?'<div class="empty-state"><b>Chưa có bộ ảnh trong chuyên mục này.</b>Chọn “Tất cả” để xem những bộ ảnh đã lưu.</div>':'<div class="empty-state"><b>Chưa có ảnh tư liệu.</b>Tải ảnh từ trang quản trị để lập thư viện ảnh.</div>';
    const docEntries=displayedEntries('documents');
    const folderPanel=$('#document-subfolder-filters');
    if(folderPanel){
      const browsing=state.documentSubfolder==='browse';
      folderPanel.dataset.mode=browsing?'browse':'detail';
      const folderChoices=folderPanel.querySelector('.gdd-document-folder-grid');
      const activeCard=$('#document-folder-active');
      if(folderChoices)folderChoices.hidden=!browsing;
      if(activeCard)activeCard.hidden=browsing;
      const activeAll=state.documentSubfolder==='all';
      const activeCount=activeAll?docEntries.length:
        docEntries.filter(({record,originKind})=>
          documentSubfolderOf(originKind,record)===state.documentSubfolder).length;
      const activeTitle=$('#document-folder-active-title');
      if(activeTitle)activeTitle.textContent=activeAll?'Tất cả tài liệu Số hóa':
        documentSubfolderTitle(state.documentSubfolder);
      const activeCode=$('#document-folder-active-code');
      if(activeCode)activeCode.textContent=activeAll?'5 thư mục con':'DXCD-SH.'+state.documentSubfolder;
      const activeTotal=$('#document-folder-active-total');
      if(activeTotal)activeTotal.textContent=activeCount+' tư liệu';
      $$('#document-subfolder-filters [data-document-subfolder]').forEach(button=>{
        const group=button.dataset.documentSubfolder,selected=state.documentSubfolder===group;
        button.classList.toggle('is-selected',selected);
        button.setAttribute('aria-pressed',String(selected));
        const amount=button.querySelector('[data-document-folder-count]');
        if(amount)amount.textContent=String(group==='all'?docEntries.length:
          docEntries.filter(({record,originKind})=>documentSubfolderOf(originKind,record)===group).length);
      });
      const info=$('#document-subfolder-count');
      if(info)info.textContent=browsing
        ?'Chọn một thư mục để mở tư liệu ngay bên dưới, hoặc nhấn “Xem tất cả”.'
        :activeAll?'Đang xem '+docEntries.length+' tài liệu trong cả 5 thư mục con.'
        :'Đang xem '+activeCount+' tài liệu thuộc '+documentSubfolderTitle(state.documentSubfolder)+'.';
    }
    const groupKinds=[['videos','video-grid','Video Đạo Sử'],['obituaries','obituary-grid','Ai Tín'],['documents','document-grid','Tài liệu số hóa']];
    groupKinds.forEach(([kind,target,label])=>{
      const rows=kind==='documents'?docEntries.filter(({record,originKind})=>
        ['all','browse'].includes(state.documentSubfolder)||
        documentSubfolderOf(originKind,record)===state.documentSubfolder):displayedEntries(kind),el=$('#'+target);
      if(!el)return;
      if(kind==='documents')el.hidden=state.documentSubfolder==='browse';
      el.innerHTML=rows.length?rows.map(({record:x,originKind})=>{
        // Published digitized documents use lazy R2 WebP thumbnails; other public lists remain lightweight.
        const src=imageFromRecord(x,originKind)||
          (kind==='videos'?videoSource(x.video_url)?.poster||'':'');
        const meta=originKind==='obituaries'?x.memorial_date:
          originKind==='documents'?[documentSubfolderTitle(x.subfolder_code),x.document_number,x.document_date].filter(Boolean).join(' · '):
          sectionNames[originKind]||'';
        const preview=state.admin&&originKind==='videos'&&kind==='videos'
          ?`<div class="archive-thumb video-preview-slot" data-video-id="${escape(x.id)}">${videoPoster(x)}</div>`
          :`<div class="archive-thumb" data-gdd-trace-code="${escape(x.archive_code||'')}">${src?`<img src="${escape(src)}" alt="Ảnh trang đầu văn kiện: ${escape(x.title)}" loading="lazy" decoding="async" fetchpriority="low">`:`<div aria-hidden="true">${kind==='obituaries'?'✧':'▤'}</div>`}</div>`;
        const description=String(x.summary||x.caption||x.body||'Tư liệu đang được bổ sung nội dung.').replace(/\s+/g,' ').slice(0,360);
        const readUrl=window.GDDDocumentReader?.readerUrl(x.file_url)||x.file_url;
        const readerLink=originKind==='documents'&&
          ['r2','legacy-pdf','legacy-word'].includes(window.GDDDocumentReader?.kind(x.file_url))
          ?` <a class="link-button" href="${escape(readUrl)}" target="_blank" rel="noopener noreferrer">Đọc tài liệu ↗</a>`:'';
        return `<article class="archive-card ${kind==='videos'?'video-archive-card':''}">${preview}<div class="archive-card-copy"><span class="archive-type">${escape(label)} ${meta?' · '+escape(meta):''}</span><h3>${escape(x.title)}</h3>${kind==='documents'&&x.archive_code?'<p class="gdd-document-card-code">Mã định danh: <code>'+escape(x.archive_code)+'</code></p>':''}<p>${escape(description)}</p><button type="button" class="link-button" data-open-kind="${originKind}" data-id="${escape(x.id)}">Xem chi tiết ↗</button>${readerLink}</div></article>`;
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
    const src=displayImageUrl(record.cover_url||record.image_url||(kind==='documents'&&/\.(png|jpe?g|webp)(\?|$)/i.test(record.file_url||'')?record.file_url:''));
    const subtitle=kind==='people'?[record.rank,record.branch,record.subgroup,record.years].filter(Boolean).join(' · '):
      kind==='obituaries'?[record.deceased_name,record.memorial_date].filter(Boolean).join(' · '):
      kind==='documents'?[documentSubfolderTitle(record.subfolder_code),record.document_number,record.document_date].filter(Boolean).join(' · '):
      kind==='posts'?[record.category,date(record.created_at)].filter(Boolean).join(' · '):sectionNames[kind]||'';
    const body=kind==='people'?record.biography:kind==='media'?record.caption:record.body;
    // Published gallery entries are already filtered by public D1 on the parent.
    // Display only optimized previews, never R2 originals or raw HTML from captions.
    const attachedPhotos=record.published?state.galleryImages.filter(photo=>
      photo.owner_kind===kind&&photo.owner_id===record.id&&photo.image_url)
      .sort((a,b)=>(a.sort_order??0)-(b.sort_order??0))
      .slice(0,200):[];
    const galleryMarkup=attachedPhotos.length
      ?'<section class="gdd-detail-photo-album" aria-label="Bộ ảnh tư liệu kèm bài">'+
        '<h3>HÌNH ẢNH KÈM THEO · '+attachedPhotos.length+' ảnh</h3>'+
        '<div class="gdd-detail-photo-grid">'+attachedPhotos.map((photo,i)=>{
          const url=displayImageUrl(photo.image_url);
          if(!url)return '';
          const caption=String(photo.caption||photo.photo_code||'Ảnh tư liệu '+(i+1));
          const note=photo.photo_code&&photo.caption
            ?caption+' · '+photo.photo_code:caption;
          return '<figure><a href="'+escape(url)+'" target="_blank" rel="noopener noreferrer" '+
            'aria-label="Xem ảnh tư liệu '+(i+1)+'">'+
            '<img src="'+escape(url)+'" alt="'+escape(caption)+'" loading="lazy" decoding="async"></a>'+
            '<figcaption>'+escape(note)+'</figcaption></figure>';
        }).join('')+'</div></section>'
      :'';
    const summary=record.summary||'';
    const person=kind!=='people'&&record.person_id?linkedPerson(record.person_id):null;
    const dateNotes=kind==='people'&&record.date_notes?`<p class="detail-meta">Ngày tháng: ${escape(record.date_notes)}</p>`:'';
    const url=safeUrl(kind==='videos'?record.video_url:kind==='documents'?record.file_url:'');
    const destination=kind==='documents'
      ?(window.GDDDocumentReader?.readerUrl(url)||url):url;
    const isReader=kind==='documents'&&
      ['r2','legacy-pdf','legacy-word'].includes(window.GDDDocumentReader?.kind(url));
    // All known PDF/Word links in every section use a common reader.
    // Old public Supabase originals remain public until they are safely migrated.
    const link=url?`<p class="detail-external"><a href="${escape(destination)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">${kind==='videos'?(videoSource(record.video_url)?.type==='facebook'?'Xem trên Facebook':'Xem video gốc'):isReader?'Đọc tài liệu':'Mở tài liệu số'} ↗</a></p>`:'';
    const pdfFileLink=link;
    const visual=kind==='videos'?`<div class="detail-video-preview" data-video-id="${escape(record.id)}">${videoPoster(record)}</div>`:`<div class="detail-cover">${src?`<img src="${escape(src)}" alt="${escape(title)}">`:`<div class="portrait-placeholder">${escape(sectionNames[kind])}</div>`}</div>`;
    const seoHref=(['people','posts'].includes(kind) && record.published && /^[a-z0-9][a-z0-9_-]{0,180}$/.test(record.slug||''))
      ?'/'+(kind==='people'?'ho-so':'bien-khao')+'/'+encodeURIComponent(record.slug)+'.html'
      :'';
    // Trang SEO được sinh theo lịch; ẩn nút cho tới khi tệp đã được triển khai thật sự (tránh 404).
    const seoLink=seoHref?'<p class="detail-seo-link" hidden><a class="btn btn-outline" href="'+escape(seoHref)+'" target="_blank" rel="noopener noreferrer">Đọc bản công khai trên trang riêng ↗</a></p>':'';
    const archiveCode=record.archive_code||'';
    const archivePanel=archiveCode&&record.slug?`<section class="gdd-archive-qr" data-gdd-archive-qr data-archive-code="${escape(archiveCode)}" data-archive-url="${escape(archiveLink(kind,record))}">
      <div class="gdd-archive-qr-heading"><strong>MÃ ĐỊNH DANH TƯ LIỆU</strong><code>${escape(archiveCode)}</code></div>
      <div class="gdd-archive-qr-layout"><div class="gdd-archive-qr-frame"><div data-gdd-qr-graphic></div></div><div class="gdd-archive-qr-actions">
      <p>Quét mã để mở thẳng hồ sơ này trên website GIỮ ĐẠO GIỮA ĐỜI.</p>
      ${record.published?'':'<p class="gdd-archive-qr-warning">Bản nháp: đồng đạo chưa thể xem cho tới khi công bố.</p>'}
      <button class="btn btn-primary" type="button" data-gdd-qr-download>Tải mã QR PNG</button>
      <button class="btn btn-outline" type="button" data-gdd-qr-copy>Sao chép liên kết</button>
      <small class="gdd-archive-qr-status" data-gdd-qr-status></small></div></div></section>`:'';
    $('#detail-content').innerHTML=`<div class="eyebrow">${escape(sectionNames[kind])}</div><h2 class="detail-title">${escape(title)}</h2><p class="detail-meta">${escape(subtitle)}</p>${dateNotes}${archivePanel}${visual}${['people','posts'].includes(kind)?statusTag(record):''}${summary?`<p class="detail-summary">${escape(summary)}</p>`:''}${person?`<p class="detail-meta">Hồ sơ liên quan: ${escape(person.full_name)}</p>`:''}<div class="detail-body">${escape(body||'Nội dung đang được bổ sung.')}</div>${galleryMarkup}${pdfFileLink}${seoLink}<div class="detail-source"><strong>NGUỒN TƯ LIỆU & GHI CHÚ</strong>${escape(record.sources||'Chưa cập nhật nguồn tư liệu.')}</div>${state.admin?`<p><button class="btn btn-outline" type="button" data-edit-kind="${escape(kind)}" data-edit-id="${escape(record.id)}">Chỉnh sửa tư liệu</button></p>`:''}`;
    // Chỉ tải ảnh có dấu đối với hồ sơ Chức sắc; không đổi dữ liệu hoặc file gốc.
    if(seoHref){
      const seoRow=$('.detail-seo-link',$('#detail-content'));
      // Không đoán kết quả từ trạng thái Supabase: phải xác nhận URL trả về 200.
      fetch(seoHref,{method:'HEAD',cache:'no-store'})
        .then(response=>{if(response.ok&&seoRow?.isConnected)seoRow.hidden=false;})
        .catch(()=>{});
    }
    $('#detail-content').dataset.gddKind=kind;
    $('#detail-content').dataset.gddArchiveCode=archiveCode;
    const coverImage=$('#detail-content .detail-cover img');
    if(coverImage&&archiveCode)coverImage.dataset.photoCode=archiveCode;
    // Đánh dấu đúng nơi đang trưng bày: bài chuyển sang Hình ảnh vẫn giữ loại gốc.
    $('#detail-content').dataset.gddDisplayTarget=displayTarget(kind,record);
    // Thẻ QR Chức sắc: hiển thị ngay dưới tên/phẩm vị, phía trên chơn dung.
    // Tái sử dụng mã QR và hai nút có sẵn, không thay đổi mã hay liên kết hồ sơ.
    if(kind==='people'&&archiveCode){
      const content=$('#detail-content');
      const panel=$('[data-gdd-archive-qr]',content);
      const portrait=$('.detail-cover',content);
      const frame=panel?.querySelector('.gdd-archive-qr-frame');
      const actions=panel?.querySelector('.gdd-archive-qr-actions');
      if(panel&&portrait&&frame&&actions){
        panel.classList.add('gdd-archive-qr--person');
        panel.dataset.archiveName=title;
        const card=document.createElement('div');
        card.className='gdd-archive-qr-card';
        const top=document.createElement('div');
        top.className='gdd-archive-qr-card-top';
        const big=document.createElement('strong');
        big.textContent='ĐẠI ĐẠO TAM KỲ PHỔ ĐỘ';
        const small=document.createElement('span');
        small.textContent='KHO TƯ LIỆU ĐẠO SỬ';
        top.append(big,small);
        const name=document.createElement('strong');
        name.className='gdd-archive-qr-person-name';
        name.textContent=title;
        const code=document.createElement('div');
        code.className='gdd-archive-qr-person-code';
        const prefix=document.createElement('span');
        prefix.textContent='Mã hồ sơ: ';
        const number=document.createElement('code');
        number.textContent=archiveCode;
        code.append(prefix,number);
        card.append(top,frame,name,code);
        panel.replaceChildren(card,actions);
        portrait.before(panel);
      }
    }
    $('#detail-overlay').hidden=false;document.body.classList.add('modal-open');$('.detail-panel').scrollTop=0;
    if(updateHash){
      // Mỗi lần mở hồ sơ tạo một bước lịch sử, để Back trở về đúng chuyên mục.
      history.pushState({...history.state,__gddLayer:'detail'},'',`#${prefixNames[kind]}/${encodeURIComponent(record.slug)}`);
    }
    if(record.published===true){
      const content=$('#detail-content');
      window.GDDPublicAttachments?.attach(content,kind,record.id,{before:$('.detail-body',content)});
    }
    // Ghi nhận khi hồ sơ/bài đã được mở thực sự; không đếm thẻ xem trước.
    window.dispatchEvent(new CustomEvent('gdd:content-open',{
      detail:{kind,id:record.id,published:record.published===true,containerId:'detail-content'}
    }));
  }
  const detailRoute=/^#(nhan-vat|bai-viet|hinh-anh-tu-lieu|video-dao-su|ai-tin|tai-lieu-so-hoa)\//;
  const detailSections={people:'chuc-sac',posts:'bien-khao',media:'hinh-anh',videos:'video-dao-su',obituaries:'ai-tin',documents:'tai-lieu-so-hoa'};
  function dismissDetail(){
    if($('#detail-overlay').hidden)return;
    $('#detail-overlay').hidden=true;
    $('#detail-content').replaceChildren();
    state.detail=null;
    if($('#admin-overlay').hidden)document.body.classList.remove('modal-open');
  }
  function closeDetail(navigate=true){
    if($('#detail-overlay').hidden)return;
    const kind=state.detail?.kind;
    dismissDetail();
    if(!navigate)return;
    if(history.state?.__gddLayer==='detail'){
      history.back();
    }else if(detailRoute.test(location.hash)){
      // Trường hợp mở bằng QR/liên kết trực tiếp: không lùi khỏi website.
      history.replaceState({...history.state,__gddLayer:null},'','#'+(detailSections[kind]||'chuc-sac'));
      window.dispatchEvent(new Event('hashchange'));
    }
  }
  async function syncHash(){
    const match=location.hash.match(/^#([^/]+)\/(.+)$/);
    if(!match){dismissDetail();return;}
    const kind=kindFromPrefix[match[1]];
    if(!kind){dismissDetail();return;}
    let slug='';
    try{slug=decodeURIComponent(match[2]);}catch{return;}
    const row=publicRows(kind).find(x=>x.slug===slug);
    if(row){openDetail(kind,row,false);return;}
    // Đường dẫn từ cổng tra cứu vẫn mở đúng khi một chuyên mục có hàng ngàn tư liệu.
    if(!state.supabase)return;
    const requestHash=location.hash;
    try{
      const {data,error}=await state.supabase.from(kind).select('*')
        .eq('slug',slug).eq('published',true).maybeSingle();
      if(!error&&data&&location.hash===requestHash)openDetail(kind,data,false);
    }catch(error){console.warn('[GDD Search] Không thể mở liên kết hồ sơ:',error);}
  }

  function dismissAdmin(){
    closeTransfer();
    $('#admin-overlay').hidden=true;
    if($('#detail-overlay').hidden)document.body.classList.remove('modal-open');
  }
  function closeAdmin(navigate=true){
    if($('#admin-overlay').hidden)return;
    dismissAdmin();
    if(navigate&&history.state?.__gddLayer==='admin')history.back();
  }
  async function openAdmin(){
    // All editorial operations now use Access-protected working D1, not old Supabase login.
    if(config.publicReadProvider==='d1-staging'){
      window.location.href='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev/admin';
      return;
    }
    if($('#admin-overlay').hidden){
      history.pushState({...history.state,__gddLayer:'admin'},'',location.href);
    }
    $('#admin-overlay').hidden=false;document.body.classList.add('modal-open');$('.admin-panel').scrollTop=0;
    if(!state.supabase){$('#login-message').textContent='Chưa kết nối cơ sở dữ liệu trực tuyến.';$('#login-form button').disabled=true;return}
    if(state.user){await verifyAdmin();return}
    $('#admin-login-area').hidden=false;$('#admin-editor-area').hidden=true;
    $('#login-message').textContent=state.usingFallback
      ? 'Supabase tạm hạn chế dịch vụ do vượt lưu lượng. Chức năng quản trị chưa thể đăng nhập lúc này; không cần đổi mật khẩu. Vui lòng tải lại trang sau khi hạn mức được khôi phục.'
      : '';
  }
  async function verifyAdmin(){
    if(!state.user)return;
    const {data,error}=await state.supabase.from('admin_users').select('user_id').eq('user_id',state.user.id).maybeSingle();
    state.admin=Boolean(data&&!error);
    $('#admin-login-area').hidden=state.admin;$('#admin-editor-area').hidden=!state.admin;
    if(state.admin){$('#logged-email').textContent=state.user.email||'Người quản trị';buildEditor();renderEditorList();window.GDDR2?.open(state.supabase)}
    else{window.GDDR2?.close();$('#login-message').textContent='Tài khoản chưa được cấp quyền biên tập. Xin kiểm tra bảng admin_users.'}
  }
  function labelHTML(field){
    const [name,label,type,required]=field,req=required?' required':'';
    if(type==='check')return `<label class="check-label"><input type="checkbox" name="${name}" ${name==='published'?'checked':''}>${escape(label)}</label>`;
   
if(type==='lunar-day'||type==='lunar-month')return `<label>${escape(label)}<input type="number" name="${name}" min="1" max="${type==='lunar-day'?'30':'12'}" step="1" inputmode="numeric" placeholder="${type==='lunar-day'?'Ngày':'Tháng'}"></label>`;
    if(type==='date')return `<label>${escape(label)}<input type="date" name="${name}"></label>`;
    if(type==='gender')return `<label>${escape(label)}<select name="gender" required><option value="">Chọn Nam hoặc Nữ</option><option value="Nam">Nam</option><option value="Nữ">Nữ</option></select></label>`;
    if(type==='document-subfolder')return '<label>'+escape(label)+'<select name="subfolder_code" required><option value="">— Chọn một trong 5 thư mục con —</option>'+
      documentSubfolders.map(f=>'<option value="'+escape(f.code)+'">'+escape(f.title)+' ('+escape(f.code)+')</option>').join('')+'</select></label>';
    if(type==='gallery-category')return `<label>${escape(label)}<select name="${name}" required><option value="">Chọn chuyên mục cho bộ ảnh</option>${galleryCategories.map(c=>`<option value="${escape(c)}">${escape(c)}</option>`).join('')}</select></label>`;
  
     if(type==='branch')return `<label>${escape(label)}<select name="${name}"><option value="Cửu Trùng Đài">Cửu Trùng Đài</option><option value="Hiệp Thiên Đài">Hiệp Thiên Đài</option><option value="Phước Thiện">Phước Thiện</option><option value="Hành chánh Đạo">Hành chánh Đạo</option><option value="Khác">Khác</option></select></label>`;
    if(type==='subgroup')return `<label>${escape(label)}<select name="subgroup"><option value="">Chưa phân loại</option>${allSubgroups.map(g=>`<option value="${escape(g)}">${escape(g)}</option>`).join('')}</select></label>`;
    if(type==='person')return `<label>${escape(label)}<select name="person_id"><option value="">Không liên kết</option>${state.data.people.map(p=>`<option value="${escape(p.id)}">${escape(p.full_name)}</option>`).join('')}</select></label>`;
    if(type==='video-file')return `<label>${escape(label)}<input type="file" name="video_file" accept="video/*,.mp4,.webm"></label><p class="help">Chọn tệp MP4 (H.264 khuyên dùng) hoặc WebM, tối đa 45 MB. Tệp MOV từ iPhone cần xuất thành MP4 trước để xem tốt trên Android và máy tính. Với video lớn đã đăng trên Page, hãy dán đường dẫn Facebook vào ô phía trên. Video tải lên sẽ ở kho công khai khi có đường dẫn.</p>`;
    if(type==='file'){const docs=state.editorKind==='documents';return `<label>${escape(label)}<input type="file" name="file" accept="${docs?'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,.doc,.docx':'image/jpeg,image/png,image/webp,image/heic,image/heif'}"></label><p class="help">${docs?'PDF/Word được lưu nguyên mẫu riêng trong R2 (chưa công khai bản gốc); bài mới có tệp PDF/Word sẽ lưu nháp chờ trình xem an toàn. Ảnh sẽ được tối ưu để hiển thị.':'Ảnh gốc lưu riêng ở R2, ảnh nhẹ được dùng để hiển thị; JPG/PNG/WebP và HEIC (nếu hỗ trợ).'} Không tải bản gốc công khai.</p>`;}
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
  // Nhóm mã xem trước để đối chiếu; Supabase vẫn cấp mã/số thứ tự thật.
  function personClassificationSignature(form, category){
    const get=name=>String(form.elements[name]?.value||'').trim();
    return JSON.stringify([get('full_name'),get('branch'),get('rank'),get('subgroup'),category]);
  }
  function refreshPersonCodePreview(){
    const form=$('#editor-form'),target=$('#person-code-preview');
    if(!target||state.editorKind!=='people')return;
    const saved=state.editingId?state.data.people.find(p=>p.id===state.editingId):null;
    const panel=$('#gdd-person-publish-check',form);
    const confirmed=$('#gdd-person-classification-confirm',form);
    const get=name=>String(form.elements[name]?.value||'').trim();
    const name=get('full_name'),branch=get('branch'),rank=get('rank'),subgroup=get('subgroup');
    const category=personCodeCategory(branch,rank,subgroup,name);
    const signature=personClassificationSignature(form,category);
    const needsCheck=Boolean(form.elements.published?.checked)&&!saved?.archive_code;
    if(panel){
      panel.hidden=!needsCheck;
      if(panel.dataset.signature!==signature){
        panel.dataset.signature=signature;
        if(confirmed)confirmed.checked=false;
      }
      const valid=Boolean(name&&branch&&rank);
      if(confirmed)confirmed.disabled=!valid||!needsCheck;
      const summary=$('#gdd-person-classification-summary',panel);
      const note=$('#gdd-person-classification-note',panel);
      if(summary){
        summary.innerHTML='<div><dt>Danh xưng</dt><dd>'+escape(name||'Chưa nhập')+'</dd></div>'+
          '<div><dt>Cơ quan Đạo</dt><dd>'+escape(branch||'Chưa xác định')+'</dd></div>'+
          '<div><dt>Phẩm vị</dt><dd>'+escape(rank||'Chưa nhập')+'</dd></div>'+
          '<div><dt>Phân nhóm</dt><dd>'+escape(subgroup||'Chưa phân nhóm')+'</dd></div>'+
          '<div><dt>Nhóm mã dự kiến</dt><dd><code>'+escape(valid?'CS-'+category:'Chưa xác định')+'</code></dd></div>';
      }
      if(note){
        const special=category.endsWith('.KH')||category==='HTD.CQK'||category==='KH.KH';
        note.textContent=!valid
          ?'Cần có Danh xưng, Cơ quan Đạo và Phẩm vị trước khi cấp mã. Có thể bỏ chọn Công bố để lưu bản nháp.'
          :special
            ?'Nhóm mã đặc biệt: xin mở Thông tin bổ sung để đối chiếu kỹ Phẩm vị và Phân nhóm trước khi xác nhận.'
            :'Xin đối chiếu với bài viết trước khi xác nhận. Số thứ tự sẽ do Supabase cấp, không cấp thử tại đây.';
      }
    }
    if(saved?.archive_code){
      target.innerHTML='<b>Mã định danh đã cấp:</b> <code>'+escape(saved.archive_code)+'</code>'+
        '<small>Mã được giữ cố định để tra cứu lâu dài; sửa thông tin không tự đổi mã cũ.</small>';
      return;
    }
    if(!branch||!rank){
      target.textContent='Chọn Cơ quan/Hệ thống và nhập Phẩm vị để xem trước nhóm mã.';
      return;
    }
    const unknown=category.endsWith('.KH')||category==='HTD.CQK';
    target.innerHTML='<b>Nhóm mã khi công bố:</b> <code>CS-'+escape(category)+'-xxxxx</code>'+
      '<small>Số thứ tự được Supabase tự cấp khi CÔNG BỐ. Cửu Trùng Đài và Hiệp Thiên Đài mỗi Đài có một dãy liên tục, không bắt đầu lại theo phẩm vị.'+
      (unknown?' Nhóm đặc biệt: xin đối chiếu kỹ trước khi xác nhận.':'')+'</small>';
  }
  function refreshDocumentCodePreview(){
    const box=$('#document-code-preview');
    if(!box||state.editorKind!=='documents')return;
    const form=$('#editor-form'),code=form.elements.subfolder_code?.value||'';
    const prior=state.editingId?state.data.documents.find(row=>row.id===state.editingId):null;
    if(!code||!documentSubfolders.some(f=>f.code===code)){
      box.textContent='Xin chọn thư mục con để xác định nhóm mã trước khi đăng.';
      return;
    }
    if(prior?.archive_code&&prior.subfolder_code===code){
      box.innerHTML='<b>Mã định danh đã cấp:</b> <code>'+escape(prior.archive_code)+'</code>'+
        '<small>Giữ nguyên mã khi chỉnh sửa nội dung trong cùng thư mục.</small>';
    }else{
      box.innerHTML='<b>Nhóm mã sẽ được cấp:</b> <code>DXCD-SH.'+escape(code)+'-xxxxx</code>'+
        '<small>Số thứ tự được Supabase tự cấp từ 00001 riêng mỗi thư mục.'+
        (prior?.archive_code?' Nếu chuyển thư mục, sẽ có mã mới; mã cũ được giữ trong hồ sơ để tra cứu.':'')+'</small>';
    }
  }
  function buildEditor(){
    const kind=state.editorKind;$('#editor-heading').textContent=state.editingId?'Sửa tư liệu':'Thêm '+(sectionNames[kind]||'tư liệu');
    $$('.editor-tabs button').forEach(b=>b.classList.toggle('is-selected',b.dataset.kind===kind));
    const peopleExtra=kind==='people'
      ?'<div class="gdd-person-code-preview" id="person-code-preview" aria-live="polite"></div>'+
        '<section class="gdd-person-publish-check" id="gdd-person-publish-check" aria-labelledby="gdd-person-classification-title" hidden>'+
        '<h4 id="gdd-person-classification-title">Kiểm tra phân loại trước khi cấp mã</h4>'+
        '<p>Kiểm tra đúng Cơ quan Đạo, Phẩm vị và nhóm mã. Nếu chưa chắc chắn, hãy lưu bản nháp.</p>'+
        '<dl id="gdd-person-classification-summary"></dl>'+
        '<p class="gdd-person-classification-note" id="gdd-person-classification-note"></p>'+
        '<label class="gdd-person-classification-consent"><input type="checkbox" id="gdd-person-classification-confirm" name="gdd_person_confirm" value="1">'+
        '<span>Tôi đã kiểm tra đúng Cơ quan Đạo, Phẩm vị và nhóm mã dự kiến của hồ sơ này.</span></label>'+
        '</section>'
      :'';
    const docExtra=kind==='documents'?'<div class="gdd-person-code-preview" id="document-code-preview" aria-live="polite"></div>':'';
    $('#editor-form').innerHTML=fields[kind].map(labelHTML).join('')+peopleExtra+docExtra+`<div class="form-actions"><button class="btn btn-primary" type="submit">${state.editingId?'Lưu thay đổi':'Đăng tư liệu'}</button>${state.editingId?'<button class="btn-delete" type="button" id="delete-record">Xóa tư liệu</button>':''}</div><p id="form-message" class="small-note" aria-live="polite"></p>`;
    if(state.editingId){const record=state.data[kind].find(x=>x.id===state.editingId);if(record){const form=$('#editor-form');for(const name of schema[kind]){const el=form.elements[name];if(!el)continue;if(el.type==='checkbox')el.checked=Boolean(record[name]);else el.value=(kind==='media'&&name==='category'&&!record.category)?galleryCategoryOf(record):(record[name]??'')}}}
    if(kind==='people')refreshPersonCodePreview();
    if(kind==='documents')refreshDocumentCodePreview();
  }
  // Thu gọn danh sách quản trị: chỉ 4 mục mới nhất, vẫn tìm được mọi mục.
  function renderEditorList(){
    if(!state.admin)return;
    const kind=state.editorKind;
    const rows=kind==='people'
      ?state.data.people.map(record=>({record,originKind:'people'}))
      :displayedEntries(kind);
    const term=norm($('#editor-record-search')?.value.trim()||'');
    const matched=term?rows.filter(({record:r,originKind})=>norm([
      recordTitle(originKind,r),r.archive_code,r.archive_legacy_code,...(r.archive_code_aliases||[]),r.subfolder_code,r.slug,r.secular_name,r.rank,r.category,r.deceased_name
    ].filter(Boolean).join(' ')).includes(term)):rows;
    const visibleLimit=4,expanded=!term&&state.editorListExpanded;
    const visible=term||expanded?matched:matched.slice(0,visibleLimit);
    const info=$('#editor-search-count');
    if(info)info.textContent=term
      ?`Tìm thấy ${matched.length}/${rows.length} tư liệu trong ${sectionNames[kind]}.`
      :rows.length>visibleLimit&&!expanded
        ?`Hiện ${visible.length}/${rows.length} tư liệu gần nhất trong ${sectionNames[kind]}.`
        :`${rows.length} tư liệu trong ${sectionNames[kind]}.`;
    const list=$('#editor-list');
    list.classList.toggle('gdd-editor-list-scroll',Boolean(term)||(expanded&&matched.length>visibleLimit));
    list.innerHTML=visible.length?visible.map(({record:r,originKind})=>{
      const moved=originKind!==kind?' · Chuyển từ '+sectionNames[originKind]:kind==='media'?' · '+displayGalleryCategory(originKind,r):kind==='documents'?' · '+documentSubfolderTitle(r.subfolder_code):'';
      const actions=`<button type="button" data-list-qr="${escape(originKind)}" data-id="${escape(r.id)}" aria-label="Xem mã QR">QR</button><button type="button" data-list-edit="${escape(originKind)}" data-id="${escape(r.id)}">Sửa</button>${originKind!=='people'&&r.published?`<button type="button" data-list-transfer="${escape(originKind)}" data-id="${escape(r.id)}" title="Chuyển mục hiển thị" aria-label="Chuyển mục hiển thị">⇄</button>`:''}`;
      return `<div class="editor-item"><div class="gdd-record-label"><b>${escape(recordTitle(originKind,r))}</b><span>${r.published?'Đã công bố':'Bản nháp'} · ${escape(date(r.created_at))} · ${escape(r.archive_code||'Chưa có mã')}${escape(moved)}</span></div><div class="gdd-record-actions">${actions}</div></div>`;
    }).join(''):rows.length
      ?'<p class="small-note">Không tìm thấy tư liệu phù hợp. Thử nhập tên hoặc mã hồ sơ khác.</p>'
      :'<p class="small-note">Chưa có tư liệu.</p>';
    const more=$('#editor-list-toggle');
    if(more){
      more.hidden=Boolean(term)||rows.length<=visibleLimit;
      more.textContent=expanded?'Thu gọn danh sách':`Xem thêm ${rows.length-visibleLimit} tư liệu`;
      more.setAttribute('aria-expanded',String(expanded));
    }
  }
  function closeTransfer(){
    const panel=$('#gdd-transfer-dialog');
    if(panel)panel.hidden=true;
    state.transferSelection=null;
  }
  function openTransfer(originKind,id){
    if(!state.admin||!movableKinds.includes(originKind))return;
    const record=state.data[originKind].find(x=>x.id===id);
    if(!record||!record.published)return toast('Chỉ chuyển mục những tư liệu đã công bố.');
    state.transferSelection={originKind,id};
    const target=$('#gdd-transfer-target');
    const galleries=galleryCategories.map((category,i)=>`<option value="gallery:${i}">${escape(category)}</option>`).join('');
    const main=movableKinds.map(kind=>`<option value="${escape(kind)}">${kind===originKind?'Mục gốc – ':''}${escape(sectionNames[kind])}</option>`).join('');
    target.innerHTML=`<optgroup label="TRONG HÌNH ẢNH">${galleries}</optgroup><optgroup label="CÁC MỤC CHÍNH">${main}</optgroup>`;
    const placement=placementOf(originKind,record);
    const currentTarget=displayTarget(originKind,record);
    target.value=currentTarget==='media'
      ?(galleryCategories.includes(placement?.target_category)
        ?'gallery:'+galleryCategories.indexOf(placement.target_category)
        :originKind==='media'?'gallery:'+galleryCategories.indexOf(galleryCategoryOf(record)):'media')
      :currentTarget;
    $('#gdd-transfer-record').textContent=recordTitle(originKind,record);
    $('#gdd-transfer-dialog').hidden=false;
    $('#gdd-transfer-status').textContent='';
    target.focus();
  }
  async function submitTransfer(e){
    e.preventDefault();
    const selection=state.transferSelection;
    if(!state.admin||!state.supabase||!selection)return;
    const {originKind,id}=selection;
    const record=state.data[originKind]?.find(x=>x.id===id);
    if(!record||!record.published)return closeTransfer();
    const chosen=$('#gdd-transfer-target').value;
    let category=null;
    if(chosen.startsWith('gallery:')){
      const idx=chosen.slice(8);
      if(!/^(0|[1-9]\d*)$/.test(idx)||!galleryCategories[Number(idx)])return;
      category=galleryCategories[Number(idx)];
    }
    const target=category?'media':chosen;
    const note=$('#gdd-transfer-status');
    if(!movableKinds.includes(target))return;
    const current=placementOf(originKind,record);
    if(displayTarget(originKind,record)===target&&
      (category?displayGalleryCategory(originKind,record)===category:!current?.target_category)){
      closeTransfer();return;
    }
    const btn=$('#gdd-transfer-confirm');
    btn.disabled=true;note.textContent='Đang chuyển mục hiển thị…';
    try{
      const table=state.supabase.from('gdd_content_placements');
      const request=target===originKind&&!category
        ?table.delete().eq('owner_kind',originKind).eq('owner_id',id)
        :table.upsert({
          owner_kind:originKind,owner_id:id,target_kind:target,target_category:category,
          updated_at:new Date().toISOString()
        },{onConflict:'owner_kind,owner_id'});
      const {error}=await request;
      if(error)throw error;
      closeTransfer();
      await fetchData();
      const label=category?'Hình ảnh / '+category:sectionNames[target];
      toast('Đã chuyển hiển thị sang '+label+'. Nội dung và mã QR giữ nguyên.');
    }catch(error){
      note.textContent='Chưa chuyển được: '+(error.message||String(error));
    }finally{btn.disabled=false}
  }
  function editRecord(kind,id){
    state.editorKind=kind;state.editingId=id;
    if(!$('#detail-overlay').hidden){
      closeDetail(false);
      if(detailRoute.test(location.hash)){
        history.replaceState({...history.state,__gddLayer:null},'','#'+(detailSections[kind]||'chuc-sac'));
        window.dispatchEvent(new Event('hashchange'));
      }
    }
    if($('#admin-overlay').hidden)history.pushState({...history.state,__gddLayer:'admin'},'',location.href);
    $('#admin-overlay').hidden=false;document.body.classList.add('modal-open');
    buildEditor();$('.admin-panel').scrollTop=120;
  }
  // Images are now archived and published through GDDPrivatePublishing.
  // The old Supabase public-upload helper has been disabled deliberately.
  async function uploadImage(){
    throw Error('Đã ngừng tải ảnh vào bucket Supabase công khai. Hãy sử dụng R2.');
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
      if(kind==='documents'&&!documentSubfolders.some(f=>f.code===data.subfolder_code))
        throw new Error('Xin chọn đúng một trong 5 thư mục con Số hóa trước khi lưu.');
      if(kind==='people'){
        // Không cho cấp mã lần đầu khi phân loại chưa được biên tập viên đối chiếu.
        // Mã đã cấp trước đây không bị đổi và không yêu cầu xác nhận lại.
        if(data.published&&!record?.archive_code){
          const category=personCodeCategory(data.branch,data.rank,data.subgroup,data.full_name);
          const panel=$('#gdd-person-publish-check',form);
          const checkbox=$('#gdd-person-classification-confirm',form);
          const signature=personClassificationSignature(form,category);
          const valid=Boolean(data.full_name&&data.branch&&data.rank);
          if(!valid||!checkbox?.checked||checkbox.disabled||panel?.dataset.signature!==signature){
            if(panel){
              panel.hidden=false;
              panel.scrollIntoView({behavior:'smooth',block:'center'});
            }
            throw new Error(!valid
              ?'Cần kiểm tra Danh xưng, Cơ quan Đạo và Phẩm vị trước khi công bố. Có thể lưu bản nháp.'
              :'Xin xác nhận đúng Cơ quan Đạo, Phẩm vị và nhóm mã trước khi cấp mã định danh lần đầu.');
          }
        }
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
      let archivedPrimary=null,privateDocument=false;
      if(file){
        if(!window.GDDR2?.archive)throw Error('Bộ bảo tồn nguyên mẫu R2 chưa tải xong. Hãy tải lại trang.');
        archivedPrimary=await window.GDDR2.archive(file,state.supabase,{
          recordKind:kind,role:'primary',
          skipDerivatives:false,
          onProgress:progress=>{
            if(progress.phase==='original')
              $('#form-message').textContent='Đang bảo tồn bản gốc trong R2: '+Math.round(progress.bytes/progress.total*100)+'%';
            if(progress.phase==='optimizing')
              $('#form-message').textContent='Ảnh gốc đã được lưu R2; đang tạo bản xem '+progress.variant+'…';
            if(progress.phase==='optimized-error')
              $('#form-message').textContent='Bản gốc đã lưu; bản ảnh xem cần kiểm tra: '+progress.message;
          }
        });
        const ext=String(file.name||'').split('.').pop().toLowerCase();
        privateDocument=kind==='documents'&&['pdf','doc','docx'].includes(ext);
        if(privateDocument){
          // No public PDF/Word original: only a draft record until view-only conversion exists.
          data.file_url=null;
          data.published=false;
          $('#form-message').textContent='PDF/Word nguyên mẫu đã lưu riêng tại R2. Bài này sẽ là bản nháp cho tới khi có bản xem an toàn.';
        }else{
          if(!window.GDDPrivatePublishing?.publishArchivedImage)
            throw Error('Bộ tạo bản xem R2 chưa sẵn sàng.');
          if(archivedPrimary?.previewReady!==true||archivedPrimary?.downloadReady!==true)
            throw Error('Ảnh gốc đã cất R2 nhưng chưa có bản xem được duyệt. Không tạo liên kết hỏng.');
          const field=kind==='documents'?'file_url':(['posts','videos','obituaries'].includes(kind)?'cover_url':'image_url');
          if(data.published===true){
            const published=await window.GDDPrivatePublishing.publishArchivedImage(archivedPrimary,{allowDownload:kind==='documents'});
            data[field]=published.url;
          }else{
            // The draft remains private; admin can publish the prepared image via R2 library.
            data[field]=window.GDDPrivatePublishing.previewUrl(archivedPrimary.id);
          }
        }
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
      // All visitor previews and downloads are now watermarked on the derived
      // R2/browser layer. Never alter a saved original URL by uploading a new
      // -trace.jpg into the now-private Supabase archive bucket.
      let traceWarning='';
      let r2LinkProblem='';
      if(archivedPrimary){
        try{await window.GDDR2.link(archivedPrimary,kind,savedId,'primary',state.supabase)}
        catch(linkError){r2LinkProblem=String(linkError?.message||linkError)}
      }
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
      if(data.published===true&&window.GDDPrivatePublishing?.publishLinkedImages){
        try{await window.GDDPrivatePublishing.publishLinkedImages(state.supabase,kind,savedId);}
        catch(publishError){r2LinkProblem=String(publishError?.message||publishError);}
      }
      await fetchData();
      if(kind==='people')window.dispatchEvent(new Event('gdd:people-anniversary-refresh'));
      state.editingId=null;
      albums?.resetAfterSuccess?.();
      buildEditor();
      window.GDDR2?.refresh?.();
      if(r2LinkProblem){
        $('#form-message').textContent='Bài đã được lưu và ảnh gốc vẫn ở R2, nhưng liên kết danh mục cần kiểm tra: '+r2LinkProblem;
        toast('Bài đã lưu; cần kiểm tra liên kết R2.');
      }else if(privateDocument){
        toast('Đã lưu PDF/Word nguyên mẫu vào R2 và lưu bài ở chế độ NHÁP, không công khai tệp gốc.');
      }else if(traceWarning){
        $('#form-message').textContent=traceWarning;
        toast('Bài đã lưu. Cần kiểm tra bản ảnh hiển thị lưu dấu.');
      }else{
        toast('Đã lưu tư liệu '+(saved?.archive_code||'(bản nháp chưa cấp mã)')+'; ảnh gốc bảo tồn R2, ảnh xem đã đăng.');
      }
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
    // Read-only emergency fallback: only use published records when all public API lists fail.
    // This keeps public archive texts available if the free-tier service is temporarily restricted.
    // Never use the fallback for authenticated administration or editorial writes.
    const restricted=results.some(r=>r.error && /(?:\b402\b|exceed_egress|exceed_cached_egress|restricted)/i.test(
      [r.error.code,r.error.message,r.error.details].filter(Boolean).join(' ')));
    if((errors.length===kinds.length||restricted)&&!state.admin){
      try{
        const backup=window.GDDPublicReadOnly
          ? await window.GDDPublicReadOnly.load()
          : await (await fetch('./public-fallback.json?v=20261123-recovery-01',{cache:'no-store'})).json();
        if(backup.source!=='public-published-read-only-backup'||
           !kinds.every(k=>Array.isArray(backup[k])&&backup[k].every(row=>row.published===true)))throw Error('Bản sao không hợp lệ');
        kinds.forEach(k=>{state.data[k]=backup[k]});
        state.data.submissions=[];
        state.placements=Array.isArray(backup.placements)?backup.placements:[];
        state.usingFallback=true;
        const banner=$('#mode-banner');
        if(banner){
          banner.textContent='CHẾ ĐỘ DỰ PHÒNG · Đang xem tư liệu công khai từ bản sao an toàn. Những cập nhật mới sẽ hiển thị sau khi kết nối Supabase phục hồi.';
          banner.hidden=false;
        }
        updateSubgroupFilter();render();syncHash();
        return;
      }catch(fallbackError){console.warn('Không thể đọc bản sao công khai:',fallbackError)}
    }
    state.usingFallback=false;
    if(errors.length){toast('Một số chuyên mục chưa được khởi tạo trên Supabase: '+errors.join(', ')+'. Hãy chạy file SQL nâng cấp.');}
    if(state.admin){
      const {data,error}=await state.supabase.from('submissions').select('*').order('created_at',{ascending:false}).limit(200);
      state.data.submissions=error?[]:data||[];
    } else state.data.submissions=[];
    const {data:placements,error:placementError}=await state.supabase.from('gdd_content_placements').select('owner_kind,owner_id,target_kind,target_category,updated_at');
    if(placementError)console.warn('Không tải được vị trí hiển thị:',placementError);
    state.placements=placementError?[]:(placements||[]);
    updateSubgroupFilter();render();syncHash();
  }

  async function initSupabase(){
    // Explicit STAGING feature flag. The real website's main branch remains in maintenance.
    // Public browsing reads only Cloudflare D1; no Supabase auth/session/editor is initialized.
    if(config.publicReadProvider==='d1-staging'){
      try{
        if(!window.GDDPublicReadOnly)throw Error('Thiếu bộ kết nối tư liệu công khai');
        const archive=await window.GDDPublicReadOnly.load();
        const kinds=['people','posts','media','videos','obituaries','documents'];
        if(archive.source!=='public-published-read-only-backup'||
            !kinds.every(k=>Array.isArray(archive[k])&&archive[k].every(r=>r.published===true)))
          throw Error('Dữ liệu nguồn D1 không hợp lệ');
        for(const kind of kinds)state.data[kind]=archive[kind];
        state.data.submissions=[];
        state.placements=Array.isArray(archive.placements)?archive.placements:[];
        state.galleryImages=Array.isArray(archive.gallery)?archive.gallery:[];
        state.admin=false;state.user=null;state.supabase=null;state.usingFallback=true;
        $('#admin-login-area').hidden=true;
        $('#admin-editor-area').hidden=true;
        const banner=$('#mode-banner');
        if(banner){
          const liveDomain=/^(?:www\.)?dauxuacuadao\.info\.vn$/.test(location.hostname);
          banner.textContent=archive.backend==='d1'
            ? 'Tư liệu công khai đang được phục vụ từ Cloudflare D1.'
            : 'CHẾ ĐỘ DỰ PHÒNG · Đang xem tư liệu từ bản sao công khai đã kiểm tra. Bài mới tạm chưa cập nhật.';
          banner.hidden=liveDomain&&archive.backend==='d1';
        }
        updateSubgroupFilter();render();syncHash();return;
      }catch(error){
        console.error('D1 staging public preview failed',String(error?.message||'unknown'));
        state.data=demo;state.galleryImages=[];state.admin=false;state.supabase=null;
        $('#admin-login-area').hidden=true;$('#admin-editor-area').hidden=true;
        const banner=$('#mode-banner');
        if(banner){banner.textContent='Tạm thời chưa kết nối được kho tư liệu. Xin thử lại sau.';banner.hidden=false;}
        render();syncHash();return;
      }
    }
    if(!configured){state.data=demo;$('#mode-banner').hidden=false;render();syncHash();return}
    let stage='tải thư viện kết nối';
    try{
      let supabaseModule=null;
      try{
        supabaseModule=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      }catch(primaryError){
        console.warn('Không tải được Supabase từ jsDelivr, thử nguồn dự phòng.',primaryError);
        try{
          supabaseModule=await import('https://esm.sh/@supabase/supabase-js@2?bundle');
        }catch(secondaryError){
          console.error('Cả hai nguồn tải thư viện đều không hoạt động.',secondaryError);
          throw new Error('Không tải được thư viện Supabase từ hai nguồn. Hãy thử mở web bằng Safari.');
        }
      }
      if(typeof supabaseModule?.createClient!=='function')throw new Error('Thư viện Supabase không cung cấp createClient.');
      stage='khởi tạo kết nối';
      state.supabase=supabaseModule.createClient(config.supabaseUrl,config.supabasePublishableKey);
      stage='kiểm tra phiên đăng nhập';
      const {data:{session}}=await state.supabase.auth.getSession();
      state.user=session?.user||null;
      if(state.user)await verifyAdmin();
      stage='tải dữ liệu';
      await fetchData();
      if(state.admin)buildEditor();
      state.supabase.auth.onAuthStateChange((_event,session)=>{state.user=session?.user||null;if(!state.user){window.GDDR2?.close();state.admin=false;$('#admin-login-area').hidden=false;$('#admin-editor-area').hidden=true;fetchData()}});
      $('#mode-banner').hidden=!state.usingFallback;
    }catch(err){
      console.error('Không thể khởi tạo website tại bước '+stage,err);
      const reason=String(err?.message||err||'Lỗi chưa xác định').slice(0,180);
      if(stage==='tải dữ liệu'){
        // Lỗi đọc/hiển thị dữ liệu không đồng nghĩa mất kết nối hay sai API key.
        $('#mode-banner').hidden=true;
        toast('Có lỗi khi tải hoặc hiển thị dữ liệu: '+reason);
        return;
      }
      toast('Lỗi khởi tạo ('+stage+'): '+reason);
      state.data=demo;$('#mode-banner').hidden=false;render();syncHash();
    }
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
    e.preventDefault();
    const form=e.currentTarget,notice=$('#submission-status'),btn=form.querySelector('[type="submit"]');
    if(form.elements.website.value)return; // honeypot: never contact the server
    if(!form.reportValidity())return;
    btn.disabled=true;notice.textContent='Đang chuẩn bị tư liệu gửi riêng cho Ban Biên Tập…';
    try{
      const outgoing=new FormData(form);
      let file=form.elements.attachment.files[0]||null;
      if(file){
        if(file.type==='application/pdf'){
          if(file.size>6*1024*1024)throw Error('Tệp PDF tối đa 6 MB.');
        }else{
          if(!window.GDDImageOptimizer)throw Error('Chưa tải được bộ xử lý ảnh. Xin tải lại trang.');
          file=await window.GDDImageOptimizer.prepare(file,{onStatus:msg=>{notice.textContent=msg;}});
        }
        if(!fileTypes[file.type])throw Error('Chỉ nhận ảnh JPEG, PNG, WebP hoặc PDF.');
        if(file.size>6*1024*1024)throw Error('Tệp quá 6 MB; xin gửi liên kết lưu trữ thay thế.');
        outgoing.set('attachment',file,'tu-lieu-dong-gop.'+fileTypes[file.type]);
      }else outgoing.delete('attachment');
      notice.textContent='Đang chuyển tư liệu vào hộp thư riêng của Ban Biên Tập…';
      const response=await fetch('https://gdd-d1-api-staging.realmetayninh7649.workers.dev/api/v1/contributions',{
        method:'POST',body:outgoing,credentials:'omit',cache:'no-store'
      });
      const result=await response.json().catch(()=>({error:'invalid_response'}));
      if(!response.ok||result.accepted!==true||result.private!==true){
        const messages={
          too_many_requests:'Quí vị vừa gửi một tư liệu. Vui lòng thử lại sau ít phút.',
          inbox_capacity_reached:'Hộp thư đang cần được Ban Biên Tập xử lý. Xin quay lại sau.',
          attachment_too_large:'Tệp vượt 6 MB; vui lòng sử dụng liên kết tư liệu.',
          invalid_attachment_signature:'Tệp đính kèm không hợp lệ. Xin chọn ảnh JPEG/PNG/WebP hoặc PDF.',
          inbox_temporarily_unavailable:'Hộp thư tạm thời chưa kết nối. Vui lòng thử lại sau.'
        };
        throw Error(messages[result.error]||'Tư liệu chưa được tiếp nhận, vui lòng thử lại.');
      }
      form.reset();
      notice.textContent='Đã tiếp nhận tư liệu riêng tư. Mã tiếp nhận: '+String(result.reference||'').slice(0,8).toUpperCase()+
        '. Ban Biên Tập sẽ xem xét trước khi công bố. Xin cảm ơn quí Huynh Tỷ Đệ Muội!';
    }catch(err){notice.textContent='Chưa gửi được: '+(err.message||'Xin thử lại sau.');}
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
    $('#document-subfolder-filters')?.addEventListener('click',event=>{
      const back=event.target.closest('[data-document-folder-back]');
      const button=event.target.closest('[data-document-subfolder]');
      if(!event.currentTarget.contains(back||button))return;
      const group=back?'browse':button?.dataset.documentSubfolder;
      if(group!=='browse'&&group!=='all'&&!documentSubfolders.some(f=>f.code===group))return;
      // Sau khi mở thư mục, các thư mục khác thu gọn và tài liệu hiện trực tiếp ngay dưới.
      // Không sửa URL hay khởi động lại trang nên giữ nguyên phóng to/thu nhỏ của iPhone.
      state.documentSubfolder=group;
      render();
      requestAnimationFrame(()=>{
        const folder=$('#document-subfolder-filters');
        if(!folder?.isConnected)return;
        const header=$('.site-header');
        const position=header?getComputedStyle(header).position:'static';
        const headerGap=['fixed','sticky'].includes(position)?Math.min(160,header.getBoundingClientRect().height):0;
        const y=window.scrollY+folder.getBoundingClientRect().top-headerGap-14;
        window.scrollTo({top:Math.max(0,Math.round(y)),left:0,behavior:'instant'});
      });
    });
    $('#gallery-category-filters').addEventListener('click',event=>{
      const button=event.target.closest('[data-gallery-category]');
      if(!button||!event.currentTarget.contains(button))return;
      const selected=button.dataset.galleryCategory;
      if(selected!=='all'&&!galleryCategories.includes(selected))return;
      state.galleryCategory=selected;render();
    });
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
      if(state.usingFallback){
        $('#login-message').textContent='Supabase đang giới hạn dịch vụ do vượt lưu lượng. Chưa thể đăng nhập quản trị; không cần thay đổi mật khẩu. Hãy tải lại website sau khi Supabase được mở lại.';
        return;
      }
      const form=e.currentTarget,btn=$('button[type="submit"]',form);
      btn.disabled=true;$('#login-message').textContent='Đang xác thực…';
      try{
        const email=form.elements.email.value.trim(),password=form.elements.password.value;
        const {data,error}=await state.supabase.auth.signInWithPassword({email,password});
        if(error){
          const quota=/exceed_(?:cached_)?egress_quota|service for this project is restricted|\b402\b/i.test(String(error.message||''));
          $('#login-message').textContent=quota
            ? 'Supabase tạm hạn chế dịch vụ vì vượt lưu lượng. Chưa thể đăng nhập; mật khẩu không nhất thiết bị sai.'
            : String(error.message||'Không thể đăng nhập lúc này.');
        }else{
          state.user=data.user;
          await verifyAdmin();
          if(state.admin){$('#login-message').textContent='';form.reset();await fetchData()}
          else await state.supabase.auth.signOut();
        }
      }catch(error){
        $('#login-message').textContent='Không kết nối được máy chủ quản trị. Xin thử lại sau.';
      }finally{btn.disabled=false;}
    });
    $('#logout-button').addEventListener('click',async()=>{window.GDDR2?.close();if(state.supabase)await state.supabase.auth.signOut();state.user=null;state.admin=false;$('#admin-login-area').hidden=false;$('#admin-editor-area').hidden=true;closeAdmin();await fetchData();toast('Đã đăng xuất')});
    $$('.editor-tabs button').forEach(b=>b.addEventListener('click',()=>{state.editorKind=b.dataset.kind;state.editingId=null;state.editorListExpanded=false;$('#editor-record-search').value='';buildEditor();renderEditorList()}));
    $('#editor-record-search').addEventListener('input',()=>{
      $('#editor-list').scrollTop=0;renderEditorList();
    });
    $('#editor-list-toggle').addEventListener('click',()=>{
      state.editorListExpanded=!state.editorListExpanded;
      $('#editor-list').scrollTop=0;renderEditorList();
    });
    $('#editor-new').addEventListener('click',()=>{state.editingId=null;buildEditor()});
    $('#gdd-transfer-form').addEventListener('submit',submitTransfer);
    $('#gdd-transfer-close').addEventListener('click',closeTransfer);
    $('#gdd-transfer-cancel').addEventListener('click',closeTransfer);
    $('#gdd-transfer-dialog').addEventListener('click',e=>{if(e.target.id==='gdd-transfer-dialog')closeTransfer()});
    $('#editor-form').addEventListener('submit',saveRecord);
    $('#editor-form').addEventListener('input',()=>{refreshPersonCodePreview();refreshDocumentCodePreview();});
    $('#editor-form').addEventListener('change',()=>{refreshPersonCodePreview();refreshDocumentCodePreview();});
    document.addEventListener('click',e=>{
      const playback=e.target.closest('[data-video-play]');if(playback){playVideo(playback.dataset.videoPlay,playback);return}
      const close=e.target.closest('[data-close]');if(close){if(close.dataset.close==='detail')closeDetail();else closeAdmin();return}
      const open=e.target.closest('[data-open-kind]');if(open){const kind=open.dataset.openKind,record=publicRows(kind).find(x=>x.id===open.dataset.id);openDetail(kind,record);return}
      const edit=e.target.closest('[data-edit-kind]');if(edit){editRecord(edit.dataset.editKind,edit.dataset.editId);return}
      const transfer=e.target.closest('[data-list-transfer]');if(transfer){openTransfer(transfer.dataset.listTransfer,transfer.dataset.id);return}
      const listEdit=e.target.closest('[data-list-edit]');if(listEdit){editRecord(listEdit.dataset.listEdit,listEdit.dataset.id);return}
      const qr=e.target.closest('[data-list-qr]');if(qr){const kind=qr.dataset.listQr,record=state.data[kind]?.find(x=>x.id===qr.dataset.id);if(record){closeAdmin(false);openDetail(kind,record)}return}
      const incoming=e.target.closest('[data-submission-open]');if(incoming){showSubmission(incoming.dataset.submissionOpen);return}
      const reviewed=e.target.closest('[data-mark-reviewed]');if(reviewed){markReviewed(reviewed.dataset.markReviewed);return}
      if(e.target.id==='delete-record')deleteRecord();
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#gdd-transfer-dialog').hidden)closeTransfer();else if(!$('#detail-overlay').hidden)closeDetail();else if(!$('#admin-overlay').hidden)closeAdmin()}});
    window.addEventListener('hashchange',syncHash);
    window.addEventListener('popstate',()=>{
      // Quay lại dùng Back trên iPhone, Android, PC; ưu tiên màn hình lịch sử.
      if(!$('#admin-overlay').hidden&&history.state?.__gddLayer!=='admin')dismissAdmin();
      else if(history.state?.__gddLayer==='admin'&&$('#admin-overlay').hidden){
        $('#admin-overlay').hidden=false;
        document.body.classList.add('modal-open');
      }
      if(!detailRoute.test(location.hash))dismissDetail();
      // Khi Back chỉ đóng ảnh phủ trên hồ sơ, không dựng lại nội dung hồ sơ
      // (tránh mất vị trí đọc); hashchange riêng lo các URL đã đổi.
    });
    const ob=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){$$('[data-nav]').forEach(x=>x.classList.toggle('active',x.dataset.nav===entry.target.id))}})},{rootMargin:'-25% 0px -55% 0px'});
    $$('.section-anchor').forEach(s=>ob.observe(s));
  }
  bindEvents();initSupabase();
})();
