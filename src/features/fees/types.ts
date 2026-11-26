export const FEE_KINDS = ['membership', 'service'] as const
export type FeeKind = (typeof FEE_KINDS)[number]

/** Pictograms the club notice uses; the database accepts only these names. */
export const FEE_ICONS = [
  'person',
  'family',
  'senior',
  'sailboat',
  'boat',
  'garage',
  'rack',
  'kayak',
  'anchor',
  'tent',
  'caravan',
  'motorhome',
  'ticket',
] as const
export type FeeIcon = (typeof FEE_ICONS)[number]

export type Fee = {
  id: string
  kind: FeeKind
  name: string
  detail: string | null
  icon: FeeIcon
  /** Whole pesos, with decimals only when a price has cents. */
  price: number
}
export type FeeSchedule = {
  /** First day of the month the values apply from (YYYY-MM-DD). */
  validFrom: string
  note: string | null
  fees: Fee[]
}
