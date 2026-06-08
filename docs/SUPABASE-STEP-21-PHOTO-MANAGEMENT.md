# Step 21 — Gestión de fotos + publicación + seguridad ligera

Incluye:

- Gestión de fotos dentro de la edición de galería.
- Mover fotos arriba/abajo.
- Ocultar/mostrar fotos.
- Eliminar fotos de la galería.
- Reemplazar una foto por una versión retocada.
- Marcar una foto como portada de galería.
- Editar datos básicos de foto: caption, lugar y fecha.
- Checklist de publicación y botón publicar/despublicar.
- Seguridad ligera por roles en el frontend sin bloquear la app.
- `gallery-view.js` mantiene tracking de descargas reales.

## Archivos a subir

```text
admin-panel.html
js/admin-photo-management.js
js/admin-security-lite.js
js/gallery-view.js
supabase/dev-policies-step21-photo-management-security.sql
docs/SUPABASE-STEP-21-PHOTO-MANAGEMENT.md
```

## SQL

Ejecuta en Supabase:

```text
supabase/dev-policies-step21-photo-management-security.sql
```

## Prueba rápida

1. Admin Panel → Galerías → Lista → Editar galería.
2. Comprueba que aparece la gestión de fotos.
3. Prueba mover, ocultar, portada y reemplazar.
4. Abre la galería como cliente y comprueba que las ocultas no aparecen.
5. Descarga una foto y revisa `download_logs`.
