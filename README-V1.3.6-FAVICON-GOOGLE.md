# v1.3.6 – Favicon & Google indexing fix

## Cambios incluidos

- Favicon reconstruido desde el logo vectorial, con más margen y sin fondo cuadrado.
- Nuevas referencias de favicon con versión `v=1356` para forzar refresco de caché.
- `favicon.ico` regenerado con tamaños 16/32/48 px.
- Apple Touch Icon añadido en raíz: `/apple-touch-icon.png`.
- Manifest actualizado con iconos nuevos.
- Cabeceras de Vercel para evitar caché persistente en favicons.
- Sitemap actualizado con `lastmod`.

## Después de desplegar

1. Abrir en ventana privada:
   - https://www.ibaitudancaphoto.com/
   - https://www.ibaitudancaphoto.com/client-access
2. En Safari, si sigue apareciendo el favicon antiguo, cerrar Safari por completo y volver a abrir. Safari puede cachear favicons por dominio incluso con query strings.
3. Para Google:
   - Crear propiedad en Google Search Console para `https://www.ibaitudancaphoto.com/`.
   - Enviar sitemap: `https://www.ibaitudancaphoto.com/sitemap.xml`.
   - Usar inspección de URL para solicitar indexación de la home.
   - Añadir el enlace de la web en Instagram, email profesional y perfiles públicos.
