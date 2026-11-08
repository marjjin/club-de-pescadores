# 0002 — Supabase como base de datos

Estado: elegido por el usuario; proyecto creado sin tablas, conexión y esquema pendientes.

## Decisión

Usar Supabase para la persistencia. Se incorpora su SDK oficial, que ofrece la integración de Postgres y los futuros servicios de Auth y Storage sin implementar clientes propios. La versión incorporada declara compatibilidad con Node 22 o superior y es compatible con Node 24 del proyecto.

La configuración y creación del cliente público se centralizan en `src/lib/supabase`. Las funciones `api/` de cada funcionalidad serán responsables de las consultas y del mapeo a los tipos de dominio. La interfaz y los hooks mantienen sus contratos.

La configuración solo admite claves `publishable` y URL segura, con excepción de HTTP en loopback para desarrollo. Las credenciales son opcionales para el boceto y obligatorias al crear el cliente. No se crea automáticamente una conexión ni se sustituye el origen de datos por la presencia de variables.

## Límites

El usuario confirmó que el proyecto remoto ya existe y todavía no tiene tablas. No se dispone de su configuración pública y el esquema aún debe diseñarse. Por ese motivo no se inventan tipos de tablas ni se aplica ninguna migración. El parámetro genérico del cliente parte de `never` y debe recibir el tipo `Database` generado desde el esquema real para habilitar consultas tipadas.

El cliente inicial es público, sin persistencia de sesiones ni procesamiento de callbacks. El futuro acceso administrativo requiere diseño propio de autenticación, MFA, roles y RLS. La creación del SDK no implementa autorización.

Las instrucciones para conectar el esquema y las funcionalidades están en [la guía de Supabase](../supabase.md).
