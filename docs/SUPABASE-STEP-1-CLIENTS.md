# Supabase Step 1: Connect Admin Clients

This version connects only the Clients section of `admin-panel.html` to Supabase.

## What works in this step

- Load real clients from the `clients` table.
- Create a new client from the Create client tab.
- Save the client in Supabase.
- Refresh the visible client list automatically.

## Important

This is a development step. It uses temporary RLS policies so the browser can read and create clients.
Later, before using the system with real paid clients, we must replace this with proper admin authentication.

## Steps

1. Upload these files to GitHub:
   - `admin-panel.html`
   - `js/supabase-config.js`
   - `js/admin-supabase.js`
   - optional: `supabase/dev-policies-step1.sql`

2. In Supabase, open SQL Editor and run:
   `supabase/dev-policies-step1.sql`

3. Open `js/supabase-config.js` and paste:
   - Project URL
   - Publishable / anon public key

4. Deploy on Vercel.

5. Open:
   `/admin-panel.html`

6. Go to:
   Clients → Create client

7. Create a test client.

## Do not paste the secret/service_role key in the browser.
