# Publicación en Vercel

Destino confirmado: https://www.clubdepescadores.com/ (el dominio de Vercel redirige al propio).

La configuración de este repositorio prepara el sitio público. Un build local aprobado no implica que el esquema remoto exista o que Vercel ya haya recibido esta versión.

## Activación

1. Aplicar `supabase/migrations/202611080001_public_content.sql` en el proyecto Supabase `rjzmcwfwfxtktuleqzgf`. Usar la integración de Supabase o su CLI con una cuenta autorizada para que quede registrada como migración. Revisar el SQL antes de ejecutarlo: crea tres tablas nuevas, índices, triggers y políticas; no borra datos ni publica contenido de ejemplo.
2. Ejecutar `npm run production:check`. Debe verificar las tres tablas sin `PGRST205` ni errores de permisos. Un resultado vacío es válido cuando todavía no se publicó contenido.
3. Las fotos actuales y el teléfono fueron autorizados por el usuario el 8 de noviembre de 2026. El usuario confirmó que el correo del boceto era ficticio; se retiró y el sitio se publica sin correo hasta contar con uno oficial. No cargar noticias, eventos o tarifas ficticias para llenar la página.
4. Configurar en Vercel, para **Production**, las variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_SITE_URL` con los mismos valores públicos de `.env.local`. El origen del sitio es `https://www.clubdepescadores.com`, sin barra final (el dominio propio, no el de Vercel: es la dirección que se imprime en los QR de los torneos y en los enlaces canónicos). No subir el archivo `.env.local` al repositorio.
5. Ejecutar `npm run check` y `npm audit --omit=dev`. Desplegar el código completo del repositorio, incluido `vercel.json`, mediante el proyecto Vercel existente. El build es `npm run build`, la salida es `dist/` y Node es 24.
6. Verificar la versión publicada: inicio, `/noticias`, `/eventos`, navegación móvil, errores de red, `/robots.txt`, `/sitemap.xml`, `/og-image.jpg`, una dirección inexistente (debe responder 404) y cabeceras CSP. `npm run site:check` verifica todo esto contra el sitio publicado. Revisar en navegador la consola y la pestaña de red; comprobar que las consultas van al proyecto Supabase correcto.

## CAPTCHA del panel (Cloudflare Turnstile)

El ingreso y la recuperación de contraseña del panel envían un token de Turnstile a Supabase Auth. Sin él, un bot puede pedir correos de recuperación y agotar el cupo de envío del proyecto, lo que bloquea las invitaciones. El script de Turnstile se carga solo en `/admin`.

El orden importa: si se activa el CAPTCHA en Supabase antes de publicar la clave en el sitio, nadie puede ingresar al panel.

1. En Cloudflare → Turnstile, crear un widget en modo «Managed» con el hostname `clubdepescadores.com` (incluye `www`).
2. En Vercel, cargar `VITE_TURNSTILE_SITE_KEY` (la clave pública, empieza con `0x`) solo para **Production**. Las vistas previas usan otro dominio que el widget no acepta, así que ahí el panel ingresa sin CAPTCHA mientras Supabase no lo exija.
3. Redesplegar y comprobar que `/admin` muestra la verificación y que el botón «Ingresar» se habilita.
4. Recién entonces, en Supabase → Authentication → Attack Protection, activar el CAPTCHA con Turnstile y la **clave secreta**. La clave secreta nunca va en Vercel ni en el repositorio.

Para desactivarlo, hacer los pasos al revés: primero apagarlo en Supabase y después quitar la variable.

En desarrollo local se puede probar con la clave de prueba de Cloudflare `1x00000000000000000000AA`, que siempre aprueba. El build de producción la rechaza.

Si se usa el SQL Editor como alternativa al mecanismo de migraciones, ejecutar el archivo completo una sola vez y registrar después esa versión como aplicada con la CLI antes de introducir nuevas migraciones. No ejecutar `db reset` sobre la base remota.

## Qué protege el despliegue

- El build falla si falta la configuración pública. No hay un modo de demostración en producción ni se sustituye un error remoto por fixtures.
- `vercel.json` usa rutas explícitas (`routes`): cada página pública tiene su HTML, las direcciones desconocidas responden 404 y los archivos de `/assets` que faltan responden 404 sin guardarse en caché (un 404 guardado un año dejaba la página en blanco). También fija la CSP con el origen de Supabase, la protección contra frames, `nosniff`, la política de referrer y los permisos restringidos.
- Los assets con hash usan caché de un año. Las páginas usan revalidación. Los datos se cachean temporalmente con TanStack Query.
- El build pre-renderiza las páginas fijas y genera robots, imagen social, logo y página 404; noticias, torneos y el sitemap los arma `api/seo.js`. Ver [seo.md](seo.md). La generación verifica que la CSP incluya el origen de Supabase: si cambia el proyecto, actualizar también `vercel.json`.
- Los listados solicitan columnas explícitas, usan límites, cursor con desempate por ID, cancelación y un timeout de 12 segundos.

## Contenido y permisos

La primera migración no inserta contenido. Para esta primera versión pública, el propietario del proyecto puede gestionar contenido desde el Table Editor de Supabase. El navegador solo lee filas publicadas; no puede crear, modificar ni borrar datos.

Las tarifas se almacenan en centavos de ARS. Por ejemplo, un importe confirmado de $100 se guarda como `10000`; esto explica la unidad, no es una tarifa propuesta para el club. Las condiciones familiares, descuentos y vigencia se cargan en cada registro.

Las noticias requieren imagen HTTPS y texto alternativo. Para imágenes nuevas, usar almacenamiento público del club con escritura limitada al propietario y URLs estables. Los borradores y noticias con publicación futura no son visibles en la web.

La implementación administrativa está en `/admin` y tiene una matriz aprobada. Su activación requiere pasos adicionales en Supabase y el despliegue del frontend; ver [administración](admin.md). El éxito del sitio público no certifica esos pasos.

## Alcance de la verificación

`npm run site:check` verifica el HTML y sus cabeceras, todos los módulos JS y CSS del manifiesto remoto y que los módulos inexistentes respondan 404. Ejecutarlo después de cada publicación. El HTML revalida; los recursos bajo `/assets` quedan fuera de la reescritura SPA para impedir respuestas HTML con caché inmutable en URLs de JavaScript. El arranque ofrece recuperación acotada ante errores de importación dinámica.

`npm run check` prueba el código, las rutas, consultas HTTP simuladas y las migraciones y políticas en PostgreSQL aislado mediante PGlite. También comprueba que los tipos correspondan al esquema local.

`npm run production:check` comprueba lectura real del esquema remoto con la clave pública; no inspecciona políticas internas, permisos elevados ni planes de consulta. Esos controles y el Security Advisor deben verificarse sobre el proyecto remoto con acceso autorizado antes de declarar la puesta en producción terminada.

La auditoría de dependencias de producción no presenta alertas en la verificación local. Persisten diez alertas moderadas en dependencias de desarrollo por `minimatch`; revisar una corrección compatible antes de futuros despliegues. No se forzó una actualización mayor del toolchain.

## Recuperación

Conservar la última versión estable de Vercel para poder revertir el despliegue. No revertir el esquema borrando tablas con contenido. Las correcciones de base de datos se realizan con nuevas migraciones y el plan de backup/restauración del proyecto Supabase.
