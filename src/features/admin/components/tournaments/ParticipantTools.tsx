import { useAngler } from '../../hooks/useTournamentPeople'
import type { useParticipantActions } from '../../hooks/useAdminTournaments'
import type {
  AdminParticipant,
  TournamentCategory,
} from '../../schemas/tournaments'
import { Feedback, Loading } from '../ui'
import { PersonForm } from './PersonForm'
import { ChangePerson } from './ChangePersonPanel'
import { MoveCategory } from './MoveCategoryPanel'
import { Rename } from './RenamePanel'
import { PointsForm } from './PointsForm'

type Actions = ReturnType<typeof useParticipantActions>
export type ParticipantMode =
  'points' | 'person' | 'category' | 'data' | 'rename'
const panel =
  'grid gap-3 rounded-xl border border-navy-900/10 bg-mist-50/60 p-3 sm:p-4'

export function ParticipantTools({
  mode,
  userId,
  participant,
  categories,
  actions,
  onDone,
}: {
  mode: ParticipantMode
  userId: string
  participant: AdminParticipant
  categories: TournamentCategory[]
  actions: Actions
  onDone: (message?: string) => void
}) {
  const name = participant.display_name
  if (mode === 'points')
    return (
      <PointsForm
        name={name}
        pending={actions.score.isPending}
        onCancel={() => onDone()}
        onSubmit={async (points, reason) => {
          await actions.score.mutateAsync({
            id: participant.id,
            points,
            reason,
          })
          onDone(
            `${points > 0 ? `+${points}` : points} ${Math.abs(points) === 1 ? 'punto cargado' : 'puntos cargados'}`,
          )
        }}
      />
    )
  if (mode === 'person')
    return (
      <ChangePerson
        userId={userId}
        participant={participant}
        actions={actions}
        onDone={onDone}
      />
    )
  if (mode === 'category')
    return (
      <MoveCategory
        participant={participant}
        categories={categories}
        actions={actions}
        onDone={onDone}
      />
    )
  if (mode === 'data')
    return (
      <EditPerson userId={userId} participant={participant} onDone={onDone} />
    )
  return <Rename participant={participant} actions={actions} onDone={onDone} />
}

function EditPerson({
  userId,
  participant,
  onDone,
}: {
  userId: string
  participant: AdminParticipant
  onDone: (message?: string) => void
}) {
  const person = useAngler(userId, participant.angler_id)
  if (person.isPending) return <Loading />
  if (!person.data)
    return (
      <div className={panel}>
        <Feedback error={person.error} />
      </div>
    )
  return (
    <PersonForm
      userId={userId}
      current={person.data}
      onCancel={() => onDone()}
      onSaved={() => onDone('Datos corregidos en todos sus torneos')}
    />
  )
}
