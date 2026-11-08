import { useAuthActions } from '../hooks/useAdminActions'
import { PasswordForm } from './PasswordForm'
import { EmailForm } from './EmailForm'
import { Feedback, Panel, secondaryClass, SectionHeading } from './ui'

export function AccountSection({ email }: { email: string }) {
  const { logout } = useAuthActions()
  return (
    <>
      <SectionHeading title="Mi cuenta" description={email} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <h2 className="mb-5 text-lg font-bold">Cambiar correo de acceso</h2>
          <EmailForm key={email} currentEmail={email} />
        </Panel>
        <Panel>
          <h2 className="mb-5 text-lg font-bold">Cambiar contraseña</h2>
          <PasswordForm />
        </Panel>
        <Panel>
          <h2 className="text-lg font-bold">Seguridad de la sesión</h2>
          <p className="mt-3 text-sm text-ink-600">
            Tu sesión está verificada con segundo factor. Conservá el acceso a
            tu aplicación autenticadora. Si perdés el dispositivo, contactá al
            responsable del proyecto para recuperar la cuenta.
          </p>
          <button
            className={`${secondaryClass} mt-5`}
            disabled={logout.isPending}
            onClick={() => {
              if (
                window.confirm(
                  '¿Cerrar tus sesiones en los demás dispositivos?',
                )
              )
                logout.mutate(true)
            }}
          >
            Cerrar otras sesiones
          </button>
          <div className="mt-4">
            <Feedback
              error={logout.error}
              success={
                logout.isSuccess
                  ? 'Se solicitó el cierre de las otras sesiones. Sus tokens de acceso vencen según la configuración de Supabase.'
                  : null
              }
            />
          </div>
        </Panel>
      </div>
    </>
  )
}
