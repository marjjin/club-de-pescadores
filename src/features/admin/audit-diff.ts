import type { Audit } from './schemas/admin'
import { auditFieldLabel } from './audit-values'

export type AuditChange = {
  key: string
  label: string
  before: unknown
  after: unknown
}
const technical = new Set([
  'id',
  'created_at',
  'updated_at',
  'user_id',
  'role_id',
])
const fieldOrder: Record<string, string[]> = {
  news: [
    'title',
    'excerpt',
    'image_url',
    'image_alt',
    'image_focus_x',
    'image_focus_y',
    'published_at',
    'is_published',
    'deleted_at',
  ],
  events: [
    'title',
    'description',
    'starts_at',
    'place',
    'is_published',
    'deleted_at',
  ],
  pool_rates: [
    'season',
    'period',
    'family_price_cents',
    'individual_price_cents',
    'family_description',
    'discount_note',
    'valid_from',
    'valid_until',
    'is_published',
    'deleted_at',
  ],
  river_levels: [
    'height_cm',
    'station',
    'measured_at',
    'source',
    'is_published',
    'note',
  ],
  roles: ['name', 'is_system'],
  admin_accounts: ['email', 'active'],
  user_roles: ['user_id', 'role_id'],
  role_permissions: ['role_id', 'permission_id'],
}
export function auditSnapshot(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}
export function auditValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right) || (left == null && right == null)) return true
  if (Array.isArray(left) && Array.isArray(right))
    return (
      left.length === right.length &&
      left.every((item, index) => auditValuesEqual(item, right[index]))
    )
  const a = auditSnapshot(left),
    b = auditSnapshot(right)
  if (!a || !b) return false
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(b).length &&
    keys.every(
      (key) => Object.hasOwn(b, key) && auditValuesEqual(a[key], b[key]),
    )
  )
}
export function auditDiff(entry: Audit) {
  const before = auditSnapshot(entry.before_data),
    after = auditSnapshot(entry.after_data)
  const mode =
    !before && after ? 'created' : before && !after ? 'deleted' : 'updated'
  const order = fieldOrder[entry.action.split('.')[0] ?? ''] ?? []
  const keys = [
    ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  ]
  keys.sort(
    (a, b) =>
      (order.includes(a) ? order.indexOf(a) : 999) -
        (order.includes(b) ? order.indexOf(b) : 999) || a.localeCompare(b),
  )
  const changes: AuditChange[] = keys
    .filter(
      (key) =>
        mode !== 'updated' || !auditValuesEqual(before?.[key], after?.[key]),
    )
    .map((key) => ({
      key,
      label: auditFieldLabel(key),
      before: before?.[key],
      after: after?.[key],
    }))
  return {
    mode,
    changes: changes.filter((change) => !technical.has(change.key)),
    technical: changes.filter(
      (change) =>
        technical.has(change.key) &&
        (change.key !== 'id' || mode === 'updated'),
    ),
  }
}
