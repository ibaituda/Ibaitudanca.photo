# Step 4 — Image uploads for clients and galleries

This step connects real image selection/upload to Supabase Storage.

## What it adds

- Choose a client hero image from your computer.
- Choose a client profile image from your computer.
- Choose a gallery cover image from your computer.
- Preview the image visually before saving.
- Adjust cover/hero position with X/Y sliders.
- Upload images to Supabase Storage bucket `portfolio-images`.
- Save public image URLs in Supabase:
  - `clients.profile_image_url`
  - `clients.hero_image_url`
  - `galleries.cover_image_url`

## Files to upload to GitHub

Upload/replace:

- `admin-panel.html`
- `js/admin-supabase.js`
- `supabase/dev-policies-step4-storage.sql`
- `docs/SUPABASE-STEP-4-IMAGE-UPLOADS.md`

Do not overwrite `js/supabase-config.js` if it already has your real Supabase URL and publishable key.

## Supabase SQL

Run:

`supabase/dev-policies-step4-storage.sql`

This creates a public Storage bucket called `portfolio-images` and adds permissive development policies.

## Test

1. Go to Admin Panel → Clients → Create client.
2. Select a profile image and hero image.
3. Create the client.
4. Confirm the image appears in the client list.
5. In Supabase → Storage → portfolio-images, confirm files were uploaded.
6. Go to Galleries → Create gallery.
7. Select a cover image.
8. Create the gallery and confirm its cover appears in the gallery list.

## Important

This is still development mode. Later we should secure uploads so only real authenticated admins can upload files.
