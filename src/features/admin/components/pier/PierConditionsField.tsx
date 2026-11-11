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
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {conditionGroups.map((group) => (
          <div
            key={group.id}
            role="group"
            aria-label={group.label}
            className="min-w-0 rounded-xl border border-navy-900/10 bg-mist-50/60 p-3"
          >
            <p className="mb-2 text-xs font-bold text-ink-600">{group.label}</p>
            {/* Segmented control: one choice per group, tapping it again clears it. */}
            <div className="flex min-w-0 rounded-lg border border-navy-900/15 bg-white p-0.5">
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
                    className={`inline-flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-md px-2 text-center text-xs leading-4 font-bold transition-colors ${selected ? 'bg-navy-900 text-white' : 'text-navy-900 hover:bg-mist-50'}`}
                  >
                    {selected && (
                      <Check
                        size={13}
                        aria-hidden="true"
                        className="shrink-0"
                      />
                    )}
                    {phrase}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <label htmlFor={id} className="mb-2 block text-xs font-bold text-ink-600">
        ¿Cómo está el muelle?{' '}
        <span className="font-normal">
          (opcional, se completa con lo elegido)
        </span>
      </label>
      <textarea
        id={id}
        name="conditions"
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_CONDITIONS}
        placeholder="Sumá lo que quieras contar con tus palabras…"
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-count${error ? ` ${id}-error` : ''}`}
        className={`${inputClass} aria-invalid:border-red-500`}
      />
      <p
        id={`${id}-count`}
        className="mt-1.5 text-right text-xs text-ink-600 tabular-nums"
      >
        {value.length}/{MAX_CONDITIONS}
      </p>
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
