import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source={
 stats:readFileSync('gdd-calendar-statistics.js','utf8'),
 downloads:readFileSync('gdd-site-download-counter.js','utf8'),
 content:readFileSync('gdd-content-metrics.js','utf8')
};
test('visitor statistics D1 mode does not run Supabase RPC',()=>{
 assert.ok(source.stats.includes("if(cfg.publicReadProvider==='d1-staging')"));
 assert.ok(source.stats.includes("api+'/visit'"));
 assert.ok(source.stats.includes("source!=='cloudflare-d1'"));
 assert.ok(source.stats.includes('setInterval(ping,90_000)'));
});
test('download total reads D1 historical metrics and only records real clicks',()=>{
 assert.ok(source.downloads.includes("const d1=cfg.publicReadProvider==='d1-staging'"));
 assert.ok(source.downloads.includes("fetch(statsURL+'/download'"));
 assert.ok(source.downloads.includes("fetch(statsURL,{cache:'no-store'"));
 assert.ok(source.downloads.includes("claimsDownloadClick?.(target)"));
});
test('per-record downloads/views use D1 with unique event keys',()=>{
 assert.ok(source.content.includes("if(window.SITE_CONFIG?.publicReadProvider==='d1-staging')"));
 assert.ok(source.content.includes("api/v1/stats/content"));
 assert.ok(source.content.includes("body:JSON.stringify({kind,record_id:id,event_type:type,event_key:key})"));
});
