import { describe, expect, it } from 'vitest'
import {
  centsToField,
  fieldToCents,
  moveFee,
  toFeesDraft,
  validateFeesDraft,
} from './fee-editor'
import type { FeeDraft } from './schemas/fees'

const row = (key: string, kind: FeeDraft['kind'], price = '1.000') => ({
  key,
  id: null,
  kind,
  name: key,
  detail: '',
  icon: 'person' as const,
  price,
})

describe('price field', () => {
  it('reads prices the way people write them', () => {
    expect(fieldToCents('176.000')).toBe(17600000)
    expect(fieldToCents('176000')).toBe(17600000)
    expect(fieldToCents('$ 1.250,5')).toBe(125050)
    expect(fieldToCents('0')).toBe(0)
  })
  it('rejects ambiguous or invalid amounts', () => {
    for (const value of ['', '1.5', '17.60.00', '-5', '1,234', 'abc'])
      expect(fieldToCents(value)).toBeNull()
    expect(fieldToCents('99.999.999')).toBeNull()
  })
  it('shows stored cents with thousands separators', () => {
    expect(centsToField(17600000)).toBe('176.000')
    expect(centsToField(125050)).toBe('1.250,5')
  })
})

describe('fees draft', () => {
  it('round-trips the stored schedule', () => {
    const draft = toFeesDraft({
      valid_from: '2026-10-01',
      note: null,
      updated_at: 'v1',
      fees: [
        {
          id: '50000000-0000-4000-8000-000000000001',
          kind: 'membership',
          name: 'Social',
          detail: null,
          icon: 'person',
          price_cents: 3000000,
        },
      ],
    })
    expect(draft.month).toBe('2026-10')
    expect(draft.fees[0]?.price).toBe('30.000')
    const result = validateFeesDraft(draft)
    expect(result).toEqual({
      success: true,
      data: {
        valid_from: '2026-10-01',
        note: null,
        fees: [
          {
            id: '50000000-0000-4000-8000-000000000001',
            kind: 'membership',
            name: 'Social',
            detail: null,
            icon: 'person',
            price_cents: 3000000,
          },
        ],
      },
    })
  })
  it('reports each invalid field by row', () => {
    const result = validateFeesDraft({
      month: '',
      note: '',
      fees: [{ ...row('a', 'service', 'mucho'), name: ' ' }],
    })
    expect(result.success).toBe(false)
    if (!result.success)
      expect(Object.keys(result.errors).sort()).toEqual([
        'a.name',
        'a.price',
        'month',
      ])
  })
  it('moves a row only within its own list', () => {
    const fees = [
      row('m1', 'membership'),
      row('m2', 'membership'),
      row('s1', 'service'),
    ]
    expect(moveFee(fees, 'm2', -1).map((fee) => fee.key)).toEqual([
      'm2',
      'm1',
      's1',
    ])
    expect(moveFee(fees, 'm2', 1)).toBe(fees)
    expect(moveFee(fees, 's1', -1)).toBe(fees)
  })
})
