# Ibai Tudanca Portfolio — Technical Starter

Este paquete es la base técnica limpia para empezar a convertir la maqueta HTML en una web real.

## Estado actual

Incluye las páginas finales optimizadas:

- `index.html` — portfolio público.
- `clientes.html` — acceso de clientes.
- `admin-login.html` — acceso administrador.
- `client-dashboard.html` — dashboard privado de cliente.
- `gallery-view.html` — vista de galería privada.
- `admin-panel.html` — panel administrador.

Ahora mismo siguen siendo HTML/CSS/JS estáticos. Se ven y navegan, pero todavía no tienen login real, base de datos ni subida real de fotos.

## Qué se ha preparado

- Estructura limpia para subir a Vercel.
- `package.json` para abrir en local con Vite.
- `vercel.json` básico.
- `.env.example` para futuras variables de Supabase.
- Carpeta `supabase/` con un primer esquema de base de datos.
- Carpeta `docs/` con roadmap y pasos de despliegue.

## Cómo probarlo en local

1. Instalar Node.js.
2. Abrir la carpeta en Terminal.
3. Ejecutar:

```bash
npm install
npm run dev
```

Luego abrir la URL que te dé Vite.

## Siguiente paso recomendado

Primero subir la web pública estática a Vercel. Después conectar Supabase para login, clientes, galerías, fotos, favoritos, descargas y solicitudes de retoque.
