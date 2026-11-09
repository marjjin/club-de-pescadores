import { useId } from 'react'
import { ListChecks } from 'lucide-react'
import type { PermissionGroup } from '../../role-editor'
import { Loading, secondaryClass } from '../ui'
import { PermissionModule } from './PermissionModule'

export function PermissionsPicker({
  groups,
  selected,
  pending,
  failed,
  error,
  onRetry,
  onToggle,
  onToggleGroup,
}: {
  groups: PermissionGroup[]
  selected: string[]
  pending: boolean
  failed: boolean
  error?: string | undefined
  onRetry: () => void
  onToggle: (id: string) => void
  onToggleGroup: (group: PermissionGroup) => void
}) {
  const id = useId()
  return (
    <section
      aria-label="Configuración de permisos"
      className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <fieldset
        data-permission-picker
        tabIndex={-1}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
        className="min-w-0"
      >
        <legend className="mb-2 flex flex-wrap items-center gap-2 text-base font-extrabold">
          <ListChecks size={18} aria-hidden="true" />
          Permisos del rol
        </legend>
        <p id={`${id}-help`} className="mb-5 text-xs leading-5 text-ink-600">
          Elegí las acciones por módulo. Cada permiso indica qué permitirá
          hacer; se aplica a todas las cuentas con este rol.
        </p>
        {error && (
          <p
            id={`${id}-error`}
            className="mb-4 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}
        {pending ? (
          <Loading />
        ) : failed ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <p>
              No pudimos cargar el catálogo de permisos. Conservamos lo que
              completaste.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className={`${secondaryClass} mt-3`}
            >
              Reintentar permisos
            </button>
          </div>
        ) : !groups.length ? (
          <p className="rounded-xl bg-mist-50 p-4 text-sm leading-6 text-ink-600">
            No hay permisos disponibles para roles personalizados. Podés guardar
            el nombre y configurarlos más adelante.
          </p>
        ) : (
          <div className="grid min-w-0 gap-6">
            {groups.map((group) => (
              <PermissionModule
                key={group.id}
                group={group}
                selected={selected}
                onToggle={onToggle}
                onToggleGroup={onToggleGroup}
              />
            ))}
          </div>
        )}
      </fieldset>
    </section>
  )
}
