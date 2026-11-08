export function formText(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : ''
}
export function dateLabel(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value))
}
