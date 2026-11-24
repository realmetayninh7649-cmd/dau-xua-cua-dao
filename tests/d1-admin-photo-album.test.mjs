import test from 'node:test';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {ADMIN_HTML,ADMIN_CSS,ADMIN_JS} from '../workers/gdd-d1-admin/src/admin-ui.mjs';
import {PHOTO_JS} from '../workers/gdd-d1-admin/src/photo-album-ui.mjs';
test('multi-photo UI integrated directly into the D1 authoring form',()=>{
 for(const id of ['work-photo-files','work-photo-queue','work-publish','work-save',
 'work-photo-panel','work-photo-album'])assert.ok(ADMIN_HTML.includes('id="'+id+'"'),id);
 assert.ok(ADMIN_HTML.includes('multiple'));
 assert.ok(ADMIN_HTML.includes('/admin/photo-album.js'));
 assert.ok(ADMIN_CSS.includes('.work-photo-grid'));
 assert.doesNotThrow(()=>new Script(PHOTO_JS,{filename:'admin-photo-album.js'}));
});
test('private original and explicit preview approval, no silent public writes or delete',()=>{
 assert.ok(PHOTO_JS.includes('originalPreserved!==true'));
 assert.ok(ADMIN_JS.includes("workSave('publish')"));
 assert.ok(ADMIN_JS.includes("uploadBatch(active,progress)"));
 assert.ok(ADMIN_JS.includes("finalFields.published=true"));
 assert.ok(!ADMIN_HTML.includes('id="work-photo-confirm"'));
 assert.ok(!ADMIN_HTML.includes('id="work-photo-upload"'));
 assert.ok(PHOTO_JS.includes('managedImageBlob'));
 assert.ok(PHOTO_JS.includes("allowDownload:false"));
 assert.ok(PHOTO_JS.includes("asset_id:photo.assetId"));
 assert.ok(!PHOTO_JS.includes('GDD_BUCKET.delete'));
 assert.ok(!PHOTO_JS.includes('supabase'));
 assert.ok(!PHOTO_JS.includes("limits.count"));
 assert.ok(PHOTO_JS.includes("queue.push(...added.map"));
 assert.ok(PHOTO_JS.includes("uploadCover"));
 assert.ok(!PHOTO_JS.includes("images.slice(-50)"));
});

test('private document attachments are integrated into all editorial types',()=>{
 for(const id of ['work-attachment-panel','work-attachment-files','work-attachment-queue','work-attachment-existing'])assert.ok(ADMIN_HTML.includes('id="'+id+'"'),id);
 assert.ok(ADMIN_HTML.includes('.pdf,.doc,.docx'));
 assert.ok(PHOTO_JS.includes("'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials'"));
 assert.ok(ADMIN_JS.includes('uploadDocuments(active,progress)'));
 assert.ok(PHOTO_JS.includes('item.assetId=await archiveOriginal'));
 assert.doesNotThrow(()=>new Script(ADMIN_JS));
 assert.doesNotThrow(()=>new Script(PHOTO_JS));
});
