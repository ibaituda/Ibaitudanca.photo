# V1.2.1 Storage Cleanup

Corrige el borrado real de fotos, galerías y clientes.

## Qué cambia

- Al eliminar una foto desde la gestión de galería, ahora va a Papelera en vez de desaparecer solo visualmente.
- Al borrar definitivamente una foto desde Papelera, se borra de:
  - Supabase Storage
  - `photos`
  - `favourites`
  - `selections`
  - `retouch_requests`
  - `download_logs`
- Al borrar definitivamente una galería, se borran sus fotos y archivos asociados.
- Al borrar definitivamente un cliente, se borran sus datos personales, favoritos, selecciones, descargas, solicitudes y relaciones.
- Si el cliente era el único asignado a una galería, esa galería queda huérfana y también se elimina con sus fotos.

## Archivos a subir

- `js/admin-productivity.js`
- `js/admin-photo-management.js`
- `js/gallery-view.js`
- `js/client-dashboard.js`
- `supabase/v1_2_1_storage_cleanup.sql`

## SQL

Ejecuta en Supabase:

`supabase/v1_2_1_storage_cleanup.sql`

## Prueba recomendada

1. Sube 2 fotos a una galería.
2. En Editar galería, elimina una foto.
3. Comprueba que aparece en Papelera.
4. En Papelera, pulsa borrar definitivamente.
5. Comprueba en Supabase Storage que el archivo ya no está.
