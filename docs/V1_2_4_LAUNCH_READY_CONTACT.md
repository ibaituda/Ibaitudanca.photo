# V1.2.4 Launch Ready Contact

Incluye:

- Dominio oficial actualizado a `ibaitudancaphoto.com`.
- Instagram actualizado a `@ibaitudancaphoto`.
- Email público actualizado a `hola@ibaitudancaphoto.com`.
- Formulario del index conectado sin proveedor de pago:
  - guarda solicitud en `contact_messages` si Supabase está disponible;
  - abre un email preparado al visitante para enviarlo a `hola@ibaitudancaphoto.com`.
- Nueva bandeja de mensajes del formulario dentro de Admin Panel → Emails.
- Emails manuales del Admin Panel abren Gmail con el mensaje preparado si todavía no hay webhook/Resend configurado.
- Títulos de páginas actualizados para lanzamiento.

Nota: para envío silencioso 100% automático sin abrir Gmail/mail del usuario hará falta configurar Resend/Supabase Edge Function.
