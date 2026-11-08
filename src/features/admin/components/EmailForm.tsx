import { useState } from 'react'
import { formText } from '../form-utils'
import { useAuthActions } from '../hooks/useAdminActions'
import { Feedback, Field, inputClass, primaryClass } from './ui'

export function EmailForm({ currentEmail }: { currentEmail: string }) {
  const { email } = useAuthActions()
  const [error, setError] = useState<Error | null>(null)
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const next = formText(form.get('email')).trim()
        if (next.toLowerCase() === currentEmail.toLowerCase()) {
          setError(new Error('Ingresá un correo diferente al actual.'))
          return
        }
        if (
          next.toLowerCase() !==
          formText(form.get('confirmation')).trim().toLowerCase()
        ) {
          setError(new Error('Los correos no coinciden.'))
          return
        }
        setError(null)
        email.mutate(next)
      }}
    >
      <p className="text-sm text-ink-600">
        Correo actual: <strong className="break-all">{currentEmail}</strong>.
        Cambiarlo conserva tu cuenta, contraseña y permisos.
      </p>
      <Field label="Nuevo correo electrónico">
        <input
          name="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          maxLength={254}
          required
        />
      </Field>
      <Field label="Repetí el nuevo correo">
        <input
          name="confirmation"
          type="email"
          autoComplete="off"
          className={inputClass}
          maxLength={254}
          required
        />
      </Field>
      <p className="text-sm text-ink-600">
        Revisá el correo actual y el nuevo y seguí los enlaces de confirmación.
        Hasta completar el cambio, seguí ingresando con el correo actual.
      </p>
      <Feedback
        error={error ?? email.error}
        success={
          email.isSuccess
            ? 'Solicitud enviada. Revisá ambas casillas para confirmar el cambio de correo.'
            : null
        }
      />
      <button
        className={primaryClass}
        disabled={email.isPending || email.isSuccess}
      >
        {email.isPending ? 'Enviando…' : 'Solicitar cambio de correo'}
      </button>
    </form>
  )
}
