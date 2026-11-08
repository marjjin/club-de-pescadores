import { expect, it } from 'vitest'
import { formContent, moneyToCents } from './content-fields'
import { contentInputs } from './schemas/admin'

it('converts pesos to exact integer cents and rejects ambiguous or negative values', () => {
  expect(moneyToCents('1234,50')).toBe(123450)
  expect(moneyToCents('0.29')).toBe(29)
  for (const value of ['-1', '1.001', '1e3', '1,234.50', '', 'Infinity'])
    expect(() => moneyToCents(value)).toThrow()
})
it('validates rate dates and amount bounds before writing', () => {
  const form = new FormData()
  Object.entries({
    season: 'Prueba',
    period: 'Día',
    family_price_cents: '1.50',
    individual_price_cents: '2',
    family_description: 'Prueba',
    valid_from: '2030-02-01',
    valid_until: '2030-01-01',
  }).forEach(([key, value]) => form.set(key, value))
  expect(
    contentInputs.pool_rates.safeParse(formContent('pool_rates', form)).success,
  ).toBe(false)
  form.set('valid_until', '')
  expect(
    contentInputs.pool_rates.parse(formContent('pool_rates', form)),
  ).toMatchObject({
    family_price_cents: 150,
    valid_until: null,
    is_published: false,
  })
})
