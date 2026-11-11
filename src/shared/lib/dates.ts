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
