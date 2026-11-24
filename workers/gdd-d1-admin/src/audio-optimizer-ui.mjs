/* LAME JS is loaded as an independent, pinned, same-origin library. */
export const AUDIO_ENCODER_WORKER=String.raw`
importScripts('/admin/mp3-encoder.js');
let encoder=null,parts=[];
self.onmessage=event=>{
 const {type,channels,rate,kbps,left,right}=event.data;
 try{
  if(type==='start'){encoder=new lamejs.Mp3Encoder(channels,rate,kbps);parts=[];self.postMessage({type:'ready'});return}
  if(!encoder)throw Error('Encoder chưa khởi tạo');
  if(type==='chunk'){
   for(let i=0;i<left.length;i+=1152){
    const l=left.subarray(i,i+1152);
    const bytes=right?encoder.encodeBuffer(l,right.subarray(i,i+1152)):encoder.encodeBuffer(l);
    if(bytes.length)parts.push(new Uint8Array(bytes));
   }
   self.postMessage({type:'ready'});return;
  }
  if(type==='finish'){const last=encoder.flush();if(last.length)parts.push(new Uint8Array(last));const blob=new Blob(parts,{type:'audio/mpeg'});parts=[];encoder=null;self.postMessage({type:'done',blob});}
 }catch(e){self.postMessage({type:'error',message:String(e.message||e)})}
};
`;
export const AUDIO_OPTIMIZER_JS=String.raw`
(()=>{
'use strict';
const profiles={'radio-dao-su':{kbps:64,channels:1,rate:32000},'thuyet-minh':{kbps:64,channels:1,rate:32000},'niem-danh':{kbps:96,channels:2,rate:44100},'nhac-dao':{kbps:128,channels:2,rate:44100}};
const MAX_OUTPUT=24*1048576;
function durationOf(file){
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(file),audio=new Audio();let done=false;
  const finish=(value,error)=>{if(done)return;done=true;clearTimeout(timer);audio.onloadedmetadata=audio.onerror=null;audio.removeAttribute('src');audio.load();URL.revokeObjectURL(url);error?reject(Error(error)):resolve(value)};
  const timer=setTimeout(()=>finish(0,'Không đọc được thời lượng MP3.'),15000);
  audio.preload='metadata';audio.onloadedmetadata=()=>Number.isFinite(audio.duration)&&audio.duration>0?finish(audio.duration):finish(0,'Thời lượng MP3 không hợp lệ.');
  audio.onerror=()=>finish(0,'Tệp âm thanh không đọc được.');audio.src=url;
 });
}
function workerEncoder(){
 const worker=new Worker('/admin/audio-encoder-worker.js');let pending=null,failed=null;
 const fail=message=>{failed=Error(message);if(pending){clearTimeout(pending.timer);pending.reject(failed);pending=null}};
 worker.onerror=e=>fail(e.message||'Không tải được bộ nén MP3');
 worker.onmessage=e=>{if(!pending)return;const p=pending;pending=null;clearTimeout(p.timer);e.data.type==='error'?p.reject(Error(e.data.message)):p.resolve(e.data)};
 return {send(message,transfer=[]){return new Promise((resolve,reject)=>{if(failed)return reject(failed);const timer=setTimeout(()=>fail('Bộ nén MP3 không phản hồi.'),60000);pending={resolve,reject,timer};try{worker.postMessage(message,transfer)}catch(e){fail(e.message)}})},close(){worker.terminate()}};
}
function pcm(value){return Math.max(-32768,Math.min(32767,Math.round(value*32768)))}
async function optimize(file,category,notify=()=>{}){
 const p=profiles[category];if(!p)throw Error('Chọn chuyên mục âm thanh trước.');
 notify('Đang kiểm tra dung lượng và thời lượng…');
 const duration=await durationOf(file),estimate=duration*p.kbps*1000/8;
 // Already-light MP3: do not re-encode or increase its size.
 if(file.size<=estimate*1.03&&file.size<=MAX_OUTPUT)return {blob:file,duration:Math.round(duration),optimized:false,kbps:p.kbps};
 if(estimate>MAX_OUTPUT)throw Error('Bản nghe dự kiến vượt 24 MB. Hãy chia bài hoặc chọn MP3 nhẹ hơn.');
 // Avoid overwhelming mobile Safari with very long decoded PCM.
 if(duration*p.rate*2*4>256*1048576)throw Error('Bài quá dài để nén an toàn trên trình duyệt. Hãy nén MP3 trước hoặc chia bài.');
 const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
 if(!Offline||!window.Worker)throw Error('Thiết bị chưa hỗ trợ nén MP3. Hãy chọn MP3 đã tối ưu.');
 notify('Đang giải mã MP3 trên thiết bị…');
 const context=new Offline(1,1,p.rate);
 const decoded=await context.decodeAudioData(await file.arrayBuffer());
 const channels=p.channels===1?1:Math.min(decoded.numberOfChannels,2);
 const left=decoded.getChannelData(0),right=decoded.numberOfChannels>1?decoded.getChannelData(1):null;
 const encoder=workerEncoder();
 let out;
 try{
  await encoder.send({type:'start',channels,rate:decoded.sampleRate,kbps:p.kbps});
  for(let i=0;i<decoded.length;i+=1152*32){
   const n=Math.min(1152*32,decoded.length-i),l=new Int16Array(n),r=channels===2?new Int16Array(n):null;
   for(let j=0;j<n;j++){
    l[j]=pcm(channels===1&&right?(left[i+j]+right[i+j])/2:left[i+j]);
    if(r)r[j]=pcm(right[i+j]);
   }
   const transfer=[l.buffer];if(r)transfer.push(r.buffer);
   await encoder.send({type:'chunk',left:l,right:r},transfer);
   notify('Đang tối ưu MP3: '+Math.round((i+n)/decoded.length*100)+'%');
  }
  out=(await encoder.send({type:'finish'})).blob;
 }finally{encoder.close()}
 if(!out||out.size<4||out.size>MAX_OUTPUT)throw Error('Bản nghe tối ưu không hợp lệ hoặc vượt 24 MB.');
 const newDuration=await durationOf(out);
 if(Math.abs(newDuration-duration)>Math.max(2,duration*.015))throw Error('Thời lượng bản nghe không khớp; chưa tải lên.');
 if(out.size>=file.size&&file.size<=MAX_OUTPUT)return {blob:file,duration:Math.round(duration),optimized:false,kbps:p.kbps};
 return {blob:out,duration:Math.round(newDuration),optimized:true,kbps:p.kbps};
}
window.GDDAudioOptimizer={optimize,profiles};
})();
`;
