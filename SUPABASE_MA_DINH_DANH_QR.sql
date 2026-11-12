-- DẤU XƯA CỬA ĐẠO — mã định danh vĩnh viễn cho sáu chuyên mục chính.
-- Thiết kế bổ sung: không đổi UUID, slug, nội dung hoặc RLS hiện có.
-- Cấp mã ngay cả khi lưu bản nháp; mã không thay đổi khi sửa hoặc công bố.

-- people: DXCD-CS-00001...
CREATE SEQUENCE IF NOT EXISTS public.gdd_archive_cs_seq;
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS archive_code text;
WITH missing AS (
 SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS ordinal
 FROM public.people WHERE archive_code IS NULL
), current_max AS (
 SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint), 0) AS n FROM public.people
)
UPDATE public.people AS t SET archive_code = 'DXCD-CS-' ||
 lpad((missing.ordinal + current_max.n)::text,
      GREATEST(5, length((missing.ordinal + current_max.n)::text)), '0')
FROM missing CROSS JOIN current_max WHERE t.id = missing.id;
SELECT setval('public.gdd_archive_cs_seq'::regclass,
 GREATEST((SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint),0) FROM public.people),1),
 EXISTS(SELECT 1 FROM public.people));
CREATE UNIQUE INDEX IF NOT EXISTS people_archive_code_unique ON public.people(archive_code);
ALTER TABLE public.people ALTER COLUMN archive_code SET NOT NULL;
GRANT USAGE ON SEQUENCE public.gdd_archive_cs_seq TO authenticated;

-- posts: DXCD-BK-00001...
CREATE SEQUENCE IF NOT EXISTS public.gdd_archive_bk_seq;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS archive_code text;
WITH missing AS (
 SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS ordinal
 FROM public.posts WHERE archive_code IS NULL
), current_max AS (
 SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint), 0) AS n FROM public.posts
)
UPDATE public.posts AS t SET archive_code = 'DXCD-BK-' ||
 lpad((missing.ordinal + current_max.n)::text,
      GREATEST(5, length((missing.ordinal + current_max.n)::text)), '0')
FROM missing CROSS JOIN current_max WHERE t.id = missing.id;
SELECT setval('public.gdd_archive_bk_seq'::regclass,
 GREATEST((SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint),0) FROM public.posts),1),
 EXISTS(SELECT 1 FROM public.posts));
CREATE UNIQUE INDEX IF NOT EXISTS posts_archive_code_unique ON public.posts(archive_code);
ALTER TABLE public.posts ALTER COLUMN archive_code SET NOT NULL;
GRANT USAGE ON SEQUENCE public.gdd_archive_bk_seq TO authenticated;

-- media: DXCD-HA-00001...
CREATE SEQUENCE IF NOT EXISTS public.gdd_archive_ha_seq;
ALTER TABLE public.media ADD COLUMN IF NOT EXISTS archive_code text;
WITH missing AS (
 SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS ordinal
 FROM public.media WHERE archive_code IS NULL
), current_max AS (
 SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint), 0) AS n FROM public.media
)
UPDATE public.media AS t SET archive_code = 'DXCD-HA-' ||
 lpad((missing.ordinal + current_max.n)::text,
      GREATEST(5, length((missing.ordinal + current_max.n)::text)), '0')
FROM missing CROSS JOIN current_max WHERE t.id = missing.id;
SELECT setval('public.gdd_archive_ha_seq'::regclass,
 GREATEST((SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint),0) FROM public.media),1),
 EXISTS(SELECT 1 FROM public.media));
CREATE UNIQUE INDEX IF NOT EXISTS media_archive_code_unique ON public.media(archive_code);
ALTER TABLE public.media ALTER COLUMN archive_code SET NOT NULL;
GRANT USAGE ON SEQUENCE public.gdd_archive_ha_seq TO authenticated;

-- videos: DXCD-VD-00001...
CREATE SEQUENCE IF NOT EXISTS public.gdd_archive_vd_seq;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS archive_code text;
WITH missing AS (
 SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS ordinal
 FROM public.videos WHERE archive_code IS NULL
), current_max AS (
 SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint), 0) AS n FROM public.videos
)
UPDATE public.videos AS t SET archive_code = 'DXCD-VD-' ||
 lpad((missing.ordinal + current_max.n)::text,
      GREATEST(5, length((missing.ordinal + current_max.n)::text)), '0')
FROM missing CROSS JOIN current_max WHERE t.id = missing.id;
SELECT setval('public.gdd_archive_vd_seq'::regclass,
 GREATEST((SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint),0) FROM public.videos),1),
 EXISTS(SELECT 1 FROM public.videos));
CREATE UNIQUE INDEX IF NOT EXISTS videos_archive_code_unique ON public.videos(archive_code);
ALTER TABLE public.videos ALTER COLUMN archive_code SET NOT NULL;
GRANT USAGE ON SEQUENCE public.gdd_archive_vd_seq TO authenticated;

-- obituaries: DXCD-AT-00001...
CREATE SEQUENCE IF NOT EXISTS public.gdd_archive_at_seq;
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS archive_code text;
WITH missing AS (
 SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS ordinal
 FROM public.obituaries WHERE archive_code IS NULL
), current_max AS (
 SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint), 0) AS n FROM public.obituaries
)
UPDATE public.obituaries AS t SET archive_code = 'DXCD-AT-' ||
 lpad((missing.ordinal + current_max.n)::text,
      GREATEST(5, length((missing.ordinal + current_max.n)::text)), '0')
FROM missing CROSS JOIN current_max WHERE t.id = missing.id;
SELECT setval('public.gdd_archive_at_seq'::regclass,
 GREATEST((SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint),0) FROM public.obituaries),1),
 EXISTS(SELECT 1 FROM public.obituaries));
CREATE UNIQUE INDEX IF NOT EXISTS obituaries_archive_code_unique ON public.obituaries(archive_code);
ALTER TABLE public.obituaries ALTER COLUMN archive_code SET NOT NULL;
GRANT USAGE ON SEQUENCE public.gdd_archive_at_seq TO authenticated;

-- documents: DXCD-TL-00001...
CREATE SEQUENCE IF NOT EXISTS public.gdd_archive_tl_seq;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS archive_code text;
WITH missing AS (
 SELECT id, row_number() OVER (ORDER BY created_at NULLS LAST, id) AS ordinal
 FROM public.documents WHERE archive_code IS NULL
), current_max AS (
 SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint), 0) AS n FROM public.documents
)
UPDATE public.documents AS t SET archive_code = 'DXCD-TL-' ||
 lpad((missing.ordinal + current_max.n)::text,
      GREATEST(5, length((missing.ordinal + current_max.n)::text)), '0')
FROM missing CROSS JOIN current_max WHERE t.id = missing.id;
SELECT setval('public.gdd_archive_tl_seq'::regclass,
 GREATEST((SELECT COALESCE(MAX(substring(archive_code FROM '[0-9]+$')::bigint),0) FROM public.documents),1),
 EXISTS(SELECT 1 FROM public.documents));
CREATE UNIQUE INDEX IF NOT EXISTS documents_archive_code_unique ON public.documents(archive_code);
ALTER TABLE public.documents ALTER COLUMN archive_code SET NOT NULL;
GRANT USAGE ON SEQUENCE public.gdd_archive_tl_seq TO authenticated;

-- Hàm gọi từ trigger (quyền người đang lưu; không dùng SECURITY DEFINER).
CREATE OR REPLACE FUNCTION public.gdd_assign_archive_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $fn$
DECLARE v_prefix text; v_sequence text; v_num bigint;
BEGIN
 CASE TG_TABLE_NAME
   WHEN 'people' THEN v_prefix := 'CS'; v_sequence := 'public.gdd_archive_cs_seq';
   WHEN 'posts' THEN v_prefix := 'BK'; v_sequence := 'public.gdd_archive_bk_seq';
   WHEN 'media' THEN v_prefix := 'HA'; v_sequence := 'public.gdd_archive_ha_seq';
   WHEN 'videos' THEN v_prefix := 'VD'; v_sequence := 'public.gdd_archive_vd_seq';
   WHEN 'obituaries' THEN v_prefix := 'AT'; v_sequence := 'public.gdd_archive_at_seq';
   WHEN 'documents' THEN v_prefix := 'TL'; v_sequence := 'public.gdd_archive_tl_seq';
   ELSE RAISE EXCEPTION 'Không hỗ trợ loại hồ sơ %', TG_TABLE_NAME;
 END CASE;
 IF TG_OP = 'INSERT' THEN
   v_num := nextval(v_sequence::regclass);
   NEW.archive_code := 'DXCD-' || v_prefix || '-' ||
     lpad(v_num::text, GREATEST(5, length(v_num::text)), '0');
 ELSE
   -- Không cho sửa mã đã cấp, ngay cả khi cập nhật những trường khác.
   NEW.archive_code := OLD.archive_code;
 END IF;
 RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS gdd_archive_code_before_write ON public.people;
CREATE TRIGGER gdd_archive_code_before_write BEFORE INSERT OR UPDATE ON public.people
 FOR EACH ROW EXECUTE FUNCTION public.gdd_assign_archive_code();

DROP TRIGGER IF EXISTS gdd_archive_code_before_write ON public.posts;
CREATE TRIGGER gdd_archive_code_before_write BEFORE INSERT OR UPDATE ON public.posts
 FOR EACH ROW EXECUTE FUNCTION public.gdd_assign_archive_code();

DROP TRIGGER IF EXISTS gdd_archive_code_before_write ON public.media;
CREATE TRIGGER gdd_archive_code_before_write BEFORE INSERT OR UPDATE ON public.media
 FOR EACH ROW EXECUTE FUNCTION public.gdd_assign_archive_code();

DROP TRIGGER IF EXISTS gdd_archive_code_before_write ON public.videos;
CREATE TRIGGER gdd_archive_code_before_write BEFORE INSERT OR UPDATE ON public.videos
 FOR EACH ROW EXECUTE FUNCTION public.gdd_assign_archive_code();

DROP TRIGGER IF EXISTS gdd_archive_code_before_write ON public.obituaries;
CREATE TRIGGER gdd_archive_code_before_write BEFORE INSERT OR UPDATE ON public.obituaries
 FOR EACH ROW EXECUTE FUNCTION public.gdd_assign_archive_code();

DROP TRIGGER IF EXISTS gdd_archive_code_before_write ON public.documents;
CREATE TRIGGER gdd_archive_code_before_write BEFORE INSERT OR UPDATE ON public.documents
 FOR EACH ROW EXECUTE FUNCTION public.gdd_assign_archive_code();

