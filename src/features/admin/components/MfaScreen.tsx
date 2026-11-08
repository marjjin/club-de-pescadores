import { useState } from 'react'
import { formText } from '../form-utils'
import { useAuthActions } from '../hooks/useAdminActions'
import { AccessFrame } from './AccessFrame'
import { Feedback, Field, inputClass, primaryClass, secondaryClass } from './ui'

export function MfaScreen({ factorId }: { factorId: string | null }) {
  const actions = useAuthActions()
  const [enrollment, setEnrollment] = useState<{
    id: string
    qr: string
    secret: string
  } | null>(null)
  const currentId = factorId ?? enrollment?.id
  return (
    <AccessFrame>
      <h2 className="text-2xl font-extrabold">Verificación en dos pasos</h2>
      <p className="mt-2 mb-6 text-sm text-ink-600">
        {factorId
          ? 'Ingresá el código de tu aplicación autenticadora.'
          : 'Vinculá una aplicación autenticadora para proteger tu cuenta.'}
      </p>
      {!currentId && (
        <button
          className={primaryClass}
          disabled={actions.enroll.isPending}
          onClick={() =>
            actions.enroll.mutate(undefined, {
              onSuccess: setEnrollment,
            })
          }
        >
          Configurar autenticador
        </button>
      )}
      {enrollment && (
        <div className="mb-6 grid justify-items-center gap-3">
          <img
            src={
              enrollment.qr.startsWith('data:')
                ? enrollment.qr
                : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(enrollment.qr)}`
            }
            alt="Código QR para configurar tu autenticador"
            width="200"
            height="200"
          />
          <details className="w-full text-sm">
            <summary className="cursor-pointer font-bold">
              Ingresar clave manualmente
            </summary>
            <code className="mt-2 block break-all rounded bg-mist-50 p-3">
              {enrollment.secret}
            </code>
          </details>
        </div>
      )}
      {currentId && (
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            const code = formText(new FormData(event.currentTarget).get('code'))
            actions.verify.mutate({ id: currentId, code })
          }}
        >
          <Field label="Código de seis dígitos">
            <input
              name="code"
              className={inputClass}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          </Field>
          <button className={primaryClass} disabled={actions.verify.isPending}>
            Verificar e ingresar
          </button>
        </form>
      )}
      <div className="mt-4">
        <Feedback
          error={
            actions.enroll.error ?? actions.verify.error ?? actions.logout.error
          }
        />
      </div>
      <button
        className={`${secondaryClass} mt-5 w-full`}
        disabled={actions.logout.isPending}
        onClick={() => actions.logout.mutate(false)}
      >
        Cerrar sesión
      </button>
    </AccessFrame>
  )
}
