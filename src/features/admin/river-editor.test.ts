import { describe, expect, it, vi } from 'vitest'
import {
  initialRiverValues,
  riverLocalDateToInstant,
  riverHeightToCm,
  validateRiverValues,
} from './river-editor'
import { formatRiverHeight, isRiverReadingOld } from '@/features/river'

describe('river measurements', () => {
  it('uses the same strict Argentina date conversion in validation and preview', () => {
    expect(riverLocalDateToInstant('2026-01-01T23:45')).toBe(
      '2026-01-02T02:45:00.000Z',
    )
    for (const value of [
      '',
      '2026-02-30T10:30',
      '2026-01-01',
      '2026-01-01T10:30Z',
      '2026-01-01T24:00',
    ])
      expect(riverLocalDateToInstant(value)).toBeNull()
  })
  it('converts metres exactly and accepts negative and zero readings without ambiguous separators', () => {
    expect(riverHeightToCm('2,34')).toBe(234)
    expect(riverHeightToCm('-0.29')).toBe(-29)
    expect(riverHeightToCm('0')).toBe(0)
    for (const value of ['', '1.234,50', '2,345', '1e2', '-100,01', 'Infinity'])
      expect(riverHeightToCm(value)).toBeNull()
    expect(formatRiverHeight(-29)).toBe('-0,29 m')
  })
  it('keeps the measurement date in Argentina and rejects future measurements and missing sources', () => {
    const values = {
      ...initialRiverValues(null),
      height: '2,34',
      measured_at: '2026-01-01T10:30',
      station: 'Estación de prueba',
      source: 'Fuente de prueba',
    }
    expect(validateRiverValues(values)).toMatchObject({
      success: true,
      data: {
        height_cm: 234,
        measured_at: '2026-01-01T13:30:00.000Z',
        note: null,
      },
    })
    expect(validateRiverValues({ ...values, source: '' }).success).toBe(false)
    expect(validateRiverValues(values, 'Referencia guardada')).toMatchObject({
      success: true,
      data: { note: 'Referencia guardada' },
    })
    expect(
      validateRiverValues({ ...values, measured_at: '2026-02-30T10:30' })
        .success,
    ).toBe(false)
    expect(
      validateRiverValues({ ...values, measured_at: '2999-01-01T10:30' })
        .success,
    ).toBe(false)
  })
  it('pre-fills the measurement date with the current Argentina time, not the stored one', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-11T14:05:30Z'))
    try {
      const values = initialRiverValues({
        id: 1,
        height_cm: 234,
        measured_at: '2026-11-09T01:19:00+00:00',
        station: 'Estación de prueba',
        source: 'Fuente de prueba',
        note: null,
        is_published: true,
        created_at: '2026-11-09T01:20:00+00:00',
        updated_at: '2026-11-09T01:20:00+00:00',
      })
      expect(values.measured_at).toBe('2026-11-11T11:05')
      expect(values.height).toBe('2,34')
    } finally {
      vi.useRealTimers()
    }
  })
  it('marks old readings after 24 hours without assigning safety levels', () => {
    const measured = '2026-01-01T00:00:00Z'
    expect(
      isRiverReadingOld(measured, Date.parse('2026-01-02T00:00:00Z')),
    ).toBe(false)
    expect(
      isRiverReadingOld(measured, Date.parse('2026-01-02T00:01:00Z')),
    ).toBe(true)
  })
})
