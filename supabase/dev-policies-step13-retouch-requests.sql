-- STEP 13: Real retouch requests
-- Temporary development policies so the current browser-based prototype can
-- create and manage client retouch requests.

alter table retouch_requests enable row level security;

-- Retouch requests
DROP POLICY IF EXISTS dev_select_retouch_requests_step13 ON retouch_requests;
DROP POLICY IF EXISTS dev_insert_retouch_requests_step13 ON retouch_requests;
DROP POLICY IF EXISTS dev_update_retouch_requests_step13 ON retouch_requests;

CREATE POLICY dev_select_retouch_requests_step13
ON retouch_requests FOR SELECT
USING (true);

CREATE POLICY dev_insert_retouch_requests_step13
ON retouch_requests FOR INSERT
WITH CHECK (true);

CREATE POLICY dev_update_retouch_requests_step13
ON retouch_requests FOR UPDATE
USING (true)
WITH CHECK (true);

-- Supporting reads for the admin request list
DROP POLICY IF EXISTS dev_select_clients_step13 ON clients;
DROP POLICY IF EXISTS dev_select_galleries_step13 ON galleries;
DROP POLICY IF EXISTS dev_select_photos_step13 ON photos;

CREATE POLICY dev_select_clients_step13
ON clients FOR SELECT
USING (true);

CREATE POLICY dev_select_galleries_step13
ON galleries FOR SELECT
USING (true);

CREATE POLICY dev_select_photos_step13
ON photos FOR SELECT
USING (true);
