# Roadmap funcional recomendado

## Fase 1 — Web estática online
Objetivo: tener el portfolio público funcionando con dominio.

- Subir proyecto a GitHub.
- Conectar GitHub con Vercel.
- Publicar `index.html`, `clientes.html` y `admin-login.html`.
- Comprobar responsive, SEO, rutas e imágenes.

## Fase 2 — Login real básico
Objetivo: que admin y clientes entren con usuario/contraseña reales.

- Crear proyecto Supabase.
- Crear tablas principales.
- Crear usuario administrador.
- Convertir `clientes.html` y `admin-login.html` para autenticar.
- Redirigir cliente a su dashboard.
- Redirigir admin al panel.

## Fase 3 — Clientes y galerías reales
Objetivo: que el admin cree clientes y galerías reales.

- Crear cliente desde admin.
- Crear galería y asignarla a uno o varios clientes.
- Mostrar en `client-dashboard.html` solo las galerías asignadas al cliente.
- Mostrar estado: creada, en proceso, lista.

## Fase 4 — Fotos reales y descargas
Objetivo: subir fotos y descargarlas desde la galería.

- Subida de fotos desde admin.
- Guardar fotos en Supabase Storage o Cloudflare R2.
- Guardar metadatos de foto en base de datos.
- Descargar fotos individuales por resolución.
- Guardar historial de descarga.

## Fase 5 — Funciones premium
Objetivo: completar la experiencia profesional.

- Favoritas por galería.
- Seleccionadas por galería.
- Solicitudes de retoque.
- Reemplazo de foto retocada.
- Calendario real de eventos.
- Métricas de actividad.

## Fase 6 — Optimización futura
Objetivo: abaratar y escalar.

- Generar tamaños 3000px/1600px automáticamente.
- Crear ZIP de favoritas/seleccionadas.
- Pasar fotos pesadas a Cloudflare R2 si Supabase Storage se queda corto.
