import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getClubToday } from '@/shared/lib/dates'
import { getEventsPage } from '../api/getUpcomingEvents'
import { eventKeys } from '../api/queries'
import type { EventCursor } from '../schemas/event'

export function useEventsPage() {
  const [history, setHistory] = useState<(EventCursor | null)[]>([null])
  const cursor = history.at(-1) ?? null
  const from = getClubToday()
  const query = useQuery({
    queryKey: [...eventKeys.all, 'page', { from, cursor, limit: 12 }],
    queryFn: ({ signal }) =>
      getEventsPage({ from, cursor: cursor ?? undefined, limit: 12, signal }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
  return {
    query,
    hasPrevious: history.length > 1,
    previous: () =>
      setHistory((current) =>
        current.length > 1 ? current.slice(0, -1) : current,
      ),
    next: () => {
      const nextCursor = query.data?.nextCursor
      if (!query.isPlaceholderData && nextCursor) {
        setHistory((current) => [...current, nextCursor])
      }
    },
  }
}
