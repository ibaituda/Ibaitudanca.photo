-- STEP 17-19: Publication, activity overview and basic client privacy policies.
-- Safe to run multiple times.

alter table clients add column if not exists publish_status publish_status default 'draft';
alter table galleries add column if not exists publish_status publish_status default 'draft';

-- Optional activity table for future use. Current overview derives activity from existing tables.
create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_type text,
  actor_id uuid,
  activity_type text not null,
  title text,
  description text,
  related_client_id uuid references clients(id) on delete set null,
  related_gallery_id uuid references galleries(id) on delete set null,
  created_at timestamptz default now()
);

alter table activity_log enable row level security;
drop policy if exists "dev activity select" on activity_log;
drop policy if exists "dev activity insert" on activity_log;
create policy "dev activity select" on activity_log for select using (true);
create policy "dev activity insert" on activity_log for insert with check (true);

-- Development policies used while the custom auth layer is still being built.
-- The JavaScript guard prevents normal clients from viewing unassigned/draft content in the UI.
drop policy if exists "dev clients update publish" on clients;
drop policy if exists "dev galleries update publish" on galleries;
create policy "dev clients update publish" on clients for update using (true) with check (true);
create policy "dev galleries update publish" on galleries for update using (true) with check (true);
