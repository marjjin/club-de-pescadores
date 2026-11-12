import { useConfirm } from '../../hooks/useConfirm'
import type { ConfirmOptions } from '../../hooks/useConfirm'
import { useTournamentStatus } from '../../hooks/useAdminTournaments'
import type {
  AdminTournament,
  TournamentStatus,
} from '../../schemas/tournaments'
import { Feedback, primaryClass, secondaryClass } from '../ui'

type Action = {
  to: TournamentStatus
  label: string
  primary?: boolean
  confirm?: ConfirmOptions
}

// Which moves each state allows; the database accepts any valid state from staff with permission.
const actions: Record<TournamentStatus, Action[]> = {
  draft: [
    {
      to: 'published',
      label: 'Publicar en el sitio',
      primary: true,
      confirm: {
        title: '¿Publicar el torneo?',
        message:
          'La tabla de posiciones, con los nombres de los participantes, pasa a verse en el sitio.',
        confirmLabel: 'Publicar',
      },
    },
  ],
  published: [
    {
      to: 'finished',
      label: 'Finalizar torneo',
      primary: true,
      confirm: {
        title: '¿Finalizar el torneo?',
        message:
          'La tabla queda fija: ya no se podrán sumar puntos ni participantes. Podés reabrirlo si hace falta.',
        confirmLabel: 'Finalizar',
      },
    },
    { to: 'draft', label: 'Retirar del sitio' },
  ],
  finished: [{ to: 'published', label: 'Reabrir' }],
  archived: [{ to: 'draft', label: 'Restaurar como borrador' }],
}
const archive: Action = {
  to: 'archived',
  label: 'Archivar',
  confirm: {
    title: '¿Archivar el torneo?',
    message:
      'Deja de verse en el sitio. Los participantes y los puntos se conservan y podés restaurarlo.',
    confirmLabel: 'Archivar',
    tone: 'danger',
  },
}

export function TournamentStatusActions({
  userId,
  tournament,
}: {
  userId: string
  tournament: AdminTournament
}) {
  const status = useTournamentStatus(userId)
  const confirm = useConfirm()
  const available = [
    ...actions[tournament.status],
    ...(tournament.status === 'archived' ? [] : [archive]),
  ]
  async function run(action: Action) {
    if (status.isPending) return
    if (action.confirm && !(await confirm(action.confirm))) return
    status.mutate({ id: tournament.id, status: action.to })
  }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {available.map((action) => (
          <button
            key={action.to}
            type="button"
            disabled={status.isPending}
            className={action.primary ? primaryClass : secondaryClass}
            onClick={() => {
              void run(action)
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
      <Feedback error={status.error} />
    </div>
  )
}
