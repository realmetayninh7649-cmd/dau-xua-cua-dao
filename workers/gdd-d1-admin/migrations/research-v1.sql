CREATE TABLE IF NOT EXISTS gdd_research_items (
 id TEXT PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('quote','history','ritual','featured')),
 title TEXT NOT NULL, excerpt TEXT NOT NULL DEFAULT '', speaker TEXT NOT NULL DEFAULT '',
 source_url TEXT NOT NULL, citation TEXT NOT NULL DEFAULT '', source_date TEXT NOT NULL DEFAULT '',
 note TEXT NOT NULL DEFAULT '', rights TEXT NOT NULL DEFAULT 'unknown' CHECK(rights IN ('unknown','permitted','public_domain','licensed')),
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','approved','rejected')),
 visible INTEGER NOT NULL DEFAULT 0 CHECK(visible IN (0,1)), version INTEGER NOT NULL DEFAULT 1,
 discovered_key TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(visible=0 OR (state='approved' AND rights<>'unknown' AND length(excerpt)>0 AND length(citation)>0))
);
CREATE INDEX IF NOT EXISTS gdd_research_state_idx ON gdd_research_items(state,visible,kind,updated_at);
CREATE TABLE IF NOT EXISTS gdd_research_revisions (
 id TEXT PRIMARY KEY, item_id TEXT NOT NULL, version INTEGER NOT NULL, snapshot TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE(item_id,version)
);
CREATE TABLE IF NOT EXISTS gdd_research_runs (
 id TEXT PRIMARY KEY, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, result TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gdd_research_attempts (source_url TEXT PRIMARY KEY, attempted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, outcome TEXT NOT NULL);
