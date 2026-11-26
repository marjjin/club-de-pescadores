const price = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  // Whole pesos read as "$ 30.000"; cents still show when a price has them.
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
export const formatFeePrice = (pesos: number) => price.format(pesos)

const month = new Intl.DateTimeFormat('es-AR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
/** "2026-10-01" → "octubre de 2026". Parsed as UTC so no time zone shifts the month. */
export function formatValidFrom(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? '' : month.format(parsed)
}
