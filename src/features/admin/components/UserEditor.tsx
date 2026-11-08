import { formText } from '../form-utils'
import { useState } from 'react'
import { useAdminList } from '../hooks/useAdminData'
import { useUserActions } from '../hooks/useAdminActions'
import type { Account, Role } from '../schemas/admin'
import {
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

export function UserEditor({
  account,
  userId,
  onClose,
}: {
  account: Account | null
  userId: string
  onClose: () => void
}) {
  const list = useAdminList('roles', userId)
  const [selected, setSelected] = useState(account?.roles ?? [])
  const actions = useUserActions()
  const operation = account ? actions.save : actions.invite
  const roles = list.rows.filter((row): row is Role => 'is_system' in row)
  return (
    <>
      <SectionHeading
        title={account ? 'Gestionar acceso' : 'Invitar usuario'}
        description="Asigná uno o más roles. Solo quienes tengan el rol general pueden ingresar a este panel por ahora."
      />
      <Panel>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault()
            if (!selected.length) return
            const form = new FormData(event.currentTarget)
            if (
              !window.confirm(
                '¿Confirmás estos accesos? Los cambios de permisos se aplican inmediatamente.',
              )
            )
              return
            if (account)
              actions.save.mutate([
                account,
                selected,
                form.get('active') === 'on',
              ])
            else actions.invite.mutate([formText(form.get('email')), selected])
          }}
        >
          <Field label="Correo electrónico">
            <input
              className={inputClass}
              name="email"
              type="email"
              required
              maxLength={254}
              defaultValue={account?.email ?? ''}
              readOnly={Boolean(account)}
            />
          </Field>
          <fieldset>
            <legend className="mb-3 font-bold">
              Roles asignados ({selected.length})
            </legend>
            <p className="mb-3 text-sm text-ink-600">
              Máximo 10 roles. Dar el rol general otorga control completo del
              club.
            </p>
            {list.query.isPending ? (
              <Loading />
            ) : (
              <div className="grid gap-3">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-3 rounded-lg border border-navy-900/10 p-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(role.id)}
                      disabled={
                        !selected.includes(role.id) && selected.length >= 10
                      }
                      onChange={(event) =>
                        setSelected(
                          event.target.checked
                            ? [...selected, role.id]
                            : selected.filter((id) => id !== role.id),
                        )
                      }
                      className="size-4 accent-river-600"
                    />
                    {role.name}
                    {role.is_system && (
                      <span className="ml-auto text-xs font-bold text-amber-800">
                        Acceso completo
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
            <Pagination {...list} pending={list.query.isFetching} />
          </fieldset>
          {account && (
            <label className="flex items-center gap-3 text-sm font-bold">
              <input
                name="active"
                type="checkbox"
                defaultChecked={account.active}
                className="size-5 accent-river-600"
              />
              Acceso activo
            </label>
          )}
          <Feedback
            error={list.query.error ?? operation.error}
            success={
              operation.isSuccess
                ? typeof operation.data === 'string'
                  ? operation.data
                  : account
                    ? 'Acceso actualizado.'
                    : 'Invitación enviada. El usuario debe abrir el correo y configurar su cuenta.'
                : null
            }
          />
          <div className="flex gap-3">
            <button
              className={primaryClass}
              disabled={
                operation.isPending ||
                operation.isSuccess ||
                !selected.length ||
                account?.id === userId
              }
            >
              {operation.isPending
                ? 'Procesando…'
                : account
                  ? 'Guardar acceso'
                  : 'Enviar invitación'}
            </button>
            <button type="button" className={secondaryClass} onClick={onClose}>
              Volver
            </button>
          </div>
        </form>
      </Panel>
    </>
  )
}
