import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

// The public GitHub Pages files are the single source of truth.
// Copy only browser-readable assets; never bundle development or secret files.
const root = resolve(import.meta.dirname, '..');
const out = join(root, 'www');
const skipDirs = new Set(['.git', '.github', '.vscode', 'node_modules', 'www', 'android', 'ios', 'scripts', 'tests']);
const publicExt = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.mp3', '.mp4', '.m4a', '.wav', '.ogg', '.webm', '.pdf', '.txt', '.glb', '.gltf', '.bin', '.wasm']);
const skipFiles = new Set(['package.json', 'package-lock.json', 'capacitor.config.json', 'tsconfig.json']);
let count = 0;
function copyPublic(from, to) {
  mkdirSync(to, { recursive: true });
  for (const ent of readdirSync(from, { withFileTypes: true })) {
    if (ent.isSymbolicLink()) continue;
    if (ent.isDirectory()) {
      if (!skipDirs.has(ent.name)) copyPublic(join(from, ent.name), join(to, ent.name));
    } else if (ent.isFile() && !skipFiles.has(ent.name) && publicExt.has(extname(ent.name).toLowerCase())) {
      cpSync(join(from, ent.name), join(to, ent.name));
      count++;
    }
  }
}
if (!existsSync(join(root, 'index.html'))) throw new Error('Không tìm thấy index.html tại thư mục gốc.');
rmSync(out, { recursive: true, force: true });
copyPublic(root, out);
if (!statSync(join(out, 'index.html')).isFile()) throw new Error('Thiếu www/index.html sau khi đóng gói.');
console.log(`Đã chuẩn bị ${count} tài nguyên cho ứng dụng trong thư mục www/.`);
