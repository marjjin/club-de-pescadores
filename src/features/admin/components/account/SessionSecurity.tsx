import {
  CheckCircle2,
  Laptop,
  LoaderCircle,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { useAuthActions } from '../../hooks/useAdminActions'
import { useConfirm } from '../../hooks/useConfirm'
import { Feedback, secondaryClass } from '../ui'

export function SessionSecurity() {
  const { logout } = useAuthActions()
  const confirm = useConfirm()
  async function closeOthers() {
    if (logout.isPending) return
    if (
      await confirm({
        title: '¿Cerrar tus otras sesiones?',
        message:
          'Se cerrarán las sesiones en los demás dispositivos. Esta sesión seguirá abierta.',
        confirmLabel: 'Cerrar otras sesiones',
      })
    )
      logout.mutate(true)
  }
  return (
    <section
      id="account-sessions"
      aria-labelledby="account-sessions-title"
      aria-busy={logout.isPending}
      className="min-w-0 scroll-mt-6 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2
        id="account-sessions-title"
        className="flex items-center gap-2 text-base font-extrabold"
      >
        <ShieldCheck size={19} aria-hidden="true" />
        Seguridad de la sesión
      </h2>
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <CheckCircle2
          size={19}
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-emerald-800"
        />
        <div>
          <p className="text-sm font-extrabold text-emerald-900">
            Segundo factor verificado
          </p>
          <p className="mt-1 text-xs leading-5 text-emerald-900">
            Tu sesión actual completó la verificación de acceso al panel.
          </p>
        </div>
      </div>
      <div className="mt-5 border-t border-navy-900/10 pt-5">
        <h3 className="flex items-center gap-2 text-sm font-bold">
          <Laptop size={17} aria-hidden="true" />
          Otros dispositivos
        </h3>
        <p className="mt-2 text-xs leading-5 text-ink-600">
          Cerrá tus otras sesiones sin salir de este navegador. Los accesos
          anteriores pueden seguir vigentes por un tiempo.
        </p>
        <button
          type="button"
          disabled={logout.isPending}
          onClick={() => void closeOthers()}
          className={`${secondaryClass} mt-4 w-full`}
        >
          {logout.isPending ? (
            <LoaderCircle
              size={16}
              aria-hidden="true"
              className="motion-safe:animate-spin"
            />
          ) : (
            <LogOut size={16} aria-hidden="true" />
          )}
          {logout.isPending
            ? 'Cerrando otras sesiones…'
            : 'Cerrar otras sesiones'}
        </button>
      </div>
      <div className="mt-4">
        <Feedback
          error={logout.error}
          success={
            logout.isSuccess
              ? 'Se solicitó cerrar las otras sesiones. Esta sesión sigue abierta; el cierre en los otros dispositivos puede demorar.'
              : null
          }
        />
      </div>
      <details className="mt-5 border-t border-navy-900/10 pt-4">
        <summary className="min-h-9 cursor-pointer text-xs font-bold text-ink-600">
          ¿Perdiste el acceso al autenticador?
        </summary>
        <p className="mt-2 text-xs leading-5 text-ink-600">
          Contactá al responsable del proyecto para recuperar la cuenta.
          Conservá el acceso a tu aplicación autenticadora.
        </p>
      </details>
    </section>
  )
}
