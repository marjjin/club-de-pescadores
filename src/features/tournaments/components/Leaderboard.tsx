import { PagerNav } from '@/shared/ui/PagerNav'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { useLeaderboard } from '../hooks/useTournaments'

const podium: Record<number, string> = {
  1: 'bg-sun-400 text-navy-950',
  2: 'bg-mist-100 text-navy-900',
  3: 'bg-amber-100 text-amber-950',
}
const points = new Intl.NumberFormat('es-AR')

export function Leaderboard({ id, live }: { id: string; live: boolean }) {
  const { query, hasPrevious, canNext, previous, next } = useLeaderboard(
    id,
    live,
  )
  return (
    <div>
      <QueryBoundary
        query={{ ...query, data: query.data?.items }}
        emptyMessage="Todavía no hay participantes en la tabla."
        loading={
          <div
            role="status"
            aria-label="Cargando tabla de posiciones"
            className="grid gap-2 motion-safe:animate-pulse"
          >
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="h-14 rounded-xl bg-navy-900/8" />
            ))}
          </div>
        }
      >
        {(items) => (
          <div className="overflow-hidden rounded-2xl border border-navy-900/5 bg-white shadow-card">
            <table className="w-full table-fixed text-left">
              <caption className="sr-only">
                Tabla de posiciones. Los participantes empatados comparten el
                puesto.
              </caption>
              <thead className="bg-navy-900 text-xs tracking-wider text-white uppercase">
                <tr>
                  <th scope="col" className="w-20 px-4 py-3 sm:w-24">
                    Puesto
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Participante
                  </th>
                  <th scope="col" className="w-24 px-4 py-3 text-right sm:w-32">
                    Puntos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/5">
                {items.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">
                      <span
                        className={`grid size-9 place-items-center rounded-full text-sm font-extrabold tabular-nums ${
                          podium[row.ranking] ?? 'text-ink-600'
                        }`}
                      >
                        {row.ranking}
                      </span>
                    </td>
                    <th
                      scope="row"
                      className="px-4 py-3 font-bold wrap-anywhere"
                    >
                      {row.name}
                    </th>
                    <td className="px-4 py-3 text-right text-lg font-extrabold tabular-nums">
                      {points.format(row.points)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryBoundary>
      <PagerNav
        label="Paginación de la tabla"
        canPrevious={hasPrevious && !query.isFetching}
        canNext={canNext}
        onPrevious={previous}
        onNext={next}
        busyMessage={query.isFetching ? 'Actualizando posiciones…' : undefined}
      />
    </div>
  )
}
