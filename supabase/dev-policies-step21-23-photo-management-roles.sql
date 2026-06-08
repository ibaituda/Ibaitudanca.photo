-- STEP 21-23: Photo management, gallery polish and safer admin roles.
-- Safe to run more than once.

alter table photos add column if not exists hidden boolean default false;
alter table photos add column if not exists is_cover boolean default false;
alter table photos add column if not exists retouched_url text;
alter table photos add column if not exists caption_es text;
alter table photos add column if not exists caption_en text;
alter table photos add column if not exists updated_at timestamptz default now();

alter table admin_users add column if not exists role text default 'editor';
alter table admin_users add column if not exists active boolean default true;
alter table admin_users add column if not exists profile_image_url text;
alter table admin_users add column if not exists updated_at timestamptz default now();

update admin_users set role = 'owner', active = true where username = 'ibai-admin';

alter table photos enable row level security;
alter table galleries enable row level security;
alter table admin_users enable row level security;
alter table download_logs enable row level security;

drop policy if exists "dev_select_photos_step21" on photos;
drop policy if exists "dev_insert_photos_step21" on photos;
drop policy if exists "dev_update_photos_step21" on photos;
drop policy if exists "dev_delete_photos_step21" on photos;
create policy "dev_select_photos_step21" on photos for select using (true);
create policy "dev_insert_photos_step21" on photos for insert with check (true);
create policy "dev_update_photos_step21" on photos for update using (true) with check (true);
create policy "dev_delete_photos_step21" on photos for delete using (true);

drop policy if exists "dev_select_admin_users_step23" on admin_users;
drop policy if exists "dev_insert_admin_users_step23" on admin_users;
drop policy if exists "dev_update_admin_users_step23" on admin_users;
create policy "dev_select_admin_users_step23" on admin_users for select using (true);
create policy "dev_insert_admin_users_step23" on admin_users for insert with check (true);
create policy "dev_update_admin_users_step23" on admin_users for update using (true) with check (true);

drop policy if exists "dev_insert_download_logs_step23" on download_logs;
drop policy if exists "dev_select_download_logs_step23" on download_logs;
create policy "dev_insert_download_logs_step23" on download_logs for insert with check (true);
create policy "dev_select_download_logs_step23" on download_logs for select using (true);

-- Storage policies for the public portfolio bucket.
drop policy if exists "dev_storage_select_portfolio_step21" on storage.objects;
drop policy if exists "dev_storage_insert_portfolio_step21" on storage.objects;
drop policy if exists "dev_storage_update_portfolio_step21" on storage.objects;
create policy "dev_storage_select_portfolio_step21" on storage.objects for select using (bucket_id = 'portfolio-images');
create policy "dev_storage_insert_portfolio_step21" on storage.objects for insert with check (bucket_id = 'portfolio-images');
create policy "dev_storage_update_portfolio_step21" on storage.objects for update using (bucket_id = 'portfolio-images') with check (bucket_id = 'portfolio-images');
