import { riverReadingSchema } from '@/features/river'
import { z } from '@/shared/lib/validation'

const legacyNoteSchema = z.string().trim().min(1).max(300).nullable()
export const adminRiverSchema = riverReadingSchema.extend({
  note: legacyNoteSchema,
  is_published: z.boolean(),
  created_at: z.iso.datetime({ offset: true }),
  updated_at: z.iso.datetime({ offset: true }),
})
export type AdminRiverReading = z.infer<typeof adminRiverSchema>
export const riverInputSchema = riverReadingSchema
  .omit({ id: true })
  .extend({ is_published: z.boolean(), note: legacyNoteSchema })
  .refine((value) => new Date(value.measured_at).getTime() <= Date.now(), {
    path: ['measured_at'],
    message: 'La medición no puede tener una fecha futura.',
  })
export const riverFieldOrder = [
  'height',
  'measured_at',
  'station',
  'source',
] as const
export type RiverTextField = (typeof riverFieldOrder)[number]
export type RiverValues = Record<RiverTextField, string> & {
  is_published: boolean
}
export type RiverErrors = Partial<Record<RiverTextField, string>>
export function initialRiverValues(row: AdminRiverReading | null): RiverValues {
  return {
    height: row ? (row.height_cm / 100).toFixed(2).replace('.', ',') : '',
    station: row?.station ?? '',
    source: row?.source ?? '',
    // Each save is a new reading; reusing the stored date made fresh heights look stale.
    measured_at: new Date(Date.now() - 3 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 16),
    is_published: row?.is_published ?? false,
  }
}
export function riverHeightToCm(value: string) {
  const normalized = value.trim().replace(',', '.')
  if (!/^-?\d{1,3}(\.\d{1,2})?$/.test(normalized)) return null
  const [whole = '0', fraction = ''] = normalized.replace('-', '').split('.')
  const cm =
    (Number(whole) * 100 + Number(fraction.padEnd(2, '0'))) *
    (normalized.startsWith('-') ? -1 : 1)
  return Math.abs(cm) <= 10000 ? cm : null
}
export function riverLocalDateToInstant(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
  const date = new Date(`${value}-03:00`)
  if (!Number.isFinite(date.getTime())) return null
  return new Date(date.getTime() - 3 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16) === value
    ? date.toISOString()
    : null
}
export function validateRiverValues(
  values: RiverValues,
  legacyNote: string | null = null,
) {
  const errors: RiverErrors = {}
  const height = riverHeightToCm(values.height)
  if (height === null)
    errors.height =
      'Ingresá metros entre -100 y 100, con hasta dos decimales y sin separadores de miles.'
  const instant = riverLocalDateToInstant(values.measured_at)
  const parsed = riverInputSchema.safeParse({
    height_cm: height,
    station: values.station.trim(),
    source: values.source.trim(),
    // Preserve stored notes without offering a second place to publish pier conditions.
    note: legacyNote,
    measured_at: instant ?? '',
    is_published: values.is_published,
  })
  if (!parsed.success)
    for (const issue of parsed.error.issues) {
      const field = riverFieldOrder.find((name) => name === issue.path[0])
      if (field)
        errors[field] =
          field === 'measured_at'
            ? 'Indicá una fecha y hora válidas que no sean futuras.'
            : `Completá ${field === 'station' ? 'el punto de medición (hasta 120 caracteres)' : 'la fuente (hasta 160 caracteres)'}.`
    }
  if (!parsed.success || Object.keys(errors).length)
    return { success: false as const, errors }
  return { success: true as const, data: parsed.data }
}
