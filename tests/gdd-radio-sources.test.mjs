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
  assert.ok(radio.includes(path.split('/')[1]));
 }
});
test('unavailable archived MP3 is reported as source storage problem, not iPhone internet',()=>{
 assert.ok(!radio.includes('Không mở được MP3. Vui lòng kiểm tra kết nối Internet.'));
 assert.ok(radio.includes('Tệp MP3 tại kho âm thanh cũ hiện không truy cập được'));
 assert.ok(radio.includes('gdd-radio-play-status'));
 assert.ok(radio.includes('Chưa có ảnh bìa khả dụng'));
});
test('latest radio script bypasses Safari stale cache and preserves existing GitHub MP3',()=>{
 assert.match(page,/gdd-audio-radio\.js\?v=20261124-r2-covers-restored-02/);
 assert.ok(statSync('audio/niem-danh-dieu-tri-kim-mau.mp3').size>3000000);
});
