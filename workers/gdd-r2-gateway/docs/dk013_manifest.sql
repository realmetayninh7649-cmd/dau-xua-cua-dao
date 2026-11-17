-- GDDĐ DK01.3 — Chỉ mục QUẢN TRỊ cho nguyên mẫu Cloudflare R2.
-- Không đổi hoặc xóa dữ liệu có sẵn. Không chứa URL hay khoá bí mật R2.
create table if not exists public.gdd_r2_assets (
  asset_id uuid primary key,
  owner_id uuid not null,
  record_kind text check (record_kind is null or record_kind in ('people','posts','media','videos','obituaries','documents')),
  record_id uuid,
  role text not null default 'vault' check (role in ('primary','album','vault')),
  original_name text not null check (char_length(original_name) between 1 and 160),
  original_bytes bigint not null check (original_bytes > 0),
  media_kind text not null check (media_kind in ('image','document')),
  preview_ready boolean not null default false,
  download_ready boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists gdd_r2_assets_parent_idx on public.gdd_r2_assets(record_kind,record_id);
create index if not exists gdd_r2_assets_created_idx on public.gdd_r2_assets(created_at desc);
alter table public.gdd_r2_assets enable row level security;
revoke all on table public.gdd_r2_assets from public, anon, authenticated;
grant select, insert, update on table public.gdd_r2_assets to authenticated;
create policy gdd_r2_archive_read_admin on public.gdd_r2_assets
  for select to authenticated using ((select public.is_site_admin()));
create policy gdd_r2_archive_insert_admin on public.gdd_r2_assets
  for insert to authenticated
  with check ((select public.is_site_admin()) and owner_id=(select auth.uid()));
create policy gdd_r2_archive_update_admin on public.gdd_r2_assets
  for update to authenticated
  using ((select public.is_site_admin()))
  with check ((select public.is_site_admin()));
-- No delete policy or anonymous grant: original archive index is protected.
