# Supabase

El proyecto usa el SDK oficial de Supabase. Las consultas están implementadas en `src/features/*/api/`; los componentes acceden a ellas mediante hooks y TanStack Query. No existe un fallback a fixtures en la aplicación.

## Configuración

Copiá `.env.example` a `.env.local` y completá:

```dotenv
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_TU_CLAVE_PUBLICA
VITE_SITE_URL=https://club-de-pescadores.vercel.app
```

El proyecto elegido es `rjzmcwfwfxtktuleqzgf`; su configuración pública está guardada localmente en un archivo ignorado por Git. Los mismos valores deben configurarse en el entorno Production de Vercel antes de desplegar.

Las variables `VITE_*` son públicas. Se usa la clave `publishable` para el navegador, según la [documentación oficial](https://supabase.com/docs/guides/getting-started/api-keys). Nunca colocar una contraseña de Postgres, `sb_secret_*`, `service_role` o token de CLI en esas variables. El validador exige URL HTTPS y clave pública; permite HTTP en loopback para desarrollo local. No expone valores ingresados en los errores.

## Esquema inicial

La migración `supabase/migrations/202611080001_public_content.sql` crea:

| Tabla        | Uso                                        | Acceso desde navegador                             |
| ------------ | ------------------------------------------ | -------------------------------------------------- |
| `events`     | Eventos con fecha/hora absoluta y lugar    | Leer publicaciones sin borrado lógico              |
| `news`       | Noticias con imagen y fecha de publicación | Leer publicaciones no futuras y sin borrado lógico |
| `pool_rates` | Tarifas en centavos de ARS y condiciones   | Leer tarifas publicadas y vigentes                 |

Todas tienen restricciones, claves UUID, marcas `timestamptz`, actualización automática de `updated_at`, índices de consulta y RLS. Las operaciones `INSERT`, `UPDATE` y `DELETE` están denegadas para `anon` y `authenticated` tanto por privilegios como por políticas explícitas. Los borradores no son visibles.

Un claim de administrador no habilita escrituras. Después de aprobar la matriz se agregaron las migraciones administrativas: las operaciones del panel usan RPC que verifican permisos vigentes y MFA, con auditoría transaccional. Las escrituras directas siguen revocadas. Ver `admin.md` para activar esta etapa.

La migración está versionada y probada localmente; debe aplicarse en el proyecto Supabase mediante una cuenta autorizada. La clave pública permite consultar contenido, no crear tablas. La guía de [producción](production.md) detalla la activación y el registro de la migración.

## Cliente y validación

`src/lib/supabase/connection.ts` crea de forma diferida una única instancia tipada con `Database`. El cliente público no persiste sesiones, no renueva tokens ni procesa callbacks de autenticación. El cliente de `admin-client.ts`, cargado solo con `/admin`, mantiene una sesión independiente y procesa las invitaciones y recuperación de contraseña. Las funciones administrativas exigen cuenta activa, permisos y AAL2.

Las consultas seleccionan columnas explícitas, filtran y ordenan en Postgres y aplican un límite máximo de 50. Los archivos de noticias y eventos usan páginas de doce filas con cursor por fecha y UUID. Los cursores y respuestas externas se validan con Zod antes de mostrarlos. El `AbortSignal` de la consulta se combina con un timeout de doce segundos.

Las tarifas se convierten desde centavos a ARS solo para su presentación. No hay una integración de pagos; cualquier futura operación de cobro debe calcularse y validarse en el servidor.

## Tipos y pruebas

```bash
npm run db:types
npm run db:types:check
npm test
npm run production:check
```

Los primeros dos comandos aplican las migraciones en PostgreSQL aislado mediante PGlite y generan/verifican `src/lib/supabase/database.types.ts` por introspección. Los tipos reflejan ese esquema aplicado, sin inventar la existencia de tablas remotas. Después de migrar Supabase, compararlos con los tipos generados desde el proyecto mediante la [CLI oficial](https://supabase.com/docs/guides/api/rest/generating-types).

Las pruebas ejecutan las políticas como anónimo, socio y administrador autenticado, comprueban la denegación de escrituras y el acceso confiable de servicio, validan restricciones y verifican la paginación con fechas repetidas.

`production:check` realiza lecturas reales de una fila como máximo por tabla usando la clave pública. Debe fallar si faltan tablas, columnas, conectividad o permisos de lectura. No sustituye la inspección de RLS, Security Advisor, backups ni planes de consulta del entorno alojado.
