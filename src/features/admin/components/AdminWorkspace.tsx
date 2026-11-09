import { NavLink, Link, Route, Routes } from 'react-router'
import {
  LayoutDashboard,
  Newspaper,
  CalendarDays,
  Waves,
  Users,
  ShieldCheck,
  History,
  UserRound,
  LogOut,
  ArrowUpRight,
  Ruler,
} from 'lucide-react'
import logo from '@/shared/assets/images/logo-192.webp'
import { useAuthActions } from '../hooks/useAdminActions'
import { Dashboard } from './Dashboard'
import { ContentSection } from './ContentSection'
import { RolesSection } from './RolesSection'
import { UsersSection } from './UsersSection'
import { AuditSection } from './AuditSection'
import { AccountSection } from './AccountSection'
import { RiverSection } from './river/RiverSection'
import { NewNewsRoute } from './news-editor/NewNewsRoute'
import { Feedback, SectionHeading } from './ui'

const links = [
  { path: '/admin', label: 'Resumen', icon: LayoutDashboard },
  { path: '/admin/noticias', label: 'Noticias', icon: Newspaper },
  { path: '/admin/eventos', label: 'Eventos', icon: CalendarDays },
  { path: '/admin/tarifas', label: 'Tarifas de pileta', icon: Waves },
  { path: '/admin/rio', label: 'Altura del río', icon: Ruler },
  { path: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { path: '/admin/roles', label: 'Roles y permisos', icon: ShieldCheck },
  { path: '/admin/actividad', label: 'Actividad', icon: History },
  { path: '/admin/cuenta', label: 'Mi cuenta', icon: UserRound },
]
export function AdminWorkspace({
  userId,
  email,
}: {
  userId: string
  email: string
}) {
  const { logout } = useAuthActions()
  return (
    <div className="min-h-dvh bg-mist-50 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#admin-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-sun-400 focus:p-3"
      >
        Saltar al contenido
      </a>
      <aside className="flex flex-col bg-navy-950 p-5 text-white lg:sticky lg:top-0 lg:h-dvh">
        <Link to="/admin" className="mb-7 flex items-center gap-3">
          <img src={logo} alt="" width="48" height="48" />
          <span className="text-sm font-extrabold">
            Club de Pescadores
            <span className="block text-xs font-normal text-white/65">
              Panel general
            </span>
          </span>
        </Link>
        <nav
          aria-label="Administración"
          className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1"
        >
          {links.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/admin'}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-white/10 text-sun-400' : 'text-white/75 hover:bg-white/5 hover:text-white'}`
              }
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/"
          className="mt-6 flex items-center gap-2 border-t border-white/10 pt-5 text-sm text-white/75 lg:mt-auto"
        >
          Ver sitio público <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </aside>
      <div className="min-w-0">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-900/10 bg-white px-6 py-4 lg:px-9">
          <div>
            <p className="text-xs font-bold tracking-wider text-ink-600 uppercase">
              Administrador general
            </p>
            <p className="mt-1 max-w-64 truncate text-sm font-semibold">
              {email}
            </p>
          </div>
          <button
            onClick={() => logout.mutate(false)}
            disabled={logout.isPending}
            className="flex min-h-11 items-center gap-2 text-sm font-bold text-ink-600"
          >
            <LogOut size={17} aria-hidden="true" />
            Cerrar sesión
          </button>
        </header>
        <main
          id="admin-content"
          tabIndex={-1}
          className="mx-auto w-full min-w-0 max-w-7xl p-5 sm:p-7 lg:p-9"
        >
          <Feedback error={logout.error} />
          <Routes>
            <Route index element={<Dashboard userId={userId} />} />
            <Route path="noticias/nueva" element={<NewNewsRoute />} />
            <Route
              path="noticias"
              element={
                <ContentSection key="news" kind="news" userId={userId} />
              }
            />
            <Route
              path="eventos"
              element={
                <ContentSection key="events" kind="events" userId={userId} />
              }
            />
            <Route
              path="tarifas"
              element={
                <ContentSection key="rates" kind="pool_rates" userId={userId} />
              }
            />
            <Route path="usuarios" element={<UsersSection userId={userId} />} />
            <Route path="rio" element={<RiverSection userId={userId} />} />
            <Route path="roles" element={<RolesSection userId={userId} />} />
            <Route
              path="actividad"
              element={<AuditSection userId={userId} />}
            />
            <Route path="cuenta" element={<AccountSection email={email} />} />
            <Route
              path="*"
              element={
                <>
                  <SectionHeading
                    title="Sección no encontrada"
                    description="La dirección no corresponde a una sección del panel."
                  />
                  <Link to="/admin" className="font-bold text-river-600">
                    Volver al resumen
                  </Link>
                </>
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  )
}
