import { Link } from 'react-router'
import { useDashboard } from '../hooks/useAdminData'
import { Feedback, Loading, Panel, SectionHeading } from './ui'
import { DashboardContentLinks } from './DashboardContentLinks'

export function Dashboard({ userId }: { userId: string }) {
  const query = useDashboard(userId)
  return (
    <>
      <SectionHeading
        title="Resumen del club"
        description="Contenido y accesos del equipo, en un solo lugar."
      />
      <DashboardContentLinks />
      <Feedback error={query.error} />
      {query.isPending ? (
        <Loading />
      ) : (
        query.data && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              [
                'Noticias publicadas o programadas',
                query.data.news,
                '/admin/noticias',
              ],
              [
                'Próximos eventos publicados',
                query.data.events,
                '/admin/eventos',
              ],
              [
                'Tarifas publicadas sin vencer',
                query.data.rates,
                '/admin/tarifas',
              ],
              ['Borradores de contenido', query.data.drafts, '/admin/noticias'],
              ['Usuarios activos', query.data.users, '/admin/usuarios'],
            ].map(([label, value, href]) => (
              <Link
                key={String(label)}
                to={String(href)}
                className="rounded-xl focus-visible:outline-offset-4"
              >
                <Panel>
                  <p className="text-sm text-ink-600">{label}</p>
                  <p className="mt-4 text-4xl font-extrabold text-navy-900">
                    {value}
                  </p>
                  <span className="mt-5 block text-sm font-bold text-river-600">
                    Administrar →
                  </span>
                </Panel>
              </Link>
            ))}
          </div>
        )
      )}
      <div className="mt-6">
        <Panel>
          <h2 className="text-lg font-bold">
            Tu equipo, con los permisos adecuados
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">
            Creá roles según las responsabilidades del club y asigná solo los
            permisos necesarios. El registro de actividad te permite revisar
            cada cambio.
          </p>
          <Link
            to="/admin/roles"
            className="mt-4 inline-block text-sm font-bold text-river-600"
          >
            Gestionar roles →
          </Link>
        </Panel>
      </div>
    </>
  )
}
