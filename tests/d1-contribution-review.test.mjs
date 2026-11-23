import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {webcrypto} from 'node:crypto';
import {reviewContribution} from '../workers/gdd-d1-admin/src/contribution-review.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const db0=new DatabaseSync(':memory:');
db0.exec("CREATE TABLE submissions(id TEXT PRIMARY KEY,status TEXT)");
db0.exec("CREATE TABLE gdd_submission_status_audit(audit_id TEXT PRIMARY KEY,record_id TEXT,old_status TEXT,new_status TEXT,changed_at TEXT)");
db0.exec("CREATE TRIGGER gdd_v2_contribution_status AFTER UPDATE OF status ON submissions FOR EACH ROW WHEN NEW.status IS NOT OLD.status BEGIN INSERT INTO gdd_submission_status_audit(audit_id,record_id,old_status,new_status,changed_at) VALUES(lower(hex(randomblob(16))),OLD.id,OLD.status,NEW.status,strftime('%Y-%m-%dT%H:%M:%fZ','now'));END");
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
db0.prepare("INSERT INTO submissions(id,status) VALUES(?,?)").run(id,'pending');
const db={prepare(sql){const stmt=db0.prepare(sql);return {bind(...args){return {first:async()=>stmt.get(...args)||null}}}}};
async function call(payload){const req=new Request('https://admin.test/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const res=await reviewContribution(req,db,id);return {status:res.status,data:await res.json()}}
test('staff review is optimistic, private and audited without changing originals',async()=>{
 const first=await call({expected_status:'pending',status:'reviewing'});
 assert.equal(first.status,200);
 assert.equal(first.data.private,true);
 assert.equal(first.data.published,false);
 assert.equal((await call({expected_status:'pending',status:'approved'})).status,409);
 assert.equal((await call({expected_status:'reviewing',status:'approved'})).status,200);
 assert.equal(db0.prepare("SELECT COUNT(*) AS n FROM gdd_submission_status_audit").get().n,2);
 assert.equal(db0.prepare('SELECT status FROM submissions').get().status,'approved');
});
test('invalid or duplicate status changes are refused',async()=>{
 assert.equal((await call({expected_status:'approved',status:'approved'})).status,409);
 assert.equal((await call({expected_status:'approved',status:'delete'})).status,409);
 assert.equal((await call({expected_status:'rejected',status:'reviewing'})).status,409);
});
process.on('exit',()=>{try{db0.close()}catch{}});
