# Step 20 — Admin security + client password reset

Sube a GitHub:

- `admin-panel.html`
- `js/admin-security.js`
- `supabase/dev-policies-step20-admin-security.sql`

Después ejecuta en Supabase el SQL `dev-policies-step20-admin-security.sql`.

## Qué corrige

- El botón `Cambiar contraseña` de clientes ahora funciona de verdad.
- Solo el rol `owner` puede cambiar contraseñas de clientes.
- Solo el rol `owner` puede crear o editar administradores.
- Los administradores no-owner no ven Administradores ni Ajustes.
- La cuenta owner no puede desactivarse ni degradarse por accidente desde el panel.
- El panel muestra el rol en la bienvenida: `Ibai Tudanca · OWNER`.

## Roles recomendados

- `owner`: tú. Control total.
- `editor`: colaborador de confianza. Puede trabajar, pero no tocar administradores ni contraseñas.
- `photographer`: colaborador/fotógrafo externo para subir y gestionar entregas básicas.

## Importante

Esto mejora mucho la seguridad dentro de la interfaz, pero en una fase futura conviene endurecer Supabase con autenticación real/RLS avanzada o funciones servidor para protegerlo también a nivel backend.
