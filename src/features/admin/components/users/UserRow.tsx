import { ArrowRight, CircleCheck, CircleSlash, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import type { Account } from '../../schemas/admin'
import { secondaryClass } from '../ui'

export function UserRow({
  account,
  self,
  onEdit,
}: {
  account: Account
  self: boolean
  /** Absent when the viewer may only see the team, not change access. */
  onEdit?: (() => void) | undefined
}) {
  const Icon = account.active ? CircleCheck : CircleSlash
  return (
    <li className="flex min-w-0 flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-mist-50 text-sm font-extrabold text-navy-800"
        >
          {account.email.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-extrabold wrap-anywhere text-navy-900">
              {account.email}
            </h2>
            {self && (
              <span className="rounded-full bg-navy-900/5 px-2 py-0.5 text-[11px] font-bold text-ink-600">
                Tu cuenta
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-bold ${account.active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
            >
              <Icon size={13} aria-hidden="true" />
              {account.active ? 'Activo' : 'Desactivado'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-ink-600">
              <ShieldCheck size={14} aria-hidden="true" />
              {account.roles.length}{' '}
              {account.roles.length === 1 ? 'rol asignado' : 'roles asignados'}
            </span>
          </div>
          {self && (
            <p className="mt-2 text-xs leading-5 text-ink-600">
              Otra persona con permiso de usuarios debe modificar tus roles o tu
              estado de acceso.
            </p>
          )}
        </div>
      </div>
      {self ? (
        <Link
          to="/admin/cuenta"
          className={`${secondaryClass} self-start sm:shrink-0`}
        >
          Mi cuenta
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      ) : (
        onEdit && (
          <button
            type="button"
            aria-label={`Gestionar acceso de ${account.email}`}
            onClick={onEdit}
            className={`${secondaryClass} self-start sm:shrink-0`}
          >
            Gestionar acceso
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        )
      )}
    </li>
  )
}
