import { z } from '@/shared/lib/validation'

export const userAccessSchema = z.object({
  email: z.email().max(254),
  roles: z.array(z.uuid()).min(1).max(10),
  active: z.boolean(),
})
export type UserAccessValues = z.infer<typeof userAccessSchema>
export type UserAccessErrors = { email?: string; roles?: string }
export function validateUserAccess(values: UserAccessValues) {
  const result = userAccessSchema.safeParse({
    ...values,
    email: values.email.trim(),
  })
  if (result.success) return { success: true as const, data: result.data }
  const errors: UserAccessErrors = {}
  for (const issue of result.error.issues) {
    if (issue.path[0] === 'email')
      errors.email =
        'Ingresá un correo electrónico válido, de hasta 254 caracteres.'
    if (issue.path[0] === 'roles')
      errors.roles = 'Seleccioná entre 1 y 10 roles válidos para esta cuenta.'
  }
  return { success: false as const, errors }
}
export function userAccessChanged(
  initial: UserAccessValues,
  values: UserAccessValues,
) {
  return (
    initial.email !== values.email ||
    initial.active !== values.active ||
    [...initial.roles].sort().join(',') !== [...values.roles].sort().join(',')
  )
}
