import { expect, it } from 'vitest'
import { rolePermissionCatalog as catalog } from '@/test/admin-roles'
import {
  groupRolePermissions,
  selectPermissionGroup,
  toggleRolePermission,
  validateRoleEditor,
} from './role-editor'

it('groups the real catalog by module and excludes all reserved permissions', () => {
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
