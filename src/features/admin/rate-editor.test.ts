import { describe, expect, it } from 'vitest'
import {
  initialRateValues,
  ratePriceLabel,
  rateVisibility,
  validateRateEditor,
} from './rate-editor'
import type { RateEditorValues } from './rate-editor'

const values: RateEditorValues = {
  ...initialRateValues(null),
  season: 'Temporada de prueba',
  period: 'Día',
  family_price_cents: '1234,50',
  individual_price_cents: '0.29',
  family_description: 'Condiciones de prueba',
  valid_from: '2030-01-01',
  valid_until: '',
}

describe('rate editor validation', () => {
  it('converts decimal pesos exactly, accepts zero and normalizes optional values', () => {
    const result = validateRateEditor({
      ...values,
      individual_price_cents: '0',
    })
    expect(result).toMatchObject({
      success: true,
      data: {
        family_price_cents: 123450,
        individual_price_cents: 0,
        discount_note: null,
        valid_until: null,
        is_published: false,
      },
    })
    expect(validateRateEditor(values)).toMatchObject({
      success: true,
      data: { individual_price_cents: 29 },
    })
  })

  it('reports ambiguous, negative, oversized and missing prices at their fields', () => {
    for (const amount of [
      '',
      '-1',
      '1.234,50',
      '1e3',
      '1.001',
      '21474836,48',
    ]) {
      const result = validateRateEditor({
        ...values,
        family_price_cents: amount,
      })
      expect(result.success).toBe(false)
      expect(result).toHaveProperty('errors.family_price_cents')
      expect(ratePriceLabel(amount)).toBe('—')
    }
    expect(ratePriceLabel('21474836,47')).not.toBe('—')
  })

  it('validates calendar dates, inclusive end dates and maximum text lengths', () => {
    expect(
      validateRateEditor({ ...values, valid_from: '2030-02-30' }).success,
    ).toBe(false)
    expect(
      validateRateEditor({ ...values, valid_until: '2029-12-31' }),
    ).toMatchObject({
      success: false,
      errors: { valid_until: 'La fecha final debe ser posterior al inicio.' },
    })
    expect(
      validateRateEditor({ ...values, valid_until: values.valid_from }).success,
    ).toBe(true)
    expect(
      validateRateEditor({ ...values, discount_note: 'a'.repeat(501) }),
    ).toMatchObject({
      success: false,
      errors: { discount_note: 'Máximo 500 caracteres.' },
    })
  })

  it('describes future, current, expired and invalid periods without shifting calendar days', () => {
    expect(rateVisibility(values, '2029-12-31').label).toBe('Vigencia futura')
    expect(
      rateVisibility({ ...values, valid_until: '2030-01-01' }, '2030-01-01')
        .label,
    ).toBe('Dentro de la vigencia')
    expect(
      rateVisibility({ ...values, valid_until: '2030-01-01' }, '2030-01-02')
        .label,
    ).toBe('Vigencia finalizada')
    expect(rateVisibility({ ...values, valid_until: '2029-01-01' }).label).toBe(
      'Revisá la vigencia',
    )
  })
})
