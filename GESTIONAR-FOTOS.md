# Gestión de fotos del portfolio

Este proyecto está preparado para editar las imágenes del portfolio público con **Pages CMS** sin tocar `index.html`.

## Qué se puede editar

- Portada principal (hero)
- Retrato de About me
- Fotografías de My Photography, con protagonista, equipo, descripción y formato
- Capturas de Published Work
- Las cinco imágenes de Services

Los datos editables viven en `content/site.json`. Pages CMS utiliza `.pages.yml` para mostrar un formulario visual y guardar automáticamente los cambios en GitHub.

## Carpetas de imágenes

- `img/cover/` — portada
- `img/about/` — retrato
- `img/portfolio/` — selección principal
- `img/published/` — capturas/publicaciones
- `img/services/` — imágenes de servicios

Las imágenes antiguas de `img/work_*.jpg` y similares se han conservado para no romper páginas privadas o de clientes que puedan utilizarlas.

## Conectar Pages CMS

1. Sube esta versión del proyecto a la rama de GitHub que despliega Vercel (normalmente `main`).
2. Entra en https://app.pagescms.org e inicia sesión con GitHub.
3. Instala/autoriza la aplicación de Pages CMS para el repositorio del portfolio.
4. Abre el repositorio. Pages CMS detectará automáticamente `.pages.yml`.
5. Entra en **Portfolio · Fotos**.
6. Cambia la imagen o los datos que quieras y guarda. Pages CMS creará el cambio en GitHub.
7. Si Vercel está conectado a ese repositorio/rama, desplegará la actualización automáticamente.

## Recomendación de formatos

- Portada: horizontal 3:2
- About me: vertical aproximadamente 3:4
- Portfolio: selecciona `Vertical 3:4` u `Horizontal 3:2` en cada fotografía
- Published Work: mantén una proporción parecida entre capturas para que el carrusel sea uniforme

## Importante

La web mantiene datos de respaldo dentro de `index.html`. Si por algún motivo `content/site.json` no carga, seguirá apareciendo el portfolio actual en lugar de quedar vacío.
