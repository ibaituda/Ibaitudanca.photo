# Step 10 — Administrators: desktop layout, edit and profile image

This step fixes the administrators section and improves the admin experience.

## What it adds

- Administrators section works properly on desktop.
- Admin list has an **Edit admin** button.
- You can edit:
  - admin name
  - username
  - password
  - role
  - active/inactive status
  - profile image
- New admins can be created with a profile image.
- The admin panel overview shows a welcome block:
  - “Welcome, let’s work” / “Bienvenido, vamos a trabajar”
  - current admin name or username
  - current admin profile circle

## Files to upload to GitHub

- `admin-panel.html`
- `admin-login.html`
- `js/admin-supabase.js`
- `js/admin-login.js`
- `supabase/dev-policies-step10-admin-profile-edit.sql`
- `docs/SUPABASE-STEP-10-ADMIN-PROFILE-EDIT.md`

## Supabase SQL

Run:

`supabase/dev-policies-step10-admin-profile-edit.sql`

This adds `profile_image_url` to `admin_users`.

## Test

1. Go to `admin-login.html`.
2. Log in as an admin.
3. Open `admin-panel.html`.
4. Check that the overview hero shows the admin welcome block.
5. Go to Administrators.
6. Edit an admin.
7. Change username/name/password/profile image.
8. Save.
9. Log out and log in again to verify the new username/password.
