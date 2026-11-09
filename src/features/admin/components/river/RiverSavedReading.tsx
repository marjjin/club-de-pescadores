import { Clock3, Eye, EyeOff, Waves } from 'lucide-react'
import { formatRiverDate, formatRiverHeight } from '@/features/river'
import type { AdminRiverReading } from '../../river-editor'

export function RiverSavedReading({
  reading,
}: {
  reading: AdminRiverReading | null
}) {
  return (
    <section
      aria-label="Medición guardada"
      className="mb-6 flex min-w-0 flex-col gap-4 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6"
    >
      <span
        aria-hidden="true"
        className="grid size-12 shrink-0 place-items-center rounded-xl bg-mist-50 text-river-600"
      >
        <Waves size={25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold tracking-wider text-ink-600 uppercase">
          Medición guardada
        </p>
        {reading ? (
          <>
            <div className="mt-1 flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="text-2xl font-extrabold tabular-nums">
                {formatRiverHeight(reading.height_cm)}
              </p>
              <p className="min-w-0 text-sm font-bold wrap-anywhere">
                {reading.station}
              </p>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-ink-600">
              <Clock3
                size={14}
                aria-hidden="true"
                className="mt-0.5 shrink-0"
              />
              <span>
                Medida el{' '}
                <time dateTime={reading.measured_at}>
                  {formatRiverDate(reading.measured_at)}
                </time>{' '}
                · Hora argentina
              </span>
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-1 text-base font-extrabold">
              Cargá la primera medición
            </h2>
            <p className="mt-1 text-xs leading-5 text-ink-600">
              Todavía no hay un dato guardado. Completá el valor y su origen
              para empezar.
            </p>
          </>
        )}
      </div>
      {reading && (
        <span
          className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${reading.is_published ? 'bg-emerald-50 text-emerald-800' : 'bg-mist-50 text-ink-600'}`}
        >
          {reading.is_published ? (
            <Eye size={14} aria-hidden="true" />
          ) : (
            <EyeOff size={14} aria-hidden="true" />
          )}
          {reading.is_published ? 'Publicada en el sitio' : 'Sin publicar'}
        </span>
      )}
    </section>
  )
}
