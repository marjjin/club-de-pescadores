import { formatRiverDate } from '@/features/river'
import type { UploadedMedia } from './api/media'
import { mediaListSchema } from './schemas/media'
import { pierInputSchema } from './schemas/pier'

export type PierValues = { height: string; conditions: string }
export type PierErrors = Partial<Record<keyof PierValues | 'media', string>>
export const MAX_CONDITIONS = 600

/** Exact decimal parsing: "2,34" and "2.34" are 234 cm; thousands separators are rejected. */
export function riverHeightToCm(value: string) {
  const normalized = value.trim().replace(',', '.')
  if (!/^-?\d{1,3}(\.\d{1,2})?$/.test(normalized)) return null
  const [whole = '0', fraction = ''] = normalized.replace('-', '').split('.')
  const cm =
    (Number(whole) * 100 + Number(fraction.padEnd(2, '0'))) *
    (normalized.startsWith('-') ? -1 : 1)
  return Math.abs(cm) <= 10000 ? cm : null
}

export function validatePierReport(
  values: PierValues,
  media: UploadedMedia[],
  now = new Date(),
) {
  const errors: PierErrors = {}
  const height = riverHeightToCm(values.height)
  if (height === null)
    errors.height =
      'Ingresá la altura en metros, con hasta dos decimales. Por ejemplo: 3,30.'
  const conditions = values.conditions.trim()
  if (conditions.length > MAX_CONDITIONS)
    errors.conditions = `Las condiciones admiten hasta ${MAX_CONDITIONS} caracteres.`
  // Alt text is generated from the moment of the report so staff only describe conditions.
  const alt = `Muelle del club, parte del ${formatRiverDate(now.toISOString())}`
  const items = media.map((item) => ({ ...item, alt }))
  const mediaCheck = mediaListSchema.safeParse(items)
  if (!mediaCheck.success)
    errors.media =
      mediaCheck.error.issues[0]?.message ?? 'Revisá los archivos elegidos.'
  if (Object.keys(errors).length || height === null)
    return { success: false as const, errors }
  const parsed = pierInputSchema.safeParse({
    height_cm: height,
    // The measurement is taken when the report is sent; the station is fixed.
    measured_at: now.toISOString(),
    conditions: conditions || null,
    media: items,
  })
  if (!parsed.success)
    return {
      success: false as const,
      errors: { height: 'Revisá los datos del parte.' },
    }
  return { success: true as const, data: parsed.data }
}
