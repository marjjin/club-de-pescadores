# Arquitectura

El proyecto es una SPA pública modular con consultas a Supabase y un esquema versionado para eventos, noticias y tarifas. La aplicación de las migraciones en el proyecto alojado y la publicación en Vercel se verifican por separado; compilar el frontend no certifica esos estados.

## Capas y responsabilidades

```text
src/
  main.tsx                  # Montaje de React y estilos
  app/
    App.tsx                 # Providers y navegador
    Providers.tsx           # Caché y manejo global de errores
    routes.tsx              # Registro central de rutas con carga diferida
    config/navigation.ts    # Navegación de la aplicación
    layout/                 # Header, Footer y layout público
    styles/                 # Entrada de Tailwind, tokens y estilos base
  pages/
    home/                   # Composición de secciones de inicio
    news/                   # Archivo paginado de noticias
    events/                 # Calendario paginado
    not-found/              # Recuperación de enlaces inexistentes
  features/
    events/                 # Cada módulo expone su index.ts
      api/                  # Consultas, claves y adaptador de datos
      components/           # Interfaz de la funcionalidad
      hooks/                # Integración entre interfaz y consultas
      schemas/              # Validación Zod de respuestas y cursores
      types.ts              # Contratos de la funcionalidad
      index.ts              # API pública
    facilities/             # Contenido estático de instalaciones
    hero/
    membership/
    news/
    pool/
  shared/
    assets/                 # Recursos visuales usados por varios módulos
    config/club.ts          # Identidad y contacto públicos ya existentes
    hooks/                  # Comportamientos reutilizables
    lib/                    # Fechas, límites y utilidades puras
    ui/                     # Componentes sin decisiones de negocio
  lib/
    query/                  # Infraestructura de caché
    supabase/               # Cliente compartido, configuración y tipos del esquema
  test/                     # Fixtures y preparación de pruebas
supabase/
  migrations/               # Esquema, índices, triggers y políticas RLS
scripts/
  db/                       # Pruebas PostgreSQL y generación de tipos locales
  production/               # Validación de entorno, lectura remota y metadatos
  eslint/                   # Regla de arquitectura y sus pruebas
  images/                   # Procesamiento independiente de fotos, logo y hero
  optimize-images.mjs       # Entrada CLI
```

`app` puede usar todas las capas. `pages` puede usar funcionalidades, utilidades e integraciones; no depende de `app`. Las funcionalidades pueden usar `shared`, `lib` y APIs públicas de otras funcionalidades. `shared` solo depende de sí misma y de paquetes externos. `lib` puede usar utilidades compartidas, pero no componentes, hooks ni recursos visuales.

ESLint verifica esta dirección, los accesos por `index.ts` y la separación entre componentes, hooks y datos para imports estáticos, reexports e imports dinámicos literales. También detecta llamadas directas a `fetch` e imports de Supabase fuera de `api/` en las funcionalidades. Estas reglas previenen errores frecuentes; no sustituyen una revisión de diseño ni detectan todas las formas posibles de acceso remoto o ciclos.

La identidad pública está en `shared/config/club.ts` porque la consumen funcionalidades y layout. Es configuración estática; no debe contener permisos, estado de sesión ni reglas de negocio. La navegación pertenece exclusivamente a `app`.

## Flujo de datos

```text
Componente → hook → opciones de consulta → api → cliente Supabase → Postgres/RLS
                                           ↓
                                validación y mapeo al dominio
```

Las funciones `getUpcomingEvents`, `getLatestNews` y `getPoolRates` reciben solicitudes tipadas con `limit` y `signal`; eventos además recibe `from`. Seleccionan columnas explícitas, filtran y ordenan en el servidor, validan las respuestas con Zod y las mapean a tipos de dominio. Las consultas guardan sus parámetros en la clave de caché para no mezclar resultados de fechas o tamaños diferentes.

Eventos y noticias usan una vigencia de cinco minutos; tarifas, una hora. Cada montaje de la aplicación tiene su propio `QueryClient`. Los estados de carga, vacío, error recuperable y contenido previo ante fallos de actualización están centralizados en `QueryBoundary`.

Las secciones de inicio solicitan un resumen de hasta tres filas. Los archivos de noticias y eventos usan páginas de doce elementos con cursores validados, desempate por UUID y botones anterior/siguiente. Solo se muestran los elementos de la página activa; no se descargan tablas completas. Toda solicitud tiene límite máximo de cincuenta y timeout de doce segundos. Las fixtures están limitadas a las pruebas.

Las fechas de calendario (`YYYY-MM-DD`) se muestran sin desplazarlas de día. La fecha de referencia de los próximos eventos se calcula en `America/Argentina/Buenos_Aires`.

## Cómo agregar una funcionalidad

1. Creá `src/features/<name>/` con los archivos que realmente necesite.
2. Definí sus tipos y, si recibe datos externos o formularios, esquemas de validación.
3. Implementá el acceso a datos en `api/`, sin importar componentes o hooks.
4. Definí claves de consulta con todos los filtros y parámetros. Pasá el `AbortSignal` al cliente remoto.
5. Conectá la UI mediante hooks y contemplá carga, vacío, error y éxito.
6. Exportá solo lo que otros módulos necesiten desde `index.ts`.
7. Componé la funcionalidad en una página. Las nuevas rutas se registran en `app/routes.tsx` y se cargan de forma diferida.
8. Probá el comportamiento y ejecutá `npm run check`. Si cambia el esquema, agregá una migración, generá tipos con `npm run db:types` y probá RLS antes de aplicarla al entorno remoto.

Usá `@/features/news` desde otros módulos y `../api/queries` dentro del módulo. Evitá barrels globales de `shared` que unan dependencias de todo el sitio. Extraé una abstracción cuando exista duplicación real.

## Incorporación de backend y administración

- Supabase es la base de datos. Su configuración, cliente compartido y tipos viven en `src/lib/supabase`. La migración inicial está probada en PostgreSQL aislado; `npm run production:check` verifica por separado la lectura de las tablas alojadas.
- Los tipos se generan de las migraciones locales aplicadas. Compararlos con los tipos del proyecto Supabase después de migrar. Validar nuevas respuestas y formularios; la autorización efectiva debe vivir en RLS, RPC o funciones del servidor.
- El acceso del navegador es de lectura de publicaciones; las escrituras se gestionan mediante el propietario en Supabase hasta implementar el panel. Verificar RLS, Security Advisor y planes de consulta en el proyecto remoto.
- Aprobar primero la matriz de roles y permisos prevista en `CLAUDE.md` antes de crear tablas de administración.
- Implementar el panel en una ruta diferida bajo `/admin`, con layout propio, para mantener su código fuera del sitio público.
- El hosting confirmado es Vercel; `vercel.json` contiene rutas y cabeceras. Seguir `docs/production.md` para activar esta versión en el proyecto existente.

Los formularios, autenticación y panel todavía no existen. Sus pruebas se incorporarán con esas funcionalidades. El build requiere URL de Supabase, clave pública y origen del sitio; no se permite publicar un build sin configuración.
