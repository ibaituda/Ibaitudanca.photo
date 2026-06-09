-- V1.1 CRITICAL FIX PACK
-- Execute once in Supabase SQL Editor.

alter table clients add column if not exists deleted_at timestamptz;
alter table galleries add column if not exists deleted_at timestamptz;
alter table photos add column if not exists deleted_at timestamptz;
alter table calendar_events add column if not exists deleted_at timestamptz;
alter table calendar_events add column if not exists updated_at timestamptz default now();

-- optional columns used by photo replacement / optimized download flow
alter table photos add column if not exists retouched_url text;
alter table photos add column if not exists updated_at timestamptz default now();

-- Tasks may already exist from previous steps. If not, create them.
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text default 'pending',
  related_type text,
  related_id uuid,
  due_date date,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table tasks enable row level security;

do $$ begin
  drop policy if exists "dev_select_tasks_v11" on tasks;
  drop policy if exists "dev_insert_tasks_v11" on tasks;
  drop policy if exists "dev_update_tasks_v11" on tasks;
  drop policy if exists "dev_delete_tasks_v11" on tasks;
exception when undefined_table then null;
end $$;

create policy "dev_select_tasks_v11" on tasks for select using (true);
create policy "dev_insert_tasks_v11" on tasks for insert with check (true);
create policy "dev_update_tasks_v11" on tasks for update using (true) with check (true);
create policy "dev_delete_tasks_v11" on tasks for delete using (true);

-- Ensure dev policies allow the V1.1 browser app to update/delete records during beta testing.
do $$ begin
  drop policy if exists "dev_update_clients_v11" on clients;
  drop policy if exists "dev_delete_clients_v11" on clients;
  drop policy if exists "dev_update_galleries_v11" on galleries;
  drop policy if exists "dev_delete_galleries_v11" on galleries;
  drop policy if exists "dev_update_photos_v11" on photos;
  drop policy if exists "dev_delete_photos_v11" on photos;
  drop policy if exists "dev_update_calendar_v11" on calendar_events;
  drop policy if exists "dev_delete_calendar_v11" on calendar_events;
end $$;

create policy "dev_update_clients_v11" on clients for update using (true) with check (true);
create policy "dev_delete_clients_v11" on clients for delete using (true);
create policy "dev_update_galleries_v11" on galleries for update using (true) with check (true);
create policy "dev_delete_galleries_v11" on galleries for delete using (true);
create policy "dev_update_photos_v11" on photos for update using (true) with check (true);
create policy "dev_delete_photos_v11" on photos for delete using (true);
create policy "dev_update_calendar_v11" on calendar_events for update using (true) with check (true);
create policy "dev_delete_calendar_v11" on calendar_events for delete using (true);
