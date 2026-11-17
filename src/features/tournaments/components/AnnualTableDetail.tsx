import { useState } from 'react'
import { CheckCircle2, ChevronLeft, Clock3 } from 'lucide-react'
import { Link } from 'react-router'
import { formatLongDate } from '@/shared/lib/dates'
import { button, textLink } from '@/shared/ui/button'
import {
  annualTableDescription,
  annualTableTitle,
} from '@/shared/seo/pages.mjs'
import { container } from '@/shared/ui/layout'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { useAnnualTable } from '../hooks/useTournaments'
import { AnnualStandings } from './AnnualStandings'

const back = (
  <Link to="/torneos" className={textLink}>
    <ChevronLeft size={18} aria-hidden="true" />
    Todos los torneos
  </Link>
)

export function AnnualTableDetail({ id }: { id: string }) {
  const query = useAnnualTable(id)
  const table = query.data
  const [chosen, setChosen] = useState<string | null>(null)
  if (query.isPending)
    return (
      <section
        role="status"
        aria-label="Cargando tabla anual"
        className={`${container} py-12`}
      >
        <span className="sr-only">Cargando la tabla anual…</span>
        <div
          aria-hidden="true"
          className="grid gap-4 motion-safe:animate-pulse"
        >
          <div className="h-4 w-36 rounded bg-mist-50" />
          <div className="h-12 w-2/3 rounded bg-navy-900/10" />
          <div className="h-64 rounded-2xl bg-mist-50" />
        </div>
      </section>
    )
  if (!table)
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <title>
          Tabla anual no disponible | Club de Pescadores San Nicolás
        </title>
        {!query.isError && <meta name="robots" content="noindex" />}
        <h1 className="text-3xl font-extrabold">
          {query.isError
            ? 'No pudimos cargar la tabla anual'
            : 'Esta tabla anual no está disponible'}
        </h1>
        <p className="mt-4 leading-7 text-ink-600">
          {query.isError
            ? 'Revisá tu conexión y volvé a intentarlo.'
            : 'Podés consultar los torneos y las otras tablas del club.'}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-4">
          {query.isError && (
            <button
              type="button"
              className={button.primary}
              onClick={() => {
                void query.refetch()
              }}
            >
              Reintentar
            </button>
          )}
          {back}
        </div>
      </section>
    )
  const category =
    table.categories.find((entry) => entry.id === chosen) ??
    table.categories[0] ??
    null
  const finished = table.tournaments.filter((entry) => entry.finished).length
  return (
    <>
      <title>{annualTableTitle(table)}</title>
      <meta name="description" content={annualTableDescription(table)} />
      <link
        rel="canonical"
        href={`${import.meta.env.VITE_SITE_URL}/torneos/anual/${table.id}`}
      />
      <header className="border-b border-navy-900/5 bg-mist-50">
        <div className={`${container} pt-6 pb-10 sm:pb-12`}>
          {back}
          <p className="mt-5">
            <span className="inline-flex rounded-full bg-sun-400 px-2.5 py-1 text-xs font-extrabold text-navy-950">
              Tabla anual {table.year}
            </span>
          </p>
          <h1 className="mt-3 text-3xl font-extrabold wrap-anywhere sm:text-4xl">
            {table.name}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-600">
            Suma los puntos de cada participante en los torneos finalizados de
            la temporada
            {finished > 0
              ? ` (${finished} ${finished === 1 ? 'torneo' : 'torneos'} hasta ahora).`
              : '.'}
          </p>
        </div>
      </header>
      <section
        aria-label="Posiciones de la tabla anual"
        className={`${container} max-w-3xl py-10 lg:py-14`}
      >
        <div className="mb-8">
          <SectionHeading
            title="Posiciones"
            description="Se actualiza cuando termina cada torneo."
          />
        </div>
        {!category ? (
          <p className="rounded-2xl border border-dashed border-navy-900/15 px-5 py-10 text-center text-sm text-ink-600">
            Todavía no hay torneos en esta tabla.
          </p>
        ) : (
          <div className="grid gap-5">
            {table.categories.length > 1 && (
              <div
                role="group"
                aria-label="Categoría"
                className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
              >
                {table.categories.map((entry) => {
                  const active = entry.id === category.id
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setChosen(entry.id)}
                      className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-5 text-sm font-bold transition-colors ${active ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 bg-white text-navy-900 hover:bg-mist-50'}`}
                    >
                      {entry.name}
                    </button>
                  )
                })}
              </div>
            )}
            <h3 className="text-lg font-extrabold">
              Categoría {category.name}
            </h3>
            <AnnualStandings
              key={category.id}
              table={table.id}
              category={category.id}
            />
          </div>
        )}
      </section>
      {table.tournaments.length > 0 && (
        <section
          aria-labelledby="annual-tournaments"
          className={`${container} max-w-3xl pb-14 lg:pb-20`}
        >
          <h2 id="annual-tournaments" className="text-xl font-extrabold">
            Torneos de la temporada
          </h2>
          <ul className="mt-4 divide-y divide-navy-900/5 overflow-hidden rounded-2xl border border-navy-900/5 bg-white shadow-card">
            {table.tournaments.map((tournament) => (
              <li key={tournament.id}>
                <Link
                  to={`/torneos/${tournament.id}`}
                  className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-mist-50 sm:px-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold wrap-anywhere">
                      {tournament.name}
                    </span>
                    <time
                      dateTime={tournament.startsOn}
                      className="text-sm text-ink-600"
                    >
                      {formatLongDate(tournament.startsOn)}
                    </time>
                  </span>
                  {tournament.finished ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-800">
                      <CheckCircle2 size={16} aria-hidden="true" />
                      Ya suma
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-600">
                      <Clock3 size={16} aria-hidden="true" />
                      Suma al finalizar
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
