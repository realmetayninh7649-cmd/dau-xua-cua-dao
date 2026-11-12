-- GIỮ ĐẠO GIỮA ĐỜI — phân mã hồ sơ Chức sắc theo Cơ quan/Phẩm vị.
-- 12/11/2026. Chỉ thay quy tắc public.people; các chuyên mục khác giữ nguyên.
-- Mã mới: CS-CTD.PS-00001; CS-HTD.TQ-00001; mỗi nhóm đánh số riêng.
-- Mã cũ ghi tại archive_legacy_code để đối chiếu; URL QR vẫn dùng slug.

ALTER TABLE public.people
  ADD COLUMN IF NOT EXISTS archive_legacy_code text;

CREATE OR REPLACE FUNCTION public.gdd_person_archive_group(
  p_branch text, p_rank text, p_subgroup text, p_name text
) RETURNS text
LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER
SET search_path = ''
AS $fn$
DECLARE
  b text := lower(btrim(coalesce(p_branch,'')));
  r text := lower(btrim(coalesce(p_rank,'')));
  s text := lower(btrim(coalesce(p_subgroup,'')));
  n text := lower(btrim(coalesce(p_name,'')));
BEGIN
  -- Phân nhóm đặc biệt được xác định qua cơ quan và phân nhóm.
  IF b LIKE '%cửu trùng%' THEN
    IF s LIKE '%ban kiến trúc%' OR r LIKE '%ban kiến trúc%' THEN RETURN 'CTD.BKT'; END IF;
    IF r LIKE '%chánh phối sư%' THEN RETURN 'CTD.CPT'; END IF;
    IF r LIKE '%giáo tông%' THEN RETURN 'CTD.GT'; END IF;
    IF r LIKE '%chưởng pháp%' OR n LIKE '%chưởng pháp%' THEN RETURN 'CTD.CP'; END IF;
    IF r LIKE '%đầu sư%' THEN RETURN 'CTD.ĐS'; END IF;
    IF r LIKE '%phối sư%' THEN RETURN 'CTD.PS'; END IF;
    IF r LIKE '%giáo sư%' THEN RETURN 'CTD.GS'; END IF;
    IF r LIKE '%giáo hữu%' THEN RETURN 'CTD.GH'; END IF;
    IF r LIKE '%lễ sanh%' THEN RETURN 'CTD.LS'; END IF;
    IF r LIKE '%chức việc%' OR r LIKE '%phó trị sự%' OR r LIKE '%chánh trị sự%' THEN RETURN 'CTD.CV'; END IF;
    IF r LIKE '%đạo hữu%' THEN RETURN 'CTD.DH'; END IF;
    RETURN 'CTD.KH'; -- Trường hợp đặc biệt cần biên tập viên đối chiếu.
  ELSIF b LIKE '%hiệp thiên%' THEN
    IF s LIKE '%bộ pháp chánh%' OR r LIKE '%bộ pháp chánh%' THEN RETURN 'HTD.BPC'; END IF;
    IF s LIKE '%bộ nhạc%' OR r LIKE '%bộ nhạc%' THEN RETURN 'HTD.BN'; END IF;
    IF s LIKE '%ban thế đạo%' OR r LIKE '%ban thế đạo%' THEN RETURN 'HTD.BTD'; END IF;
    IF r LIKE '%hộ pháp%' THEN RETURN 'HTD.HP'; END IF;
    IF r LIKE '%thượng phẩm%' THEN RETURN 'HTD.TP'; END IF;
    IF r LIKE '%thượng sanh%' THEN RETURN 'HTD.TS'; END IF;
    IF r LIKE '%chơn quân%' OR r LIKE '%thời quân%' THEN RETURN 'HTD.TQ'; END IF;
    RETURN 'HTD.CQK';
  ELSIF b LIKE '%phước thiện%' THEN
    IF r LIKE '%thánh nhơn%' THEN RETURN 'PT.TN'; END IF;
    IF r LIKE '%chơn nhơn%' THEN RETURN 'PT.CN'; END IF;
    IF r LIKE '%hiền nhơn%' THEN RETURN 'PT.HN'; END IF;
    IF r LIKE '%đạo nhơn%' THEN RETURN 'PT.DN'; END IF;
    IF r LIKE '%giáo thiện%' THEN RETURN 'PT.GT'; END IF;
    IF r LIKE '%chí thiện%' THEN RETURN 'PT.CT'; END IF;
    IF r LIKE '%thừa sử%' THEN RETURN 'PT.TT'; END IF;
    RETURN 'PT.KH';
  ELSIF b LIKE '%hành chánh%' THEN
    IF s LIKE '%ban thế đạo%' OR r LIKE '%ban thế đạo%' THEN RETURN 'HCD.BTD'; END IF;
    IF r LIKE '%chức việc%' OR r LIKE '%trị sự%' THEN RETURN 'HCD.CV'; END IF;
    RETURN 'HCD.KH';
  END IF;
  RETURN 'KH.KH';
END;
$fn$;

-- Dùng PostgreSQL sequence riêng cho từng nhóm, tránh trùng khi nhiều bài đăng cùng lúc.
DO $fn$
DECLARE g record;
BEGIN
  FOR g IN
    SELECT * FROM (VALUES
    ('CTD.GT','gdd_person_ctd_gt_seq'),
    ('CTD.CP','gdd_person_ctd_cp_seq'),
    ('CTD.ĐS','gdd_person_ctd_ds_seq'),
    ('CTD.CPT','gdd_person_ctd_cpt_seq'),
    ('CTD.PS','gdd_person_ctd_ps_seq'),
    ('CTD.GS','gdd_person_ctd_gs_seq'),
    ('CTD.GH','gdd_person_ctd_gh_seq'),
    ('CTD.LS','gdd_person_ctd_ls_seq'),
    ('CTD.BKT','gdd_person_ctd_bkt_seq'),
    ('CTD.CV','gdd_person_ctd_cv_seq'),
    ('CTD.DH','gdd_person_ctd_dh_seq'),
    ('CTD.KH','gdd_person_ctd_kh_seq'),
    ('HTD.HP','gdd_person_htd_hp_seq'),
    ('HTD.TP','gdd_person_htd_tp_seq'),
    ('HTD.TS','gdd_person_htd_ts_seq'),
    ('HTD.TQ','gdd_person_htd_tq_seq'),
    ('HTD.BPC','gdd_person_htd_bpc_seq'),
    ('HTD.BN','gdd_person_htd_bn_seq'),
    ('HTD.BTD','gdd_person_htd_btd_seq'),
    ('HTD.CQK','gdd_person_htd_cqk_seq'),
    ('PT.TN','gdd_person_pt_tn_seq'),
    ('PT.CN','gdd_person_pt_cn_seq'),
    ('PT.HN','gdd_person_pt_hn_seq'),
    ('PT.DN','gdd_person_pt_dn_seq'),
    ('PT.GT','gdd_person_pt_gt_seq'),
    ('PT.CT','gdd_person_pt_ct_seq'),
    ('PT.TT','gdd_person_pt_tt_seq'),
    ('PT.KH','gdd_person_pt_kh_seq'),
    ('HCD.BTD','gdd_person_hcd_btd_seq'),
    ('HCD.CV','gdd_person_hcd_cv_seq'),
    ('HCD.KH','gdd_person_hcd_kh_seq'),
    ('KH.KH','gdd_person_kh_kh_seq')
    ) AS v(category,sequence_name)
  LOOP
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I',g.sequence_name);
    EXECUTE format('GRANT USAGE ON SEQUENCE public.%I TO authenticated',g.sequence_name);
  END LOOP;
END;
$fn$;

-- Gỡ trigger cũ trước khi thay đổi mã của những hồ sơ đã có.
DROP TRIGGER IF EXISTS gdd_archive_code_before_write ON public.people;
DROP TRIGGER IF EXISTS gdd_person_archive_code_before_write ON public.people;

-- Giữ mã cũ để tham khảo, không làm thay đổi UUID, slug, nguồn hay tiểu sử.
UPDATE public.people SET archive_legacy_code=archive_code
WHERE archive_legacy_code IS NULL AND archive_code LIKE 'DXCD-CS-%';

WITH categorized AS (
  SELECT id, created_at,
    public.gdd_person_archive_group(branch,rank,subgroup,full_name) AS category
  FROM public.people
), numbered AS (
  SELECT id,category,
    row_number() OVER (PARTITION BY category ORDER BY created_at NULLS LAST,id) AS seq
  FROM categorized
)
UPDATE public.people AS p
SET archive_code = 'CS-' || n.category || '-' || lpad(n.seq::text,5,'0')
FROM numbered AS n
WHERE p.id=n.id AND p.archive_code LIKE 'DXCD-CS-%';

-- Khởi tạo bộ đếm tiếp nối sau số cuối của từng nhóm (nhóm trống khởi đầu 00001).
DO $fn$
DECLARE g record; n bigint;
BEGIN
  FOR g IN SELECT * FROM (VALUES
    ('CTD.GT','gdd_person_ctd_gt_seq'),
    ('CTD.CP','gdd_person_ctd_cp_seq'),
    ('CTD.ĐS','gdd_person_ctd_ds_seq'),
    ('CTD.CPT','gdd_person_ctd_cpt_seq'),
    ('CTD.PS','gdd_person_ctd_ps_seq'),
    ('CTD.GS','gdd_person_ctd_gs_seq'),
    ('CTD.GH','gdd_person_ctd_gh_seq'),
    ('CTD.LS','gdd_person_ctd_ls_seq'),
    ('CTD.BKT','gdd_person_ctd_bkt_seq'),
    ('CTD.CV','gdd_person_ctd_cv_seq'),
    ('CTD.DH','gdd_person_ctd_dh_seq'),
    ('CTD.KH','gdd_person_ctd_kh_seq'),
    ('HTD.HP','gdd_person_htd_hp_seq'),
    ('HTD.TP','gdd_person_htd_tp_seq'),
    ('HTD.TS','gdd_person_htd_ts_seq'),
    ('HTD.TQ','gdd_person_htd_tq_seq'),
    ('HTD.BPC','gdd_person_htd_bpc_seq'),
    ('HTD.BN','gdd_person_htd_bn_seq'),
    ('HTD.BTD','gdd_person_htd_btd_seq'),
    ('HTD.CQK','gdd_person_htd_cqk_seq'),
    ('PT.TN','gdd_person_pt_tn_seq'),
    ('PT.CN','gdd_person_pt_cn_seq'),
    ('PT.HN','gdd_person_pt_hn_seq'),
    ('PT.DN','gdd_person_pt_dn_seq'),
    ('PT.GT','gdd_person_pt_gt_seq'),
    ('PT.CT','gdd_person_pt_ct_seq'),
    ('PT.TT','gdd_person_pt_tt_seq'),
    ('PT.KH','gdd_person_pt_kh_seq'),
    ('HCD.BTD','gdd_person_hcd_btd_seq'),
    ('HCD.CV','gdd_person_hcd_cv_seq'),
    ('HCD.KH','gdd_person_hcd_kh_seq'),
    ('KH.KH','gdd_person_kh_kh_seq')
    ) AS v(category,sequence_name)
  LOOP
    SELECT COALESCE(MAX(split_part(p.archive_code,'-',3)::bigint),0) INTO n
    FROM public.people p
    WHERE p.archive_code LIKE 'CS-' || g.category || '-%';
    PERFORM setval(('public.'||g.sequence_name)::regclass,GREATEST(n,1),n>0);
  END LOOP;
END;
$fn$;

-- Sinh mã một lần khi lập hồ sơ; sau khi cấp không thay đổi khi chỉnh sửa.
CREATE OR REPLACE FUNCTION public.gdd_person_assign_archive_code()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path=''
AS $fn$
DECLARE v_category text; v_seq_name text; v_no bigint;
BEGIN
  IF TG_OP='UPDATE' THEN
    NEW.archive_code := OLD.archive_code;
    NEW.archive_legacy_code := OLD.archive_legacy_code;
    RETURN NEW;
  END IF;
  v_category:=public.gdd_person_archive_group(NEW.branch,NEW.rank,NEW.subgroup,NEW.full_name);
  v_seq_name:='public.gdd_person_'||
    replace(lower(translate(v_category,'Đ','D')),'.','_')||'_seq';
  v_no:=nextval(v_seq_name::regclass);
  NEW.archive_code:='CS-'||v_category||'-'||
    lpad(v_no::text,GREATEST(5,length(v_no::text)),'0');
  RETURN NEW;
END;
$fn$;

CREATE TRIGGER gdd_person_archive_code_before_write
BEFORE INSERT OR UPDATE ON public.people
FOR EACH ROW EXECUTE FUNCTION public.gdd_person_assign_archive_code();

-- Các hàm này không phải là RPC công khai để sửa mã.
REVOKE ALL ON FUNCTION public.gdd_person_archive_group(text,text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.gdd_person_assign_archive_code() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.gdd_person_archive_group(text,text,text,text) TO authenticated;
