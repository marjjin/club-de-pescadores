import { useQuery } from '@tanstack/react-query'
import { getNewsItem } from '../api/getNewsItem'
import { newsKeys } from '../api/queries'

export function useNewsItem(id: string) {
  return useQuery({
    queryKey: newsKeys.detail(id),
    queryFn: ({ signal }) => getNewsItem(id, signal),
    staleTime: 60_000,
    retry: false,
  })
}
