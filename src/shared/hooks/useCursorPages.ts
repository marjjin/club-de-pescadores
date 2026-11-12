import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { useState } from 'react'
import type { ListPage } from '@/shared/lib/pagination'

type Options<T, Cursor> = {
  queryKey: (cursor: Cursor | null) => QueryKey
  queryFn: (
    cursor: Cursor | null,
    signal: AbortSignal,
  ) => Promise<ListPage<T, Cursor>>
  staleTime: number
  refetchInterval?: number | false
}

/** Previous/next paging over a keyset cursor, keeping the visited cursors as history. */
export function useCursorPages<T, Cursor>({
  queryKey,
  queryFn,
  staleTime,
  refetchInterval = false,
}: Options<T, Cursor>) {
  const [history, setHistory] = useState<(Cursor | null)[]>([null])
  const cursor = history.at(-1) ?? null
  const query = useQuery({
    queryKey: queryKey(cursor),
    queryFn: ({ signal }) => queryFn(cursor, signal),
    placeholderData: keepPreviousData,
    staleTime,
    refetchInterval,
  })
  return {
    query,
    hasPrevious: history.length > 1,
    canNext:
      !!query.data?.nextCursor && !query.isFetching && !query.isPlaceholderData,
    previous: () =>
      setHistory((current) =>
        current.length > 1 ? current.slice(0, -1) : current,
      ),
    next: () => {
      const nextCursor = query.data?.nextCursor
      if (!query.isPlaceholderData && nextCursor)
        setHistory((current) => [...current, nextCursor])
    },
  }
}
