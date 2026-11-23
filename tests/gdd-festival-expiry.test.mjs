import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {readFileSync} from 'node:fs';
const js=readFileSync(new URL('../gdd-festival-binh-ngo-2026.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function smoke(now,hash='',storageValue=''){
 const shell={hidden:true,scrollIntoView:()=>{}},restore={hidden:true},dismiss={};
 const elements={'gdd-festival-2026':shell,'gdd-festival-restore':restore,
 'gdd-festival-dismiss':dismiss};
 let active=false,timers=[];
 const callbacks={};
 const document={hidden:false,getElementById:id=>elements[id],
  body:{classList:{toggle:(c,state)=>{assert.equal(c,'gdd-festival-active');active=state}}},
  addEventListener:(name,handler)=>{callbacks['document_'+name]=handler}};
 const window={location:{pathname:'/',hash},localStorage:{getItem:()=>storageValue,
  setItem:()=>{},removeItem:()=>{}},
  addEventListener:(name,handler)=>{callbacks['window_'+name]=handler},
  matchMedia:()=>({matches:false}),setTimeout:(cb,delay)=>timers.push({cb,delay})};
 const DateMock={parse:Date.parse,now:()=>Date.parse(now)};
 runInNewContext(js,{document,window,Date:DateMock}, {timeout:1000});
 return {shell,restore,dismiss,active,timers,callbacks};
}
test('Hạ Ngươn visible until 23 November 2026, 23:59 VN time',()=>{
 const t=smoke('2026-11-23T23:59:59+07:00');
 assert.equal(t.shell.hidden,false);
 assert.equal(t.active,true);
 assert.equal(t.restore.hidden,true);
 assert.equal(t.timers.length,1);
});
test('2026-11-24 00:00 VN and after, seasonal cover and restore stay hidden',()=>{
 for(const now of ['2026-11-24T00:00:00+07:00','2026-11-24T03:06:00+07:00',
    '2026-12-15T11:00:00+07:00']){
  const r=smoke(now);
  assert.equal(r.shell.hidden,true,now);
  assert.equal(r.restore.hidden,true,now);
  assert.equal(r.active,false,now);
  assert.equal(r.timers.length,0);
 }
});
test('Festival hides on deep links, and hidden state stays hidden',()=>{
 assert.equal(smoke('2026-11-20T15:00:00+07:00','#chuc-sac').shell.hidden,true);
 assert.equal(smoke('2026-11-20T15:00:00+07:00','', '1').shell.hidden,true);
});
test('cache-busted live HTML loads updated expiration logic',()=>{
 assert.ok(html.includes('gdd-festival-binh-ngo-2026.js?v=20261124-expire'));
 assert.ok(!html.includes('gdd-festival-binh-ngo-2026.js?v=20261118-01'));
 assert.ok(js.includes("2026-11-24T00:00:00+07:00"));
 assert.ok(!js.includes("2026-12-15T23:59:59+07:00"));
});
