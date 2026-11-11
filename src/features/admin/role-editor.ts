import { z } from '@/shared/lib/validation'
import type { permissionSchema } from './schemas/admin'

export type RolePermission = z.infer<typeof permissionSchema>
export type PermissionGroup = {
  id: string
  title: string
  description: string
  permissions: RolePermission[]
}
export type RoleEditorErrors = { name?: string; permissions?: string }
const modules: Record<string, { title: string; description: string }> = {
  noticias: {
    title: 'Noticias',
    description: 'Novedades, fotos y condiciones del muelle.',
  },
  eventos: { title: 'Eventos', description: 'Actividades y agenda del club.' },
  tarifas: {
    title: 'Tarifas de pileta',
    description: 'Precios, condiciones y vigencias.',
  },
  muelle: {
    title: 'Parte del muelle',
    description: 'Altura del río, condiciones y fotos o videos del día.',
  },
  usuarios: {
    title: 'Usuarios',
    description: 'Altas, accesos y roles de las personas del equipo.',
  },
  auditoria: {
    title: 'Auditoría',
    description: 'Consulta del historial de cambios y accesos.',
  },
}
// Modules whose actions all require their "ver" permission (checked again in the database).
const contentModules = ['noticias', 'eventos', 'tarifas', 'usuarios']
export const permissionModuleTitle = (id: string) =>
  modules[id]?.title ?? `Otros permisos (${id})`
export function groupRolePermissions(
  catalog: RolePermission[],
): PermissionGroup[] {
  const groups = new Map<string, PermissionGroup>()
  for (const permission of catalog) {
    if (permission.reserved) continue
    const id = permission.id.split('.')[0] ?? permission.id
    const group = groups.get(id) ?? {
      id,
      title: permissionModuleTitle(id),
      description:
        modules[id]?.description ?? 'Acciones disponibles en este módulo.',
      permissions: [],
    }
    group.permissions.push(permission)
    groups.set(id, group)
  }
  const order = [
    'noticias',
    'eventos',
    'tarifas',
    'muelle',
    'usuarios',
    'auditoria',
  ]
  const actions = [
    'ver',
    'editar',
    'publicar',
    'archivar',
    'eliminar',
    'gestionar',
  ]
  const actionOrder = (id: string) => {
    const position = actions.indexOf(id.split('.')[1] ?? '')
    return position < 0 ? 99 : position
  }
  for (const group of groups.values())
    group.permissions.sort(
      (left, right) => actionOrder(left.id) - actionOrder(right.id),
    )
  return [...groups.values()].sort(
    (left, right) =>
      (order.includes(left.id) ? order.indexOf(left.id) : 99) -
      (order.includes(right.id) ? order.indexOf(right.id) : 99),
  )
}
export function toggleRolePermission(
  selected: string[],
  id: string,
  catalog: RolePermission[],
) {
  const permission = catalog.find((entry) => entry.id === id && !entry.reserved)
  if (!permission) return selected
  const prefix = id.split('.')[0] ?? ''
  if (selected.includes(id)) {
    return selected.filter((entry) =>
      id === `${prefix}.ver` && contentModules.includes(prefix)
        ? !entry.startsWith(`${prefix}.`)
        : entry !== id,
    )
  }
  const next = [...selected, id]
  if (
    contentModules.includes(prefix) &&
    id !== `${prefix}.ver` &&
    catalog.some((entry) => entry.id === `${prefix}.ver` && !entry.reserved)
  )
    next.push(`${prefix}.ver`)
  return [...new Set(next)]
}
export function selectPermissionGroup(
  selected: string[],
  group: PermissionGroup,
) {
  const ids = group.permissions.map((permission) => permission.id)
  return ids.every((id) => selected.includes(id))
    ? selected.filter((id) => !ids.includes(id))
    : [...new Set([...selected, ...ids])]
}
export function permissionDescription(id: string) {
  const action = id.split('.')[1]
  if (id === 'muelle.publicar')
    return 'Publicar el parte diario: actualiza la altura del río y suma fotos o videos. También permite retirar partes.'
  if (action === 'ver' && id.startsWith('auditoria.'))
    return 'Revisar quién hizo cada cambio, sin modificar el historial.'
  if (id === 'usuarios.ver')
    return 'Consultar quién integra el equipo, su estado y sus roles, sin modificarlos.'
  if (id === 'usuarios.gestionar')
    return 'Invitar personas, asignar roles y desactivar accesos. Solo puede dar roles con permisos que ya tiene, nunca el de Administrador general.'
  if (action === 'ver')
    return 'Consultar contenido, borradores y registros archivados.'
  if (action === 'editar')
    return 'Crear y modificar contenido. Para editar publicaciones también se necesita Publicar.'
  if (action === 'publicar')
    return 'Autorizar publicación y retiro. Guardar cambios requiere también Editar.'
  if (action === 'archivar')
    return 'Archivar y restaurar contenido. Retirar publicaciones también requiere Publicar.'
  if (action === 'eliminar')
    return 'Borrar para siempre contenido archivado, incluida su imagen. No se puede deshacer.'
  return 'Acción definida en el catálogo de permisos del sistema.'
}
const roleInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  permissions: z.array(z.string()).max(30),
})
export function validateRoleEditor(
  name: string,
  permissions: string[],
  catalog: RolePermission[],
) {
  const errors: RoleEditorErrors = {}
  const parsed = roleInputSchema.safeParse({
    name,
    permissions: [...new Set(permissions)],
  })
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'name')
        errors.name = 'Ingresá un nombre de entre 2 y 80 caracteres.'
      if (issue.path[0] === 'permissions')
        errors.permissions = 'El rol admite hasta 30 permisos.'
    }
  if (
    permissions.some(
      (id) =>
        !catalog.some(
          (permission) => permission.id === id && !permission.reserved,
        ),
    )
  )
    errors.permissions =
      'Hay permisos reservados o no disponibles. Revisá la selección y actualizá el catálogo.'
  for (const prefix of contentModules)
    if (
      permissions.some(
        (id) => id.startsWith(`${prefix}.`) && id !== `${prefix}.ver`,
      ) &&
      !permissions.includes(`${prefix}.ver`)
    )
      errors.permissions = `Incluí el permiso de lectura de ${permissionModuleTitle(prefix)} para usar sus otras acciones.`
  if (!parsed.success || Object.keys(errors).length)
    return { success: false as const, errors }
  return { success: true as const, data: parsed.data }
}
