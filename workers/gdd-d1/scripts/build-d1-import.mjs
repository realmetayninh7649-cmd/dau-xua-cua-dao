#!/usr/bin/env node
/* Dấu Xưa Cửa Đạo — convert a PRIVATE 21-table JSON export into D1 import SQL.
 * Never commit the input JSON or output SQL to a PUBLIC Git repository.
 * This command runs locally. It does not connect to Cloudflare or Supabase.
 */
import fs from 'node:fs';
import path from 'node:path';
const here=path.dirname(new URL(import.meta.url).pathname);
const root=path.resolve(here,'..');
const args=process.argv.slice(2);
const value=option=>{const at=args.indexOf(option);return at>=0?args[at+1]:null};
const input=value('--input'), output=value('--output');
if(!input||!output||!args.includes('--confirm-private-offline')){
 console.error('Usage: node scripts/build-d1-import.mjs --input /private/full-21-table-export.json --output /private/d1-import.sql --confirm-private-offline');
 process.exit(2);
}
if(path.resolve(input)===path.resolve(output))throw Error('Input and output paths must differ.');
const repoRoot=path.resolve(root,'..','..');
if(path.resolve(output).startsWith(repoRoot+path.sep)){
 throw Error('The output SQL contains private database records. Write it OUTSIDE the public repository.');
}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'source-schema-manifest.json'),'utf8'));
const exportFile=JSON.parse(fs.readFileSync(input,'utf8'));
const tables=exportFile.tables||exportFile;
const quoteId=s=>'"'+String(s).replaceAll('"','""')+'"';
const literal=value=>{
 if(value===null||value===undefined)return 'NULL';
 if(typeof value==='boolean')return value?'1':'0';
 if(typeof value==='number'){
   if(!Number.isFinite(value))throw Error('Non-finite number in export');
   return String(value);
 }
 if(Array.isArray(value)||typeof value==='object')value=JSON.stringify(value);
 if(typeof value!=='string')throw Error('Unknown data type in export');
 if(value.includes('\\u0000')||value.includes('\u0000'))throw Error('NUL byte is not supported in SQLite text');
 return "'"+value.replaceAll("'","''")+"'";
};
const list=Object.entries(manifest.tables);
const checks=[];
const out=['-- GDD D1 private database import; do not publish or commit.',
  '-- Import only into a NEW, empty, separately named Cloudflare D1 database.',
  '-- The exporter and row counts must be reviewed before running remotely.',
  'PRAGMA foreign_keys=ON;'];
for(const [name,meta] of list){
 const rows=tables[name];
 if(!Array.isArray(rows))throw Error('Missing table '+name+'. Refuse incomplete 21-table migration.');
 const columnNames=meta.columns.map(c=>c.name);
 const allowed=new Set(columnNames),pk=meta.primary_key;
 const seen=new Set();
 for(const row of rows){
  if(!row||typeof row!=='object'||Array.isArray(row))throw Error('Malformed '+name+' row');
  const extras=Object.keys(row).filter(k=>!allowed.has(k));
  if(extras.length)throw Error('Unknown '+name+' columns: '+extras.join(', '));
  const pkVal=pk.map(k=>row[k]);
  if(pkVal.some(v=>v===undefined||v===null))throw Error('Missing primary key in '+name);
  const id=JSON.stringify(pkVal);
  if(seen.has(id))throw Error('Duplicate primary key in '+name+' '+id);
  seen.add(id);
  out.push('INSERT INTO '+quoteId(name)+' ('+columnNames.map(quoteId).join(', ')+') VALUES ('+
    columnNames.map(col=>literal(row[col])).join(', ')+');');
 }
 checks.push({table:name,count:rows.length});
 out.push('INSERT INTO gdd_import_audit(table_name,source_count,import_count,source_snapshot_date,last_verified_at) VALUES ('+
   [literal(name),rows.length,rows.length,literal(exportFile.exported_at||exportFile.generated_at||null),'CURRENT_TIMESTAMP'].join(', ')+
   ') ON CONFLICT(table_name) DO UPDATE SET source_count=excluded.source_count,import_count=excluded.import_count,last_verified_at=CURRENT_TIMESTAMP;');
}
const total=checks.reduce((sum,x)=>sum+x.count,0);
const sql=out.join('\n')+'\n';
fs.mkdirSync(path.dirname(path.resolve(output)),{recursive:true});
fs.writeFileSync(output,sql,{mode:0o600,flag:'wx'});
console.log(JSON.stringify({result:'local_sql_ready',tables:checks.length,rows:total,bytes:Buffer.byteLength(sql),checks},null,2));
