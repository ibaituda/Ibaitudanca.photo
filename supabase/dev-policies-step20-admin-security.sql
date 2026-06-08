-- Step 20 - Admin ownership and role hardening
-- Run this once in Supabase SQL Editor.

alter table admin_users add column if not exists updated_at timestamptz default now();
alter table admin_users add column if not exists profile_image_url text;
alter table admin_users add column if not exists role text default 'editor';
alter table admin_users add column if not exists active boolean default true;

-- Make Ibai's account the protected owner account.
-- If your owner username is different, edit this line before running.
update admin_users
set role = 'owner', active = true, updated_at = now()
where username = 'ibai-admin';

-- Optional safety check: show current admins after update.
select id, username, name, role, active from admin_users order by created_at desc;
