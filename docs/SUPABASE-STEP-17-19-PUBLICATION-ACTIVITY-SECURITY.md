# Step 17-19 — Publication, real overview and client privacy

## What this adds

- Real overview numbers from Supabase instead of fixed demo numbers.
- Latest client, latest gallery and next event pulled from the database.
- Useful activity panel based on downloads, retouch requests and galleries.
- Draft / Published support for clients and galleries.
- Client dashboard guard: inactive/draft clients are redirected to login.
- Gallery guard: clients can only open published galleries assigned to them.
- Publication checklist generated from the latest gallery data.

## Upload to GitHub

Upload / replace:

```text
admin-panel.html
client-dashboard.html
gallery-view.html
js/admin-governance.js
js/client-privacy.js
supabase/dev-policies-step17-19-publication-activity-security.sql
```

## Supabase

Run:

```text
supabase/dev-policies-step17-19-publication-activity-security.sql
```

## Test

1. Open Admin Panel → Overview. Numbers must match Supabase.
2. Publish a client and a gallery.
3. Log in as that client.
4. Confirm only published assigned galleries are visible.
5. Try opening a gallery URL from another client. It should redirect to login.
