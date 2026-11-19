-- DẤU XƯA CỬA ĐẠO · Emergency rollback only.
-- Use ONLY if the public site cannot retrieve verified R2 derivatives after private cutover.
-- This temporarily re-opens historical Supabase source URLs and should be reverted ASAP.
-- Never delete or move original objects.
UPDATE storage.buckets
SET public = true
WHERE id IN ('dao-su-images','dao-su-documents');
