import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import { participantInputSchema } from '../../schemas/tournaments'
import type { useParticipantActions } from '../../hooks/useAdminTournaments'
import { Feedback, inputClass, primaryClass } from '../ui'

type Add = ReturnType<typeof useParticipantActions>['add']

export function AddParticipantForm({ add }: { add: Add }) {
  const id = useId()
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState<string | null>(null)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (add.isPending) return
    const parsed = participantInputSchema.safeParse({ name, consent })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Revisá los datos.')
      return
    }
    const form = event.currentTarget
    add.mutate(parsed.data, {
      onSuccess: () => {
        setAdded(parsed.data.name)
        setName('')
        setConsent(false)
        // Ready for the next person in line.
        form.querySelector<HTMLInputElement>('input[name="name"]')?.focus()
      },
    })
  }
  return (
    <form
      noValidate
      onSubmit={submit}
      aria-label="Registrar participante"
      className="grid gap-3 border-b border-navy-900/10 p-5"
    >
      <label htmlFor={`${id}-name`} className="text-sm font-bold">
        Registrar participante
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={`${id}-name`}
          name="name"
          value={name}
          maxLength={80}
          autoComplete="off"
          placeholder="Nombre que se mostrará en la tabla"
          aria-describedby={`${id}-hint`}
          onChange={(event) => {
            setName(event.target.value)
            setError(null)
            setAdded(null)
          }}
          className={`${inputClass} min-w-48 flex-1`}
        />
        <button type="submit" className={primaryClass} disabled={add.isPending}>
          <UserPlus size={17} aria-hidden="true" />
          {add.isPending ? 'Registrando…' : 'Registrar'}
        </button>
      </div>
      <p id={`${id}-hint`} className="text-xs text-ink-600">
        Usá solo el nombre que la persona quiera mostrar (por ejemplo, «Juan
        P.»). No cargues DNI ni datos de contacto.
      </p>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => {
            setConsent(event.target.checked)
            setError(null)
          }}
          className="mt-0.5 size-4 shrink-0"
        />
        <span>
          La persona aceptó que su nombre y su puntaje aparezcan en la tabla
          pública del sitio.
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <Feedback
        error={add.error}
        success={added ? `Registraste a ${added}.` : null}
      />
    </form>
  )
}
