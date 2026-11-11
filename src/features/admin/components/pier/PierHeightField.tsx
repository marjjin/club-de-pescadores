import { ArrowDown, ArrowUp, Equal, Minus, Plus } from 'lucide-react'
import { formatRelative } from '@/shared/lib/dates'
import { cmToMetres, heightChange, riverHeightToCm } from '../../pier-editor'
import { inputClass } from '../ui'

const STEP_CM = 5
const stepper =
  'grid size-14 shrink-0 place-items-center rounded-xl border border-navy-900/15 bg-white text-navy-900 transition-[background-color,scale] hover:bg-mist-50 active:scale-95 motion-reduce:transition-none'

export function PierHeightField({
  id,
  value,
  error,
  last,
  onChange,
}: {
  id: string
  value: string
  error: string | undefined
  last: { height_cm: number; measured_at: string } | undefined
  onChange: (value: string) => void
}) {
  const cm = riverHeightToCm(value)
  const change = heightChange(cm, last?.height_cm)
  const step = (direction: 1 | -1) =>
    onChange(cmToMetres((cm ?? last?.height_cm ?? 0) + direction * STEP_CM))
  const Icon = !change
    ? null
    : change.delta === 0
      ? Equal
      : change.delta > 0
        ? ArrowUp
        : ArrowDown
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        Altura del río en metros
      </label>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Bajar 5 centímetros"
            className={stepper}
          >
            <Minus size={20} aria-hidden="true" />
          </button>
          <div className="relative w-40">
            <input
              id={id}
              name="height"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              maxLength={8}
              required
              aria-invalid={Boolean(error)}
              aria-describedby={`${id}-change ${id}-help${error ? ` ${id}-error` : ''}`}
              className={`${inputClass} h-14 pr-10 text-center text-3xl! font-extrabold tabular-nums aria-invalid:border-red-500`}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-lg font-bold text-ink-600"
            >
              m
            </span>
          </div>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Subir 5 centímetros"
            className={stepper}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        </div>
        <p id={`${id}-change`} aria-live="polite" className="min-w-0">
          {change && Icon && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${change.delta === 0 ? 'bg-amber-50 text-amber-900' : 'bg-river-600/10 text-river-600'}`}
            >
              <Icon size={14} aria-hidden="true" />
              {change.label}
            </span>
          )}
        </p>
      </div>
      <p id={`${id}-help`} className="mt-2.5 text-xs leading-5 text-ink-600">
        {last
          ? `Arranca con la última publicada (${cmToMetres(last.height_cm)} m, ${formatRelative(last.measured_at)}). Ajustala con − y + o escribila.`
          : 'Escribila en metros, por ejemplo 3,30.'}{' '}
        La fecha y la hora se toman al publicar.
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
