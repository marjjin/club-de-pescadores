import { describe, expect, it } from 'vitest'
import { readSupabaseConfig } from './config'

const publicEnvironment = {
  VITE_SUPABASE_URL: 'https://club.example.com/',
  VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_fixture',
}

describe('Supabase configuration', () => {
  it('reads and normalizes public configuration', () => {
    expect(readSupabaseConfig(publicEnvironment)).toEqual({
      url: 'https://club.example.com',
      publishableKey: 'sb_publishable_test_fixture',
    })
  })

  it.each([
    {},
    { VITE_SUPABASE_URL: publicEnvironment.VITE_SUPABASE_URL },
    {
      VITE_SUPABASE_PUBLISHABLE_KEY:
        publicEnvironment.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
  ])('rejects missing or incomplete configuration', (environment) => {
    expect(() => readSupabaseConfig(environment)).toThrow(
      'Configurá VITE_SUPABASE_URL',
    )
  })

  it.each([
    'http://localhost:54321',
    'http://127.0.0.1:54321',
    'http://[::1]:54321',
  ])('supports local development at %s', (url) => {
    expect(
      readSupabaseConfig({ ...publicEnvironment, VITE_SUPABASE_URL: url }).url,
    ).toBe(url)
  })

  it.each([
    'invalid',
    'http://club.example.com',
    'ftp://localhost',
    'https://user:password@club.example.com',
    'https://club.example.com/?token=value',
    'https://club.example.com/#token',
  ])('rejects an invalid or unsafe project URL', (url) => {
    expect(() =>
      readSupabaseConfig({ ...publicEnvironment, VITE_SUPABASE_URL: url }),
    ).toThrow('VITE_SUPABASE_URL')
  })

  it.each([
    'sb_secret_private_fixture',
    'legacy.service_role.token',
    'sb_publishable_',
    'sb_publishable_key with spaces',
  ])(
    'rejects non-public configuration without exposing the supplied value',
    (key) => {
      try {
        readSupabaseConfig({
          ...publicEnvironment,
          VITE_SUPABASE_PUBLISHABLE_KEY: key,
        })
        expect.unreachable('Expected invalid configuration to fail')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('clave pública')
        expect((error as Error).message).not.toContain(key)
      }
    },
  )
})
