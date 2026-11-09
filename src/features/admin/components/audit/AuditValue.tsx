import { ArrowUpRight } from 'lucide-react'
import { formatAuditValue } from '../../audit-values'
import type { AuditChange } from '../../audit-diff'

export function AuditValue({
  field,
  value,
}: {
  field: string
  value: unknown
}) {
  const formatted = formatAuditValue(field, value)
  if (formatted.kind === 'link')
    return (
      <a
        href={formatted.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-10 items-center gap-1.5 font-bold text-river-600 hover:underline"
        aria-label="Abrir imagen en otra pestaña"
      >
        {formatted.text}
        <ArrowUpRight size={15} aria-hidden="true" />
      </a>
    )
  return (
    <span
      className={`block whitespace-pre-wrap wrap-anywhere ${formatted.kind === 'empty' ? 'text-ink-600 italic' : formatted.kind === 'identifier' ? 'font-mono text-xs text-ink-600' : 'text-navy-900'}`}
    >
      {formatted.text}
    </span>
  )
}
export function AuditFieldChange({
  change,
  mode,
}: {
  change: AuditChange
  mode: string
}) {
  const long = [
    'excerpt',
    'description',
    'family_description',
    'discount_note',
    'note',
  ].includes(change.key)
  return (
    <div
      className={`min-w-0 ${mode === 'updated' || long ? 'sm:col-span-2' : ''}`}
    >
      <dt className="mb-2 text-xs font-extrabold text-ink-600">
        {change.label}
      </dt>
      <dd>
        {mode === 'updated' ? (
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-navy-900/10 bg-mist-50/70 p-3">
              <p className="mb-2 text-[10px] font-extrabold tracking-wider text-ink-600 uppercase">
                Antes
              </p>
              <div className="text-sm leading-6">
                <AuditValue field={change.key} value={change.before} />
              </div>
            </div>
            <div className="min-w-0 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="mb-2 text-[10px] font-extrabold tracking-wider text-emerald-800 uppercase">
                Después
              </p>
              <div className="text-sm leading-6">
                <AuditValue field={change.key} value={change.after} />
              </div>
            </div>
          </div>
        ) : (
          <div className="min-w-0 rounded-lg border border-navy-900/10 bg-white p-3 text-sm leading-6">
            <AuditValue
              field={change.key}
              value={mode === 'deleted' ? change.before : change.after}
            />
          </div>
        )}
      </dd>
    </div>
  )
}
