
# V1.2 Quality of Life Update

## Subir a GitHub
Sube estos archivos/carpetas:

- `admin-panel.html`
- `gallery-view.html`
- `client-dashboard.html`
- `js/v1_2_admin_lifecycle.js`
- `js/v1_2_gallery_zip.js`
- `js/v1_2_client_notifications.js`
- `supabase/v1_2_quality_life.sql`

## Ejecutar SQL
En Supabase → SQL Editor, ejecuta:

`supabase/v1_2_quality_life.sql`

## Qué añade realmente ahora

### Cliente
- Mantiene cambio de contraseña desde dashboard.
- Refuerza aviso elegante de retoques completados.
- Mantiene favoritos y selección reales.
- Añade descarga ZIP desde la galería usando las fotos visibles/reales.

### Administrador
- Borrado definitivo más limpio:
  - foto: borra registro y archivos de Storage asociados.
  - galería: borra fotos, relaciones y archivos asociados.
  - cliente: borra registros asociados directos y fotos de perfil/hero.
- Mantiene registros de descargas.
- Añade filtros locales rápidos dentro de Clientes/Galerías/Descargas.
- Mantiene duplicar galería si ya estaba activo.

### Fotógrafo
- La subida actual ya optimiza a WebP con límite aproximado 2 MB.
- El SQL prepara tablas para emails/API futura.
- FTP, envío real de emails y subida automática desde carpeta local necesitan servidor/Edge Function o app local; no pueden funcionar solo con HTML estático en navegador.

## Importante sobre espacio
Mientras algo esté en Papelera, seguirá ocupando espacio. Al pulsar “Borrar definitivamente”, esta versión intenta borrar también los archivos de Storage relacionados.
