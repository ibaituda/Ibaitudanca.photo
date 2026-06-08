# Step 21-23 — Gestión de fotos, publicación y roles

## Incluye

- Registro correcto de fotos en la tabla `photos` mediante políticas RLS válidas.
- Gestión de fotos desde editar galería:
  - subir/registrar fotos nuevas,
  - ordenar,
  - ocultar/mostrar,
  - eliminar de la galería,
  - marcar como portada,
  - reemplazar por versión retocada,
  - editar captions ES/EN.
- `gallery-view.js` usa la versión retocada si existe.
- Tracking básico de descargas en `download_logs`.
- Seguridad ligera de administradores:
  - `ibai-admin` queda como `owner`,
  - colaboradores no ven Administradores/Ajustes,
  - no bloquea la carga del panel.

## Archivos a subir

- `admin-panel.html`
- `js/admin-photo-management.js`
- `js/admin-security-lite.js`
- `js/gallery-view.js`
- `supabase/dev-policies-step21-23-photo-management-roles.sql`

## Después

Ejecuta el SQL en Supabase. Si sale aviso de cambios destructivos, pulsa Run query: se eliminan y recrean policies de desarrollo, no tablas.
