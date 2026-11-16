import { useState } from 'react'
import { Plus, Tags, X } from 'lucide-react'
import { useAccess } from '../../hooks/useAccess'
import { useConfirm } from '../../hooks/useConfirm'
import {
  useCategories,
  useCategoryActions,
} from '../../hooks/useTournamentPeople'
import type { CategoryListItem } from '../../schemas/tournaments'
import { Feedback, Loading, inputClass, primaryClass } from '../ui'
import { CategoryRow } from './CategoryRow'

export function CategoriesManager({
  userId,
  onClose,
}: {
  userId: string
  onClose: () => void
}) {
  const manage = useAccess().can('torneos.gestionar')
  const confirm = useConfirm()
  const query = useCategories(userId)
  const { save, archive } = useCategoryActions(userId)
  const [name, setName] = useState('')
  const busy = save.isPending || archive.isPending
  function create() {
    if (!name.trim() || busy) return
    save.mutate({ name }, { onSuccess: () => setName('') })
  }
  async function toggleArchive(category: CategoryListItem) {
    const archived = !category.archived_at
    if (
      archived &&
      !(await confirm({
        title: `¿Archivar «${category.name}»?`,
        message:
          'No se va a poder elegir en torneos nuevos. Los torneos que ya la usan la conservan con sus tablas.',
        confirmLabel: 'Archivar',
      }))
    )
      return
    archive.mutate({ id: category.id, archived })
  }
  return (
    <section
      aria-labelledby="categories-title"
      className="mb-6 overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm"
    >
      <div className="flex items-start gap-3 border-b border-navy-900/10 bg-mist-50/60 px-5 py-4 sm:px-6">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-river-600/10 text-river-600"
        >
          <Tags size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="categories-title" className="text-base font-extrabold">
            Categorías de torneos
          </h2>
          <p className="mt-0.5 text-sm text-ink-600">
            Senior, Cadetes, Damas… Cada torneo usa una o varias, y cada una
            tiene su tabla de posiciones.
          </p>
        </div>
        <button
          type="button"
          aria-label="Cerrar categorías"
          className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-600 hover:bg-mist-50 hover:text-navy-900"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {manage && (
        <form
          className="flex flex-wrap gap-2 border-b border-navy-900/10 p-4 sm:px-6"
          onSubmit={(event) => {
            event.preventDefault()
            create()
          }}
        >
          <input
            value={name}
            maxLength={60}
            aria-label="Nombre de la nueva categoría"
            placeholder="Nueva categoría"
            onChange={(event) => {
              setName(event.target.value)
              save.reset()
            }}
            className={`${inputClass} min-w-48 flex-1`}
          />
          <button
            type="submit"
            className={primaryClass}
            disabled={!name.trim() || busy}
          >
            <Plus size={16} aria-hidden="true" />
            Agregar
          </button>
        </form>
      )}
      <div className="px-5 pt-3 empty:hidden sm:px-6">
        <Feedback error={save.error ?? archive.error ?? query.error} />
      </div>
      {query.isPending ? (
        <Loading />
      ) : !query.data?.length ? (
        <p className="px-5 py-6 text-sm text-ink-600 sm:px-6">
          Todavía no hay categorías.
        </p>
      ) : (
        <ul className="divide-y divide-navy-900/10">
          {query.data.map((category) => (
            <CategoryRow
              // Remount after a rename so the field starts from the saved name.
              key={`${category.id}:${category.name}`}
              category={category}
              manage={manage}
              busy={busy}
              onRename={(next) =>
                save.mutateAsync({ name: next, current: category })
              }
              onToggleArchive={() => {
                void toggleArchive(category)
              }}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
