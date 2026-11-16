import { Clock3, Waves } from 'lucide-react'
import { useRiverLevel } from '../hooks/useRiverLevel'
import {
  formatRiverDate,
  formatRiverHeight,
  formatRiverShortDate,
  isRiverReadingOld,
} from '../format'

export function RiverLevelBar() {
  const { query, now } = useRiverLevel()
  const reading = query.data
  const old = reading ? isRiverReadingOld(reading.measured_at, now) : false
  return (
    <section
      id="altura-del-rio"
      aria-label="Altura del río"
      className="bg-navy-950 px-4 py-2.5 sm:px-6 sm:py-2"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs leading-5 text-white/75 sm:justify-start">
        <div className="flex min-w-0 items-center gap-2 sm:contents">
          <h2 className="flex shrink-0 items-center gap-1.5 font-semibold">
            <Waves size={15} aria-hidden="true" className="text-sun-400" />
            Altura del río
          </h2>
          {reading && (
            <p className="shrink-0 rounded-md bg-white/10 px-2 text-sm leading-6 font-extrabold whitespace-nowrap text-white tabular-nums sm:bg-transparent sm:px-0 sm:text-xs sm:leading-5">
              {formatRiverHeight(reading.height_cm)}
            </p>
          )}
        </div>
        {query.isPending ? (
          <p role="status">Consultando última medición…</p>
        ) : reading ? (
          <>
            {/* Phones: short time and a compact age notice, on the same line. */}
            <p className="flex shrink-0 items-center gap-2 whitespace-nowrap tabular-nums sm:contents">
              <span aria-hidden="true" className="sm:hidden">
                {formatRiverShortDate(reading.measured_at)}
              </span>
              <span className="sr-only sm:not-sr-only sm:min-w-0 sm:whitespace-normal sm:wrap-anywhere">
                <span aria-hidden="true">· </span>
                <span>{reading.station}</span>
                <span aria-hidden="true"> · </span>
                <time dateTime={reading.measured_at}>
                  {formatRiverDate(reading.measured_at)}
                </time>{' '}
                (hora argentina)
              </span>
              {old && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sun-400/15 px-2 font-semibold text-sun-400 sm:bg-transparent sm:px-0">
                  <Clock3 size={13} aria-hidden="true" />
                  <span aria-hidden="true" className="sm:hidden">
                    +24 h
                  </span>
                  <span className="sr-only sm:not-sr-only">
                    Medición de hace más de 24 h
                  </span>
                </span>
              )}
            </p>
            <p className="hidden min-w-0 wrap-anywhere sm:block">
              Fuente: {reading.source}
            </p>
            {query.isError && (
              <p role="status" className="basis-full sm:basis-auto">
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
            className="min-h-6 rounded font-bold text-sun-400 underline-offset-2 hover:underline disabled:opacity-50"
          >
            Reintentar medición
          </button>
        )}
      </div>
    </section>
  )
}
