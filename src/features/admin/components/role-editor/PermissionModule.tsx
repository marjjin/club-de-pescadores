import {
  CalendarDays,
  History,
  Newspaper,
  ShieldCheck,
  Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { permissionDescription } from '../../role-editor'
import type { PermissionGroup } from '../../role-editor'

const icons: Record<string, LucideIcon> = {
  noticias: Newspaper,
  eventos: CalendarDays,
  tarifas: Waves,
  auditoria: History,
}
export function PermissionModule({
  group,
  selected,
  onToggle,
  onToggleGroup,
}: {
  group: PermissionGroup
  selected: string[]
  onToggle: (id: string) => void
  onToggleGroup: (group: PermissionGroup) => void
}) {
  const Icon = icons[group.id] ?? ShieldCheck
  const count = group.permissions.filter((permission) =>
    selected.includes(permission.id),
  ).length
  const full = count === group.permissions.length
  const dependent = ['noticias', 'eventos', 'tarifas'].includes(group.id)
  return (
    <fieldset className="min-w-0 rounded-xl border border-navy-900/10 bg-white p-4 sm:p-5">
      <legend className="flex flex-wrap items-center gap-2 px-2 text-base font-extrabold">
        <Icon size={18} aria-hidden="true" />
        {group.title}
        <span className="rounded-full bg-mist-50 px-2 py-1 text-xs font-semibold tabular-nums text-ink-600">
          {count}/{group.permissions.length}
        </span>
      </legend>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs leading-5 text-ink-600">{group.description}</p>
        <button
          type="button"
          onClick={() => onToggleGroup(group)}
          disabled={
            !full && selected.length + group.permissions.length - count > 30
          }
          aria-label={`${full ? 'Quitar todos los permisos de' : 'Seleccionar todos los permisos de'} ${group.title}`}
          className="min-h-9 text-xs font-bold text-river-600 hover:underline disabled:opacity-50"
        >
          {full ? 'Quitar todos' : 'Seleccionar todos'}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {group.permissions.map((permission) => {
          const checked = selected.includes(permission.id)
          return (
            <label
              key={permission.id}
              className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-3 has-disabled:cursor-not-allowed has-disabled:opacity-60 ${checked ? 'border-river-600/35 bg-mist-50 ring-1 ring-river-600/10' : 'border-navy-900/10 hover:bg-mist-50/60'}`}
            >
              <input
                type="checkbox"
                name="permission"
                value={permission.id}
                aria-label={permission.label}
                checked={checked}
                onChange={() => onToggle(permission.id)}
                disabled={!checked && selected.length >= 30}
                className="mt-1 size-4 shrink-0 accent-river-600"
              />
              <span className="min-w-0">
                <span className="block text-sm font-bold wrap-anywhere">
                  {permission.label}
                </span>
                <span className="mt-1 block text-xs leading-5 text-ink-600">
                  {permissionDescription(permission.id)}
                </span>
              </span>
            </label>
          )
        })}
      </div>
      {dependent && (
        <p className="mt-4 rounded-lg bg-mist-50 px-3 py-2 text-xs leading-5 text-ink-600">
          Las otras acciones incluyen «Ver» automáticamente. Si quitás «Ver»,
          también se quitan las acciones que dependen de ese permiso.
        </p>
      )}
    </fieldset>
  )
}
