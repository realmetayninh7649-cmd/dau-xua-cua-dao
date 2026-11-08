-- ÂM THANH ĐẠI ĐẠO / RADIO ĐẠO SỬ
-- Bản lưu cấu trúc để sao lưu, Supabase đã chạy migration.
-- Giữ nguyên dữ liệu, bảng, chuyên mục cũ.
create table if not exists public.gdd_audio_programs (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique,
 category text not null default 'radio-dao-su'
   check (category in ('niem-danh','radio-dao-su','thuyet-minh')),
 title text not null check (length(btrim(title)) between 1 and 240),
 summary text, body text, cover_url text, audio_url text not null,
 episode_number integer check (episode_number is null or episode_number > 0),
 published_date date,
 duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
 published boolean not null default false,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists gdd_audio_public_listing_idx
 on public.gdd_audio_programs(category,published,published_at desc,created_at desc);
alter table public.gdd_audio_programs enable row level security;
grant select on public.gdd_audio_programs to anon;
grant select,insert,update,delete on public.gdd_audio_programs to authenticated;
drop policy if exists "audio public read published" on public.gdd_audio_programs;
create policy "audio public read published" on public.gdd_audio_programs
 for select to anon using(published=true);
drop policy if exists "audio admin read" on public.gdd_audio_programs;
create policy "audio admin read" on public.gdd_audio_programs
 for select to authenticated using(published=true or (select public.is_site_admin()));
drop policy if exists "audio admin insert" on public.gdd_audio_programs;
create policy "audio admin insert" on public.gdd_audio_programs
 for insert to authenticated with check ((select public.is_site_admin()));
drop policy if exists "audio admin update" on public.gdd_audio_programs;
create policy "audio admin update" on public.gdd_audio_programs
 for update to authenticated using ((select public.is_site_admin()))
 with check ((select public.is_site_admin()));
drop policy if exists "audio admin delete" on public.gdd_audio_programs;
create policy "audio admin delete" on public.gdd_audio_programs
 for delete to authenticated using ((select public.is_site_admin()));
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
 values ('dao-su-audio','dao-su-audio',true,47185920,array['audio/mpeg'])
 on conflict (id) do nothing;
drop policy if exists "dao su audio admin insert" on storage.objects;
create policy "dao su audio admin insert" on storage.objects
 for insert to authenticated with check (
  bucket_id='dao-su-audio' and (select public.is_site_admin())
  and name ~ '^radio/[0-9]+-[a-z0-9]+[.]mp3$'
 );
insert into public.gdd_audio_programs
 (slug,category,title,summary,body,audio_url,published_date,published,published_at)
values(
 'niem-danh-dieu-tri-kim-mau','niem-danh','Niệm Danh Diêu Trì Kim Mẫu',
 'Bản niệm danh hiệu Đức Phật Mẫu – Âm thanh Đại Đạo.',
 'Bản thu niệm danh hiệu Đức Phật Mẫu được lưu trong kho tư liệu Âm Thanh Đại Đạo.',
 'https://realmetayninh7649-cmd.github.io/dau-xua-cua-dao/audio/niem-danh-dieu-tri-kim-mau.mp3',
 date '2026-11-08',true,now()
) on conflict (slug) do nothing;
