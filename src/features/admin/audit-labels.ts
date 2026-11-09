const resources: Record<string, string> = {
  news: 'Noticia',
  events: 'Evento',
  pool_rates: 'Tarifa',
  river_levels: 'Altura del río',
  roles: 'Rol',
  role_permissions: 'Permisos de rol',
  admin_accounts: 'Cuenta de usuario',
  user_roles: 'Asignación de rol',
}
const operations: Record<string, string> = {
  insert: 'Creación',
  update: 'Actualización',
  delete: 'Eliminación',
}
export function auditLabel(action: string) {
  const operation = action.split('.')[1] ?? ''
  return `${Object.hasOwn(operations, operation) ? operations[operation] : 'Cambio'} · ${auditResourceLabel(action)}`
}
export function auditResourceLabel(action: string) {
  const resource = action.split('.')[0] ?? ''
  return Object.hasOwn(resources, resource)
    ? resources[resource]!
    : 'Administración'
}
export const auditFilters = Object.entries({
  news: 'Noticias',
  events: 'Eventos',
  pool_rates: 'Tarifas de pileta',
  river_levels: 'Altura del río',
  roles: 'Roles',
  role_permissions: 'Permisos de roles',
  admin_accounts: 'Cuentas de usuario',
  user_roles: 'Asignaciones de roles',
})
