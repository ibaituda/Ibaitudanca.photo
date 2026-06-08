# Step 6 — Gallery edit + photo upload

This step connects gallery editing and photo upload to Supabase.

## Upload to GitHub
Replace these files in your repository:

- `admin-panel.html`
- `js/admin-supabase.js`
- `supabase/dev-policies-step6-photos.sql`
- `docs/SUPABASE-STEP-6-GALLERY-PHOTO-UPLOAD.md`

Do **not** overwrite `js/supabase-config.js` if it already contains your real Supabase URL and publishable key.

## Run SQL
In Supabase:

1. SQL Editor
2. New Query
3. Paste the contents of `supabase/dev-policies-step6-photos.sql`
4. Run

## Test
1. Open `admin-panel.html`
2. Go to Galleries
3. Click `Edit gallery` on an existing gallery
4. Change text/status/cover/assigned clients and save
5. Click `Upload photos`
6. Choose a gallery and select a few images
7. Confirm records appear in:
   - `photos`
   - `galleries`

## Notes
At this stage, the uploaded file is used for Original/Large/Preview URLs. Later we can add automatic resizing.
