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
      className="border-b border-navy-900/5 bg-mist-50/60 px-4 py-1.5 sm:px-6"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-x-2 sm:flex-wrap sm:gap-x-3 gap-y-0.5 text-xs leading-5 text-ink-600">
        <h2 className="flex shrink-0 items-center gap-1.5 font-semibold">
          <Waves size={14} aria-hidden="true" className="text-river-600" />
          Altura del río
        </h2>
        {query.isPending ? (
          <p role="status">Consultando última medición…</p>
        ) : reading ? (
          <>
            <p className="font-bold tabular-nums text-navy-900">
              {formatRiverHeight(reading.height_cm)}
            </p>
            {/* Mobile keeps only height and time so the bar stays one line. */}
            <p className="min-w-0 truncate sm:overflow-visible sm:whitespace-normal sm:wrap-anywhere">
              <span aria-hidden="true">· </span>
              <span className="hidden sm:inline">{reading.station}</span>
              <span aria-hidden="true" className="hidden sm:inline">
                {' '}
                ·{' '}
              </span>
              <time dateTime={reading.measured_at}>
                {formatRiverDate(reading.measured_at)}
              </time>
              <span className="hidden sm:inline"> (hora argentina)</span>
            </p>
            <p className="hidden min-w-0 wrap-anywhere sm:block">
              Fuente: {reading.source}
            </p>
            {isRiverReadingOld(reading.measured_at, now) && (
              <p className="inline-flex items-center gap-1 font-semibold text-amber-800">
                <Clock3 size={13} aria-hidden="true" />
                Medición de hace más de 24 h
              </p>
            )}
            {query.isError && (
              <p role="status">
                No pudimos actualizar el dato. Se muestra la última medición
                disponible.
              </p>
            )}
          </>
        ) : (
          <p>
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
            className="min-h-6 font-bold text-river-600 hover:underline disabled:opacity-50"
          >
            Reintentar medición
          </button>
        )}
      </div>
    </section>
  )
}
