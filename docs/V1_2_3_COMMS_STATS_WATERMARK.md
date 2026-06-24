# V1.2.3 — Emails, estadísticas y marca de agua

## Qué añade

- Nueva sección **Emails** en el panel admin.
- Cola de emails pendientes: nada se envía sin aprobación.
- Emails manuales/campañas desde el panel.
- Historial de emails: pendiente, enviado, cancelado, error.
- Notificaciones internas de actividad reciente.
- Estadísticas avanzadas en Descargas: totales, últimos 30 días, top clientes, top galerías y top fotos.
- Marca de agua configurable desde Ajustes.

## Importante sobre emails reales

La web puede crear, previsualizar, aprobar y dejar emails listos en `email_outbox`.
Para envío real necesitas configurar una Edge Function/Webhook con un proveedor como Resend. La URL se guarda en Ajustes → `Email webhook / Resend Edge Function`.

Sin webhook configurado, el botón **Enviar** aprueba el email y lo deja marcado como pendiente de proveedor, pero no puede enviarlo realmente desde el navegador sin exponer claves privadas.

## Marca de agua

La marca de agua se aplica a las descargas generadas desde la galería cuando está activada en Ajustes. No modifica el archivo original guardado en Storage.

## Archivos incluidos

- `admin-panel.html`
- `gallery-view.html`
- `js/gallery-view.js`
- `js/v1_2_3_comms_stats_watermark.js`
- `supabase/v1_2_3_comms_stats_watermark.sql`
