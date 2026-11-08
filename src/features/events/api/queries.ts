import { queryOptions } from '@tanstack/react-query'
import { getUpcomingEvents } from './getUpcomingEvents'

export const eventKeys = {
  all: ['events'] as const,
  upcoming: (from: string, limit: number) =>
    [...eventKeys.all, 'upcoming', { from, limit }] as const,
}

export const upcomingEventsOptions = (from: string, limit = 3) =>
  queryOptions({
    queryKey: eventKeys.upcoming(from, limit),
    queryFn: ({ signal }) => getUpcomingEvents({ from, limit, signal }),
    staleTime: 5 * 60 * 1000,
  })
