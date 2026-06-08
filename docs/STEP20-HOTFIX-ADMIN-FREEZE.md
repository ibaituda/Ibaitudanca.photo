# Step 20 Hotfix — Admin panel freeze

This hotfix replaces `js/admin-security.js`.

It fixes the admin panel freezing/not opening after Step 20 by removing the infinite MutationObserver loop and applying role UI safely.

Upload to GitHub:

- js/admin-security.js

No SQL required.
