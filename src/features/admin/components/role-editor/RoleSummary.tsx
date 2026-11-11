import { Info, LockKeyhole } from 'lucide-react'
import type { PermissionGroup, RolePermission } from '../../role-editor'

export function RoleSummary({
  name,
  selected,
  groups,
  catalog,
  system,
}: {
  name: string
  selected: string[]
  groups: PermissionGroup[]
  catalog: RolePermission[]
  system: boolean
}) {
  const reserved = catalog.filter((permission) => permission.reserved)
  return (
    <aside className="grid min-w-0 gap-5 xl:sticky xl:top-6">
      <section className="min-w-0 rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold">Resumen del rol</h2>
        <p className="mt-4 text-lg font-extrabold wrap-anywhere">
          {name.trim() || 'Nombre por completar'}
        </p>
        <p className="mt-3 text-3xl font-extrabold tabular-nums">
          {system ? 'Todos' : selected.length}
          <span className="ml-2 text-xs font-normal text-ink-600">
            {system
              ? 'los permisos'
              : selected.length === 1
                ? 'permiso seleccionado'
                : 'permisos seleccionados'}
          </span>
        </p>
        {selected.length > 0 ? (
          <ul className="mt-4 grid gap-2 border-t border-navy-900/10 pt-4 text-xs text-ink-600">
            {groups
              .filter((group) =>
                group.permissions.some((permission) =>
                  selected.includes(permission.id),
                ),
              )
              .map((group) => (
                <li key={group.id} className="flex justify-between gap-3">
                  <span>{group.title}</span>
                  <strong className="tabular-nums text-navy-900">
                    {
                      group.permissions.filter((permission) =>
                        selected.includes(permission.id),
                      ).length
                    }
                  </strong>
                </li>
              ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs leading-5 text-ink-600">
            Este rol no otorga acciones todavía. Podés agregar los permisos
            antes de guardarlo o configurarlos más adelante.
          </p>
        )}
      </section>
      <section className="rounded-2xl border border-navy-900/10 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <LockKeyhole size={17} aria-hidden="true" />
          Funciones protegidas
        </h2>
        <p className="mt-3 text-xs leading-5 text-ink-600">
          Los permisos reservados pertenecen al administrador general y no se
          pueden asignar a un rol personalizado.
        </p>
        {reserved.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-4 text-xs leading-5 text-ink-600">
            {reserved.map((permission) => (
              <li key={permission.id}>{permission.label}</li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-2xl border border-river-600/15 bg-mist-50 p-5">
        <h2 className="flex items-center gap-2 text-sm font-extrabold">
          <Info size={17} aria-hidden="true" />
          Qué ve cada persona
        </h2>
        <p className="mt-3 text-xs leading-5 text-ink-600">
          Quien tenga este rol verá en el panel solo las secciones que elijas
          acá. Los cambios se aplican en su próxima carga del panel.
        </p>
      </section>
    </aside>
  )
}
