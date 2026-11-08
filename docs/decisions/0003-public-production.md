# 0003 — Sitio público con consultas reales y despliegue verificable

Estado: implementado y probado localmente; migración y publicación remotas pendientes de acceso a las cuentas.

## Decisión

Reemplazar los adaptadores de demostración por consultas reales a Supabase. La primera migración define únicamente `events`, `news` y `pool_rates`, que respaldan las secciones existentes. No crea un modelo administrativo todavía no aprobado ni publica datos ficticios.

La lectura pública está limitada mediante privilegios de PostgreSQL y RLS. Las escrituras desde `anon` y `authenticated` se deniegan por operación; un claim de rol en el navegador no concede permisos administrativos. En esta versión el propietario gestiona contenido mediante el acceso confiable de Supabase.

Se agrega Zod para validar datos externos y cursores, como indican las reglas del proyecto. Se agrega PGlite como dependencia de desarrollo para ejecutar las migraciones y probar RLS en PostgreSQL sin Docker en este equipo. Las dependencias anteriores no permitían probar SQL ni validar las nuevas respuestas externas.

Los tipos se generan por introspección de las migraciones aplicadas en PostgreSQL local. El generador es deliberadamente limitado a los tipos de las tres tablas actuales y falla ante un tipo desconocido. Verifica el esquema local; no afirma que la migración esté aplicada en Supabase ni sustituye la comparación con tipos generados desde el proyecto remoto.

Se agregan páginas paginadas por cursor para los enlaces de noticias y eventos. Cada página trae hasta doce filas y solo mantiene esas doce en la interfaz. Las claves incluyen el cursor y los filtros. El orden tiene desempate por UUID para no repetir ni omitir registros con la misma fecha.

Vercel es el hosting confirmado por el usuario. `vercel.json` configura el proyecto existente, las rutas y las cabeceras. La preparación de metadatos verifica el hash CSP del JSON-LD. El build exige variables públicas y la comprobación remota se ejecuta mediante un comando separado.

## Consecuencias

Los estados vacíos son reales mientras no haya publicaciones. Las fallas de red se muestran como errores recuperables. No hay un fallback a fixtures ni funcionalidades representadas por botones de «próximamente».

La verificación local cubre políticas y privilegios de los roles públicos, pero no las diferencias de configuración del Supabase alojado, su Security Advisor ni un despliegue que aún no se ha ejecutado. Esos estados se informan explícitamente.
