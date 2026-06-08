# Storage structure planned

Recommended folder pattern:

```text
clients/{client_id}/profile/
clients/{client_id}/hero/
galleries/{gallery_id}/cover/
galleries/{gallery_id}/original/
galleries/{gallery_id}/3000px/
galleries/{gallery_id}/1600px/
galleries/{gallery_id}/retouched/
```

At the beginning, use Supabase Storage. If galleries become very heavy or downloads grow, move photo storage to Cloudflare R2 and keep only metadata in Supabase.
