import {
  FileText,
  ListFilter,
  Radio,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { contentListCopy } from '../content-list'
import type { ContentKind } from '../schemas/admin'
import { inputClass, secondaryClass } from './ui'

type Props = {
  kind: ContentKind
  state: string
  search: string
  busy: boolean
  onSearchChange: (value: string) => void
  onFilter: (state: string, search: string) => void
  onRefresh: () => void
}

export function ContentToolbar({
  kind,
  state,
  search,
  busy,
  onSearchChange,
  onFilter,
  onRefresh,
}: Props) {
  const tabs = [
    { id: 'all', label: 'Activas', icon: ListFilter },
    { id: 'draft', label: 'Borradores', icon: FileText },
    {
      id: 'published',
      label: contentListCopy[kind].publishedLabel,
      icon: Radio,
    },
    { id: 'archived', label: 'Papelera', icon: Trash2 },
  ]
  return (
    <>
      <div className="overflow-x-auto border-b border-navy-900/10 px-4 py-3 sm:px-6">
        <nav aria-label="Filtrar por estado" className="flex min-w-max gap-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={state === id}
              onClick={() => onFilter(id, search)}
              className={`flex min-h-11 items-center gap-2 rounded-lg px-3.5 text-sm font-bold transition-colors ${state === id ? 'bg-river-600/10 text-navy-900 ring-1 ring-inset ring-river-600/15' : 'text-ink-600 hover:bg-mist-50 hover:text-navy-900'}`}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex flex-wrap gap-2 p-4 sm:px-6">
        <form
          role="search"
          aria-label="Buscar contenido"
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            onFilter(state, search)
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-600/70"
            />
            <input
              aria-label="Buscar por palabras"
              type="search"
              name="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={`Buscar ${contentListCopy[kind].noun}…`}
              maxLength={100}
              className={`${inputClass} h-11 pr-10 pl-10 [&::-webkit-search-cancel-button]:appearance-none`}
            />
            {search && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => {
                  onSearchChange('')
                  onFilter(state, '')
                }}
                className="absolute top-0 right-0 grid size-11 place-items-center rounded-r-lg text-ink-600 hover:text-navy-900"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <button type="submit" className={secondaryClass}>
            Buscar
          </button>
        </form>
        <button
          type="button"
          className="grid size-11 shrink-0 place-items-center rounded-lg border border-navy-900/20 text-ink-600 transition-colors hover:bg-mist-50 disabled:opacity-50"
          aria-label="Actualizar listado"
          title="Actualizar listado"
          disabled={busy}
          onClick={onRefresh}
        >
          <RefreshCw
            size={17}
            aria-hidden="true"
            className={busy ? 'motion-safe:animate-spin' : ''}
          />
        </button>
      </div>
    </>
  )
}
