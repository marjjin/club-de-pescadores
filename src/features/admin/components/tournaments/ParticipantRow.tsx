import { useState } from 'react'
import { Check, Pencil, Trash2, X } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'
import type { useParticipantActions } from '../../hooks/useAdminTournaments'
import type { AdminParticipant } from '../../schemas/tournaments'
import { Feedback, inputClass } from '../ui'
import { PointsForm } from './PointsForm'

type Actions = ReturnType<typeof useParticipantActions>
const iconButton =
  'grid size-11 shrink-0 place-items-center rounded-lg text-ink-600 hover:bg-mist-50 hover:text-navy-900 disabled:opacity-50'

export function ParticipantRow({
  participant,
  actions,
  canEdit,
  canScore,
}: {
  participant: AdminParticipant
  actions: Actions
  canEdit: boolean
  canScore: boolean
}) {
  const confirm = useConfirm()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(participant.display_name)
  const { score, rename, remove } = actions
  // Shared mutations: only reflect the ones that target this row.
  const mine = (mutation: { variables?: unknown }) =>
    mutation.variables === participant.id ||
    (mutation.variables as { id?: string } | undefined)?.id === participant.id
  const busy = (mutation: { isPending: boolean; variables?: unknown }) =>
    mutation.isPending && mine(mutation)
  const error =
    [score, rename, remove].find(
      (mutation) => mutation.isError && mine(mutation),
    )?.error ?? null
  return (
    <li className="grid min-w-0 gap-3 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-mist-50 text-sm font-extrabold tabular-nums">
          {participant.ranking}
        </span>
        {editing ? (
          <form
            className="flex min-w-0 flex-1 gap-1"
            onSubmit={(event) => {
              event.preventDefault()
              rename.mutate(
                { id: participant.id, name },
                { onSuccess: () => setEditing(false) },
              )
            }}
          >
            <input
              value={name}
              maxLength={80}
              aria-label="Nombre del participante"
              onChange={(event) => setName(event.target.value)}
              className={`${inputClass} min-w-0 flex-1`}
            />
            <button
              type="submit"
              aria-label="Guardar nombre"
              className={iconButton}
              disabled={busy(rename)}
            >
              <Check size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Cancelar edición"
              className={iconButton}
              onClick={() => {
                setName(participant.display_name)
                setEditing(false)
              }}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </form>
        ) : (
          <p className="min-w-0 flex-1 font-bold wrap-anywhere">
            {participant.display_name}
          </p>
        )}
        <p className="shrink-0 text-right">
          <span className="block text-xl font-extrabold tabular-nums">
            {participant.points}
          </span>
          <span className="text-[11px] text-ink-600">puntos</span>
        </p>
        {canEdit && !editing && (
          <>
            <button
              type="button"
              aria-label={`Editar nombre de ${participant.display_name}`}
              className={iconButton}
              onClick={() => setEditing(true)}
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Quitar a ${participant.display_name}`}
              className={iconButton}
              disabled={busy(remove)}
              onClick={() => {
                void confirm({
                  title: `¿Quitar a ${participant.display_name}?`,
                  message:
                    'Deja de aparecer en la tabla. Sus puntos quedan registrados en el historial.',
                  confirmLabel: 'Quitar',
                  tone: 'danger',
                }).then((ok) => ok && remove.mutate(participant.id))
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {canScore && (
        <PointsForm
          name={participant.display_name}
          pending={busy(score)}
          onSubmit={(points, reason) =>
            score.mutateAsync({ id: participant.id, points, reason })
          }
        />
      )}
      <Feedback error={error} />
    </li>
  )
}
