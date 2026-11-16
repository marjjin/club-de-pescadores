import { useQuery } from '@tanstack/react-query'
import { getFacilities } from '../api/getFacilities'

export const facilitiesKey = ['facilities', 'public'] as const

/** The section changes rarely; a few minutes of cache avoids refetching on every visit. */
export function useFacilities() {
  return useQuery({
    queryKey: facilitiesKey,
    queryFn: ({ signal }) => getFacilities(signal),
    staleTime: 5 * 60_000,
    retry: false,
  })
}
