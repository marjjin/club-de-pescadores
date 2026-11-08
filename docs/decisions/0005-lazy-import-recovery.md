# ADR 0005: recuperación de módulos y separación de rutas SPA

Fecha: 2026-11-08.

## Problema observado

El navegador informó fallos de importación dinámica y respuestas `text/html` para módulos JavaScript. Una comprobación remota reprodujo que `/assets/archivo-inexistente.js` respondía con el HTML del sitio, HTTP 200 y caché `immutable` de un año. Los módulos presentes en el manifiesto respondían correctamente en el momento de la inspección; una respuesta HTML guardada en el navegador o una pestaña de otra versión puede conservar el fallo.

## Corrección

- La reescritura SPA excluye `/assets` y `/.vite`. Los recursos ausentes responden 404.
- El HTML y los archivos de control revalidan con `no-cache`. Los recursos con hash conservan caché inmutable y el panel mantiene `no-store`.
- El arranque escucha `vite:preloadError`. Solicita una recarga manteniendo la URL, con un intervalo mínimo de un minuto entre intentos registrado en `sessionStorage`. Si no hay conexión o almacenamiento, deja actuar al límite de errores para evitar bucles.
- El límite de errores ofrece una recarga manual.
- `npm run site:check` verifica las rutas publicadas, la caché, el MIME de todos los JS/CSS del manifiesto y un módulo inexistente. Esta comprobación complementa las pruebas locales; obtener HTTP 200 para una página no alcanza para verificar sus módulos.

Referencias: [recuperación de carga en Vite](https://vite.dev/guide/build#load-error-handling) y [patrones de reescritura de Vercel](https://vercel.com/docs/project-configuration/vercel-json#negative-lookahead).
