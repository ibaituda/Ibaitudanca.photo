-- TEMPORARY DEVELOPMENT POLICIES - STEP 8/9
-- Enables client login, real dashboard access and favourites/selections testing.
-- These policies are intentionally permissive while building the product.
-- Tighten RLS before taking paid client galleries fully live.

alter table clients enable row level security;
alter table galleries enable row level security;
alter table gallery_clients enable row level security;
alter table photos enable row level security;
alter table favourites enable row level security;
alter table selections enable row level security;

-- Clients
DROP POLICY IF EXISTS "dev_select_clients_step8" ON clients;
DROP POLICY IF EXISTS "dev_insert_clients_step8" ON clients;
DROP POLICY IF EXISTS "dev_update_clients_step8" ON clients;
CREATE POLICY "dev_select_clients_step8" ON clients FOR SELECT USING (true);
CREATE POLICY "dev_insert_clients_step8" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_update_clients_step8" ON clients FOR UPDATE USING (true) WITH CHECK (true);

-- Galleries and relations
DROP POLICY IF EXISTS "dev_select_galleries_step8" ON galleries;
DROP POLICY IF EXISTS "dev_insert_galleries_step8" ON galleries;
DROP POLICY IF EXISTS "dev_update_galleries_step8" ON galleries;
CREATE POLICY "dev_select_galleries_step8" ON galleries FOR SELECT USING (true);
CREATE POLICY "dev_insert_galleries_step8" ON galleries FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_update_galleries_step8" ON galleries FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_select_gallery_clients_step8" ON gallery_clients;
DROP POLICY IF EXISTS "dev_insert_gallery_clients_step8" ON gallery_clients;
DROP POLICY IF EXISTS "dev_update_gallery_clients_step8" ON gallery_clients;
DROP POLICY IF EXISTS "dev_delete_gallery_clients_step8" ON gallery_clients;
CREATE POLICY "dev_select_gallery_clients_step8" ON gallery_clients FOR SELECT USING (true);
CREATE POLICY "dev_insert_gallery_clients_step8" ON gallery_clients FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_update_gallery_clients_step8" ON gallery_clients FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "dev_delete_gallery_clients_step8" ON gallery_clients FOR DELETE USING (true);

-- Photos
DROP POLICY IF EXISTS "dev_select_photos_step8" ON photos;
DROP POLICY IF EXISTS "dev_insert_photos_step8" ON photos;
DROP POLICY IF EXISTS "dev_update_photos_step8" ON photos;
DROP POLICY IF EXISTS "dev_delete_photos_step8" ON photos;
CREATE POLICY "dev_select_photos_step8" ON photos FOR SELECT USING (true);
CREATE POLICY "dev_insert_photos_step8" ON photos FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_update_photos_step8" ON photos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "dev_delete_photos_step8" ON photos FOR DELETE USING (true);

-- Favourites
DROP POLICY IF EXISTS "dev_select_favourites_step9" ON favourites;
DROP POLICY IF EXISTS "dev_insert_favourites_step9" ON favourites;
DROP POLICY IF EXISTS "dev_delete_favourites_step9" ON favourites;
CREATE POLICY "dev_select_favourites_step9" ON favourites FOR SELECT USING (true);
CREATE POLICY "dev_insert_favourites_step9" ON favourites FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_delete_favourites_step9" ON favourites FOR DELETE USING (true);

-- Selections
DROP POLICY IF EXISTS "dev_select_selections_step9" ON selections;
DROP POLICY IF EXISTS "dev_insert_selections_step9" ON selections;
DROP POLICY IF EXISTS "dev_delete_selections_step9" ON selections;
CREATE POLICY "dev_select_selections_step9" ON selections FOR SELECT USING (true);
CREATE POLICY "dev_insert_selections_step9" ON selections FOR INSERT WITH CHECK (true);
CREATE POLICY "dev_delete_selections_step9" ON selections FOR DELETE USING (true);
