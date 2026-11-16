import { useId, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAccess } from '../../hooks/useAccess'
import {
  useCategories,
  useCategoryActions,
} from '../../hooks/useTournamentPeople'
import { Feedback, inputClass, secondaryClass } from '../ui'

export function CategoryPicker({
  userId,
  selected,
  locked,
  error,
  onChange,
}: {
  userId: string
  selected: string[]
  /** Categories that already have participants in this tournament. */
  locked: string[]
  error?: string | undefined
  onChange: (ids: string[]) => void
}) {
  const id = useId()
  const manage = useAccess().can('torneos.gestionar')
  const categories = useCategories(userId)
  const { save } = useCategoryActions(userId)
  const [name, setName] = useState('')
  // Archived categories stay visible only where they are already in use.
  const options = (categories.data ?? []).filter(
    (category) => !category.archived_at || selected.includes(category.id),
  )
  const toggle = (categoryId: string) =>
    onChange(
      selected.includes(categoryId)
        ? selected.filter((value) => value !== categoryId)
        : [...selected, categoryId],
    )
  function create() {
    if (!name.trim() || save.isPending) return
    save.mutate(
      { name },
      {
        onSuccess: (created) => {
          setName('')
          onChange([...selected, created])
        },
      },
    )
  }
  return (
    <fieldset
      className="grid gap-3"
      aria-describedby={error ? `${id}-error` : `${id}-help`}
      data-field="categories"
    >
      <legend className="mb-1 text-sm font-bold text-navy-900">
        Categorías
      </legend>
      {categories.isPending ? (
        <p className="text-sm text-ink-600">Cargando categorías…</p>
      ) : categories.isError ? (
        <Feedback error={categories.error} />
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((category) => {
            const checked = selected.includes(category.id)
            const inUse = locked.includes(category.id)
            return (
              <label
                key={category.id}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-bold ${checked ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 bg-white text-navy-900 hover:bg-mist-50'} ${inUse ? 'cursor-not-allowed' : ''}`}
                title={
                  inUse ? 'Tiene participantes: no se puede quitar' : undefined
                }
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  disabled={inUse && checked}
                  onChange={() => toggle(category.id)}
                />
                {category.name}
                {category.archived_at && (
                  <span className="text-[11px] font-normal">(archivada)</span>
                )}
              </label>
            )
          })}
        </div>
      )}
      {manage && (
        <div className="flex flex-wrap gap-2">
          <input
            value={name}
            maxLength={60}
            aria-label="Nueva categoría"
            placeholder="Nueva categoría, p. ej. Senior"
            onChange={(event) => {
              setName(event.target.value)
              save.reset()
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return
              // Enter here creates the category instead of submitting the tournament.
              event.preventDefault()
              create()
            }}
            className={`${inputClass} min-w-48 flex-1`}
          />
          <button
            type="button"
            className={secondaryClass}
            disabled={!name.trim() || save.isPending}
            onClick={create}
          >
            <Plus size={16} aria-hidden="true" />
            {save.isPending ? 'Creando…' : 'Crear categoría'}
          </button>
        </div>
      )}
      <Feedback error={save.error} />
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : (
        <p id={`${id}-help`} className="text-xs text-ink-600">
          Cada categoría tiene su propia tabla de posiciones. Una persona puede
          anotarse en varias.
        </p>
      )}
    </fieldset>
  )
}
