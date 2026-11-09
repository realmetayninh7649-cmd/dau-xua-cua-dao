-- GIỮ ĐẠO GIỮA ĐỜI — kỷ niệm qui vị do quản trị viên nhập trực tiếp từ lịch.
-- Tách dữ liệu nhập tay khỏi people để không làm ảnh hưởng hồ sơ Chức Sắc.
create table if not exists public.gdd_calendar_memorials (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(btrim(full_name)) between 2 and 240),
  rank text check (rank is null or length(rank)<=160),
  calendar_system text not null default 'lunar' check(calendar_system in ('lunar','solar')),
  lunar_day smallint check(lunar_day between 1 and 30),
  lunar_month smallint check(lunar_month between 1 and 12),
  lunar_leap boolean not null default false,
  solar_day smallint check(solar_day between 1 and 31),
  solar_month smallint check(solar_month between 1 and 12),
  death_year smallint check(death_year between 1800 and 2100),
  image_url text check(image_url is null or length(image_url)<=2048),
  source_note text check(source_note is null or length(source_note)<=4000),
  description text check(description is null or length(description)<=4000),
  linked_person_id uuid references public.people(id) on delete set null,
  published boolean not null default true,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gdd_calendar_memorials_day_choice check (
    (calendar_system='lunar' and lunar_day is not null and lunar_month is not null
      and solar_day is null and solar_month is null)
    or
    (calendar_system='solar' and solar_day is not null and solar_month is not null
      and lunar_day is null and lunar_month is null and lunar_leap=false)
  ),
  constraint gdd_calendar_memorials_solar_valid check (
    calendar_system<>'solar' or
    solar_day <= case solar_month
      when 2 then 29
      when 4 then 30 when 6 then 30 when 9 then 30 when 11 then 30
      else 31 end
  )
);
create unique index if not exists gdd_calendar_memorials_no_exact_duplicate
  on public.gdd_calendar_memorials (
    lower(btrim(full_name)), calendar_system,
    coalesce(lunar_day,0), coalesce(lunar_month,0), lunar_leap,
    coalesce(solar_day,0), coalesce(solar_month,0)
  );
create index if not exists gdd_calendar_memorials_public_dates
  on public.gdd_calendar_memorials(published,calendar_system,lunar_month,lunar_day,solar_month,solar_day);
alter table public.gdd_calendar_memorials enable row level security;
revoke all on public.gdd_calendar_memorials from anon,authenticated;
grant select on public.gdd_calendar_memorials to anon,authenticated;
grant insert,update,delete on public.gdd_calendar_memorials to authenticated;

create policy "calendar manual public read"
 on public.gdd_calendar_memorials for select to anon
 using (published=true);
create policy "calendar manual authenticated read"
 on public.gdd_calendar_memorials for select to authenticated
 using (published=true or (select public.is_site_admin()));
create policy "calendar manual admin insert"
 on public.gdd_calendar_memorials for insert to authenticated
 with check ((select public.is_site_admin()));
create policy "calendar manual admin update"
 on public.gdd_calendar_memorials for update to authenticated
 using ((select public.is_site_admin()))
 with check ((select public.is_site_admin()));
create policy "calendar manual admin delete"
 on public.gdd_calendar_memorials for delete to authenticated
 using ((select public.is_site_admin()));
