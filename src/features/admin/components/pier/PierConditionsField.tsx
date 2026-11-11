import { Check } from 'lucide-react'
import {
  conditionGroups,
  hasCondition,
  MAX_CONDITIONS,
  toggleCondition,
} from '../../pier-editor'
import { inputClass } from '../ui'

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
  return (
    <div>
      <div className="mb-4 grid gap-3">
        {conditionGroups.map((group) => (
          <div
            key={group.id}
            role="group"
            aria-label={group.label}
            className="flex min-w-0 flex-wrap items-center gap-2"
          >
            <span className="w-20 shrink-0 text-xs font-bold text-ink-600">
              {group.label}
            </span>
            {group.options.map((phrase) => {
              const selected = hasCondition(value, phrase)
              return (
                <button
                  key={phrase}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    const next = toggleCondition(value, group, phrase)
                    if (next.length <= MAX_CONDITIONS) onChange(next)
                  }}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-colors ${selected ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 bg-white text-navy-900 hover:border-river-600/50 hover:bg-mist-50'}`}
                >
                  {selected && <Check size={13} aria-hidden="true" />}
                  {phrase}
                </button>
              )
            })}
          </div>
        ))}
      </div>
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
        placeholder="Elegí las opciones de arriba o contalo con tus palabras…"
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
