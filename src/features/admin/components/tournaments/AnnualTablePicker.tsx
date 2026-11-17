import { useAnnualTables } from '../../hooks/useAnnualTables'
import { useCategories } from '../../hooks/useTournamentPeople'
import { inputClass } from '../ui'

/** Each category of the tournament can add to its own annual table, or to none. */
export function AnnualTablePicker({
  userId,
  categories,
  value,
  onChange,
}: {
  userId: string
  /** Categories chosen for the tournament. */
  categories: string[]
  /** Annual table per category id; '' adds to none. */
  value: Record<string, string>
  onChange: (tables: Record<string, string>) => void
}) {
  const tables = useAnnualTables(userId)
  const names = useCategories(userId)
  const categoryName = (categoryId: string) =>
    names.data?.find((entry) => entry.id === categoryId)?.name ?? 'Categoría'
  // Archived tables stay visible only where they are already in use.
  const options = (tables.data ?? []).filter(
    (table) => !table.archived_at || Object.values(value).includes(table.id),
  )
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
            Cuando finalices el torneo, los puntos de cada categoría se suman a
            la tabla anual que elijas para ella.
          </p>
          <ul className="grid gap-2">
            {categories.map((categoryId) => {
              const name = categoryName(categoryId)
              return (
                <li
                  key={categoryId}
                  className="grid gap-1.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-center sm:gap-3"
                >
                  <span className="text-sm font-bold wrap-anywhere">
                    {name}
                  </span>
                  <select
                    aria-label={`Tabla anual de ${name}`}
                    value={value[categoryId] ?? ''}
                    onChange={(event) =>
                      onChange({ ...value, [categoryId]: event.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">No suma a ninguna tabla anual</option>
                    {options.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name} {table.year}
                        {table.archived_at ? ' (archivada)' : ''}
                      </option>
                    ))}
                  </select>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </fieldset>
  )
}
