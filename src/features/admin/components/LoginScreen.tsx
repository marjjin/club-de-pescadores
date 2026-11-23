import { useState } from 'react'
import { Link } from 'react-router'
import { formText } from '../form-utils'
import { useAuthActions } from '../hooks/useAdminActions'
import { useCaptcha } from '../hooks/useCaptcha'
import { AccessFrame } from './AccessFrame'
import { Feedback, Field, inputClass, primaryClass } from './ui'

export function LoginScreen() {
  const actions = useAuthActions()
  // Destructured: `container` is a callback ref, the rest is plain render state.
  const {
    required: captchaRequired,
    container: captchaContainer,
    token: captchaToken,
    failed: captchaFailed,
    reset: resetCaptcha,
  } = useCaptcha()
  const [recovering, setRecovering] = useState(false)
  const operation = recovering ? actions.recover : actions.login
  const waitingCaptcha = captchaRequired && !captchaToken
  // Every attempt spends the token, whether Auth accepted it or not.
  const settled = { onSettled: resetCaptcha }
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
          if (waitingCaptcha) return
          const form = new FormData(event.currentTarget)
          const email = formText(form.get('email'))

          if (recovering)
            actions.recover.mutate({ email, captchaToken }, settled)
          else
            actions.login.mutate(
              {
                email,
                password: formText(form.get('password')),
                captchaToken,
              },
              settled,
            )
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
        {captchaRequired && (
          // Fixed height so the form does not jump when the check appears.
          <div className="grid gap-2">
            <div ref={captchaContainer} className="min-h-[65px]" />
            {captchaFailed && (
              <p role="alert" className="text-sm text-red-700">
                No se pudo completar la verificación de seguridad. Recargá la
                página; si sigue fallando, probá con otra conexión o navegador.
              </p>
            )}
          </div>
        )}
        <Feedback
          error={operation.error}
          success={
            recovering && actions.recover.isSuccess
              ? 'Si el correo corresponde a una cuenta, recibirás las instrucciones para continuar.'
              : null
          }
        />
        <button
          className={primaryClass}
          disabled={operation.isPending || waitingCaptcha}
        >
          {operation.isPending
            ? 'Procesando…'
            : waitingCaptcha
              ? 'Verificando la conexión…'
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
