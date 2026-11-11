import { afterEach, expect, it, vi } from 'vitest'
import { randomUuid } from './random-id'

const v4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

afterEach(() => vi.unstubAllGlobals())

it('creates v4 UUIDs even outside a secure context', () => {
  vi.stubGlobal('isSecureContext', false)
  const ids = new Set(Array.from({ length: 50 }, randomUuid))
  expect(ids.size).toBe(50)
  for (const id of ids) expect(id).toMatch(v4)
})
