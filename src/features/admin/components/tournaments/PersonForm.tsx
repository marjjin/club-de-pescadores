import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { useSaveAngler } from '../../hooks/useTournamentPeople'
import { anglerInputSchema } from '../../schemas/tournaments'
import type { Angler, AnglerInput } from '../../schemas/tournaments'
import { Feedback, inputClass, primaryClass, secondaryClass } from '../ui'

type Errors = Partial<Record<keyof AnglerInput, string>>
const labels: Record<keyof AnglerInput, string> = {
  first_name: 'Nombre',
  last_name: 'Apellido',
  dni: 'DNI',
}

/** Creates a person in the registry, or corrects one (with the full DNI loaded). */
export function PersonForm({
  userId,
  current,
  initialName = '',
  onSaved,
  onCancel,
}: {
  userId: string
  current?: Angler | undefined
  /** What staff typed in the search, to avoid typing it twice. */
  initialName?: string
  onSaved: (angler: Angler) => void
  onCancel: () => void
}) {
  const id = useId()
  const save = useSaveAngler(userId)
  const typedDni = /^[\d.\s-]+$/.test(initialName.trim())
  const [values, setValues] = useState<AnglerInput>(() => ({
    first_name: current?.first_name ?? (typedDni ? '' : initialName.trim()),
    last_name: current?.last_name ?? '',
    dni: current?.dni ?? (typedDni ? initialName.trim() : ''),
  }))
  const [errors, setErrors] = useState<Errors>({})
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending) return
    const parsed = anglerInputSchema.safeParse(values)
    if (!parsed.success) {
      const next: Errors = {}
      for (const issue of parsed.error.issues)
        next[issue.path[0] as keyof AnglerInput] ??= issue.message
      setErrors(next)
      return
    }
    save.mutate({ input: values, current }, { onSuccess: onSaved })
  }
  const field = (name: keyof AnglerInput, extra: { inputMode?: 'numeric' }) => (
    <label className="grid gap-1.5 text-sm font-bold text-navy-900">
      {labels[name]}
      <input
        value={values[name]}
        maxLength={name === 'dni' ? 12 : 60}
        autoComplete="off"
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `${id}-${name}` : undefined}
        onChange={(event) => {
          const value = event.target.value
          setValues((previous) => ({ ...previous, [name]: value }))
          setErrors((previous) => ({ ...previous, [name]: undefined }))
          save.reset()
        }}
        className={inputClass}
        {...extra}
      />
      {errors[name] && (
        <span id={`${id}-${name}`} className="font-normal text-red-700">
          {errors[name]}
        </span>
      )}
    </label>
  )
  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label={
        current ? 'Corregir datos de la persona' : 'Registrar persona'
      }
      className="grid gap-3 rounded-xl border border-navy-900/10 bg-mist-50/60 p-3 sm:p-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {field('first_name', {})}
        {field('last_name', {})}
        {field('dni', { inputMode: 'numeric' })}
      </div>
      <p className="text-xs leading-5 text-ink-600">
        El DNI solo sirve para identificar a la persona en futuros torneos: no
        se publica en el sitio. En la tabla aparece como «
        {values.first_name.trim() || 'Nombre'}{' '}
        {(values.last_name.trim()[0] ?? 'A').toUpperCase()}.».
      </p>
      <Feedback error={save.error} />
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          className={secondaryClass}
          disabled={save.isPending}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={primaryClass}
          disabled={save.isPending}
        >
          {save.isPending ? (
            <LoaderCircle
              size={16}
              aria-hidden="true"
              className="motion-safe:animate-spin"
            />
          ) : (
            <Save size={16} aria-hidden="true" />
          )}
          {current ? 'Guardar datos' : 'Registrar persona'}
        </button>
      </div>
    </form>
  )
}
