# ADR 0004: administración general con permisos verificados en Supabase

Fecha: 2026-11-08. Estado: implementación local sobre matriz aprobada expresamente; activación remota pendiente.

## Decisión

Crear únicamente el panel general bajo `/admin/*`. Los administradores definen roles mediante un catálogo de permisos del sistema; crear un rol no crea una funcionalidad ni autoriza el desarrollo de otros paneles. El rol general protegido conserva la gestión de usuarios y roles.

El frontend administrativo se carga de forma diferida y usa un cliente de Auth independiente. Las cuentas requieren invitación y TOTP. Las comprobaciones de `has_permission` consultan roles y estado activo en la base de datos, además de AAL2, sin confiar en roles enviados desde el navegador o en `user_metadata`.

Las tablas no conceden escritura directa a cuentas del navegador. Los RPC validan permisos, aplican restricciones y disparan auditoría en la misma transacción. Los cambios de acceso usan un bloqueo transaccional común; se vuelven a verificar los permisos después de adquirirlo. No se permite modificar el acceso propio ni dejar el último administrador inactivo. Los cambios de contenido verifican `updated_at` para detectar ediciones concurrentes.

El servicio de invitación verifica la sesión antes de usar credenciales privilegiadas. Los secretos quedan en Edge Functions. La desactivación bloquea las operaciones de base de datos incluso si el cliente aún conserva un JWT emitido antes del cambio.

El propietario pidió permitir cambiar su correo de acceso. Se utiliza el flujo de confirmación de Auth, con cambio seguro de correo habilitado. Una migración independiente sincroniza únicamente el correo confirmado con la cuenta administrativa y mantiene el UUID, estado y permisos. La dirección personal inicial queda en un archivo local ignorado por Git, fuera de la configuración pública del club.

## Consecuencias

- Requiere migraciones, configuración de Auth/SMTP, despliegue de una función y creación confiable de la primera cuenta; las claves públicas existentes no alcanzan para esos pasos.
- Los formularios usan HTML semántico y Zod, con `FormData` en los formularios simples y estado controlado en el editor de noticias para su vista previa y validación por campo. No se agregó una dependencia de formularios para estos flujos; se conserva la posibilidad de incorporar React Hook Form cuando haya flujos más complejos.
- Las imágenes nuevas son públicas, con archivos inmutables y políticas de escritura. Archivar una noticia no elimina su archivo; la limpieza de imágenes huérfanas requiere una operación confiable posterior.
- La recuperación del último administrador sin dispositivo MFA corresponde al propietario del proyecto. No se implementa un acceso alternativo que eluda MFA.
- La auditoría de base de datos es verificable localmente; los envíos reales, la configuración remota y la experiencia visual requieren verificación adicional en el entorno conectado.
- No se agregaron socios, cobros, reservas ni paneles de otros perfiles.
