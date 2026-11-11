import { NavLink, Route, Routes } from 'react-router'
import { LogOut } from 'lucide-react'
import logo from '@/shared/assets/images/logo-192.webp'
import { useAuthActions } from '../../hooks/useAdminActions'
import { AccountSection } from '../AccountSection'
import { Feedback } from '../ui'
import { PierSection } from './PierSection'

const tab = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-bold ${isActive ? 'bg-mist-50 text-navy-900' : 'text-ink-600 hover:bg-mist-50'}`

/** Reduced panel for staff with only the pier permission: no other sections exist here. */
export function PierWorkspace({
  userId,
  email,
}: {
  userId: string
  email: string
}) {
  const { logout } = useAuthActions()
  return (
    <div className="min-h-dvh bg-mist-50">
      <header className="sticky top-0 z-20 border-b border-navy-900/10 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <img src={logo} alt="" width="40" height="40" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-wider text-ink-600 uppercase sm:text-xs">
              Personal del muelle
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold sm:text-sm">
              {email}
            </p>
          </div>
          <button
            onClick={() => logout.mutate(false)}
            disabled={logout.isPending}
            type="button"
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-bold text-ink-600 hover:bg-mist-50"
          >
            <LogOut size={17} aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Cerrar sesión</span>
          </button>
        </div>
        <nav
          aria-label="Secciones"
          className="mx-auto flex max-w-5xl gap-1 px-4 pb-2 sm:px-6"
        >
          <NavLink to="/admin" end className={tab}>
            Parte del muelle
          </NavLink>
          <NavLink to="/admin/cuenta" className={tab}>
            Mi cuenta
          </NavLink>
        </nav>
      </header>
      <main
        id="admin-content"
        tabIndex={-1}
        className="mx-auto w-full min-w-0 max-w-5xl p-4 sm:p-6"
      >
        <Feedback error={logout.error} />
        <Routes>
          <Route path="cuenta" element={<AccountSection email={email} />} />
          <Route path="*" element={<PierSection userId={userId} />} />
        </Routes>
      </main>
    </div>
  )
}
