import { useState } from 'react'
import type { FormEvent, InputHTMLAttributes } from 'react'
import { useSaveTournament } from '../../hooks/useAdminTournaments'
import { tournamentInputSchema } from '../../schemas/tournaments'
import type {
  AdminTournament,
  TournamentInput,
} from '../../schemas/tournaments'
import {
  Feedback,
  Field,
  inputClass,
  primaryClass,
  secondaryClass,
} from '../ui'

type Errors = Partial<Record<keyof TournamentInput, string>>

export function TournamentForm({
  userId,
  current,
  onSaved,
  onCancel,
}: {
  userId: string
  current?: AdminTournament
  onSaved: (id: string) => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<TournamentInput>({
    name: current?.name ?? '',
    place: current?.place ?? '',
    starts_on: current?.starts_on ?? '',
    ends_on: current?.ends_on ?? '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const save = useSaveTournament(userId)
  const change = (name: keyof TournamentInput, value: string) => {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending) return
    const parsed = tournamentInputSchema.safeParse(values)
    if (!parsed.success) {
      const next: Errors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof TournamentInput
        next[key] ??= issue.message
      }
      setErrors(next)
      const first = Object.keys(next)[0]
      if (first)
        event.currentTarget
          .querySelector<HTMLInputElement>(`[name="${first}"]`)
          ?.focus()
      return
    }
    save.mutate({ input: values, current }, { onSuccess: (id) => onSaved(id) })
  }
  const field = (
    name: keyof TournamentInput,
    label: string,
    props: InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <Field label={label}>
      <input
        name={name}
        value={values[name]}
        onChange={(event) => change(name, event.target.value)}
        aria-invalid={errors[name] ? true : undefined}
        aria-describedby={errors[name] ? `${name}-error` : undefined}
        className={inputClass}
        {...props}
      />
      {errors[name] && (
        <span id={`${name}-error`} className="text-sm font-normal text-red-700">
          {errors[name]}
        </span>
      )}
    </Field>
  )
  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label={current ? 'Editar torneo' : 'Nuevo torneo'}
      className="grid gap-4 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
    >
      {field('name', 'Nombre del torneo', { maxLength: 120, required: true })}
      {field('place', 'Lugar (opcional)', { maxLength: 200 })}
      <div className="grid gap-4 sm:grid-cols-2">
        {field('starts_on', 'Fecha de inicio', {
          type: 'date',
          required: true,
        })}
        {field('ends_on', 'Fecha de cierre (opcional)', { type: 'date' })}
      </div>
      <Feedback error={save.error} />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className={primaryClass}
          disabled={save.isPending}
        >
          {save.isPending
            ? 'Guardando…'
            : current
              ? 'Guardar cambios'
              : 'Crear torneo'}
        </button>
        <button type="button" className={secondaryClass} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
