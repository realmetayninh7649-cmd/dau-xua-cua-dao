import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.mjs';

const base='https://gdd-r2-gateway.example.workers.dev';
const approved=[
  'https://realmetayninh7649-cmd.github.io',
  'https://dauxuacuadao.info.vn',
  'https://www.dauxuacuadao.info.vn'
];

test('R2 allows only known website origins for CORS preflight',async()=>{
  for(const origin of approved){
    const res=await worker.fetch(new Request(base+'/v1/uploads/small',{
      method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'PUT'}
    }),{});
    assert.equal(res.status,204,origin);
    assert.equal(res.headers.get('access-control-allow-origin'),origin);
    assert.match(res.headers.get('access-control-allow-methods'),/PUT/);
  }
  const denied=await worker.fetch(new Request(base+'/v1/uploads/small',{
    method:'OPTIONS',headers:{Origin:'https://untrusted.example'}
  }),{});
  assert.equal(denied.status,403);
  assert.equal(denied.headers.get('access-control-allow-origin'),null);
});

test('Public API error responses reflect only allowed origins',async()=>{
  for(const origin of approved){
    const res=await worker.fetch(new Request(base+'/v1/public/not-a-uuid',{headers:{Origin:origin}}),{});
    assert.equal(res.status,404);
    assert.equal(res.headers.get('access-control-allow-origin'),origin);
  }
  const denied=await worker.fetch(new Request(base+'/v1/public/not-a-uuid',{headers:{Origin:'https://untrusted.example'}}),{});
  assert.equal(denied.headers.get('access-control-allow-origin'),null);
});
