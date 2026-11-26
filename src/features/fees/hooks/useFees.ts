import { useQuery } from '@tanstack/react-query'
import { getFees } from '../api/getFees'

export const feesKey = ['fees', 'public'] as const

/** Prices change a few times a year; an hour of cache avoids refetching on every visit. */
export function useFees() {
  return useQuery({
    queryKey: feesKey,
    queryFn: ({ signal }) => getFees(signal),
    staleTime: 60 * 60_000,
  })
}
