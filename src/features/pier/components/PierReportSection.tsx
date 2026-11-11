import { Check, Clock3, Waves, X } from 'lucide-react'
import {
  formatRiverDate,
  formatRiverHeight,
  isRiverReadingOld,
} from '@/features/river'
import { formatRelative } from '@/shared/lib/dates'
import { MediaGallery } from '@/shared/ui/MediaGallery'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { readConditions } from '../conditions'
import type { ConditionTone } from '../conditions'
import { useLatestPierReport } from '../hooks/useLatestPierReport'

const tones: Record<ConditionTone, string> = {
  good: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warn: 'bg-amber-50 text-amber-900 ring-amber-200',
  bad: 'bg-red-50 text-red-800 ring-red-200',
}

export function PierReportSection() {
  const query = useLatestPierReport()
  const report = query.data
  // Until staff publish a first report there is nothing truthful to show.
  if (report === null) return null
  const conditions = report ? readConditions(report.conditions ?? '') : null
  const canFish = conditions?.fishing?.tone === 'good'
  return (
    <section
      id="muelle"
      aria-label="Hoy en el muelle"
      className="bg-mist-50 py-14 lg:py-20"
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
            className="mt-8 h-96 rounded-2xl bg-white motion-safe:animate-pulse"
          />
        ) : !report || !conditions ? (
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
          <article className="mt-8 overflow-hidden rounded-2xl border border-navy-900/10 border-t-4 border-t-sun-400 bg-white shadow-card">
            <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-10">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-bold text-ink-600">
                  <Waves
                    size={18}
                    aria-hidden="true"
                    className="text-river-600"
                  />
                  Altura del río
                </p>
                <p className="mt-1 text-5xl font-extrabold tracking-tight tabular-nums text-navy-900 sm:text-6xl">
                  {formatRiverHeight(report.heightCm)}
                </p>
                <p className="mt-2 text-sm text-ink-600">
                  Parte{' '}
                  <time
                    dateTime={report.measuredAt}
                    className="font-bold text-navy-900"
                  >
                    {formatRelative(report.measuredAt)}
                  </time>{' '}
                  · {formatRiverDate(report.measuredAt)}
                </p>
                {isRiverReadingOld(report.measuredAt) && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sun-400 px-3 py-1 text-xs font-bold text-navy-950">
                    <Clock3 size={14} aria-hidden="true" />
                    Parte de hace más de 24 h
                  </p>
                )}
              </div>
              <div className="min-w-0 md:border-l md:border-navy-900/10 md:pl-10">
                {conditions.fishing && (
                  <p
                    className={`inline-flex items-center gap-3 rounded-full py-1.5 pr-5 pl-1.5 text-lg font-extrabold ring-1 ${canFish ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-red-50 text-red-800 ring-red-200'}`}
                  >
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-full text-white ${canFish ? 'bg-emerald-700' : 'bg-red-700'}`}
                    >
                      {canFish ? (
                        <Check size={22} aria-hidden="true" />
                      ) : (
                        <X size={22} aria-hidden="true" />
                      )}
                    </span>
                    {conditions.fishing.label}
                  </p>
                )}
                {conditions.others.length > 0 && (
                  <ul
                    aria-label="Condiciones"
                    className="mt-4 flex flex-wrap gap-2"
                  >
                    {conditions.others.map((item) => (
                      <li
                        key={item.label}
                        className={`rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${tones[item.tone]}`}
                      >
                        {item.label}
                      </li>
                    ))}
                  </ul>
                )}
                {conditions.notes && (
                  <p className="mt-4 text-sm leading-6 whitespace-pre-wrap wrap-anywhere text-navy-900">
                    {conditions.notes}
                  </p>
                )}
                {!conditions.fishing &&
                  !conditions.others.length &&
                  !conditions.notes && (
                    <p className="text-sm text-ink-600">
                      Este parte no informa condiciones del muelle.
                    </p>
                  )}
              </div>
            </div>
            {report.media.length > 0 && (
              // Fixed height: tiles crop to fill it, so tall phone photos never stretch it.
              <div className="h-72 border-t border-navy-900/10 p-2 sm:h-96 sm:p-3 lg:h-[30rem]">
                <MediaGallery
                  items={report.media}
                  label="Fotos y videos del muelle"
                />
              </div>
            )}
          </article>
        )}
      </div>
    </section>
  )
}
