import { useId, useState } from 'react'
import { annualTableInputSchema } from '../../schemas/tournaments'
import type { AnnualTableInput } from '../../schemas/tournaments'
import { inputClass, primaryClass, secondaryClass } from '../ui'
import { CategoryToggles } from './CategoryToggles'

/** Name, season and preset categories of an annual table, to create or edit it. */
export function AnnualTableForm({
  userId,
  label,
  categoriesLabel,
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
}: {
  userId: string
  /** Accessible name of the form. */
  label: string
  categoriesLabel: string
  initial: AnnualTableInput
  submitLabel: string
  pending: boolean
  /** Called with valid data; the caller saves it and closes the form. */
  onSubmit: (input: AnnualTableInput) => void
  onCancel: () => void
}) {
  const id = useId()
  const [name, setName] = useState(initial.name)
  const [year, setYear] = useState(String(initial.year))
  const [categories, setCategories] = useState(initial.categories)
  const [error, setError] = useState<string | null>(null)
  function submit() {
    if (pending) return
    const parsed = annualTableInputSchema.safeParse({
      name,
      year: Number(year),
      categories,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.')
      return
    }
    onSubmit(parsed.data)
  }
  return (
    <form
      aria-label={label}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      onKeyDown={(event) => {
        // Esc closes this form, not the window around it.
        if (event.key === 'Escape') {
          event.preventDefault()
          onCancel()
        }
      }}
      className="grid gap-4"
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <label
          htmlFor={`${id}-name`}
          className="grid gap-1.5 text-sm font-bold"
        >
          Nombre
          <input
            id={`${id}-name`}
            value={name}
            maxLength={120}
            autoFocus
            placeholder="Por ejemplo, Tabla anual Mayores"
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            className={`${inputClass} font-normal`}
          />
        </label>
        <label
          htmlFor={`${id}-year`}
          className="grid gap-1.5 text-sm font-bold"
        >
          Año
          <input
            id={`${id}-year`}
            value={year}
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            onChange={(event) => {
              setYear(event.target.value)
              setError(null)
            }}
            className={`${inputClass} font-normal`}
          />
        </label>
      </div>
      <CategoryToggles
        userId={userId}
        label={categoriesLabel}
        selected={categories}
        onChange={(ids) => {
          setCategories(ids)
          setError(null)
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" className={secondaryClass} onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="submit"
          className={primaryClass}
          disabled={pending || !name.trim()}
        >
          {pending ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
