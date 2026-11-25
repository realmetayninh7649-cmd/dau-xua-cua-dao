-- Secondary cover pages, separate from ordinary album; no archival object deletion.
CREATE TABLE IF NOT EXISTS gdd_editor_cover_slots (
 kind TEXT NOT NULL, record_id TEXT NOT NULL,
 slot INTEGER NOT NULL CHECK(slot IN (2,3)), asset_id TEXT NOT NULL UNIQUE,
 updated_at TEXT NOT NULL, PRIMARY KEY(kind,record_id,slot)
);
