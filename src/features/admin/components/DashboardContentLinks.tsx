import {
  ArrowRight,
  CalendarDays,
  Camera,
  Newspaper,
  Trophy,
} from 'lucide-react'
import { Link } from 'react-router'
import { useAccess } from '../hooks/useAccess'

const shortcuts = [
  {
    label: 'Cargar parte del muelle',
    hint: 'Altura del río, estado del muelle y fotos o videos del día.',
    href: '/admin/muelle',
    icon: Camera,
    primary: true,
    permission: 'muelle.publicar',
  },
  {
    label: 'Escribir una noticia',
    hint: 'Novedades, capturas y anuncios con foto de portada.',
    href: '/admin/noticias/nueva',
    icon: Newspaper,
    primary: false,
    permission: 'noticias.editar',
  },
  {
    label: 'Agenda de eventos',
    hint: 'Cargá o corregí las actividades del club.',
    href: '/admin/eventos',
    icon: CalendarDays,
    primary: false,
    permission: 'eventos.editar',
  },
  {
    label: 'Torneos',
    hint: 'Participantes, puntos y tablas anuales.',
    href: '/admin/torneos',
    icon: Trophy,
    primary: false,
    permission: 'torneos.ver',
  },
]

/** The day-to-day tasks first, each one a single tap away. */
export function DashboardContentLinks() {
  const { can } = useAccess()
  const visible = shortcuts.filter((shortcut) => can(shortcut.permission))
  if (!visible.length) return null
  return (
    <section aria-labelledby="dashboard-shortcuts" className="mb-8">
      <h2
        id="dashboard-shortcuts"
        className="mb-3 text-xs font-extrabold tracking-[0.14em] text-ink-600 uppercase"
      >
        Accesos rápidos
      </h2>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,15rem),1fr))] gap-3">
        {visible.map(({ label, hint, href, icon: Icon, primary }) => (
          <li key={href} className="min-w-0">
            <Link
              to={href}
              aria-label={label}
              aria-describedby={`shortcut-${href}`}
              className={`group flex h-full min-w-0 items-start gap-3 rounded-xl border p-4 transition-colors focus-visible:outline-offset-4 ${primary ? 'border-navy-900 bg-navy-900 text-white hover:bg-navy-800' : 'border-navy-900/10 bg-white hover:border-river-600/40 hover:bg-mist-50/60'}`}
            >
              <span
                aria-hidden="true"
                className={`grid size-10 shrink-0 place-items-center rounded-lg ${primary ? 'bg-white/10 text-sun-400' : 'bg-mist-50 text-river-600'}`}
              >
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-extrabold">
                  {label}
                  <ArrowRight
                    size={15}
                    aria-hidden="true"
                    className="shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
                <span
                  id={`shortcut-${href}`}
                  className={`mt-0.5 block text-sm leading-5 ${primary ? 'text-white/75' : 'text-ink-600'}`}
                >
                  {hint}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
