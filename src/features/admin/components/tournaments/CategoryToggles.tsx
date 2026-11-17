import { Check, Plus } from 'lucide-react'
import { useCategories } from '../../hooks/useTournamentPeople'

/** Categories that add to an annual table, as toggle buttons. None selected takes any. */
export function CategoryToggles({
  userId,
  label,
  selected,
  onChange,
}: {
  userId: string
  label: string
  selected: string[]
  onChange: (ids: string[]) => void
}) {
  const categories = useCategories(userId)
  // Archived categories stay visible only where they are already chosen.
  const options = (categories.data ?? []).filter(
    (category) => !category.archived_at || selected.includes(category.id),
  )
  if (categories.isPending)
    return (
      <div className="h-11 rounded-xl bg-mist-50 motion-safe:animate-pulse" />
    )
  if (!options.length) return null
  return (
    <div className="grid gap-1.5">
      <p className="text-sm font-bold">{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((category) => {
          const active = selected.includes(category.id)
          return (
            <button
              key={category.id}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange(
                  active
                    ? selected.filter((id) => id !== category.id)
                    : [...selected, category.id],
                )
              }
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition-colors ${active ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 bg-white text-navy-900 hover:bg-mist-50'}`}
            >
              {active ? (
                <Check size={15} aria-hidden="true" />
              ) : (
                <Plus size={15} aria-hidden="true" />
              )}
              {category.name}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-ink-600">
        {selected.length
          ? 'Al armar un torneo, estas categorías se vinculan solas a esta tabla.'
          : 'Sin categorías elegidas, cualquier categoría puede sumar.'}
      </p>
    </div>
  )
}
