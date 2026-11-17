import { useState } from 'react'
import { Search, Trophy, UserPlus } from 'lucide-react'
import { useAccess } from '../../hooks/useAccess'
import {
  useParticipantActions,
  useParticipants,
} from '../../hooks/useAdminTournaments'
import type { AdminTournament } from '../../schemas/tournaments'
import {
  Feedback,
  Loading,
  inputClass,
  primaryClass,
  secondaryClass,
} from '../ui'
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
  const categories = tournament.categories
  const [chosen, setChosen] = useState<string | null>(null)
  // Falls back to the first category if the chosen one was removed meanwhile.
  const category =
    categories.find((entry) => entry.id === chosen)?.id ??
    categories[0]?.id ??
    null
  const { query, search, setSearch, searching } = useParticipants(
    userId,
    tournament.id,
    category,
  )
  const actions = useParticipantActions(userId, tournament.id)
  const open = isOpen(tournament.status)
  const canAdd = open && can('torneos.participantes')
  const [adding, setAdding] = useState(false)
  const filtered = Boolean(search.trim()) || searching
  const categoryName = categories.find((entry) => entry.id === category)?.name
  const participants = query.data?.pages.flat() ?? []
  // Only the unfiltered first page knows who is on top; ties show no single leader.
  const [first, second] = participants
  const leader =
    !search.trim() &&
    !searching &&
    first?.ranking === 1 &&
    first.points > 0 &&
    second?.ranking !== 1
      ? first
      : null
  return (
    <section
      aria-labelledby="participants-title"
      className="rounded-2xl border border-navy-900/10 bg-white shadow-sm"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-navy-900/10 px-5 py-4">
        <div>
          <h2 id="participants-title" className="text-base font-extrabold">
            Participantes y puntos
          </h2>
          <p className="mt-0.5 text-sm text-ink-600">
            Ordenados por puntaje, como en la tabla del sitio.
          </p>
        </div>
        {leader && (
          <p className="inline-flex min-w-0 items-center gap-2 rounded-full bg-sun-400/20 px-3 py-1.5 text-sm">
            <Trophy size={15} aria-hidden="true" className="shrink-0" />
            <span className="min-w-0 wrap-anywhere">
              Lidera <strong>{leader.display_name}</strong> con {leader.points}{' '}
              {leader.points === 1 ? 'punto' : 'puntos'}
            </span>
          </p>
        )}
      </div>
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Categoría"
          className="flex gap-2 overflow-x-auto border-b border-navy-900/10 px-5 py-3 [scrollbar-width:thin]"
        >
          {categories.map((entry) => (
            <button
              key={entry.id}
              type="button"
              aria-pressed={entry.id === category}
              onClick={() => setChosen(entry.id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-bold ${entry.id === category ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 bg-white text-navy-900 hover:bg-mist-50'}`}
            >
              {entry.name}
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${entry.id === category ? 'bg-white/20' : 'bg-mist-50'}`}
              >
                {entry.participants}
              </span>
            </button>
          ))}
        </div>
      )}
      {!open && (
        <p className="border-b border-navy-900/10 bg-mist-50 px-5 py-3 text-sm text-ink-600">
          El torneo está cerrado: la tabla quedó fija. Reabrilo para cargar
          puntos o participantes.
        </p>
      )}
      {canAdd && adding && (
        <AddParticipantForm
          // Each table starts the form on its own category.
          key={category ?? 'none'}
          userId={userId}
          add={actions.add}
          categories={categories}
          category={category}
          onClose={() => setAdding(false)}
        />
      )}
      <div className="flex flex-wrap gap-3 border-b border-navy-900/10 p-4 sm:px-5">
        <div className="relative min-w-48 flex-1">
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
        {canAdd && !adding && (
          <button
            type="button"
            className={primaryClass}
            onClick={() => setAdding(true)}
          >
            <UserPlus size={16} aria-hidden="true" />
            Registrar participante
          </button>
        )}
      </div>
      <div className="px-5 pt-4 empty:hidden">
        <Feedback error={participants.length ? null : query.error} />
      </div>
      {query.isPending ? (
        <Loading />
      ) : !participants.length ? (
        <p className="px-5 py-12 text-center text-sm text-ink-600">
          {query.isError
            ? 'No pudimos cargar los participantes.'
            : filtered
              ? 'Ningún participante empieza con ese nombre.'
              : categories.length > 1 && categoryName
                ? `Todavía no hay participantes en ${categoryName}.`
                : 'Todavía no hay participantes registrados.'}
        </p>
      ) : (
        <ul
          aria-busy={query.isFetching || searching}
          className="divide-y divide-navy-900/10"
        >
          {participants.map((participant) => (
            <ParticipantRow
              // Remount after a rename so the edit field starts from the saved name.
              key={`${participant.id}:${participant.display_name}`}
              userId={userId}
              participant={participant}
              categories={categories}
              actions={actions}
              canEdit={canAdd}
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
