import { FileText, Plus, SearchX, Trash2 } from 'lucide-react'
import { contentConfig } from '../content-fields'
import { contentListCopy } from '../content-list'
import type { ContentKind } from '../schemas/admin'
import { primaryClass, secondaryClass } from './ui'

type Props = {
  kind: ContentKind
  state: string
  search: string
  page: number
  onCreate: () => void
  onReset: () => void
}

export function ContentEmptyState({
  kind,
  state,
  search,
  page,
  onCreate,
  onReset,
}: Props) {
  const filtered = Boolean(search) || page > 1
  const archived = state === 'archived'
  const copy = contentListCopy[kind]
  const Icon = filtered ? SearchX : archived ? Trash2 : FileText
  const title = filtered
    ? 'No encontramos resultados'
    : archived
      ? 'La papelera está vacía'
      : state === 'draft'
        ? 'No hay borradores pendientes'
        : state === 'published'
          ? 'Todavía no hay publicaciones'
          : copy.emptyTitle
  const description = filtered
    ? 'Probá con otras palabras o revisá los filtros para encontrar lo que buscás.'
    : archived
      ? 'El contenido que archives aparecerá acá. Podrás restaurarlo como borrador cuando lo necesites.'
      : state === 'published'
        ? 'Creá contenido o abrí un borrador para preparar tu próxima publicación.'
        : copy.emptyDescription
  return (
    <div className="flex min-h-80 flex-col items-center justify-center px-6 py-12 text-center sm:py-16">
      <div
        aria-hidden="true"
        className="relative mb-6 grid size-20 place-items-center rounded-2xl border border-navy-900/10 bg-mist-50 shadow-sm"
      >
        <div className="absolute -top-1.5 -right-1.5 grid size-7 place-items-center rounded-full border-4 border-white bg-sun-400">
          <span className="size-1.5 rounded-full bg-navy-900" />
        </div>
        <Icon size={32} strokeWidth={1.5} className="text-navy-800" />
      </div>
      <h2 className="text-xl font-extrabold tracking-tight text-navy-900">
        {title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-ink-600">
        {description}
      </p>
      {filtered || archived ? (
        <button
          type="button"
          onClick={onReset}
          className={`${secondaryClass} mt-6`}
        >
          {page > 1
            ? 'Volver al inicio del listado'
            : archived
              ? 'Ver contenido activo'
              : 'Limpiar filtros'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onCreate}
          className={`${primaryClass} mt-6`}
        >
          <Plus size={17} aria-hidden="true" />
          Crear {contentConfig[kind].singular}
        </button>
      )}
      {!filtered && !archived && (
        <p className="mt-4 text-xs text-ink-600">
          Solo se verá en el sitio cuando decidas publicarlo.
        </p>
      )}
    </div>
  )
}
