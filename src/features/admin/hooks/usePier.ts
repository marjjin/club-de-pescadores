import { useEffect } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { riverLevelKey } from '@/features/river'
import { pierKeys } from '@/features/pier'
import { pruneClubMedia } from '../api/media'
import {
  listPierReports,
  publishPierReport,
  setPierReportPublished,
} from '../api/pier'

const PAGE = 20
const key = (userId: string) => ['admin', userId, 'pier'] as const

export function usePierReports(userId: string) {
  return useInfiniteQuery({
    queryKey: key(userId),
    queryFn: ({ pageParam, signal }) => listPierReports(pageParam, signal),
    initialPageParam: null as { created_at: string; id: string } | null,
    getNextPageParam: (page) => (page.length === PAGE ? page.at(-1) : null),
    staleTime: 30_000,
  })
}
function useRefreshPier(userId: string) {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: key(userId) }),
      client.invalidateQueries({ queryKey: riverLevelKey }),
      client.invalidateQueries({ queryKey: pierKeys.all }),
    ])
}
export function usePublishPier(userId: string) {
  const refresh = useRefreshPier(userId)
  return useMutation({ mutationFn: publishPierReport, onSuccess: refresh })
}
export function useTogglePier(userId: string) {
  const refresh = useRefreshPier(userId)
  return useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      setPierReportPublished(id, published),
    onSuccess: refresh,
  })
}

// Once per page load: detaches 30-day-old pier media and removes abandoned uploads.
let pruned = false
export function useClubMediaCleanup() {
  useEffect(() => {
    if (pruned) return
    pruned = true
    void pruneClubMedia()
  }, [])
}
