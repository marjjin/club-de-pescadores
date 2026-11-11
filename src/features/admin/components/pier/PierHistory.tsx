import { Eye, EyeOff, Images, UserRound } from 'lucide-react'
import { formatRiverDate, formatRiverHeight } from '@/features/river'
import { formatRelative } from '@/shared/lib/dates'
import { useConfirm } from '../../hooks/useConfirm'
import { usePierReports, useTogglePier } from '../../hooks/usePier'
import type { PierReport } from '../../schemas/pier'
import { Feedback, secondaryClass } from '../ui'

// The local part is enough to tell staff apart and avoids printing full addresses.
const author = (email: string | null) => email?.split('@')[0] ?? 'Sin autor'

function Status({ report, live }: { report: PierReport; live: boolean }) {
  const [label, style] = live
    ? ['En el sitio ahora', 'bg-emerald-50 text-emerald-800 border-emerald-200']
    : report.is_published
      ? ['Publicado', 'bg-mist-50 text-navy-900 border-navy-900/10']
      : ['Retirado', 'bg-amber-50 text-amber-900 border-amber-200']
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-bold ${style}`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

export function PierHistory({ userId }: { userId: string }) {
  const query = usePierReports(userId)
  const toggle = useTogglePier(userId)
  const confirm = useConfirm()
  const reports = query.data?.pages.flat() ?? []
  const liveId = reports.find((report) => report.is_published)?.id
  return (
    <section
      aria-label="Partes publicados"
      className="min-w-0 rounded-2xl border border-navy-900/10 bg-white shadow-sm"
    >
      <h2 className="border-b border-navy-900/10 px-5 py-4 text-base font-extrabold">
        Últimos partes
      </h2>
      <div className="px-5 empty:hidden">
        <Feedback
          error={toggle.error ?? (reports.length ? null : query.error)}
        />
      </div>
      {query.isPending ? (
        <div
          role="status"
          aria-label="Cargando partes"
          className="grid gap-3 p-5 motion-safe:animate-pulse"
        >
          <div className="h-20 rounded-xl bg-mist-50" />
          <div className="h-20 rounded-xl bg-mist-50" />
        </div>
      ) : !reports.length ? (
        <p className="px-5 py-10 text-center text-sm text-ink-600">
          {query.isError
            ? 'No pudimos cargar los partes.'
            : 'Todavía no se publicó ningún parte. El primero aparecerá acá.'}
        </p>
      ) : (
        <ul className="divide-y divide-navy-900/10">
          {reports.map((report) => (
            <li
              key={report.id}
              className={`grid min-w-0 gap-2 px-5 py-4 ${report.is_published ? '' : 'bg-mist-50/50'}`}
            >
              <div className="flex min-w-0 items-center justify-between gap-3">
                <p className="text-2xl font-extrabold tabular-nums">
                  {formatRiverHeight(report.height_cm)}
                </p>
                <Status report={report} live={report.id === liveId} />
              </div>
              <p className="text-xs text-ink-600">
                <time
                  dateTime={report.measured_at}
                  title={formatRiverDate(report.measured_at)}
                >
                  <span className="font-semibold text-navy-900">
                    {formatRelative(report.measured_at)}
                  </span>{' '}
                  · {formatRiverDate(report.measured_at)}
                </time>
              </p>
              {report.conditions && (
                <p className="line-clamp-2 text-sm leading-5 wrap-anywhere text-navy-900">
                  {report.conditions}
                </p>
              )}
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-600">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    <UserRound size={13} aria-hidden="true" />
                    <span className="truncate">
                      {author(report.author_email)}
                    </span>
                  </span>
                  {report.media_count > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Images size={13} aria-hidden="true" />
                      {report.media_count}{' '}
                      {report.media_count === 1 ? 'archivo' : 'archivos'}
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-river-600 hover:bg-mist-50 disabled:opacity-50"
                  disabled={toggle.isPending}
                  onClick={() => {
                    void confirm(
                      report.is_published
                        ? {
                            title: '¿Retirar este parte del sitio?',
                            message:
                              'Deja de verse en el inicio. Podés volver a mostrarlo cuando quieras.',
                            confirmLabel: 'Retirar del sitio',
                            tone: 'danger',
                          }
                        : {
                            title: '¿Volver a mostrar este parte?',
                            message:
                              'Si es el más reciente, aparecerá en el inicio del sitio.',
                            confirmLabel: 'Volver a mostrar',
                          },
                    ).then((accepted) => {
                      if (accepted)
                        toggle.mutate({
                          id: report.id,
                          published: !report.is_published,
                        })
                    })
                  }}
                >
                  {report.is_published ? (
                    <EyeOff size={14} aria-hidden="true" />
                  ) : (
                    <Eye size={14} aria-hidden="true" />
                  )}
                  {report.is_published
                    ? 'Retirar del sitio'
                    : 'Volver a mostrar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {query.hasNextPage && (
        <div className="border-t border-navy-900/10 p-4 text-center">
          <button
            type="button"
            className={secondaryClass}
            disabled={query.isFetchingNextPage}
            onClick={() => {
              void query.fetchNextPage()
            }}
          >
            {query.isFetchingNextPage ? 'Cargando…' : 'Ver partes anteriores'}
          </button>
        </div>
      )}
    </section>
  )
}
