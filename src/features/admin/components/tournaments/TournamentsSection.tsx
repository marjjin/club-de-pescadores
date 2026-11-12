import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ChevronRight, Plus, Users } from 'lucide-react'
import { formatShortDate } from '@/shared/lib/dates'
import { useAccess } from '../../hooks/useAccess'
import { useTournamentList } from '../../hooks/useAdminTournaments'
import {
  Empty,
  Feedback,
  Loading,
  SectionHeading,
  primaryClass,
  secondaryClass,
} from '../ui'
import { TournamentBadge } from './TournamentBadge'
import { TournamentForm } from './TournamentForm'

export function TournamentsSection({ userId }: { userId: string }) {
  const { can } = useAccess()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const query = useTournamentList(userId)
  const tournaments = query.data?.pages.flat() ?? []
  return (
    <>
      <SectionHeading
        title="Torneos"
        description="Creá torneos, registrá participantes y sumales puntos. La tabla de posiciones se publica en el sitio."
        action={
          can('torneos.gestionar') &&
          !creating && (
            <button
              type="button"
              className={primaryClass}
              onClick={() => setCreating(true)}
            >
              <Plus size={17} aria-hidden="true" />
              Nuevo torneo
            </button>
          )
        }
      />
      {creating && (
        <div className="mb-6">
          <TournamentForm
            userId={userId}
            onCancel={() => setCreating(false)}
            onSaved={(id) => {
              void navigate(`/admin/torneos/${id}`)
            }}
          />
        </div>
      )}
      <section
        aria-label="Listado de torneos"
        className="rounded-2xl border border-navy-900/10 bg-white shadow-sm"
      >
        <div className="px-5 pt-4 empty:hidden">
          <Feedback error={tournaments.length ? null : query.error} />
        </div>
        {query.isPending ? (
          <Loading />
        ) : !tournaments.length ? (
          <Empty
            text={
              query.isError
                ? 'No pudimos cargar los torneos.'
                : 'Todavía no hay torneos. Creá el primero para empezar a sumar participantes.'
            }
          />
        ) : (
          <ul className="divide-y divide-navy-900/10">
            {tournaments.map((tournament) => (
              <li key={tournament.id}>
                <Link
                  to={`/admin/torneos/${tournament.id}`}
                  className="flex min-w-0 items-center gap-4 px-5 py-4 hover:bg-mist-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold wrap-anywhere">
                        {tournament.name}
                      </span>
                      <TournamentBadge status={tournament.status} />
                    </span>
                    <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
                      <span>{formatShortDate(tournament.starts_on)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Users size={13} aria-hidden="true" />
                        {tournament.participants}{' '}
                        {tournament.participants === 1
                          ? 'participante'
                          : 'participantes'}
                      </span>
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
                    aria-hidden="true"
                    className="shrink-0 text-ink-600"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
        {query.hasNextPage && (
          <div className="border-t border-navy-900/10 p-4">
            <button
              type="button"
              className={secondaryClass}
              disabled={query.isFetchingNextPage}
              onClick={() => {
                void query.fetchNextPage()
              }}
            >
              {query.isFetchingNextPage ? 'Cargando…' : 'Ver más torneos'}
            </button>
          </div>
        )}
      </section>
    </>
  )
}
