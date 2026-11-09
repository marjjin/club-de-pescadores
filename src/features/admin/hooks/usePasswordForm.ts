import { useState } from 'react'
import type { FormEvent } from 'react'
import { useBeforeUnload } from '@/shared/hooks/useBeforeUnload'
import { useAuthActions } from './useAdminActions'
import { validatePasswordChange } from '../account-forms'
import type { PasswordFormErrors } from '../account-forms'

export function usePasswordForm(onSaved?: () => void) {
  const { password: request } = useAuthActions()
  const [values, setValues] = useState({ password: '', confirm: '' })
  const [visible, setVisible] = useState({ password: false, confirm: false })
  const [errors, setErrors] = useState<PasswordFormErrors>({})
  const dirty = Boolean(values.password || values.confirm)
  useBeforeUnload(dirty && !request.isSuccess)
  function change(name: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => {
      const next = { ...previous }
      delete next[name]
      if (name === 'password') delete next.confirm
      return next
    })
    request.reset()
  }
  function clear() {
    setValues({ password: '', confirm: '' })
    setVisible({ password: false, confirm: false })
    setErrors({})
  }
  function reset() {
    if (!request.isPending) {
      clear()
      request.reset()
    }
  }
  function toggle(name: keyof typeof visible) {
    setVisible((previous) => ({ ...previous, [name]: !previous[name] }))
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (request.isPending) return
    const result = validatePasswordChange(values.password, values.confirm)
    if (!result.success) {
      setErrors(result.errors)
      event.currentTarget
        .querySelector<HTMLElement>(
          result.errors.password ? '[name="password"]' : '[name="confirm"]',
        )
        ?.focus()
      return
    }
    setErrors({})
    request.mutate(result.password, {
      onSuccess: () => {
        clear()
        onSaved?.()
      },
    })
  }
  return {
    values,
    visible,
    errors,
    dirty,
    request,
    change,
    reset,
    toggle,
    submit,
  }
}
