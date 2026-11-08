# Club de Pescadores — instrucciones de mantenimiento

Leé `CLAUDE.md` para las reglas del producto y `docs/architecture.md` para el diseño actual.
El sitio público consulta Supabase desde `api/` con tipos generados de las migraciones y validación Zod. El esquema local está en `supabase/migrations`; su aplicación remota y el despliegue se verifican por separado. El panel general está implementado localmente en `/admin`, con Auth, TOTP y RPC; su activación remota se documenta en `docs/admin.md`.

- La matriz de `docs/admin-panel-plan.md` fue aprobada expresamente el 8 de noviembre de 2026. No volver a solicitar la misma aprobación. No desarrollar paneles de otros perfiles sin un nuevo pedido.
- Conservá la dirección `app → pages → features → shared/lib`. `shared` no importa lógica de funcionalidades y `lib` no importa UI.
- Organizá cada funcionalidad en `src/features/<name>` y exponé su API pública mediante `index.ts`. No importes archivos internos de otro módulo.
- Las páginas componen funcionalidades; los layouts públicos viven en `src/app/layout`. Un futuro panel tendrá layout propio.
- Usá `@/` para imports entre módulos e imports relativos dentro del mismo módulo.
- Los componentes usan hooks; los hooks usan `api/`; solo `api/` accede a servicios remotos. Las fixtures solo se usan en pruebas; no agregues un fallback silencioso a datos ficticios. El contenido estático de presentación puede vivir en `content.ts`.
- Cada consulta define claves con todos sus parámetros, `staleTime` y `AbortSignal`. Limitá los listados a 50 elementos. Con backend, filtrá, ordená y paginá en el servidor.
- Para Supabase, seguí `docs/supabase.md`: usá tipos generados del esquema, una instancia pública compartida y claves `publishable` en el frontend. No habilites escrituras sin migraciones y RLS verificadas. Los tipos actuales se generan de las migraciones locales aplicadas en PostgreSQL; verificá el esquema remoto antes de desplegar.
- Agregá carpetas, dependencias y abstracciones cuando haya una necesidad concreta. No crees módulos vacíos ni implementaciones ficticias de seguridad.
- Código en inglés; interfaz y documentación en español. No inventes datos del club ni reemplaces los existentes durante una refactorización.
- El usuario autorizó las fotos actuales y confirmó el teléfono. El correo del boceto era ficticio y fue retirado: no agregues un correo hasta recibir uno oficial ni vuelvas a pedir autorización por las fotos ya confirmadas.
- Documentá cambios importantes en `docs/decisions/`. Agregá pruebas para lógica y flujos afectados.
- Antes de terminar ejecutá `npm run check`. Para producción ejecutá además `npm run production:check`, que consulta las tablas remotas con la clave pública. No declares un despliegue terminado sin verificarlo. No hagas commit ni push sin pedido explícito.
