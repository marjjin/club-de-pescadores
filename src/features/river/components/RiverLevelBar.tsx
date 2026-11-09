import { Clock3, Waves } from 'lucide-react'
import { useRiverLevel } from '../hooks/useRiverLevel'
import {
  formatRiverDate,
  formatRiverHeight,
  isRiverReadingOld,
} from '../format'

export function RiverLevelBar() {
  const { query, now } = useRiverLevel()
  const reading = query.data
  return (
    <section
      id="altura-del-rio"
      aria-label="Altura del río"
      className="border-b border-navy-900/10 bg-mist-50 px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-8 gap-y-2">
        <div className="flex shrink-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-white text-river-600"
          >
            <Waves size={20} />
          </span>
          <h2 className="text-sm font-extrabold">Altura del río</h2>
        </div>
        {query.isPending ? (
          <p role="status" className="text-sm text-ink-600">
            Consultando última medición…
          </p>
        ) : reading ? (
          <>
            <p className="text-2xl font-extrabold tabular-nums text-navy-900">
              {formatRiverHeight(reading.height_cm)}
            </p>
            <div className="min-w-0 basis-full text-xs leading-5 wrap-anywhere text-ink-600 sm:flex-1 sm:basis-64">
              <p className="font-bold text-navy-900">{reading.station}</p>
              <p>
                Medición:{' '}
                <time dateTime={reading.measured_at}>
                  {formatRiverDate(reading.measured_at)}
                </time>{' '}
                · Hora argentina
              </p>
              <p>Fuente: {reading.source}</p>
            </div>
            {isRiverReadingOld(reading.measured_at, now) && (
              <p className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                <Clock3 size={15} aria-hidden="true" />
                Medición de hace más de 24 h
              </p>
            )}
            {query.isError && (
              <p role="status" className="text-xs text-ink-600">
                No pudimos actualizar el dato. Se muestra la última medición
                disponible.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-600">
            {query.isError
              ? 'No pudimos consultar la altura del río.'
              : 'Todavía no hay una medición publicada.'}
          </p>
        )}
        {query.isError && (
          <button
            type="button"
            disabled={query.isFetching}
            onClick={() => {
              void query.refetch()
            }}
            className="min-h-11 text-sm font-bold text-river-600 hover:underline disabled:opacity-50"
          >
            Reintentar medición
          </button>
        )}
      </div>
    </section>
  )
}
