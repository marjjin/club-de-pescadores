import { LoaderCircle, UserRoundX } from 'lucide-react'
import { Feedback } from '../ui'

export function UserDeleteSection({
  busy,
  pending,
  error,
  onDelete,
}: {
  busy: boolean
  pending: boolean
  error: Error | null
  onDelete: () => void
}) {
  return (
    <section
      aria-labelledby="user-delete-title"
      className="mt-8 rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:p-6"
    >
      <h2
        id="user-delete-title"
        className="text-base font-extrabold text-red-900"
      >
        Eliminar usuario
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">
        Borra la cuenta de ingreso y quita a la persona del equipo. Lo que cargó
        y el historial de auditoría se conservan. Si solo querés pausar su
        acceso, usá «Acceso desactivado».
      </p>
      {error && (
        <div className="mt-3">
          <Feedback error={error} />
        </div>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-5 text-sm font-bold text-red-800 hover:bg-red-50 disabled:opacity-50"
      >
        {pending ? (
          <LoaderCircle
            size={16}
            aria-hidden="true"
            className="motion-safe:animate-spin"
          />
        ) : (
          <UserRoundX size={16} aria-hidden="true" />
        )}
        {pending ? 'Eliminando…' : 'Eliminar usuario'}
      </button>
    </section>
  )
}
