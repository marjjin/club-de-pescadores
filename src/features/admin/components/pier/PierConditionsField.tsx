import { Plus } from 'lucide-react'
import { MAX_CONDITIONS } from '../../pier-editor'
import { inputClass } from '../ui'

// Generic river conditions only; staff complete the specifics in their own words.
const suggestions = [
  'Agua clara',
  'Agua turbia',
  'Poco viento',
  'Viento fuerte',
  'Buen pique',
  'Poco pique',
]

export function PierConditionsField({
  id,
  value,
  error,
  onChange,
}: {
  id: string
  value: string
  error: string | undefined
  onChange: (value: string) => void
}) {
  const add = (phrase: string) => {
    const text = value.trim()
    const next = text
      ? `${text.replace(/[.,]$/, '')}, ${phrase.toLowerCase()}`
      : phrase
    if (next.length <= MAX_CONDITIONS) onChange(next)
  }
  return (
    <div>
      <ul aria-label="Frases rápidas" className="mb-3 flex flex-wrap gap-2">
        {suggestions.map((phrase) => (
          <li key={phrase}>
            <button
              type="button"
              onClick={() => add(phrase)}
              disabled={value.toLowerCase().includes(phrase.toLowerCase())}
              className="inline-flex min-h-10 items-center gap-1 rounded-full border border-navy-900/15 bg-white px-3 text-xs font-bold text-navy-900 transition-colors hover:border-river-600/50 hover:bg-mist-50 disabled:border-river-600/30 disabled:bg-river-600/5 disabled:text-river-600"
            >
              <Plus size={13} aria-hidden="true" />
              {phrase}
            </button>
          </li>
        ))}
      </ul>
      <label htmlFor={id} className="sr-only">
        ¿Cómo está el muelle?
      </label>
      <textarea
        id={id}
        name="conditions"
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_CONDITIONS}
        placeholder="Contá lo que vean los pescadores: el agua, el viento, el pique…"
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-count${error ? ` ${id}-error` : ''}`}
        className={`${inputClass} aria-invalid:border-red-500`}
      />
      <div className="mt-2 flex justify-between gap-3 text-xs text-ink-600">
        <span>Opcional</span>
        <span id={`${id}-count`} className="tabular-nums">
          {value.length}/{MAX_CONDITIONS}
        </span>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="mt-2 text-xs font-semibold text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  )
}
