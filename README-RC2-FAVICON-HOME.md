# RC2 Favicon Home Fix

Corrección específica para Safari/Home:

- Se añade `favicon-ibai.svg` como icono principal.
- Se añade `safari-pinned-tab.svg`.
- Se reconstruyen favicons negros/blancos transparentes.
- Se unifica el bloque de favicon en todas las páginas.
- Se elimina la dependencia exclusiva de `favicon.ico?v=...` en la home.
- Se mantienen URLs, SEO, Open Graph y flujo cliente/admin.

Si Safari sigue mostrando una letra en la home después de desplegar, borrar caché de iconos de Safari o probar Chrome/Firefox confirmará que no es código sino caché local de Safari para la raíz del dominio.
