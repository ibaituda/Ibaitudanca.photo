# Step 24-26 — Tareas, duplicados, papelera y beta

## Incluye

- Nueva sección **Tareas** con estados rojo/amarillo/verde.
- Botón **Duplicar cliente** funcional.
- Botón **Duplicar galería** funcional.
- Nueva sección **Papelera** para restaurar elementos con `deleted_at`.
- Buscador global para clientes, galerías y tareas.
- Actividad real en el resumen.
- Estados vacíos más claros para pruebas beta.

## Subir a GitHub

Sube estos archivos:

```text
admin-panel.html
js/admin-productivity.js
js/admin-beta-tools.js
supabase/dev-policies-step24-26-tasks-duplicates-trash.sql
docs/SUPABASE-STEP-24-26-TASKS-DUPLICATE-TRASH-BETA.md
```

## Ejecutar en Supabase

Ejecuta:

```text
supabase/dev-policies-step24-26-tasks-duplicates-trash.sql
```

## Pruebas recomendadas

1. Crear una tarea roja, cambiarla a amarillo y luego verde.
2. Duplicar un cliente y comprobar que aparece como borrador.
3. Duplicar una galería y comprobar que mantiene clientes asignados.
4. Usar el buscador global con un cliente, una galería y una tarea.
5. Ver que el resumen muestra actividad real.
