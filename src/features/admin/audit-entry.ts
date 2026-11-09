import type { Audit } from './schemas/admin'
import { auditResourceLabel } from './audit-labels'
import { auditSnapshot } from './audit-diff'
import { auditCalendar } from './audit-values'
import { getClubToday } from '@/shared/lib/dates'

export type AuditKind =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'archived'
  | 'restored'
  | 'published'
  | 'scheduled'
  | 'unpublished'
  | 'activated'
  | 'deactivated'
  | 'assigned'
  | 'unassigned'
export function auditPresentation(entry: Audit): {
  kind: AuditKind
  label: string
  resource: string
  title: string
} {
  const [table, operation] = entry.action.split('.')
  const before = auditSnapshot(entry.before_data),
    after = auditSnapshot(entry.after_data)
  const record = after ?? before
  const text = (key: string) =>
    typeof record?.[key] === 'string' ? record[key] : ''
  const resource = auditResourceLabel(entry.action)
  const title =
    text('title') ||
    text('name') ||
    text('email') ||
    (table === 'pool_rates'
      ? [text('season'), text('period')].filter(Boolean).join(' · ')
      : '') ||
    text('station') ||
    resource
  const result = (kind: AuditKind, label: string) => ({
    kind,
    label,
    resource,
    title,
  })
  const futurePublication =
    table === 'news' &&
    after?.is_published === true &&
    typeof after.published_at === 'string' &&
    Date.parse(after.published_at) > Date.parse(entry.created_at)
  if (table === 'user_roles' || table === 'role_permissions') {
    if (operation === 'insert')
      return result(
        'assigned',
        table === 'user_roles' ? 'Rol asignado' : 'Permiso asignado',
      )
    if (operation === 'delete')
      return result(
        'unassigned',
        table === 'user_roles' ? 'Rol retirado' : 'Permiso retirado',
      )
  }
  if (operation === 'update' && before && after) {
    if (before.deleted_at == null && after.deleted_at != null)
      return result('archived', 'Archivado')
    if (before.deleted_at != null && after.deleted_at == null)
      return result('restored', 'Restauración')
    if (before.active === true && after.active === false)
      return result('deactivated', 'Acceso desactivado')
    if (before.active === false && after.active === true)
      return result('activated', 'Acceso activado')
    if (
      futurePublication &&
      (before.is_published !== true ||
        before.published_at !== after.published_at)
    )
      return result('scheduled', 'Publicación programada')
    if (before.is_published === false && after.is_published === true)
      return result('published', 'Publicación')
    if (before.is_published === true && after.is_published === false)
      return result('unpublished', 'Retiro de publicación')
  }
  if (operation === 'insert')
    return futurePublication
      ? result('scheduled', 'Publicación programada')
      : result('created', 'Creación')
  if (operation === 'delete') return result('deleted', 'Eliminación')
  return result('updated', 'Actualización')
}
export const auditActor = (entry: Audit) =>
  entry.actor_email ??
  (entry.actor_id ? 'Cuenta no disponible' : 'Sistema o servicio')
export function groupAuditDays(entries: Audit[]) {
  const groups = new Map<
    string,
    { day: string; label: string; entries: Audit[] }
  >()
  for (const entry of entries) {
    const instant = new Date(entry.created_at)
    const day = Number.isFinite(instant.getTime())
      ? getClubToday(instant)
      : 'unknown'
    const group = groups.get(day) ?? {
      day,
      label: day === 'unknown' ? 'Fecha no disponible' : auditCalendar(day),
      entries: [],
    }
    group.entries.push(entry)
    groups.set(day, group)
  }
  return [...groups.values()]
}
