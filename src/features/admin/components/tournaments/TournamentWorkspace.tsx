import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, ExternalLink, MapPin, Pencil } from 'lucide-react'
import { formatShortDate } from '@/shared/lib/dates'
import { useAccess } from '../../hooks/useAccess'
import { useAdminTournament } from '../../hooks/useAdminTournaments'
import { Feedback, Loading, SectionHeading, secondaryClass } from '../ui'
import { ParticipantsPanel } from './ParticipantsPanel'
import { TournamentBadge } from './TournamentBadge'
import { TournamentForm } from './TournamentForm'
import { TournamentStatusActions } from './TournamentStatusActions'

const back = (
  <Link
    to="/admin/torneos"
    className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-river-600"
  >
    <ArrowLeft size={16} aria-hidden="true" />
    Todos los torneos
  </Link>
)

export function TournamentWorkspace({ userId }: { userId: string }) {
  const { id = '' } = useParams()
  const { can } = useAccess()
  const [editing, setEditing] = useState(false)
  const query = useAdminTournament(userId, id)
  const tournament = query.data
  if (query.isPending) return <Loading />
  if (!tournament)
    return (
      <>
        {back}
        <SectionHeading
          title={
            query.isError
              ? 'No pudimos cargar el torneo'
              : 'Torneo no encontrado'
          }
          description="Volvé al listado y elegí otro torneo."
        />
        <Feedback error={query.error} />
      </>
    )
  const manage = can('torneos.gestionar')
  const visible =
    tournament.status === 'published' || tournament.status === 'finished'
  return (
    <>
      {back}
      {editing ? (
        <div className="mb-6">
          <h1 className="mb-4 text-2xl font-extrabold wrap-anywhere">
            Editar {tournament.name}
          </h1>
          <TournamentForm
            userId={userId}
            current={tournament}
            onCancel={() => setEditing(false)}
            onSaved={() => setEditing(false)}
          />
        </div>
      ) : (
        <header className="mb-6 grid gap-4 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <TournamentBadge status={tournament.status} />
              <h1 className="mt-2 text-2xl font-extrabold wrap-anywhere sm:text-3xl">
                {tournament.name}
              </h1>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
                <span>
                  {formatShortDate(tournament.starts_on)}
                  {tournament.ends_on &&
                    tournament.ends_on !== tournament.starts_on &&
                    ` al ${formatShortDate(tournament.ends_on)}`}
                </span>
                {tournament.place && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} aria-hidden="true" />
                    {tournament.place}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {visible && (
                <a
                  href={`/torneos/${tournament.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className={secondaryClass}
                >
                  <ExternalLink size={16} aria-hidden="true" />
                  Ver en el sitio
                </a>
              )}
              {manage && tournament.status !== 'archived' && (
                <button
                  type="button"
                  className={secondaryClass}
                  onClick={() => setEditing(true)}
                >
                  <Pencil size={16} aria-hidden="true" />
                  Editar datos
                </button>
              )}
            </div>
          </div>
          {manage && (
            <TournamentStatusActions userId={userId} tournament={tournament} />
          )}
        </header>
      )}
      <ParticipantsPanel userId={userId} tournament={tournament} />
    </>
  )
}
