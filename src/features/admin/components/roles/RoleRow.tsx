import { LockKeyhole, Pencil, Shield, ShieldCheck, Trash2 } from 'lucide-react'
import type { Role } from '../../schemas/admin'
import { permissionModuleTitle } from '../../role-editor'
import { secondaryClass } from '../ui'

export function RoleRow({
  role,
  busy,
  onEdit,
  onRemove,
}: {
  role: Role
  busy: boolean
  onEdit: () => void
  onRemove: () => void
}) {
  const Icon = role.is_system ? ShieldCheck : Shield
  const modules = [
    ...new Set(
      role.permissions.map(
        (permission) => permission.split('.')[0] ?? permission,
      ),
    ),
  ]
  return (
    <li className="flex min-w-0 flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={`grid size-11 shrink-0 place-items-center rounded-xl ${role.is_system ? 'bg-amber-50 text-amber-900' : 'bg-mist-50 text-navy-800'}`}
        >
          <Icon size={22} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-extrabold wrap-anywhere">
              {role.name}
            </h2>
            {role.is_system && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                <LockKeyhole size={11} aria-hidden="true" />
                Protegido
              </span>
            )}
          </div>
          <p className="mt-2 text-xs leading-5 text-ink-600">
            {role.is_system
              ? 'Todos los permisos · Control completo del club'
              : `${role.permissions.length} ${role.permissions.length === 1 ? 'permiso asignado' : 'permisos asignados'}`}
          </p>
          {role.is_system ? (
            <p className="mt-1 text-xs leading-5 text-ink-600">
              Este rol no se puede editar ni eliminar.
            </p>
          ) : (
            modules.length > 0 && (
              <ul
                aria-label={`Módulos de ${role.name}`}
                className="mt-2 flex flex-wrap gap-1.5"
              >
                {modules.map((module) => (
                  <li
                    key={module}
                    className="rounded-full bg-mist-50 px-2 py-1 text-[10px] font-bold text-ink-600"
                  >
                    {permissionModuleTitle(module)}
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>
      {!role.is_system && (
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            aria-label={`Editar rol ${role.name}`}
            onClick={onEdit}
            className={secondaryClass}
          >
            <Pencil size={15} aria-hidden="true" />
            Editar
          </button>
          <button
            type="button"
            disabled={busy}
            aria-label={`Eliminar rol ${role.name}`}
            onClick={onRemove}
            className={`${secondaryClass} text-red-700`}
          >
            <Trash2 size={15} aria-hidden="true" />
            Eliminar
          </button>
        </div>
      )}
    </li>
  )
}
