import { Clock, Eye, MapPin } from 'lucide-react'
import type { EventEditorValues } from '../../event-editor'

const months = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
]

// Mirrors the public agenda card so editors see the real result.
export function EventPreview({ values }: { values: EventEditorValues }) {
  const [, month, day] = values.date.split('-')
  const monthLabel = month ? months[Number(month) - 1] : undefined
  return (
    <section
      aria-label="Vista previa en vivo"
      className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold">Así se verá en la agenda</h2>
        <Eye size={16} aria-hidden="true" className="text-ink-600" />
      </div>
      <div className="flex items-center gap-4 rounded-md bg-mist-50 p-4">
        <div className="w-16 shrink-0 rounded-md bg-navy-900 py-3 text-center text-white">
          <span className="block text-3xl leading-none font-extrabold">
            {day ?? '--'}
          </span>
          <span className="mt-1 block text-sm font-bold text-sun-400">
            {monthLabel ?? 'MES'}
          </span>
        </div>
        <div className="min-w-0">
          <p
            className={`text-lg leading-snug font-bold break-words ${values.title.trim() ? '' : 'text-ink-600/70'}`}
          >
            {values.title.trim() || 'Título del evento'}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-600">
            <MapPin aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{values.place.trim() || 'Lugar'}</span>
          </p>
          <p className="flex items-center gap-1.5 text-sm text-ink-600">
            <Clock aria-hidden="true" className="size-4 shrink-0" />
            {values.time || '--:--'} hs
          </p>
          {values.description.trim() && (
            <p className="mt-2 line-clamp-3 text-sm leading-5 break-words whitespace-pre-line">
              {values.description.trim()}
            </p>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-ink-600">
        {values.is_published
          ? 'Se mostrará en el sitio al guardar.'
          : 'Borrador: todavía no se muestra en el sitio.'}
      </p>
    </section>
  )
}
