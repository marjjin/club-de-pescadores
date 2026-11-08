import { formText, dateLabel } from '../form-utils'
import { useAdminList } from '../hooks/useAdminData'
import type { Audit } from '../schemas/admin'
import { auditFilters, auditLabel } from '../audit-labels'
import {
  Empty,
  Feedback,
  inputClass,
  Loading,
  Pagination,
  Panel,
  secondaryClass,
  SectionHeading,
} from './ui'

export function AuditSection({ userId }: { userId: string }) {
  const list = useAdminList('audit', userId)
  const entries = list.rows.filter((row): row is Audit => 'action' in row)
  return (
    <>
      <SectionHeading
        title="Registro de actividad"
        description="Historial de cambios del contenido y de los accesos. Los registros no se pueden modificar desde el panel."
      />
      <Panel>
        <form
          className="mb-5 flex gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            list.filter(
              'all',
              formText(new FormData(event.currentTarget).get('action')),
            )
          }}
        >
          <select
            name="action"
            className={inputClass}
            aria-label="Filtrar por sección"
          >
            <option value="">Todas las secciones</option>
            {auditFilters.map(([value, label]) => (
              <option key={value} value={`${value}.`}>
                {label}
              </option>
            ))}
          </select>
          <button className={secondaryClass}>Filtrar</button>
        </form>
        <Feedback error={list.query.error} />
        {list.query.isPending ? (
          <Loading />
        ) : !entries.length ? (
          <Empty />
        ) : (
          <div className="divide-y divide-navy-900/10">
            {entries.map((entry) => (
              <article key={entry.id} className="py-5">
                <div className="flex flex-wrap justify-between gap-2">
                  <h2 className="font-bold">{auditLabel(entry.action)}</h2>
                  <time
                    className="text-sm text-ink-600"
                    dateTime={entry.created_at}
                  >
                    {dateLabel(entry.created_at)}
                  </time>
                </div>
                <p className="mt-2 text-xs break-all text-ink-600">
                  Por{' '}
                  {entry.actor_email ??
                    (entry.actor_id
                      ? 'Cuenta anterior'
                      : 'Instalación o servicio')}
                </p>
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer font-bold text-river-600">
                    Ver cambios
                  </summary>
                  <p className="mt-3 text-xs text-ink-600">
                    Referencia: {entry.resource_id}
                  </p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div>
                      <h3 className="mb-2 font-bold">Antes</h3>
                      <pre className="max-h-80 overflow-auto rounded-lg bg-mist-50 p-3 text-xs whitespace-pre-wrap break-all">
                        {JSON.stringify(entry.before_data, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h3 className="mb-2 font-bold">Después</h3>
                      <pre className="max-h-80 overflow-auto rounded-lg bg-mist-50 p-3 text-xs whitespace-pre-wrap break-all">
                        {JSON.stringify(entry.after_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </details>
              </article>
            ))}
          </div>
        )}
        <Pagination {...list} pending={list.query.isFetching} />
      </Panel>
    </>
  )
}
