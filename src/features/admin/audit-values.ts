const dateOptions = {
  timeZone: 'America/Argentina/Buenos_Aires',
  hourCycle: 'h23',
} as const
const timestamp = new Intl.DateTimeFormat('es-AR', {
  ...dateOptions,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})
const hour = new Intl.DateTimeFormat('es-AR', {
  ...dateOptions,
  hour: '2-digit',
  minute: '2-digit',
})
const calendar = new Intl.DateTimeFormat('es-AR', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const meters = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const labels: Record<string, string> = {
  title: 'Título',
  excerpt: 'Texto de la noticia',
  description: 'Descripción',
  name: 'Nombre',
  email: 'Correo electrónico',
  season: 'Temporada',
  period: 'Período',
  family_price_cents: 'Precio familiar',
  individual_price_cents: 'Precio individual',
  family_description: 'Condiciones del grupo familiar',
  discount_note: 'Descuento o aclaración',
  valid_from: 'Vigente desde',
  valid_until: 'Vigente hasta',
  starts_at: 'Fecha y hora del evento',
  place: 'Lugar',
  published_at: 'Fecha de publicación',
  image_url: 'Imagen de la noticia',
  image_alt: 'Descripción de la imagen',
  image_focus_x: 'Encuadre horizontal de la portada (%)',
  image_focus_y: 'Encuadre vertical de la portada (%)',
  is_published: 'Estado de publicación',
  active: 'Estado del acceso',
  is_system: 'Tipo de rol',
  reserved: 'Tipo de permiso',
  height_cm: 'Altura del río',
  measured_at: 'Fecha de medición',
  station: 'Punto de medición',
  source: 'Fuente de la medición',
  note: 'Aclaración',
  deleted_at: 'Archivado el',
  user_id: 'Usuario (identificador)',
  role_id: 'Rol (identificador)',
  permission_id: 'Permiso',
  id: 'Identificador',
  created_at: 'Creación del registro',
  updated_at: 'Última modificación del registro',
}
export type AuditValue = {
  text: string
  kind: 'text' | 'empty' | 'identifier' | 'link'
  href?: string
}
export const auditFieldLabel = (key: string) =>
  (Object.hasOwn(labels, key) ? labels[key] : undefined) ??
  key.replace(/_/g, ' ').replace(/^./, (letter) => letter.toUpperCase())
export function auditTimestamp(value: string, short = false) {
  const date = new Date(value)
  return Number.isFinite(date.getTime())
    ? (short ? hour : timestamp).format(date)
    : 'Fecha no disponible'
}
export function auditCalendar(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime())
    ? calendar.format(date)
    : 'Fecha no disponible'
}
function permissionLabel(id: string) {
  const special: Record<string, string> = {
    'usuarios.gestionar': 'Dar de alta y modificar usuarios',
    'usuarios.ver': 'Ver usuarios',
    'roles.gestionar': 'Gestionar roles',
    'rio.gestionar': 'Actualizar altura del río',
    'muelle.publicar': 'Publicar partes del muelle',
    'auditoria.ver': 'Consultar auditoría',
  }
  if (Object.hasOwn(special, id)) return special[id]!
  const [module = '', action = ''] = id.split('.')
  const actions: Record<string, string> = {
    ver: 'Ver',
    editar: 'Editar',
    publicar: 'Publicar',
    archivar: 'Archivar y restaurar',
    eliminar: 'Eliminar definitivamente',
  }
  return ['noticias', 'eventos', 'tarifas'].includes(module) &&
    Object.hasOwn(actions, action)
    ? `${actions[action]} ${module}`
    : id
}
function plainValue(value: unknown): string {
  if (value === null || value === undefined) return 'Sin dato'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'string') return value || 'Texto vacío'
  if (typeof value === 'number') return String(value)
  if (Array.isArray(value))
    return value.length ? value.map(plainValue).join(' · ') : 'Sin elementos'
  if (typeof value === 'object')
    return (
      Object.entries(value)
        .map(([key, item]) => `${auditFieldLabel(key)}: ${plainValue(item)}`)
        .join(' · ') || 'Sin campos'
    )
  return 'Valor no disponible'
}
export function formatAuditValue(key: string, value: unknown): AuditValue {
  if (value === null || value === undefined) {
    const empty: Record<string, string> = {
      valid_until: 'Sin fecha final',
      deleted_at: 'Sin archivar',
      discount_note: 'Sin aclaración',
      note: 'Sin aclaración',
    }
    return {
      text: (Object.hasOwn(empty, key) ? empty[key] : undefined) ?? 'Sin dato',
      kind: 'empty',
    }
  }
  if (typeof value === 'boolean') {
    const states: Record<string, [string, string]> = {
      is_published: ['Borrador', 'Publicado'],
      active: ['Desactivado', 'Activo'],
      is_system: ['Personalizado', 'Protegido'],
      reserved: ['Asignable', 'Reservado'],
    }
    return {
      text: states[key]?.[value ? 1 : 0] ?? (value ? 'Sí' : 'No'),
      kind: 'text',
    }
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (key.endsWith('_price_cents'))
      return { text: money.format(value / 100), kind: 'text' }
    if (key === 'height_cm')
      return { text: `${meters.format(value / 100)} m`, kind: 'text' }
  }
  if (typeof value === 'string') {
    if (key === 'valid_from' || key === 'valid_until')
      return { text: auditCalendar(value), kind: 'text' }
    if (key.endsWith('_at'))
      return { text: auditTimestamp(value), kind: 'text' }
    if (key === 'permission_id')
      return { text: permissionLabel(value), kind: 'text' }
    if (key === 'image_url') {
      try {
        const url = new URL(value)
        if (url.protocol === 'https:')
          return { text: 'Abrir imagen', href: url.href, kind: 'link' }
      } catch {
        /* An invalid historical URL remains plain text. */
      }
    }
    if (key === 'id' || key.endsWith('_id'))
      return { text: value, kind: 'identifier' }
  }
  return { text: plainValue(value), kind: value === '' ? 'empty' : 'text' }
}
