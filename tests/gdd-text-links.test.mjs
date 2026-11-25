import test from 'node:test';
import assert from 'node:assert/strict';
import '../gdd-text-links.js';
const {html}=globalThis.GDDTextLinks;
test('Drive and query parameters',()=>{
 const out=html('Ảnh: https://drive.google.com/drive/folders/abc-123\n(https://example.org/a?x=1&y=2).');
 assert.ok(out.includes('href="https://drive.google.com/drive/folders/abc-123"'));
 assert.ok(out.includes('x=1&amp;y=2'));
 assert.ok(out.includes('</a>\n('));
 assert.ok(out.endsWith('</a>).'));
 assert.ok(out.includes('rel="noopener noreferrer"'));
});
test('no HTML or unsafe protocols',()=>{
 const out=html('<img src=x onerror=alert(1)> javascript:alert(1) https://a:b@example.org/');
 assert.ok(out.includes('&lt;img'));assert.ok(!out.includes('<img'));assert.ok(!out.includes('<a '));
});
