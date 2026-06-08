-- STEP 14 + 15 + 16
-- Real download tracking, real calendar, persistent settings.

create table if not exists app_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);

alter table app_settings enable row level security;

-- Development policies while the custom HTML app is being connected.
-- These keep the current low-cost setup working with the publishable key.

drop policy if exists "dev_read_download_logs" on download_logs;
drop policy if exists "dev_insert_download_logs" on download_logs;
drop policy if exists "dev_update_download_logs" on download_logs;
drop policy if exists "dev_delete_download_logs" on download_logs;
create policy "dev_read_download_logs" on download_logs for select using (true);
create policy "dev_insert_download_logs" on download_logs for insert with check (true);
create policy "dev_update_download_logs" on download_logs for update using (true) with check (true);
create policy "dev_delete_download_logs" on download_logs for delete using (true);

drop policy if exists "dev_read_calendar_events" on calendar_events;
drop policy if exists "dev_insert_calendar_events" on calendar_events;
drop policy if exists "dev_update_calendar_events" on calendar_events;
drop policy if exists "dev_delete_calendar_events" on calendar_events;
create policy "dev_read_calendar_events" on calendar_events for select using (true);
create policy "dev_insert_calendar_events" on calendar_events for insert with check (true);
create policy "dev_update_calendar_events" on calendar_events for update using (true) with check (true);
create policy "dev_delete_calendar_events" on calendar_events for delete using (true);

drop policy if exists "dev_read_app_settings" on app_settings;
drop policy if exists "dev_insert_app_settings" on app_settings;
drop policy if exists "dev_update_app_settings" on app_settings;
drop policy if exists "dev_delete_app_settings" on app_settings;
create policy "dev_read_app_settings" on app_settings for select using (true);
create policy "dev_insert_app_settings" on app_settings for insert with check (true);
create policy "dev_update_app_settings" on app_settings for update using (true) with check (true);
create policy "dev_delete_app_settings" on app_settings for delete using (true);

insert into app_settings (key, value) values
  ('download_sizes', '6000x4000, 3000x2000, 1600x1067'),
  ('contact_email', 'ibaituda1999@gmail.com'),
  ('license_en', 'Images are licensed only to the assigned client account. Third-party commercial use requires written permission.'),
  ('license_es', 'Las imágenes están licenciadas únicamente para la cuenta de cliente asignada. El uso comercial por terceros requiere autorización escrita.')
on conflict (key) do nothing;
