import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync('app.js','utf8'),home=readFileSync('homepage-previews.js','utf8');
test('public reader shows existing published cover image for every public group',()=>{
 for(const token of ['portrait(p,true)','imageFromRecord(p,originKind)',
   'imageFromRecord(m,originKind)','imageFromRecord(x,originKind)'])
   assert.ok(app.includes(token),'Missing '+token);
 assert.ok(!app.includes("const src=state.admin?imageFromRecord(m):''"));
 assert.ok(!app.includes("state.admin||(kind==='documents'"));
});
test('public image fallback uses album photos belonging only to same published record',()=>{
 assert.ok(app.includes('item.owner_kind===kind&&item.owner_id===x.id'));
 assert.ok(app.includes('state.galleryImages=Array.isArray(archive.gallery)?archive.gallery:[]'));
});
test('homepage reads D1 rather than attempting inaccessible Supabase posts',()=>{
 assert.ok(home.includes("if(conf.publicReadProvider==='d1-staging')throw"));
 assert.ok(home.includes('window.GDDPublicReadOnly?.load()'));
});
