import { useState } from 'react'
import { UserRound } from 'lucide-react'
import type { useParticipantActions } from '../../hooks/useAdminTournaments'
import type { AdminParticipant, Angler } from '../../schemas/tournaments'
import { Feedback, primaryClass, secondaryClass } from '../ui'
import { PersonPicker } from './PersonPicker'
import { personLabel } from './person-label'

type Actions = ReturnType<typeof useParticipantActions>

const panel =
  'grid gap-3 rounded-xl border border-navy-900/10 bg-mist-50/60 p-3 sm:p-4'

/** Fixes an entry loaded with the wrong person; its points move with the entry. */
export function ChangePerson({
  userId,
  participant,
  actions,
  onDone,
}: {
  userId: string
  participant: AdminParticipant
  actions: Actions
  onDone: (message?: string) => void
}) {
  const [person, setPerson] = useState<Angler | null>(null)
  const [consent, setConsent] = useState(false)
  if (!person)
    return (
      <div className={panel}>
        <PersonPicker
          userId={userId}
          label={
            participant.angler_id
              ? `¿Quién compitió en lugar de ${participant.display_name}?`
              : `¿A qué persona corresponde «${participant.display_name}»?`
          }
          onSelect={setPerson}
        />
        <button
          type="button"
          className={`${secondaryClass} justify-self-end`}
          onClick={() => onDone()}
        >
          Cancelar
        </button>
      </div>
    )
  return (
    <form
      className={panel}
      onSubmit={(event) => {
        event.preventDefault()
        actions.change.mutate(
          { id: participant.id, angler: person.id, consent },
          { onSuccess: () => onDone(`Ahora figura ${personLabel(person)}`) },
        )
      }}
    >
      <p className="flex items-center gap-2 text-sm">
        <UserRound size={16} aria-hidden="true" />
        <span>
          Pasar la inscripción y sus{' '}
          <strong>{participant.points} puntos</strong> a{' '}
          <strong>{personLabel(person)}</strong> (DNI {person.dni_masked}).
        </span>
      </p>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 size-4 shrink-0"
        />
        <span>
          La persona aceptó aparecer con su nombre y puntaje en la tabla
          pública.
        </span>
      </label>
      <Feedback error={actions.change.error} />
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className={secondaryClass}
          onClick={() => setPerson(null)}
        >
          Elegir otra
        </button>
        <button
          type="submit"
          className={primaryClass}
          disabled={!consent || actions.change.isPending}
        >
          {actions.change.isPending ? 'Cambiando…' : 'Cambiar persona'}
        </button>
      </div>
    </form>
  )
}
