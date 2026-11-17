import { expect, it } from 'vitest'
import { rolePermissionCatalog as catalog } from '@/test/admin-roles'
import {
  groupRolePermissions,
  permissionDescription,
  permissionModuleTitle,
  selectPermissionGroup,
  toggleRolePermission,
  validateRoleEditor,
} from './role-editor'

it('groups active modules and excludes reserved and retired permissions', () => {
  const groups = groupRolePermissions([...catalog].reverse())
  expect(groups.map((group) => group.id)).toEqual([
    'noticias',
    'eventos',
    'tarifas',
    'auditoria',
  ])
  expect(groups.flatMap((group) => group.permissions)).toHaveLength(13)
  expect(groups[0]?.permissions.map((permission) => permission.id)).toEqual([
    'noticias.ver',
    'noticias.editar',
    'noticias.publicar',
    'noticias.archivar',
  ])
  expect(
    groups
      .flatMap((group) => group.permissions)
      .some((permission) => permission.reserved),
  ).toBe(false)
})
it('does not offer or accept pool and gate permissions from an older catalog', () => {
  const retired = ['pileta.controlar', 'porteria.ver', 'portería.ingresar'].map(
    (id) => ({ id, label: id, reserved: false }),
  )
  const legacyCatalog = [...catalog, ...retired]
  const selected = ['noticias.ver']
  expect(groupRolePermissions(legacyCatalog).map((group) => group.id)).toEqual([
    'noticias',
    'eventos',
    'tarifas',
    'auditoria',
  ])
  for (const { id } of retired) {
    expect(toggleRolePermission(selected, id, legacyCatalog)).toEqual(selected)
    expect(
      validateRoleEditor('Equipo', [...selected, id], legacyCatalog).success,
    ).toBe(false)
  }
})
it('adds the required read permission and removes its dependent actions without affecting other modules', () => {
  const selected = toggleRolePermission(
    ['eventos.ver'],
    'noticias.editar',
    catalog,
  )
  expect(selected).toEqual(['eventos.ver', 'noticias.editar', 'noticias.ver'])
  expect(toggleRolePermission(selected, 'noticias.ver', catalog)).toEqual([
    'eventos.ver',
  ])
  expect(toggleRolePermission(selected, 'usuarios.gestionar', catalog)).toEqual(
    selected,
  )
})
it('selects and clears one module without silently adding unrelated permissions', () => {
  const group = groupRolePermissions(catalog)[0]!
  const selected = selectPermissionGroup(['eventos.ver'], group)
  expect(selected).toHaveLength(5)
  expect(selectPermissionGroup(selected, group)).toEqual(['eventos.ver'])
})
it('validates names, reserved permissions, unknown IDs and missing read dependencies', () => {
  expect(
    validateRoleEditor(' Editor ', ['noticias.ver'], catalog),
  ).toMatchObject({ success: true, data: { name: 'Editor' } })
  expect(validateRoleEditor('x', [], catalog).success).toBe(false)
  expect(validateRoleEditor('x'.repeat(81), [], catalog).success).toBe(false)
  for (const permissions of [
    ['noticias.editar'],
    ['roles.gestionar'],
    ['unknown'],
  ])
    expect(validateRoleEditor('Editor', permissions, catalog).success).toBe(
      false,
    )
})
it('allows an empty role and enforces the server limit on distinct permissions', () => {
  expect(validateRoleEditor('Sin permisos', [], catalog).success).toBe(true)
  const extended = Array.from({ length: 31 }, (_, index) => ({
    id: `custom.permission${index}`,
    label: `Prueba ${index}`,
    reserved: false,
  }))
  expect(
    validateRoleEditor(
      'Límite',
      extended.map((permission) => permission.id),
      extended,
    ).success,
  ).toBe(false)
})
it('names the pier module and explains what publishing a report does', () => {
  expect(permissionModuleTitle('muelle')).toBe('Parte del muelle')
  expect(permissionDescription('muelle.publicar')).toContain(
    'actualiza la altura del río',
  )
  // Facilities save and publish at once: no mention of a Publicar permission.
  expect(permissionDescription('instalaciones.editar')).not.toContain(
    'Publicar',
  )
  expect(permissionDescription('torneos.gestionar')).toContain('tablas anuales')
  expect(permissionDescription('torneos.participantes')).toContain('DNI')
})

it('groups tournament permissions under their own module with specific help', () => {
  const tournamentCatalog = [
    'torneos.puntos',
    'torneos.ver',
    'torneos.participantes',
    'torneos.gestionar',
  ].map((id) => ({ id, label: id, reserved: false }))
  const [group] = groupRolePermissions(tournamentCatalog)
  expect(group?.title).toBe('Torneos')
  expect(group?.permissions.map((permission) => permission.id)).toEqual([
    'torneos.ver',
    'torneos.gestionar',
    'torneos.participantes',
    'torneos.puntos',
  ])
  for (const permission of tournamentCatalog)
    expect(permissionDescription(permission.id)).not.toContain('catálogo')
})
