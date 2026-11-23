-- DẤU XƯA CỬA ĐẠO / D1 schema STAGING
-- Generated from actual Supabase public information_schema (2026-11-23).
-- No data, passwords, API keys or private original files are included.
-- PostgreSQL UUID/time/array/JSON values are represented as TEXT in SQLite.
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS "admin_users" (
  "user_id" TEXT PRIMARY KEY,
  "created_at" TEXT
);


CREATE TABLE IF NOT EXISTS "archive_gallery_images" (
  "id" TEXT PRIMARY KEY,
  "owner_kind" TEXT,
  "owner_id" TEXT,
  "image_url" TEXT,
  "caption" TEXT,
  "sort_order" INTEGER,
  "created_at" TEXT,
  "photo_no" INTEGER,
  "album_archive_code" TEXT,
  "photo_code" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_archive_gallery_images_owner" ON "archive_gallery_images" ("owner_kind", "owner_id");
CREATE INDEX IF NOT EXISTS "idx_archive_gallery_images_photo_code" ON "archive_gallery_images" ("photo_code");

CREATE TABLE IF NOT EXISTS "documents" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT,
  "title" TEXT,
  "document_number" TEXT,
  "document_date" TEXT,
  "summary" TEXT,
  "body" TEXT,
  "file_url" TEXT,
  "sources" TEXT,
  "person_id" TEXT,
  "published" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT,
  "archive_code" TEXT,
  "subfolder_code" TEXT,
  "archive_legacy_code" TEXT,
  "archive_code_aliases" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_documents_pub_created" ON "documents" ("published", "created_at");
CREATE INDEX IF NOT EXISTS "idx_documents_slug" ON "documents" ("slug");
CREATE INDEX IF NOT EXISTS "idx_documents_archive_code" ON "documents" ("archive_code");
CREATE INDEX IF NOT EXISTS "idx_documents_person_id" ON "documents" ("person_id");

CREATE TABLE IF NOT EXISTS "gdd_album_photo_counters" (
  "owner_kind" TEXT,
  "owner_id" TEXT,
  "last_no" INTEGER,
  "album_code" TEXT,
  PRIMARY KEY ("owner_kind", "owner_id")
);

CREATE INDEX IF NOT EXISTS "idx_gdd_album_photo_counters_owner" ON "gdd_album_photo_counters" ("owner_kind", "owner_id");

CREATE TABLE IF NOT EXISTS "gdd_audio_programs" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT,
  "category" TEXT,
  "title" TEXT,
  "summary" TEXT,
  "body" TEXT,
  "cover_url" TEXT,
  "audio_url" TEXT,
  "episode_number" INTEGER,
  "published_date" TEXT,
  "duration_seconds" INTEGER,
  "published" INTEGER,
  "published_at" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_gdd_audio_programs_pub_created" ON "gdd_audio_programs" ("published", "created_at");
CREATE INDEX IF NOT EXISTS "idx_gdd_audio_programs_slug" ON "gdd_audio_programs" ("slug");

CREATE TABLE IF NOT EXISTS "gdd_calendar_memorials" (
  "id" TEXT PRIMARY KEY,
  "full_name" TEXT,
  "rank" TEXT,
  "calendar_system" TEXT,
  "lunar_day" INTEGER,
  "lunar_month" INTEGER,
  "lunar_leap" INTEGER,
  "solar_day" INTEGER,
  "solar_month" INTEGER,
  "death_year" INTEGER,
  "image_url" TEXT,
  "source_note" TEXT,
  "description" TEXT,
  "linked_person_id" TEXT,
  "published" INTEGER,
  "created_by" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_gdd_calendar_memorials_pub_created" ON "gdd_calendar_memorials" ("published", "created_at");

CREATE TABLE IF NOT EXISTS "gdd_content_metric_events" (
  "kind" TEXT,
  "record_id" TEXT,
  "event_type" TEXT,
  "event_key" TEXT,
  "recorded_at" TEXT,
  PRIMARY KEY ("kind", "record_id", "event_type", "event_key")
);


CREATE TABLE IF NOT EXISTS "gdd_content_metrics" (
  "kind" TEXT,
  "record_id" TEXT,
  "view_count" INTEGER,
  "download_count" INTEGER,
  "updated_at" TEXT,
  PRIMARY KEY ("kind", "record_id")
);


CREATE TABLE IF NOT EXISTS "gdd_content_placements" (
  "owner_kind" TEXT,
  "owner_id" TEXT,
  "target_kind" TEXT,
  "updated_at" TEXT,
  "target_category" TEXT,
  PRIMARY KEY ("owner_kind", "owner_id")
);

CREATE INDEX IF NOT EXISTS "idx_gdd_content_placements_owner" ON "gdd_content_placements" ("owner_kind", "owner_id");

CREATE TABLE IF NOT EXISTS "gdd_memorials" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT,
  "title" TEXT,
  "person_name" TEXT,
  "rank_title" TEXT,
  "death_date" TEXT,
  "anniversary_date" TEXT,
  "summary" TEXT,
  "body" TEXT,
  "portrait_url" TEXT,
  "sources" TEXT,
  "published" INTEGER,
  "published_at" TEXT,
  "created_at" TEXT,
  "updated_at" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_gdd_memorials_pub_created" ON "gdd_memorials" ("published", "created_at");
CREATE INDEX IF NOT EXISTS "idx_gdd_memorials_slug" ON "gdd_memorials" ("slug");

CREATE TABLE IF NOT EXISTS "gdd_r2_assets" (
  "asset_id" TEXT PRIMARY KEY,
  "owner_id" TEXT,
  "record_kind" TEXT,
  "record_id" TEXT,
  "role" TEXT,
  "original_name" TEXT,
  "original_bytes" INTEGER,
  "media_kind" TEXT,
  "preview_ready" INTEGER,
  "download_ready" INTEGER,
  "created_at" TEXT,
  "view_page_count" INTEGER,
  "view_source" TEXT,
  "public_view" INTEGER,
  "allow_download" INTEGER,
  "view_updated_at" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_gdd_r2_assets_record" ON "gdd_r2_assets" ("record_kind", "record_id");

CREATE TABLE IF NOT EXISTS "gdd_site_download_events" (
  "event_id" TEXT PRIMARY KEY,
  "session_id" TEXT,
  "download_kind" TEXT,
  "recorded_at" TEXT
);


CREATE TABLE IF NOT EXISTS "gdd_site_download_totals" (
  "singleton" INTEGER PRIMARY KEY,
  "total_unlinked" INTEGER
);


CREATE TABLE IF NOT EXISTS "gdd_visit_sessions" (
  "session_id" TEXT PRIMARY KEY,
  "first_seen" TEXT,
  "last_seen" TEXT
);


CREATE TABLE IF NOT EXISTS "gdd_visit_totals" (
  "singleton" INTEGER PRIMARY KEY,
  "total_visits" INTEGER,
  "last_cleanup" TEXT
);


CREATE TABLE IF NOT EXISTS "media" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT,
  "title" TEXT,
  "caption" TEXT,
  "person_id" TEXT,
  "sources" TEXT,
  "image_url" TEXT,
  "published" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT,
  "archive_code" TEXT,
  "category" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_media_pub_created" ON "media" ("published", "created_at");
CREATE INDEX IF NOT EXISTS "idx_media_slug" ON "media" ("slug");
CREATE INDEX IF NOT EXISTS "idx_media_archive_code" ON "media" ("archive_code");
CREATE INDEX IF NOT EXISTS "idx_media_person_id" ON "media" ("person_id");

CREATE TABLE IF NOT EXISTS "obituaries" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT,
  "title" TEXT,
  "deceased_name" TEXT,
  "memorial_date" TEXT,
  "summary" TEXT,
  "body" TEXT,
  "cover_url" TEXT,
  "sources" TEXT,
  "person_id" TEXT,
  "published" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT,
  "archive_code" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_obituaries_pub_created" ON "obituaries" ("published", "created_at");
CREATE INDEX IF NOT EXISTS "idx_obituaries_slug" ON "obituaries" ("slug");
CREATE INDEX IF NOT EXISTS "idx_obituaries_archive_code" ON "obituaries" ("archive_code");
CREATE INDEX IF NOT EXISTS "idx_obituaries_person_id" ON "obituaries" ("person_id");

CREATE TABLE IF NOT EXISTS "people" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT,
  "full_name" TEXT,
  "secular_name" TEXT,
  "rank" TEXT,
  "branch" TEXT,
  "years" TEXT,
  "birthplace" TEXT,
  "summary" TEXT,
  "biography" TEXT,
  "date_notes" TEXT,
  "sources" TEXT,
  "image_url" TEXT,
  "verified" INTEGER,
  "published" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT,
  "subgroup" TEXT,
  "gender" TEXT,
  "sort_order" INTEGER,
  "death_lunar_day" INTEGER,
  "death_lunar_month" INTEGER,
  "death_lunar_leap" INTEGER,
  "death_solar_date" TEXT,
  "archive_code" TEXT,
  "archive_legacy_code" TEXT,
  "archive_code_aliases" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_people_pub_created" ON "people" ("published", "created_at");
CREATE INDEX IF NOT EXISTS "idx_people_slug" ON "people" ("slug");
CREATE INDEX IF NOT EXISTS "idx_people_archive_code" ON "people" ("archive_code");

CREATE TABLE IF NOT EXISTS "posts" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT,
  "title" TEXT,
  "category" TEXT,
  "summary" TEXT,
  "body" TEXT,
  "sources" TEXT,
  "person_id" TEXT,
  "cover_url" TEXT,
  "verified" INTEGER,
  "published" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT,
  "archive_code" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_posts_pub_created" ON "posts" ("published", "created_at");
CREATE INDEX IF NOT EXISTS "idx_posts_slug" ON "posts" ("slug");
CREATE INDEX IF NOT EXISTS "idx_posts_archive_code" ON "posts" ("archive_code");
CREATE INDEX IF NOT EXISTS "idx_posts_person_id" ON "posts" ("person_id");

CREATE TABLE IF NOT EXISTS "submissions" (
  "id" TEXT PRIMARY KEY,
  "sender_name" TEXT,
  "sender_email" TEXT,
  "category" TEXT,
  "title" TEXT,
  "description" TEXT,
  "source" TEXT,
  "source_url" TEXT,
  "file_path" TEXT,
  "status" TEXT,
  "created_at" TEXT
);


CREATE TABLE IF NOT EXISTS "videos" (
  "id" TEXT PRIMARY KEY,
  "slug" TEXT,
  "title" TEXT,
  "summary" TEXT,
  "body" TEXT,
  "video_url" TEXT,
  "cover_url" TEXT,
  "sources" TEXT,
  "person_id" TEXT,
  "published" INTEGER,
  "created_at" TEXT,
  "updated_at" TEXT,
  "archive_code" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_videos_pub_created" ON "videos" ("published", "created_at");
CREATE INDEX IF NOT EXISTS "idx_videos_slug" ON "videos" ("slug");
CREATE INDEX IF NOT EXISTS "idx_videos_archive_code" ON "videos" ("archive_code");
CREATE INDEX IF NOT EXISTS "idx_videos_person_id" ON "videos" ("person_id");

CREATE TABLE IF NOT EXISTS "gdd_import_audit" (
  "table_name" TEXT PRIMARY KEY,
  "source_count" INTEGER NOT NULL,
  "import_count" INTEGER NOT NULL,
  "source_snapshot_date" TEXT,
  "last_verified_at" TEXT
);
