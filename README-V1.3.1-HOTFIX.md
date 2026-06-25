# v1.3.1 Hotfix

Fixes after v1.3 Branding & SEO:

- Fixes black screen on `/client-dashboard/{client}` by making nested-route assets load from absolute `/js/` and `/img/` paths.
- Adds route slug parsing in `client-dashboard.js`, so `/client-dashboard/antonio-blanco` can resolve the client directly.
- Applies the same absolute asset fix to `/private-gallery/{client}/{gallery}`.
- Replaces the square-looking favicon with transparent logo-only favicon assets.
- Adds light/dark favicon variants: black logo for light tabs, white logo for dark tabs where supported.

No Supabase changes required.
