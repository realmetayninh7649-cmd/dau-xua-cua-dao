-- Reversible editorial trash; never delete archival content or R2 objects.
CREATE TABLE IF NOT EXISTS gdd_editor_trash (
  kind TEXT NOT NULL,
  record_id TEXT NOT NULL,
  trashed INTEGER NOT NULL CHECK(trashed IN (0,1)),
  changed_at TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  PRIMARY KEY (kind,record_id)
);
