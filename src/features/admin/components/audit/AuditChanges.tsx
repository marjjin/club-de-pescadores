import type { Audit } from '../../schemas/admin'
import { auditDiff } from '../../audit-diff'
import { AuditFieldChange } from './AuditValue'
import { AuditReferences } from './AuditReferences'

export function AuditChanges({ entry }: { entry: Audit }) {
  const diff = auditDiff(entry)
  return (
    <div className="mt-3 min-w-0 rounded-xl border border-navy-900/10 bg-mist-50/40 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-extrabold">
          {diff.mode === 'created'
            ? 'Datos del registro creado'
            : diff.mode === 'deleted'
              ? 'Datos del registro eliminado'
              : 'Cambios en este registro'}
        </h4>
        {diff.changes.length > 0 && (
          <span className="text-xs font-semibold tabular-nums text-ink-600">
            {diff.changes.length}{' '}
            {diff.mode === 'updated'
              ? diff.changes.length === 1
                ? 'campo modificado'
                : 'campos modificados'
              : diff.changes.length === 1
                ? 'campo registrado'
                : 'campos registrados'}
          </span>
        )}
      </div>
      {diff.changes.length ? (
        <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
          {diff.changes.map((change) => (
            <AuditFieldChange
              key={change.key}
              change={change}
              mode={diff.mode}
            />
          ))}
        </dl>
      ) : (
        <p className="text-sm leading-6 text-ink-600">
          {diff.technical.some(
            (change) => change.key === 'user_id' || change.key === 'role_id',
          )
            ? 'Esta actividad registra una relación de acceso. Consultá las referencias de la cuenta o del rol debajo.'
            : 'No hay cambios en los campos de contenido o acceso. Podés consultar las referencias de este registro.'}
        </p>
      )}
      <AuditReferences
        entry={entry}
        technical={diff.technical}
        mode={diff.mode}
      />
    </div>
  )
}
