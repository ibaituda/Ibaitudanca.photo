# Step 7 — Real Preview, Real Client Dashboard and Real Gallery

This step connects the public client pages to Supabase data.

## Upload to GitHub
Replace/add these files:

- `admin-panel.html`
- `client-dashboard.html`
- `gallery-view.html`
- `js/admin-supabase.js`
- `js/client-dashboard.js`
- `js/gallery-view.js`
- `docs/SUPABASE-STEP-7-REAL-PREVIEW.md`

Keep your existing `js/supabase-config.js` with your real Supabase URL and publishable key.

## What should work

### Client preview
From Admin Panel > Clients > Edit client > Preview:

- opens `client-dashboard.html?client=<username or id>`
- loads client hero, profile image, texts, license and assigned galleries from Supabase.

### Gallery preview
From Admin Panel > Galleries > Edit gallery > Preview:

- opens `gallery-view.html?gallery=<gallery_id>`
- loads gallery data and real uploaded photos from Supabase.

## No new SQL required
If Step 6 is already working and photos appear in Storage + `photos`, no extra SQL is required.
