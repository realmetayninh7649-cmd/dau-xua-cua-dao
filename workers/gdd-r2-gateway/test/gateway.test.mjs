import test from 'node:test';
import assert from 'node:assert/strict';
import gateway from '../src/index.mjs';
import { VERSION } from '../src/version.mjs';

const url = 'https://gdd-r2-gateway.example.workers.dev/health';
test('chỉ cho truy cập /health, không lộ tuyến tư liệu', async () => {
  for (const path of ['/', '/files/anything', '/upload', '/admin']) {
    const response = await gateway.fetch(new Request('https://example.workers.dev' + path), {});
    assert.equal(response.status, 404);
  }
});

test('chỉ nhận GET trên /health', async () => {
  const response = await gateway.fetch(new Request(url, {method:'POST'}), {});
  assert.equal(response.status, 405);
});

test('không có binding phải báo chưa sẵn sàng', async () => {
  const response = await gateway.fetch(new Request(url), {});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).status, 'not_ready');
});

test('thăm dò R2 read bằng HEAD một khóa cố định, không dùng list/get/put', async () => {
  const calls = [];
  const env = { GDD_BUCKET: {
    head: async (key) => {calls.push(['head',key]); return null;},
    list: () => {throw new Error('Không được list tư liệu');},
    get: () => {throw new Error('Không được get tư liệu');},
    put: () => {throw new Error('Không được put tư liệu');},
  }};
  const response = await gateway.fetch(new Request(url), env);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {status:'ok',version:VERSION,r2:'reachable'});
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'head');
  assert.match(calls[0][1], /^__gdd_internal__\//);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
});

test('R2 lỗi không tiết lộ nội dung ngoại lệ', async () => {
  const response=await gateway.fetch(new Request(url), {
    GDD_BUCKET:{head:async()=>{throw new Error('private bucket sensitive information')}}
  });
  assert.equal(response.status,503);
  assert.doesNotMatch(await response.text(),/private bucket|sensitive/i);
});
