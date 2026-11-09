const permissions = [
  ['noticias.ver', 'Ver noticias'],
  ['noticias.editar', 'Editar noticias'],
  ['noticias.publicar', 'Publicar noticias'],
  ['noticias.archivar', 'Archivar y restaurar noticias'],
  ['eventos.ver', 'Ver eventos'],
  ['eventos.editar', 'Editar eventos'],
  ['eventos.publicar', 'Publicar eventos'],
  ['eventos.archivar', 'Archivar y restaurar eventos'],
  ['tarifas.ver', 'Ver tarifas'],
  ['tarifas.editar', 'Editar tarifas'],
  ['tarifas.publicar', 'Publicar tarifas'],
  ['tarifas.archivar', 'Archivar y restaurar tarifas'],
  ['auditoria.ver', 'Consultar auditoría'],
] as const
export const rolePermissionCatalog = [
  ...permissions.map(([id, label]) => ({ id, label, reserved: false })),
  { id: 'usuarios.gestionar', label: 'Gestionar usuarios', reserved: true },
  { id: 'roles.gestionar', label: 'Gestionar roles', reserved: true },
  { id: 'rio.gestionar', label: 'Actualizar altura del río', reserved: true },
]
export const protectedRole = {
  id: '20000000-0000-4000-8000-000000000001',
  name: 'Administrador general',
  is_system: true,
  permissions: [] as string[],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}
export const editableRole = {
  ...protectedRole,
  id: '20000000-0000-4000-8000-000000000002',
  name: 'Editor de noticias',
  is_system: false,
  permissions: ['noticias.ver'],
}
