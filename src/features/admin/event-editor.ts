import { initialField } from './content-fields'
import { contentInputs } from './schemas/admin'
import type { ClubEvent } from './schemas/admin'

export type EventEditorValues = {
  title: string
  date: string
  time: string
  place: string
  description: string
  is_published: boolean
}
export type EventEditorErrors = Partial<
  Record<'title' | 'date' | 'time' | 'place' | 'description', string>
>
export const eventFieldOrder = [
  'title',
  'date',
  'time',
  'place',
  'description',
] as const

export function initialEventValues(row: ClubEvent | null): EventEditorValues {
  // initialField already shifts the instant to Argentina (UTC−3).
  const local = initialField(row, 'starts_at', 'datetime-local')
  return {
    title: row?.title ?? '',
    date: local.slice(0, 10),
    time: local.slice(11, 16),
    place: row?.place ?? '',
    description: row?.description ?? '',
    is_published: row?.is_published ?? false,
  }
}

export function eventInstant(values: Pick<EventEditorValues, 'date' | 'time'>) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date)) return null
  if (!/^\d{2}:\d{2}$/.test(values.time)) return null
  const date = new Date(`${values.date}T${values.time}:00-03:00`)
  return Number.isFinite(date.getTime()) ? date : null
}

export function isPastEvent(values: EventEditorValues, now = new Date()) {
  const date = eventInstant(values)
  return date !== null && date < now
}

export function validateEventEditor(values: EventEditorValues) {
  const errors: EventEditorErrors = {}
  if (!values.date) errors.date = 'Elegí el día del evento.'
  if (!values.time) errors.time = 'Indicá la hora de inicio.'
  const instant = eventInstant(values)
  if (!instant && !errors.date && !errors.time)
    errors.date = 'Ingresá una fecha y hora válidas.'
  const parsed = contentInputs.events.safeParse({
    title: values.title,
    place: values.place,
    description: values.description.trim() || null,
    starts_at: instant?.toISOString() ?? '',
    is_published: values.is_published,
  })
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === 'title')
        errors.title =
          values.title.trim().length > 180
            ? 'El título admite hasta 180 caracteres.'
            : 'Escribí un nombre para el evento.'
      if (issue.path[0] === 'description')
        errors.description = 'La descripción admite hasta 600 caracteres.'
      if (issue.path[0] === 'place')
        errors.place =
          values.place.trim().length > 200
            ? 'El lugar admite hasta 200 caracteres.'
            : 'Indicá dónde se realiza el evento.'
    }
  }
  if (!parsed.success || Object.keys(errors).length)
    return { success: false as const, errors }
  return { success: true as const, data: parsed.data }
}
