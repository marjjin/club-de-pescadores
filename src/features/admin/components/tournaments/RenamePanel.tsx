import { useState } from 'react'
import type { useParticipantActions } from '../../hooks/useAdminTournaments'
import { legacyNameSchema } from '../../schemas/tournaments'
import type { AdminParticipant } from '../../schemas/tournaments'
import { Feedback, inputClass, primaryClass, secondaryClass } from '../ui'

type Actions = ReturnType<typeof useParticipantActions>

const panel =
  'grid gap-3 rounded-xl border border-navy-900/10 bg-mist-50/60 p-3 sm:p-4'

/** Only for entries loaded before the people registry, which have a free-text name. */
export function Rename({
  participant,
  actions,
  onDone,
}: {
  participant: AdminParticipant
  actions: Actions
  onDone: (message?: string) => void
}) {
  const [name, setName] = useState(participant.display_name)
  const [error, setError] = useState<string | null>(null)
  return (
    <form
      className={panel}
      onSubmit={(event) => {
        event.preventDefault()
        const parsed = legacyNameSchema.safeParse(name)
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? 'Revisá el nombre.')
          return
        }
        actions.rename.mutate(
          { id: participant.id, name: parsed.data },
          { onSuccess: () => onDone('Nombre corregido') },
        )
      }}
    >
      <label className="grid gap-1.5 text-sm font-bold">
        Nombre en la tabla
        <input
          value={name}
          maxLength={80}
          onChange={(event) => {
            setName(event.target.value)
            setError(null)
          }}
          className={inputClass}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <Feedback error={actions.rename.error} />
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
          disabled={actions.rename.isPending}
        >
          Guardar nombre
        </button>
      </div>
    </form>
  )
}
