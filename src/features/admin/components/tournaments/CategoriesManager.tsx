import { useState } from 'react'
import { Plus, Tags } from 'lucide-react'
import { useAccess } from '../../hooks/useAccess'
import { useConfirm } from '../../hooks/useConfirm'
import {
  useCategories,
  useCategoryActions,
} from '../../hooks/useTournamentPeople'
import type { CategoryListItem } from '../../schemas/tournaments'
import { Feedback, Loading, inputClass, primaryClass } from '../ui'
import { CategoryRow } from './CategoryRow'
import { TournamentDialog } from './TournamentDialog'

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
  const { save, archive, remove } = useCategoryActions(userId)
  const [name, setName] = useState('')
  const busy = save.isPending || archive.isPending || remove.isPending
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
  async function destroy(category: CategoryListItem) {
    if (
      await confirm({
        title: `¿Eliminar «${category.name}»?`,
        message:
          'Ningún torneo la usa. Se quita también de las tablas anuales que la tenían predeterminada. No se puede deshacer.',
        confirmLabel: 'Eliminar',
        tone: 'danger',
      })
    )
      remove.mutate(category)
  }
  return (
    <TournamentDialog
      title="Categorías de torneos"
      description="Senior, Cadetes, Damas… Cada torneo usa una o varias, y cada una tiene su tabla de posiciones. Solo se pueden eliminar las que ningún torneo usa; las demás se archivan."
      icon={<Tags size={19} />}
      closeLabel="Cerrar categorías"
      onClose={onClose}
    >
      {manage && (
        <form
          className="flex flex-wrap gap-2 border-b border-navy-900/10 p-4 sm:px-6"
          onSubmit={(event) => {
            event.preventDefault()
            create()
          }}
        >
          <div className="min-w-48 flex-1">
            <input
              value={name}
              maxLength={60}
              aria-label="Nombre de la nueva categoría"
              placeholder="Nueva categoría"
              onChange={(event) => {
                setName(event.target.value)
                save.reset()
              }}
              className={inputClass}
            />
          </div>
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
        <Feedback
          error={save.error ?? archive.error ?? remove.error ?? query.error}
        />
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
              onDelete={() => {
                void destroy(category)
              }}
            />
          ))}
        </ul>
      )}
    </TournamentDialog>
  )
}
