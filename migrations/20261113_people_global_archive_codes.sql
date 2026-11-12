-- GIỮ ĐẠO GIỮA ĐỜI — Quy tắc mã định danh Chức sắc 13/11/2026
-- Quy ước: CTD / HTD đánh số liên tục trong từng Đài; phẩm vị chỉ là tiền tố.
-- Chỉ cấp mới khi xuất bản, không chiếm mã cho bản nháp.
-- Giữ mã cũ trong archive_code_aliases để đồng đạo còn tra cứu được.
-- Không xóa bất kỳ hồ sơ hoặc nội dung nào; Ngọc Ngọ Thanh chuyển thành bản nháp.

LOCK TABLE public.people IN ACCESS EXCLUSIVE MODE;

ALTER TABLE public.people ADD COLUMN IF NOT EXISTS archive_code_aliases text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.people ALTER COLUMN archive_code DROP NOT NULL;

-- Có thể chạy lại an toàn khi dãy số đã tồn tại (không hạ số đang cấp).
CREATE SEQUENCE IF NOT EXISTS public.gdd_person_ctd_global_seq AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS public.gdd_person_htd_global_seq AS bigint START WITH 1 INCREMENT BY 1 MINVALUE 1;
-- Chỉ tài khoản đã xác thực mới được dùng sequence khi RLS cho phép đăng bài.
REVOKE ALL ON SEQUENCE public.gdd_person_ctd_global_seq, public.gdd_person_htd_global_seq
  FROM PUBLIC, anon;
GRANT USAGE ON SEQUENCE public.gdd_person_ctd_global_seq, public.gdd_person_htd_global_seq
  TO authenticated, service_role;

-- Xác nhận chốt đầu dòng và bản tạm rút trước khi thay mã cũ.
DO $check$
BEGIN
 IF (SELECT count(*) FROM public.people WHERE full_name='NGỌC NGỌ THANH'
     AND branch='Cửu Trùng Đài' AND published=true) <> 1 THEN
    RAISE EXCEPTION 'Không tìm thấy chính xác một bài Phối Sư Ngọc Ngọ Thanh đã công bố';
 END IF;
 IF (SELECT count(*) FROM public.people WHERE published=true AND branch='Hiệp Thiên Đài')<>13 THEN
    RAISE EXCEPTION 'Số hồ sơ Hiệp Thiên Đài thay đổi, dừng để đối chiếu';
 END IF;
 IF (SELECT count(*) FROM public.people WHERE published=true AND branch='Cửu Trùng Đài')<>13 THEN
    RAISE EXCEPTION 'Số hồ sơ Cửu Trùng Đài thay đổi, dừng để đối chiếu';
 END IF;
 IF EXISTS (SELECT 1 FROM (VALUES
   ('Hiệp Thiên Đài','ĐỨC HỘ PHÁP PHẠM CÔNG TẮC'),
   ('Hiệp Thiên Đài','ĐỨC THƯỢNG PHẨM CAO QUỲNH CƯ'),
   ('Hiệp Thiên Đài','ĐỨC THƯỢNG SANH CAO HOÀI SANG'),
   ('Cửu Trùng Đài','ĐỨC QUYỀN GIÁO TÔNG LÊ VĂN TRUNG')
 ) AS expected(branch,full_name)
 WHERE (SELECT count(*) FROM public.people p
        WHERE p.branch=expected.branch AND p.full_name=expected.full_name
              AND p.published=true)<>1) THEN
    RAISE EXCEPTION 'Một nhân vật chốt thứ tự bị thiếu hoặc có bản ghi trùng';
 END IF;
END $check$;

CREATE TEMP TABLE gdd_reindex_people_20261113 ON COMMIT DROP AS
WITH ordered AS (
  SELECT p.id,p.archive_code AS old_code,p.branch,
   public.gdd_person_archive_group(p.branch,p.rank,p.subgroup,p.full_name) AS category,
   row_number() OVER (
     PARTITION BY p.branch ORDER BY
       CASE
         WHEN p.branch='Hiệp Thiên Đài' AND p.full_name='ĐỨC HỘ PHÁP PHẠM CÔNG TẮC' THEN 1
         WHEN p.branch='Hiệp Thiên Đài' AND p.full_name='ĐỨC THƯỢNG PHẨM CAO QUỲNH CƯ' THEN 2
         WHEN p.branch='Hiệp Thiên Đài' AND p.full_name='ĐỨC THƯỢNG SANH CAO HOÀI SANG' THEN 3
         WHEN p.branch='Cửu Trùng Đài' AND p.full_name='ĐỨC QUYỀN GIÁO TÔNG LÊ VĂN TRUNG' THEN 1
         ELSE 100
       END,p.created_at,p.id
   )::bigint AS assigned_no
  FROM public.people p
  WHERE p.published=true
    AND p.branch IN ('Hiệp Thiên Đài','Cửu Trùng Đài')
    AND p.full_name<>'NGỌC NGỌ THANH'
)
SELECT id,old_code,branch,assigned_no,
 'CS-'||category||'-'||lpad(assigned_no::text,5,'0') AS new_code
FROM ordered;

DO $check$
BEGIN
 IF (SELECT count(*) FROM pg_temp.gdd_reindex_people_20261113)<>25
    OR (SELECT count(*) FROM pg_temp.gdd_reindex_people_20261113 WHERE branch='Hiệp Thiên Đài')<>13
    OR (SELECT count(*) FROM pg_temp.gdd_reindex_people_20261113 WHERE branch='Cửu Trùng Đài')<>12
 THEN RAISE EXCEPTION 'Dữ liệu dự kiến khác 13 HTD / 12 CTD; dừng tái đánh số'; END IF;
 IF EXISTS (SELECT new_code FROM pg_temp.gdd_reindex_people_20261113
            GROUP BY new_code HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Trùng số trong bảng đối chiếu mã mới'; END IF;
END $check$;

-- Đang trong một transaction DDL/đổi mã. Vô hiệu trigger chỉ cho lần tái đánh số này.
ALTER TABLE public.people DISABLE TRIGGER gdd_person_archive_code_before_write;

-- Giai đoạn trung gian để tránh đụng chỉ mục UNIQUE ở những mã cũ chưa di dời.
UPDATE public.people p
SET archive_code='CS-REINDEX-'||p.id::text
FROM pg_temp.gdd_reindex_people_20261113 x
WHERE p.id=x.id;

-- Không xóa bài Ngọc Ngọ Thanh: đưa về bản nháp, bỏ mã hiện hành.
UPDATE public.people
SET published=false,archive_code=NULL,sort_order=NULL,
    archive_code_aliases=array_append(archive_code_aliases,archive_code)
WHERE full_name='NGỌC NGỌ THANH' AND branch='Cửu Trùng Đài';

-- Lưu từng mã đã cấp trước đây làm bí danh tra cứu; cấp mã mới + thứ tự hiển thị.
UPDATE public.people p
SET archive_code=x.new_code,
    archive_code_aliases=CASE WHEN x.old_code IS NOT NULL AND x.old_code<>x.new_code
        THEN array_append(p.archive_code_aliases,x.old_code) ELSE p.archive_code_aliases END,
    sort_order=(x.assigned_no*10)::integer
FROM pg_temp.gdd_reindex_people_20261113 x
WHERE p.id=x.id;

ALTER TABLE public.people ENABLE TRIGGER gdd_person_archive_code_before_write;

-- Đặt vị trí dãy số tiếp theo bằng số cuối hiện có trong từng Đài.
SELECT setval('public.gdd_person_ctd_global_seq'::regclass,
              (SELECT max(assigned_no) FROM pg_temp.gdd_reindex_people_20261113 WHERE branch='Cửu Trùng Đài'),true);
SELECT setval('public.gdd_person_htd_global_seq'::regclass,
              (SELECT max(assigned_no) FROM pg_temp.gdd_reindex_people_20261113 WHERE branch='Hiệp Thiên Đài'),true);

-- Từ nay mã chỉ được cấp khi bài được công bố; cập nhật bài cũ không đổi mã.
CREATE OR REPLACE FUNCTION public.gdd_person_assign_archive_code()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $function$
DECLARE
  v_category text;
  v_seq_name text;
  v_no bigint;
BEGIN
  IF TG_OP='UPDATE' THEN
    NEW.archive_legacy_code := OLD.archive_legacy_code;
    NEW.archive_code_aliases := OLD.archive_code_aliases;
    IF OLD.archive_code IS NOT NULL THEN
      NEW.archive_code := OLD.archive_code;
      RETURN NEW;
    END IF;
    IF NOT NEW.published THEN
      NEW.archive_code := NULL;
      RETURN NEW;
    END IF;
  ELSE
    NEW.archive_code_aliases := '{}'::text[];
    IF NOT NEW.published THEN
      NEW.archive_code := NULL;
      RETURN NEW;
    END IF;
  END IF;

  v_category:=public.gdd_person_archive_group(NEW.branch,NEW.rank,NEW.subgroup,NEW.full_name);
  IF v_category LIKE 'CTD.%' THEN
    v_seq_name:='public.gdd_person_ctd_global_seq';
  ELSIF v_category LIKE 'HTD.%' THEN
    v_seq_name:='public.gdd_person_htd_global_seq';
  ELSE
    -- Các cơ quan khác giữ hệ thống dãy số hiện tại.
    v_seq_name:='public.gdd_person_'||
      replace(lower(translate(v_category,'Đ','D')),'.','_')||'_seq';
  END IF;
  v_no:=nextval(v_seq_name::regclass);
  NEW.archive_code:='CS-'||v_category||'-'||
    lpad(v_no::text,GREATEST(5,length(v_no::text)),'0');
  RETURN NEW;
END;
$function$;

-- Không thể công bố hồ sơ chưa có mã. Bản nháp được để trống mã.
ALTER TABLE public.people
ADD CONSTRAINT gdd_people_published_require_code
CHECK (published=false OR archive_code IS NOT NULL);
