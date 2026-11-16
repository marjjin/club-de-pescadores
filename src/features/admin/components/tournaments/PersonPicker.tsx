import { useId, useState } from 'react'
import { Search, UserPlus, UserRound } from 'lucide-react'
import { useAnglerSearch } from '../../hooks/useTournamentPeople'
import type { Angler } from '../../schemas/tournaments'
import { Feedback, inputClass, secondaryClass } from '../ui'
import { PersonForm } from './PersonForm'
import { personLabel } from './person-label'

/** Finds someone already registered (by name or full DNI) or registers a new person. */
export function PersonPicker({
  userId,
  label,
  onSelect,
}: {
  userId: string
  label: string
  onSelect: (angler: Angler) => void
}) {
  const id = useId()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const { search, applied, typing } = useAnglerSearch(userId, query)
  const results = search.data ?? []
  const searched = applied.length >= 2 && !typing && search.isSuccess
  if (creating)
    return (
      <PersonForm
        userId={userId}
        initialName={query}
        onCancel={() => setCreating(false)}
        onSaved={(angler) => {
          setCreating(false)
          onSelect(angler)
        }}
      />
    )
  return (
    <div className="grid gap-3">
      <label htmlFor={`${id}-search`} className="text-sm font-bold">
        {label}
      </label>
      <div className="relative">
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute top-3.5 left-3 text-ink-600"
        />
        <input
          id={`${id}-search`}
          type="search"
          value={query}
          maxLength={80}
          autoComplete="off"
          placeholder="Nombre, apellido o DNI completo"
          aria-describedby={`${id}-status`}
          onChange={(event) => setQuery(event.target.value)}
          className={`${inputClass} h-11 pl-10`}
        />
      </div>
      <p id={`${id}-status`} role="status" className="text-xs text-ink-600">
        {query.trim().length < 2
          ? 'Escribí al menos 2 letras, o el DNI sin puntos.'
          : typing || search.isFetching
            ? 'Buscando…'
            : searched && !results.length
              ? 'No hay nadie registrado con esos datos.'
              : searched
                ? `${results.length} ${results.length === 1 ? 'persona encontrada' : 'personas encontradas'}`
                : ''}
      </p>
      <Feedback error={search.error} />
      {results.length > 0 && !typing && (
        <ul
          aria-label="Personas encontradas"
          className="grid max-h-64 gap-1 overflow-y-auto"
        >
          {results.map((angler) => (
            <li key={angler.id}>
              <button
                type="button"
                onClick={() => onSelect(angler)}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-navy-900/10 bg-white px-3 py-2 text-left hover:border-river-600/40 hover:bg-mist-50"
              >
                <UserRound
                  size={16}
                  aria-hidden="true"
                  className="shrink-0 text-ink-600"
                />
                <span className="min-w-0 flex-1 font-bold wrap-anywhere">
                  {personLabel(angler)}
                </span>
                <span className="shrink-0 text-xs text-ink-600 tabular-nums">
                  DNI {angler.dni_masked}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className={`${secondaryClass} justify-self-start`}
        onClick={() => setCreating(true)}
      >
        <UserPlus size={16} aria-hidden="true" />
        Registrar persona nueva
      </button>
    </div>
  )
}
