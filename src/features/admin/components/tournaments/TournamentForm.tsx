import { useState } from 'react'
import type { FormEvent, InputHTMLAttributes } from 'react'
import { LoaderCircle, Save } from 'lucide-react'
import { useConfirm } from '../../hooks/useConfirm'
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
import { CategoryPicker } from './CategoryPicker'
import { TournamentFormHeader } from './TournamentFormHeader'

type Errors = Partial<Record<keyof TournamentInput, string>>
type TextField = Exclude<keyof TournamentInput, 'categories'>

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
  const confirm = useConfirm()
  const [initial] = useState<TournamentInput>(() => ({
    name: current?.name ?? '',
    place: current?.place ?? '',
    starts_on: current?.starts_on ?? '',
    ends_on: current?.ends_on ?? '',
    start_time: current?.start_time ?? '',
    categories: current?.categories.map((category) => category.id) ?? [],
  }))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<Errors>({})
  const save = useSaveTournament(userId)
  const dirty = JSON.stringify(values) !== JSON.stringify(initial)
  const change = <K extends keyof TournamentInput>(
    name: K,
    value: TournamentInput[K],
  ) => {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
    save.reset()
  }
  async function cancel() {
    if (save.isPending) return
    if (
      dirty &&
      !(await confirm({
        title: current ? '¿Descartar los cambios?' : '¿Descartar el torneo?',
        message: 'Lo que escribiste no se va a guardar.',
        confirmLabel: 'Descartar',
        cancelLabel: 'Seguir editando',
        tone: 'danger',
      }))
    )
      return
    onCancel()
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
          .querySelector<HTMLInputElement>(
            `[name="${first}"], [data-field="${first}"] input`,
          )
          ?.focus()
      return
    }
    save.mutate({ input: values, current }, { onSuccess: (id) => onSaved(id) })
  }
  const field = (
    name: TextField,
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
      aria-labelledby="tournament-form-title"
      className="overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm"
    >
      <TournamentFormHeader editing={Boolean(current)} />
      <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-6">
        <div className="lg:col-span-6">
          {field('name', 'Nombre del torneo', {
            maxLength: 120,
            required: true,
            autoComplete: 'off',
            placeholder: 'Por ejemplo, Torneo de la Corvina 2026',
          })}
        </div>
        <div className="lg:col-span-2">
          {field('place', 'Lugar (opcional)', {
            maxLength: 200,
            placeholder: 'Muelle del club',
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-4">
          {field('starts_on', 'Fecha de inicio', {
            type: 'date',
            required: true,
          })}
          {field('start_time', 'Hora de inicio', {
            type: 'time',
            required: true,
          })}
          {field('ends_on', 'Fecha de cierre (opcional)', {
            type: 'date',
            min: values.starts_on || undefined,
          })}
        </div>
        <div className="lg:col-span-6">
          <CategoryPicker
            userId={userId}
            selected={values.categories}
            locked={
              current?.categories
                .filter((category) => category.participants > 0)
                .map((category) => category.id) ?? []
            }
            error={errors.categories}
            onChange={(ids) => change('categories', ids)}
          />
        </div>
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-navy-900/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0 flex-1">
          <Feedback error={save.error} />
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            type="button"
            className={secondaryClass}
            disabled={save.isPending}
            onClick={() => {
              void cancel()
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={primaryClass}
            disabled={save.isPending || (Boolean(current) && !dirty)}
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
            {save.isPending
              ? 'Guardando…'
              : current
                ? 'Guardar cambios'
                : 'Crear torneo'}
          </button>
        </div>
      </div>
    </form>
  )
}
