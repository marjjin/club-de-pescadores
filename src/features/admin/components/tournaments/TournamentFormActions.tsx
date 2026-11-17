import { LoaderCircle, Save } from 'lucide-react'
import { Feedback, primaryClass, secondaryClass } from '../ui'

export function TournamentFormActions({
  editing,
  pending,
  canSave,
  error,
  onCancel,
}: {
  editing: boolean
  pending: boolean
  canSave: boolean
  error: Error | null
  onCancel: () => void
}) {
  return (
    <div className="flex flex-col-reverse gap-3 border-t border-navy-900/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0 flex-1">
        <Feedback error={error} />
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <button
          type="button"
          className={secondaryClass}
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={primaryClass}
          disabled={pending || !canSave}
        >
          {pending ? (
            <LoaderCircle
              size={16}
              aria-hidden="true"
              className="motion-safe:animate-spin"
            />
          ) : (
            <Save size={16} aria-hidden="true" />
          )}
          {pending
            ? 'Guardando…'
            : editing
              ? 'Guardar cambios'
              : 'Crear torneo'}
        </button>
      </div>
    </div>
  )
}
