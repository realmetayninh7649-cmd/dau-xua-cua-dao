import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const site=fs.readFileSync(new URL('../gdd-site-download-counter.js',import.meta.url),'utf8');
const article=fs.readFileSync(new URL('../gdd-content-metrics.js',import.meta.url),'utf8');
const dash=fs.readFileSync(new URL('../gdd-calendar-statistics.js',import.meta.url),'utf8');
const home=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const reader=fs.readFileSync(new URL('../r2-xem.html',import.meta.url),'utf8');
test('total downloads card added beside visit metrics, on both home and reader scripts',()=>{
 assert.match(dash,/gdd-total-downloads/);
 assert.match(dash,/Tổng lượt tải về/);
 assert.match(dash,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(home,/gdd-site-download-counter\.js\?v=/);
 assert.match(reader,/gdd-site-download-counter\.js\?v=/);
});
test('per-article recorder coordinates with aggregate to avoid double counting',()=>{
 assert.match(article,/window\.GDDContentMetrics=Object\.freeze\(\{claimsDownloadClick\}\)/);
 assert.match(article,/gdd:content-download-recorded/);
 assert.match(site,/if\(window\.GDDContentMetrics\?\.claimsDownloadClick\?\.\(target\)\)return/);
});
test('standalone and article totals are joined by database, not seeded/overwritten in browser',()=>{
 assert.match(site,/gdd_get_site_download_total/);
 assert.match(site,/gdd_record_site_unlinked_download/);
 assert.ok(!/localStorage\.setItem\(['"]download_total/.test(site));
});
test('site counter renders current total and counts an unlinked link only once',async()=>{
 const pending={};const node={textContent:'—',setAttribute(name,value){this[name]=value}};
 let total=44,standalone=0,article=0;
 const callbacks={};const fakeSession=new Map();
 class Elem{
   constructor({sel='a[download]',filename='tulieu.pdf',fromArticle=false}={}){this.sel=sel;this.filename=filename;this.fromArticle=fromArticle;this.hidden=false;this.disabled=false}
   closest(q){
     if(q.includes('hidden')||q.includes('aria-disabled'))return null;
     if(q.includes('a[download]'))return this;
     return null;
   }
   matches(q){return q.includes(this.sel)}
   getAttribute(q){if(q==='download')return this.filename;if(q==='href')return 'blob:test';return null}
 }
 const document={
   readyState:'loading',hidden:false,
   getElementById(id){return id==='gdd-total-downloads'?node:null},
   addEventListener(name,cb){callbacks[name]=cb}
 };
 const window={SITE_CONFIG:{supabaseUrl:'https://example.invalid',supabasePublishableKey:'sb_publishable_test'},
   crypto:{randomUUID:(()=>{let i=0;return()=>`00000000-0000-4000-8000-${String(++i).padStart(12,'0')}`})()},
   addEventListener(name,cb){pending[name]=cb},
   GDDContentMetrics:{claimsDownloadClick:el=>el.fromArticle}
 };
 const source=site.replace("import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')",
   "Promise.resolve({createClient:()=>({rpc:async(name,payload)=>{if(name==='gdd_get_site_download_total')return {data:total,error:null};if(name==='gdd_record_site_unlinked_download'){standalone++;total++;return{data:total,error:null}}throw Error(name)}})})");
 assert.notEqual(source,site,'replaced external module for offline test');
 const sandbox={window,document,sessionStorage:{getItem:k=>fakeSession.get(k)||null,setItem:(k,v)=>fakeSession.set(k,v)},
   Element:Elem,Date,Math,Uint8Array,Intl,Number,console,Promise};
 vm.runInNewContext(source,sandbox,{timeout:1500});
 callbacks.DOMContentLoaded();await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(node.textContent,'44');
 callbacks.click({target:new Elem({filename:'document.pdf'}),defaultPrevented:false});
 await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(standalone,1);assert.equal(node.textContent,'45');
 callbacks.click({target:new Elem({filename:'document.pdf',fromArticle:true}),defaultPrevented:false});
 await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(standalone,1,'article click is not recorded twice');
 total++;article++;pending['gdd:content-download-recorded']();
 await new Promise(resolve=>setTimeout(resolve,5));
 assert.equal(node.textContent,'46');
});
