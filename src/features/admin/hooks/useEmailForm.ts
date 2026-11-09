import { useState } from 'react'
import type { FormEvent } from 'react'
import { useBeforeUnload } from '@/shared/hooks/useBeforeUnload'
import { useAuthActions } from './useAdminActions'
import { validateEmailChange } from '../account-forms'
import type { EmailFormErrors } from '../account-forms'

export function useEmailForm(currentEmail: string) {
  const { email: request } = useAuthActions()
  const [values, setValues] = useState({ email: '', confirmation: '' })
  const [errors, setErrors] = useState<EmailFormErrors>({})
  const dirty = Boolean(values.email || values.confirmation)
  useBeforeUnload(dirty && !request.isSuccess)
  function change(name: keyof typeof values, value: string) {
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => {
      const next = { ...previous }
      delete next[name]
      if (name === 'email') delete next.confirmation
      return next
    })
    request.reset()
  }
  function reset() {
    if (request.isPending || request.isSuccess) return
    setValues({ email: '', confirmation: '' })
    setErrors({})
    request.reset()
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (request.isPending || request.isSuccess) return
    const result = validateEmailChange(
      currentEmail,
      values.email,
      values.confirmation,
    )
    if (!result.success) {
      setErrors(result.errors)
      event.currentTarget
        .querySelector<HTMLElement>(
          result.errors.email ? '[name="email"]' : '[name="confirmation"]',
        )
        ?.focus()
      return
    }
    setErrors({})
    request.mutate(result.email)
  }
  return { values, errors, dirty, request, change, reset, submit }
}
