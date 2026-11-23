import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('scripts/gdd-seo-build.mjs','utf8');
test('SEO generator reads only D1 public endpoints and does not delete original folders',()=>{
 assert.ok(source.includes('gdd-d1-api-staging.realmetayninh7649.workers.dev'));
 assert.ok(source.includes("row.published!==true"));
 assert.ok(source.includes('people.length<45 || posts.length<15'));
 assert.ok(!source.includes('supabase.co'));
 assert.ok(!source.includes('fs.rmSync('));
 assert.ok(!source.includes('SUPABASE_SERVICE_ROLE_KEY'));
});
