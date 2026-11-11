import { useState } from 'react'
import type { FormEvent } from 'react'
import { useConfirm } from './useConfirm'
import type { Role } from '../schemas/admin'
import {
  groupRolePermissions,
  selectPermissionGroup,
  toggleRolePermission,
  validateRoleEditor,
} from '../role-editor'
import type { PermissionGroup, RoleEditorErrors } from '../role-editor'
import { usePermissions } from './useAdminData'
import { useRoleActions } from './useAdminActions'

export function useRoleEditor(
  role: Role | null,
  userId: string,
  onClose: () => void,
  onSaved: (name: string) => void,
) {
  const confirm = useConfirm()
  const permissions = usePermissions(userId)
  const { save } = useRoleActions()
  const [name, setName] = useState(role?.name ?? '')
  const [selected, setSelected] = useState(role?.permissions ?? [])
  const [errors, setErrors] = useState<RoleEditorErrors>({})
  const catalog = permissions.data ?? []
  const groups = groupRolePermissions(catalog)
  const dirty =
    name !== (role?.name ?? '') ||
    [...selected].sort().join(',') !==
      [...(role?.permissions ?? [])].sort().join(',')
  function changeName(value: string) {
    setName(value)
    setErrors((previous) => {
      const next = { ...previous }
      delete next.name
      return next
    })
    save.reset()
  }
  function changePermissions(value: string[]) {
    setSelected(value)
    setErrors((previous) => {
      const next = { ...previous }
      delete next.permissions
      return next
    })
    save.reset()
  }
  function toggle(id: string) {
    changePermissions(toggleRolePermission(selected, id, catalog))
  }
  function toggleGroup(group: PermissionGroup) {
    changePermissions(selectPermissionGroup(selected, group))
  }
  async function requestClose() {
    if (save.isPending) return
    if (
      dirty &&
      !save.isSuccess &&
      !(await confirm({
        title: '¿Salir sin guardar?',
        message: 'Tenés cambios sin guardar. ¿Querés salir y descartarlos?',
        confirmLabel: 'Salir y descartar',
        cancelLabel: 'Seguir editando',
        tone: 'danger',
      }))
    )
      return
    onClose()
  }
  async function requestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      save.isPending ||
      role?.is_system ||
      permissions.isPending ||
      permissions.isError ||
      !permissions.data
    )
      return
    const result = validateRoleEditor(name, selected, catalog)
    if (!result.success) {
      setErrors(result.errors)
      event.currentTarget
        .querySelector<HTMLElement>(
          result.errors.name ? '[name="name"]' : '[data-permission-picker]',
        )
        ?.focus()
      return
    }
    setErrors({})
    const message = role
      ? `¿Guardar los permisos de «${result.data.name}»? Los cambios afectarán a todas las cuentas que tengan este rol.`
      : `¿Crear el rol «${result.data.name}» con ${selected.length} ${selected.length === 1 ? 'permiso' : 'permisos'}?`
    if (!(await confirm(message))) return
    save.mutate([result.data.name, result.data.permissions, role], {
      onSuccess: () => onSaved(result.data.name),
    })
  }
  const close = () => void requestClose()
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void requestSubmit(event)
  }
  return {
    name,
    selected,
    errors,
    permissions,
    groups,
    dirty,
    save,
    changeName,
    toggle,
    toggleGroup,
    close,
    submit,
  }
}
