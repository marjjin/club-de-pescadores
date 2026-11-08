import { expect, expectTypeOf, it, vi } from 'vitest'
import { createPublicSupabaseClient } from './client'

it('initializes public access without network requests, saved sessions or untyped tables', async () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  const client = createPublicSupabaseClient({
    VITE_SUPABASE_URL: 'https://club.example.com',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_fixture',
  })
  expectTypeOf<typeof client.from>().parameter(0).toEqualTypeOf<never>()
  expect(await client.auth.getSession()).toMatchObject({
    data: { session: null },
    error: null,
  })
  expect(fetch).not.toHaveBeenCalled()
})
