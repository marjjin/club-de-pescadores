import { UserMinus } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'
import { useUserActions } from '../../hooks/useAdminActions'
import type { Account } from '../../schemas/admin'
import { Feedback } from '../ui'

const dangerClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-50'

/** Destructive and confirmed; the server checks permission, self-removal and the last general. */
export function RemoveUser({
  account,
  disabled,
  onRemoved,
}: {
  account: Account
  disabled: boolean
  onRemoved: () => void
}) {
  const confirm = useConfirm()
  const { remove } = useUserActions()
  async function run() {
    if (remove.isPending) return
    const ok = await confirm({
      title: `¿Quitar a ${account.email} del equipo?`,
      message:
        'Pierde todos sus roles y el acceso al panel, y se cierran sus sesiones. Lo que hizo queda en el historial. Si más adelante lo necesitás, podés volver a invitarlo con el mismo correo.',
      confirmLabel: 'Quitar del equipo',
      tone: 'danger',
    })
    if (ok) remove.mutate(account, { onSuccess: onRemoved })
  }
  return (
    <section
      aria-labelledby="remove-user-title"
      className="mt-6 rounded-xl border border-red-200 bg-red-50/40 p-5"
    >
      <h2 id="remove-user-title" className="text-base font-extrabold">
        Quitar del equipo
      </h2>
      <p className="mt-1 mb-4 max-w-2xl text-sm leading-6 text-ink-600">
        Desaparece de la lista de usuarios y ya no puede ingresar. Para un
        cambio temporal, usá «Desactivado» en lugar de quitarlo.
      </p>
      <Feedback error={remove.error} />
      <button
        type="button"
        className={`${dangerClass} mt-2`}
        disabled={disabled || remove.isPending}
        onClick={() => {
          void run()
        }}
      >
        <UserMinus size={16} aria-hidden="true" />
        {remove.isPending ? 'Quitando…' : 'Quitar del equipo'}
      </button>
    </section>
  )
}
