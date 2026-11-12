import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const html = read('index.html');
const manifest = JSON.parse(read('manifest.webmanifest'));
const config = JSON.parse(read('capacitor.config.json'));
assert.match(html, /rel="manifest"\s+href="manifest\.webmanifest"/, 'index.html chưa khai báo manifest');
assert.match(html, /apple-touch-icon/, 'Thiếu Apple touch icon');
assert.match(html, /gdd-mobile-app\.js/, 'Thiếu script khởi tạo ứng dụng');
assert.match(html, /gdd-mobile-app\.css/, 'Thiếu CSS cho ứng dụng');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
assert.equal(manifest.icons[0].src, './logo.png');
assert.equal(config.webDir, 'www');
assert.ok(existsSync(new URL('../logo.png', import.meta.url)), 'Thiếu logo');
for (const path of ['sw.js', 'offline.html', 'gdd-mobile-app.js', 'gdd-mobile-app.css'])
  assert.ok(existsSync(new URL('../' + path, import.meta.url)), 'Thiếu tệp ' + path);
console.log('Đạt kiểm tra cấu trúc web app.');
