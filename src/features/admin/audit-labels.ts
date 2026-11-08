const resources: Record<string, string> = {
  news: 'Noticia',
  events: 'Evento',
  pool_rates: 'Tarifa',
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
  const [resource = '', operation = ''] = action.split('.')
  return `${operations[operation] ?? 'Cambio'} · ${resources[resource] ?? 'Administración'}`
}
export const auditFilters = Object.entries(resources)
