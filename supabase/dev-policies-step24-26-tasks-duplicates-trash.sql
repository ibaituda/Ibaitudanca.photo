-- STEP 24-26: tasks, duplicate helpers, trash recovery, real activity and beta hardening
-- Safe to run multiple times in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists app_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  due_date date,
  client_id uuid references clients(id) on delete set null,
  gallery_id uuid references galleries(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  type text,
  title text,
  details text,
  actor_username text,
  client_id uuid references clients(id) on delete set null,
  gallery_id uuid references galleries(id) on delete set null,
  photo_id uuid references photos(id) on delete set null,
  created_at timestamptz default now()
);

alter table clients add column if not exists deleted_at timestamptz;
alter table galleries add column if not exists deleted_at timestamptz;
alter table photos add column if not exists deleted_at timestamptz;
alter table photos add column if not exists is_cover boolean default false;
alter table photos add column if not exists is_hidden boolean default false;
alter table photos add column if not exists retouched_url text;
alter table photos add column if not exists notes text;

alter table app_tasks enable row level security;
alter table activity_log enable row level security;

drop policy if exists "dev_select_app_tasks_step24" on app_tasks;
drop policy if exists "dev_insert_app_tasks_step24" on app_tasks;
drop policy if exists "dev_update_app_tasks_step24" on app_tasks;
drop policy if exists "dev_delete_app_tasks_step24" on app_tasks;
create policy "dev_select_app_tasks_step24" on app_tasks for select using (true);
create policy "dev_insert_app_tasks_step24" on app_tasks for insert with check (true);
create policy "dev_update_app_tasks_step24" on app_tasks for update using (true) with check (true);
create policy "dev_delete_app_tasks_step24" on app_tasks for delete using (true);

drop policy if exists "dev_select_activity_log_step25" on activity_log;
drop policy if exists "dev_insert_activity_log_step25" on activity_log;
create policy "dev_select_activity_log_step25" on activity_log for select using (true);
create policy "dev_insert_activity_log_step25" on activity_log for insert with check (true);

-- Ensure existing development policies permit the beta UI to read/update the core tables.
drop policy if exists "dev_update_clients_step24" on clients;
drop policy if exists "dev_update_galleries_step24" on galleries;
drop policy if exists "dev_update_photos_step24" on photos;
create policy "dev_update_clients_step24" on clients for update using (true) with check (true);
create policy "dev_update_galleries_step24" on galleries for update using (true) with check (true);
create policy "dev_update_photos_step24" on photos for update using (true) with check (true);
