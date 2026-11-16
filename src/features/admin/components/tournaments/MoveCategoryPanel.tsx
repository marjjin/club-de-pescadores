import { useState } from 'react'
import type { useParticipantActions } from '../../hooks/useAdminTournaments'
import type {
  AdminParticipant,
  TournamentCategory,
} from '../../schemas/tournaments'
import { Feedback, inputClass, primaryClass, secondaryClass } from '../ui'

type Actions = ReturnType<typeof useParticipantActions>

const panel =
  'grid gap-3 rounded-xl border border-navy-900/10 bg-mist-50/60 p-3 sm:p-4'

export function MoveCategory({
  participant,
  categories,
  actions,
  onDone,
}: {
  participant: AdminParticipant
  categories: TournamentCategory[]
  actions: Actions
  onDone: (message?: string) => void
}) {
  const others = categories.filter(
    (entry) => entry.id !== participant.category_id,
  )
  const [target, setTarget] = useState(others[0]?.id ?? '')
  return (
    <form
      className={panel}
      onSubmit={(event) => {
        event.preventDefault()
        const name = others.find((entry) => entry.id === target)?.name ?? ''
        actions.move.mutate(
          { id: participant.id, category: target },
          { onSuccess: () => onDone(`Pasó a ${name}`) },
        )
      }}
    >
      <label className="grid gap-1.5 text-sm font-bold">
        Mover a la categoría
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          className={inputClass}
        >
          {others.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs text-ink-600">Conserva sus puntos.</p>
      <Feedback error={actions.move.error} />
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className={secondaryClass}
          onClick={() => onDone()}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={primaryClass}
          disabled={!target || actions.move.isPending}
        >
          Mover
        </button>
      </div>
    </form>
  )
}
