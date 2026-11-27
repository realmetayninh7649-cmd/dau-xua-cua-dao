import test from 'node:test';import assert from 'node:assert/strict';import {validateResearch,interestingTitle,shortExcerpt,completeSentences,historyTitle,historicalCandidate} from '../workers/gdd-d1-admin/src/research.mjs';import {RESEARCH_JS} from '../workers/gdd-d1-admin/src/research-ui.mjs';
const row={kind:'quote',title:'Test',excerpt:'Nội dung',speaker:'Đức Chí Tôn',source_url:'https://example.org/',citation:'Nguồn',source_date:'20/02/1926',note:'',rights:'permitted',state:'approved',visible:true,confirmed:true};
test('approval gate and reset after content edit',()=>{assert.throws(()=>validateResearch({...row,rights:'unknown'}));assert.throws(()=>validateResearch({...row,confirmed:false}));assert.throws(()=>validateResearch({...row,state:'pending'}));const x=validateResearch(row);assert.equal(x.visible,1);const y=validateResearch({...row,excerpt:'new'},x);assert.equal(y.visible,0);assert.equal(y.state,'pending');assert.doesNotThrow(()=>new Function(RESEARCH_JS));});

test('candidate search keeps short extracts and relevant titles only',()=>{assert.equal(interestingTitle('Thánh Ngôn Hiệp Tuyển'),true);assert.equal(interestingTitle('Trang chủ'),false);assert.equal(shortExcerpt(Array(50).fill('từ').join(' ')).split(' ').length,20)});

import worker from '../workers/gdd-d1-admin/src/worker.mjs';
import {createHash} from 'node:crypto';
test('first explicit approval may set rights in the same save',()=>{const old=validateResearch({...row,state:'pending',visible:false,rights:'unknown'});const approved=validateResearch(row,old);assert.equal(approved.state,'approved');assert.equal(approved.visible,1);assert.throws(()=>validateResearch({...row,confirmed:false},old));});
test('research write reaches handler only after Access and CSRF checks',async()=>{const email='qa@example.invalid',aud='a'.repeat(64),env={ACCESS_AUD:aud,ADMIN_EMAIL_SHA256:createHash('sha256').update(email).digest('hex'),ENABLE_WORKING_EDITOR:'enabled',DB:{prepare(){throw Error('unexpected query')}}};const ctx={access:{aud,getIdentity:async()=>({email})}};const path='https://gdd-d1-admin-staging.realmetayninh7649.workers.dev/api/v1/admin/research/items';const req=(origin)=>new Request(path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{}'});assert.equal((await worker.fetch(req('https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'),env,{})).status,403);assert.equal((await worker.fetch(req('https://evil.invalid'),env,ctx)).status,403);const res=await worker.fetch(req('https://gdd-d1-admin-staging.realmetayninh7649.workers.dev'),env,ctx);assert.equal(res.status,400);assert.match((await res.json()).error,/Thiếu hoặc sai/);});

test('research UI offers distinct explicit decisions without automatic rights',()=>{assert.ok(RESEARCH_JS.includes("data.visible=decision==='publish'"));assert.ok(RESEARCH_JS.includes("data.rights==='unknown'"));});

test('review save keeps current queue filter and search',()=>{assert.ok(!RESEARCH_JS.includes("$('filter').value=x.state"));assert.ok(RESEARCH_JS.includes("while(!rows.length&&offset>0)"));});

test('public sacred quote needs explicit attribution and date; internal approval remains possible',()=>{assert.throws(()=>validateResearch({...row,speaker:''}));assert.throws(()=>validateResearch({...row,source_date:'Chưa xác định'}));assert.equal(validateResearch({...row,speaker:'',source_date:'',visible:false}).state,'approved');});

test('extract whole sentences without promotional or incomplete text',()=>{assert.deepEqual(completeSentences(['Ai có đức hạnh lớn thì mới ngồi đặng địa vị của THẦY ban thưởng.','THẦY dạy ...','Đọc bài nầy trong app để xem.']),['Ai có đức hạnh lớn thì mới ngồi đặng địa vị của THẦY ban thưởng.']);});

test('dated event extraction requires explicit calendar and historical keyword',()=>{assert.equal(historyTitle('Ngày Vọng Thiên Cầu Đạo'),true);assert.equal(historyTitle('Trang chủ'),false);assert.equal(historicalCandidate(['Ngày 15/10/1926 ÂL, Hội Thánh tổ chức Đại Lễ Khai Đạo.']).source_date,'15/10/1926 ÂL');assert.equal(historicalCandidate(['Ngày 15/10/1926, Hội Thánh tổ chức Đại Lễ Khai Đạo.']),null);});

test('history editor stores explicitly entered place without confusing it with a speaker',()=>{assert.ok(RESEARCH_JS.includes("data.speaker=place?'Địa điểm: '+place"));assert.ok(RESEARCH_JS.includes('delete data.event_place'));});
