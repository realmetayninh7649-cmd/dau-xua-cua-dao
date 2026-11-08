(function ChantPlayer(){
 'use strict';
 if(window.__gddChantAudioV1)return;
 window.__gddChantAudioV1=true;
 const SOURCE='audio/niem-danh-dieu-tri-kim-mau.mp3';
 const OPT='gdd-niem-phat-mau-audio-enabled-v1';
 const VOL='gdd-niem-phat-mau-volume-v1';
 const read=(key)=>{try{return localStorage.getItem(key)}catch{return null}};
 const write=(key,value)=>{try{localStorage.setItem(key,value)}catch{}};
 const css=document.createElement('style');
 css.id='gdd-chant-player-css';
 css.textContent=`
 /* Trình niệm gọn, chỉ chiếm 44px ở trạng thái thu nhỏ. */
 #gdd-chant-widget{
   position:fixed;right:12px;bottom:calc(16px + env(safe-area-inset-bottom,0px));
   z-index:990;width:min(236px,calc(100vw - 24px));max-width:calc(100vw - 24px);
   color:#214d40;font-family:'Be Vietnam Pro',Arial,sans-serif;
   filter:drop-shadow(0 3px 10px rgba(15,49,38,.12))
 }
 #gdd-chant-widget *,#gdd-chant-widget *::before,#gdd-chant-widget *::after{box-sizing:border-box}
 #gdd-chant-widget .gdd-chant-card{
   width:100%;border:1px solid #c9bfa6;border-radius:11px;
   background:#fcfaf2;padding:8px 9px;box-shadow:inset 0 0 0 1px #f3ecd9
 }
 #gdd-chant-widget .gdd-chant-top{display:flex;gap:7px;align-items:center;min-width:0}
 #gdd-chant-widget .gdd-chant-emblem{
   display:grid;place-items:center;flex:none;width:27px;height:27px;
   background:#245649;color:#eee0af;border-radius:50%;font:18px/1 Georgia,serif
 }
 #gdd-chant-widget .gdd-chant-names{display:block;flex:1;min-width:0}
 #gdd-chant-widget .gdd-chant-names strong{
   display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;
   font:700 11px/1.35 'Noto Serif',Georgia,serif;color:#245345
 }
 #gdd-chant-widget .gdd-chant-names small{
   display:block;color:#9d7f48;font:600 9px/1.3 'Be Vietnam Pro',Arial,sans-serif
 }
 #gdd-chant-widget .gdd-chant-minimize{
   flex:none;width:27px;height:27px;min-height:27px;padding:0;cursor:pointer;
   border:1px solid #d7cdb8;border-radius:7px;background:#fffdf7;
   color:#285749;font:20px/1 Arial,sans-serif
 }
 #gdd-chant-widget .gdd-chant-bottom{display:flex;gap:9px;align-items:center;margin-top:8px}
 #gdd-chant-widget .gdd-chant-play{
   min-height:33px;min-width:92px;flex:none;padding:6px 8px;border:0;border-radius:7px;
   cursor:pointer;background:#245649;color:#fff;
   font:700 10px/1.3 'Be Vietnam Pro',Arial,sans-serif
 }
 #gdd-chant-widget .gdd-chant-volume{display:flex;flex:1;align-items:center;gap:4px;min-width:0;font-size:13px;color:#907747}
 #gdd-chant-widget .gdd-chant-volume input{width:100%;min-width:0;accent-color:#275b4c}
 #gdd-chant-widget .gdd-chant-note{
   overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
   margin:6px 0 0;font:400 9px/1.4 'Be Vietnam Pro',Arial,sans-serif;color:#6b786d
 }
 #gdd-chant-widget button:focus-visible,#gdd-chant-widget input:focus-visible{outline:3px solid #bc9655;outline-offset:2px}
 #gdd-chant-widget .gdd-chant-reopen{
   display:none;position:relative;float:none;align-items:center;justify-content:center;
   width:44px;height:44px;min-width:44px;min-height:44px;border-radius:50%;
   border:1px solid #c5b37e;background:#245649;color:#f2e7c9;
   font:22px/1 Georgia,serif;cursor:pointer;
   box-shadow:0 3px 10px rgba(15,49,38,.14)
 }
 #gdd-chant-widget.gdd-chant-collapsed{width:44px;height:44px;filter:none}
 #gdd-chant-widget.gdd-chant-collapsed .gdd-chant-card{display:none}
 #gdd-chant-widget.gdd-chant-collapsed .gdd-chant-reopen{display:flex}
 #gdd-chant-widget.gdd-chant-playing .gdd-chant-reopen::after{
   content:'';position:absolute;right:0;top:0;width:8px;height:8px;
   border-radius:50%;background:#e6d18c;border:1px solid #245649
 }
 @media(max-width:520px){
   #gdd-chant-widget{right:11px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:min(228px,calc(100vw - 22px))}
   #gdd-chant-widget.gdd-chant-collapsed{width:44px}
 }
 @media(prefers-reduced-motion:reduce){#gdd-chant-widget *{transition:none!important}}
 `
 document.head.append(css);
 function start(){
  if(document.getElementById('gdd-chant-widget'))return;
  const wrapper=document.createElement('aside');
  wrapper.id='gdd-chant-widget';
  wrapper.setAttribute('aria-label','Trình phát niệm danh hiệu Đức Phật Mẫu');
  // Mặc định thu nhỏ; không hề ảnh hưởng tới phát nhạc.
  wrapper.classList.add('gdd-chant-collapsed');
  wrapper.innerHTML=`
  <button type="button" class="gdd-chant-reopen" aria-label="Mở bảng điều khiển Niệm Danh Diêu Trì Kim Mẫu" title="Mở bảng nghe Niệm Danh Diêu Trì Kim Mẫu">♫</button>
  <div class="gdd-chant-card">
    <div class="gdd-chant-top"><span class="gdd-chant-emblem" aria-hidden="true">♫</span>
      <span class="gdd-chant-names"><strong title="Niệm Danh Diêu Trì Kim Mẫu">Niệm Danh Diêu Trì Kim Mẫu</strong><small>Âm thanh Đại Đạo</small></span>
      <button type="button" class="gdd-chant-minimize" aria-label="Thu gọn bảng nghe, tiếp tục phát nhạc" title="Thu gọn, nhạc vẫn phát">−</button>
    </div>
    <div class="gdd-chant-bottom"><button type="button" class="gdd-chant-play" aria-pressed="false">▶ Nghe niệm</button>
      <label class="gdd-chant-volume" aria-label="Âm lượng"><span aria-hidden="true">♪</span><input type="range" min="0" max="100" step="5" aria-label="Âm lượng niệm Phật Mẫu" value="25"></label>
    </div>
    <p class="gdd-chant-note" role="status" aria-live="polite">Chạm để nghe niệm danh hiệu Đức Phật Mẫu.</p>
  </div>`;
  document.body.append(wrapper);
  const playButton=wrapper.querySelector('.gdd-chant-play');
  const minimize=wrapper.querySelector('.gdd-chant-minimize');
  const reopen=wrapper.querySelector('.gdd-chant-reopen');
  const volume=wrapper.querySelector('.gdd-chant-volume input');
  const note=wrapper.querySelector('.gdd-chant-note');
  const audio=document.createElement('audio');
  audio.src=SOURCE;audio.preload='none';audio.loop=true;
  let desired=read(OPT)!=='off';
  let videoInterrupt=false,wasPlayingBeforeHidden=false,tryNumber=0;
  let initialVolume=Number(read(VOL));
  if(read(VOL)===null||!Number.isFinite(initialVolume))initialVolume=25;
  initialVolume=Math.max(0,Math.min(100,initialVolume));
  audio.volume=initialVolume/100;volume.value=String(initialVolume);
  const playing=()=>!audio.paused&&!audio.ended;
  function view(message){
    const isPlaying=playing();
    playButton.textContent=isPlaying?'❚❚ Tạm dừng':'▶ Nghe niệm';
    playButton.setAttribute('aria-pressed',String(isPlaying));
    wrapper.classList.toggle('gdd-chant-playing',isPlaying);
    reopen.setAttribute('aria-label',isPlaying?
      'Nhạc niệm Phật Mẫu đang phát. Mở bảng điều khiển':
      'Mở bảng điều khiển Niệm Danh Diêu Trì Kim Mẫu');
    if(message)note.textContent=message;
  }
  async function attempt(manual=false){
    if(manual){desired=true;videoInterrupt=false;write(OPT,'on')}
    if(!desired||videoInterrupt)return;
    const ticket=++tryNumber;
    try{
      await audio.play();
      if(ticket===tryNumber)view('Đang phát · Lặp lại bản niệm');
    }catch(err){
      if(ticket===tryNumber)view(err?.name==='NotAllowedError'?
        'Trình duyệt yêu cầu chạm ▶ để bật âm thanh.':
        'Chưa phát được âm thanh. Hãy chạm ▶ để thử lại.');
    }
  }
  function pause(message,disable=false){
    tryNumber++;audio.pause();
    if(disable){desired=false;write(OPT,'off')}
    view(message||'Đã tạm dừng.');
  }
  function pauseForVideo(){
    if(!playing())return;
    videoInterrupt=true;
    pause('Tạm dừng để nghe âm thanh video.');
  }
  playButton.addEventListener('click',()=>{
    if(playing())pause('Đã tạm dừng.',true);
    else attempt(true);
  });
  minimize.addEventListener('click',()=>{
    // Chỉ ẩn giao diện điều khiển: KHÔNG gọi audio.pause(),
    // không đổi trạng thái bật/tắt và không tua lại bản thu.
    wrapper.classList.add('gdd-chant-collapsed');
  });
  reopen.addEventListener('click',()=>{
    wrapper.classList.remove('gdd-chant-collapsed');
    view(playing()?'Đang phát · Lặp lại bản niệm':
      'Chạm ▶ để nghe niệm danh hiệu Đức Phật Mẫu.');
  });
  volume.addEventListener('input',()=>{
    const val=Math.max(0,Math.min(100,Number(volume.value)||0));
    audio.volume=val/100;write(VOL,String(val));
  });
  audio.addEventListener('playing',()=>view('Đang phát · Lặp lại bản niệm'));
  audio.addEventListener('pause',()=>view());
  audio.addEventListener('error',()=>view('Không tải được âm thanh. Hãy tải lại trang để thử lần nữa.'));
  document.addEventListener('play',event=>{
    if(event.target instanceof HTMLVideoElement)pauseForVideo();
  },true);
  document.addEventListener('click',event=>{
    if(event.target.closest?.('[data-video-play],[data-open-kind="videos"],.video-preview-slot video,.detail-video-preview video'))pauseForVideo();
  },true);
  window.addEventListener('hashchange',()=>{
    if(location.hash.startsWith('#video-dao-su/'))pauseForVideo();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){wasPlayingBeforeHidden=playing();if(wasPlayingBeforeHidden)pause('Tạm dừng khi rời website.');}
    else if(wasPlayingBeforeHidden){wasPlayingBeforeHidden=false;attempt(false)}
  });
  if(desired)attempt(false);
  else view('Âm thanh đã tắt. Chạm ▶ khi muốn nghe.');
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();