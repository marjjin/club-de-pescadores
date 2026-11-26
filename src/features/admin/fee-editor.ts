import { MAX_FEES_PER_KIND } from '@/features/fees'
import type { FeeKind } from '@/features/fees'
import type { AdminFees, FeeDraft, FeesDraft, FeesInput } from './schemas/fees'

const MAX_CENTS = 2147483647
const thousands = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Cents → what the price field shows: "176.000" or "1.250,50". */
export const centsToField = (cents: number) => thousands.format(cents / 100)

/**
 * Reads a price the way people write it here: "176.000", "176000", "$ 1.250,50".
 * Returns null when it is not a valid amount.
 */
export function fieldToCents(value: string): number | null {
  const clean = value.replace(/\$|\s/g, '')
  const grouped = /^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(clean)
  if (!grouped && !/^\d+(,\d{1,2})?$/.test(clean)) return null
  const [whole = '', decimals = ''] = clean.replaceAll('.', '').split(',')
  const cents = Number(whole) * 100 + Number(decimals.padEnd(2, '0'))
  return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null
}

export function toFeesDraft(data: AdminFees): FeesDraft {
  return {
    month: data.valid_from.slice(0, 7),
    note: data.note ?? '',
    fees: data.fees.map((fee) => ({
      key: fee.id,
      id: fee.id,
      kind: fee.kind,
      name: fee.name,
      detail: fee.detail ?? '',
      icon: fee.icon,
      price: centsToField(fee.price_cents),
    })),
  }
}

/** Errors by field: "month", "note", "kind:membership" or "<row key>.<field>". */
export type FeeErrors = Record<string, string>

export function validateFeesDraft(
  draft: FeesDraft,
): { success: true; data: FeesInput } | { success: false; errors: FeeErrors } {
  const errors: FeeErrors = {}
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(draft.month))
    errors.month = 'Elegí el mes desde el que rigen los valores.'
  if (draft.note.trim().length > 300)
    errors.note = 'Usá hasta 300 caracteres en la aclaración.'
  const fees: FeesInput['fees'] = []
  for (const fee of draft.fees) {
    const name = fee.name.trim()
    const detail = fee.detail.trim()
    if (!name) errors[`${fee.key}.name`] = 'Completá el nombre.'
    else if (name.length > 60)
      errors[`${fee.key}.name`] = 'Usá hasta 60 caracteres.'
    if (detail.length > 120)
      errors[`${fee.key}.detail`] = 'Usá hasta 120 caracteres.'
    const cents = fieldToCents(fee.price)
    if (cents === null)
      errors[`${fee.key}.price`] = fee.price.trim()
        ? 'Escribí solo el número, por ejemplo 30.000.'
        : 'Completá el precio.'
    fees.push({
      id: fee.id,
      kind: fee.kind,
      name,
      detail: detail || null,
      icon: fee.icon,
      price_cents: cents ?? 0,
    })
  }
  for (const kind of ['membership', 'service'] as const) {
    const count = draft.fees.filter((fee) => fee.kind === kind).length
    if (count > MAX_FEES_PER_KIND)
      errors[`kind:${kind}`] = `Se admiten hasta ${MAX_FEES_PER_KIND} filas.`
  }
  if (!draft.fees.length) errors['kind:membership'] = 'Cargá al menos un valor.'
  if (Object.keys(errors).length) return { success: false, errors }
  return {
    success: true,
    data: {
      valid_from: `${draft.month}-01`,
      note: draft.note.trim() || null,
      fees,
    },
  }
}

/** Moves a row one place within its own list; the other list stays as it is. */
export function moveFee(fees: FeeDraft[], key: string, step: -1 | 1) {
  const row = fees.find((fee) => fee.key === key)
  if (!row) return fees
  const sameKind = fees.filter((fee) => fee.kind === row.kind)
  const from = sameKind.indexOf(row)
  const to = from + step
  if (to < 0 || to >= sameKind.length) return fees
  sameKind.splice(from, 1)
  sameKind.splice(to, 0, row)
  const others = fees.filter((fee) => fee.kind !== row.kind)
  return row.kind === 'membership'
    ? [...sameKind, ...others]
    : [...others, ...sameKind]
}

export const kindLabels: Record<FeeKind, { title: string; item: string }> = {
  membership: { title: 'Cuotas', item: 'cuota' },
  service: { title: 'Servicios', item: 'servicio' },
}
