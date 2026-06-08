-- STEP 10: Administrator profile editing + admin welcome avatar
-- Run this in Supabase SQL Editor after uploading the Step 10 files.

alter table admin_users
add column if not exists profile_image_url text;

-- Keep development policies available for admin testing.
alter table admin_users enable row level security;

drop policy if exists "dev_select_admin_users" on admin_users;
drop policy if exists "dev_insert_admin_users" on admin_users;
drop policy if exists "dev_update_admin_users" on admin_users;

create policy "dev_select_admin_users"
on admin_users for select
using (true);

create policy "dev_insert_admin_users"
on admin_users for insert
with check (true);

create policy "dev_update_admin_users"
on admin_users for update
using (true)
with check (true);
