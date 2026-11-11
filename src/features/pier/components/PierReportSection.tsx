import { Clock3, Waves } from 'lucide-react'
import {
  formatRiverDate,
  formatRiverHeight,
  isRiverReadingOld,
} from '@/features/river'
import { MediaGallery } from '@/shared/ui/MediaGallery'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { useLatestPierReport } from '../hooks/useLatestPierReport'

export function PierReportSection() {
  const query = useLatestPierReport()
  const report = query.data
  // Until staff publish a first report there is nothing truthful to show.
  if (report === null) return null
  return (
    <section
      id="muelle"
      aria-label="Hoy en el muelle"
      className="bg-white py-14 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          title="Hoy en el muelle"
          description="El último parte del personal del club: altura del río, condiciones y fotos."
        />
        {query.isPending ? (
          <div
            role="status"
            aria-label="Cargando el parte del muelle"
            className="mt-8 h-72 rounded-2xl bg-mist-50 motion-safe:animate-pulse"
          />
        ) : !report ? (
          <div role="alert" className="mt-8 text-ink-600">
            <p>No pudimos cargar el parte del muelle.</p>
            <button
              type="button"
              onClick={() => {
                void query.refetch()
              }}
              className="mt-2 min-h-11 font-bold text-river-600 hover:underline"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-10">
            <div className="min-w-0 rounded-2xl bg-mist-50 p-6">
              <p className="flex items-center gap-2 text-sm font-bold text-ink-600">
                <Waves
                  size={18}
                  aria-hidden="true"
                  className="text-river-600"
                />
                Altura del río
              </p>
              <p className="mt-2 text-5xl font-extrabold tracking-tight tabular-nums text-navy-900">
                {formatRiverHeight(report.heightCm)}
              </p>
              <p className="mt-3 text-sm text-ink-600">
                Parte del{' '}
                <time dateTime={report.measuredAt} className="font-semibold">
                  {formatRiverDate(report.measuredAt)}
                </time>{' '}
                · Hora argentina
              </p>
              {isRiverReadingOld(report.measuredAt) && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                  <Clock3 size={14} aria-hidden="true" />
                  Parte de hace más de 24 h
                </p>
              )}
              {report.conditions && (
                <p className="mt-5 border-t border-navy-900/10 pt-5 text-base leading-7 whitespace-pre-wrap wrap-anywhere text-navy-900">
                  {report.conditions}
                </p>
              )}
            </div>
            <div className="min-w-0">
              {report.media.length > 0 ? (
                <MediaGallery
                  items={report.media}
                  label="Fotos y videos del muelle"
                />
              ) : (
                <p className="text-sm text-ink-600">
                  Este parte no tiene fotos.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
