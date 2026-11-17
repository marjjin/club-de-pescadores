import { useState } from 'react'
import type { FormEvent } from 'react'
import { UserPlus, UserRound, X } from 'lucide-react'
import { participantInputSchema } from '../../schemas/tournaments'
import type { Angler, TournamentCategory } from '../../schemas/tournaments'
import type { useParticipantActions } from '../../hooks/useAdminTournaments'
import { Feedback, inputClass, primaryClass, secondaryClass } from '../ui'
import { PersonPicker } from './PersonPicker'
import { personLabel } from './person-label'

type Add = ReturnType<typeof useParticipantActions>['add']

export function AddParticipantForm({
  userId,
  add,
  categories,
  category: initialCategory,
  onClose,
}: {
  userId: string
  add: Add
  categories: TournamentCategory[]
  /** The table being viewed, preselected. */
  category: string | null
  onClose: () => void
}) {
  const [person, setPerson] = useState<Angler | null>(null)
  const [category, setCategory] = useState(
    initialCategory ?? categories[0]?.id ?? '',
  )
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState<string | null>(null)
  const categoryName = (id: string) =>
    categories.find((entry) => entry.id === id)?.name ?? ''
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (add.isPending || !person) return
    const parsed = participantInputSchema.safeParse({
      category,
      angler: person.id,
    })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.')
      return
    }
    add.mutate(parsed.data, {
      onSuccess: () => {
        setAdded(`${personLabel(person)} en ${categoryName(category)}`)
        setPerson(null)
      },
    })
  }
  return (
    <section
      aria-label="Registrar participante"
      className="grid gap-4 border-b border-navy-900/10 bg-mist-50/60 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-extrabold">
          <UserPlus size={16} aria-hidden="true" />
          Registrar participante
        </h3>
        {/* Stays open after each sign-up, to register several people in a row. */}
        <button
          type="button"
          aria-label="Cerrar registro de participante"
          onClick={onClose}
          className="grid size-11 shrink-0 place-items-center rounded-lg text-ink-600 hover:bg-white hover:text-navy-900"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {added && !person && <Feedback success={`Registraste a ${added}.`} />}
      {!person ? (
        <PersonPicker
          userId={userId}
          label="Buscá a la persona"
          onSelect={(angler) => {
            setPerson(angler)
            setAdded(null)
            setError(null)
            add.reset()
          }}
        />
      ) : (
        <form noValidate onSubmit={submit} className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-navy-900/10 bg-white px-3 py-2">
            <UserRound size={18} aria-hidden="true" className="text-ink-600" />
            <p className="min-w-0 flex-1">
              <span className="font-bold wrap-anywhere">
                {personLabel(person)}
              </span>
              <span className="ml-2 text-xs text-ink-600 tabular-nums">
                DNI {person.dni_masked}
              </span>
            </p>
            <button
              type="button"
              className={secondaryClass}
              onClick={() => setPerson(null)}
            >
              Cambiar persona
            </button>
          </div>
          {categories.length > 1 ? (
            <label className="grid gap-1.5 text-sm font-bold">
              Categoría
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value)
                  setError(null)
                }}
                className={inputClass}
              >
                {categories.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-sm text-ink-600">
              Categoría: <strong>{categoryName(category)}</strong>
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Feedback error={add.error} />
          <button
            type="submit"
            className={`${primaryClass} justify-self-start`}
            disabled={add.isPending}
          >
            <UserPlus size={17} aria-hidden="true" />
            {add.isPending ? 'Registrando…' : 'Registrar en el torneo'}
          </button>
        </form>
      )}
    </section>
  )
}
