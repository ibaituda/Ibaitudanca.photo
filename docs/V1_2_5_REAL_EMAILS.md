# V1.2.5 Real Emails

## Qué incluye

- `api/contact.js`: envía a `hola@ibaitudancaphoto.com` los mensajes del formulario del index mediante Resend.
- `api/send-email.js`: permite enviar emails reales desde el centro de Emails del Admin Panel.
- `js/v1_2_4_launch_ready.js`: el formulario ya no abre `mailto`; ahora llama a `/api/contact` y muestra éxito/error.
- `js/v1_2_3_comms_stats_watermark.js`: el botón Enviar del centro de Emails llama a `/api/send-email`.

## Requisitos

En Vercel debe existir la variable de entorno:

`RESEND_API_KEY`

Debe estar disponible en Production.

## Cómo instalar

Subir a GitHub:

- `api/contact.js`
- `api/send-email.js`
- `js/v1_2_4_launch_ready.js`
- `js/v1_2_3_comms_stats_watermark.js`
- `docs/V1_2_5_REAL_EMAILS.md`

Después hacer redeploy en Vercel.

## Prueba

1. Entra en `https://ibaitudancaphoto.com`.
2. Rellena el formulario de contacto.
3. Debe aparecer mensaje de éxito.
4. Debe llegarte un correo a `hola@ibaitudancaphoto.com` y, por el forward de Porkbun, a Gmail.
5. El mensaje también debe quedar en `Admin Panel > Emails > Mensajes del formulario`.

## Seguridad

No subir nunca la API key al repositorio. Solo debe estar en Vercel Environment Variables.
