import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { pointsInputSchema } from '../../schemas/tournaments'
import { inputClass, primaryClass } from '../ui'

export function PointsForm({
  name,
  pending,
  onSubmit,
}: {
  name: string
  pending: boolean
  onSubmit: (points: number, reason: string) => Promise<unknown>
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
      setPoints('')
      setReason('')
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
      aria-label={`Sumar puntos a ${name}`}
      className="grid gap-2"
    >
      <div className="flex flex-wrap gap-2">
        <input
          name="points"
          type="number"
          inputMode="numeric"
          step={1}
          min={-1000}
          max={1000}
          value={points}
          aria-label={`Puntos para ${name}`}
          aria-describedby={error ? `${id}-error` : undefined}
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
          placeholder="Motivo (opcional)"
          onChange={(event) => setReason(event.target.value)}
          className={`${inputClass} min-w-32 flex-1`}
        />
        <button type="submit" className={primaryClass} disabled={pending}>
          {pending ? 'Sumando…' : 'Sumar'}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : (
        <p className="text-xs text-ink-600">
          Para corregir un error, cargá los puntos en negativo (por ejemplo,
          -5).
        </p>
      )}
    </form>
  )
}
