import { z } from '@/shared/lib/validation'

export type EmailFormErrors = { email?: string; confirmation?: string }
export type PasswordFormErrors = { password?: string; confirm?: string }
export function validateEmailChange(
  current: string,
  email: string,
  confirmation: string,
) {
  const errors: EmailFormErrors = {}
  const next = email.trim()
  if (!z.email().max(254).safeParse(next).success)
    errors.email =
      'Ingresá un correo electrónico válido, de hasta 254 caracteres.'
  else if (next.toLowerCase() === current.trim().toLowerCase())
    errors.email = 'Ingresá un correo diferente al actual.'
  if (next.toLowerCase() !== confirmation.trim().toLowerCase())
    errors.confirmation = 'Los correos no coinciden.'
  if (!confirmation.trim())
    errors.confirmation = 'Repetí el nuevo correo electrónico.'
  if (Object.keys(errors).length) return { success: false as const, errors }
  return { success: true as const, email: next }
}
export function validatePasswordChange(password: string, confirmation: string) {
  const errors: PasswordFormErrors = {}
  if (password.length < 12 || password.length > 128)
    errors.password = 'Usá una contraseña de entre 12 y 128 caracteres.'
  if (!confirmation) errors.confirm = 'Repetí la nueva contraseña.'
  else if (password !== confirmation)
    errors.confirm = 'Las contraseñas no coinciden.'
  if (Object.keys(errors).length) return { success: false as const, errors }
  return { success: true as const, password }
}
