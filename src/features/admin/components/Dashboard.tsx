import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  CalendarDays,
  FilePen,
  History,
  Newspaper,
  ShieldCheck,
  Users,
  Waves,
} from 'lucide-react'
import { Link } from 'react-router'
import { useDashboard } from '../hooks/useAdminData'
import { useAccess } from '../hooks/useAccess'
import { DashboardContentLinks } from './DashboardContentLinks'
import { Feedback, SectionHeading } from './ui'

type Stat = {
  label: string
  value: number | null
  icon: LucideIcon
  /** Short context under the number; `warn` highlights something to look at. */
  hint: string
  warn?: boolean
  href?: string
}

const heading =
  'mb-3 text-xs font-extrabold tracking-[0.14em] text-ink-600 uppercase'
const grid =
  'grid grid-cols-[repeat(auto-fit,minmax(min(100%,13rem),1fr))] gap-3'

export function Dashboard({ userId }: { userId: string }) {
  const query = useDashboard(userId)
  const { can } = useAccess()
  const data = query.data
  const stats: Stat[] = data
    ? [
        {
          label: 'Noticias publicadas o programadas',
          value: data.news,
          icon: Newspaper,
          hint: data.news
            ? 'Visibles en el sitio.'
            : 'El sitio no muestra noticias.',
          warn: data.news === 0,
          href: '/admin/noticias',
        },
        {
          label: 'Próximos eventos publicados',
          value: data.events,
          icon: CalendarDays,
          hint: data.events
            ? 'En la agenda del sitio.'
            : 'La agenda del sitio está vacía.',
          warn: data.events === 0,
          href: '/admin/eventos',
        },
        {
          label: 'Tarifas publicadas sin vencer',
          value: data.rates,
          icon: Waves,
          hint: data.rates
            ? 'Precios de pileta vigentes.'
            : 'El sitio no muestra precios de pileta.',
          warn: data.rates === 0,
          href: '/admin/tarifas',
        },
        {
          label: 'Borradores de contenido',
          value: data.drafts,
          icon: FilePen,
          hint: data.drafts
            ? 'Sin publicar: noticias, eventos o tarifas.'
            : 'Nada pendiente de publicar.',
        },
        {
          label: 'Usuarios activos',
          value: data.users,
          icon: Users,
          hint: 'Personas del equipo con acceso.',
          href: '/admin/usuarios',
        },
      ]
        // null means the module is outside this person's permissions.
        .filter((stat) => stat.value !== null)
    : []
  const team = [
    can('roles.gestionar') && {
      label: 'Roles y permisos',
      hint: 'Asigná a cada persona solo lo que necesita.',
      href: '/admin/roles',
      icon: ShieldCheck,
    },
    can('auditoria.ver') && {
      label: 'Actividad del equipo',
      hint: 'Quién hizo cada cambio y cuándo.',
      href: '/admin/actividad',
      icon: History,
    },
  ].filter((entry) => entry !== false)
  return (
    <>
      <SectionHeading
        title="Resumen del club"
        description="Las tareas del día y el estado del contenido del sitio."
      />
      <DashboardContentLinks />
      <section aria-labelledby="dashboard-status" aria-busy={query.isPending}>
        <h2 id="dashboard-status" className={heading}>
          Estado del sitio
        </h2>
        <Feedback error={query.error} />
        {query.isPending ? (
          <div
            role="status"
            aria-label="Cargando el resumen"
            className={`${grid} motion-safe:animate-pulse`}
          >
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-32 rounded-xl bg-navy-900/5" />
            ))}
          </div>
        ) : (
          stats.length > 0 && (
            <ul className={grid}>
              {stats.map((stat) => (
                // Three shared rows (label, number, hint): numbers line up across tiles.
                <li
                  key={stat.label}
                  className="row-span-3 grid min-w-0 grid-rows-subgrid gap-0"
                >
                  <StatTile stat={stat} />
                </li>
              ))}
            </ul>
          )
        )}
      </section>
      {team.length > 0 && (
        <section aria-labelledby="dashboard-team" className="mt-8">
          <h2 id="dashboard-team" className={heading}>
            Equipo y seguridad
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {team.map(({ label, hint, href, icon: Icon }) => (
              <li key={href}>
                <Link
                  to={href}
                  className="group flex items-center gap-3 rounded-xl border border-navy-900/10 bg-white p-4 hover:border-river-600/40 hover:bg-mist-50/60 focus-visible:outline-offset-4"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-lg bg-mist-50 text-river-600"
                  >
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-extrabold">{label}</span>
                    <span className="block text-sm text-ink-600">{hint}</span>
                  </span>
                  <ArrowRight
                    size={16}
                    aria-hidden="true"
                    className="shrink-0 text-ink-600 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

function StatTile({ stat }: { stat: Stat }) {
  const { label, value, icon: Icon, hint, warn, href } = stat
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="text-sm font-bold text-ink-600">{label}</span>
        <span
          aria-hidden="true"
          className={`grid size-9 shrink-0 place-items-center rounded-lg ${warn ? 'bg-amber-50 text-amber-800' : 'bg-mist-50 text-river-600'}`}
        >
          <Icon size={18} />
        </span>
      </span>
      <span className="mt-2 block self-end text-4xl font-extrabold text-navy-900 tabular-nums">
        {value}
      </span>
      <span
        className={`mt-1 flex items-start gap-1 text-xs ${warn ? 'font-bold text-amber-900' : 'text-ink-600'}`}
      >
        {hint}
        {href && (
          <ArrowRight
            size={13}
            aria-hidden="true"
            className="ml-auto shrink-0 text-river-600 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        )}
      </span>
    </>
  )
  const tile = `group row-span-3 grid grid-rows-subgrid gap-0 rounded-xl border bg-white p-4 ${warn ? 'border-amber-300' : 'border-navy-900/10'}`
  return href ? (
    <Link
      to={href}
      className={`${tile} hover:border-river-600/40 hover:bg-mist-50/60 focus-visible:outline-offset-4`}
    >
      {body}
    </Link>
  ) : (
    <div className={tile}>{body}</div>
  )
}
