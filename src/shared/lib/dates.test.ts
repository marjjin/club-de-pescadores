import { describe, expect, it } from 'vitest'
import {
  formatDayMonth,
  formatRelative,
  formatShortDate,
  getClubToday,
} from './dates'

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

describe('formatRelative', () => {
  const now = Date.parse('2026-11-11T15:00:00Z')
  it('describes recent instants coarsely in Spanish', () => {
    expect(formatRelative('2026-11-11T14:59:40Z', now)).toBe('recién')
    expect(formatRelative('2026-11-11T14:55:00Z', now)).toBe('hace 5 minutos')
    expect(formatRelative('2026-11-11T12:00:00Z', now)).toBe('hace 3 horas')
    expect(formatRelative('2026-11-10T15:00:00Z', now)).toBe('ayer')
  })
})
