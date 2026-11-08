# Club de Pescadores San Nicolás

Sitio público en React y TypeScript, organizado por funcionalidades y conectado mediante consultas a Supabase. Incluye migración de contenido público, políticas RLS y configuración para el Vercel existente. La activación remota se verifica por separado del build local. Autenticación y panel administrativo todavía no están implementados.

## Desarrollo

Requiere Node.js 24 (24.11 o superior dentro de esa versión mayor) y npm.

```bash
npm ci
npm run dev
```

Copiá `.env.example` a `.env.local` y completá `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_SITE_URL`. Reiniciá el servidor de desarrollo después de modificarlas. Antes de activar el sitio, aplicá la migración de `supabase/migrations/` en el proyecto Supabase y verificá la lectura con `npm run production:check`. El build falla si falta configuración; no utiliza datos ficticios como alternativa.

Cualquier variable `VITE_*` es pública. La clave debe ser `sb_publishable_*`; las claves secretas, `service_role` y la contraseña de Postgres pertenecen exclusivamente al servidor.

## Comandos

| Comando                                | Propósito                                             |
| -------------------------------------- | ----------------------------------------------------- |
| `npm run dev`                          | Servidor de desarrollo                                |
| `npm run check`                        | Formato, lint, tipos, pruebas y build                 |
| `npm run lint`                         | Calidad de código y límites de arquitectura           |
| `npm run typecheck`                    | TypeScript estricto                                   |
| `npm run db:types`                     | Generar tipos desde migraciones locales aplicadas     |
| `npm run db:types:check`               | Verificar que los tipos correspondan al esquema local |
| `npm run production:check`             | Comprobar lectura de las tablas en Supabase real      |
| `npm test`                             | Pruebas de lógica, estados, rutas y herramientas      |
| `npm run test:watch`                   | Pruebas durante desarrollo                            |
| `npm run format`                       | Aplicar formato                                       |
| `npm run format:check`                 | Verificar formato                                     |
| `npm run build`                        | Generar `dist/`                                       |
| `npm run preview`                      | Revisar el build localmente                           |
| `npm run images:optimize -- <carpeta>` | Regenerar imágenes desde los originales               |

La herramienta de imágenes requiere los originales `2.png`, `3.png`, `4.png`, `6.png`, `7.png`, `8.png`, `9.png` y `10.jpg`. La reconstrucción del hero está adaptada al boceto original. No hace falta ejecutarla para desarrollar o compilar.

## Organización

```text
src/app       → Arranque, rutas, providers, layout y estilos globales
src/pages     → Composición de páginas
src/features  → Eventos, noticias, pileta, instalaciones, hero y asociación
src/shared    → UI, utilidades, configuración pública y recursos reutilizables
src/lib       → Integraciones e infraestructura
```

La dirección de dependencias es `app → pages → features → shared/lib`. Cada funcionalidad expone un `index.ts`; ESLint impide acceder desde afuera a sus archivos internos. Dentro de una funcionalidad, los componentes usan hooks y los hooks acceden a datos mediante `api/`.

Las consultas usan claves por parámetros, caché con vigencia explícita, cancelación, timeout y límites de hasta 50 resultados. El filtrado, orden y paginación por cursor se ejecutan en Postgres. Zod valida las respuestas y los cursores. Las fixtures solo se usan en pruebas.

- [Guía de arquitectura y ampliación](docs/architecture.md)
- [Configuración e integración de Supabase](docs/supabase.md)
- [Activación y verificación de producción en Vercel](docs/production.md)
- [Decisiones y dependencias incorporadas](docs/decisions/0001-modular-architecture.md)
- [Reglas del producto](CLAUDE.md)
- [Instrucciones de mantenimiento](AGENTS.md)

## Verificación y publicación

GitHub Actions ejecuta `npm ci`, `npm run check` y una auditoría de dependencias de producción. Las pruebas cubren consultas HTTP, validación de datos, paginación, fechas de Argentina, recuperación de errores, rutas, menú móvil, límites de módulos, procesamiento de imágenes y privilegios/RLS en PostgreSQL aislado. No requieren acceso a una cuenta real para ejecutar pruebas locales.

`vercel.json` configura las rutas SPA, CSP y demás cabeceras. El build se entrega en `dist/` y genera sitemap, robots, JSON-LD e imagen social. Las fotos y el teléfono están confirmados; el correo ficticio fue retirado. Antes de publicar hay que aplicar y verificar la migración remota, configurar las variables de Production en Vercel y revisar el sitio en navegador. Las tarifas y publicaciones deben cargarse con datos reales en Supabase.

El acceso del navegador es de lectura de contenido publicado. El propietario puede gestionar contenido desde el Table Editor de Supabase. Un panel propio requiere la matriz de permisos aprobada, Auth, MFA y sus pruebas antes de habilitar escrituras.
