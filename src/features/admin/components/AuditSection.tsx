import { LockKeyhole } from 'lucide-react'
import { useAdminList } from '../hooks/useAdminData'
import type { Audit } from '../schemas/admin'
import { groupAuditDays } from '../audit-entry'
import { Feedback, Pagination, SectionHeading } from './ui'
import { CatalogListSkeleton } from './CatalogListSkeleton'
import { AuditEntry } from './audit/AuditEntry'
import { AuditToolbar } from './audit/AuditToolbar'
import { AuditListMessage } from './audit/AuditListMessage'

export function AuditSection({ userId }: { userId: string }) {
  const list = useAdminList('audit', userId)
  const entries = list.rows.filter((row): row is Audit => 'action' in row)
  const groups = groupAuditDays(entries)
  const failed = list.query.isError && !entries.length
  const filtered = Boolean(list.search) || list.page > 1
  return (
    <>
      <SectionHeading
        title="Registro de actividad"
        description="Revisá qué cambió, quién lo hizo y cuándo. Los detalles muestran los valores del registro en un formato legible."
        action={
          <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-navy-900/10 bg-white px-3 text-xs font-bold text-ink-600">
            <LockKeyhole size={14} aria-hidden="true" />
            Historial de solo lectura
          </span>
        }
      />
      <section
        aria-label="Historial de actividad"
        className="min-w-0 overflow-hidden rounded-2xl border border-navy-900/10 bg-white shadow-sm"
      >
        <AuditToolbar
          value={list.search}
          busy={list.query.isFetching}
          onFilter={(section) => list.filter('all', section)}
          onRefresh={() => {
            void list.query.refetch()
          }}
        />
        {list.query.isError && entries.length > 0 && (
          <div className="p-4 sm:px-6">
            <Feedback error={list.query.error} />
            <p className="mt-2 text-xs text-ink-600">
              Mostramos la última información disponible.
            </p>
          </div>
        )}
        <div aria-busy={list.query.isFetching}>
          {list.query.isPending ? (
            <CatalogListSkeleton label="Cargando actividad" />
          ) : failed || !entries.length ? (
            <AuditListMessage
              failed={failed}
              error={list.query.error}
              filtered={filtered}
              onRetry={() => {
                void list.query.refetch()
              }}
              onReset={() => list.filter('all', '')}
            />
          ) : (
            groups.map((group) => (
              <section
                key={group.day}
                aria-label={group.label}
                className="min-w-0"
              >
                <h2 className="border-y border-navy-900/5 bg-mist-50/70 px-4 py-2.5 text-xs font-extrabold text-ink-600 sm:px-6">
                  {group.label}
                </h2>
                <ol className="divide-y divide-navy-900/10">
                  {group.entries.map((entry) => (
                    <li key={entry.id} className="min-w-0">
                      <AuditEntry entry={entry} />
                    </li>
                  ))}
                </ol>
              </section>
            ))
          )}
        </div>
        {!list.query.isPending &&
          !failed &&
          (entries.length > 0 || list.page > 1) && (
            <footer className="border-t border-navy-900/10 bg-mist-50/40 px-4 py-4 sm:px-6">
              <p role="status" className="text-xs text-ink-600">
                {entries.length}{' '}
                {entries.length === 1
                  ? 'actividad en esta página'
                  : 'actividades en esta página'}{' '}
                · Más recientes primero
              </p>
              {(list.hasNext || list.page > 1) && (
                <Pagination {...list} pending={list.query.isFetching} />
              )}
            </footer>
          )}
      </section>
      <p className="mt-4 text-center text-xs leading-5 text-ink-600">
        El historial conserva cada operación por separado. Las asignaciones de
        roles o permisos pueden generar varios registros.
      </p>
    </>
  )
}
