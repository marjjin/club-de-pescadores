// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { productionConfig } from './config.mjs'

beforeEach(() => {
  vi.stubEnv('VITE_SITE_URL', 'https://club-de-pescadores.vercel.app')
})

it('requires a complete public configuration before allowing production builds', () => {
  expect(productionConfig()).toMatchObject({
    url: 'https://testing.example.com',
    siteUrl: 'https://club-de-pescadores.vercel.app',
  })
  vi.stubEnv('VITE_SUPABASE_URL', '')
  expect(() => productionConfig()).toThrow('VITE_SUPABASE_URL')
})

it.each([
  'http://example.com',
  'https://example.com/path',
  'https://user:password@example.com',
])('rejects invalid canonical origins: %s', (url) => {
  vi.stubEnv('VITE_SITE_URL', url)
  expect(() => productionConfig()).toThrow('VITE_SITE_URL')
})

it('rejects private credentials accidentally placed in public variables', () => {
  vi.stubEnv('VITE_SERVICE_ROLE_KEY', 'private_test_fixture')
  expect(() => productionConfig()).toThrow('VITE_SERVICE_ROLE_KEY')
})

it('accepts only a real Turnstile site key in production', () => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '0x4AAAAAAAexampleKey')
  expect(productionConfig()).toMatchObject({ turnstile: true })
  // Cloudflare's test keys always pass (or always fail) the challenge.
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '1x00000000000000000000AA')
  expect(() => productionConfig()).toThrow('VITE_TURNSTILE_SITE_KEY')
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '')
  expect(productionConfig()).toMatchObject({ turnstile: false })
})
