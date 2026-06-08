# Step 5 — Client Edit + Preview Fixes

This update fixes the client management flow:

- Existing clients can now be edited with real Supabase data.
- Profile image and hero image can be replaced from the Edit Client panel.
- Hero crop X/Y can be updated on existing clients.
- Preview Client Page now opens `client-dashboard.html?client=username` in a new tab.
- Create Client also includes a Preview button for checking the client dashboard layout before/after creation.

Files to upload to GitHub:

- `admin-panel.html`
- `js/admin-supabase.js`
- `docs/SUPABASE-STEP-5-CLIENT-EDIT-PREVIEW.md`

No new SQL is required for this step if Step 4 was already executed.

Important: do not overwrite `js/supabase-config.js` if it already contains your real Supabase URL and publishable key.
