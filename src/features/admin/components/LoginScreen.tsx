import { useState } from 'react'
import { Link } from 'react-router'
import { formText } from '../form-utils'
import { useAuthActions } from '../hooks/useAdminActions'
import { AccessFrame } from './AccessFrame'
import { Feedback, Field, inputClass, primaryClass } from './ui'

export function LoginScreen() {
  const actions = useAuthActions()
  const [recovering, setRecovering] = useState(false)
  const operation = recovering ? actions.recover : actions.login
  return (
    <AccessFrame>
      <h2 className="text-2xl font-extrabold">
        {recovering ? 'Recuperar contraseña' : 'Ingresá al panel'}
      </h2>
      <p className="mt-2 mb-6 text-sm text-ink-600">
        {recovering
          ? 'Te enviaremos las instrucciones a tu correo.'
          : 'Usá la cuenta que recibió la invitación del administrador.'}
      </p>
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.currentTarget)
          const email = formText(form.get('email'))
          if (recovering) actions.recover.mutate(email)
          else
            actions.login.mutate({
              email,
              password: formText(form.get('password')),
            })
        }}
      >
        <Field label="Correo electrónico">
          <input
            className={inputClass}
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
          />
        </Field>
        {!recovering && (
          <Field label="Contraseña">
            <input
              className={inputClass}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </Field>
        )}
        <Feedback
          error={operation.error}
          success={
            recovering && actions.recover.isSuccess
              ? 'Si el correo corresponde a una cuenta, recibirás las instrucciones para continuar.'
              : null
          }
        />
        <button className={primaryClass} disabled={operation.isPending}>
          {operation.isPending
            ? 'Procesando…'
            : recovering
              ? 'Enviar instrucciones'
              : 'Ingresar'}
        </button>
        <button
          type="button"
          className="text-sm font-bold text-river-600"
          onClick={() => {
            setRecovering(!recovering)
            actions.login.reset()
            actions.recover.reset()
          }}
        >
          {recovering ? 'Volver al ingreso' : 'Olvidé mi contraseña'}
        </button>
      </form>
      <Link to="/" className="mt-8 block text-center text-sm text-ink-600">
        Volver al sitio del club
      </Link>
    </AccessFrame>
  )
}
