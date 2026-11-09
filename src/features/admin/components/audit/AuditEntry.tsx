import {
  Archive,
  ArchiveRestore,
  ChevronRight,
  Clock3,
  CirclePlus,
  Pencil,
  Send,
  ShieldCheck,
  ShieldMinus,
  Trash2,
  UserCheck,
  UserRound,
  UserX,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Audit } from '../../schemas/admin'
import { auditActor, auditPresentation } from '../../audit-entry'
import type { AuditKind } from '../../audit-entry'
import { auditTimestamp } from '../../audit-values'
import { AuditChanges } from './AuditChanges'

const appearance: Record<AuditKind, { icon: LucideIcon; color: string }> = {
  scheduled: {
    icon: Clock3,
    color: 'border-river-600/20 bg-mist-50 text-navy-800',
  },
  created: {
    icon: CirclePlus,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  updated: {
    icon: Pencil,
    color: 'border-river-600/20 bg-mist-50 text-navy-800',
  },
  deleted: { icon: Trash2, color: 'border-red-200 bg-red-50 text-red-800' },
  archived: {
    icon: Archive,
    color: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  restored: {
    icon: ArchiveRestore,
    color: 'border-river-600/20 bg-mist-50 text-navy-800',
  },
  published: {
    icon: Send,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  unpublished: {
    icon: Archive,
    color: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  activated: {
    icon: UserCheck,
    color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  deactivated: { icon: UserX, color: 'border-red-200 bg-red-50 text-red-800' },
  assigned: {
    icon: ShieldCheck,
    color: 'border-river-600/20 bg-mist-50 text-navy-800',
  },
  unassigned: {
    icon: ShieldMinus,
    color: 'border-amber-200 bg-amber-50 text-amber-900',
  },
}
export function AuditEntry({ entry }: { entry: Audit }) {
  const info = auditPresentation(entry)
  const { icon: Icon, color } = appearance[info.kind]
  return (
    <article className="min-w-0 px-4 py-5 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border ${color}`}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold ${color}`}
              >
                {info.label}
              </span>
              <span className="text-[11px] font-bold text-ink-600">
                {info.resource}
              </span>
            </div>
            <time
              dateTime={entry.created_at}
              title={auditTimestamp(entry.created_at)}
              className="text-xs font-semibold tabular-nums text-ink-600"
            >
              {auditTimestamp(entry.created_at, true)}
            </time>
          </div>
          <h3 className="mt-2 text-base font-extrabold wrap-anywhere">
            {info.title}
          </h3>
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-5 text-ink-600">
            <UserRound
              size={14}
              aria-hidden="true"
              className="mt-0.5 shrink-0"
            />
            <span className="min-w-0 wrap-anywhere">{auditActor(entry)}</span>
          </p>
          <details className="group/activity mt-2 min-w-0">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded text-xs font-bold text-river-600 hover:underline [&::-webkit-details-marker]:hidden">
              <ChevronRight
                size={15}
                aria-hidden="true"
                className="shrink-0 transition-transform group-open/activity:rotate-90 motion-reduce:transition-none"
              />
              Ver detalle
            </summary>
            <AuditChanges entry={entry} />
          </details>
        </div>
      </div>
    </article>
  )
}
