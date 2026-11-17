import { ArrowRight, CalendarRange } from 'lucide-react'
import { Link } from 'react-router'
import { useAnnualTables } from '../hooks/useTournaments'

const grid =
  'grid min-w-0 grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))] gap-4 sm:gap-6'

/** Season tables above the tournaments. Without any, the section stays out of the way. */
export function AnnualTablesList() {
  const query = useAnnualTables()
  if (query.isPending)
    return (
      <div
        role="status"
        aria-label="Cargando tablas anuales"
        className={`${grid} mb-12 motion-safe:animate-pulse`}
      >
        <div className="h-24 rounded-2xl bg-mist-50" />
      </div>
    )
  const tables = query.data ?? []
  if (!tables.length) return null
  return (
    <section aria-labelledby="annual-tables-title" className="mb-12 lg:mb-16">
      <h2
        id="annual-tables-title"
        className="font-display text-3xl tracking-wide uppercase sm:text-4xl"
      >
        Tablas anuales
      </h2>
      <p className="mt-2 text-ink-600">
        Los puntos de cada torneo finalizado se suman en la tabla de la
        temporada, por categoría.
      </p>
      <ul className={`${grid} mt-6`}>
        {tables.map((table) => (
          <li key={table.id} className="min-w-0">
            <Link
              to={`/torneos/anual/${table.id}`}
              className="group flex h-full min-w-0 items-start gap-4 rounded-2xl border border-sun-400/60 bg-sun-400/10 p-4 shadow-card hover:border-sun-400 sm:p-5"
            >
              <span
                aria-hidden="true"
                className="grid size-12 shrink-0 place-items-center rounded-xl bg-sun-400 text-navy-950"
              >
                <CalendarRange size={22} />
              </span>
              <span className="min-w-0 flex-1 wrap-anywhere">
                <span className="text-xs font-extrabold tracking-wider text-ink-600 uppercase">
                  Temporada {table.year}
                </span>
                <span className="mt-1 block text-lg leading-snug font-bold group-hover:text-river-600">
                  {table.name}
                </span>
                <span className="mt-1 block text-sm text-ink-600">
                  {table.finished === 0
                    ? 'Todavía sin torneos finalizados'
                    : `${table.finished} ${table.finished === 1 ? 'torneo finalizado' : 'torneos finalizados'}`}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="mt-1 size-5 shrink-0 text-ink-600"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
