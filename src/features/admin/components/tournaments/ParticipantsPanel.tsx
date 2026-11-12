import { Search } from 'lucide-react'
import { useAccess } from '../../hooks/useAccess'
import {
  useParticipantActions,
  useParticipants,
} from '../../hooks/useAdminTournaments'
import type { AdminTournament } from '../../schemas/tournaments'
import { Empty, Feedback, Loading, inputClass, secondaryClass } from '../ui'
import { AddParticipantForm } from './AddParticipantForm'
import { ParticipantRow } from './ParticipantRow'
import { isOpen } from '../../tournament-status'

export function ParticipantsPanel({
  userId,
  tournament,
}: {
  userId: string
  tournament: AdminTournament
}) {
  const { can } = useAccess()
  const { query, search, setSearch, searching } = useParticipants(
    userId,
    tournament.id,
  )
  const actions = useParticipantActions(userId, tournament.id)
  const open = isOpen(tournament.status)
  const participants = query.data?.pages.flat() ?? []
  return (
    <section
      aria-labelledby="participants-title"
      className="rounded-2xl border border-navy-900/10 bg-white shadow-sm"
    >
      <h2
        id="participants-title"
        className="border-b border-navy-900/10 px-5 py-4 text-base font-extrabold"
      >
        Participantes y puntos
      </h2>
      {!open && (
        <p className="border-b border-navy-900/10 bg-mist-50 px-5 py-3 text-sm text-ink-600">
          El torneo está cerrado: la tabla quedó fija. Reabrilo para cargar
          puntos o participantes.
        </p>
      )}
      {open && can('torneos.participantes') && (
        <AddParticipantForm add={actions.add} />
      )}
      <div className="border-b border-navy-900/10 p-4 sm:px-5">
        <div className="relative">
          <Search
            size={17}
            aria-hidden="true"
            className="pointer-events-none absolute top-3.5 left-3 text-ink-600"
          />
          <input
            type="search"
            value={search}
            maxLength={80}
            aria-label="Buscar participante por inicio del nombre"
            placeholder="Buscar participante…"
            onChange={(event) => setSearch(event.target.value)}
            className={`${inputClass} h-11 pl-10`}
          />
        </div>
      </div>
      <div className="px-5 pt-4 empty:hidden">
        <Feedback error={participants.length ? null : query.error} />
      </div>
      {query.isPending ? (
        <Loading />
      ) : !participants.length ? (
        <Empty
          text={
            query.isError
              ? 'No pudimos cargar los participantes.'
              : search.trim() || searching
                ? 'Ningún participante empieza con ese nombre.'
                : 'Todavía no hay participantes registrados.'
          }
        />
      ) : (
        <ul
          aria-busy={query.isFetching || searching}
          className="divide-y divide-navy-900/10"
        >
          {participants.map((participant) => (
            <ParticipantRow
              // Remount after a rename so the edit field starts from the saved name.
              key={`${participant.id}:${participant.display_name}`}
              participant={participant}
              actions={actions}
              canEdit={open && can('torneos.participantes')}
              canScore={open && can('torneos.puntos')}
            />
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
            {query.isFetchingNextPage ? 'Cargando…' : 'Ver más participantes'}
          </button>
        </div>
      )}
    </section>
  )
}
