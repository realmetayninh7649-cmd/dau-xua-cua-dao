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
 #gdd-chant-widget{position:fixed;right:14px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:990;width:min(282px,calc(100vw - 28px));font-family:'Be Vietnam Pro',Arial,sans-serif;filter:drop-shadow(0 8px 16px rgba(15,49,38,.16));color:#214d40}
 #gdd-chant-widget *,#gdd-chant-widget *::before{box-sizing:border-box}
 #gdd-chant-widget .gdd-chant-card{border:1px solid #c7bd9b;border-radius:13px;background:#fbfaf3;padding:11px 12px 12px;box-shadow:inset 0 0 0 1px #f5efd7}
 #gdd-chant-widget .gdd-chant-top{display:flex;align-items:center;gap:10px}
 #gdd-chant-widget .gdd-chant-emblem{display:grid;place-items:center;flex:none;width:38px;height:38px;border-radius:50%;background:#1c5548;color:#eee2bb;font:normal 23px/1 Georgia,serif}
 #gdd-chant-widget .gdd-chant-names{flex:1;min-width:0}
 #gdd-chant-widget .gdd-chant-names strong{display:block;font:700 12px/1.45 'Noto Serif',Georgia,serif;color:#225245}
 #gdd-chant-widget .gdd-chant-names small{display:block;margin-top:2px;color:#977a43;font:600 10px/1.3 'Be Vietnam Pro',Arial,sans-serif}
 #gdd-chant-widget .gdd-chant-minimize{flex:none;border:1px solid #d4cebd;border-radius:8px;background:#fffdf7;color:#28574a;width:33px;height:33px;cursor:pointer;font-size:21px;line-height:1}
 #gdd-chant-widget .gdd-chant-bottom{display:flex;gap:10px;align-items:center;margin-top:10px}
 #gdd-chant-widget .gdd-chant-play{flex:0 0 auto;min-width:115px;min-height:40px;border:0;border-radius:8px;background:#1f594a;color:white;padding:8px 11px;font:700 11px/1.3 'Be Vietnam Pro',Arial,sans-serif;cursor:pointer}
 #gdd-chant-widget .gdd-chant-play:hover{background:#164639}
 #gdd-chant-widget .gdd-chant-volume{display:flex;flex:1;gap:5px;align-items:center;min-width:0;font-size:15px;color:#786948}
 #gdd-chant-widget .gdd-chant-volume input{width:100%;min-width:0;accent-color:#27604f;cursor:pointer}
 #gdd-chant-widget .gdd-chant-note{margin:8px 0 0;font:400 10px/1.5 'Be Vietnam Pro',Arial,sans-serif;color:#6a786d}
 #gdd-chant-widget button:focus-visible,#gdd-chant-widget input:focus-visible{outline:3px solid #bb9759;outline-offset:2px}
 #gdd-chant-widget .gdd-chant-reopen{display:none;align-items:center;justify-content:center;float:right;width:50px;height:50px;border:1px solid #bfa86f;border-radius:50%;background:#1d5547;color:#f7e8be;font:normal 25px/1 Georgia,serif;cursor:pointer}
 #gdd-chant-widget.gdd-chant-collapsed .gdd-chant-card{display:none}
 #gdd-chant-widget.gdd-chant-collapsed .gdd-chant-reopen{display:flex}
 @media(max-width:520px){#gdd-chant-widget{right:11px;bottom:calc(12px + env(safe-area-inset-bottom,0px));width:min(260px,calc(100vw - 22px))}#gdd-chant-widget .gdd-chant-names strong{font-size:11px}#gdd-chant-widget .gdd-chant-card{padding:10px}}
 @media(prefers-reduced-motion:reduce){#gdd-chant-widget *{transition:none!important}}
 `;
 document.head.append(css);
 function start(){
  if(document.getElementById('gdd-chant-widget'))return;
  const wrapper=document.createElement('aside');
  wrapper.id='gdd-chant-widget';
  wrapper.setAttribute('aria-label','Trình phát niệm danh hiệu Đức Phật Mẫu');
  wrapper.innerHTML=`
  <button type="button" class="gdd-chant-reopen" aria-label="Mở trình nghe Niệm Danh Diêu Trì Kim Mẫu" title="Niệm danh hiệu Đức Phật Mẫu">♫</button>
  <div class="gdd-chant-card">
    <div class="gdd-chant-top"><span class="gdd-chant-emblem" aria-hidden="true">♫</span>
      <span class="gdd-chant-names"><strong>Niệm Danh Diêu Trì Kim Mẫu</strong><small>Âm thanh Đại Đạo</small></span>
      <button type="button" class="gdd-chant-minimize" aria-label="Thu gọn và tạm dừng nhạc" title="Thu gọn">−</button>
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
    playButton.textContent=playing()?'❚❚ Tạm dừng':'▶ Nghe niệm';
    playButton.setAttribute('aria-pressed',String(playing()));
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
    pause('Đã thu gọn trình nghe.',true);
    wrapper.classList.add('gdd-chant-collapsed');
  });
  reopen.addEventListener('click',()=>{
    wrapper.classList.remove('gdd-chant-collapsed');
    view('Chạm ▶ để nghe niệm danh hiệu Đức Phật Mẫu.');
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