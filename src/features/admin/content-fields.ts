import type { Content, ContentKind } from './schemas/admin'
import { formText } from './form-utils'

type FormField = {
  name: string
  label: string
  type?: string
  max?: number
  optional?: boolean
}
export const contentConfig: Record<
  ContentKind,
  { title: string; singular: string; fields: FormField[] }
> = {
  news: {
    title: 'Noticias',
    singular: 'noticia',
    fields: [
      { name: 'title', label: 'Título', max: 180 },
      {
        name: 'excerpt',
        label: 'Texto de la noticia',
        type: 'textarea',
        max: 1200,
      },
      { name: 'image_url', label: 'URL de la imagen', type: 'url', max: 2048 },
      { name: 'image_alt', label: 'Descripción de la imagen', max: 300 },
      {
        name: 'published_at',
        label: 'Fecha de publicación (hora de Argentina)',
        type: 'datetime-local',
      },
    ],
  },
  events: {
    title: 'Eventos',
    singular: 'evento',
    fields: [
      { name: 'title', label: 'Título', max: 180 },
      {
        name: 'starts_at',
        label: 'Fecha y hora (Argentina)',
        type: 'datetime-local',
      },
      { name: 'place', label: 'Lugar', max: 200 },
    ],
  },
  pool_rates: {
    title: 'Tarifas de pileta',
    singular: 'tarifa',
    fields: [
      { name: 'season', label: 'Temporada', max: 120 },
      { name: 'period', label: 'Período', max: 120 },
      {
        name: 'family_price_cents',
        label: 'Precio familiar (ARS)',
        type: 'money',
      },
      {
        name: 'individual_price_cents',
        label: 'Precio individual (ARS)',
        type: 'money',
      },
      {
        name: 'family_description',
        label: 'Condiciones del grupo familiar',
        max: 300,
      },
      {
        name: 'discount_note',
        label: 'Descuento o aclaración',
        type: 'textarea',
        max: 500,
        optional: true,
      },
      { name: 'valid_from', label: 'Vigente desde', type: 'date' },
      {
        name: 'valid_until',
        label: 'Vigente hasta',
        type: 'date',
        optional: true,
      },
    ],
  },
}
export function moneyToCents(value: string) {
  if (!/^\d{1,8}([.,]\d{1,2})?$/.test(value))
    throw new Error('Ingresá un precio positivo con hasta dos decimales.')
  const [whole = '0', fraction = ''] = value.replace(',', '.').split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
export function initialField(row: Content | null, name: string, type?: string) {
  if (!row) return ''
  const value: unknown = Object.getOwnPropertyDescriptor(row, name)?.value
  if (value === null || value === undefined) return ''
  if (type === 'money' && typeof value === 'number')
    return (value / 100).toFixed(2)
  if (type === 'datetime-local' && typeof value === 'string')
    return new Date(new Date(value).getTime() - 3 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16)
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : ''
}
export function formContent(kind: ContentKind, form: FormData) {
  const result: Record<string, string | number | boolean | null> = {
    is_published: form.get('is_published') === 'on',
  }
  for (const field of contentConfig[kind].fields) {
    const value = formText(form.get(field.name)).trim()
    if (!value && field.optional) result[field.name] = null
    else if (field.type === 'money') result[field.name] = moneyToCents(value)
    else if (field.type === 'datetime-local') {
      const date = new Date(`${value}-03:00`)
      if (!Number.isFinite(date.getTime()))
        throw new Error('Ingresá una fecha y hora válidas.')
      result[field.name] = date.toISOString()
    } else result[field.name] = value
  }
  return result
}
