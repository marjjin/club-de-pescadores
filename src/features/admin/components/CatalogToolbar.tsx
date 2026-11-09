import { RefreshCw, Search, X } from 'lucide-react'
import { inputClass, secondaryClass } from './ui'

const copy = {
  users: {
    form: 'Buscar usuarios',
    input: 'Buscar por inicio del correo',
    clear: 'Limpiar búsqueda de usuarios',
    applied: 'Mostrando correos que empiezan con',
    hint: 'Buscá por las primeras letras del correo. Las cuentas más recientes aparecen primero.',
  },
  roles: {
    form: 'Buscar roles',
    input: 'Buscar por inicio del nombre',
    clear: 'Limpiar búsqueda de roles',
    applied: 'Mostrando roles que empiezan con',
    hint: 'Buscá por las primeras letras del nombre. Los roles más recientes aparecen primero.',
  },
}
export type CatalogToolbarProps = {
  kind: 'users' | 'roles'
  search: string
  applied: string
  busy: boolean
  onChange: (search: string) => void
  onSearch: (search: string) => void
  onRefresh: () => void
}
export function CatalogToolbar({
  kind,
  search,
  applied,
  busy,
  onChange,
  onSearch,
  onRefresh,
}: CatalogToolbarProps) {
  const text = copy[kind]
  return (
    <div className="border-b border-navy-900/10 p-4 sm:px-6">
      <div className="flex flex-wrap gap-2">
        <form
          role="search"
          aria-label={text.form}
          className="flex min-w-0 flex-1 flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            onSearch(search)
          }}
        >
          <div className="relative min-w-40 flex-1">
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute top-3.5 left-3 text-ink-600"
            />
            <input
              type="search"
              name={kind === 'users' ? 'email' : 'name'}
              aria-label={text.input}
              value={search}
              onChange={(event) => onChange(event.target.value)}
              placeholder={`${text.input}…`}
              maxLength={100}
              className={`${inputClass} h-11 pr-11 pl-10 [&::-webkit-search-cancel-button]:appearance-none`}
            />
            {search && (
              <button
                type="button"
                aria-label={text.clear}
                onClick={() => {
                  onChange('')
                  onSearch('')
                }}
                className="absolute top-0 right-0 grid size-11 place-items-center text-ink-600"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <button type="submit" disabled={busy} className={secondaryClass}>
            Buscar
          </button>
        </form>
        <button
          type="button"
          disabled={busy}
          onClick={onRefresh}
          className={secondaryClass}
        >
          <RefreshCw
            size={16}
            aria-hidden="true"
            className={busy ? 'motion-safe:animate-spin' : ''}
          />
          Actualizar
        </button>
      </div>
      <p className="mt-3 text-xs leading-5 text-ink-600">
        {applied ? (
          <>
            {text.applied}{' '}
            <strong className="wrap-anywhere">«{applied}»</strong>.
          </>
        ) : (
          text.hint
        )}
      </p>
    </div>
  )
}
