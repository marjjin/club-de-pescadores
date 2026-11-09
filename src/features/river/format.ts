const height = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const measurementDate = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/Argentina/Buenos_Aires',
})
export const formatRiverHeight = (centimeters: number) =>
  `${height.format(centimeters / 100)} m`
export const formatRiverDate = (instant: string) =>
  measurementDate.format(new Date(instant))
export const isRiverReadingOld = (instant: string, now = Date.now()) =>
  now - new Date(instant).getTime() > 24 * 60 * 60 * 1000
