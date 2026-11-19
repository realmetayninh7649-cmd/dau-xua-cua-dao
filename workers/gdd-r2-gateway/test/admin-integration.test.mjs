import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../../../'+path,import.meta.url),'utf8');
test('Trang quan tri nap R2 va co kho rieng',()=>{
 const html=read('index.html');
 assert.ok(html.indexOf('gdd-r2-admin.js?v=')>=0);
 assert.ok(html.indexOf('gdd-r2-admin.js?v=')<html.indexOf('app.js?v='));
 for(const id of ['gdd-r2-vault-panel','gdd-r2-vault-files','gdd-r2-vault-upload','gdd-r2-vault-list'])assert.ok(html.includes('id="'+id+'"'));
});
test('Tep chinh duoc luu R2 truoc khi toi uu public',()=>{
 const app=read('app.js');
 const block=app.slice(app.indexOf('async function saveRecord'),app.indexOf('async function deleteRecord'));
 assert.ok(block.indexOf('window.GDDR2.archive(file,state.supabase')>=0);
 assert.ok(block.indexOf('window.GDDR2.archive(file,state.supabase')<block.indexOf('window.GDDPrivatePublishing.publishArchivedImage(archivedPrimary')); 
 assert.ok(!block.includes('await uploadImage(file,kind)'),'no public Supabase image upload');
 assert.ok(block.includes('window.GDDR2.link(archivedPrimary,kind,savedId'));
 assert.ok(block.includes('data.file_url=null;'));
 assert.ok(block.includes('data.published=false;'));
 assert.ok(app.includes('window.GDDR2?.open(state.supabase)'));
});
test('Album giu file goc truoc nen, PDF/Word khong public',()=>{
 const html=read('index.html');
 const idx=html.indexOf('async function uploadPending(kind,id,onProgress)');
 assert.ok(idx>=0);
 const block=html.slice(idx,idx+11000);
 const archive=block.indexOf('window.GDDR2.archive(item.file,supa');
 const publish=block.indexOf('window.GDDPrivatePublishing.publishArchivedImage(item.archivedResult');
 const privateGate=block.indexOf('if(docFile){');
 assert.ok(archive>=0&&publish>archive&&privateGate>publish,
   'public album links must be created only from verified R2 derivatives');
 assert.ok(!block.includes('storage.upload(path,item.preparedFile'),'legacy public upload disabled');
 assert.ok(block.includes('skipDerivatives:false'));
 assert.ok(block.includes('item.saved=true;done++;committed=true;'));
 assert.ok(!block.includes('item.file=prepared'));
});
test('R2 manifest chỉ Admin, RLS, khong co quyen delete',()=>{
 const sql=read('workers/gdd-r2-gateway/docs/dk013_manifest.sql').toLowerCase();
 assert.ok(sql.includes('enable row level security'));
 assert.ok(sql.includes('revoke all on table'));
 assert.ok(sql.includes('is_site_admin()'));
 assert.ok(sql.includes('owner_id=(select auth.uid())'));
 assert.ok(!sql.includes('for delete'));
 assert.ok(!sql.includes('grant all on table'));
});
