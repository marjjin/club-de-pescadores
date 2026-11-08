import { beforeEach, expect, it, vi } from 'vitest'
import { updateEmail } from './auth'

const sdk = vi.hoisted(() => ({
  session: vi.fn(),
  context: vi.fn(),
  update: vi.fn(),
  factors: vi.fn(),
}))
vi.mock('@/lib/supabase/admin-client', () => ({
  getAdminSupabase: () => ({
    auth: {
      getSession: sdk.session,
      updateUser: sdk.update,
      mfa: { listFactors: sdk.factors },
    },
    rpc: () => ({ abortSignal: sdk.context }),
  }),
}))
beforeEach(() => {
  sdk.session.mockResolvedValue({
    data: {
      session: { user: { id: 'test-user', email: 'current@example.test' } },
    },
    error: null,
  })
  sdk.context.mockResolvedValue({
    data: { active: true, general: true, aal2: true },
    error: null,
  })
  sdk.update.mockResolvedValue({ data: {}, error: null })
  sdk.factors.mockResolvedValue({ data: { totp: [] }, error: null })
})
it('requests the Auth confirmation flow with the account return URL', async () => {
  await updateEmail(' new@example.test ')
  expect(sdk.update).toHaveBeenCalledWith(
    { email: 'new@example.test' },
    { emailRedirectTo: `${window.location.origin}/admin/cuenta` },
  )
})
it.each(['not-an-email', 'CURRENT@example.test'])(
  'rejects an invalid or unchanged email: %s',
  async (value) => {
    await expect(updateEmail(value)).rejects.toThrow()
    expect(sdk.update).not.toHaveBeenCalled()
  },
)
it.each([
  { active: false, general: true, aal2: true },
  { active: true, general: true, aal2: false },
])(
  'does not request changes from an inactive or unverified session',
  async (state) => {
    sdk.context.mockResolvedValue({ data: state, error: null })
    await expect(updateEmail('new@example.test')).rejects.toThrow(
      'segundo factor',
    )
    expect(sdk.update).not.toHaveBeenCalled()
  },
)
it('does not expose raw Auth error details', async () => {
  sdk.update.mockResolvedValue({
    data: {},
    error: { message: 'private technical details' },
  })
  await expect(updateEmail('new@example.test')).rejects.toThrow(
    'No se pudo solicitar el cambio de correo',
  )
})
