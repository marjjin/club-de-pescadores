import { describe, expect, it } from 'vitest'
import { formatDayMonth, formatShortDate, getClubToday } from './dates'

describe('club calendar dates', () => {
  it('keeps the Argentine calendar day when UTC is already tomorrow', () => {
    expect(getClubToday(new Date('2026-11-09T02:59:59Z'))).toBe('2026-11-08')
    expect(getClubToday(new Date('2026-11-09T03:00:00Z'))).toBe('2026-11-09')
  })

  it('formats date-only values without shifting their day', () => {
    expect(formatShortDate('2026-11-08')).toBe('08 NOV 2026')
    expect(formatDayMonth('2028-02-29')).toEqual({ day: '29', month: 'FEB' })
  })
})
