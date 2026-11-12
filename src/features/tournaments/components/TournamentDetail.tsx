import { ChevronLeft, MapPin } from 'lucide-react'
import { Link } from 'react-router'
import { button, textLink } from '@/shared/ui/button'
import { container } from '@/shared/ui/layout'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { useTournament } from '../hooks/useTournaments'
import { Leaderboard } from './Leaderboard'
import { TournamentDates, TournamentStatus } from './TournamentDates'

const back = (
  <Link to="/torneos" className={textLink}>
    <ChevronLeft size={18} aria-hidden="true" />
    Todos los torneos
  </Link>
)

export function TournamentDetail({ id }: { id: string }) {
  const query = useTournament(id)
  const tournament = query.data
  if (query.isPending)
    return (
      <section
        role="status"
        aria-label="Cargando torneo"
        className={`${container} py-12`}
      >
        <span className="sr-only">Cargando el torneo…</span>
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
  if (!tournament)
    return (
      <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <title>Torneo no disponible | Club de Pescadores San Nicolás</title>
        {!query.isError && <meta name="robots" content="noindex" />}
        <h1 className="text-3xl font-extrabold">
          {query.isError
            ? 'No pudimos cargar el torneo'
            : 'Este torneo no está disponible'}
        </h1>
        <p className="mt-4 leading-7 text-ink-600">
          {query.isError
            ? 'Revisá tu conexión y volvé a intentarlo.'
            : 'Podés consultar los otros torneos del club.'}
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
  return (
    <>
      <title>{`${tournament.name} | Club de Pescadores San Nicolás`}</title>
      <meta
        name="description"
        content={`Tabla de posiciones de ${tournament.name}, torneo del Club de Pescadores San Nicolás.`}
      />
      <link
        rel="canonical"
        href={`${import.meta.env.VITE_SITE_URL}/torneos/${tournament.id}`}
      />
      <header className="border-b border-navy-900/5 bg-mist-50">
        <div className={`${container} pt-6 pb-10 sm:pb-12`}>
          {back}
          <div className="mt-5">
            <TournamentStatus finished={tournament.finished} />
          </div>
          <h1 className="mt-3 text-3xl font-extrabold wrap-anywhere sm:text-4xl">
            {tournament.name}
          </h1>
          <p className="mt-3 text-ink-600">
            <TournamentDates tournament={tournament} />
          </p>
          {tournament.place && (
            <p className="mt-1 flex items-start gap-1.5 text-ink-600">
              <MapPin aria-hidden="true" className="mt-1 size-4 shrink-0" />
              {tournament.place}
            </p>
          )}
        </div>
      </header>
      <section
        aria-label="Tabla de posiciones"
        className={`${container} max-w-3xl py-10 lg:py-14`}
      >
        <div className="mb-8">
          <SectionHeading
            title="Tabla de posiciones"
            description={
              tournament.finished
                ? 'Resultado final del torneo.'
                : 'Se actualiza sola mientras el torneo está en curso.'
            }
          />
        </div>
        <Leaderboard id={tournament.id} live={!tournament.finished} />
      </section>
    </>
  )
}
