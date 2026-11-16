# Retirar los roles operativos de pileta y portería

Fecha: 16 de noviembre de 2026.

## Alcance confirmado

El propietario pidió retirar los roles «Control de pileta» y «Portería» que aparecen en Roles y en la asignación de usuarios. Aclaró expresamente que la sección de temporada y tarifas de pileta debe conservarse.

Se retiran del catálogo administrativo los permisos operativos `pileta.*`, `porteria.*` y `portería.*`. La sección de tarifas, su editor de temporadas, sus importes, la tarjeta del resumen, los permisos `tarifas.*` y la sección pública de pileta conservan su funcionamiento.

## Catálogo y datos existentes

La migración `202611160001_retire_pool_gate_roles.sql` excluye los permisos operativos retirados del catálogo y del contexto de sesión. Los roles dedicados exclusivamente a esos módulos se excluyen de los listados antes de ordenar y paginar en Postgres; así no se generan páginas vacías ni se pierde el cursor por filtrar en el navegador. Se conservan el rol general protegido, los roles sin permisos y los roles que también otorgan permisos de módulos vigentes, incluidas tarifas.

Los roles mixtos muestran y editan sus permisos vigentes. El servidor conserva los permisos retirados que ya tenían y rechaza incorporar otros nuevos desde el panel. Los roles retirados tampoco se pueden asignar a nuevas cuentas. Las asignaciones existentes se mantienen al editar un usuario, aunque el rol ya no aparezca como opción en el selector. Su identificador sigue formando parte de la selección y del máximo de diez roles. La comprobación de permisos del administrador delegado sigue vigente para todas las asignaciones.

No se borran tablas, tarifas, roles, permisos, usuarios, asignaciones ni registros de auditoría. La migración no revoca permisos de otros sistemas ni cambia `has_permission`: el alcance es el catálogo de roles y permisos que gestiona este panel.

## Activación y verificación

La migración debe aplicarse en el proyecto Supabase para completar el retiro de los roles remotos. Cambiar el frontend local no modifica por sí solo el catálogo alojado. La clave pública permite usar la aplicación, pero no instalar una migración.

Las pruebas locales cubren visibilidad del catálogo, búsqueda y paginación con roles retirados, conservación de roles mixtos y asignaciones existentes, rechazo de nuevas asignaciones retiradas, permisos y MFA. También comprueban que la gestión de tarifas y su resumen siguen disponibles.

Ejecutar `npm run check` y, tras aplicar la migración en el entorno alojado, verificar con una sesión administrativa los listados de Roles y el selector de Usuarios. `npm run production:check` comprueba por separado que el contenido público sigue disponible.
