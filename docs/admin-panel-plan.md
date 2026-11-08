# Panel de administrador general

Estado: matriz aprobada expresamente por el propietario el 8 de noviembre de 2026. Implementación local en `/admin`; activación remota pendiente. Seguir [la guía de administración](admin.md) para instalar el esquema, desplegar la función y crear la primera cuenta. No volver a pedir aprobación de esta misma matriz.

## Alcance de esta etapa

El administrador general gestiona el contenido que ya existe en el sitio y administra los accesos del equipo. Puede crear roles personalizados combinando permisos del catálogo del sistema. Crear un rol no crea automáticamente nuevas funcionalidades ni un nuevo panel.

Los paneles de otros perfiles se implementarán únicamente cuando el propietario lo indique. Esta etapa no incluye socios, cuotas, pagos, reservas ni contabilidad: todavía no tienen modelo de datos ni requisitos aprobados.

## Matriz propuesta

| Perfil                                           | Contenido                            | Usuarios                                    | Roles y permisos                                         | Auditoría                  |
| ------------------------------------------------ | ------------------------------------ | ------------------------------------------- | -------------------------------------------------------- | -------------------------- |
| Administrador general (`super_admin`, protegido) | Todas las acciones                   | Invitar, asignar acceso y desactivar        | Crear y modificar roles personalizados; asignar permisos | Consultar                  |
| Rol personalizado                                | Solo permisos asignados              | Sin administración de accesos en esta etapa | Sin administración de accesos                            | Solo con permiso explícito |
| Cuenta sin rol activo                            | Sin acceso administrativo            | Ninguno                                     | Ninguno                                                  | Ninguno                    |
| Visitante                                        | Solo publicaciones del sitio público | Ninguno                                     | Ninguno                                                  | Ninguno                    |

Solo el administrador general administra accesos. Los permisos correspondientes son reservados y no se pueden otorgar a roles personalizados en esta etapa. El administrador general puede designar a otro administrador general, con confirmación y registro de auditoría.

### Catálogo inicial de permisos

| Permiso              | Acción                                            |
| -------------------- | ------------------------------------------------- |
| `noticias.ver`       | Consultar publicaciones, borradores y papelera    |
| `noticias.editar`    | Crear y modificar borradores y contenido          |
| `noticias.publicar`  | Publicar, programar y retirar publicaciones       |
| `noticias.archivar`  | Enviar a papelera o restaurar                     |
| `eventos.ver`        | Consultar publicaciones, borradores y papelera    |
| `eventos.editar`     | Crear y modificar eventos                         |
| `eventos.publicar`   | Publicar y retirar eventos                        |
| `eventos.archivar`   | Enviar a papelera o restaurar                     |
| `tarifas.ver`        | Consultar tarifas, borradores y vigencias         |
| `tarifas.editar`     | Crear y modificar precios y condiciones           |
| `tarifas.publicar`   | Publicar y retirar tarifas                        |
| `tarifas.archivar`   | Enviar a papelera o restaurar                     |
| `auditoria.ver`      | Consultar actividad administrativa                |
| `usuarios.gestionar` | Invitar, desactivar y asignar roles; reservado    |
| `roles.gestionar`    | Crear y modificar roles y sus permisos; reservado |

La interfaz explicará las dependencias entre permisos. Para editar, publicar o archivar se requiere también lectura del módulo. Modificar contenido que ya está publicado requiere permiso de publicación para evitar eludir la revisión. Una cuenta no puede elevar sus propios permisos.

## Pantallas y funciones

1. **Acceso:** ingreso por correo y contraseña, aceptación de invitaciones, recuperación de contraseña, segundo factor obligatorio y cierre de sesión. No habrá registro público de administradores.
2. **Inicio:** resumen real de publicaciones, borradores y actividad reciente mediante consultas acotadas y agregaciones del servidor. Sin indicadores inventados.
3. **Noticias:** listado con filtros y paginación, alta, edición, imagen, texto alternativo, vista previa, publicación programada y papelera.
4. **Eventos:** listado con filtros y paginación, alta, edición, fecha y hora de Argentina, lugar, publicación y papelera.
5. **Tarifas:** alta, edición, importes en pesos, condiciones y vigencia, publicación y papelera. No procesa cobros.
6. **Usuarios:** invitación por correo, estado del acceso, roles asignados y desactivación con confirmación. Nunca muestra contraseñas o tokens.
7. **Roles:** creación y edición de roles personalizados, selección de permisos y consulta de usuarios asignados. El rol general está protegido. No se elimina un rol con usuarios asignados sin resolver esas asignaciones.
8. **Auditoría:** registro paginado de quién realizó cada cambio, cuándo y sobre qué recurso. No permite editar ni borrar registros desde el panel.
9. **Mi cuenta:** cambio de contraseña y gestión segura de la sesión y del segundo factor.

## Arquitectura prevista

- Ruta `/admin/*` con carga diferida y layout independiente del sitio público.
- Funcionalidad en `src/features/admin/`, organizada en componentes, hooks, API, esquemas y tipos; subdivisiones según tamaño real.
- Cliente autenticado independiente del cliente público, evitando que las consultas anónimas reutilicen una sesión administrativa.
- Caché de consultas administrativas vinculada al usuario y eliminada al cerrar sesión o cambiar de cuenta.
- Catálogo de permisos centralizado y comprobación en la base de datos. Las guardas de rutas no sustituyen RLS.
- Tablas previstas: `roles`, `permissions`, `role_permissions`, `user_roles`, estado de acceso administrativo y `audit_logs`. Se crearán mediante migración después de aprobar la matriz.
- Funciones transaccionales para modificar roles, asignaciones y estados, con protección concurrente del último administrador general activo.
- Verificación de usuario activo, permisos vigentes y MFA en cada operación administrativa. No confiar en `user_metadata` ni en una lista de permisos almacenada únicamente en el navegador.
- Invitaciones mediante una función de servidor con autorización verificada; nunca exponer la clave de servicio en Vite.
- Desactivar un usuario revoca su acceso en la base de datos inmediatamente, incluso con un token emitido previamente. La revocación de sesiones de Auth complementa esta medida.
- Auditoría generada en el servidor, con datos relevantes y sin contraseñas, tokens ni secretos de MFA.
- Imágenes de noticias en Storage con políticas y límites de tamaño y tipo; conservar compatibilidad con las URL HTTPS actuales.

## Activación en Supabase

La configuración pública existente no permite instalar migraciones, desplegar funciones ni crear la primera cuenta privilegiada. La implementación local y la activación remota se verificarán por separado.

Antes de habilitar el panel en producción será necesario:

1. Aprobar la matriz y aplicar las nuevas migraciones versionadas mediante un acceso autorizado.
2. Configurar las URL de retorno, correo de invitaciones y recuperación, restricciones de registro, límites de autenticación y MFA.
3. Desplegar la función de invitación y configurar los secretos únicamente en el servidor.
4. Crear o invitar la primera cuenta a un correo real indicado por el propietario y asignarle el rol general mediante un procedimiento confiable de instalación. No usar una ruta pública para convertirse en administrador.
5. Completar el segundo factor y verificar el flujo real de ingreso, invitación, edición, publicación, roles y desactivación.

## Criterios de aceptación

- Visitantes y usuarios sin permiso no pueden leer datos privados ni escribir mediante llamadas directas a la API.
- El rol general puede completar los flujos descritos; los roles personalizados no pueden usar permisos no asignados.
- Se rechazan operaciones administrativas sin segundo factor y operaciones de cuentas desactivadas.
- No es posible eliminar, desactivar ni quitar el rol al último administrador general activo, tampoco con solicitudes concurrentes.
- Crear, editar, publicar, archivar y restaurar deja evidencia en auditoría.
- Las acciones destructivas muestran confirmación. Los errores se presentan en español y no exponen respuestas sensibles.
- Listados paginados en servidor, validación de formularios y servidor, cancelación de consultas y estados de carga, error y vacío.
- Pruebas de autorización, restricciones, sesiones y flujos administrativos; `npm run check` y verificación remota antes de declarar producción lista.

Referencias: [MFA de Supabase](https://supabase.com/docs/guides/auth/auth-mfa), [invitaciones](https://supabase.com/docs/reference/javascript/auth-admin-inviteuserbyemail) y [URL de retorno](https://supabase.com/docs/guides/auth/redirect-urls).
