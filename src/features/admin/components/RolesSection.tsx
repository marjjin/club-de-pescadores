import { formText } from '../form-utils'
import { useState } from 'react'
import { useAdminList, usePermissions } from '../hooks/useAdminData'
import { useRoleActions } from '../hooks/useAdminActions'
import type { Role } from '../schemas/admin'
import {
  Empty,
  Feedback,
  Field,
  inputClass,
  Loading,
  Pagination,
  Panel,
  primaryClass,
  secondaryClass,
  SectionHeading,
} from './ui'

function RoleEditor({
  role,
  userId,
  onClose,
}: {
  role: Role | null
  userId: string
  onClose: () => void
}) {
  const permissions = usePermissions(userId)
  const { save } = useRoleActions()
  return (
    <>
      <SectionHeading
        title={role ? 'Editar rol' : 'Crear rol'}
        description="Combiná permisos existentes. Los paneles de otros perfiles se habilitarán en una etapa posterior."
      />
      <Panel>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            if (
              window.confirm(
                '¿Guardar estos permisos? Los cambios afectan a todos los usuarios de este rol.',
              )
            )
              save.mutate(
                [
                  formText(form.get('name')),
                  form.getAll('permission').map(String),
                  role,
                ],
                { onSuccess: onClose },
              )
          }}
        >
          <Field label="Nombre del rol">
            <input
              className={inputClass}
              name="name"
              defaultValue={role?.name ?? ''}
              minLength={2}
              maxLength={80}
              required
            />
          </Field>
          <fieldset>
            <legend className="mb-3 font-bold">Permisos del rol</legend>
            <p className="mb-4 text-sm text-ink-600">
              Seleccioná también «Ver» para cada módulo que pueda editar,
              publicar o archivar.
            </p>
            {permissions.isPending ? (
              <Loading />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {permissions.data
                  ?.filter((permission) => !permission.reserved)
                  .map((permission) => (
                    <label
                      key={permission.id}
                      className="flex items-center gap-3 rounded-lg border border-navy-900/10 p-3 text-sm"
                    >
                      <input
                        name="permission"
                        value={permission.id}
                        type="checkbox"
                        defaultChecked={role?.permissions.includes(
                          permission.id,
                        )}
                        className="size-4 accent-river-600"
                      />
                      {permission.label}
                    </label>
                  ))}
              </div>
            )}
          </fieldset>
          <Feedback error={permissions.error ?? save.error} />
          <div className="flex gap-3">
            <button
              className={primaryClass}
              disabled={save.isPending || !permissions.data}
            >
              Guardar rol
            </button>
            <button type="button" className={secondaryClass} onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </Panel>
    </>
  )
}
export function RolesSection({ userId }: { userId: string }) {
  const list = useAdminList('roles', userId)
  const { remove } = useRoleActions()
  const [editing, setEditing] = useState<Role | 'new' | null>(null)
  if (editing)
    return (
      <RoleEditor
        role={editing === 'new' ? null : editing}
        userId={userId}
        onClose={() => setEditing(null)}
      />
    )
  const roles = list.rows.filter((row): row is Role => 'is_system' in row)
  return (
    <>
      <SectionHeading
        title="Roles y permisos"
        description="Definí las responsabilidades del equipo. El administrador general conserva el control de los accesos."
        action={
          <button className={primaryClass} onClick={() => setEditing('new')}>
            Crear rol
          </button>
        }
      />
      <Panel>
        <Feedback error={list.query.error ?? remove.error} />
        {list.query.isPending ? (
          <Loading />
        ) : !roles.length ? (
          <Empty />
        ) : (
          <div className="divide-y divide-navy-900/10">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex flex-wrap items-center justify-between gap-3 py-5"
              >
                <div>
                  <h2 className="font-bold">{role.name}</h2>
                  <p className="mt-1 text-sm text-ink-600">
                    {role.is_system
                      ? 'Rol protegido · Todos los permisos'
                      : `${role.permissions.length} permisos asignados`}
                  </p>
                </div>
                {!role.is_system && (
                  <div className="flex gap-2">
                    <button
                      className={secondaryClass}
                      onClick={() => setEditing(role)}
                    >
                      Editar
                    </button>
                    <button
                      className={secondaryClass}
                      disabled={remove.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            '¿Eliminar este rol? Solo se puede eliminar si no tiene usuarios asignados.',
                          )
                        )
                          remove.mutate(role)
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <Pagination {...list} pending={list.query.isFetching} />
      </Panel>
    </>
  )
}
