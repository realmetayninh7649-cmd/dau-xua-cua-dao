import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
const source=fs.readFileSync(new URL('../gdd-screen-privacy.js',import.meta.url),'utf8');
async function run({kind='documents',mode='protected',slug='one',reader=false,fail=false}={}){
 const events={},win={},obs=[],calls=[];
 const root={dataset:{gddKind:kind,gddRecordSlug:slug},querySelector:()=>true};
 const overlay={hidden:false},mask={style:{},setAttribute(){}};
 const document={hidden:false,querySelector:()=>reader,getElementById:id=>reader?null:id==='detail-content'?root:overlay,createElement:tag=>tag==='style'?{}:mask,head:{appendChild(){}},body:{dataset:{},appendChild(){}},addEventListener:(n,f)=>events[n]=f};
 const window={addEventListener:(n,f)=>win[n]=f};
 vm.runInNewContext(source,{document,window,location:{search:reader?'?record_kind='+kind+'&record_slug='+slug:''},URLSearchParams,Date,Set,clearTimeout,setTimeout,MutationObserver:class{constructor(f){obs.push(f)}observe(){}},fetch:async url=>{calls.push(url);if(fail)throw Error('network');return{ok:true,json:async()=>({mode})}}});
 await new Promise(r=>setImmediate(r));
 return {mask,root,overlay,obs,events,win,calls,document};
}
test('only confirmed highest mode, both allowed categories and reader',async()=>{
 for(const kind of ['people','documents','posts','media'])for(const mode of ['download','view','protected'])for(const reader of [false,true]){
  const r=await run({kind,mode,reader});r.win.blur();
  const expected=['people','documents'].includes(kind)&&mode==='protected';
  assert.equal(r.mask.hidden,!expected,kind+' '+mode+' '+reader);
  r.win.focus();assert.equal(r.mask.hidden,true);
 }
});
test('closing detail or switching to another section immediately disables curtain',async()=>{
 const r=await run();r.win.blur();assert.equal(r.mask.hidden,false);
 r.overlay.hidden=true;r.obs[0]();assert.equal(r.mask.hidden,true);
 r.overlay.hidden=false;r.root.dataset.gddKind='posts';r.obs[0]();assert.equal(r.mask.hidden,true);
});
test('unknown policy or missing slug never activates',async()=>{
 for(const x of [{fail:true},{slug:''},{mode:'unknown'}]){const r=await run(x);r.win.blur();assert.equal(r.mask.hidden,true)}
});

test('native image menu blocked on restricted records but not download or other sections',async()=>{
 for(const kind of ['people','documents','posts','media'])for(const mode of ['download','view','protected']){
  const r=await run({kind,mode});let blocked=0;
  const event={target:{closest:()=>true},preventDefault:()=>blocked++};
  r.events.contextmenu(event);r.events.dragstart(event);
  assert.equal(blocked,['people','documents'].includes(kind)&&mode!=='download'?2:0,kind+' '+mode);
  assert.equal(r.document.body.dataset.gddScreenAccess,['people','documents'].includes(kind)?mode:undefined);
 }
 const r=await run();r.overlay.hidden=true;r.obs[0]();assert.equal(r.document.body.dataset.gddScreenAccess,undefined);
});
test('full screen stage receives protected gesture instead of native image target',()=>{
 assert.match(source,/pointer-events:none!important;-webkit-touch-callout:none!important/);
 const viewer=fs.readFileSync(new URL('../image-viewer.js',import.meta.url),'utf8');
 assert.match(viewer,/if\(restricted\|\|e.pointerType!=='touch'\)e.preventDefault\(\)/);
 assert.match(viewer,/delete viewer.dataset.gddRecordImage/);
});
