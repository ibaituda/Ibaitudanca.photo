# Step 27 - Overview sync

Este hotfix conecta los bloques del Resumen con los datos reales de sus secciones:

- Clientes activos desde `clients`.
- Galerías desde `galleries`.
- Subidas pendientes calculadas con `galleries` + `photos`.
- Retoques pendientes desde `retouch_requests`.
- Tareas pendientes desde `app_tasks`.
- Última galería real.
- Último cliente real.
- Próximo evento real desde `calendar_events`.
- Actividad real desde `activity_log`, `download_logs` y `retouch_requests`.

No requiere SQL nuevo.
