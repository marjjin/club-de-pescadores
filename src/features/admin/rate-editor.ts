import { getClubToday } from '@/shared/lib/dates'
import { initialField, moneyToCents } from './content-fields'
import { contentInputs } from './schemas/admin'
import type { Rate } from './schemas/admin'

export const rateFieldOrder = [
  'season',
  'period',
  'family_price_cents',
  'individual_price_cents',
  'family_description',
  'discount_note',
  'valid_from',
  'valid_until',
] as const
export type RateTextKey = (typeof rateFieldOrder)[number]
export type RateEditorValues = Record<RateTextKey, string> & {
  is_published: boolean
}
export type RateEditorErrors = Partial<Record<RateTextKey, string>>

export function initialRateValues(row: Rate | null): RateEditorValues {
  return {
    season: row?.season ?? '',
    period: row?.period ?? '',
    family_price_cents: initialField(row, 'family_price_cents', 'money'),
    individual_price_cents: initialField(
      row,
      'individual_price_cents',
      'money',
    ),
    family_description: row?.family_description ?? '',
    discount_note: row?.discount_note ?? '',
    valid_from: row?.valid_from ?? getClubToday(),
    valid_until: row?.valid_until ?? '',
    is_published: row?.is_published ?? false,
  }
}

export function validateRateEditor(values: RateEditorValues) {
  const errors: RateEditorErrors = {}
  const amounts: Partial<
    Record<'family_price_cents' | 'individual_price_cents', number>
  > = {}
  for (const key of ['family_price_cents', 'individual_price_cents'] as const) {
    try {
      amounts[key] = moneyToCents(values[key].trim())
    } catch {
      errors[key] =
        'Ingresá un importe desde 0, sin puntos de miles y con hasta dos decimales.'
    }
  }
  const parsed = contentInputs.pool_rates.safeParse({
    ...values,
    ...amounts,
    discount_note: values.discount_note.trim() || null,
    valid_until: values.valid_until || null,
  })
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = rateFieldOrder.find((field) => field === issue.path[0])
      if (!key || errors[key]) continue
      errors[key] =
        key === 'family_price_cents' || key === 'individual_price_cents'
          ? 'El importe máximo es $ 21.474.836,47.'
          : issue.message
    }
  }
  if (!parsed.success || Object.keys(errors).length)
    return { success: false as const, errors }
  return { success: true as const, data: parsed.data }
}

const currency = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 2,
})
export function ratePriceLabel(value: string) {
  try {
    const cents = moneyToCents(value.trim())
    return cents <= 2147483647 ? currency.format(cents / 100) : '—'
  } catch {
    return '—'
  }
}

export function rateVisibility(
  values: RateEditorValues,
  today = getClubToday(),
) {
  const parsed = contentInputs.pool_rates.shape.valid_from.safeParse(
    values.valid_from,
  )
  const until = contentInputs.pool_rates.shape.valid_until.safeParse(
    values.valid_until || null,
  )
  if (
    !parsed.success ||
    !until.success ||
    (until.data && until.data < parsed.data)
  )
    return {
      label: 'Revisá la vigencia',
      description:
        'Completá un rango de fechas válido para saber cuándo aparecerá en el sitio.',
    }
  if (until.data && until.data < today)
    return {
      label: 'Vigencia finalizada',
      description:
        'Estas fechas ya pasaron. Aunque la publiques, no aparecerá entre las tarifas vigentes.',
    }
  if (parsed.data > today)
    return {
      label: 'Vigencia futura',
      description:
        'Al publicarla, aparecerá automáticamente desde la fecha de inicio elegida.',
    }
  return {
    label: 'Dentro de la vigencia',
    description: 'Al publicarla, aparecerá en la sección de pileta del sitio.',
  }
}
