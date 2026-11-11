import { queryOptions } from '@tanstack/react-query'
import { getLatestPierReport } from './getLatestPierReport'

export const pierKeys = {
  all: ['pier'] as const,
  latest: () => [...pierKeys.all, 'latest'] as const,
}
export const latestPierOptions = () =>
  queryOptions({
    queryKey: pierKeys.latest(),
    queryFn: ({ signal }) => getLatestPierReport(signal),
    // Staff post a few times a day; a minute keeps it fresh without refetch storms.
    staleTime: 60_000,
  })
