import { queryOptions } from '@tanstack/react-query'
import { getPoolRates } from './getPoolRates'

export const poolKeys = {
  all: ['pool'] as const,
  rates: (limit: number) => [...poolKeys.all, 'rates', { limit }] as const,
}

export const poolRatesOptions = (limit = 3) =>
  queryOptions({
    queryKey: poolKeys.rates(limit),
    queryFn: ({ signal }) => getPoolRates({ limit, signal }),
    staleTime: 60 * 60 * 1000,
  })
