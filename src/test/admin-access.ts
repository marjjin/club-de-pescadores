export const accessRoles = Array.from({ length: 25 }, (_, index) => ({
  id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  name: index === 0 ? 'Administrador general' : `Rol ${index + 1}`,
  is_system: index === 0,
  permissions: index === 0 ? [] : ['noticias.ver'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}))
export const accessAccount = {
  id: '10000000-0000-4000-8000-000000000002',
  email: 'team@example.test',
  active: true,
  roles: [accessRoles[0]!.id],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
}
export const accessViewer = '10000000-0000-4000-8000-000000000001'
