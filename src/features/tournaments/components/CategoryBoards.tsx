import { useState } from 'react'
import { useBoardCategories } from '../hooks/useTournaments'
import { Leaderboard } from './Leaderboard'

/** One table per category, with a switcher when the tournament has several. */
export function CategoryBoards({ id, live }: { id: string; live: boolean }) {
  const query = useBoardCategories(id, live)
  const [chosen, setChosen] = useState<string | null>(null)
  if (query.isPending)
    return (
      <div
        role="status"
        aria-label="Cargando categorías"
        className="h-64 rounded-2xl bg-mist-50 motion-safe:animate-pulse"
      />
    )
  const categories = query.data ?? []
  // Without categories (or if they fail to load) the overall table still works.
  const category =
    categories.find((entry) => entry.id === chosen) ?? categories[0] ?? null
  return (
    <div className="grid gap-5">
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Categoría"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
        >
          {categories.map((entry) => {
            const active = entry.id === category?.id
            return (
              <button
                key={entry.id}
                type="button"
                aria-pressed={active}
                onClick={() => setChosen(entry.id)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-bold transition-colors ${active ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 bg-white text-navy-900 hover:bg-mist-50'}`}
              >
                {entry.name}
                <span
                  className={`rounded-full px-2 text-xs tabular-nums ${active ? 'bg-white/20' : 'bg-mist-50'}`}
                >
                  {entry.participants}
                </span>
              </button>
            )
          })}
        </div>
      )}
      {category && categories.length > 1 && (
        <h3 className="text-lg font-extrabold">Categoría {category.name}</h3>
      )}
      <Leaderboard
        key={category?.id ?? 'all'}
        id={id}
        category={category?.id ?? null}
        live={live}
      />
    </div>
  )
}
