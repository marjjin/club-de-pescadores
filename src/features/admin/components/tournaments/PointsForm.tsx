import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { LoaderCircle } from 'lucide-react'
import { pointsInputSchema } from '../../schemas/tournaments'
import { inputClass, primaryClass, secondaryClass } from '../ui'

// Common amounts in one tap; any other value can still be typed.
const quick = [1, 5, 10, -1]

export function PointsForm({
  name,
  pending,
  onSubmit,
  onCancel,
}: {
  name: string
  pending: boolean
  onSubmit: (points: number, reason: string) => Promise<unknown>
  onCancel: () => void
}) {
  const id = useId()
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    const parsed = pointsInputSchema.safeParse({
      points: points.trim() === '' ? Number.NaN : Number(points),
      reason,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los puntos.')
      return
    }
    try {
      await onSubmit(parsed.data.points, parsed.data.reason)
    } catch {
      // The row shows the mutation error; keep the values to retry.
    }
  }
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submit(event)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !pending) onCancel()
      }}
      aria-label={`Sumar puntos a ${name}`}
      className="grid gap-3 rounded-xl border border-navy-900/10 bg-mist-50/60 p-3 sm:p-4"
    >
      <div
        role="group"
        aria-label="Valores rápidos"
        className="flex flex-wrap gap-2"
      >
        {quick.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={points === String(value)}
            onClick={() => {
              setPoints(String(value))
              setError(null)
            }}
            className={`min-h-11 min-w-12 rounded-lg border px-3 text-sm font-extrabold tabular-nums ${points === String(value) ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/15 bg-white text-navy-900 hover:bg-mist-50'}`}
          >
            {value > 0 ? `+${value}` : value}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          name="points"
          type="number"
          inputMode="numeric"
          step={1}
          min={-1000}
          max={1000}
          value={points}
          autoFocus
          aria-label={`Puntos para ${name}`}
          aria-describedby={`${id}-help`}
          aria-invalid={error ? true : undefined}
          placeholder="Puntos"
          onChange={(event) => {
            setPoints(event.target.value)
            setError(null)
          }}
          className={`${inputClass} w-28`}
        />
        <input
          name="reason"
          value={reason}
          maxLength={200}
          aria-label={`Motivo (opcional) para ${name}`}
          placeholder="Motivo (opcional), p. ej. corvina 2 kg"
          onChange={(event) => setReason(event.target.value)}
          className={`${inputClass} min-w-40 flex-1`}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {error ? (
          <p id={`${id}-help`} role="alert" className="text-xs text-red-700">
            {error}
          </p>
        ) : (
          <p id={`${id}-help`} className="text-xs text-ink-600">
            Para corregir un error, cargá los puntos en negativo.
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            className={secondaryClass}
            disabled={pending}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button type="submit" className={primaryClass} disabled={pending}>
            {pending && (
              <LoaderCircle
                size={16}
                aria-hidden="true"
                className="motion-safe:animate-spin"
              />
            )}
            {pending ? 'Sumando…' : 'Sumar'}
          </button>
        </div>
      </div>
    </form>
  )
}
