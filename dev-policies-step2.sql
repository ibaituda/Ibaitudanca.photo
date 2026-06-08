-- TEMPORARY DEVELOPMENT POLICIES - STEP 2
-- Use only while testing the admin panel without real authentication.
-- Later we will replace these permissive policies with secure admin/client rules.

drop policy if exists "dev_select_galleries" on galleries;
drop policy if exists "dev_insert_galleries" on galleries;
drop policy if exists "dev_update_galleries" on galleries;
drop policy if exists "dev_delete_galleries" on galleries;

create policy "dev_select_galleries"
on galleries for select
using (true);

create policy "dev_insert_galleries"
on galleries for insert
with check (true);

create policy "dev_update_galleries"
on galleries for update
using (true)
with check (true);

create policy "dev_delete_galleries"
on galleries for delete
using (true);

drop policy if exists "dev_select_gallery_clients" on gallery_clients;
drop policy if exists "dev_insert_gallery_clients" on gallery_clients;
drop policy if exists "dev_update_gallery_clients" on gallery_clients;
drop policy if exists "dev_delete_gallery_clients" on gallery_clients;

create policy "dev_select_gallery_clients"
on gallery_clients for select
using (true);

create policy "dev_insert_gallery_clients"
on gallery_clients for insert
with check (true);

create policy "dev_update_gallery_clients"
on gallery_clients for update
using (true)
with check (true);

create policy "dev_delete_gallery_clients"
on gallery_clients for delete
using (true);

-- Optional read policies for supporting gallery previews later.
drop policy if exists "dev_select_photos" on photos;
create policy "dev_select_photos"
on photos for select
using (true);
