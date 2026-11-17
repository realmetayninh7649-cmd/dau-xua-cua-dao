-- DK01.4: add private admin-only index of derivative viewing state.
-- Public reader consults Cloudflare Worker metadata, never Supabase admin table.
-- Existing archive records and Supabase public image URLs remain unchanged.
alter table public.gdd_r2_assets
  add column if not exists view_page_count integer not null default 0,
  add column if not exists view_source text,
  add column if not exists public_view boolean not null default false,
  add column if not exists allow_download boolean not null default false,
  add column if not exists view_updated_at timestamptz;
alter table public.gdd_r2_assets
  add constraint gdd_r2_view_page_range check (view_page_count between 0 and 120),
  add constraint gdd_r2_view_source_type check
    (view_source is null or view_source in ('image','pdf','docx_text'));
-- RLS policies from DK01.3 are unchanged: no anonymous read, no DELETE.
