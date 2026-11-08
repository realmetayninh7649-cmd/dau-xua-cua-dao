-- GIỮ ĐẠO GIỮA ĐỜI · Lịch kỷ niệm qui vị Chức Sắc
-- Đã áp dụng trên Supabase ngày 09/11/2026. Tệp này giữ để sao lưu.
-- Chỉ thêm 4 cột tùy chọn, không thay đổi các trường tiểu sử, hình ảnh hay quyền truy cập.
alter table public.people
 add column if not exists death_lunar_day smallint,
 add column if not exists death_lunar_month smallint,
 add column if not exists death_lunar_leap boolean not null default false,
 add column if not exists death_solar_date date;
do $$
begin
 if not exists(select 1 from pg_constraint where conname='people_death_lunar_day_check' and conrelid='public.people'::regclass) then
  alter table public.people add constraint people_death_lunar_day_check check(death_lunar_day is null or death_lunar_day between 1 and 30);
 end if;
 if not exists(select 1 from pg_constraint where conname='people_death_lunar_month_check' and conrelid='public.people'::regclass) then
  alter table public.people add constraint people_death_lunar_month_check check(death_lunar_month is null or death_lunar_month between 1 and 12);
 end if;
 if not exists(select 1 from pg_constraint where conname='people_death_lunar_pair_check' and conrelid='public.people'::regclass) then
  alter table public.people add constraint people_death_lunar_pair_check check ((death_lunar_day is null)=(death_lunar_month is null) and (not death_lunar_leap or death_lunar_day is not null));
 end if;
end $$;
-- Các mốc trích từ những tiểu sử đã công bố, đã đối chiếu cặp ngày Âm/Dương.
-- Không gán ngày cho trường hợp mất tích hay ghi chép còn mâu thuẫn.
with sourced(full_name,ld,lm,leap,sd) as (values
 ('NGỌC NGỌ THANH',23,5,false,date '1967-06-30'),
 ('TIẾP ĐẠO CHƠN QUÂN CAO ĐỨC TRỌNG',23,5,false,date '1958-07-09'),
 ('KHAI THẾ CHƠN QUÂN THÁI VĂN THÂU',2,6,false,date '1981-07-03'),
 ('NHO CHƯỞNG PHÁP TRẦN VĂN THỤ',14,5,false,date '1927-06-13'),
 ('THÍCH CHƯỞNG PHÁP HÒA THƯỢNG NHƯ NHÃN',5,12,false,date '1939-01-24'),
 ('BẢO THẾ CHƠN QUÂN LÊ THIỆN PHƯỚC',17,3,false,date '1975-04-27'),
 ('BẢO PHÁP CHƠN QUÂN NGUYỄN TRUNG HẬU',7,9,false,date '1961-10-16'),
 ('KHAI ĐẠO CHƠN QUÂN PHẠM TẤN ĐÃI',19,2,false,date '1976-03-19'),
 ('BẢO ĐẠO CHƠN QUÂN HỒ TẤN KHOA',18,12,false,date '1987-01-17'),
 ('ĐẦU SƯ THÁI NƯƠNG TINH',25,10,false,date '1929-11-25'),
 ('ĐỨC THƯỢNG PHẨM CAO QUỲNH CƯ',1,3,false,date '1929-04-10'),
 ('ĐỨC QUYỀN GIÁO TÔNG LÊ VĂN TRUNG',13,10,false,date '1934-11-19'),
 ('KHAI PHÁP CHƠN QUÂN TRẦN DUY NGHĨA',22,1,false,date '1954-02-24')
)
update public.people as p
set death_lunar_day=s.ld,death_lunar_month=s.lm,death_lunar_leap=s.leap,death_solar_date=s.sd
from sourced s
where p.full_name=s.full_name and p.published=true and p.verified=true
 and p.death_lunar_day is null and p.death_lunar_month is null and p.death_solar_date is null;
