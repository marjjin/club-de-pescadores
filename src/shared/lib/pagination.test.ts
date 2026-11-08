import { describe, expect, it } from 'vitest'
import { getPageSize } from './pagination'

describe('bounded lists', () => {
  it('uses a small default and allows up to 50 items', () => {
    expect(getPageSize()).toBe(3)
    expect(getPageSize(50)).toBe(50)
  })

  it.each([0, -1, 51, 1.5, NaN, Infinity])(
    'rejects invalid limits: %s',
    (limit) => {
      expect(() => getPageSize(limit)).toThrow(RangeError)
    },
  )
})
