import { useState } from 'react'
import { formText } from '../form-utils'
import { useAuthActions } from '../hooks/useAdminActions'
import { Feedback, Field, inputClass, primaryClass } from './ui'

export function PasswordForm({ onSaved }: { onSaved?: () => void }) {
  const { password } = useAuthActions()
  const [error, setError] = useState<Error | null>(null)
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        const value = formText(form.get('password'))
        if (value !== form.get('confirm')) {
          setError(new Error('Las contraseñas no coinciden.'))
          return
        }
        setError(null)
        password.mutate(value, {
          onSuccess: () => {
            onSaved?.()
          },
        })
      }}
    >
      <Field
        label="Nueva contraseña"
        hint="Usá entre 12 y 128 caracteres, sin reutilizar contraseñas de otros sitios."
      >
        <input
          name="password"
          type="password"
          className={inputClass}
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </Field>
      <Field label="Repetí la contraseña">
        <input
          name="confirm"
          type="password"
          className={inputClass}
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </Field>
      <Feedback
        error={error ?? password.error}
        success={password.isSuccess ? 'Contraseña actualizada.' : null}
      />
      <button className={primaryClass} disabled={password.isPending}>
        {password.isPending ? 'Guardando…' : 'Guardar contraseña'}
      </button>
    </form>
  )
}
