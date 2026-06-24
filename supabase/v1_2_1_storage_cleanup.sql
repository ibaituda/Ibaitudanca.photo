-- V1.2.1 Storage Cleanup
-- Ensures deleted photos/clients/galleries can move to trash and be permanently removed from DB + Storage.

alter table clients add column if not exists deleted_at timestamptz;
alter table clients add column if not exists updated_at timestamptz default now();

alter table galleries add column if not exists deleted_at timestamptz;
alter table galleries add column if not exists updated_at timestamptz default now();

alter table photos add column if not exists deleted_at timestamptz;
alter table photos add column if not exists updated_at timestamptz default now();
alter table photos add column if not exists retouched_url text;
alter table photos add column if not exists is_cover boolean default false;

alter table calendar_events add column if not exists deleted_at timestamptz;
alter table calendar_events add column if not exists updated_at timestamptz default now();

alter table app_tasks add column if not exists deleted_at timestamptz;
alter table app_tasks add column if not exists updated_at timestamptz default now();

-- Table policies for the current beta/dev stage.
drop policy if exists "v121_clients_all" on clients;
create policy "v121_clients_all" on clients for all using (true) with check (true);

drop policy if exists "v121_galleries_all" on galleries;
create policy "v121_galleries_all" on galleries for all using (true) with check (true);

drop policy if exists "v121_gallery_clients_all" on gallery_clients;
create policy "v121_gallery_clients_all" on gallery_clients for all using (true) with check (true);

drop policy if exists "v121_photos_all" on photos;
create policy "v121_photos_all" on photos for all using (true) with check (true);

drop policy if exists "v121_favourites_all" on favourites;
create policy "v121_favourites_all" on favourites for all using (true) with check (true);

drop policy if exists "v121_selections_all" on selections;
create policy "v121_selections_all" on selections for all using (true) with check (true);

drop policy if exists "v121_retouch_requests_all" on retouch_requests;
create policy "v121_retouch_requests_all" on retouch_requests for all using (true) with check (true);

drop policy if exists "v121_download_logs_all" on download_logs;
create policy "v121_download_logs_all" on download_logs for all using (true) with check (true);

drop policy if exists "v121_calendar_events_all" on calendar_events;
create policy "v121_calendar_events_all" on calendar_events for all using (true) with check (true);

drop policy if exists "v121_app_tasks_all" on app_tasks;
create policy "v121_app_tasks_all" on app_tasks for all using (true) with check (true);

-- Storage policies for portfolio-images bucket.
drop policy if exists "v121_storage_select_portfolio" on storage.objects;
create policy "v121_storage_select_portfolio" on storage.objects for select using (bucket_id = 'portfolio-images');

drop policy if exists "v121_storage_insert_portfolio" on storage.objects;
create policy "v121_storage_insert_portfolio" on storage.objects for insert with check (bucket_id = 'portfolio-images');

drop policy if exists "v121_storage_update_portfolio" on storage.objects;
create policy "v121_storage_update_portfolio" on storage.objects for update using (bucket_id = 'portfolio-images') with check (bucket_id = 'portfolio-images');

drop policy if exists "v121_storage_delete_portfolio" on storage.objects;
create policy "v121_storage_delete_portfolio" on storage.objects for delete using (bucket_id = 'portfolio-images');
