import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('common image viewer contains no download or open-original UI, retains navigation and zoom',()=>{
 const s=read('image-viewer.js');
 assert.doesNotMatch(s,/id="gdd-image-(?:download|original)"|downloadImage|Tải ảnh có lưu dấu|Mở bản ảnh có lưu dấu/);
 for(const key of ['close','minus','plus','reset','prev','next','scale'])assert.ok(s.includes('id="gdd-image-'+key+'"'));
 assert.match(s,/GDDTrace\.stampedBlob/);
 assert.match(s,/Xem ảnh toàn màn hình/);
});
test('standalone R2 reader has no image download but retains PDF permission checks',()=>{
 assert.doesNotMatch(read('r2-xem.html'),/id="r2-download"/);
 assert.doesNotMatch(read('r2-xem.mjs'),/el\('r2-download'\)/);
 assert.match(read('r2-xem.html'),/id="r2-pdf-download"/);
 assert.match(read('r2-xem.mjs'),/allow_download/);
});
