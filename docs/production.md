# Publicación en Vercel

Destino confirmado: https://club-de-pescadores.vercel.app/

La configuración de este repositorio prepara el sitio público. Un build local aprobado no implica que el esquema remoto exista o que Vercel ya haya recibido esta versión.

## Activación

1. Aplicar `supabase/migrations/202611080001_public_content.sql` en el proyecto Supabase `rjzmcwfwfxtktuleqzgf`. Usar la integración de Supabase o su CLI con una cuenta autorizada para que quede registrada como migración. Revisar el SQL antes de ejecutarlo: crea tres tablas nuevas, índices, triggers y políticas; no borra datos ni publica contenido de ejemplo.
2. Ejecutar `npm run production:check`. Debe verificar las tres tablas sin `PGRST205` ni errores de permisos. Un resultado vacío es válido cuando todavía no se publicó contenido.
3. Las fotos actuales y el teléfono fueron autorizados por el usuario el 8 de noviembre de 2026. El usuario confirmó que el correo del boceto era ficticio; se retiró y el sitio se publica sin correo hasta contar con uno oficial. No cargar noticias, eventos o tarifas ficticias para llenar la página.
4. Configurar en Vercel, para **Production**, las variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_SITE_URL` con los mismos valores públicos de `.env.local`. El origen del sitio es `https://club-de-pescadores.vercel.app`, sin barra final. No subir el archivo `.env.local` al repositorio.
5. Ejecutar `npm run check` y `npm audit --omit=dev`. Desplegar el código completo del repositorio, incluido `vercel.json`, mediante el proyecto Vercel existente. El build es `npm run build`, la salida es `dist/` y Node es 24.
6. Verificar la versión publicada: inicio, `/noticias`, `/eventos`, navegación móvil, errores de red, `/robots.txt`, `/sitemap.xml`, `/og-image.webp` y cabeceras CSP. Revisar en navegador la consola y la pestaña de red; comprobar que las consultas van al proyecto Supabase correcto.

Si se usa el SQL Editor como alternativa al mecanismo de migraciones, ejecutar el archivo completo una sola vez y registrar después esa versión como aplicada con la CLI antes de introducir nuevas migraciones. No ejecutar `db reset` sobre la base remota.

## Qué protege el despliegue

- El build falla si falta la configuración pública. No hay un modo de demostración en producción ni se sustituye un error remoto por fixtures.
- Vercel tiene reescrituras de SPA, CSP con origen de Supabase explícito, hash del JSON-LD, protección contra frames, `nosniff`, política de referrer y permisos restringidos.
- Los assets con hash usan caché de un año. Las páginas usan revalidación. Los datos se cachean temporalmente con TanStack Query.
- Se generan sitemap, robots, Open Graph e imagen social durante el build. La generación verifica que la CSP coincida con el JSON-LD y el origen de Supabase. Si cambia el dominio o el proyecto, actualizar también `vercel.json`.
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
