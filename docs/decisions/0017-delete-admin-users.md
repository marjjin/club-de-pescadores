# Eliminación de usuarios del panel

El 16 de noviembre de 2026 el propietario pidió poder dar de baja (eliminar) usuarios del panel, además de desactivarlos, y eligió la variante con anonimización.

Reemplaza a «Quitar del equipo» (rama `feat/admin-remove-user`, sin unir a `main`). Esa versión bloqueaba la cuenta y la recuperaba si se volvía a invitar. Su migración `202611130001_admin_remove_user.sql` ya estaba aplicada en producción, así que se incorporó al repositorio sin cambios y esta decisión se construye encima: reutiliza `deleted_at`, su `CHECK` y el índice del listado, y elimina `admin_remove_user`. Al momento del cambio no había cuentas quitadas en producción.

## Decisión

Eliminar un usuario borra su cuenta de Supabase Auth (correo, contraseña, sesiones y MFA) y conserva en `admin_accounts` una fila anónima: `email` nulo, `active = false`, `deleted_at` con la fecha y sin roles. Esa fila no aparece en el listado de Usuarios.

Se conserva porque `pier_reports`, `tournaments`, `tournament_participants` y `tournament_scores` referencian `admin_accounts(id)` como autor, y la auditoría resuelve el correo del actor desde esa tabla. Un borrado físico fallaría si la persona cargó algo, o rompería la trazabilidad.

## Implementación

- Migración `202611160002_delete_admin_users.sql`: quita la FK `admin_accounts.id → auth.users(id)` para que Auth pueda borrar el usuario, permite correo nulo y agrega un `CHECK`: una cuenta tiene correo si y solo si no está eliminada. `admin_list('users')` oculta las cuentas eliminadas, `admin_save_user` las rechaza y la sincronización de correo las ignora.
- RPC `admin_delete_user(p_id, p_version)`: usa el mismo lock, permiso (`usuarios.gestionar`), control de versión y regla de asignación que la edición: solo se puede eliminar a quien se le podría haber dado ese acceso. No permite eliminarse a uno mismo y exige que quede un administrador general activo. Los triggers de auditoría guardan el correo y los roles anteriores.
- Edge Function `admin-users`, acción `delete`: primero la RPC con el JWT del administrador y después `DELETE /auth/v1/admin/users/{id}` con la clave de servicio. Si la RPC falla, Auth no se toca. Si Auth falla, el acceso ya quedó revocado (`has_permission` exige una cuenta activa) y se devuelve una advertencia para borrar la cuenta desde Supabase Auth. Un 404 de Auth se considera éxito.
- Interfaz: sección «Eliminar usuario» en «Gestionar acceso», salvo en la cuenta propia, con confirmación destructiva. La auditoría muestra «Usuario eliminado» con el correo anterior.

## Riesgos y límites

- Los JWT ya emitidos siguen siendo válidos hasta vencer, pero no otorgan permisos porque la cuenta queda inactiva.
- La auditoría conserva el correo en `before_data`, ya que es inmutable por diseño. Es un registro de seguridad con finalidad legítima (Ley 25.326), pero si se pide la supresión total del correo hay que tratarlo aparte.
- Si falla el borrado en Auth y no se completa a mano, volver a invitar ese correo responde que ya tiene acceso registrado hasta que se elimine la cuenta en Auth.
- Para volver a dar acceso a una persona eliminada hay que invitarla de nuevo. Recibe una cuenta nueva, sin relación con su historial anterior.
