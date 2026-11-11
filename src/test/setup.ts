import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// jsdom does not calculate layout or implement scrolling.
if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = () => {}
}
if (typeof window !== 'undefined') {
  window.scrollTo = () => {}
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  // Form drafts live in localStorage; never let one test restore another's draft.
  if (typeof window !== 'undefined') window.localStorage.clear()
  vi.unstubAllEnvs()
})

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://testing.example.com')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_testing')
})
