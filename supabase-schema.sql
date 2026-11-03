-- DẤU XƯA CỬA ĐẠO — cấu trúc dữ liệu + quyền truy cập
-- Dán toàn bộ tệp này trong Supabase > SQL Editor > Run.
-- Sau khi chạy, tạo bucket PUBLIC tên dao-su-images trong Storage.
-- KHÔNG dán mật khẩu hoặc service_role key vào website.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  full_name text not null,
  secular_name text,
  rank text,
  branch text,
  years text,
  birthplace text,
  summary text,
  biography text,
  date_notes text,
  sources text,
  image_url text,
  verified boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text,
  summary text,
  body text,
  sources text,
  person_id uuid references public.people(id) on delete set null,
  cover_url text,
  verified boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  caption text,
  person_id uuid references public.people(id) on delete set null,
  sources text,
  image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_archive_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists people_updated_at on public.people;
create trigger people_updated_at before update on public.people for each row execute function public.set_archive_updated_at();
drop trigger if exists posts_updated_at on public.posts;
create trigger posts_updated_at before update on public.posts for each row execute function public.set_archive_updated_at();
drop trigger if exists media_updated_at on public.media;
create trigger media_updated_at before update on public.media for each row execute function public.set_archive_updated_at();

create index if not exists people_created_idx on public.people(created_at desc);
create index if not exists posts_created_idx on public.posts(created_at desc);
create index if not exists media_created_idx on public.media(created_at desc);
create index if not exists posts_person_idx on public.posts(person_id);
create index if not exists media_person_idx on public.media(person_id);

-- Kiểm tra tư cách quản trị từ bảng không cho người dùng công khai chỉnh sửa.
create or replace function public.is_site_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_site_admin() from public, anon;
grant execute on function public.is_site_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.people enable row level security;
alter table public.posts enable row level security;
alter table public.media enable row level security;

revoke all on table public.admin_users from anon, authenticated;
revoke all on table public.people from anon, authenticated;
revoke all on table public.posts from anon, authenticated;
revoke all on table public.media from anon, authenticated;

grant select on table public.admin_users to authenticated;
grant select on table public.people, public.posts, public.media to anon, authenticated;
grant insert, update, delete on table public.people, public.posts, public.media to authenticated;

drop policy if exists "admin read own status" on public.admin_users;
create policy "admin read own status" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

-- Khách chỉ xem nội dung đã xuất bản.
-- Người quản trị đã đăng nhập xem được cả các bản nháp.
drop policy if exists "public people read" on public.people;
create policy "public people read" on public.people
  for select to anon using (published = true);
drop policy if exists "editor people read" on public.people;
create policy "editor people read" on public.people
  for select to authenticated using (published = true or (select public.is_site_admin()));
drop policy if exists "editor people insert" on public.people;
create policy "editor people insert" on public.people
  for insert to authenticated with check ((select public.is_site_admin()));
drop policy if exists "editor people update" on public.people;
create policy "editor people update" on public.people
  for update to authenticated using ((select public.is_site_admin())) with check ((select public.is_site_admin()));
drop policy if exists "editor people delete" on public.people;
create policy "editor people delete" on public.people
  for delete to authenticated using ((select public.is_site_admin()));

drop policy if exists "public posts read" on public.posts;
create policy "public posts read" on public.posts
  for select to anon using (published = true);
drop policy if exists "editor posts read" on public.posts;
create policy "editor posts read" on public.posts
  for select to authenticated using (published = true or (select public.is_site_admin()));
drop policy if exists "editor posts insert" on public.posts;
create policy "editor posts insert" on public.posts
  for insert to authenticated with check ((select public.is_site_admin()));
drop policy if exists "editor posts update" on public.posts;
create policy "editor posts update" on public.posts
  for update to authenticated using ((select public.is_site_admin())) with check ((select public.is_site_admin()));
drop policy if exists "editor posts delete" on public.posts;
create policy "editor posts delete" on public.posts
  for delete to authenticated using ((select public.is_site_admin()));

drop policy if exists "public media read" on public.media;
create policy "public media read" on public.media
  for select to anon using (published = true);
drop policy if exists "editor media read" on public.media;
create policy "editor media read" on public.media
  for select to authenticated using (published = true or (select public.is_site_admin()));
drop policy if exists "editor media insert" on public.media;
create policy "editor media insert" on public.media
  for insert to authenticated with check ((select public.is_site_admin()));
drop policy if exists "editor media update" on public.media;
create policy "editor media update" on public.media
  for update to authenticated using ((select public.is_site_admin())) with check ((select public.is_site_admin()));
drop policy if exists "editor media delete" on public.media;
create policy "editor media delete" on public.media
  for delete to authenticated using ((select public.is_site_admin()));

-- Tạo bucket 'dao-su-images' bằng Dashboard > Storage > New bucket,
-- bật PUBLIC và giới hạn định dạng JPEG/PNG/WebP, kích thước mỗi ảnh <= 6 MB.
-- Sau đó chạy lại 3 dòng bên dưới nếu đã chạy schema trước khi tạo bucket.
drop policy if exists "archive admin image upload" on storage.objects;
create policy "archive admin image upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'dao-su-images' and (select public.is_site_admin()));

-- CẤP QUYỀN BIÊN TẬP (chỉ chạy sau khi đã tạo tài khoản trong Authentication > Users).
-- Thay UUID thật vào đây rồi chạy riêng trong SQL Editor:
-- insert into public.admin_users(user_id) values ('00000000-0000-0000-0000-000000000000')
-- on conflict (user_id) do nothing;
