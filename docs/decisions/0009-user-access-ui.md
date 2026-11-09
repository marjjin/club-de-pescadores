# Usuarios, invitaciones y gestión de acceso

El listado administrativo usa filas adaptables con correo completo, estado activo/desactivado, cantidad de roles con singular/plural y una identificación de la cuenta propia. En esa cuenta se ofrece el acceso a «Mi cuenta» y se explica que otro administrador debe modificar sus roles o estado. La búsqueda conserva el filtro de prefijo en el servidor; limpiar y actualizar son acciones explícitas. Los contadores describen únicamente la página actual, sin consultas masivas ni totales simulados. La paginación aparece cuando hay otra página o se debe volver a una anterior.

Invitar y gestionar acceso comparten un editor con secciones de correo, roles y estado, y un resumen lateral. Los roles se consultan por cursor, con búsqueda por prefijo; las selecciones se conservan entre páginas y se limitan a diez. Buscar roles con Enter y cambiar de página no envían el formulario. El alcance completo del administrador general y la indisponibilidad actual de otros paneles quedan visibles.

Los errores se muestran junto a los controles y se enfoca el primer campo inválido. El editor protege cambios sin guardar al volver o cerrar la página, bloquea envíos repetidos y requiere confirmación para invitar, guardar permisos o desactivar. Tras el éxito se muestra una confirmación separada, conservando las advertencias devueltas por el servidor. Los errores de red no borran lo cargado.

Se mantienen las RPC y la Edge Function de usuarios, los permisos reservados, MFA, auditoría, versiones y la protección del último administrador general. No cambia el esquema ni los contratos del servidor; no requiere nuevas migraciones, dependencias o paneles.

Se prueban validación, navegación de roles sin envío accidental, selección entre páginas, límite de diez, confirmación y desactivación, bloqueo de cambios propios, recuperación de errores, advertencias, búsquedas y estados del listado. La verificación visual en un navegador real se registra por separado de las pruebas DOM y de la compilación.
