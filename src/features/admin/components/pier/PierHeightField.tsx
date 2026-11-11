import { Minus, Plus } from 'lucide-react'
import { formatRiverDate, formatRiverHeight } from '@/features/river'
import { riverHeightToCm } from '../../pier-editor'
import { inputClass } from '../ui'

const STEP_CM = 5
const toMetres = (cm: number) => (cm / 100).toFixed(2).replace('.', ',')

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
  // Small river changes are the norm, so the steppers start from the last height.
  const step = (direction: 1 | -1) => {
    const base = riverHeightToCm(value) ?? last?.height_cm ?? 0
    onChange(toMetres(base + direction * STEP_CM))
  }
  const stepper =
    'grid size-14 shrink-0 place-items-center rounded-xl border border-navy-900/15 bg-white text-navy-900 transition-colors hover:bg-mist-50 active:scale-95 motion-reduce:transition-none'
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        Altura del río en metros
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Bajar 5 centímetros"
          className={stepper}
        >
          <Minus size={20} aria-hidden="true" />
        </button>
        <div className="relative min-w-0 flex-1 sm:max-w-56 sm:flex-none">
          <input
            id={id}
            name="height"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            inputMode="decimal"
            autoComplete="off"
            placeholder={last ? toMetres(last.height_cm) : '0,00'}
            maxLength={8}
            required
            aria-invalid={Boolean(error)}
            aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
            className={`${inputClass} h-14 pr-11 text-center text-3xl! font-extrabold tabular-nums aria-invalid:border-red-500`}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-lg font-bold text-ink-600"
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
      <p id={`${id}-help`} className="mt-2 text-xs leading-5 text-ink-600">
        {last ? (
          <>
            Última publicada:{' '}
            <span className="font-bold text-navy-900">
              {formatRiverHeight(last.height_cm)}
            </span>{' '}
            el {formatRiverDate(last.measured_at)}.{' '}
          </>
        ) : null}
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
