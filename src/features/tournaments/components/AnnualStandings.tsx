import { useState } from 'react'
import { QueryBoundary } from '@/shared/ui/QueryBoundary'
import { useAnnualStandings } from '../hooks/useTournaments'

const podium: Record<number, string> = {
  1: 'bg-sun-400 text-navy-950',
  2: 'bg-mist-100 text-navy-900',
  3: 'bg-amber-100 text-amber-950',
}
const points = new Intl.NumberFormat('es-AR')
const PAGE = 50

export function AnnualStandings({
  table,
  category,
}: {
  table: string
  category: string
}) {
  const query = useAnnualStandings(table, category)
  const [shown, setShown] = useState(PAGE)
  return (
    <QueryBoundary
      query={query}
      emptyMessage="Todavía no hay torneos finalizados que sumen en esta categoría."
      loading={
        <div
          role="status"
          aria-label="Cargando tabla anual"
          className="grid gap-2 motion-safe:animate-pulse"
        >
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-14 rounded-xl bg-navy-900/8" />
          ))}
        </div>
      }
    >
      {(rows) => (
        <div className="grid gap-4">
          <div className="overflow-hidden rounded-2xl border border-navy-900/5 bg-white shadow-card">
            <table className="w-full table-fixed text-left">
              <caption className="sr-only">
                Tabla anual. Los participantes empatados comparten el puesto.
              </caption>
              <thead className="bg-navy-900 text-xs tracking-wider text-white uppercase">
                <tr>
                  <th scope="col" className="w-20 px-4 py-3 sm:w-24">
                    Puesto
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Participante
                  </th>
                  <th
                    scope="col"
                    className="hidden w-24 px-4 py-3 text-right sm:table-cell"
                  >
                    Torneos
                  </th>
                  <th scope="col" className="w-24 px-4 py-3 text-right sm:w-32">
                    Puntos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-900/5">
                {rows.slice(0, shown).map((row, index) => (
                  // Rows carry no id on purpose: the site never links people across tables.
                  <tr key={`${index}:${row.name}`}>
                    <td className="px-4 py-3">
                      <span
                        className={`grid size-9 place-items-center rounded-full text-sm font-extrabold tabular-nums ${
                          podium[row.ranking] ?? 'text-ink-600'
                        }`}
                      >
                        {row.ranking}
                      </span>
                    </td>
                    <th scope="row" className="px-4 py-3 wrap-anywhere">
                      <span className="block font-bold">{row.name}</span>
                      <span className="text-xs font-normal text-ink-600 sm:hidden">
                        {row.tournaments}{' '}
                        {row.tournaments === 1 ? 'torneo' : 'torneos'}
                      </span>
                    </th>
                    <td className="hidden px-4 py-3 text-right text-ink-600 tabular-nums sm:table-cell">
                      {row.tournaments}
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-extrabold tabular-nums">
                      {points.format(row.points)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > shown && (
            <button
              type="button"
              onClick={() => setShown((value) => value + PAGE)}
              className="justify-self-center rounded-full border border-navy-900/15 bg-white px-5 py-2.5 text-sm font-bold hover:bg-mist-50"
            >
              Ver más participantes
            </button>
          )}
        </div>
      )}
    </QueryBoundary>
  )
}
