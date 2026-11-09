import { beforeEach, describe, expect, it, vi } from 'vitest'
import { rateRows, mockResponse, requestUrl } from '@/test/content-api'
import { getPoolRates } from './getPoolRates'
import { getClubToday } from '@/shared/lib/dates'

beforeEach(() => mockResponse(rateRows))
describe('remote pool rates', () => {
  it('maps integer cents and published conditions without hardcoded discounts', async () => {
    const rates = await getPoolRates({ limit: 1 })
    expect(rates[0]).toMatchObject({
      familyPrice: 300000,
      individualPrice: 200000,
      season: 'Temporada de prueba',
      familyDescription: 'Grupo de prueba',
      discountNote: null,
    })
    const url = requestUrl(vi.mocked(fetch).mock.calls[0]?.[0])
    expect(url.searchParams.get('limit')).toBe('1')
    expect(url.searchParams.get('valid_from')).toBe(`lte.${getClubToday()}`)
    expect(url.searchParams.get('or')).toContain('valid_until.gte.')
    expect(url.searchParams.get('select')).not.toContain('*')
  })
  it('rejects canceled requests, invalid limits and invalid prices', async () => {
    await expect(getPoolRates({ limit: 0 })).rejects.toThrow(RangeError)
    const controller = new AbortController()
    controller.abort()
    await expect(
      getPoolRates({ signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
    mockResponse([{ ...rateRows[0], family_price_cents: -1 }])
    await expect(getPoolRates()).rejects.toThrow()
  })
})
