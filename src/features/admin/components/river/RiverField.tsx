import { useId } from 'react'
import type { RiverTextField } from '../../river-editor'
import { inputClass } from '../ui'

const fields = {
  height: {
    label: 'Altura en metros',
    help: 'Hasta 2 decimales, con coma o punto. Admite valores negativos; no uses separadores de miles.',
    max: 8,
    type: 'text',
  },
  measured_at: {
    label: 'Fecha y hora de medición',
    help: 'Hora de Argentina (UTC−3). Se completa con la hora actual; cambiala si la medición es de otro momento.',
    max: undefined,
    type: 'datetime-local',
  },
  station: {
    label: 'Punto de medición',
    help: 'Estación, puerto o referencia donde se midió.',
    max: 120,
    type: 'text',
  },
  source: {
    label: 'Fuente de la medición',
    help: 'Organismo, registro o persona que informó este valor.',
    max: 160,
    type: 'text',
  },
} as const

export function RiverField({
  name,
  value,
  error,
  onChange,
}: {
  name: RiverTextField
  value: string
  error: string | undefined
  onChange: (name: RiverTextField, value: string) => void
}) {
  const id = useId()
  const field = fields[name]
  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-bold after:ml-1 after:text-river-600 after:content-['*']"
      >
        {field.label}
      </label>
      <div className="relative min-w-0">
        <input
          id={id}
          name={name}
          type={field.type}
          value={value}
          required
          maxLength={field.max}
          inputMode={name === 'height' ? 'decimal' : undefined}
          placeholder={name === 'height' ? '0,00' : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
          onChange={(event) => onChange(name, event.target.value)}
          className={`${inputClass} aria-invalid:border-red-500 ${name === 'height' ? 'h-16 pr-12 text-3xl! font-extrabold tabular-nums' : ''}`}
        />
        {name === 'height' && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg font-bold text-ink-600"
          >
            m
          </span>
        )}
      </div>
      <div className="mt-2 flex items-start justify-between gap-3 text-xs leading-5 text-ink-600">
        <p id={`${id}-help`}>{field.help}</p>
        {(name === 'station' || name === 'source') && (
          <span className="shrink-0 tabular-nums">
            {value.length}/{field.max}
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
