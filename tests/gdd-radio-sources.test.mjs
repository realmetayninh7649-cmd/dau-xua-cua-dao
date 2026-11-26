import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const radio=readFileSync('gdd-audio-radio.js','utf8');
const page=readFileSync('index.html','utf8');
test('radio always uses published D1 dataset when website is in D1 mode',()=>{
 assert.match(radio,/const d1Audio=cfg\.publicReadProvider==='d1-staging'/);
 assert.match(radio,/if\(d1Audio\)throw Error\('Public radio must read Cloudflare D1'\)/);
 assert.match(radio,/const backup=await window\.GDDPublicReadOnly\?\.load\(\)/);
 assert.match(radio,/if\(d1Audio\)throw Error\('Search radio must read Cloudflare D1'\)/);
 assert.match(radio,/row\.published===true/);
});
test('two original 2026 Radio covers have pixel-optimized WebP previews',()=>{
 for(const [path,size,sha] of [
  ['audio/radio-hai-muoi-nam-cover.webp',69566,'6d6504c01cc1a58b0790de8490b5bbdbb04268953b0ce3c368054e15de9ba732'],
  ['audio/niem-danh-kim-mau-cover.webp',154422,'cab2a92e11789cdbbdae5a289e3935a4774b3583a7efc07511f98d43fb4eecdd']]){
  assert.equal(statSync(path).size,size);
  const file=readFileSync(path);
  assert.equal(file.toString('ascii',0,4),'RIFF');
  assert.equal(file.toString('ascii',8,12),'WEBP');
  assert.equal(createHash('sha256').update(file).digest('hex'),sha);
  // Preserve archival covers on disk, but the public playlist no longer loads them.
 }
});
test('unavailable archived MP3 is reported as source storage problem, not iPhone internet',()=>{
 assert.ok(!radio.includes('Không mở được MP3. Vui lòng kiểm tra kết nối Internet.'));
 assert.ok(radio.includes('Tệp MP3 tại kho âm thanh cũ hiện không truy cập được'));
 assert.ok(radio.includes('gdd-radio-play-status'));
 assert.ok(radio.includes('radioIcon(row.category)'));
});
test('latest radio script bypasses Safari stale cache and preserves existing GitHub MP3',()=>{
 assert.match(page,/gdd-audio-radio\.js\?v=20261127-auto-next-01/);
 assert.ok(statSync('audio/niem-danh-dieu-tri-kim-mau.mp3').size>3000000);
});

test('failed MP3 controls do not show broken native player on iPhone and can retry without changing stored record',()=>{
 assert.ok(radio.includes('id="gdd-radio-retry"'));
 assert.ok(radio.includes('player.hidden=true;retry.hidden=false'));
 assert.ok(radio.includes('retry.addEventListener'));
 assert.ok(radio.includes("player.src=url;player.load()"));
 assert.ok(radio.includes('audio[hidden]{display:none!important}'));
});

test('compact audio list uses title and category icon, with Nhac Dao and hidden legacy admin entry',()=>{
 const list=radio.slice(radio.indexOf('function itemHTML('),radio.indexOf('function renderList('));
 assert.ok(!list.includes('<img'));
 assert.ok(!list.includes('row.summary'));
 assert.ok(radio.includes('data-gdd-radio-filter="nhac-dao"'));
 assert.ok(radio.includes("'nhac-dao':'Nhạc Đạo'"));
 assert.match(page,/id="admin-open"[^>]*hidden disabled/);
});


test('automatic next follows same category and stops at end, without replaying saved position',()=>{
 const start=radio.indexOf('function nextAutomaticTrack('),end=radio.indexOf('async function advanceAfterEnd(',start);
 const choose=new Function(radio.slice(start,end)+';return nextAutomaticTrack')();
 const rows=[{id:'a',category:'nhac-dao',audio_url:'a.mp3'},{id:'b',category:'radio-dao-su',audio_url:'b.mp3'},{id:'c',category:'nhac-dao',audio_url:''},{id:'d',category:'nhac-dao',audio_url:'d.mp3'}];
 assert.equal(choose(rows,rows[0]).id,'d');assert.equal(choose(rows,rows[3]),null);assert.equal(choose(rows,{id:'missing'}),null);
 assert.ok(radio.includes('selectProgram(chosen,true,true)'));
 assert.ok(radio.includes('if(!state.selected||advancing||repeatEnabled)return'));
 assert.ok(radio.includes('await fetchPublic(false)'));
 assert.ok(radio.includes("const saved=fromBeginning?0:progressFor(row.id)"));
});
