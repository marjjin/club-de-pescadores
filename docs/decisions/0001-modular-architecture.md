# 0001 — Módulos por funcionalidad y límites verificables

Estado: aceptada para el frontend del boceto.

## Contexto

El sitio ya separaba secciones en funcionalidades, pero el layout de aplicación vivía en `shared`, las funciones de acceso a datos contenían fixtures y la composición de inicio estaba acoplada a `App`. Faltaban pruebas, documentación propia y controles automáticos de arquitectura.

## Decisión

- Conservar React, TypeScript, Vite, Tailwind y TanStack Query.
- Separar composición (`pages`), arranque y layout (`app`), funcionalidades (`features`), elementos reutilizables (`shared`) e integraciones (`lib`).
- Mantener funciones de acceso a datos por funcionalidad. El adaptador local puede sustituirse dentro de `api/` sin modificar componentes o hooks. No introducir un contenedor de inyección, repositorios genéricos ni un backend simulado.
- Exponer cada funcionalidad y página por su `index.ts` y verificar sus límites con una regla local de ESLint. La regla usa el resolvedor de rutas de Node para reconocer tanto imports relativos como el alias `@/`.
- Activar lint con información de tipos, comprobación de accesos indexados y propiedades opcionales exactas.
- Incorporar React Router para rutas y recuperación de URLs desconocidas, con carga diferida por página. Se implementa según su [documentación oficial](https://reactrouter.com/start/declarative/installation).
- Incorporar Vitest y Testing Library con jsdom para comprobar consultas, navegación, estados y utilidades sin depender de un servicio remoto. Son herramientas específicas que no cubren las dependencias anteriores; jsdom se mantiene en una versión compatible con Node 24.11.
- Usar `@types/node` para configuración y herramientas ejecutadas en Node. Las nuevas herramientas de prueba se mantienen como dependencias de desarrollo.
- Ejecutar el mismo comando de calidad en local y CI. El lint tipado sigue la [configuración recomendada por typescript-eslint](https://typescript-eslint.io/getting-started/typed-linting/).
- Dividir la herramienta de imágenes por responsabilidad, conservando los nombres y formatos de salida y verificándolos con entradas sintéticas.

## Consecuencias

Es posible incorporar nuevas páginas y funcionalidades con límites claros y verificables. Las rutas pueden separar el código de un futuro panel. Las pruebas usan adaptadores locales y cachés independientes.

La separación agrega algunos archivos y React Router incrementa el JavaScript común. El presupuesto de 200 KB comprimidos debe revisarse con cada build y medirse en condiciones reales; dividir por rutas no garantiza por sí mismo mejores métricas de carga.

La estructura no proporciona escalabilidad del backend, permisos ni seguridad de producción. Esas capacidades requieren implementación, pruebas y mediciones reales.

## Auditoría de dependencias

Durante esta refactorización, `npm audit --omit=dev` no reportó vulnerabilidades. La auditoría completa detectó diez alertas moderadas transitivas de desarrollo por `minimatch` (GHSA-g3hv-75wg-m249). Las dependencias consumidoras todavía exigen la versión mayor 10 y el aviso indica corrección en 11; no se fuerza una versión mayor ni una degradación automática del toolchain. Revisar este estado antes del despliegue y actualizar cuando exista una solución compatible validada.
