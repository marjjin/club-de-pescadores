import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAdminList } from './useAdminData'
import { useUserActions } from './useAdminActions'
import { userAccessChanged, validateUserAccess } from '../user-access'
import type { UserAccessErrors, UserAccessValues } from '../user-access'
import type { Account, Role } from '../schemas/admin'

export function useUserEditor(
  account: Account | null,
  userId: string,
  onClose: () => void,
) {
  const list = useAdminList('roles', userId)
  const actions = useUserActions()
  const operation = account ? actions.save : actions.invite
  const [initial] = useState<UserAccessValues>(() => ({
    email: account?.email ?? '',
    roles: account?.roles ?? [],
    active: account?.active ?? true,
  }))
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<UserAccessErrors>({})
  const self = account?.id === userId
  const dirty = userAccessChanged(initial, values)
  const busy = operation.isPending
  const roles = list.rows.filter((row): row is Role => 'is_system' in row)
  useEffect(() => {
    if (!dirty || operation.isSuccess) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, operation.isSuccess])
  function change<K extends keyof UserAccessValues>(
    name: K,
    value: UserAccessValues[K],
  ) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => {
      const next = { ...previous }
      if (name === 'email') delete next.email
      if (name === 'roles') delete next.roles
      return next
    })
    operation.reset()
  }
  function toggleRole(id: string) {
    if (values.roles.includes(id))
      change(
        'roles',
        values.roles.filter((roleId) => roleId !== id),
      )
    else if (values.roles.length < 10) change('roles', [...values.roles, id])
  }
  function close() {
    if (busy) return
    if (
      dirty &&
      !operation.isSuccess &&
      !window.confirm(
        'Tenés cambios sin guardar. ¿Querés salir y descartarlos?',
      )
    )
      return
    onClose()
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      busy ||
      self ||
      operation.isSuccess ||
      list.query.isPending ||
      list.query.isError
    )
      return
    const result = validateUserAccess(values)
    if (!result.success) {
      setErrors(result.errors)
      event.currentTarget
        .querySelector<HTMLElement>(
          result.errors.email ? '[name="email"]' : '[data-role-picker]',
        )
        ?.focus()
      return
    }
    setErrors({})
    const message = account
      ? account.active && !values.active
        ? `¿Desactivar el acceso de ${account.email}? Perderá el acceso a los datos del panel.`
        : `¿Guardar el acceso de ${account.email}? Los permisos de sus ${values.roles.length} ${values.roles.length === 1 ? 'rol asignado' : 'roles asignados'} se aplicarán inmediatamente.`
      : `¿Enviar una invitación a ${result.data.email} con ${values.roles.length} ${values.roles.length === 1 ? 'rol asignado' : 'roles asignados'}?`
    if (!window.confirm(message)) return
    if (account)
      actions.save.mutate([account, result.data.roles, result.data.active])
    else actions.invite.mutate([result.data.email, result.data.roles])
  }
  return {
    list,
    roles,
    values,
    errors,
    dirty,
    busy,
    self,
    operation,
    change,
    toggleRole,
    close,
    submit,
  }
}
