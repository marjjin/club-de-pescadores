import { queryOptions } from '@tanstack/react-query'
import { getLatestNews } from './getLatestNews'

export const newsKeys = {
  all: ['news'] as const,
  latest: (limit: number) => [...newsKeys.all, 'latest', { limit }] as const,
}

export const latestNewsOptions = (limit = 3) =>
  queryOptions({
    queryKey: newsKeys.latest(limit),
    queryFn: ({ signal }) => getLatestNews({ limit, signal }),
    staleTime: 5 * 60 * 1000,
  })
