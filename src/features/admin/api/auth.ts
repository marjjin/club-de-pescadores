import { getAdminSupabase } from '@/lib/supabase/admin-client'
import { requestSignal } from '@/lib/supabase/request'
import { contextSchema } from '../schemas/admin'
import { adminError, parseAdminResponse } from './errors'
import { z } from '@/shared/lib/validation'

export async function getAdminSession(signal?: AbortSignal) {
  const client = getAdminSupabase()
  const {
    data: { session },
    error,
  } = await client.auth.getSession()
  if (error) throw adminError(error)
  if (!session) return null
  const context = await client
    .rpc('admin_context')
    .abortSignal(requestSignal(signal))
  if (context.error) throw adminError(context.error)
  const parsed = parseAdminResponse(contextSchema, context.data)
  let factorId: string | null = null
  if (parsed.active && !parsed.aal2) {
    const factors = await client.auth.mfa.listFactors()
    if (factors.error) throw adminError(factors.error)
    factorId =
      factors.data.totp.find((factor) => factor.status === 'verified')?.id ??
      null
  }
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    ...parsed,
    factorId,
  }
}

export function subscribeAuth(listener: (userId: string | null) => void) {
  const { data } = getAdminSupabase().auth.onAuthStateChange(
    (_event, session) => listener(session?.user.id ?? null),
  )
  return () => data.subscription.unsubscribe()
}

export async function signIn(email: string, password: string) {
  const { error } = await getAdminSupabase().auth.signInWithPassword({
    email,
    password,
  })
  if (error)
    throw new Error(
      'No pudimos iniciar sesión. Revisá tus datos o esperá unos minutos antes de volver a intentar.',
    )
}
export async function signOut(others = false) {
  const { error } = await getAdminSupabase().auth.signOut({
    scope: others ? 'others' : 'global',
  })
  if (error) throw adminError(error)
}
export async function recoverPassword(email: string) {
  const { error } = await getAdminSupabase().auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin/establecer-clave`,
  })
  if (error)
    throw new Error(
      'No se pudo solicitar el correo. Esperá unos minutos e intentá nuevamente.',
    )
}
export async function updatePassword(password: string) {
  if (password.length < 12 || password.length > 128)
    throw new Error('Usá una contraseña de entre 12 y 128 caracteres.')
  const { error } = await getAdminSupabase().auth.updateUser({ password })
  if (error)
    throw new Error(
      'No se pudo cambiar la contraseña. Verificá que el enlace o la sesión sigan vigentes y que la contraseña sea nueva.',
    )
}
export async function updateEmail(email: string) {
  const parsed = z.email().max(254).safeParse(email.trim())
  if (!parsed.success) throw new Error('Ingresá un correo electrónico válido.')
  const session = await getAdminSession()
  if (!session?.active || !session.aal2)
    throw new Error(
      'Verificá tu sesión con segundo factor antes de cambiar el correo.',
    )
  if (session.email.toLowerCase() === parsed.data.toLowerCase())
    throw new Error('Ingresá un correo diferente al actual.')
  const { error } = await getAdminSupabase().auth.updateUser(
    { email: parsed.data },
    { emailRedirectTo: `${window.location.origin}/admin/cuenta` },
  )
  if (error)
    throw new Error(
      'No se pudo solicitar el cambio de correo. Revisá la dirección e intentá nuevamente en unos minutos.',
    )
}
export async function enrollFactor() {
  const client = getAdminSupabase()
  const factors = await client.auth.mfa.listFactors()
  if (factors.error) throw adminError(factors.error)
  for (const factor of factors.data.all.filter(
    (factor) =>
      factor.status === 'unverified' &&
      factor.factor_type === 'totp' &&
      factor.friendly_name === 'Club de Pescadores',
  )) {
    const removed = await client.auth.mfa.unenroll({ factorId: factor.id })
    if (removed.error) throw adminError(removed.error)
  }
  const { data, error } = await client.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Club de Pescadores',
    issuer: 'Club de Pescadores',
  })
  if (error) throw adminError(error)
  return { id: data.id, qr: data.totp.qr_code, secret: data.totp.secret }
}
export async function verifyFactor(factorId: string, code: string) {
  if (!/^\d{6}$/.test(code))
    throw new Error('Ingresá los seis números de tu aplicación autenticadora.')
  const { error } = await getAdminSupabase().auth.mfa.challengeAndVerify({
    factorId,
    code,
  })
  if (error)
    throw new Error(
      'El código no es válido o venció. Probá con un código nuevo.',
    )
}
