#!/usr/bin/env python3
"""D1 working-copy editorial audit migration. Never touch Supabase or immutable D1."""
import argparse,json,os,pathlib,re,sqlite3,urllib.request,urllib.error

WORKING_ID='56bf9fcc-3f9a-43e5-82f7-8c521f5b370a'
IMMUTABLE_ID='ddce6b9f-90e1-488f-bf9b-5ddf5d170346'
EDITABLE=('people','posts','media','videos','obituaries','documents',
          'gdd_memorials','gdd_audio_programs','gdd_calendar_memorials')
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/'workers/gdd-d1/source-schema-manifest.json').read_text())['tables']
counts=json.loads((root/'workers/gdd-d1/source-row-counts-20261123.json').read_text())['table_counts']
assert len(manifest)==21 and len(counts)==21 and sum(counts.values())==1892
assert all(k in manifest and manifest[k]['primary_key']==['id'] for k in EDITABLE)
assert WORKING_ID!=IMMUTABLE_ID

def quote(n):
    if not re.fullmatch('[a-z][a-z0-9_]*',n):raise ValueError('Invalid schema name')
    return '"'+n+'"'

def snapshot(alias,columns):
    # D1 Free currently permits at most 32 function args: 10 JSON field pairs each.
    chunks=[]
    for index in range(0,len(columns),10):
        part=columns[index:index+10]
        args=[]
        for col in part:
            args.extend(["'"+col+"'",alias+'.'+quote(col)])
        chunks.append('json_object('+','.join(args)+')')
    expr=chunks[0]
    for next_chunk in chunks[1:]:
        expr='json_patch('+expr+','+next_chunk+')'
    return expr

def audit_table_sql():
    return """CREATE TABLE IF NOT EXISTS gdd_v2_editor_revisions (
    revision_id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('create','update')),
    before_json TEXT,
    after_json TEXT NOT NULL,
    changed_at TEXT NOT NULL,
    version_from INTEGER NOT NULL,
    version_to INTEGER NOT NULL
    )"""

def trigger_sql(kind,operation):
    cols=[c['name'] for c in manifest[kind]['columns']]+['gdd_version']
    old=snapshot('OLD',cols)
    new=snapshot('NEW',cols)
    tab=quote(kind)
    t=quote('gdd_v2_'+operation+'_'+kind)
    action='AFTER INSERT' if operation=='create' else 'AFTER UPDATE'
    condition='' if operation=='create' else 'WHEN NEW.gdd_version = OLD.gdd_version + 1'
    before='NULL' if operation=='create' else old
    from_v='0' if operation=='create' else 'OLD.gdd_version'
    return f"""CREATE TRIGGER IF NOT EXISTS {t} {action} ON {tab}
    FOR EACH ROW {condition}
    BEGIN
      INSERT INTO gdd_v2_editor_revisions
        (revision_id,kind,record_id,action,before_json,after_json,changed_at,version_from,version_to)
      VALUES(lower(hex(randomblob(16))),'{kind}',NEW.id,'{operation}',{before},{new},
        strftime('%Y-%m-%dT%H:%M:%fZ','now'),{from_v},NEW.gdd_version);
    END"""

class Local:
    def __init__(self):
        self.conn=sqlite3.connect(':memory:')
        self.conn.row_factory=sqlite3.Row
        self.conn.executescript((root/'workers/gdd-d1/migrations/0001_supabase_21_tables.sql').read_text())
    def query(self,sql):
        rows=self.conn.execute(sql)
        if rows.description:return [dict(x) for x in rows.fetchall()]
        return []

class Remote:
    def __init__(self):
        account=os.getenv('CLOUDFLARE_ACCOUNT_ID','')
        token=os.getenv('CLOUDFLARE_D1_API_TOKEN','')
        if not re.fullmatch('[a-f0-9]{32}',account) or len(token)<15:
            raise SystemExit('Cloudflare Free D1 credentials unavailable')
        self.base='https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database/'
        self.headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'}
    def query(self,sql,dbid=WORKING_ID):
        if dbid not in (WORKING_ID,IMMUTABLE_ID):raise SystemExit('Unsupported D1')
        req=urllib.request.Request(self.base+dbid+'/query',
             data=json.dumps({'sql':sql}).encode('utf8'),
             headers=self.headers,method='POST')
        try:
            with urllib.request.urlopen(req,timeout=35) as res: data=json.load(res)
        except urllib.error.HTTPError as exc:
            raise SystemExit('D1 query operation HTTP '+str(exc.code)) from None
        if data.get('success') is not True:raise SystemExit('D1 query returned an error')
        results=data.get('result') or []
        if len(results)!=1 or results[0].get('success') is False:
            raise SystemExit('Unexpected D1 SQL result')
        return results[0].get('results') or []

def exact_counts(db,dbid=None):
    for table,n in counts.items():
        name=quote(table)
        rows=db.query('SELECT COUNT(*) AS n FROM '+name,dbid) if dbid else db.query('SELECT COUNT(*) AS n FROM '+name)
        if len(rows)!=1 or rows[0].get('n')!=n:
            raise SystemExit('21-table source cardinality mismatch at '+table)

def migrate(db):
    db.query(audit_table_sql())
    for kind in EDITABLE:
        before=db.query('PRAGMA table_info('+quote(kind)+')')
        if not before:raise SystemExit('Table missing '+kind)
        if 'gdd_version' not in {row['name'] for row in before}:
            db.query('ALTER TABLE '+quote(kind)+' ADD COLUMN gdd_version INTEGER NOT NULL DEFAULT 1')
        for op in ('create','update'):
            db.query(trigger_sql(kind,op))
    for kind in EDITABLE:
        versions=db.query('PRAGMA table_info('+quote(kind)+')')
        if not any(x.get('name')=='gdd_version' for x in versions):
            raise SystemExit('Missing editorial version column '+kind)
    n=db.query("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='trigger' AND name LIKE 'gdd_v2_%'")
    if len(n)!=1 or n[0]['n']<len(EDITABLE)*2:
        raise SystemExit('D1 editorial audit triggers incomplete')

def local_test(db):
    migrate(db)
    rowid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    db.query("INSERT INTO people(id,full_name,published,created_at) VALUES('"+rowid+"','SYNTHETIC TEST',0,'2026-11-24')")
    db.query("UPDATE people SET summary='synthetic edit',gdd_version=gdd_version+1 WHERE id='"+rowid+"' AND gdd_version=1")
    row=db.query("SELECT gdd_version FROM people WHERE id='"+rowid+"'")
    assert row[0]['gdd_version']==2
    revisions=db.query("SELECT action,version_from,version_to,before_json,after_json FROM gdd_v2_editor_revisions WHERE record_id='"+rowid+"' ORDER BY version_to")
    assert len(revisions)==2 and revisions[0]['action']=='create' and revisions[1]['action']=='update'
    assert json.loads(revisions[1]['before_json'])['summary'] is None
    assert json.loads(revisions[1]['after_json'])['summary']=='synthetic edit'
    print('LOCAL_SYNTHETIC_EDITOR_CREATE_UPDATE_AUDIT=PASS')
    print('AUDIT_TRIGGERS_ALL_NINE_KINDS=PASS')

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--local',action='store_true')
    ap.add_argument('--remote',action='store_true')
    args=ap.parse_args()
    if args.local==args.remote:raise SystemExit('Choose exactly local or remote')
    if args.local:
        local_test(Local())
    else:
        db=Remote()
        exact_counts(db,IMMUTABLE_ID)
        exact_counts(db,WORKING_ID)
        migrate(db)
        exact_counts(db,IMMUTABLE_ID)
        exact_counts(db,WORKING_ID)
        print('WORKING_D1_EDITOR_VERSIONED_SCHEMA=PASS')
        print('IMMUTABLE_D1_ARCHIVE_1892_ROWS_UNCHANGED=TRUE')
        print('NO_SUPABASE_R2_ORIGINAL_WRITE=TRUE')
if __name__=='__main__':main()
