CREATE TABLE IF NOT EXISTS gdd_record_access (
 kind TEXT NOT NULL CHECK(kind IN ('people','documents')),
 record_id TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('download','view','protected')),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY(kind,record_id)
);
CREATE TABLE IF NOT EXISTS gdd_access_media (
 kind TEXT NOT NULL CHECK(kind IN ('people','documents')),
 record_id TEXT NOT NULL,
 media_ref TEXT NOT NULL,
 PRIMARY KEY(kind,record_id,media_ref),
 FOREIGN KEY(kind,record_id) REFERENCES gdd_record_access(kind,record_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS gdd_access_media_lookup ON gdd_access_media(media_ref);
