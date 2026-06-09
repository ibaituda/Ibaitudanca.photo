-- V1.1.3 stabilization SQL
-- Safe, idempotent support for trash and optimized single-file delivery.
alter table if exists clients add column if not exists deleted_at timestamptz;
alter table if exists galleries add column if not exists deleted_at timestamptz;
alter table if exists photos add column if not exists deleted_at timestamptz;
alter table if exists photos add column if not exists retouched_url text;
alter table if exists photos add column if not exists optimized_url text;
alter table if exists calendar_events add column if not exists deleted_at timestamptz;
alter table if exists app_tasks add column if not exists deleted_at timestamptz;
-- Keep policies compatible with previous dev phase.
drop policy if exists "dev_select_all_v113" on photos;
create policy "dev_select_all_v113" on photos for select using (true);
drop policy if exists "dev_update_all_v113" on photos;
create policy "dev_update_all_v113" on photos for update using (true) with check (true);
drop policy if exists "dev_delete_all_v113" on photos;
create policy "dev_delete_all_v113" on photos for delete using (true);
