import { Link, NavLink } from 'react-router'
import {
  ArrowUpRight,
  Camera,
  CalendarDays,
  History,
  LayoutDashboard,
  Newspaper,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
  Waves,
  X,
} from 'lucide-react'
import logo from '@/shared/assets/images/logo-192.webp'
import { sectionPermissions, useAccess } from '../hooks/useAccess'

const links = [
  { path: '/admin', label: 'Resumen', icon: LayoutDashboard },
  {
    path: '/admin/noticias',
    label: 'Noticias',
    icon: Newspaper,
    permission: sectionPermissions.noticias,
  },
  {
    path: '/admin/eventos',
    label: 'Eventos',
    icon: CalendarDays,
    permission: sectionPermissions.eventos,
  },
  {
    path: '/admin/tarifas',
    label: 'Tarifas de pileta',
    icon: Waves,
    permission: sectionPermissions.tarifas,
  },
  {
    path: '/admin/muelle',
    label: 'Parte del muelle',
    icon: Camera,
    permission: sectionPermissions.muelle,
  },
  {
    path: '/admin/torneos',
    label: 'Torneos',
    icon: Trophy,
    permission: sectionPermissions.torneos,
  },
  {
    path: '/admin/usuarios',
    label: 'Usuarios',
    icon: Users,
    permission: sectionPermissions.usuarios,
  },
  {
    path: '/admin/roles',
    label: 'Roles y permisos',
    icon: ShieldCheck,
    permission: sectionPermissions.roles,
  },
  {
    path: '/admin/actividad',
    label: 'Actividad',
    icon: History,
    permission: sectionPermissions.actividad,
  },
  { path: '/admin/cuenta', label: 'Mi cuenta', icon: UserRound },
]

export function AdminNavigation({
  mobile = false,
  onNavigate,
  onDismiss,
}: {
  mobile?: boolean
  onNavigate?: () => void
  onDismiss?: () => void
}) {
  const { can, general } = useAccess()
  return (
    <div className="flex h-full min-h-0 flex-col p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      <div className="mb-6 flex items-center gap-2">
        <Link
          to="/admin"
          onClick={onNavigate}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <img src={logo} alt="" width="48" height="48" className="shrink-0" />
          <span className="text-sm font-extrabold">
            Club de Pescadores
            <span className="block text-xs font-normal text-white/65">
              {general ? 'Panel general' : 'Panel del equipo'}
            </span>
          </span>
        </Link>
        {onDismiss && (
          <button
            type="button"
            aria-label="Cerrar menú de administración"
            onClick={onDismiss}
            className="grid size-11 shrink-0 place-items-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white"
          >
            <X size={22} aria-hidden="true" />
          </button>
        )}
      </div>
      <nav
        aria-label={mobile ? 'Administración móvil' : 'Administración'}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1"
      >
        <ul className="grid gap-1">
          {links
            .filter((link) => !link.permission || can(link.permission))
            .map(({ path, label, icon: Icon }) => (
              <li key={path}>
                <NavLink
                  to={path}
                  end={path === '/admin'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-white/10 text-sun-400' : 'text-white/75 hover:bg-white/5 hover:text-white'}`
                  }
                >
                  <Icon size={18} aria-hidden="true" className="shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>
      <Link
        to="/"
        onClick={onNavigate}
        className="mt-5 flex min-h-11 shrink-0 items-center gap-2 border-t border-white/10 pt-4 text-sm text-white/75 hover:text-white"
      >
        Ver sitio público
        <ArrowUpRight size={16} aria-hidden="true" />
      </Link>
    </div>
  )
}
