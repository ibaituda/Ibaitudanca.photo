# Despliegue barato recomendado

## Opción inicial

- Hosting: Vercel, plan gratuito.
- Base de datos/login: Supabase, plan gratuito al principio.
- Fotos: Supabase Storage al principio; Cloudflare R2 si el volumen crece.

## Pasos para publicar la parte estática

1. Crear cuenta en GitHub.
2. Crear repositorio privado o público.
3. Subir esta carpeta.
4. Crear cuenta en Vercel.
5. Importar el repositorio.
6. Vercel detectará el proyecto como estático.
7. Publicar.
8. Conectar dominio cuando lo compres.

## Antes de conectar backend

No compartir públicamente `admin-panel.html` como si fuese admin real. Ahora es una maqueta visual. Cuando haya login real, se protegerá desde backend.
