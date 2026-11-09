import { ChevronRight } from 'lucide-react'
import type { Audit } from '../../schemas/admin'
import type { AuditChange } from '../../audit-diff'
import { auditTimestamp } from '../../audit-values'
import { AuditFieldChange } from './AuditValue'

export function AuditReferences({
  entry,
  technical,
  mode,
}: {
  entry: Audit
  technical: AuditChange[]
  mode: string
}) {
  return (
    <details className="group/references mt-5 rounded-lg border border-navy-900/10 bg-white">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-xs font-bold text-ink-600 [&::-webkit-details-marker]:hidden">
        <ChevronRight
          size={15}
          aria-hidden="true"
          className="shrink-0 transition-transform group-open/references:rotate-90 motion-reduce:transition-none"
        />
        Referencias del registro
      </summary>
      <div className="border-t border-navy-900/10 p-4">
        <dl className="grid min-w-0 gap-4 text-xs sm:grid-cols-2">
          {[
            ['Identificador de la actividad', entry.id],
            ['Referencia del registro', entry.resource_id],
            ['Operación registrada', entry.action],
            [
              'Cuenta responsable (identificador)',
              entry.actor_id ?? 'Sistema o servicio',
            ],
            ['Registrado el', auditTimestamp(entry.created_at)],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="font-bold text-ink-600">{label}</dt>
              <dd className="mt-1 leading-5 wrap-anywhere text-navy-900">
                {value}
              </dd>
            </div>
          ))}
          {technical.map((change) => (
            <AuditFieldChange key={change.key} change={change} mode={mode} />
          ))}
        </dl>
      </div>
    </details>
  )
}
