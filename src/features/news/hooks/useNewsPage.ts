import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { getNewsPage } from '../api/getLatestNews'
import { newsKeys } from '../api/queries'
import type { NewsCursor } from '../schemas/news'

export function useNewsPage() {
  const [history, setHistory] = useState<(NewsCursor | null)[]>([null])
  const cursor = history.at(-1) ?? null
  const query = useQuery({
    queryKey: [...newsKeys.all, 'page', { cursor, limit: 12 }],
    queryFn: ({ signal }) =>
      getNewsPage({ cursor: cursor ?? undefined, limit: 12, signal }),
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
