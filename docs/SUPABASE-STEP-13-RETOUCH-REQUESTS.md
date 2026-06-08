# Step 13 — Real retouch requests

This step connects the **Request edit / Solicitar retoque** button in `gallery-view.html` to Supabase.

## What it does

- Client opens a real gallery.
- Client opens a photo.
- Client clicks **Request edit / Solicitar retoque**.
- A message is saved in `retouch_requests`.
- Admin panel → **Retoques / Requests** loads real requests from Supabase.
- Admin can mark each request as:
  - New / Nuevo
  - In progress / En proceso
  - Done / Completado

## Upload to GitHub

Upload / replace:

- `admin-panel.html`
- `gallery-view.html`
- `js/gallery-view.js`
- `js/admin-retouch.js`
- `supabase/dev-policies-step13-retouch-requests.sql`
- `docs/SUPABASE-STEP-13-RETOUCH-REQUESTS.md`

## Run SQL

In Supabase SQL Editor, run:

`supabase/dev-policies-step13-retouch-requests.sql`

## Test

1. Log in as a client.
2. Open a gallery.
3. Open a photo.
4. Click **Solicitar retoque**.
5. Write a request.
6. Go to Supabase → Table Editor → `retouch_requests`.
7. Confirm the row exists.
8. Go to Admin Panel → Retoques.
9. Confirm the request appears.
10. Mark it as **En proceso** and **Completar**.
