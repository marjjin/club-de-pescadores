import { AlertCircle, History } from 'lucide-react'
import { Feedback, secondaryClass } from '../ui'

export function AuditListMessage({
  failed,
  error,
  filtered,
  onRetry,
  onReset,
}: {
  failed: boolean
  error: Error | null
  filtered: boolean
  onRetry: () => void
  onReset: () => void
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      {failed ? (
        <AlertCircle size={34} aria-hidden="true" className="text-ink-600" />
      ) : (
        <History size={34} aria-hidden="true" className="text-ink-600" />
      )}
      <h2 className="text-xl font-extrabold">
        {failed
          ? 'No pudimos cargar la actividad'
          : filtered
            ? 'No hay actividad para esta selección'
            : 'Todavía no hay actividad registrada'}
      </h2>
      {failed ? (
        <Feedback error={error} />
      ) : (
        <p className="max-w-md text-sm leading-6 text-ink-600">
          {filtered
            ? 'Probá con otra sección o volvé al inicio del historial.'
            : 'Los cambios en contenido y accesos aparecerán acá cuando se realicen.'}
        </p>
      )}
      {(failed || filtered) && (
        <button
          type="button"
          className={secondaryClass}
          onClick={failed ? onRetry : onReset}
        >
          {failed ? 'Reintentar actividad' : 'Ver toda la actividad'}
        </button>
      )}
    </div>
  )
}
