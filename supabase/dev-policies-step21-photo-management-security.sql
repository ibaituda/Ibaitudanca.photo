-- STEP 21: Photo management + download tracking helper policies
-- Safe to run multiple times in development.

alter table photos enable row level security;
alter table galleries enable row level security;
alter table download_logs enable row level security;

create policy if not exists "dev_select_photos_step21" on photos for select using (true);
create policy if not exists "dev_insert_photos_step21" on photos for insert with check (true);
create policy if not exists "dev_update_photos_step21" on photos for update using (true) with check (true);
create policy if not exists "dev_delete_photos_step21" on photos for delete using (true);

create policy if not exists "dev_update_galleries_step21" on galleries for update using (true) with check (true);

create policy if not exists "dev_select_download_logs_step21" on download_logs for select using (true);
create policy if not exists "dev_insert_download_logs_step21" on download_logs for insert with check (true);
