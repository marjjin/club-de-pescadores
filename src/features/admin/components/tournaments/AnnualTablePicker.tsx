import { Check, Plus } from 'lucide-react'
import { useAnnualTables } from '../../hooks/useAnnualTables'
import { useCategories } from '../../hooks/useTournamentPeople'

/** Each category of the tournament can add to none, one or several annual tables. */
export function AnnualTablePicker({
  userId,
  categories,
  value,
  onChange,
}: {
  userId: string
  /** Categories chosen for the tournament. */
  categories: string[]
  /** Annual tables chosen per category id. */
  value: Record<string, string[]>
  onChange: (tables: Record<string, string[]>) => void
}) {
  const tables = useAnnualTables(userId)
  const names = useCategories(userId)
  const categoryName = (categoryId: string) =>
    names.data?.find((entry) => entry.id === categoryId)?.name ?? 'Categoría'
  const chosen = new Set(Object.values(value).flat())
  // Archived tables stay visible only where they are already in use.
  const options = (tables.data ?? []).filter(
    (table) => !table.archived_at || chosen.has(table.id),
  )
  function toggle(categoryId: string, tableId: string) {
    const current = value[categoryId] ?? []
    onChange({
      ...value,
      [categoryId]: current.includes(tableId)
        ? current.filter((id) => id !== tableId)
        : [...current, tableId],
    })
  }
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-bold text-navy-900">
        Tablas anuales (opcional)
      </legend>
      {tables.isPending ? (
        <div className="h-11 rounded-xl bg-mist-50 motion-safe:animate-pulse" />
      ) : !options.length ? (
        <p className="rounded-xl border border-dashed border-navy-900/15 px-3 py-2.5 text-sm text-ink-600">
          Todavía no hay tablas anuales. Creala desde «Tablas anuales», en la
          lista de torneos, y volvé a editar este torneo para vincularlo.
        </p>
      ) : !categories.length ? (
        <p className="text-sm text-ink-600">
          Elegí primero las categorías del torneo.
        </p>
      ) : (
        <div className="grid gap-3 rounded-xl border border-navy-900/10 bg-mist-50/60 p-3">
          <p className="text-sm text-ink-600">
            Marcá a qué tablas suma cada categoría; puede sumar a varias. Los
            puntos se suman cuando finalices el torneo.
          </p>
          <ul className="grid gap-3">
            {categories.map((categoryId) => {
              const name = categoryName(categoryId)
              const selected = value[categoryId] ?? []
              return (
                <li
                  key={categoryId}
                  className="grid gap-1.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-start sm:gap-3"
                >
                  <span className="pt-2.5 text-sm font-bold wrap-anywhere sm:pt-3">
                    {name}
                  </span>
                  <div
                    role="group"
                    aria-label={`Tablas anuales de ${name}`}
                    className="flex flex-wrap gap-2"
                  >
                    {options.map((table) => {
                      const active = selected.includes(table.id)
                      return (
                        <button
                          key={table.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggle(categoryId, table.id)}
                          className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-bold transition-colors ${active ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 bg-white text-navy-900 hover:bg-mist-50'}`}
                        >
                          {active ? (
                            <Check size={15} aria-hidden="true" />
                          ) : (
                            <Plus size={15} aria-hidden="true" />
                          )}
                          {table.name} {table.year}
                          {table.archived_at ? ' (archivada)' : ''}
                        </button>
                      )
                    })}
                    {!selected.length && (
                      <span className="self-center text-xs text-ink-600">
                        No suma a ninguna tabla anual
                      </span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </fieldset>
  )
}
