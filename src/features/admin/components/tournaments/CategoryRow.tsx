import { useState } from 'react'
import { Archive, Check, Pencil, RotateCcw, X } from 'lucide-react'
import type { CategoryListItem } from '../../schemas/tournaments'
import { inputClass } from '../ui'

const iconButton =
  'grid size-11 shrink-0 place-items-center rounded-lg text-ink-600 hover:bg-mist-50 hover:text-navy-900 disabled:opacity-50'

export function CategoryRow({
  category,
  manage,
  busy,
  onRename,
  onToggleArchive,
}: {
  category: CategoryListItem
  manage: boolean
  busy: boolean
  /** Resolves once saved, so the field closes only on success. */
  onRename: (name: string) => Promise<unknown>
  onToggleArchive: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(category.name)
  return (
    <li
      className={`flex min-w-0 items-center gap-3 px-5 py-3 sm:px-6 ${category.archived_at ? 'opacity-60' : ''}`}
    >
      {editing ? (
        <form
          className="flex min-w-0 flex-1 gap-1"
          onSubmit={(event) => {
            event.preventDefault()
            if (busy) return
            onRename(draft).then(
              () => setEditing(false),
              () => undefined,
            )
          }}
        >
          <input
            value={draft}
            maxLength={60}
            aria-label={`Nuevo nombre para ${category.name}`}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setEditing(false)
            }}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button
            type="submit"
            aria-label="Guardar nombre"
            className={iconButton}
            disabled={busy}
          >
            <Check size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Cancelar"
            className={iconButton}
            onClick={() => setEditing(false)}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </form>
      ) : (
        <p className="min-w-0 flex-1">
          <span className="font-bold wrap-anywhere">{category.name}</span>
          <span className="ml-2 text-xs text-ink-600">
            {category.archived_at
              ? 'Archivada'
              : `${category.tournaments} ${category.tournaments === 1 ? 'torneo' : 'torneos'}`}
          </span>
        </p>
      )}
      {manage && !editing && (
        <>
          <button
            type="button"
            aria-label={`Renombrar ${category.name}`}
            className={iconButton}
            onClick={() => {
              setDraft(category.name)
              setEditing(true)
            }}
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={
              category.archived_at
                ? `Restaurar ${category.name}`
                : `Archivar ${category.name}`
            }
            className={iconButton}
            disabled={busy}
            onClick={onToggleArchive}
          >
            {category.archived_at ? (
              <RotateCcw size={16} aria-hidden="true" />
            ) : (
              <Archive size={16} aria-hidden="true" />
            )}
          </button>
        </>
      )}
    </li>
  )
}
