import { useId } from 'react'
import type { RateTextKey } from '../../rate-editor'
import { inputClass } from '../ui'

export function RateField({
  name,
  label,
  value,
  error,
  hint,
  type = 'text',
  max,
  min,
  optional = false,
  onChange,
}: {
  name: RateTextKey
  label: string
  value: string
  error?: string | undefined
  hint: string
  type?: 'text' | 'money' | 'date' | 'textarea'
  max?: number
  min?: string
  optional?: boolean
  onChange: (name: RateTextKey, value: string) => void
}) {
  const id = useId()
  const control = {
    id,
    name,
    value,
    required: !optional,
    maxLength: max,
    onChange: (event: { target: { value: string } }) =>
      onChange(name, event.target.value),
    'aria-invalid': Boolean(error),
    'aria-describedby': `${id}-help${error ? ` ${id}-error` : ''}`,
    className: `${inputClass} aria-invalid:border-red-500 ${type === 'money' ? 'pl-9 text-lg font-bold tabular-nums' : ''}`,
  }
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label}{' '}
        {optional ? (
          <span className="font-normal text-ink-600">(opcional)</span>
        ) : (
          <span aria-hidden="true" className="text-river-600">
            *
          </span>
        )}
      </label>
      {type === 'textarea' ? (
        <textarea
          {...control}
          rows={3}
          className={`${control.className} min-h-24 resize-y leading-6`}
        />
      ) : (
        <div className="relative">
          {type === 'money' && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-3 left-3 text-lg text-ink-600"
            >
              $
            </span>
          )}
          <input
            {...control}
            type={type === 'money' ? 'text' : type}
            inputMode={type === 'money' ? 'decimal' : undefined}
            min={min}
          />
        </div>
      )}
      <div
        id={`${id}-help`}
        className="mt-2 flex min-w-0 justify-between gap-3 text-xs leading-5 wrap-anywhere text-ink-600"
      >
        <span>{hint}</span>
        {max && (
          <span className="shrink-0 tabular-nums">
            {value.length}/{max}
          </span>
        )}
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
