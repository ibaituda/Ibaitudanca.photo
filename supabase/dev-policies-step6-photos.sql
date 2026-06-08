-- STEP 6: Gallery photo upload policies
-- Run this in Supabase SQL Editor.
-- Development policies: permissive while testing the custom admin panel.

-- Ensure the image bucket accepts larger sports files during development.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images',
  'portfolio-images',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Photos table access for the current browser-based admin demo.
drop policy if exists "dev_select_photos" on photos;
drop policy if exists "dev_insert_photos" on photos;
drop policy if exists "dev_update_photos" on photos;
drop policy if exists "dev_delete_photos" on photos;

create policy "dev_select_photos"
on photos for select
using (true);

create policy "dev_insert_photos"
on photos for insert
with check (true);

create policy "dev_update_photos"
on photos for update
using (true)
with check (true);

create policy "dev_delete_photos"
on photos for delete
using (true);
