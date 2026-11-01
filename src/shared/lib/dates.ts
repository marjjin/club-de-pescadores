const parts = (isoDate: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-AR', { ...options, timeZone: 'UTC' })
    .format(new Date(isoDate))
    .replace('.', '')

export const formatShortDate = (isoDate: string) => {
  const day = parts(isoDate, { day: '2-digit' })
  const month = parts(isoDate, { month: 'short' }).toUpperCase()
  const year = parts(isoDate, { year: 'numeric' })
  return `${day} ${month} ${year}`
}

export const formatDayMonth = (isoDate: string) => ({
  day: parts(isoDate, { day: '2-digit' }),
  month: parts(isoDate, { month: 'short' }).toUpperCase(),
})
