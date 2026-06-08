-- STEP 4: Supabase Storage for client and gallery cover images
-- Run this in Supabase SQL Editor.
-- Development policies: permissive so the current custom admin panel can upload/read images.
-- Later, production security should be tightened around real authenticated admins.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-images',
  'portfolio-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dev_read_portfolio_images" on storage.objects;
drop policy if exists "dev_upload_portfolio_images" on storage.objects;
drop policy if exists "dev_update_portfolio_images" on storage.objects;
drop policy if exists "dev_delete_portfolio_images" on storage.objects;

create policy "dev_read_portfolio_images"
on storage.objects for select
using (bucket_id = 'portfolio-images');

create policy "dev_upload_portfolio_images"
on storage.objects for insert
with check (bucket_id = 'portfolio-images');

create policy "dev_update_portfolio_images"
on storage.objects for update
using (bucket_id = 'portfolio-images')
with check (bucket_id = 'portfolio-images');

create policy "dev_delete_portfolio_images"
on storage.objects for delete
using (bucket_id = 'portfolio-images');
