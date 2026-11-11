const parts = (isoDate: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-AR', { ...options, timeZone: 'UTC' })
    .format(new Date(isoDate))
    .replace('.', '')

// Calendar dates keep their day; instants use the club's local zone.
export function getClubToday(now = new Date()): string {
  const values = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    values.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

export const formatShortDate = (isoDate: string) => {
  const day = parts(isoDate, { day: '2-digit' })
  const month = parts(isoDate, { month: 'short' }).toUpperCase()
  const year = parts(isoDate, { year: 'numeric' })
  return `${day} ${month} ${year}`
}

export const formatLongDate = (isoDate: string) =>
  parts(isoDate, { day: 'numeric', month: 'long', year: 'numeric' })

export const formatDayMonth = (isoDate: string) => ({
  day: parts(isoDate, { day: '2-digit' }),
  month: parts(isoDate, { month: 'short' }).toUpperCase(),
})

const relative = new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' })
/** "hace 5 minutos", "hace 3 horas", "ayer": coarse on purpose, for quick reading. */
export function formatRelative(instant: string, now = Date.now()) {
  const seconds = Math.round((new Date(instant).getTime() - now) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units)
    if (Math.abs(seconds) >= size)
      return relative.format(Math.trunc(seconds / size), unit)
  return 'recién'
}
