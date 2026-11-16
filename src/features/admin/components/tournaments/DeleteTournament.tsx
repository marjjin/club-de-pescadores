import { useNavigate } from 'react-router'
import { LoaderCircle, Trash2 } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'
import { useDeleteTournament } from '../../hooks/useAdminTournaments'
import type { AdminTournament } from '../../schemas/tournaments'
import { Feedback } from '../ui'

/** Offered only for archived tournaments: archiving first is the safety step. */
export function DeleteTournament({
  userId,
  tournament,
}: {
  userId: string
  tournament: AdminTournament
}) {
  const confirm = useConfirm()
  const navigate = useNavigate()
  const remove = useDeleteTournament(userId)
  async function run() {
    if (remove.isPending) return
    const people = tournament.participants
    if (
      !(await confirm({
        title: `¿Eliminar «${tournament.name}» definitivamente?`,
        message: `Se borran el torneo, ${people} ${people === 1 ? 'inscripción' : 'inscripciones'} con sus puntos y su evento en la agenda. Las personas siguen registradas para otros torneos. No se puede deshacer.`,
        confirmLabel: 'Eliminar definitivamente',
        cancelLabel: 'Conservar archivado',
        tone: 'danger',
      }))
    )
      return
    remove.mutate(tournament, {
      onSuccess: () => {
        void navigate('/admin/torneos', { replace: true })
      },
    })
  }
  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={remove.isPending}
        onClick={() => {
          void run()
        }}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {remove.isPending ? (
          <LoaderCircle
            size={16}
            aria-hidden="true"
            className="motion-safe:animate-spin"
          />
        ) : (
          <Trash2 size={16} aria-hidden="true" />
        )}
        {remove.isPending ? 'Eliminando…' : 'Eliminar definitivamente'}
      </button>
      <Feedback error={remove.error} />
    </div>
  )
}
