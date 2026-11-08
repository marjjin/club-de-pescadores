import {
  CalendarClock,
  CheckCircle2,
  LoaderCircle,
  Save,
  Send,
} from 'lucide-react'
import type { PublicationMode } from '../../news-editor'
import type { News } from '../../schemas/admin'
import { Feedback, primaryClass, secondaryClass } from '../ui'

type Props = {
  row: News | null
  publication: PublicationMode
  dirty: boolean
  imageBusy: boolean
  pending: boolean
  error: Error | null
  hasErrors: boolean
  onCancel: () => void
}

export function NewsEditorActions({
  row,
  publication,
  dirty,
  imageBusy,
  pending,
  error,
  hasErrors,
  onCancel,
}: Props) {
  const busy = pending || imageBusy
  const label =
    publication === 'scheduled'
      ? 'Programar noticia'
      : publication === 'now'
        ? row?.is_published
          ? 'Guardar y publicar cambios'
          : 'Publicar noticia'
        : 'Guardar borrador'
  const Icon =
    publication === 'scheduled'
      ? CalendarClock
      : publication === 'now'
        ? Send
        : Save
  return (
    <div className="sticky bottom-0 z-10 mt-6 rounded-xl border border-navy-900/10 bg-white/95 p-4 shadow-card backdrop-blur-sm">
      {hasErrors && (
        <p role="alert" className="mb-3 text-sm font-semibold text-red-700">
          Revisá los campos marcados antes de guardar la noticia.
        </p>
      )}
      <Feedback error={error} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-xs text-ink-600">
          {imageBusy ? (
            <>
              <LoaderCircle
                size={15}
                aria-hidden="true"
                className="motion-safe:animate-spin"
              />
              Subiendo imagen…
            </>
          ) : dirty ? (
            <>
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-amber-400"
              />
              Cambios sin guardar
            </>
          ) : (
            <>
              <CheckCircle2 size={15} aria-hidden="true" />
              {row
                ? 'Sin cambios pendientes'
                : 'Completá los campos para empezar'}
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={secondaryClass}
          >
            Cancelar
          </button>
          <button type="submit" disabled={busy} className={primaryClass}>
            {pending ? (
              <>
                <LoaderCircle
                  size={16}
                  aria-hidden="true"
                  className="motion-safe:animate-spin"
                />
                Guardando…
              </>
            ) : (
              <>
                <Icon size={16} aria-hidden="true" />
                {label}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
