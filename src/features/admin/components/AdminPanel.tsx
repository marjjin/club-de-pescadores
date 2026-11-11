import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAdminSession } from '../hooks/useAdminSession'
import { useAuthActions } from '../hooks/useAdminActions'
import { AccessFrame } from './AccessFrame'
import { LoginScreen } from './LoginScreen'
import { MfaScreen } from './MfaScreen'
import { PasswordForm } from './PasswordForm'
import { AdminWorkspace } from './AdminWorkspace'
import { ConfirmProvider } from './ConfirmProvider'
import { PierWorkspace } from './pier/PierWorkspace'
import { AdminShellSkeleton } from '@/shared/ui/AdminShellSkeleton'
import { Feedback, secondaryClass } from './ui'

// Every panel screen shares one club-styled confirmation dialog.
export function AdminPanel() {
  return (
    <ConfirmProvider>
      <AdminPanelContent />
    </ConfirmProvider>
  )
}

function AdminPanelContent() {
  const session = useAdminSession()
  const { logout } = useAuthActions()
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Administración · Club de Pescadores'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.append(robots)
    return () => {
      robots.remove()
      document.title = previousTitle
    }
  }, [])
  if (session.isPending) return <AdminShellSkeleton />
  if (session.isError)
    return (
      <AccessFrame>
        <h2 className="mb-4 text-xl font-bold">No pudimos abrir el panel</h2>
        <Feedback error={session.error} />
        <button
          className={`${secondaryClass} mt-4`}
          onClick={() => {
            void session.refetch()
          }}
        >
          Reintentar
        </button>
        <button
          className={`${secondaryClass} mt-4 ml-2`}
          onClick={() => logout.mutate(false)}
        >
          Cerrar sesión
        </button>
      </AccessFrame>
    )
  if (!session.data) return <LoginScreen />
  if (!session.data.active)
    return (
      <AccessFrame>
        <h2 className="text-xl font-bold">Acceso no habilitado</h2>
        <p className="mt-3 text-sm text-ink-600">
          Tu cuenta no tiene acceso activo. Consultá al administrador del club.
        </p>
        <button
          className={`${secondaryClass} mt-5`}
          onClick={() => logout.mutate(false)}
        >
          Cerrar sesión
        </button>
        <Feedback error={logout.error} />
      </AccessFrame>
    )
  if (!session.data.aal2 && session.data.factorId)
    return <MfaScreen factorId={session.data.factorId} />
  if (location.pathname === '/admin/establecer-clave')
    return (
      <AccessFrame>
        <h2 className="mb-6 text-xl font-bold">Establecé tu contraseña</h2>
        <PasswordForm
          onSaved={() => {
            void navigate('/admin', { replace: true })
          }}
        />
      </AccessFrame>
    )
  if (!session.data.aal2) return <MfaScreen factorId={session.data.factorId} />
  if (!session.data.general && session.data.pier)
    return (
      <PierWorkspace
        key={session.data.id}
        userId={session.data.id}
        email={session.data.email}
      />
    )
  if (!session.data.general)
    return (
      <AccessFrame>
        <h2 className="text-xl font-bold">Cuenta configurada</h2>
        <p className="mt-3 text-sm text-ink-600">
          Este panel corresponde al administrador general. El panel de tu perfil
          todavía no está habilitado.
        </p>
        <button
          className={`${secondaryClass} mt-5`}
          onClick={() => logout.mutate(false)}
        >
          Cerrar sesión
        </button>
        <Feedback error={logout.error} />
      </AccessFrame>
    )
  return (
    <AdminWorkspace
      key={session.data.id}
      userId={session.data.id}
      email={session.data.email}
    />
  )
}
