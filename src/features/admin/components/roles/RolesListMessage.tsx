import { AlertCircle, SearchX } from 'lucide-react'
import { Feedback, secondaryClass } from '../ui'

export function RolesListMessage({
  failed,
  error,
  filtered,
  onRetry,
  onReset,
  onCreate,
}: {
  failed: boolean
  error: Error | null
  filtered: boolean
  onRetry: () => void
  onReset: () => void
  onCreate: () => void
}) {
  if (failed)
    return (
      <div className="grid min-h-72 justify-items-center gap-4 px-6 py-10 text-center">
        <AlertCircle size={32} aria-hidden="true" className="text-ink-600" />
        <h2 className="text-lg font-extrabold">No pudimos cargar los roles</h2>
        <Feedback error={error} />
        <button type="button" onClick={onRetry} className={secondaryClass}>
          Reintentar listado
        </button>
      </div>
    )
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-10 text-center">
      <SearchX size={34} aria-hidden="true" className="text-ink-600" />
      <h2 className="mt-5 text-xl font-extrabold">
        {filtered ? 'No encontramos roles' : 'Organizá los accesos del equipo'}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-ink-600">
        {filtered
          ? 'Probá con otras primeras letras del nombre o volvé al inicio del listado.'
          : 'Creá un rol personalizado y definí sus permisos por módulo.'}
      </p>
      <button
        type="button"
        className={`${secondaryClass} mt-5`}
        onClick={filtered ? onReset : onCreate}
      >
        {filtered ? 'Ver todos los roles' : 'Crear el primer rol'}
      </button>
    </div>
  )
}
