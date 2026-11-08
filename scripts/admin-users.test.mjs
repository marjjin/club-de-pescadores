// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createUserHandler } from '../supabase/functions/admin-users/handler.mjs'

const root = '10000000-0000-4000-8000-000000000010'
const invited = '10000000-0000-4000-8000-000000000012'
const role = '20000000-0000-4000-8000-000000000010'
const config = {
  url: 'https://test.example',
  siteUrl: 'https://club.example',
  publicKey: 'public-fixture',
  serviceKey: 'server-fixture',
}
const req = (
  body,
  authorization = 'Bearer user-fixture',
  origin = config.siteUrl,
) =>
  new Request('https://test.example/functions/v1/admin-users', {
    method: 'POST',
    headers: { authorization, origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
function transport({
  allowed = true,
  banOk = true,
  saveOk = true,
  limit = true,
  existing = false,
} = {}) {
  return vi.fn((url) => {
    let value = null
    let status = 200
    if (url.endsWith('/auth/v1/user')) value = { id: root }
    else if (url.endsWith('/has_permission')) value = allowed
    else if (url.endsWith('/admin_allow_invitation')) value = limit
    else if (url.endsWith('/admin_invitation_target'))
      value = { existing_id: existing ? invited : null, registered: false }
    else if (url.includes('/auth/v1/invite?')) value = { id: invited }
    else if (url.includes('/auth/v1/admin/users/')) status = banOk ? 200 : 500
    else if (url.endsWith('/admin_save_user')) status = saveOk ? 200 : 403
    return Promise.resolve(new Response(JSON.stringify(value), { status }))
  })
}
describe('administrative user function', () => {
  it('recovers interrupted invitations without creating a duplicate Auth account', async () => {
    const request = transport({ existing: true })
    const response = await createUserHandler(
      config,
      request,
    )(req({ action: 'invite', email: 'new@example.test', roles: [role] }))
    expect(await response.json()).toEqual({ ok: true })
    expect(
      request.mock.calls.some(([url]) => url.includes('/auth/v1/invite?')),
    ).toBe(false)
    expect(
      request.mock.calls.some(([url]) => url.includes('/auth/v1/recover?')),
    ).toBe(true)
  })
  it('does not use service credentials before verifying the caller and live permission', async () => {
    const request = transport({ allowed: false })
    const response = await createUserHandler(
      config,
      request,
    )(req({ action: 'invite', email: 'new@example.test', roles: [role] }))
    expect(response.status).toBe(403)
    expect(request).toHaveBeenCalledTimes(2)
    for (const [, options] of request.mock.calls)
      expect(options.headers.apikey).toBe(config.publicKey)
  })
  it('rejects missing sessions and cross-origin requests without network calls', async () => {
    const request = transport()
    expect((await createUserHandler(config, request)(req({}, ''))).status).toBe(
      401,
    )
    expect(
      (
        await createUserHandler(
          config,
          request,
        )(req({}, 'Bearer test', 'https://wrong.example'))
      ).status,
    ).toBe(403)
    expect(request).not.toHaveBeenCalled()
  })
  it('invites with a fixed redirect and assigns access under the caller JWT', async () => {
    const request = transport()
    const response = await createUserHandler(
      config,
      request,
    )(req({ action: 'invite', email: 'new@example.test', roles: [role] }))
    expect(await response.json()).toEqual({ ok: true })
    const invitation = request.mock.calls.find(([url]) =>
      url.includes('/auth/v1/invite?'),
    )
    expect(new URL(invitation[0]).searchParams.get('redirect_to')).toBe(
      'https://club.example/admin/establecer-clave',
    )
    expect(invitation[1].headers.apikey).toBe(config.serviceKey)
    const saved = request.mock.calls.find(([url]) =>
      url.endsWith('/admin_save_user'),
    )
    expect(saved[1].headers.Authorization).toBe('Bearer user-fixture')
    expect(JSON.parse(saved[1].body)).toMatchObject({
      p_id: invited,
      p_active: true,
      p_roles: [role],
    })
  })
  it('enforces the server invitation limit before sending email', async () => {
    const request = transport({ limit: false })
    const response = await createUserHandler(
      config,
      request,
    )(req({ action: 'invite', email: 'new@example.test', roles: [role] }))
    expect(response.status).toBe(429)
    expect(
      request.mock.calls.some(([url]) => url.includes('/auth/v1/invite?')),
    ).toBe(false)
  })
  it('revokes database access before synchronizing Auth and reports partial Auth failure', async () => {
    const request = transport({ banOk: false })
    const response = await createUserHandler(
      config,
      request,
    )(
      req({
        action: 'update',
        id: invited,
        roles: [role],
        active: false,
        version: '2026-11-08T00:00:00Z',
      }),
    )
    expect(await response.json()).toMatchObject({
      ok: true,
      warning: expect.stringContaining('base de datos'),
    })
    const urls = request.mock.calls.map(([url]) => url)
    expect(
      urls.findIndex((url) => url.endsWith('/admin_save_user')),
    ).toBeLessThan(
      urls.findIndex((url) => url.includes('/auth/v1/admin/users/')),
    )
  })
  it('never bans an account when the database rejects the access change', async () => {
    const request = transport({ saveOk: false })
    const response = await createUserHandler(
      config,
      request,
    )(
      req({
        action: 'update',
        id: invited,
        roles: [role],
        active: false,
        version: '2026-11-08T00:00:00Z',
      }),
    )
    expect(response.status).toBe(409)
    expect(
      request.mock.calls.some(([url]) => url.includes('/auth/v1/admin/users/')),
    ).toBe(false)
  })
  it('rejects self-access changes before invoking a mutation', async () => {
    const request = transport()
    expect(
      (
        await createUserHandler(
          config,
          request,
        )(
          req({
            action: 'update',
            id: root,
            roles: [role],
            active: false,
            version: '2026-11-08T00:00:00Z',
          }),
        )
      ).status,
    ).toBe(403)
    expect(request).toHaveBeenCalledTimes(2)
  })
})
