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

test('one-click publication prepares readers before publishing parent and releases after confirmation',()=>{
 const prepare=ADMIN_JS.indexOf('prepareReaders(active,progress)');
 const patch=ADMIN_JS.indexOf('await patch(finalFields)',prepare);
 const release=ADMIN_JS.indexOf('releaseReaders(active,readerPlans,progress)',patch);
 assert.ok(prepare>0&&patch>prepare&&release>patch);
 assert.ok(PHOTO_JS.includes('readerPlans.has(row.asset_id)'));
 assert.ok(PHOTO_JS.includes('Number(row.public_view)===1&&Number(row.preview_ready)===1'));
 assert.ok(PHOTO_JS.includes('record.record?.published===true||record.record?.published===1'));
 assert.ok(!PHOTO_JS.includes("btn.textContent='Công bố bản đọc'"));
 assert.ok(PHOTO_JS.includes('item.assetId===row.asset_id'));
});

test('release accepts D1 integer publication flag and rejects unpublished rows',async()=>{
 const start=PHOTO_JS.indexOf('async function releaseReaders(');
 const end=PHOTO_JS.indexOf('async function uploadDocuments(',start);
 const fn=PHOTO_JS.slice(start,end);
 const record={kind:'posts',id:'id',record:{published:1}};
 let releases=0;
 const release=new Function('context','managedRequest','readerPlans','reloadDocuments','docStatus',fn+';return releaseReaders;')({kind:'posts',id:'id'},async()=>{releases++;return {published:true,originalPrivate:true}},new Map(),async()=>{},()=>{});
 const plans=[{assetId:'asset',name:'PDF',total:33,source:'pdf'}];
 await release(record,plans);
 await release({...record,record:{published:true}},plans);
 await assert.rejects(release({...record,record:{published:0}},plans),/Bài chưa được xác nhận công bố/);
 await assert.rejects(release({...record,record:{published:false}},plans),/Bài chưa được xác nhận công bố/);
 assert.equal(releases,2);
 assert.ok(PHOTO_JS.includes('if(existing.has(n))continue;'));
});

test('attachment download permission defaults off and is saved by the ordinary publish action',()=>{
 assert.ok(PHOTO_JS.includes('allowDownload:false'));
 assert.ok(PHOTO_JS.includes('Cho phép khách tải tệp gốc'));
 assert.ok(ADMIN_JS.includes('saveDownloadPermissions(active,false,progress)'));
 assert.ok(ADMIN_JS.includes('saveDownloadPermissions(active,true,progress)'));
});

test('uniform editor exposes all nine photo groups, independent documents cover and normalized dates',()=>{
 assert.ok(PHOTO_JS.includes("const documentKinds=supportedKinds"));
 assert.ok(PHOTO_JS.includes("hasPhotos:()=>queue.some"));
 assert.ok(ADMIN_JS.includes("role:'cover'"));
 assert.ok(ADMIN_JS.includes("workCurrent.kind==='documents'&&field==='cover_url'"));
 const start=ADMIN_JS.indexOf('function normalizeEditorialDate('),end=ADMIN_JS.indexOf('const workLong=',start);
 const parse=new Function(ADMIN_JS.slice(start,end)+';return normalizeEditorialDate;')();
 assert.equal(parse('29/09/1926'),'1926-09-29');
 assert.equal(parse('29-09-1926'),'1926-09-29');
 assert.equal(parse('2026-11-25'),'2026-11-25');
 assert.equal(parse(''),null);
 assert.throws(()=>parse('31/02/1926'),/invalid_date/);
});

test('gallery covers and albums accept images above 24 MiB without loosening other sections',()=>{
 const start=PHOTO_JS.indexOf('const supported=new Set('),end=PHOTO_JS.indexOf('const documentKinds=',start);
 const validate=new Function(PHOTO_JS.slice(start,end)+';return imageError;')();
 const file={type:'image/jpeg',size:50*1048576};
 assert.equal(validate(file,'media'),'');assert.match(validate(file,'posts'),/24 MB/);
 assert.equal(validate({type:'image/png',size:1024*1048576},'media'),'');
 assert.match(validate({type:'image/png',size:1024*1048576+1},'media'),/1 GiB/);
 assert.match(validate({type:'application/pdf',size:50*1048576},'media'),/định dạng/);
 assert.ok(ADMIN_JS.includes('imageError(file,kind)'));
 assert.ok(ADMIN_JS.includes('uploadCover(item.file,progress,item,kind)'));
});

test('new single-file PDF skips page derivatives and enables download by default',()=>{
 assert.ok(PHOTO_JS.includes("row.view_source==='single_pdf'"));
 assert.ok(PHOTO_JS.includes("allowDownload:/\\.pdf$/i.test(file.name)"));
 assert.ok(PHOTO_JS.includes("if(row.view_source==='single_pdf'"));
});

test('gallery editor supports the Chơn Dung Tiền Bối category alongside five existing categories',()=>{
 const match=ADMIN_JS.match(/const workGalleryCategories=(\[[^\n]+\]);/);
 assert.ok(match);
 const categories=new Function('return '+match[1])();
 assert.equal(categories.length,6);
 assert.ok(categories.includes('Chơn Dung Tiền Bối'));
});

test('photo editor keeps text in session storage and defers local image decoding',()=>{
 assert.ok(ADMIN_JS.includes("sessionStorage.setItem(photoDraftKey"));
 assert.ok(ADMIN_JS.includes("await workRestorePhotoDraft()"));
 assert.ok(ADMIN_JS.includes("draft.version"));
 assert.ok(ADMIN_JS.includes("showPreview.hidden=false"));
 assert.ok(PHOTO_JS.includes("if(item.showPreview)picture.src=item.previewUrl"));
});

test('all nine editors recover text and small cover files without forced scrolling after publish',()=>{
 assert.ok(ADMIN_JS.includes('Object.hasOwn(workFields,draft.kind)'));
 assert.ok(ADMIN_JS.includes("indexedDB.open('gdd-admin-cover-recovery-v1'"));
 assert.ok(ADMIN_JS.includes("await workKeepCoverFiles()"));
 assert.ok(ADMIN_JS.includes('await workOpen(kind,id,{scroll:false})'));
 assert.ok(ADMIN_JS.includes('canvas.width=1;canvas.height=1'));
 assert.ok(PHOTO_JS.includes('if(!item.previewReady)'));
 assert.ok(PHOTO_JS.includes('await item.checkpoint?.()'));
 assert.doesNotThrow(()=>new Script(ADMIN_JS));
 assert.doesNotThrow(()=>new Script(PHOTO_JS));
});
