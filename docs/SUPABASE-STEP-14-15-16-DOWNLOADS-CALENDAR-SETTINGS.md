# Step 14 + 15 + 16 — Descargas, calendario y ajustes reales

## Qué añade

### Step 14 — Descargas reales
- Cada descarga desde `gallery-view.html` se registra en `download_logs`.
- El admin panel muestra descargas reales en **Descargas**.
- Se guarda cliente, galería, foto si aplica, tipo de descarga, tamaño y número de fotos.

### Step 15 — Calendario real
- La sección **Calendario** carga eventos desde `calendar_events`.
- Permite crear y editar eventos.
- Estados: pendiente, confirmado, en cobertura, finalizado, cancelado.

### Step 16 — Ajustes reales
- Nueva tabla `app_settings`.
- Guarda tamaños, email de contacto y licencias por defecto.

## Archivos a subir a GitHub

- `admin-panel.html`
- `gallery-view.html`
- `js/gallery-view.js`
- `js/admin-extras.js`
- `supabase/dev-policies-step14-15-16-downloads-calendar-settings.sql`
- `docs/SUPABASE-STEP-14-15-16-DOWNLOADS-CALENDAR-SETTINGS.md`

## SQL
Ejecuta en Supabase SQL Editor:

`supabase/dev-policies-step14-15-16-downloads-calendar-settings.sql`

## Pruebas

1. Entra como cliente.
2. Abre una galería.
3. Descarga una foto o seleccionadas/favoritas.
4. Ve a Admin Panel → Descargas.
5. Debe aparecer la descarga.
6. Ve a Calendario y crea un evento.
7. Recarga la página y comprueba que sigue ahí.
8. Ve a Ajustes, cambia licencia o email, guarda y recarga.
