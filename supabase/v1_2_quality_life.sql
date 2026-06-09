
-- V1.2 Quality of Life foundation
-- Run once in Supabase SQL Editor.

-- Safe schema upgrades for cleanup, ZIP/download tracking and future automation.
alter table if exists clients add column if not exists deleted_at timestamptz;
alter table if exists clients add column if not exists updated_at timestamptz default now();

alter table if exists galleries add column if not exists deleted_at timestamptz;
alter table if exists galleries add column if not exists updated_at timestamptz default now();

alter table if exists photos add column if not exists deleted_at timestamptz;
alter table if exists photos add column if not exists updated_at timestamptz default now();
alter table if exists photos add column if not exists retouched_url text;
alter table if exists photos add column if not exists is_cover boolean default false;
alter table if exists photos add column if not exists hidden boolean default false;
alter table if exists photos add column if not exists storage_path text;
alter table if exists photos alter column sort_order type bigint;

alter table if exists calendar_events add column if not exists deleted_at timestamptz;
alter table if exists calendar_events add column if not exists updated_at timestamptz default now();

create table if not exists email_queue (
  id uuid primary key default gen_random_uuid(),
  recipient text,
  subject text,
  body text,
  status text default 'queued',
  related_client_id uuid,
  related_gallery_id uuid,
  created_at timestamptz default now(),
  sent_at timestamptz
);

create table if not exists api_ingest_tokens (
  id uuid primary key default gen_random_uuid(),
  token_label text not null,
  token_hash text,
  active boolean default true,
  created_at timestamptz default now(),
  last_used_at timestamptz
);

create table if not exists storage_cleanup_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text,
  entity_id uuid,
  storage_paths text[],
  status text default 'requested',
  message text,
  created_at timestamptz default now()
);

alter table email_queue enable row level security;
alter table api_ingest_tokens enable row level security;
alter table storage_cleanup_log enable row level security;

drop policy if exists "dev_email_queue_all_v12" on email_queue;
create policy "dev_email_queue_all_v12" on email_queue for all using (true) with check (true);

drop policy if exists "dev_api_ingest_tokens_all_v12" on api_ingest_tokens;
create policy "dev_api_ingest_tokens_all_v12" on api_ingest_tokens for all using (true) with check (true);

drop policy if exists "dev_storage_cleanup_all_v12" on storage_cleanup_log;
create policy "dev_storage_cleanup_all_v12" on storage_cleanup_log for all using (true) with check (true);

-- Make sure current frontend can perform cleanup during beta.
drop policy if exists "dev_delete_clients_v12" on clients;
create policy "dev_delete_clients_v12" on clients for delete using (true);
drop policy if exists "dev_update_clients_v12" on clients;
create policy "dev_update_clients_v12" on clients for update using (true) with check (true);

drop policy if exists "dev_delete_galleries_v12" on galleries;
create policy "dev_delete_galleries_v12" on galleries for delete using (true);
drop policy if exists "dev_update_galleries_v12" on galleries;
create policy "dev_update_galleries_v12" on galleries for update using (true) with check (true);

drop policy if exists "dev_delete_photos_v12" on photos;
create policy "dev_delete_photos_v12" on photos for delete using (true);
drop policy if exists "dev_update_photos_v12" on photos;
create policy "dev_update_photos_v12" on photos for update using (true) with check (true);

drop policy if exists "dev_download_logs_all_v12" on download_logs;
create policy "dev_download_logs_all_v12" on download_logs for all using (true) with check (true);

drop policy if exists "dev_favourites_all_v12" on favourites;
create policy "dev_favourites_all_v12" on favourites for all using (true) with check (true);

drop policy if exists "dev_selections_all_v12" on selections;
create policy "dev_selections_all_v12" on selections for all using (true) with check (true);

drop policy if exists "dev_retouch_requests_all_v12" on retouch_requests;
create policy "dev_retouch_requests_all_v12" on retouch_requests for all using (true) with check (true);

drop policy if exists "dev_gallery_clients_all_v12" on gallery_clients;
create policy "dev_gallery_clients_all_v12" on gallery_clients for all using (true) with check (true);
