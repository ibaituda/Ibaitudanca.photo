-- TEMPORARY DEVELOPMENT POLICIES
-- Use only while testing the admin panel connection from the browser.
-- This allows the public browser key to read and create clients.
-- Later we will replace this with proper admin authentication.

drop policy if exists "dev_select_clients" on clients;
drop policy if exists "dev_insert_clients" on clients;
drop policy if exists "dev_update_clients" on clients;

create policy "dev_select_clients"
on clients for select
using (true);

create policy "dev_insert_clients"
on clients for insert
with check (true);

create policy "dev_update_clients"
on clients for update
using (true)
with check (true);
