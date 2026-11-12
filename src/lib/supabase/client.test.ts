import { expect, expectTypeOf, it, vi } from 'vitest'
import { createPublicSupabaseClient, publicStorageUrl } from './client'

const environment = {
  VITE_SUPABASE_URL: 'https://club.example.com',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_fixture',
}

it('initializes public access without network requests or untyped tables', () => {
  const fetch = vi.fn()
  vi.stubGlobal('fetch', fetch)
  const client = createPublicSupabaseClient(environment)
  expectTypeOf<typeof client.from>().parameter(0).toEqualTypeOf<never>()
  expect(typeof client.rpc).toBe('function')
  expect(fetch).not.toHaveBeenCalled()
})

it('sends the publishable key only as apikey, never as a Bearer token', async () => {
  const fetch = vi.fn(() =>
    Promise.resolve(new Response('[]', { status: 200 })),
  )
  vi.stubGlobal('fetch', fetch)
  // Untyped on purpose: this test only inspects the outgoing request.
  const client = createPublicSupabaseClient<Record<string, never>>(environment)
  await (
    client as unknown as {
      from: (t: string) => { select: (c: string) => PromiseLike<unknown> }
    }
  )
    .from('news')
    .select('id')
  const [url, init] = fetch.mock.calls[0] as unknown as [
    URL | string,
    RequestInit,
  ]
  expect(String(url)).toBe('https://club.example.com/rest/v1/news?select=id')
  const headers = new Headers(init.headers)
  expect(headers.get('apikey')).toBe('sb_publishable_test_fixture')
  expect(headers.has('authorization')).toBe(false)
})

it('builds public Storage URLs with encoded segments', () => {
  expect(publicStorageUrl('club-media', 'user/a b.webp', environment)).toBe(
    'https://club.example.com/storage/v1/object/public/club-media/user/a%20b.webp',
  )
})
