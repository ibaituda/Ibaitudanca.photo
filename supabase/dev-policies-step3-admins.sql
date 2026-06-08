-- STEP 3: Administrators + gallery client selector support
-- Development policies for the Ibai Tudanca Portfolio admin workflow.
-- Run this in Supabase SQL Editor.
-- IMPORTANT: This is permissive for development/testing. Later we will replace it with stricter production policies.

create extension if not exists "pgcrypto";

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  name text not null,
  role text default 'editor' check (role in ('owner', 'editor')),
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

-- Create a first administrator only if it does not already exist.
-- Default login after running this SQL:
-- Username: ibai-admin
-- Password: Ibai2026!
-- You can change this password later from the admin panel.
insert into admin_users (username, password_hash, name, role, active)
select 'ibai-admin', encode(digest('Ibai2026!', 'sha256'), 'hex'), 'Ibai Tudanca', 'owner', true
where not exists (
  select 1 from admin_users where username = 'ibai-admin'
);

-- Keep development policies for connected admin features.
drop policy if exists "dev_select_clients" on clients;
drop policy if exists "dev_insert_clients" on clients;
drop policy if exists "dev_update_clients" on clients;
create policy "dev_select_clients" on clients for select using (true);
create policy "dev_insert_clients" on clients for insert with check (true);
create policy "dev_update_clients" on clients for update using (true) with check (true);

drop policy if exists "dev_select_galleries" on galleries;
drop policy if exists "dev_insert_galleries" on galleries;
drop policy if exists "dev_update_galleries" on galleries;
create policy "dev_select_galleries" on galleries for select using (true);
create policy "dev_insert_galleries" on galleries for insert with check (true);
create policy "dev_update_galleries" on galleries for update using (true) with check (true);

drop policy if exists "dev_select_gallery_clients" on gallery_clients;
drop policy if exists "dev_insert_gallery_clients" on gallery_clients;
drop policy if exists "dev_update_gallery_clients" on gallery_clients;
create policy "dev_select_gallery_clients" on gallery_clients for select using (true);
create policy "dev_insert_gallery_clients" on gallery_clients for insert with check (true);
create policy "dev_update_gallery_clients" on gallery_clients for update using (true) with check (true);
