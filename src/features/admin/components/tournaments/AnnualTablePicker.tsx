import { useAnnualTables } from '../../hooks/useAnnualTables'
import { useCategories } from '../../hooks/useTournamentPeople'
import { inputClass } from '../ui'

/** Optional annual table for the tournament, and which of its categories add to it. */
export function AnnualTablePicker({
  userId,
  value,
  categories,
  excluded,
  onChange,
  onExcludedChange,
}: {
  userId: string
  value: string
  /** Categories chosen for the tournament. */
  categories: string[]
  excluded: string[]
  onChange: (id: string) => void
  onExcludedChange: (ids: string[]) => void
}) {
  const tables = useAnnualTables(userId)
  const names = useCategories(userId)
  // Archived tables stay visible only where they are already in use.
  const options = (tables.data ?? []).filter(
    (table) => !table.archived_at || table.id === value,
  )
  const categoryName = (categoryId: string) =>
    names.data?.find((entry) => entry.id === categoryId)?.name ?? 'Categoría'
  const counting = categories.filter(
    (categoryId) => !excluded.includes(categoryId),
  )
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-bold text-navy-900">
        Tabla anual (opcional)
      </legend>
      {tables.isPending ? (
        <div className="h-11 rounded-xl bg-mist-50 motion-safe:animate-pulse" />
      ) : !options.length ? (
        <p className="rounded-xl border border-dashed border-navy-900/15 px-3 py-2.5 text-sm text-ink-600">
          Todavía no hay tablas anuales. Creala desde «Tablas anuales», en la
          lista de torneos, y volvé a editar este torneo para vincularlo.
        </p>
      ) : (
        <>
          <select
            aria-label="Tabla anual"
            value={value}
            onChange={(event) => onChange(event.target.value)}
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
          {value && (
            <div className="grid gap-2 rounded-xl border border-navy-900/10 bg-mist-50/60 p-3">
              <p className="text-sm text-ink-600">
                Cuando finalices el torneo, los puntos de cada persona se suman
                a la tabla anual de su misma categoría.
              </p>
              {categories.length > 1 && (
                <div className="grid gap-1">
                  <p className="text-sm font-bold">Categorías que suman</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {categories.map((categoryId) => (
                      <label
                        key={categoryId}
                        className="flex min-h-11 items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          aria-label={`${categoryName(categoryId)} suma a la tabla anual`}
                          checked={!excluded.includes(categoryId)}
                          onChange={(event) =>
                            onExcludedChange(
                              event.target.checked
                                ? excluded.filter(
                                    (entry) => entry !== categoryId,
                                  )
                                : [...excluded, categoryId],
                            )
                          }
                          className="size-4"
                        />
                        {categoryName(categoryId)}
                      </label>
                    ))}
                  </div>
                  {!counting.length && (
                    <p className="text-sm text-amber-900">
                      Con ninguna categoría marcada, el torneo no suma nada.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </fieldset>
  )
}
