# Step 8/9 — Client login real + favourites/selections reales

## Qué añade

- `clientes.html` ahora comprueba usuario y contraseña contra la tabla `clients`.
- Se guarda una sesión de cliente en `localStorage`.
- `client-dashboard.html` usa la sesión si no recibe `?client=`.
- `gallery-view.html` comprueba la sesión del cliente y guarda favoritas/seleccionadas en Supabase.
- Las favoritas y seleccionadas permanecen después de recargar la página.

## Archivos a subir a GitHub

- `clientes.html`
- `client-dashboard.html`
- `gallery-view.html`
- `js/client-login.js`
- `js/client-dashboard.js`
- `js/gallery-view.js`
- `supabase/dev-policies-step8-9-client-login-favourites.sql`

No sobrescribas `js/supabase-config.js` si ya contiene tus claves reales.

## SQL

Ejecuta en Supabase SQL Editor:

`supabase/dev-policies-step8-9-client-login-favourites.sql`

## Prueba recomendada

1. En Admin Panel, crea o edita un cliente con usuario y contraseña.
2. Entra en `clientes.html`.
3. Accede con el usuario y contraseña.
4. Abre una galería real.
5. Marca favoritas y seleccionadas.
6. Recarga la página.
7. Comprueba que siguen marcadas.
8. En Supabase, revisa las tablas `favourites` y `selections`.

## Nota de seguridad

Estas políticas son de desarrollo y son permisivas. Antes de usarlo con clientes pagados, habrá que endurecer RLS y mover ciertas operaciones sensibles a funciones/servidor.
