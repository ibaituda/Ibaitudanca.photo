# Hotfix Crear Galería + Cambiar Contraseña

Archivos:
- admin-panel.html
- js/admin-client-password.js

Corrige:
- El bloque Crear galería vuelve a estar dentro de la sección Galerías.
- Los botones Cambiar contraseña de clientes actualizan password_hash en Supabase.
- No se reintroduce admin-security.js para evitar congelaciones.

No requiere SQL.
