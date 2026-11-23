-- STATEMENT
CREATE TABLE IF NOT EXISTS sandbox_items (
 id TEXT PRIMARY KEY,
 kind TEXT NOT NULL CHECK(kind IN ('people','posts','documents','media')),
 title TEXT NOT NULL,
 summary TEXT NOT NULL DEFAULT '',
 body TEXT NOT NULL DEFAULT '',
 published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1)),
 version INTEGER NOT NULL DEFAULT 1,
 updated_at TEXT NOT NULL
);

-- STATEMENT
CREATE TABLE IF NOT EXISTS sandbox_revisions (
 audit_id TEXT PRIMARY KEY,
 record_id TEXT NOT NULL,
 before_json TEXT NOT NULL,
 after_json TEXT NOT NULL,
 changed_at TEXT NOT NULL,
 version_from INTEGER NOT NULL,
 version_to INTEGER NOT NULL
);

-- STATEMENT
CREATE TRIGGER IF NOT EXISTS sandbox_record_audit
AFTER UPDATE ON sandbox_items
FOR EACH ROW WHEN NEW.version > OLD.version
BEGIN
 INSERT INTO sandbox_revisions
 (audit_id,record_id,before_json,after_json,changed_at,version_from,version_to)
 VALUES (
  lower(hex(randomblob(16))),
  OLD.id,
  json_object('kind',OLD.kind,'title',OLD.title,'summary',OLD.summary,
    'body',OLD.body,'published',OLD.published,'version',OLD.version),
  json_object('kind',NEW.kind,'title',NEW.title,'summary',NEW.summary,
    'body',NEW.body,'published',NEW.published,'version',NEW.version),
  strftime('%Y-%m-%dT%H:%M:%fZ','now'),
  OLD.version,NEW.version
 );
END;
