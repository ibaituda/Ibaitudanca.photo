-- V1.2.3 Communication center, advanced download analytics and watermark settings.
-- Run once in Supabase SQL Editor.

create table if not exists email_outbox (
  id uuid primary key default gen_random_uuid(),
  email_type text default 'manual',
  recipient text,
  subject text,
  body text,
  status text default 'pending_approval',
  related_client_id uuid,
  related_gallery_id uuid,
  error_message text,
  created_at timestamptz default now(),
  sent_at timestamptz,
  cancelled_at timestamptz
);

alter table if exists clients add column if not exists email text;
alter table if exists email_outbox add column if not exists email_type text default 'manual';
alter table if exists email_outbox add column if not exists recipient text;
alter table if exists email_outbox add column if not exists subject text;
alter table if exists email_outbox add column if not exists body text;
alter table if exists email_outbox add column if not exists status text default 'pending_approval';
alter table if exists email_outbox add column if not exists related_client_id uuid;
alter table if exists email_outbox add column if not exists related_gallery_id uuid;
alter table if exists email_outbox add column if not exists error_message text;
alter table if exists email_outbox add column if not exists created_at timestamptz default now();
alter table if exists email_outbox add column if not exists sent_at timestamptz;
alter table if exists email_outbox add column if not exists cancelled_at timestamptz;

create table if not exists app_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

alter table email_outbox enable row level security;
alter table app_settings enable row level security;

drop policy if exists "v123_email_outbox_all" on email_outbox;
create policy "v123_email_outbox_all" on email_outbox for all using (true) with check (true);

drop policy if exists "v123_app_settings_all" on app_settings;
create policy "v123_app_settings_all" on app_settings for all using (true) with check (true);

insert into app_settings (key,value) values
  ('watermark_enabled','false'),
  ('watermark_text','© Ibai Tudanca Photography'),
  ('watermark_position','bottom-right'),
  ('watermark_opacity','0.25'),
  ('watermark_size','26'),
  ('email_webhook_url','')
on conflict (key) do nothing;

-- Optional analytics views used for checking data directly inside Supabase.
create or replace view download_stats_by_client as
select
  c.id as client_id,
  c.name as client_name,
  count(dl.id) as download_events,
  coalesce(sum(coalesce(dl.photos_count,1)),0) as photos_downloaded,
  max(dl.created_at) as last_download_at
from clients c
left join download_logs dl on dl.client_id = c.id
group by c.id, c.name;

create or replace view download_stats_by_gallery as
select
  g.id as gallery_id,
  coalesce(g.title_es,g.title_en,'Untitled gallery') as gallery_title,
  count(dl.id) as download_events,
  coalesce(sum(coalesce(dl.photos_count,1)),0) as photos_downloaded,
  max(dl.created_at) as last_download_at
from galleries g
left join download_logs dl on dl.gallery_id = g.id
group by g.id, g.title_es, g.title_en;
