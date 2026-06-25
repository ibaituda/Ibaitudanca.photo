# v1.3.3 Favicon Hotfix

Correcciones:
- Favicon regenerado desde el logo real, con fondo transparente.
- Variante negra para fondos claros.
- Variante blanca para fondos oscuros.
- favicon.ico raíz regenerado en varios tamaños.
- Cache busting añadido a todos los enlaces de icono (`?v=1333`) para evitar caché de Safari.

Comprobación recomendada:
1. Abrir la home en ventana privada.
2. Abrir `/client-access`.
3. Abrir `/client-dashboard/<cliente>`.
4. Confirmar que el favicon ya no muestra una “I” ni un cuadrado raro.
5. Si Safari mantiene el icono anterior, vaciar caché o esperar unos minutos: Safari cachea favicons de forma agresiva.
